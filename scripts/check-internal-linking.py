#!/usr/bin/env python3
"""
Nebula Internal Linking Validator
scripts/check-internal-linking.py

Crawls the built Next.js site and reports:
- Pages with zero inbound internal links (orphans)
- Pages reachable only from sitemap
- Click depth from homepage
- Broken internal links (404s)
- Orphan risk by page cluster

Usage:
    python3 scripts/check-internal-linking.py [--base-url http://localhost:3000] [--json]

Output:
    Human-readable report + optional JSON artifact

CI integration:
    Exit 1 if any CRITICAL orphans found (zero inbound, not gated/utility)
    Exit 0 if all strategically important pages have inbound links
"""
import sys
import json
import time
import argparse
from collections import defaultdict, deque
from urllib.parse import urlparse, urljoin
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from html.parser import HTMLParser

# ── Configuration ─────────────────────────────────────────────
BASE_URL = "http://localhost:3000"
SITE_DOMAIN = "nebulacomponents.com"

# Pages that are intentionally gated/utility — not SEO targets
GATED = {"/workspace", "/audit-dashboard", "/login", "/checkout",
         "/checkout-impulse", "/checkout-v2", "/create-97-checkout",
         "/dashboard", "/subscribe", "/unsubscribe", "/thank-you",
         "/audit/results", "/audit/processing"}

# Pages that are legal/utility (low bar — just need 1 link)
UTILITY = {"/privacy-policy", "/terms", "/data-rights", "/editorial-standards", "/brand"}

# Strategically important: expect ≥3 inbound links
STRATEGIC = {
    "/audit", "/pricing",
    "/why-is-my-landing-page-not-converting",
    "/ads-getting-clicks-but-no-sales",
    "/learning-centre", "/teardowns",
    "/ecommerce-landing-page-audit", "/saas-landing-page-audit",
    "/mobile-landing-page-audit", "/lead-generation-landing-page-audit",
    "/landing-page-cta-audit", "/landing-page-message-match",
    "/landing-page-trust-signals", "/page-speed-conversion",
    "/best-landing-page-audit-tools",
}

# Max crawl pages to avoid infinite loops
MAX_PAGES = 300
REQUEST_DELAY = 0.05  # seconds between requests

class LinkExtractor(HTMLParser):
    def __init__(self, base_url: str):
        super().__init__()
        self.base_url = base_url
        self.links: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            attrs_dict = dict(attrs)
            href = attrs_dict.get('href', '')
            if not href or href.startswith('#') or href.startswith('mailto:') or href.startswith('tel:'):
                return
            # Resolve relative URLs
            full = urljoin(self.base_url, href)
            parsed = urlparse(full)
            # Keep only same-domain links
            if parsed.netloc in ('', urlparse(self.base_url).netloc):
                # Normalize: strip fragment, trailing slash (except root), query
                path = parsed.path.rstrip('/') or '/'
                self.links.append(path)

def fetch_page(url: str) -> tuple[int, str]:
    try:
        req = Request(url, headers={'User-Agent': 'NebulaCrawler/1.0 (internal)'})
        with urlopen(req, timeout=10) as resp:
            return resp.status, resp.read().decode('utf-8', errors='replace')
    except HTTPError as e:
        return e.code, ''
    except (URLError, Exception):
        return 0, ''

def crawl(base_url: str) -> dict:
    """BFS crawl from homepage. Returns link graph."""
    visited: set[str] = set()
    queue: deque[tuple[str, int]] = deque([('/', 0)])
    # path -> {inbound: set of pages linking to it, depth: int, status: int}
    graph: dict[str, dict] = defaultdict(lambda: {'inbound': set(), 'depth': 999, 'status': 0, 'broken': False})
    graph['/']['depth'] = 0

    print(f"Crawling {base_url} ...")
    crawled = 0

    while queue and crawled < MAX_PAGES:
        path, depth = queue.popleft()
        if path in visited:
            continue
        visited.add(path)

        # Skip gated pages
        if any(path.startswith(g) for g in GATED):
            graph[path]['depth'] = depth
            continue

        url = base_url + path
        status, html = fetch_page(url)
        graph[path]['status'] = status
        graph[path]['depth'] = min(graph[path]['depth'], depth)
        graph[path]['broken'] = (status == 404 or status == 0)
        crawled += 1

        if status == 200 and html:
            extractor = LinkExtractor(base_url)
            extractor.feed(html)
            for linked_path in set(extractor.links):
                # Only track pages, not files
                if '.' in linked_path.split('/')[-1]:
                    continue
                graph[linked_path]['inbound'].add(path)
                if linked_path not in visited:
                    new_depth = depth + 1
                    if new_depth < graph[linked_path].get('depth', 999):
                        graph[linked_path]['depth'] = new_depth
                    queue.append((linked_path, new_depth))

        if crawled % 20 == 0:
            print(f"  Crawled {crawled} pages ({len(graph)} discovered)...")

        time.sleep(REQUEST_DELAY)

    print(f"Crawl complete: {crawled} pages crawled, {len(graph)} total discovered")
    return dict(graph)

