#!/usr/bin/env python3
"""
Wave 4 Lead Scraper — buying trigger targets only.
Sources: HN Algolia API, Reddit RSS (spaced with delays), IndieHackers
Deduplicates against contacted.json before any send.
Outputs leads to wave4_leads.json and sends emails via AgentMailClient.
"""
import json, time, re, os, sys
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from urllib.parse import urlencode
from xml.etree import ElementTree as ET

sys.path.insert(0, '/home/mike/nebula')

CONTACTED_FILE = '/home/mike/nebula/contacted.json'
OUTREACH_LOG   = '/home/mike/nebula/outreach_log.txt'
LEADS_FILE     = '/home/mike/nebula/wave4_leads.json'
MAX_SENDS      = 10  # daily cap per AgentMail policy
SEND_DELAY     = 8   # seconds between sends

HEADERS = {'User-Agent': 'Mozilla/5.0 (compatible; research-bot/1.0)'}

def fetch(url, timeout=15):
    try:
        req = Request(url, headers=HEADERS)
        with urlopen(req, timeout=timeout) as r:
            return r.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"  [fetch err] {url[:60]}: {e}")
        return ''

def load_contacted():
    try:
        with open(CONTACTED_FILE) as f:
            return json.load(f)
    except:
        return {}

def save_contacted(c):
    with open(CONTACTED_FILE, 'w') as f:
        json.dump(c, f, indent=2)

def append_outreach_log(entry):
    with open(OUTREACH_LOG, 'a') as f:
        f.write(f"{entry['timestamp']} | {entry['email']} | {entry['subject'][:60]} | {entry.get('url','?')[:60]} | score={entry.get('score',0)}\n")

TRIGGER_KEYWORDS = [
    'landing page not converting', 'no conversions', 'zero conversions',
    'ads not converting', 'wasting money on ads', 'burning through budget',
    'low conversion rate', 'bad conversion', 'terrible conversion',
    'roast my landing page', 'feedback on my landing page',
    'landing page feedback', 'cro help', 'conversion rate optimization',
    'spending on ads', 'google ads not working', 'facebook ads not working',
    'ad spend', 'landing page sucks', 'bounce rate',
]

def score_post(title, body=''):
    text = (title + ' ' + body).lower()
    score = 0
    matched = []
    for kw in TRIGGER_KEYWORDS:
        if kw in text:
            score += 2
            matched.append(kw)
    # Extra weight for explicit pain
    if any(w in text for w in ['$', 'spend', 'budget', 'wast', 'burn']):
        score += 1
    if any(w in text for w in ['help', 'feedback', 'roast', 'advice']):
        score += 1
    return score, matched

# ─── SOURCE 1: HN Algolia ────────────────────────────────────────
def scrape_hn():
    leads = []
    seven_days_ago = int(time.time()) - (7 * 86400)
    queries = [
        'landing page conversion help',
        'ads not converting landing page',
        'roast my landing page',
        'CRO conversion rate optimization',
    ]
    seen_ids = set()
    for q in queries:
        params = urlencode({
            'query': q,
            'tags': 'ask_hn,show_hn,story',
            'numericFilters': f'created_at_i>{seven_days_ago}',
            'hitsPerPage': 30,
        })
        url = f'https://hn.algolia.com/api/v1/search?{params}'
        raw = fetch(url)
        if not raw:
            continue
        try:
            data = json.loads(raw)
        except:
            continue
        for hit in data.get('hits', []):
            hn_id = hit.get('objectID', '')
            if hn_id in seen_ids:
                continue
            seen_ids.add(hn_id)
            title = hit.get('title', '') or hit.get('story_title', '')
            author = hit.get('author', '')
            url_hit = hit.get('url', '') or f"https://news.ycombinator.com/item?id={hn_id}"
            score, matched = score_post(title)
            if score >= 2:
                leads.append({
                    'source': 'hn',
                    'title': title,
                    'author': author,
                    'url': url_hit,
                    'hn_id': hn_id,
                    'score': score,
                    'matched': matched,
                    'email': None,  # HN authors have no email — skip for direct email
                })
        time.sleep(1)
    print(f"  HN: {len([l for l in leads if l['score']>=2])} scored leads")
    return leads

# ─── SOURCE 2: Reddit RSS (spaced) ───────────────────────────────
def scrape_reddit_rss():
    leads = []
    subs = ['startups', 'Entrepreneur', 'PPC', 'SaaS', 'ecommerce']
    for sub in subs:
        url = f'https://www.reddit.com/r/{sub}/new/.rss?limit=25'
        time.sleep(4)  # respect rate limit
        raw = fetch(url)
        if not raw or '<feed' not in raw:
            print(f"  [{sub}] no RSS data")
            continue
        try:
            root = ET.fromstring(raw)
            ns = {'atom': 'http://www.w3.org/2005/Atom'}
            entries = root.findall('atom:entry', ns)
            matched_count = 0
            for entry in entries:
                title_el = entry.find('atom:title', ns)
                link_el  = entry.find('atom:link', ns)
                content_el = entry.find('atom:content', ns)
                title   = title_el.text if title_el is not None else ''
                post_url = link_el.get('href', '') if link_el is not None else ''
                body    = content_el.text if content_el is not None else ''
                score, matched = score_post(title, body[:500])
                if score >= 3:
                    matched_count += 1
                    leads.append({
                        'source': f'reddit/{sub}',
                        'title': title,
                        'url': post_url,
                        'score': score,
                        'matched': matched,
                        'email': None,
                    })
            print(f"  [{sub}] {len(entries)} posts, {matched_count} scored >=3")
        except Exception as e:
            print(f"  [{sub}] parse error: {e}")
    return leads

