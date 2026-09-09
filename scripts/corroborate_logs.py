#!/usr/bin/env python3
"""Corroborate analytics (GA4/PostHog) against server-side cloudflared access logs.

The cloudflared debug logs are ground truth: every request that reached the
origin is logged regardless of client-side consent. GA4/PostHog are client-side
and consent-gated, so they under-count. This script parses the last 24h of
human page requests and compares against the analytics numbers.

Usage: python3 scripts/corroborate_logs.py [--hours N] [--json]
"""
import json
import re
import sys
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path

LOG_DIR = Path("/home/mike/nebula/logs/cloudflared")
TARGET_HOST = "nebulacomponents.com"

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


def classify_ua(ua):
    if not ua:
        return 'unknown'
    for pattern, name in BOT_PATTERNS:
        if re.search(pattern, ua, re.I):
            return name
    return 'human'


def parse_logs(since_ts):
    """Parse cloudflared logs, return list of page-request records since since_ts."""
    records = []
    log_files = sorted(LOG_DIR.glob("cloudflared*.log*"))
    for log_path in log_files:
        try:
            with open(log_path, 'r', encoding='utf-8', errors='replace') as f:
                lines = f.readlines()
        except Exception:
            continue

        i = 0
        while i < len(lines):
            line = lines[i].strip()
            try:
                d = json.loads(line)
            except Exception:
                i += 1
                continue

            if (d.get('level') == 'debug' and d.get('event') == 1
                    and 'path' in d and 'host' in d and 'headers' in d):
                host = d.get('host', '')
                path = d.get('path', '')
                headers = d.get('headers', {})
                ts = d.get('time', '')
                conn = d.get('connIndex', 0)

                # parse timestamp
                try:
                    t = datetime.fromisoformat(ts.replace('Z', '+00:00'))
                except Exception:
                    i += 1
                    continue
                if t < since_ts:
                    i += 1
                    continue

                ua = ''
                for k, v in headers.items():
                    if k.lower() == 'user-agent':
                        ua = v[0] if isinstance(v, list) else str(v)
                        break

                # look ahead for response status
                status = None
                for j in range(i + 1, min(i + 5, len(lines))):
                    try:
                        r = json.loads(lines[j].strip())
                        if (r.get('level') == 'debug' and r.get('event') == 1
                                and r.get('connIndex') == conn
                                and 'path' not in r and 'message' in r):
                            m = re.match(r'^(\d{3})', r.get('message', ''))
                            if m:
                                status = int(m.group(1))
                            break
                    except Exception:
                        continue

                if TARGET_HOST in host:
                    clean_path = path.split('?')[0].rstrip('/') or '/'
                    is_asset = bool(re.search(
                        r'\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|map|json|webp|avif)$',
                        clean_path, re.I))
                    if not is_asset and not clean_path.startswith('/_next/'):
                        records.append({
                            'time': t,
                            'path': clean_path,
                            'status': status,
                            'bot': classify_ua(ua),
                        })
            i += 1
    return records


def main():
    hours = 24
    as_json = False
    args = sys.argv[1:]
    for i, a in enumerate(args):
        if a == '--hours' and i + 1 < len(args):
            hours = int(args[i + 1])
        elif a == '--json':
            as_json = True

    since_ts = datetime.now(timezone.utc) - timedelta(hours=hours)
    records = parse_logs(since_ts)

    human = [r for r in records if r['bot'] == 'human']
    bots = defaultdict(int)
    for r in records:
        if r['bot'] != 'human':
            bots[r['bot']] += 1

    # human page requests by path
    path_counts = defaultdict(int)
    for r in human:
        path_counts[r['path']] += 1

    # status breakdown for human
    status_counts = defaultdict(int)
    for r in human:
        status_counts[r['status']] += 1

    out = {
        "window_hours": hours,
        "since": since_ts.isoformat(),
        "total_page_requests": len(records),
        "human_page_requests": len(human),
        "bot_requests": dict(sorted(bots.items(), key=lambda x: -x[1])),
        "human_status_codes": {str(k): v for k, v in sorted(status_counts.items(), key=lambda x: (x[0] is None, x[0] or 0))},
        "top_human_paths": dict(sorted(path_counts.items(), key=lambda x: -x[1])[:25]),
    }

    if as_json:
        print(json.dumps(out, indent=2))
        return

    print(f"Access-log corroboration: last {hours}h (server-side ground truth)")
    print(f"  Total page requests: {out['total_page_requests']}")
    print(f"  Human page requests: {out['human_page_requests']}")
    print(f"  Bot requests: {sum(bots.values())}")
    for b, c in sorted(bots.items(), key=lambda x: -x[1]):
        print(f"    {b}: {c}")
    print(f"  Human status codes: {out['human_status_codes']}")
    print(f"  Top human paths:")
    for p, c in sorted(path_counts.items(), key=lambda x: -x[1])[:15]:
        print(f"    {c:4d}  {p}")


if __name__ == "__main__":
    main()
