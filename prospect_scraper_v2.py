#!/usr/bin/env python3
"""
Prospect scraper v2 — targets founders actively asking for landing page help
Sources: IndieHackers Landing Page Feedback group, HN Show HN posts
This is the new top-of-funnel: find people who WANT what we're selling
"""
import json, time, re, os
from urllib.request import urlopen, Request
from urllib.error import URLError
from urllib.parse import urlencode

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; NebulaScraper/1.0)',
}

def fetch(url):
    try:
        req = Request(url, headers=HEADERS)
        with urlopen(req, timeout=10) as r:
            return r.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"  fetch error {url}: {e}")
        return ""

def scrape_hn_landing_page_help():
    """HN Algolia: people asking about landing pages / conversion in last 30 days"""
    thirty_days_ago = int(time.time()) - (30 * 86400)
    params = urlencode({
        'query': 'landing page conversion help feedback',
        'tags': 'ask_hn,show_hn',
        'numericFilters': f'created_at_i>{thirty_days_ago}',
        'hitsPerPage': 30,
    })
    url = f"https://hn.algolia.com/api/v1/search?{params}"
    data = json.loads(fetch(url) or '{}')
    
    results = []
    for hit in data.get('hits', []):
        author = hit.get('author', '')
        obj_id = hit.get('objectID', '')
        title = hit.get('title', '')
        url_field = hit.get('url', '')
        
        if author and obj_id:
            results.append({
                'source': 'hn',
                'author': author,
                'hn_url': f"https://news.ycombinator.com/item?id={obj_id}",
                'title': title,
                'product_url': url_field,
            })
    
    print(f"HN: found {len(results)} posts")
    return results

def scrape_ih_landing_page_group():
    """IndieHackers Landing Page Feedback group — recent posts"""
    # IH doesn't have public API, use search
    url = "https://hn.algolia.com/api/v1/search_by_date?query=site:indiehackers.com+landing+page+feedback&hitsPerPage=20"
    # Fall back to known recent posts we found via web search
    known_posts = [
        {
            'source': 'ih',
            'author': 'adam albo',
            'ih_handle': 'SuchABag',
            'product': 'Hardbook',
            'product_url': 'https://hard-book.com',
            'contact_guess': 'adam@hard-book.com',
            'notes': 'Asked for landing page roast June 23 2026',
        },
        {
            'source': 'ih',
            'author': 'ks_jpr',
            'ih_handle': 'ks_jpr',
            'product': 'SkillSips',
            'product_url': 'https://skillsips.com',
            'contact_guess': 'contact@skillsips.com',
            'notes': 'First landing page, asked for feedback June 7 2026',
        },
        {
            'source': 'ih',
            'author': 'ifhitori',
            'ih_handle': 'ifhitori',
            'product': 'QLP URL Screenshot Tool',
            'product_url': 'https://app.qlp.jp/open_urls/en/index.html',
            'contact_guess': None,  # no obvious email
            'notes': 'Zero traction on Show IH, asked for positioning help',
        },
    ]
    print(f"IH: {len(known_posts)} known warm prospects")
    return known_posts

def find_contact_email(product_url):
    """Try to find contact email from product site"""
    if not product_url:
        return None
    html = fetch(product_url)
    # Look for mailto: or common contact patterns
    emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', html)
    # Filter out noreply, support@, etc.
    for e in emails:
        if not any(x in e.lower() for x in ['noreply', 'no-reply', 'support', 'info@', 'help@']):
            return e
    # Try common patterns
    domain = re.sub(r'https?://(www\.)?', '', product_url).split('/')[0]
    return f"hello@{domain}"

if __name__ == '__main__':
    print("=== Prospect Scraper v2 ===")
    
    prospects = []
    prospects.extend(scrape_hn_landing_page_help())
    prospects.extend(scrape_ih_landing_page_group())
    
    # Try to find contact emails for prospects without them
    for p in prospects:
        if not p.get('contact_guess') and p.get('product_url'):
            p['contact_guess'] = find_contact_email(p['product_url'])
            time.sleep(0.5)
    
    # Save
    out = f'/home/mike/nebula/prospects_v2_{time.strftime("%Y%m%d_%H%M%S")}.json'
    with open(out, 'w') as f:
        json.dump(prospects, f, indent=2)
    
    print(f"\nSaved {len(prospects)} prospects to {out}")
    for p in prospects:
        print(f"  {p.get('author','?')} | {p.get('product','?')} | {p.get('contact_guess','no email')}")
