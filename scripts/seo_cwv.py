#!/usr/bin/env python3
"""
8/ Core Web Vitals — watches deploys, checks CWV for every page in sitemap
using PageSpeed Insights API (free, no auth needed for public URLs).
Stores baseline. Alerts on LCP/CLS regressions vs prior run.
Output: seo-reports/cwv-YYYY-MM-DD.json
Alert: pages where LCP or CLS regressed since last run.
"""
import json, sys, time, urllib.request, urllib.parse, os, random
from datetime import date, datetime
from pathlib import Path

REPORT_DIR = Path("/home/mike/nebula/seo-reports")
REPORT_DIR.mkdir(exist_ok=True)
TODAY = date.today().isoformat()
REPORT_FILE = REPORT_DIR / f"cwv-{TODAY}.json"
BASELINE_FILE = REPORT_DIR / "cwv-baseline.json"

SITE = "https://nebulacomponents.com"
SITEMAP = f"{SITE}/sitemap.xml"

# Thresholds (Google Good/Poor boundaries)
LCP_POOR = 4000   # ms
LCP_WARN = 2500   # ms
CLS_POOR = 0.25
CLS_WARN = 0.1
INP_POOR = 500    # ms
INP_WARN = 200

# Retry settings for PSI API
PSI_MAX_RETRIES = 3
PSI_BASE_BACKOFF = 5   # seconds
PSI_JITTER_MAX = 2     # seconds
PSI_INTER_CALL_DELAY = 2  # seconds between consecutive API calls

import re, urllib.request as urlreq
import urllib.error

def get_sitemap_urls(limit=30):
    try:
        with urlreq.urlopen(SITEMAP, timeout=10) as r:
            urls = re.findall(r'<loc>(https?://[^<]+)</loc>', r.read().decode())
        # Prioritize high-value pages
        priority = [u for u in urls if any(p in u for p in ["/audit", "/pricing", "/lp/", "/", "/features"])]
        rest = [u for u in urls if u not in priority]
        return (priority + rest)[:limit]
    except Exception:
        return [SITE]

def get_cwv(url, strategy="mobile"):
    """PageSpeed Insights API — free, no key required (rate limited but fine for this).
    
    NOTE: PSI requires publicly accessible URLs; localhost is not supported.
    Uses nebulacomponents.com as the public URL for all PSI checks.
    
    Retries up to PSI_MAX_RETRIES times on 429 with exponential backoff + jitter.
    On other errors, logs to stderr and returns an error dict without retrying.
    If all retries exhausted due to rate limiting, returns {'error': 'rate_limited'}.
    """
    params = urllib.parse.urlencode({"url": url, "strategy": strategy})
    api_url = f"https://www.googleapis.com/pagespeedonline/v5/runPagespeed?{params}"

    for attempt in range(PSI_MAX_RETRIES + 1):
        try:
            with urlreq.urlopen(api_url, timeout=30) as r:
                data = json.loads(r.read())

            # Lab data (Lighthouse)
            lab = data.get("lighthouseResult", {}).get("audits", {})
            lcp = lab.get("largest-contentful-paint", {}).get("numericValue", None)
            cls = lab.get("cumulative-layout-shift", {}).get("numericValue", None)
            inp = lab.get("interaction-to-next-paint", {}).get("numericValue", None)
            perf_score = data.get("lighthouseResult", {}).get("categories", {}).get("performance", {}).get("score", None)

            # Field data (CrUX)
            crux = data.get("loadingExperience", {}).get("metrics", {})
            field_lcp = crux.get("LARGEST_CONTENTFUL_PAINT_MS", {}).get("percentile", None)
            field_cls = crux.get("CUMULATIVE_LAYOUT_SHIFT_SCORE", {}).get("percentile", None)

            return {
                "lcp_ms": round(lcp) if lcp else None,
                "cls": round(cls, 3) if cls else None,
                "inp_ms": round(inp) if inp else None,
                "perf_score": round(perf_score * 100) if perf_score else None,
                "field_lcp_ms": field_lcp,
                "field_cls": round(field_cls/100, 3) if field_cls else None,
                "lcp_rating": "good" if lcp and lcp < LCP_WARN else ("needs_improvement" if lcp and lcp < LCP_POOR else "poor") if lcp else "unknown",
                "cls_rating": "good" if cls is not None and cls < CLS_WARN else ("needs_improvement" if cls is not None and cls < CLS_POOR else "poor") if cls is not None else "unknown",
            }

        except urllib.error.HTTPError as e:
            if e.code == 429:
                if attempt < PSI_MAX_RETRIES:
                    backoff = PSI_BASE_BACKOFF * (2 ** attempt) + random.uniform(0, PSI_JITTER_MAX)
                    print(f"    [PSI 429] Rate limited for {url[:60]} — retry {attempt+1}/{PSI_MAX_RETRIES} in {backoff:.1f}s", file=sys.stderr)
                    time.sleep(backoff)
                    continue
                else:
                    print(f"    [PSI 429] All retries exhausted for {url[:60]}", file=sys.stderr)
                    return {"error": "rate_limited"}
            else:
                print(f"    [PSI error] HTTP {e.code} for {url[:60]}: {e}", file=sys.stderr)
                return {"error": f"http_{e.code}"}

        except Exception as e:
            print(f"    [PSI error] {url[:60]}: {e}", file=sys.stderr)
            return {"error": str(e)}

    # Should not reach here, but defensive fallback
    return {"error": "rate_limited"}

