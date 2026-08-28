#!/usr/bin/env python3
"""
1/ Nightly site audit — broken links, redirect chains, orphan pages.
Crawls the sitemap, checks every URL, and maps orphan pages.
Output: JSON report to seo-reports/site-audit-YYYY-MM-DD.json
Alert: non-empty stdout means something needs attention.
"""
import json, re, sys, time, urllib.request, urllib.error
from datetime import date, datetime
from pathlib import Path
from urllib.parse import urljoin, urlparse

SITE = "http://localhost:3000"  # internal fetch — bypasses Cloudflare
SITEMAP = f"{SITE}/sitemap.xml"
REPORT_DIR = Path("/home/mike/nebula/seo-reports")
REPORT_DIR.mkdir(exist_ok=True)
TODAY = date.today().isoformat()
REPORT_FILE = REPORT_DIR / f"site-audit-{TODAY}.json"
TIMEOUT = 10
MAX_REDIRECTS = 5

def fetch(url, max_redirects=MAX_REDIRECTS):
    """Follow redirects manually so we can track the chain."""
    chain = [url]
    current = url
    for _ in range(max_redirects):
        try:
            req = urllib.request.Request(current, headers={"User-Agent": "NebulaSEOBot/1.0 (+https://nebulacomponents.com/crawler-policy)"})
            with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
                return {"final_url": r.geturl(), "status": r.status, "chain": chain, "error": None}
        except urllib.error.HTTPError as e:
            if e.code in (301, 302, 303, 307, 308):
                loc = e.headers.get("Location", "")
                if loc:
                    next_url = urljoin(current, loc)
                    chain.append(next_url)
                    current = next_url
                    continue
            return {"final_url": current, "status": e.code, "chain": chain, "error": str(e)}
        except Exception as e:
            return {"final_url": current, "status": 0, "chain": chain, "error": str(e)}
    return {"final_url": current, "status": 0, "chain": chain, "error": "too_many_redirects"}

def get_sitemap_urls():
    try:
        req_sm = urllib.request.Request(SITEMAP, headers={"User-Agent": "NebulaSEOBot/1.0 (+https://nebulacomponents.com/crawler-policy)"})
        with urllib.request.urlopen(req_sm, timeout=TIMEOUT) as r:
            xml = r.read().decode()
        return re.findall(r'<loc>(https?://[^<]+)</loc>', xml)
    except Exception as e:
        return []

def get_page_links(url):
    """Scrape internal links from a page."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "NebulaSEOBot/1.0 (+https://nebulacomponents.com/crawler-policy)"})
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            html = r.read().decode(errors='replace')
        hrefs = re.findall(r'href=["\'](https?://[^"\']+|/[^"\']*)["\']', html)
        internal = set()
        for h in hrefs:
            if h.startswith('/'):
                h = SITE + h
            if urlparse(h).netloc == urlparse(SITE).netloc:
                internal.add(h.split('#')[0].rstrip('/') or SITE)
        return internal
    except Exception:
        return set()

CANONICAL_SITE = "https://nebulacomponents.com"

def to_local(url: str) -> str:
    """Convert a canonical URL to its localhost equivalent for internal fetching."""
    return url.replace(CANONICAL_SITE, SITE)

print(f"[{datetime.now().isoformat()}] Starting site audit for {SITE}", file=sys.stderr)

sitemap_urls = get_sitemap_urls()
print(f"  Sitemap: {len(sitemap_urls)} URLs", file=sys.stderr)

# Check every sitemap URL
results = []
all_linked = set()

for i, url in enumerate(sitemap_urls):
    local_url = to_local(url)
    r = fetch(local_url)
    # Also collect outbound links to find orphans
    if r["status"] == 200:
        links = get_page_links(local_url)
        all_linked.update(links)
    results.append({
        "url": url,  # always report the canonical public URL
        "status": r["status"],
        "final_url": r["final_url"].replace(SITE, CANONICAL_SITE),
        "redirect_chain": [u.replace(SITE, CANONICAL_SITE) for u in r["chain"]],
        "redirect_count": len(r["chain"]) - 1,
        "error": r["error"],
    })
    if (i + 1) % 20 == 0:
        print(f"  Checked {i+1}/{len(sitemap_urls)}", file=sys.stderr)
    time.sleep(0.15)  # polite crawl

# Classify
broken = [r for r in results if r["status"] not in (200, 301, 302, 303, 307, 308) or r["error"]]
long_redirects = [r for r in results if r["redirect_count"] >= 2]

# Orphan detection: compare by path only — sitemap uses nebulacomponents.com URLs,
# get_page_links collects localhost:3000 URLs; normalise both to path for comparison.
def _path(url: str) -> str:
    p = urlparse(url).path.rstrip('/') or '/'
    return p

sitemap_paths = set(_path(u) for u in sitemap_urls)
linked_paths = set(_path(u) for u in all_linked)
# Root path '/' is never an orphan
orphans = [u for u in sitemap_urls if _path(u) not in linked_paths and _path(u) != '/']

report = {
    "generated_at": datetime.now().isoformat(),
    "site": SITE,
    "total_pages": len(results),
    "broken": broken,
    "redirect_chains": long_redirects,
    "orphan_pages": orphans,
    "summary": {
        "broken_count": len(broken),
        "redirect_chain_count": len(long_redirects),
        "orphan_count": len(orphans),
    }
}

REPORT_FILE.write_text(json.dumps(report, indent=2))
print(f"  Report saved: {REPORT_FILE}", file=sys.stderr)

# stdout = alert payload (silent if all clean)
issues = []
if broken:
    issues.append(f"🔴 {len(broken)} broken URL(s):")
    for b in broken[:5]:
        issues.append(f"  {b['url']} → {b['status']}")
    if len(broken) > 5:
        issues.append(f"  ... and {len(broken)-5} more")

if long_redirects:
    issues.append(f"⚠️  {len(long_redirects)} redirect chain(s) (≥2 hops):")
    for r in long_redirects[:3]:
        issues.append(f"  {r['url']} → {r['redirect_count']} hops")

if orphans:
    issues.append(f"📭 {len(orphans)} orphan page(s) (in sitemap, nothing linking to them):")
    for o in orphans[:5]:
        issues.append(f"  {o}")

if issues:
    print(f"**Site Audit Report — {TODAY}**")
    for line in issues:
        print(line)
    print(f"\nFull report: {REPORT_FILE}")
