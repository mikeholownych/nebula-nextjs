#!/usr/bin/env python3
"""
3/ Log file analysis — parses cloudflared debug logs, extracts every request
to nebulacomponents.com, maps bot vs human traffic, and compares Googlebot
paths against the sitemap to find where it actually goes vs where we expect.

Reads all cloudflared.log* files in /home/mike/nebula/logs/cloudflared/,
maintains a watermark so each run only processes new lines.
Output: seo-reports/log-analysis-YYYY-MM-DD.json
Alert: stdout = summary of bot crawl coverage vs sitemap gaps.
"""
import json, re, sys, os, gzip
from datetime import date, datetime
from pathlib import Path
from collections import defaultdict
from urllib.parse import urlparse

REPORT_DIR = Path("/home/mike/nebula/seo-reports")
REPORT_DIR.mkdir(exist_ok=True)
LOG_DIR = Path("/home/mike/nebula/logs/cloudflared")
TODAY = date.today().isoformat()
REPORT_FILE = REPORT_DIR / f"log-analysis-{TODAY}.json"
WATERMARK_FILE = REPORT_DIR / "log-analysis-watermark.json"
SITEMAP_CACHE = REPORT_DIR / "sitemap-cache.json"

TARGET_HOST = "nebulacomponents.com"

# Bot UA patterns → canonical bot name
BOT_PATTERNS = [
    (r'Googlebot(?:-Image)?', 'Googlebot'),
    (r'GoogleOther', 'GoogleOther'),
    (r'AdsBot-Google', 'AdsBot-Google'),
    (r'bingbot', 'Bingbot'),
    (r'DuckDuckBot', 'DuckDuckBot'),
    (r'YandexBot', 'YandexBot'),
    (r'Baiduspider', 'Baidu'),
    (r'Applebot', 'Applebot'),
    (r'GPTBot', 'GPTBot'),
    (r'ClaudeBot|anthropic-ai|Claude-SearchBot', 'ClaudeBot'),
    (r'PerplexityBot|Perplexity-User', 'PerplexityBot'),
    (r'OAI-SearchBot|ChatGPT-User', 'OpenAI'),
    (r'Semrush|SemrushBot', 'Semrush'),
    (r'Ahrefs|AhrefsBot', 'Ahrefs'),
    (r'DataForSEO', 'DataForSEO'),
    (r'msnbot|BingPreview', 'Bing-Other'),
    (r'facebookexternalhit|FacebookBot', 'Facebook'),
    (r'Twitterbot|Twitter', 'Twitter'),
    (r'LinkedInBot', 'LinkedIn'),
    (r'python-requests|Python/', 'Python-script'),
    (r'curl/', 'curl'),
    (r'NebulaSiteAudit|NebulaSEOBot|NebulaSEO', 'Nebula-internal'),
]

def classify_ua(ua: str) -> str:
    if not ua:
        return 'unknown'
    for pattern, name in BOT_PATTERNS:
        if re.search(pattern, ua, re.I):
            return name
    return 'human'

