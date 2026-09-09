#!/usr/bin/env python3
"""Full traffic-type + referrer + geo breakdown from cloudflared access logs.

Classifies every request into: browser (human), search crawler, AI crawler,
SEO tool, script/agent, MCP client, and unknown. Extracts referrer domains and
country (Cf-Ipcountry) for browser traffic. Server-side ground truth, not
consent-gated.

Usage: python3 scripts/traffic_breakdown.py [--hours N] [--json]
"""
import json
import re
import sys
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlparse

LOG_DIR = Path("/home/mike/nebula/logs/cloudflared")
TARGET_HOST = "nebulacomponents.com"

# Ordered classification: first match wins. More specific before generic.
SEARCH_CRAWLERS = [
    (r'Googlebot(?:-Image)?', 'Googlebot'),
    (r'GoogleOther', 'GoogleOther'),
    (r'AdsBot-Google', 'AdsBot-Google'),
    (r'bingbot', 'Bingbot'),
    (r'DuckDuckBot', 'DuckDuckBot'),
    (r'YandexBot', 'YandexBot'),
    (r'Baiduspider', 'Baidu'),
    (r'Applebot', 'Applebot'),
    (r'msnbot|BingPreview', 'Bing-Other'),
]

AI_CRAWLERS = [
    (r'GPTBot', 'GPTBot'),
    (r'ClaudeBot|anthropic-ai|Claude-SearchBot', 'ClaudeBot'),
    (r'PerplexityBot|Perplexity-User', 'PerplexityBot'),
    (r'OAI-SearchBot|ChatGPT-User', 'OpenAI'),
]

SEO_TOOLS = [
    (r'Semrush|SemrushBot', 'Semrush'),
    (r'Ahrefs|AhrefsBot', 'Ahrefs'),
    (r'DataForSEO', 'DataForSEO'),
    (r'Majestic|MJ12bot', 'Majestic'),
    (r'Screaming Frog', 'ScreamingFrog'),
]

SCRIPT_AGENTS = [
    (r'curl/', 'curl'),
    (r'python-requests|Python/', 'python-requests'),
    (r'Go-http-client|node-fetch|axios|okhttp|Java/', 'http-client'),
    (r'Wget|Postman|insomnia|libwww', 'http-client'),
    (r'NebulaSiteAudit|NebulaSEOBot|NebulaSEO', 'Nebula-internal'),
]

MCP_CLIENTS = [
    (r'Mcp-Session-Id', 'mcp-client'),  # matched on header presence, not UA
]


def classify(ua, headers):
    """Return (category, label)."""
    # MCP clients: detected by header, not UA
    if 'Mcp-Session-Id' in headers or 'Mcp-Protocol-Version' in headers:
        return 'mcp', 'mcp-client'
    if not ua:
        return 'unknown', 'unknown'
    for pat, name in SEARCH_CRAWLERS:
        if re.search(pat, ua, re.I):
            return 'search-crawler', name
    for pat, name in AI_CRAWLERS:
        if re.search(pat, ua, re.I):
            return 'ai-crawler', name
    for pat, name in SEO_TOOLS:
        if re.search(pat, ua, re.I):
            return 'seo-tool', name
    for pat, name in SCRIPT_AGENTS:
        if re.search(pat, ua, re.I):
            return 'script', name
    if re.search(r'Mozilla', ua):
        return 'browser', 'browser'
    return 'unknown', 'unknown'


