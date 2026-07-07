#!/usr/bin/env python3
"""
Wave 4 email extractor.
Fetches Reddit posts as JSON, extracts site URLs from post bodies,
then scrapes each site for a contact email.

Fallback chain (Illingworth "How to Find Anyone's Email Address"):
  1. Scrape /contact and /about pages for mailto links
  2. Permutation guess (first.last@domain, flast@domain, first@domain…)
     — only if domain passes MX check
  3. LinkedIn DM queue (log_linkedin_fallback) for zero-email leads
"""
import json, time, re, sys
from urllib.request import urlopen, Request
from urllib.error import HTTPError

sys.path.insert(0, '/home/mike/nebula')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0',
    'Accept': 'application/json',
}

from email_permutator import permute, mx_exists, permute_role, log_linkedin_fallback

HIGH_SIGNAL_POSTS = [
    ('https://www.reddit.com/r/smallbusiness/comments/1tywgcz/spending_3kmonth_on_google_ads_with_barely_any/.json', '$3k/mo Google Ads no ROI'),
    ('https://www.reddit.com/r/smallbusiness/comments/1m90jmb/spending_2kmonth_on_ads_but_conversions_are_flat/.json', '$2k/mo ads flat conversions'),
    ('https://www.reddit.com/r/NoCodeSaaS/comments/1qhre69/help_me_roast_my_landing_page_83k_people_saw_it/.json', '8.3k views 99% bounced'),
    ('https://www.reddit.com/r/SaaS/comments/1ns1okc/roast_my_landing_page/.json', 'roast LP SaaS push-ups app'),
    ('https://www.reddit.com/r/ShowMeYourSaaS/comments/1srv749/roast_my_landing_page_and_app/.json', 'roast LP + app solo founder'),
    ('https://www.reddit.com/r/microsaas/comments/1skewy2/roast_my_landing_page/.json', 'roast microsaas LP'),
    ('https://www.reddit.com/r/PPC/comments/1e2h5jq/roast_my_landing_page_for_lead_gen/.json', 'roast LP lead gen PPC'),
    ('https://www.reddit.com/r/UI_Design/comments/1t45phf/roast_my_landing_page/.json', 'roast LP just launched'),
    ('https://www.reddit.com/r/Google_Ads/comments/1te08ub/roast_my_landing_page_for_a_google_ads/.json', 'roast LP Google Ads electrician'),
    ('https://www.reddit.com/r/PPC/comments/1nnpe9b/looking_for_feedback_my_landing_page_is_not/.json', 'LP not converting PPC'),
    ('https://www.reddit.com/r/adwords/comments/1m37qua/google_ads_no_conversions/.json', 'Google Ads no conversions'),
    ('https://www.reddit.com/r/DigitalMarketing/comments/1uf23uf/google_ads_clicks_but_no_leads_what_am_i_doing/.json', 'clicks no leads digital marketing'),
    ('https://www.reddit.com/r/aisolobusinesses/comments/1sdiopn/roast_my_landing_page_v2_be_brutal/.json', 'roast LP v2 brutal'),
    ('https://www.reddit.com/r/SaaS/comments/1ftzu4m/roast_my_landing_page/.json', 'roast LP SaaS'),
    ('https://www.reddit.com/r/SaaS/comments/1hqc6ja/roast_my_landing_page/.json', 'roast LP SaaS Dec'),
]

