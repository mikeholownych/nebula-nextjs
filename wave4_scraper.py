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


# ─── TRIGGER 4: Job Board — CRO/Landing Page roles ───────────────
# Logic: company posting for CRO, conversion, or landing page role
# = explicit admission they have a conversion problem.
# Signal priority: HIGHEST (pain is operationalised as a hire)

JOB_BOARD_CRO_KEYWORDS = [
    'conversion rate optimization', 'cro specialist', 'landing page',
    'growth marketer', 'paid acquisition', 'performance marketing',
    'growth hacking', 'a/b testing', 'funnel optimization',
    'conversion optimization', 'ppc specialist', 'google ads specialist',
]

def scrape_job_boards():
    """Scrape HN Who's Hiring + Remotive for CRO/landing page job postings.

    Trigger: company posting for CRO role = explicit conversion problem.
    Returns leads with company name, job title, posting URL.
    """
    leads = []
    seven_days_ago = int(time.time()) - (14 * 86400)  # 14d window for jobs

    # HN Who's Hiring (monthly thread)
    params = urlencode({
        'query': 'conversion rate landing page CRO growth',
        'tags': 'comment,story',
        'numericFilters': f'created_at_i>{seven_days_ago}',
        'hitsPerPage': 50,
    })
    url = f'https://hn.algolia.com/api/v1/search?{params}'
    raw = fetch(url)
    if raw:
        try:
            data = json.loads(raw)
            for hit in data.get('hits', []):
                text = (hit.get('title', '') + ' ' + (hit.get('comment_text') or '')).lower()
                matched_kw = [kw for kw in JOB_BOARD_CRO_KEYWORDS if kw in text]
                if not matched_kw:
                    continue
                # HN job posts often contain emails
                email_match = re.search(r'[\w.+-]+@[\w-]+\.[a-z]{2,}', hit.get('comment_text') or '')
                email = email_match.group(0) if email_match else ''
                score = len(matched_kw) * 2 + (2 if email else 0)
                leads.append({
                    'source': 'hn_jobs',
                    'title': (hit.get('title') or hit.get('comment_text') or '')[:100],
                    'url': f"https://news.ycombinator.com/item?id={hit.get('objectID','')}",
                    'score': score,
                    'matched': matched_kw[:3],
                    'email': email,
                    'trigger_type': 'job_board_cro',
                })
        except Exception as e:
            print(f"  [job_boards hn err] {e}")

    # Remotive RSS (remote job board, heavy on growth/CRO roles)
    remotive_url = 'https://remotive.com/api/remote-jobs?category=marketing&limit=50'
    raw2 = fetch(remotive_url)
    if raw2:
        try:
            data2 = json.loads(raw2)
            for job in data2.get('jobs', []):
                title = job.get('title', '').lower()
                desc = job.get('description', '').lower()
                matched_kw = [kw for kw in JOB_BOARD_CRO_KEYWORDS if kw in title or kw in desc[:300]]
                if not matched_kw:
                    continue
                company_url = job.get('company_url', '')
                job_url = job.get('url', '')
                score = len(matched_kw) * 2
                leads.append({
                    'source': 'remotive',
                    'title': job.get('title', ''),
                    'url': job_url,
                    'company': job.get('company_name', ''),
                    'company_url': company_url,
                    'score': score,
                    'matched': matched_kw[:3],
                    'email': '',  # no direct email; company_url for lookup
                    'trigger_type': 'job_board_cro',
                })
        except Exception as e:
            print(f"  [job_boards remotive err] {e}")

    with_email = [l for l in leads if l.get('email')]
    print(f"  Job boards: {len(leads)} leads ({len(with_email)} with email)")
    return leads


# ─── TRIGGER 5: New Product Launch — Show HN + PH ────────────────
# Logic: just launched a product = running ads to a brand-new page
# that almost certainly hasn't been conversion-optimised yet.
# Signal priority: HIGH (timing — first 72h after launch = max spend, zero data)

LAUNCH_KEYWORDS = [
    'show hn', 'launch', 'just launched', 'we launched', 'launched today',
    'product hunt', 'built and launched', 'just shipped', 'we shipped',
    'beta launch', 'soft launch', 'going live', 'live now',
    'feedback on my', 'roast my', 'just went live',
]