# ─── SOURCE 3: IndieHackers recent posts ─────────────────────────
def scrape_ih():
    """Scrape IH product pages for founders with landing page posts."""
    leads = []
    # IH doesn't have a public RSS but we can hit their API
    url = 'https://www.indiehackers.com/api/search?type=post&query=landing+page+conversion&limit=30'
    raw = fetch(url)
    if raw:
        try:
            data = json.loads(raw)
            for post in data.get('hits', []):
                title = post.get('title', '')
                author_data = post.get('author', {}) or {}
                author_email = author_data.get('email', '')
                post_url = 'https://www.indiehackers.com' + post.get('url', '')
                score, matched = score_post(title)
                if score >= 2 and author_email:
                    leads.append({
                        'source': 'indiehackers',
                        'title': title,
                        'url': post_url,
                        'score': score,
                        'matched': matched,
                        'email': author_email,
                        'author': author_data.get('username', ''),
                    })
        except:
            pass
    print(f"  IH: {len(leads)} leads with emails")
    return leads

# ─── EMAIL SENDING ────────────────────────────────────────────────
def build_email(lead):
    """Build a trigger-specific observation email. No pitch. No Stripe link."""
    domain = ''
    url = lead.get('url', '')
    if url:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        domain = parsed.netloc or url

    title_snip = lead['title'][:80]
    matched_kw = lead.get('matched', ['conversion issues'])[0] if lead.get('matched') else 'conversion issues'

    subject = f"Noticed your post about {matched_kw} — quick observation"

    body = f"""Hey,

I came across your post: "{title_snip}"

I run free landing page audits — I look at CTA clarity, above-the-fold message match, and conversion friction. Takes me about 60 minutes and I send findings the same day.

If your current page isn't converting, I can usually spot the top 1-2 friction points pretty quickly.

Would it be useful? If yes, just reply with your landing page URL and I'll get it done.

— Nebula Audit Agent
nebulacomponents.shop"""

    return subject, body

def send_wave4(leads, contacted):
    from agentmail_client import AgentMailClient
    am = AgentMailClient()

    sent = 0
    for lead in leads:
        if sent >= MAX_SENDS:
            print(f"  Daily cap ({MAX_SENDS}) reached — stopping")
            break

        email = lead.get('email')
        if not email:
            continue  # Reddit/HN leads have no email — skip for now

        if email in contacted:
            print(f"  DEDUP skip: {email}")
            continue

        subject, body = build_email(lead)
        try:
            result = am.send(
                to=[email],
                subject=subject,
                text=body,
            )
            thread_id = result.get('thread_id', '') if isinstance(result, dict) else ''
            ts = time.strftime('%Y-%m-%dT%H:%M:%SZ')
            contacted[email] = {
                'email': email, 'thread_id': thread_id,
                'subject': subject, 'sent_at': ts,
                'labels': ['wave4-outreach'],
                'replied': False, 'classification': 'cold',
                'source': lead['source'], 'trigger': lead.get('matched', []),
                'score': lead['score'],
            }
            append_outreach_log({
                'timestamp': ts, 'email': email,
                'subject': subject, 'url': lead.get('url', ''),
                'score': lead['score'], 'source': lead['source'],
            })
            print(f"  ✅ SENT → {email} | score={lead['score']} | {subject[:50]}")
            sent += 1
            time.sleep(SEND_DELAY)
        except Exception as e:
            print(f"  ❌ SEND FAIL → {email}: {e}")

    return sent

def main():
    print("=== Wave 4 Lead Scraper ===")
    contacted = load_contacted()
    print(f"Already contacted: {len(contacted)} leads")

    print("\n[1] HN Algolia...")
    hn_leads = scrape_hn()

    print("\n[2] Reddit RSS (slow, spaced)...")
    reddit_leads = scrape_reddit_rss()

    print("\n[3] IndieHackers...")
    ih_leads = scrape_ih()

    all_leads = hn_leads + reddit_leads + ih_leads
    # Sort by score descending
    all_leads.sort(key=lambda x: x['score'], reverse=True)

    # Save for inspection
    with open(LEADS_FILE, 'w') as f:
        json.dump(all_leads, f, indent=2)

    total = len(all_leads)
    with_email = [l for l in all_leads if l.get('email')]
    print(f"\nTotal scored leads: {total}")
    print(f"Leads with email addresses: {len(with_email)}")
    print(f"Top leads:")
    for l in all_leads[:10]:
        print(f"  score={l['score']} | {l['source']} | {l['title'][:60]}")

    if not with_email:
        print("\n⚠️  No email addresses found in this scrape batch.")
        print("Reddit/HN leads without email stay in autonomous DM/API queue; no human extraction path.")
        print("Leads saved to wave4_leads.json for autonomous queue processing.")
        return

    print(f"\n[4] Sending to {len(with_email)} leads (cap={MAX_SENDS})...")
    sent = send_wave4(with_email, contacted)
    save_contacted(contacted)

    print(f"\n=== Wave 4 Complete ===")
    print(f"Sent: {sent} emails")
    print(f"Total contacted: {len(contacted)}")

if __name__ == '__main__':
    main()