URL_PATTERN = re.compile(
    r'https?://(?!(?:(?:www\.)?reddit\.com|i\.redd\.it|v\.redd\.it|preview\.redd\.it|'
    r'imgur\.com|youtube\.com|youtu\.be|twitter\.com|x\.com|linkedin\.com|t\.co|'
    r'github\.com|gist\.github))'
    r'[a-zA-Z0-9._~:/?#\[\]@!$&\'()*+,;=%-]+'
)
EMAIL_PATTERN = re.compile(r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b')

SKIP_EMAIL_PATTERNS = [
    'example', 'noreply', 'no-reply', 'test@', 'sentry', '@sentry',
    '@w3', 'schema', '@jquery', 'cloudflare', 'wix.com', 'squarespace',
    '@email.com', 'user@', 'name@', 'your@',
]

def fetch_json(url):
    try:
        req = Request(url, headers=HEADERS)
        with urlopen(req, timeout=12) as r:
            return json.loads(r.read().decode('utf-8', errors='ignore'))
    except Exception as e:
        print(f"  [json err] {str(e)[:60]}")
        return None

def fetch_html(url):
    try:
        h = {'User-Agent': HEADERS['User-Agent']}
        req = Request(url, headers=h)
        with urlopen(req, timeout=10) as r:
            return r.read().decode('utf-8', errors='ignore')
    except Exception:
        return ''

def extract_site_urls(text):
    urls = URL_PATTERN.findall(text or '')
    clean = []
    for u in urls:
        u = u.rstrip('.,)')
        parts = u.split('/')
        if len(parts) >= 3 and '.' in parts[2] and len(parts[2]) > 3:
            clean.append(u)
    return list(dict.fromkeys(clean))

def find_contact_email(site_url):
    base = site_url.rstrip('/')
    # Only try root and /contact — avoid hammering
    for page in [base, base + '/contact', base + '/about']:
        html = fetch_html(page)
        if not html:
            continue
        emails = EMAIL_PATTERN.findall(html)
        good = [e for e in emails if not any(s in e.lower() for s in SKIP_EMAIL_PATTERNS)]
        if good:
            good.sort(key=lambda x: (
                x.startswith('info@') or x.startswith('support@') or x.startswith('hello@'),
                len(x)
            ))
            return good[0]
        time.sleep(0.5)
    return None

def build_outreach_email(r):
    label = r['label']
    title = r['title'][:80]
    site = r.get('site', r.get('site_urls', [''])[0] if r.get('site_urls') else '')

    subject = f"Saw your Reddit post — quick landing page observation"
    body = f"""Hey,

Came across your post: "{title}"

I run free landing page audits. I look at above-the-fold messaging, CTA clarity, and conversion friction. ~60 minutes, same-day delivery.

If your page is getting traffic but not converting, I can usually identify the top 1-2 friction points fast.

Would it be useful? Reply with your URL and I'll get it done today.

— Mike
nebulacomponents.shop"""
    return subject, body

def main():
    results = []

    print("=== Wave 4 Email Extractor ===")
    print(f"Processing {len(HIGH_SIGNAL_POSTS)} high-signal Reddit posts...\n")

    for post_url, label in HIGH_SIGNAL_POSTS:
        print(f"→ {label}")
        time.sleep(2)
        data = fetch_json(post_url)
        if not data:
            continue
        try:
            post = data[0]['data']['children'][0]['data']
            author   = post.get('author', '')
            title    = post.get('title', '')
            selftext = post.get('selftext', '') or ''
            link_url = post.get('url', '') or ''

            full_text = f"{title} {selftext} {link_url}"
            site_urls = extract_site_urls(full_text)
            if link_url and 'reddit.com' not in link_url and link_url not in site_urls:
                site_urls.insert(0, link_url)

            print(f"  u/{author} | sites: {site_urls[:2]}")

            found_email = None
            found_site  = None
            for su in site_urls[:3]:
                email = find_contact_email(su)
                if email:
                    found_email = email
                    found_site  = su
                    print(f"  ✅ {found_email}")
                    break
                time.sleep(1)

            if not found_email:
                # Fallback 2: email permutation from author name + domain
                # Illingworth: first.last@domain, flast@domain, first@domain...
                for su in site_urls[:2]:
                    domain = re.sub(r'^https?://', '', su).split('/')[0].lstrip('www.')
                    if not mx_exists(domain):
                        print(f"  — {domain}: no MX, skip permutation")
                        continue
                    candidates = permute(author, "", domain) if author else []
                    if not candidates:
                        candidates = permute_role(domain)
                    # Use top candidate (first.last or info@ etc.)
                    found_email = candidates[0]
                    found_site  = su
                    print(f"  📬 permutation fallback: {found_email}")
                    break

            if not found_email:
                # Fallback 3: log for LinkedIn DM
                # Illingworth: "If you can't find an email, connect on LinkedIn first"
                log_linkedin_fallback({
                    "author":    author,
                    "post_url":  post_url.replace(".json", ""),
                    "domain":    site_urls[0] if site_urls else "",
                    "site_urls": site_urls[:3],
                    "title":     title,
                })
                print(f"  → LinkedIn DM queue: u/{author}")

            results.append({
                'label':     label,
                'title':     title,
                'author':    author,
                'post_url':  post_url.replace('.json', ''),
                'site_urls': site_urls[:3],
                'email':     found_email,
                'site':      found_site,
            })
        except Exception as e:
            print(f"  [parse err] {e}")

    # Save full results
    with open('/home/mike/nebula/wave4_reddit_leads.json', 'w') as f:
        json.dump(results, f, indent=2)

    with_email = [r for r in results if r['email']]
    print(f"\n=== Extraction Complete ===")
    print(f"Posts processed: {len(results)}")
    print(f"With emails:     {len(with_email)}")
    for r in with_email:
        print(f"  {r['email']:40s} | {r['label']}")

    if not with_email:
        print("\nNo direct emails extracted. Leads saved for manual outreach.")
        return

    # Now send
    print(f"\n=== Sending Wave 4 ===")
    from agentmail_client import AgentMailClient
    am = AgentMailClient()

    try:
        with open('/home/mike/nebula/contacted.json') as f:
            contacted = json.load(f)
    except:
        contacted = {}

    sent = 0
    MAX = 10
    DELAY = 8

    for r in with_email:
        if sent >= MAX:
            print(f"Cap {MAX} reached")
            break
        email = r['email']
        if email in contacted:
            print(f"  DEDUP: {email}")
            continue

        subject, body = build_outreach_email(r)
        try:
            result = am.send(to=[email], subject=subject, text=body)
            thread_id = result.get('thread_id', '') if isinstance(result, dict) else ''
            ts = __import__('datetime').datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
            contacted[email] = {
                'email': email, 'thread_id': thread_id,
                'subject': subject, 'sent_at': ts,
                'labels': ['wave4-reddit'], 'replied': False,
                'source': r['post_url'], 'trigger': [r['label']],
            }
            with open('/home/mike/nebula/outreach_log.txt', 'a') as lf:
                lf.write(f"{ts} | {email} | {subject[:60]} | {r['post_url'][:60]} | wave=4-reddit\n")
            print(f"  ✅ SENT → {email}")
            sent += 1
            time.sleep(DELAY)
        except Exception as e:
            print(f"  ❌ {email}: {e}")

    with open('/home/mike/nebula/contacted.json', 'w') as f:
        json.dump(contacted, f, indent=2)

    print(f"\nWave 4 done: {sent} sent, {len(contacted)} total contacted")

if __name__ == '__main__':
    main()