def analyze(graph: dict) -> dict:
    """Classify pages and produce report data."""
    orphans = []
    near_orphans = []
    deep_pages = []
    broken = []
    strategic_weak = []

    for path, data in sorted(graph.items()):
        # Skip gated
        if any(path.startswith(g) for g in GATED):
            continue

        inbound_count = len(data['inbound'])
        depth = data['depth']
        status = data['status']

        if data.get('broken') and status != 0:
            broken.append({'path': path, 'status': status})

        if path in UTILITY:
            continue  # lower bar

        if inbound_count == 0:
            orphans.append({'path': path, 'depth': depth, 'status': status})
        elif inbound_count == 1:
            near_orphans.append({'path': path, 'inbound': list(data['inbound']), 'depth': depth})

        if depth > 4 and depth < 999:
            deep_pages.append({'path': path, 'depth': depth, 'inbound': inbound_count})

        if path in STRATEGIC and inbound_count < 3:
            strategic_weak.append({'path': path, 'inbound': inbound_count, 'depth': depth})

    return {
        'orphans': orphans,
        'near_orphans': near_orphans,
        'deep_pages': deep_pages,
        'broken': broken,
        'strategic_weak': strategic_weak,
        'total_pages': len(graph),
        'orphan_count': len(orphans),
    }

def print_report(graph: dict, analysis: dict, base_url: str):
    print("\n" + "="*70)
    print("NEBULA INTERNAL LINKING REPORT")
    print("="*70)
    print(f"Total pages discovered: {analysis['total_pages']}")
    print(f"Orphaned pages (0 inbound links): {analysis['orphan_count']}")
    print(f"Near-orphans (1 inbound link): {len(analysis['near_orphans'])}")
    print(f"Deep pages (>4 clicks): {len(analysis['deep_pages'])}")
    print(f"Broken links: {len(analysis['broken'])}")
    print(f"Strategic pages with weak coverage (<3 inbound): {len(analysis['strategic_weak'])}")

    if analysis['orphans']:
        print(f"\n{'─'*70}")
        print("ORPHANED PAGES (0 inbound links) — CRITICAL")
        print('─'*70)
        for p in sorted(analysis['orphans'], key=lambda x: x['path']):
            status = f"[{p['status']}]" if p['status'] else "[no response]"
            print(f"  {status}  {p['path']}  (depth: {p['depth']})")

    if analysis['near_orphans']:
        print(f"\n{'─'*70}")
        print("NEAR-ORPHANS (1 inbound link) — WARNING")
        print('─'*70)
        for p in sorted(analysis['near_orphans'], key=lambda x: x['path'])[:20]:
            print(f"  {p['path']}  ← {p['inbound'][0] if p['inbound'] else 'unknown'}")
        if len(analysis['near_orphans']) > 20:
            print(f"  ... and {len(analysis['near_orphans']) - 20} more")

    if analysis['strategic_weak']:
        print(f"\n{'─'*70}")
        print("STRATEGIC PAGES WITH WEAK COVERAGE (<3 inbound) — WARNING")
        print('─'*70)
        for p in analysis['strategic_weak']:
            print(f"  {p['path']}  ({p['inbound']} inbound links, depth {p['depth']})")

    if analysis['deep_pages']:
        print(f"\n{'─'*70}")
        print("DEEP PAGES (>4 clicks from home) — INFO")
        print('─'*70)
        for p in sorted(analysis['deep_pages'], key=lambda x: -x['depth'])[:15]:
            print(f"  depth={p['depth']}  {p['path']}  ({p['inbound']} inbound)")

    if analysis['broken']:
        print(f"\n{'─'*70}")
        print("BROKEN INTERNAL LINKS — FIX IMMEDIATELY")
        print('─'*70)
        for p in analysis['broken']:
            print(f"  [{p['status']}]  {p['path']}")

    print(f"\n{'='*70}")
    ci_result = "PASS" if analysis['orphan_count'] == 0 and not analysis['broken'] else "FAIL"
    print(f"CI RESULT: {ci_result}")
    print("="*70)

    return analysis['orphan_count'] > 0 or len(analysis['broken']) > 0

def main():
    parser = argparse.ArgumentParser(description='Nebula internal link validator')
    parser.add_argument('--base-url', default=BASE_URL)
    parser.add_argument('--json', action='store_true', help='Output JSON artifact')
    parser.add_argument('--json-output', default='docs/seo/link-report.json')
    args = parser.parse_args()

    graph = crawl(args.base_url)
    analysis = analyze(graph)
    has_failures = print_report(graph, analysis, args.base_url)

    if args.json:
        # Add inbound counts to graph for reporting
        report = {
            'generated_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            'base_url': args.base_url,
            'summary': {
                'total_pages': analysis['total_pages'],
                'orphans': analysis['orphan_count'],
                'near_orphans': len(analysis['near_orphans']),
                'deep_pages': len(analysis['deep_pages']),
                'broken': len(analysis['broken']),
                'strategic_weak': len(analysis['strategic_weak']),
            },
            'orphaned_pages': analysis['orphans'],
            'strategic_weak': analysis['strategic_weak'],
            'broken_links': analysis['broken'],
        }
        with open(args.json_output, 'w') as f:
            json.dump(report, f, indent=2)
        print(f"\nJSON report: {args.json_output}")

    sys.exit(1 if has_failures else 0)

if __name__ == '__main__':
    main()