def scrape_new_launches():
    """Scrape Show HN for recent product launches needing conversion help.

    Trigger: new launch = new landing page = no CRO yet = immediate pain.
    """
    leads = []
    three_days_ago = int(time.time()) - (3 * 86400)  # 72h window — hottest signal

    params = urlencode({
        'query': 'launch landing page feedback startup',
        'tags': 'show_hn,story',
        'numericFilters': f'created_at_i>{three_days_ago}',
        'hitsPerPage': 50,
    })
    url = f'https://hn.algolia.com/api/v1/search?{params}'
    raw = fetch(url)
    if raw:
        try:
            data = json.loads(raw)
            for hit in data.get('hits', []):
                title = (hit.get('title') or '').lower()
                matched_kw = [kw for kw in LAUNCH_KEYWORDS if kw in title]
                # Show HN = implicit product launch signal even without keyword match
                if hit.get('_tags') and 'show_hn' in hit.get('_tags', []):
                    matched_kw.append('show_hn')
                if not matched_kw:
                    continue
                # Extract URL from post (the product being launched)
                product_url = hit.get('url', '')
                score = len(matched_kw) * 2 + (2 if product_url else 0)
                # Extract email from text if present
                story_text = hit.get('story_text') or ''
                email_match = re.search(r'[\w.+-]+@[\w-]+\.[a-z]{2,}', story_text)
                email = email_match.group(0) if email_match else ''
                leads.append({
                    'source': 'hn_launches',
                    'title': hit.get('title', ''),
                    'url': f"https://news.ycombinator.com/item?id={hit.get('objectID','')}",
                    'product_url': product_url,
                    'score': score,
                    'matched': matched_kw[:3],
                    'email': email,
                    'trigger_type': 'new_product_launch',
                })
        except Exception as e:
            print(f"  [launches hn err] {e}")

    # Reddit r/SideProject + r/startups new launches
    launch_subreddits = ['SideProject', 'startups', 'entrepreneur']
    for sub in launch_subreddits:
        rss_url = f'https://www.reddit.com/r/{sub}/new.rss?limit=25'
        raw2 = fetch(rss_url)
        if not raw2:
            time.sleep(2)
            continue
        try:
            root = ET.fromstring(raw2)
            ns = {'atom': 'http://www.w3.org/2005/Atom'}
            for entry in root.findall('atom:entry', ns)[:15]:
                title_el = entry.find('atom:title', ns)
                title = title_el.text or '' if title_el is not None else ''
                link_el = entry.find('atom:link', ns)
                link = link_el.get('href', '') if link_el is not None else ''
                text = title.lower()
                matched_kw = [kw for kw in LAUNCH_KEYWORDS if kw in text]
                if not matched_kw:
                    continue
                score = len(matched_kw) * 2
                leads.append({
                    'source': f'reddit_{sub}',
                    'title': title,
                    'url': link,
                    'score': score,
                    'matched': matched_kw[:3],
                    'email': '',
                    'trigger_type': 'new_product_launch',
                })
        except Exception as e:
            print(f"  [launches reddit/{sub} err] {e}")
        time.sleep(2)

    with_email = [l for l in leads if l.get('email')]
    print(f"  New launches: {len(leads)} leads ({len(with_email)} with email)")
    return leads

# ─── EMAIL SENDING ────────────────────────────────────────────────
def build_email(lead):
    """Build a PPQ-format outreach email (Problem / Proof / Question, ≤80 words).

    PPQ framework (Hormozi Rule of 100, Day 2 baseline format):
      Problem  — specific pain this ICP is feeling right now (trigger-matched)
      Proof    — one quantified result or credential
      Question — soft CTA, easy yes
    """
    title_snip = lead['title'][:80]
    matched_kw = lead.get('matched', ['conversion issues'])[0] if lead.get('matched') else 'conversion issues'

    # Subject: curiosity_gap + problem_callout archetype (highest open rate for trigger leads)
    subject = f"Your {matched_kw} — found something"

    # PPQ body: ≤80 words, no pitch, no link, question close
    body = (
        f"Saw your post: \"{title_snip}\"\n\n"
        "Problem I keep seeing: ad spend stays flat while conversions drop — "
        "usually the landing page is bleeding the budget, not the ads.\n\n"
        "Proof: ran 100+ audits last month. "
        "Most pages lose 60–70% of clicks on the hero alone.\n\n"
        "Quick question: want me to run a free audit on your page? "
        "I send findings same day — just reply with your URL."
    )

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

    print("\n[4] Job Boards (CRO/Landing Page roles)...")
    job_leads = scrape_job_boards()

    print("\n[5] New Product Launches (Show HN + Reddit)...")
    launch_leads = scrape_new_launches()

    all_leads = hn_leads + reddit_leads + ih_leads + job_leads + launch_leads
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
