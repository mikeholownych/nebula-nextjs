#!/usr/bin/env python3
"""
6/ Schema — crawls each page type, validates existing structured data,
outputs missing schema per page type to seo-reports/schema-YYYY-MM-DD.json.
Uses DataForSEO on-page for content parsing + structured data detection.
Alert: pages missing recommended schema for their type.
"""
import json, os, sys, time, base64, urllib.request, re
from datetime import date, datetime
from pathlib import Path

REPORT_DIR = Path("/home/mike/nebula/seo-reports")
REPORT_DIR.mkdir(exist_ok=True)
TODAY = date.today().isoformat()
REPORT_FILE = REPORT_DIR / f"schema-{TODAY}.json"

SITE = "http://localhost:3000"  # internal fetch — bypasses Cloudflare
SITEMAP = f"{SITE}/sitemap.xml"

# Schema recommendations by page type (detected from URL/title patterns)
SCHEMA_MAP = {
    "homepage": ["WebSite", "Organization"],
    "faq": ["FAQPage"],
    "pricing": ["Product", "Offer"],
    "blog": ["BlogPosting", "Article"],
    "landing": ["Product", "Service"],
    "audit": ["Service", "HowTo"],
    "spec": ["TechArticle"],
    "signals": ["Article"],
    "case_study": ["Article"],
    "about": ["Organization", "AboutPage"],
    "contact": ["ContactPage"],
    "default": ["WebPage"],
}

def detect_page_type(url):
    path = url.replace(SITE, "").lower()
    if path in ("/", ""):
        return "homepage"
    if "/faq" in path:
        return "faq"
    if "/pricing" in path or "/plans" in path:
        return "pricing"
    if "/blog" in path or "/article" in path:
        return "blog"
    if "/lp/" in path or "/landing" in path:
        return "landing"
    if "/audit" in path:
        return "audit"
    if "/spec" in path:
        return "spec"
    if "/signals" in path:
        return "signals"
    if "/case-stud" in path:
        return "case_study"
    if "/about" in path:
        return "about"
    if "/contact" in path:
        return "contact"
    return "default"

LOGIN = os.environ.get("DATAFORSEO_LOGIN", "")
PASSWORD = os.environ.get("DATAFORSEO_PASSWORD", "")
if not LOGIN or not PASSWORD:
    env_path = os.path.expanduser("~/.hermes/.env")
    if os.path.exists(env_path):
        for line in open(env_path):
            line = line.strip()
            if line.startswith("DATAFORSEO_LOGIN="):
                LOGIN = line.split("=",1)[1].strip().strip('"').strip("'")
            elif line.startswith("DATAFORSEO_PASSWORD="):
                PASSWORD = line.split("=",1)[1].strip().strip('"').strip("'")

AUTH = base64.b64encode(f"{LOGIN}:{PASSWORD}".encode()).decode()

def get_sitemap_urls():
    try:
        req_sm2 = urllib.request.Request(SITEMAP, headers={"User-Agent": "NebulaSEOBot/1.0 (+https://nebulacomponents.com/crawler-policy)"})
        with urllib.request.urlopen(req_sm2, timeout=10) as r:
            xml = r.read().decode()
        return re.findall(r'<loc>(https?://[^<]+)</loc>', xml)
    except Exception:
        return []

def check_page_schema(url):
    """Fetch page HTML directly, extract existing schema."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "NebulaSEOBot/1.0 (+https://nebulacomponents.com/crawler-policy)"})
        with urllib.request.urlopen(req, timeout=15) as r:
            html = r.read().decode(errors='replace')
        # Extract JSON-LD blocks
        ld_blocks = re.findall(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', html, re.DOTALL)
        found_types = []
        for block in ld_blocks:
            try:
                data = json.loads(block.strip())
                if isinstance(data, list):
                    for d in data:
                        t = d.get("@type", "")
                        if isinstance(t, list):
                            found_types.extend(t)
                        elif t:
                            found_types.append(t)
                else:
                    t = data.get("@type", "")
                    if isinstance(t, list):
                        found_types.extend(t)
                    elif t:
                        found_types.append(t)
            except Exception:
                pass
        return found_types
    except Exception as e:
        return []

print(f"[{datetime.now().isoformat()}] Schema audit for {SITE}", file=sys.stderr)

sitemap_urls = get_sitemap_urls()
print(f"  {len(sitemap_urls)} pages to check", file=sys.stderr)

# Sample representative pages (avoid scanning all 163 with DFS API - expensive)
# Group by type, pick one of each to validate
seen_types = set()
pages_to_check = []
for url in sitemap_urls:
    pt = detect_page_type(url)
    if pt not in seen_types:
        pages_to_check.append(url)
        seen_types.add(pt)
    if len(pages_to_check) >= 20:
        break

results = []
missing_schema_pages = []

for url in pages_to_check:
    page_type = detect_page_type(url)
    recommended = SCHEMA_MAP.get(page_type, SCHEMA_MAP["default"])
    found = check_page_schema(url)
    missing = [s for s in recommended if s not in found]
    result = {
        "url": url,
        "page_type": page_type,
        "recommended_schema": recommended,
        "found_schema": found,
        "missing_schema": missing,
    }
    results.append(result)
    if missing:
        missing_schema_pages.append(result)
    print(f"  {page_type:15s} {url[:60]:60s} found={found} missing={missing}", file=sys.stderr)
    time.sleep(0.2)

report = {
    "generated_at": datetime.now().isoformat(),
    "site": SITE,
    "pages_checked": len(results),
    "pages_missing_schema": len(missing_schema_pages),
    "results": results,
}
REPORT_FILE.write_text(json.dumps(report, indent=2))
print(f"  Report saved: {REPORT_FILE}", file=sys.stderr)

if missing_schema_pages:
    print(f"**Schema Audit — {TODAY}**")
    print(f"{len(missing_schema_pages)} page type(s) missing recommended structured data:\n")
    for p in missing_schema_pages:
        print(f"• **{p['page_type']}** → `{p['url'][:70]}`")
        print(f"  Missing: {', '.join(p['missing_schema'])} | Found: {p['found_schema'] or 'none'}")
    print(f"\nFull report: {REPORT_FILE}")
