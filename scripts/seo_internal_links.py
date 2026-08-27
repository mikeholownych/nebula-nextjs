#!/usr/bin/env python3
"""
7/ Internal links — maps every link on the site, finds money pages with nothing
pointing at them. Uses sitemap + link extraction.
Output: seo-reports/internal-links-YYYY-MM-DD.json
Alert: high-value pages with zero internal links pointing at them.
"""
import json, re, sys, time, urllib.request
from datetime import date, datetime
from pathlib import Path
from urllib.parse import urljoin, urlparse
from collections import defaultdict

REPORT_DIR = Path("/home/mike/nebula/seo-reports")
REPORT_DIR.mkdir(exist_ok=True)
TODAY = date.today().isoformat()
REPORT_FILE = REPORT_DIR / f"internal-links-{TODAY}.json"

SITE = "http://localhost:3000"  # internal fetch — bypasses Cloudflare
SITEMAP = f"{SITE}/sitemap.xml"
TIMEOUT = 10

# Pages we consider "money pages" — highest commercial value
MONEY_PAGE_PATTERNS = ["/audit", "/pricing", "/lp/", "/landing", "/features", "/solutions"]

def get_sitemap_urls():
    try:
        req_sm = urllib.request.Request(SITEMAP, headers={"User-Agent": "NebulaSEOBot/1.0 (+https://nebulacomponents.com/crawler-policy)"})
        with urllib.request.urlopen(req_sm, timeout=TIMEOUT) as r:
            return re.findall(r'<loc>(https?://[^<]+)</loc>', r.read().decode())
    except Exception:
        return []

def get_internal_links(url):
    """Return all internal links found on a page."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "NebulaSEOBot/1.0 (+https://nebulacomponents.com/crawler-policy)"})
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            html = r.read().decode(errors='replace')
        hrefs = re.findall(r'href=["\'](https?://[^"\'#\s]+|/[^"\'#\s]*)["\']', html)
        links = set()
        for h in hrefs:
            if h.startswith('/'):
                h = SITE + h
            parsed = urlparse(h)
            if parsed.netloc == urlparse(SITE).netloc:
                clean = h.split('#')[0].rstrip('/') or SITE
                if clean != url.rstrip('/'):
                    links.add(clean)
        return links
    except Exception:
        return set()

print(f"[{datetime.now().isoformat()}] Internal link audit for {SITE}", file=sys.stderr)

sitemap_urls = get_sitemap_urls()
sitemap_set = set(u.rstrip('/') for u in sitemap_urls)
print(f"  {len(sitemap_urls)} pages in sitemap", file=sys.stderr)

# link_graph[source] = set(targets)
link_graph = defaultdict(set)
# inbound[target] = count
inbound = defaultdict(int)
outbound = {}

for i, url in enumerate(sitemap_urls):
    links = get_internal_links(url)
    for link in links:
        link_norm = link.rstrip('/')
        if link_norm in sitemap_set:
            link_graph[url.rstrip('/')].add(link_norm)
            inbound[link_norm] += 1
    outbound[url.rstrip('/')] = len(links)
    if (i+1) % 20 == 0:
        print(f"  Crawled {i+1}/{len(sitemap_urls)}", file=sys.stderr)
    time.sleep(0.15)

# Find orphans (in sitemap, zero inbound internal links)
orphans = []
for url in sitemap_set:
    if url != SITE and inbound.get(url, 0) == 0:
        is_money = any(p in url for p in MONEY_PAGE_PATTERNS)
        orphans.append({"url": url, "inbound_links": 0, "is_money_page": is_money})

orphans.sort(key=lambda x: (-int(x["is_money_page"]), x["url"]))

# Pages with very few inbound links (1-2)
thin_link_pages = []
for url in sitemap_set:
    cnt = inbound.get(url, 0)
    if 1 <= cnt <= 2 and url != SITE:
        is_money = any(p in url for p in MONEY_PAGE_PATTERNS)
        thin_link_pages.append({"url": url, "inbound_links": cnt, "is_money_page": is_money})

# Most linked pages (hubs)
top_linked = sorted(
    [{"url": url, "inbound_links": cnt} for url, cnt in inbound.items()],
    key=lambda x: -x["inbound_links"]
)[:20]

report = {
    "generated_at": datetime.now().isoformat(),
    "site": SITE,
    "pages_crawled": len(sitemap_urls),
    "orphan_pages": orphans,
    "thin_link_pages": thin_link_pages,
    "top_linked_pages": top_linked,
    "summary": {
        "orphan_count": len(orphans),
        "money_page_orphans": sum(1 for o in orphans if o["is_money_page"]),
        "thin_link_count": len(thin_link_pages),
    }
}
REPORT_FILE.write_text(json.dumps(report, indent=2))
print(f"  Report saved: {REPORT_FILE}", file=sys.stderr)

# stdout alert
money_orphans = [o for o in orphans if o["is_money_page"]]
all_orphans = orphans

issues = []
if money_orphans:
    issues.append(f"🚨 {len(money_orphans)} MONEY PAGE(S) with zero internal links:")
    for p in money_orphans[:5]:
        issues.append(f"  {p['url']}")

if all_orphans and not money_orphans:
    issues.append(f"📭 {len(all_orphans)} orphan page(s) — nothing links to them:")
    for p in all_orphans[:5]:
        issues.append(f"  {p['url']}")

if issues:
    print(f"**Internal Links — {TODAY}**")
    for line in issues:
        print(line)
    print(f"\nFull report: {REPORT_FILE}")