def get_sitemap_paths() -> set:
    """Load paths from cached sitemap or re-fetch."""
    import urllib.request
    try:
        req = urllib.request.Request(
            "http://localhost:3000/sitemap.xml",  # internal fetch
            headers={"User-Agent": "NebulaSEOBot/1.0 (+https://nebulacomponents.com/crawler-policy)"}
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            xml = r.read().decode()
        urls = re.findall(r'<loc>(https?://[^<]+)</loc>', xml)
        paths = set()
        for u in urls:
            p = urlparse(u).path.rstrip('/') or '/'
            paths.add(p)
        SITEMAP_CACHE.write_text(json.dumps(list(paths)))
        return paths
    except Exception:
        if SITEMAP_CACHE.exists():
            return set(json.loads(SITEMAP_CACHE.read_text()))
        return set()

def load_watermark() -> dict:
    if WATERMARK_FILE.exists():
        try:
            return json.loads(WATERMARK_FILE.read_text())
        except Exception:
            pass
    return {}

def save_watermark(wm: dict):
    WATERMARK_FILE.write_text(json.dumps(wm, indent=2))

def parse_logs(since_offsets: dict) -> tuple[list, dict]:
    """
    Parse cloudflared log files, returning request records and new offsets.
    
    Each HTTP event is two consecutive debug lines:
      1. Request: has `path`, `host`, `headers` (contains User-Agent)
      2. Response: message like "200 OK", "404 Not Found", has `content-length`
    """
    records = []
    new_offsets = dict(since_offsets)
    
    log_files = sorted(LOG_DIR.glob("cloudflared*.log*"))
    
    for log_path in log_files:
        fname = str(log_path)
        offset = since_offsets.get(fname, 0)
        
        try:
            if fname.endswith('.gz'):
                opener = lambda: gzip.open(fname, 'rt', encoding='utf-8', errors='replace')
            else:
                opener = lambda: open(fname, 'r', encoding='utf-8', errors='replace')
            
            with opener() as f:
                f.seek(offset)
                lines = f.readlines()
                new_offsets[fname] = f.tell()
        except Exception as e:
            print(f"  Error reading {fname}: {e}", file=sys.stderr)
            continue
        
        # Pair request+response lines
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            try:
                d = json.loads(line)
            except Exception:
                i += 1
                continue
            
            # Request line: has event=1, path, host, headers
            if (d.get('level') == 'debug' and d.get('event') == 1
                    and 'path' in d and 'host' in d and 'headers' in d):
                
                host = d.get('host', '')
                path = d.get('path', '')
                headers = d.get('headers', {})
                method = d.get('method', 'GET')
                ts = d.get('time', '')
                conn = d.get('connIndex', 0)
                
                # Extract User-Agent (cloudflared stores headers as {name: [values]}
                ua = ''
                for k, v in headers.items():
                    if k.lower() == 'user-agent':
                        ua = v[0] if isinstance(v, list) else str(v)
                        break
                
                # Look ahead for the response line (same connIndex, no path field)
                status = None
                for j in range(i + 1, min(i + 5, len(lines))):
                    try:
                        r = json.loads(lines[j].strip())
                        if (r.get('level') == 'debug' and r.get('event') == 1
                                and r.get('connIndex') == conn
                                and 'path' not in r and 'message' in r):
                            msg = r.get('message', '')
                            m = re.match(r'^(\d{3})', msg)
                            if m:
                                status = int(m.group(1))
                            break
                    except Exception:
                        continue
                
                # Filter: only nebulacomponents.com, skip internal/asset requests
                if TARGET_HOST in host:
                    clean_path = path.split('?')[0].rstrip('/')  or '/'
                    is_asset = bool(re.search(
                        r'\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|map|json|webp|avif)$',
                        clean_path, re.I
                    ))
                    if not is_asset and not clean_path.startswith('/_next/'):
                        bot = classify_ua(ua)
                        records.append({
                            'time': ts,
                            'host': host,
                            'path': clean_path,
                            'method': method,
                            'status': status,
                            'ua': ua[:120],
                            'bot': bot,
                        })
            i += 1
    
    return records, new_offsets

print(f"[{datetime.now().isoformat()}] Log analysis for {TARGET_HOST}", file=sys.stderr)

watermark = load_watermark()
records, new_watermark = parse_logs(watermark)
save_watermark(new_watermark)
print(f"  Parsed {len(records)} new page requests", file=sys.stderr)

sitemap_paths = get_sitemap_paths()
print(f"  Sitemap: {len(sitemap_paths)} paths", file=sys.stderr)

# Aggregate by bot type
bot_paths = defaultdict(lambda: defaultdict(int))  # bot → path → count
status_counts = defaultdict(int)

for r in records:
    bot = r['bot']
    path = r['path']
    status = r.get('status') or 0
    bot_paths[bot][path] += 1
    status_counts[f"{bot}:{status}"] += 1

# Googlebot coverage analysis
googlebot_paths = set(bot_paths.get('Googlebot', {}).keys())
sitemap_not_crawled = sitemap_paths - googlebot_paths
crawled_not_in_sitemap = googlebot_paths - sitemap_paths - {'/robots.txt', '/sitemap.xml', '/'}

# Bingbot coverage analysis
bingbot_paths = set(bot_paths.get('Bingbot', {}).keys())
sitemap_not_crawled_bing = sitemap_paths - bingbot_paths
crawled_not_in_sitemap_bing = bingbot_paths - sitemap_paths - {'/robots.txt', '/sitemap.xml', '/'}

# Top paths per bot
top_by_bot = {}
for bot, paths in bot_paths.items():
    top_by_bot[bot] = sorted(paths.items(), key=lambda x: -x[1])[:10]

# Bot traffic summary
bot_summary = {bot: sum(paths.values()) for bot, paths in bot_paths.items()}
bot_summary = dict(sorted(bot_summary.items(), key=lambda x: -x[1]))

# Load/merge with today's report if it already exists
existing = {}
if REPORT_FILE.exists():
    try:
        existing = json.loads(REPORT_FILE.read_text())
    except Exception:
        pass

# Merge into existing report for the day
merged_records = existing.get('raw_record_count', 0) + len(records)

report = {
    'generated_at': datetime.now().isoformat(),
    'target': TARGET_HOST,
    'raw_record_count': merged_records,
    'sitemap_path_count': len(sitemap_paths),
    'bot_summary': bot_summary,
    'googlebot_crawled_count': len(googlebot_paths),
    'googlebot_crawled_paths': sorted(googlebot_paths),
    'sitemap_not_crawled_by_googlebot': sorted(sitemap_not_crawled)[:50],
    'crawled_not_in_sitemap': sorted(crawled_not_in_sitemap)[:20],
    'bingbot_crawled_count': len(bingbot_paths),
    'bingbot_crawled_paths': sorted(bingbot_paths),
    'sitemap_not_crawled_by_bingbot': sorted(sitemap_not_crawled_bing)[:50],
    'crawled_not_in_sitemap_bing': sorted(crawled_not_in_sitemap_bing)[:20],
    'top_paths_by_bot': {bot: paths for bot, paths in top_by_bot.items()},
    'status_distribution': {
        k: v for k, v in sorted(status_counts.items(), key=lambda x: -x[1])
    },
}
REPORT_FILE.write_text(json.dumps(report, indent=2))
print(f"  Report: {REPORT_FILE}", file=sys.stderr)

# stdout alert — always report (it's the Googlebot mapping cron)
human_count = bot_summary.get('human', 0)
bot_total = sum(v for k, v in bot_summary.items() if k != 'human')
gb_count = bot_summary.get('Googlebot', 0)

print(f"**Log Analysis — {TODAY}**")
print(f"Total page requests: {merged_records} ({bot_total} bot / {human_count} human)\n")

if bot_summary:
    print("🤖 Bot traffic breakdown:")
    for bot, count in list(bot_summary.items())[:8]:
        bar = '█' * min(count, 20)
        print(f"  {bot:20s} {count:4d}  {bar}")
    print()

if googlebot_paths:
    print(f"🔍 Googlebot crawled {len(googlebot_paths)} distinct paths:")
    gb_top = sorted(bot_paths.get('Googlebot', {}).items(), key=lambda x: -x[1])[:10]
    for path, cnt in gb_top:
        print(f"  {cnt:3d}x  {path}")
    print()

if sitemap_not_crawled:
    print(f"⚠️  {len(sitemap_not_crawled)} sitemap pages NOT yet crawled by Googlebot:")
    for p in sorted(sitemap_not_crawled)[:8]:
        print(f"  {p}")
    if len(sitemap_not_crawled) > 8:
        print(f"  ... and {len(sitemap_not_crawled)-8} more")
    print()

if crawled_not_in_sitemap:
    print(f"📋 {len(crawled_not_in_sitemap)} paths Googlebot visited that aren't in sitemap:")
    for p in sorted(crawled_not_in_sitemap)[:5]:
        print(f"  {p}")

if bingbot_paths:
    print(f"\n🔎 Bingbot crawled {len(bingbot_paths)} distinct paths:")
    bb_top = sorted(bot_paths.get('Bingbot', {}).items(), key=lambda x: -x[1])[:10]
    for path, cnt in bb_top:
        print(f"  {cnt:3d}x  {path}")
    print()

if sitemap_not_crawled_bing:
    bing_gap_count = len(sitemap_not_crawled_bing)
    print(f"⚠️  {bing_gap_count} sitemap pages NOT yet crawled by Bingbot:")
    for p in sorted(sitemap_not_crawled_bing)[:8]:
        print(f"  {p}")
    if bing_gap_count > 8:
        print(f"  ... and {bing_gap_count-8} more")
    print()

if crawled_not_in_sitemap_bing:
    print(f"📋 {len(crawled_not_in_sitemap_bing)} paths Bingbot visited that aren't in sitemap:")
    for p in sorted(crawled_not_in_sitemap_bing)[:5]:
        print(f"  {p}")

print(f"\nFull report: {REPORT_FILE}")
