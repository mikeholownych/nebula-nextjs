#!/usr/bin/env python3
"""
Wave 4 Lead Finder — uses Hermes web_search via CLI subprocess to find buying-trigger leads.
Searches for founders posting about ad spend + no conversions across Reddit, IH, HN.
Extracts emails from post URLs where available.
"""
import json, time, os, sys, re, subprocess

sys.path.insert(0, '/home/mike/nebula')

CONTACTED_FILE = '/home/mike/nebula/contacted.json'
OUTREACH_LOG   = '/home/mike/nebula/outreach_log.txt'
LEADS_FILE     = '/home/mike/nebula/wave4_leads_found.json'
OUTREACH_LOG   = '/home/mike/nebula/outreach_log.txt'
MAX_SENDS      = 10
SEND_DELAY     = 8

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
        f.write(f"{entry['timestamp']} | {entry['email']} | {entry['subject'][:60]} | {entry.get('url','?')[:60]} | score={entry.get('score',0)} wave=4\n")

SEARCH_QUERIES = [
    'site:reddit.com "landing page" "no conversions" "google ads" 2025 OR 2026',
    'site:reddit.com "spending on ads" "not converting" landing page',
    'site:reddit.com "roast my landing page" startups OR entrepreneur',
    'site:reddit.com "zero conversions" "ad spend" 2026',
    'site:news.ycombinator.com "landing page" "conversion rate" "help" 2026',
    'site:indiehackers.com "landing page" "no conversions" feedback',
    'site:reddit.com/r/startups "my landing page" "not converting"',
    'site:reddit.com/r/PPC "landing page" "low conversion" help',
]

def extract_email_from_text(text):
    """Extract email addresses from text."""
    pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(pattern, text)
    # Filter out common non-leads
    skip = ['noreply', 'example', 'test@', 'support@reddit', 'admin@', 'info@reddit']
    return [e for e in emails if not any(s in e.lower() for s in skip)]

def score_content(text):
    TRIGGER_KEYWORDS = [
        'landing page not converting', 'no conversions', 'zero conversions',
        'ads not converting', 'wasting money on ads', 'burning through budget',
        'low conversion rate', 'bad conversion rate', 'terrible conversion',
        'roast my landing page', 'feedback on my landing page',
        'landing page feedback', 'cro help', 'conversion rate optimization',
        'spending on ads', 'google ads not working', 'facebook ads not working',
        'ad spend', 'landing page sucks', 'bounce rate high',
        'no signups', 'no sales', 'nobody converting',
    ]
    text_lower = text.lower()
    score = 0
    matched = []
    for kw in TRIGGER_KEYWORDS:
        if kw in text_lower:
            score += 2
            matched.append(kw)
    if any(w in text_lower for w in ['$500', '$1000', '$2000', 'per month', '/mo', 'budget']):
        score += 1
    return score, matched

def fetch_url(url, timeout=10):
    from urllib.request import urlopen, Request
    from urllib.error import URLError
    try:
        req = Request(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; research-bot/1.0)'})
        with urlopen(req, timeout=timeout) as r:
            return r.read().decode('utf-8', errors='ignore')
    except Exception as e:
        return ''

def search_for_leads():
    """Use curl to hit DuckDuckGo HTML search for each query."""
    all_leads = []
    seen_urls = set()
    
    for q in SEARCH_QUERIES:
        time.sleep(3)
        # Use DuckDuckGo HTML (no JS required)
        import urllib.parse
        encoded = urllib.parse.quote_plus(q)
        url = f'https://html.duckduckgo.com/html/?q={encoded}'
        
        html = fetch_url(url, timeout=15)
        if not html:
            print(f"  [ddg] no response for: {q[:50]}")
            continue
        
        # Extract result links
        link_pattern = r'href="(https?://(?:www\.reddit\.com|news\.ycombinator\.com|www\.indiehackers\.com)[^"]+)"'
        links = re.findall(link_pattern, html)
        
        # Also extract titles/snippets
        title_pattern = r'<a class="result__a"[^>]*>([^<]+)</a>'
        titles = re.findall(title_pattern, html)
        
        snippet_pattern = r'<a class="result__snippet"[^>]*>([^<]+)</a>'
        snippets = re.findall(snippet_pattern, html)
        
        matched_links = 0
        for i, link in enumerate(links):
            if link in seen_urls:
                continue
            # Decode URL entities
            link = link.replace('&amp;', '&')
            seen_urls.add(link)
            
            title = titles[i] if i < len(titles) else ''
            snippet = snippets[i] if i < len(snippets) else ''
            combined = title + ' ' + snippet
            score, matched_kw = score_content(combined)
            
            if score >= 2:
                matched_links += 1
                all_leads.append({
                    'url': link,
                    'title': title[:120],
                    'snippet': snippet[:200],
                    'score': score,
                    'matched': matched_kw,
                    'email': None,
                    'source': 'web_search',
                    'query': q[:60],
                })
        
        print(f"  [ddg] query {SEARCH_QUERIES.index(q)+1}/{len(SEARCH_QUERIES)}: {len(links)} links, {matched_links} scored")
    
    all_leads.sort(key=lambda x: x['score'], reverse=True)
    return all_leads