def parse_logs(since_ts):
    records = []
    for lp in sorted(LOG_DIR.glob("cloudflared*.log*")):
        try:
            lines = open(lp, encoding='utf-8', errors='replace').readlines()
        except Exception:
            continue
        i = 0
        while i < len(lines):
            try:
                d = json.loads(lines[i].strip())
            except Exception:
                i += 1
                continue
            if (d.get('level') == 'debug' and d.get('event') == 1
                    and 'path' in d and 'host' in d and 'headers' in d):
                host = d.get('host', '')
                if TARGET_HOST not in host:
                    i += 1
                    continue
                try:
                    t = datetime.fromisoformat(d.get('time', '').replace('Z', '+00:00'))
                except Exception:
                    i += 1
                    continue
                if t < since_ts:
                    i += 1
                    continue
                hdrs = d.get('headers', {})
                ua = ''
                for k, v in hdrs.items():
                    if k.lower() == 'user-agent':
                        ua = v[0] if isinstance(v, list) else str(v)
                        break
                path = d.get('path', '')
                clean = path.split('?')[0].rstrip('/') or '/'
                if re.search(r'\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|map|json|webp|avif)$', clean, re.I):
                    i += 1
                    continue
                if clean.startswith('/_next/'):
                    i += 1
                    continue
                # referrer
                referer = ''
                for k, v in hdrs.items():
                    if k.lower() == 'referer':
                        referer = v[0] if isinstance(v, list) else str(v)
                        break
                # country
                country = ''
                for k, v in hdrs.items():
                    if k.lower() == 'cf-ipcountry':
                        country = v[0] if isinstance(v, list) else str(v)
                        break
                # ip
                ip = ''
                for k, v in hdrs.items():
                    if k.lower() == 'cf-connecting-ip':
                        ip = v[0] if isinstance(v, list) else str(v)
                        break
                cat, label = classify(ua, hdrs)
                records.append({
                    'time': t, 'path': clean, 'category': cat, 'label': label,
                    'referer': referer, 'country': country, 'ip': ip,
                })
            i += 1
    return records


def referer_domain(ref):
    if not ref:
        return None
    try:
        host = urlparse(ref).netloc
        return host or None
    except Exception:
        return None


def main():
    hours = 24
    as_json = False
    args = sys.argv[1:]
    for i, a in enumerate(args):
        if a == '--hours' and i + 1 < len(args):
            hours = int(args[i + 1])
        elif a == '--json':
            as_json = True

    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    records = parse_logs(since)

    # category counts
    cat_counts = defaultdict(int)
    label_counts = defaultdict(int)
    for r in records:
        cat_counts[r['category']] += 1
        label_counts[r['label']] += 1

    # browser-only: referrer + geo + unique IPs
    browsers = [r for r in records if r['category'] == 'browser']
    ref_counts = defaultdict(int)
    country_counts = defaultdict(int)
    browser_ips = set()
    for r in browsers:
        d = referer_domain(r['referer'])
        if d:
            ref_counts[d] += 1
        if r['country']:
            country_counts[r['country']] += 1
        if r['ip']:
            browser_ips.add(r['ip'])

    out = {
        "window_hours": hours,
        "since": since.isoformat(),
        "total_page_requests": len(records),
        "by_category": dict(sorted(cat_counts.items(), key=lambda x: -x[1])),
        "by_label": dict(sorted(label_counts.items(), key=lambda x: -x[1])),
        "browser_unique_ips": len(browser_ips),
        "browser_referrer_domains": dict(sorted(ref_counts.items(), key=lambda x: -x[1])[:20]),
        "browser_countries": dict(sorted(country_counts.items(), key=lambda x: -x[1])[:20]),
    }

    if as_json:
        print(json.dumps(out, indent=2))
        return

    print(f"Traffic breakdown: last {hours}h (server-side ground truth)")
    print(f"  Total page requests: {out['total_page_requests']}")
    print()
    print("By category:")
    for c, n in sorted(cat_counts.items(), key=lambda x: -x[1]):
        print(f"  {c:16s} {n}")
    print()
    print("By label (top 15):")
    for l, n in sorted(label_counts.items(), key=lambda x: -x[1])[:15]:
        print(f"  {l:20s} {n}")
    print()
    print(f"Browser unique IPs: {len(browser_ips)}")
    print()
    print("Browser referrer domains (top 15):")
    for d, n in sorted(ref_counts.items(), key=lambda x: -x[1])[:15]:
        print(f"  {n:4d}  {d}")
    print()
    print("Browser countries (top 15):")
    for c, n in sorted(country_counts.items(), key=lambda x: -x[1])[:15]:
        print(f"  {n:4d}  {c}")


if __name__ == "__main__":
    main()