print(f"[{datetime.now().isoformat()}] Core Web Vitals check", file=sys.stderr)

urls = get_sitemap_urls(limit=15)  # PSI rate limit: ~240/min but be polite
print(f"  Checking {len(urls)} pages", file=sys.stderr)

results = {}
for i, url in enumerate(urls):
    print(f"  PSI: {url[:70]}", file=sys.stderr)
    cwv = get_cwv(url, strategy="mobile")
    results[url] = cwv
    # 2-second delay between consecutive API calls to respect rate limits
    if i < len(urls) - 1:
        time.sleep(PSI_INTER_CALL_DELAY)

# Load baseline for regression detection
baseline = {}
if BASELINE_FILE.exists():
    try:
        baseline = json.loads(BASELINE_FILE.read_text()).get("results", {})
    except Exception:
        pass

# Detect regressions
regressions = []
for url, cur in results.items():
    prev = baseline.get(url, {})
    if not prev or "error" in cur or "error" in prev:
        continue
    # LCP regression: >500ms worse
    if cur.get("lcp_ms") and prev.get("lcp_ms"):
        delta = cur["lcp_ms"] - prev["lcp_ms"]
        if delta > 500:
            regressions.append({
                "url": url, "metric": "LCP",
                "prev": prev["lcp_ms"], "curr": cur["lcp_ms"],
                "delta": delta, "unit": "ms"
            })
    # CLS regression: >0.05 worse
    if cur.get("cls") is not None and prev.get("cls") is not None:
        delta = cur["cls"] - prev["cls"]
        if delta > 0.05:
            regressions.append({
                "url": url, "metric": "CLS",
                "prev": prev["cls"], "curr": cur["cls"],
                "delta": round(delta, 3), "unit": ""
            })

# Poor pages
poor_pages = [
    {"url": url, **cwv} for url, cwv in results.items()
    if cwv.get("lcp_rating") == "poor" or cwv.get("cls_rating") == "poor"
]

# Rate-limited pages (all retries exhausted)
rate_limited_pages = [
    url for url, cwv in results.items()
    if cwv.get("error") == "rate_limited"
]

report = {
    "generated_at": datetime.now().isoformat(),
    "pages_checked": len(results),
    "regressions": regressions,
    "poor_pages": poor_pages,
    "rate_limited_pages": rate_limited_pages,
    "results": results,
}
REPORT_FILE.write_text(json.dumps(report, indent=2))
BASELINE_FILE.write_text(json.dumps({"updated_at": datetime.now().isoformat(), "results": results}, indent=2))
print(f"  Report saved: {REPORT_FILE}", file=sys.stderr)

# stdout alert
issues = []
if regressions:
    issues.append(f"🔴 {len(regressions)} CWV REGRESSION(S) detected:")
    for r in regressions:
        issues.append(f"  {r['metric']} on {r['url']}: {r['prev']}{r['unit']} → {r['curr']}{r['unit']} (+{r['delta']}{r['unit']})")

if poor_pages and not regressions:
    issues.append(f"⚠️  {len(poor_pages)} page(s) with Poor CWV scores:")
    for p in poor_pages[:5]:
        issues.append(f"  {p['url']} — LCP {p.get('lcp_ms','?')}ms ({p.get('lcp_rating','?')}), CLS {p.get('cls','?')} ({p.get('cls_rating','?')})")

if rate_limited_pages:
    issues.append(f"⏳ {len(rate_limited_pages)} page(s) rate-limited (PSI 429, all retries exhausted):")
    for u in rate_limited_pages[:5]:
        issues.append(f"  {u}")

if issues:
    print(f"**Core Web Vitals — {TODAY}**")
    for line in issues:
        print(line)
    print(f"\nFull report: {REPORT_FILE}")
