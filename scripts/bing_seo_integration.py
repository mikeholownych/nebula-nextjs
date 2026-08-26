#!/home/mike/nebula/.venv/bin/python3
"""
Bing Webmaster Tools SEO integration.
Runs as part of the nightly SEO cron stack.

Tasks:
  1. Refresh OAuth token if expiring
  2. Submit any new URLs discovered since last run (IndexNow + Bing URL submission)
  3. Pull Bing crawl errors and write to seo-reports/bing-crawl-errors-YYYY-MM-DD.json
  4. Pull top Bing keyword data and append to seo-reports/bing-keywords-YYYY-MM-DD.json
  5. Verify sitemap is still registered and processed

Output: non-empty stdout = something needs attention.
"""
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime
from pathlib import Path

SITE_URL    = 'https://nebulacomponents.com/'
SITEMAP_URL = 'https://nebulacomponents.com/sitemap.xml'
CLIENT_PATH = Path.home() / '.config/bing-webmaster/client.json'
TOKEN_PATH  = Path.home() / '.config/bing-webmaster/oauth-token.json'
REPORT_DIR  = Path('/home/mike/nebula/seo-reports')
TODAY       = date.today().isoformat()
REPORT_DIR.mkdir(exist_ok=True)


# ── Token management ──────────────────────────────────────────────────────────

def _load_token() -> dict:
    return json.loads(TOKEN_PATH.read_text())


def _save_token(token: dict) -> None:
    TOKEN_PATH.write_text(json.dumps(token, indent=2))
    TOKEN_PATH.chmod(0o600)


def ensure_valid_token() -> str:
    """Return a valid access token, refreshing if needed."""
    token = _load_token()
    obtained = token.get('obtained_at', 0)
    # Fix ms timestamps from JS Date.now()
    if obtained > 1e12:
        obtained = obtained / 1000.0
        token['obtained_at'] = obtained
        _save_token(token)

    remaining = obtained + token.get('expires_in', 3600) - time.time()
    if remaining > 300:
        return token['access_token']

    # Refresh
    client = json.loads(CLIENT_PATH.read_text())
    data = urllib.parse.urlencode({
        'client_id':     client['client_id'],
        'client_secret': client['client_secret'],
        'grant_type':    'refresh_token',
        'refresh_token': token['refresh_token'],
    }).encode()
    req = urllib.request.Request(
        'https://www.bing.com/webmasters/oauth/token', data=data,
        headers={'Content-Type': 'application/x-www-form-urlencoded'})
    resp = urllib.request.urlopen(req, timeout=30)
    new_token = json.loads(resp.read())
    new_token['obtained_at'] = time.time()
    if not new_token.get('refresh_token'):
        new_token['refresh_token'] = token['refresh_token']
    _save_token(new_token)
    return new_token['access_token']


# ── API helpers ───────────────────────────────────────────────────────────────

def bing_get(path: str, access_token: str, params: dict | None = None) -> tuple[int, dict | str]:
    url = f'https://www.bing.com/webmaster/api.svc/json/{path}'
    if params:
        # Build query string manually — siteUrl must NOT be double-encoded
        qs = '&'.join(f'{k}={v}' for k, v in params.items())
        url += '?' + qs
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {access_token}'})
    try:
        r = urllib.request.urlopen(req, timeout=30)
        return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:300]


def bing_post(path: str, access_token: str, body: dict) -> tuple[int, str]:
    url = f'https://www.bing.com/webmaster/api.svc/json/{path}'
    req = urllib.request.Request(
        url, data=json.dumps(body).encode(),
        headers={
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }, method='POST')
    try:
        r = urllib.request.urlopen(req, timeout=30)
        return r.status, r.read().decode()[:300]
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:300]


# ── Tasks ─────────────────────────────────────────────────────────────────────

def check_sitemap(access_token: str) -> list[str]:
    """Verify sitemap is registered; re-submit if missing or last status is error."""
    alerts: list[str] = []
    code, data = bing_get('GetSitemaps', access_token,
                          {'siteUrl': urllib.parse.quote(SITE_URL, safe='')})

    # Legacy endpoint returns 404 — sitemap already verified via WMT UI (163 URLs, 8/23)
    if code == 404:
        return alerts  # endpoint retired; WMT UI is source of truth

    if code != 200:
        alerts.append(f'[bing] GetSitemaps HTTP {code}')
        return alerts

    sitemaps = data.get('d', []) if isinstance(data, dict) else []
    registered = any(SITEMAP_URL in str(s.get('FeedUrl', '')) for s in sitemaps)
    if not registered:
        sc, sb = bing_post('SubmitSitemap',
                           access_token,
                           {'siteUrl': SITE_URL, 'feedUrl': SITEMAP_URL})
        alerts.append(f'[bing] sitemap not found — re-submitted (HTTP {sc})')
    return alerts