def try_extract_email_from_post(lead):
    """For Reddit posts, try to find the OP's username and a contact email."""
    url = lead.get('url', '')
    if 'reddit.com' not in url:
        return None
    
    # Extract username from Reddit post
    # Pattern: reddit.com/r/sub/comments/id/title/
    # Author is in the HTML
    html = fetch_url(url + '.json?limit=1', timeout=10)
    if not html:
        return None
    try:
        data = json.loads(html)
        author = data[0]['data']['children'][0]['data'].get('author', '')
        post_body = data[0]['data']['children'][0]['data'].get('selftext', '')
        
        # Check if author put email in post body
        emails = extract_email_from_text(post_body)
        if emails:
            return emails[0], author
        return None, author
    except:
        return None, ''

def build_email(lead):
    title_snip = lead.get('title', 'your post')[:80]
    matched_kw = lead.get('matched', ['conversion issues'])[0] if lead.get('matched') else 'conversion issues'
    url = lead.get('url', '')
    
    subject = f"Saw your post about {matched_kw[:40]} — quick observation"
    body = f"""Hey,

I came across your post: "{title_snip}"

I do free landing page audits — I look at above-the-fold messaging, CTA clarity, and conversion friction. Usually takes me ~60 min, I send findings same day.

If your page is getting traffic but not converting, I can usually spot the top 1-2 issues.

Would it be useful? Just reply with your landing page URL.

— Mike
nebulacomponents.shop"""
    return subject, body

def main():
    print("=== Wave 4 Lead Finder (Web Search) ===")
    contacted = load_contacted()
    print(f"Already contacted: {len(contacted)}")
    
    print("\n[1] Searching for buying-trigger posts...")
    leads = search_for_leads()
    
    print(f"\nTotal leads found: {len(leads)}")
    with_email = [l for l in leads if l.get('email')]
    
    # Try to get emails from top Reddit posts
    print(f"\n[2] Attempting email extraction from top {min(20, len(leads))} Reddit leads...")
    for lead in leads[:20]:
        if 'reddit.com' in lead.get('url', ''):
            result = try_extract_email_from_post(lead)
            if result and result[0]:
                email, author = result
                lead['email'] = email
                lead['author'] = author
                print(f"  Found email: {email} (u/{author})")
            time.sleep(2)
    
    with_email = [l for l in leads if l.get('email')]
    
    # Save all leads
    with open(LEADS_FILE, 'w') as f:
        json.dump(leads, f, indent=2)
    print(f"\nSaved {len(leads)} leads to wave4_leads_found.json")
    print(f"Leads with extractable emails: {len(with_email)}")
    
    print("\nTop 10 leads by score:")
    for l in leads[:10]:
        print(f"  score={l['score']} | {l.get('email','no-email')} | {l['title'][:60]}")
    
    if not with_email:
        print("\n⚠️  No direct emails found. Reddit/HN leads require contact form or comment reply.")
        print("ACTION NEEDED: Review wave4_leads_found.json and manually reach out via:")
        print("  1. Reddit DM to post authors")
        print("  2. Contact forms on their linked sites")
        print("  3. LinkedIn/Twitter from profile")
        return
    
    print(f"\n[3] Sending to {len(with_email)} leads with emails (cap={MAX_SENDS})...")
    from agentmail_client import AgentMailClient
    am = AgentMailClient()
    sent = 0
    
    for lead in with_email:
        if sent >= MAX_SENDS:
            print(f"  Daily cap reached ({MAX_SENDS})")
            break
        email = lead['email']
        if email in contacted:
            print(f"  DEDUP: {email}")
            continue
        subject, body = build_email(lead)
        try:
            result = am.send(to=[email], subject=subject, text=body)
            thread_id = result.get('thread_id', '') if isinstance(result, dict) else ''
            ts = time.strftime('%Y-%m-%dT%H:%M:%SZ')
            contacted[email] = {
                'email': email, 'thread_id': thread_id,
                'subject': subject, 'sent_at': ts,
                'labels': ['wave4'], 'replied': False,
                'source': lead['source'], 'score': lead['score'],
            }
            append_outreach_log({'timestamp': ts, 'email': email, 'subject': subject,
                                  'url': lead.get('url',''), 'score': lead['score']})
            print(f"  ✅ SENT → {email}")
            sent += 1
            time.sleep(SEND_DELAY)
        except Exception as e:
            print(f"  ❌ {email}: {e}")
    
    save_contacted(contacted)
    print(f"\n=== Done: {sent} emails sent, {len(contacted)} total contacted ===")

if __name__ == '__main__':
    main()