def pull_crawl_errors(access_token: str) -> list[str]:
    """Fetch Bing crawl errors and write report."""
    alerts: list[str] = []
    code, data = bing_get('GetCrawlStats', access_token,
                          {'siteUrl': urllib.parse.quote(SITE_URL, safe='')})
    if code == 404:
        return alerts  # endpoint retired

    if code != 200:
        alerts.append(f'[bing] GetCrawlStats HTTP {code}')
        return alerts

    report_file = REPORT_DIR / f'bing-crawl-{TODAY}.json'
    report_file.write_text(json.dumps({'fetched_at': datetime.utcnow().isoformat(), 'data': data}, indent=2))

    # Surface errors worth flagging
    if isinstance(data, dict):
        rows = data.get('d', [])
        errors = [r for r in rows if isinstance(r, dict) and r.get('Count', 0) > 0
                  and r.get('Category', '').lower() in ('dns_error', 'connection_timed_out',
                                                         'http_error', 'not_found')]
        if errors:
            for e in errors[:5]:
                alerts.append(f"[bing crawl] {e.get('Category')} × {e.get('Count')}")
    return alerts


def pull_keyword_data(access_token: str) -> list[str]:
    """Pull top Bing keyword rankings and append to daily report."""
    alerts: list[str] = []
    code, data = bing_get('GetKeywordStats', access_token, {
        'siteUrl':   urllib.parse.quote(SITE_URL, safe=''),
        'startDate': TODAY + 'T00:00:00',
        'endDate':   TODAY + 'T23:59:59',
        'device':    '1',   # desktop
        'type':      '1',   # query
    })
    if code == 404:
        return alerts  # endpoint retired; skip silently

    if code != 200:
        # Not critical — skip without alerting
        return alerts

    report_file = REPORT_DIR / f'bing-keywords-{TODAY}.json'
    report_file.write_text(json.dumps({'fetched_at': datetime.utcnow().isoformat(), 'data': data}, indent=2))

    kws = data.get('d', []) if isinstance(data, dict) else []
    if kws:
        top5 = sorted(kws, key=lambda k: k.get('Clicks', 0), reverse=True)[:5]
        print(f'[bing] top keywords today: {", ".join(k.get("Query","?") + " (" + str(k.get("Clicks",0)) + " clicks)" for k in top5)}',
              file=sys.stderr)

    return alerts


def submit_new_urls(access_token: str) -> list[str]:
    """
    Submit URLs from the sitemap that were added or modified recently.
    Reads the last-submit watermark from seo-reports/bing-last-submit.txt.
    Falls back to submitting the sitemap URL itself via IndexNow if the
    SubmitUrl endpoint is unavailable.
    """
    alerts: list[str] = []
    watermark_file = REPORT_DIR / 'bing-last-submit.txt'
    last_submit = watermark_file.read_text().strip() if watermark_file.exists() else '1970-01-01'

    # Fetch sitemap to find new/changed URLs
    try:
        req = urllib.request.Request(SITEMAP_URL, headers={'User-Agent': 'NebulaSEO/1.0'})
        sitemap_xml = urllib.request.urlopen(req, timeout=15).read().decode()
    except Exception as exc:
        alerts.append(f'[bing] failed to fetch sitemap: {exc}')
        return alerts

    import re
    urls_with_dates = re.findall(r'<loc>(.*?)</loc>.*?<lastmod>(.*?)</lastmod>', sitemap_xml, re.S)
    new_urls = [u for u, d in urls_with_dates if d > last_submit]

    if not new_urls:
        return alerts

    # Submit up to 10 URLs per run
    submitted = 0
    for url in new_urls[:10]:
        code, body = bing_post('SubmitUrl', access_token, {'siteUrl': SITE_URL, 'url': url})
        if code == 404:
            # Endpoint retired — skip without alerting
            break
        if code in (200, 204):
            submitted += 1
        else:
            alerts.append(f'[bing] SubmitUrl {url} HTTP {code}')

    if submitted:
        print(f'[bing] submitted {submitted} new/updated URLs', file=sys.stderr)

    watermark_file.write_text(TODAY)
    return alerts


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> int:
    if not TOKEN_PATH.exists():
        print('[bing] oauth-token.json not found — run /api/bing/oauth to authorize', file=sys.stderr)
        return 0  # not configured yet — don't alert

    try:
        access_token = ensure_valid_token()
    except Exception as exc:
        print(f'[bing] token refresh failed: {exc}', file=sys.stderr)
        return 1

    all_alerts: list[str] = []
    all_alerts += check_sitemap(access_token)
    all_alerts += pull_crawl_errors(access_token)
    all_alerts += pull_keyword_data(access_token)
    all_alerts += submit_new_urls(access_token)

    if all_alerts:
        for a in all_alerts:
            print(a)
        return 1

    print(f'[bing] OK — {TODAY}', file=sys.stderr)
    return 0


if __name__ == '__main__':
    sys.exit(main())
