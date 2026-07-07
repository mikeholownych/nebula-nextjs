#!/usr/bin/env python3
"""
GSC Gap Analysis — Agensi playbook applied to Nebula
Every Monday: export GSC → run this → get 5-10 keyword opportunities → write articles.

Usage:
  1. Download GSC performance report as CSV:
     Search Console → Performance → Export → Download CSV
     Save as: ~/nebula/gsc_export.csv

  2. Run: python3 gsc_gap_analysis.py [gsc_export.csv]

  3. Output: keyword_gaps.md — top opportunities with impression counts and positions
"""

import csv
import sys
import os
import re
from pathlib import Path
from datetime import datetime

# ── Config ─────────────────────────────────────────────────────────────────────
MIN_IMPRESSIONS   = 20      # ignore queries with fewer impressions (noise)
LOW_CTR_THRESHOLD = 0.02    # below 2% CTR = potential content gap
HIGH_POSITION     = 15.0    # avg position > 15 = no dedicated page ranking
CANNIBAL_DELTA    = 3.0     # two pages within 3 positions on same query = cannibalization

# Pages already on site (slug → url)
EXISTING_PAGES = {
    "why-landing-pages-dont-convert":     "https://nebulacomponents.shop/why-landing-pages-dont-convert.html",
    "ai-sdr-vs-audit":                    "https://nebulacomponents.shop/ai-sdr-vs-audit.html",
    "blog-trigger-aware-outreach":        "https://nebulacomponents.shop/blog-trigger-aware-outreach.html",
    "what-is-landing-page-audit":         "https://nebulacomponents.shop/what-is-landing-page-audit.html",
    "headline-optimization":              "https://nebulacomponents.shop/headline-optimization.html",
    "cta-optimization":                   "https://nebulacomponents.shop/cta-optimization.html",
    "social-proof-landing-page":          "https://nebulacomponents.shop/social-proof-landing-page.html",
    "page-speed-conversion":              "https://nebulacomponents.shop/page-speed-conversion.html",
    "mobile-landing-page-optimization":   "https://nebulacomponents.shop/mobile-landing-page-optimization.html",
}


def load_gsc_csv(path: str) -> list[dict]:
    """Load GSC CSV export. Handles both query-level and page+query level exports."""
    rows = []
    with open(path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Normalize field names (GSC exports use different cases)
            normalized = {k.lower().strip(): v.strip() for k, v in row.items()}
            rows.append(normalized)
    return rows


def parse_row(row: dict) -> dict | None:
    """Extract query, impressions, clicks, position from a GSC row."""
    try:
        query = row.get('query') or row.get('top queries') or ''
        impressions = int(float(row.get('impressions', 0)))
        clicks = int(float(row.get('clicks', 0)))
        position = float(row.get('position', 0) or row.get('average position', 0))
        page = row.get('page') or row.get('landing page') or ''
        ctr = clicks / impressions if impressions > 0 else 0
        return {
            'query': query.strip().lower(),
            'impressions': impressions,
            'clicks': clicks,
            'position': position,
            'page': page,
            'ctr': ctr,
        }
    except (ValueError, TypeError):
        return None


def classify_opportunity(row: dict) -> str | None:
    """
    Returns opportunity type or None.
    - 'gap'      : impressions but no ranked page, or position > 15
    - 'ctr_leak' : good position (≤15) but very low CTR — title/meta fix
    - 'quick_win': position 11–20, reasonable impressions — new article could rank fast
    """
    if row['impressions'] < MIN_IMPRESSIONS:
        return None
    if row['query'] in ('', '-'):
        return None

    if row['position'] > HIGH_POSITION or row['position'] == 0:
        return 'gap'
    elif row['position'] <= 15 and row['ctr'] < LOW_CTR_THRESHOLD:
        return 'ctr_leak'
    elif 11 <= row['position'] <= 20:
        return 'quick_win'
    return None


def find_cannibalization(rows: list[dict]) -> list[dict]:
    """Find queries where 2+ pages compete within CANNIBAL_DELTA positions."""
    from collections import defaultdict
    query_pages: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        if r['query'] and r.get('page'):
            query_pages[r['query']].append(r)

    issues = []
    for query, pages in query_pages.items():
        if len(pages) < 2:
            continue
        sorted_pages = sorted(pages, key=lambda x: x['position'])
        for i in range(len(sorted_pages) - 1):
            delta = sorted_pages[i+1]['position'] - sorted_pages[i]['position']
            if delta <= CANNIBAL_DELTA:
                issues.append({
                    'query': query,
                    'page_a': sorted_pages[i]['page'],
                    'pos_a': sorted_pages[i]['position'],
                    'page_b': sorted_pages[i+1]['page'],
                    'pos_b': sorted_pages[i+1]['position'],
                    'impressions': sorted_pages[i]['impressions'],
                })
    return sorted(issues, key=lambda x: -x['impressions'])


def find_emerging_queries(rows: list[dict], top_n: int = 10) -> list[dict]:
    """
    Emerging = high impressions, position > 20, very few clicks.
    These are new terms Google is testing us for — worth targeting fast.
    """
    emerging = [
        r for r in rows
        if r['impressions'] >= MIN_IMPRESSIONS
        and r['position'] > 20
        and r['clicks'] < 3
    ]
    return sorted(emerging, key=lambda x: -x['impressions'])[:top_n]


def suggest_article_title(query: str) -> str:
    """Generate a candidate article title from a keyword gap query."""
    q = query.strip()
    # Question queries → answer format
    if q.startswith(('how', 'what', 'why', 'when', 'where', 'which', 'who', 'does', 'is', 'can', 'should')):
        return q[0].upper() + q[1:].rstrip('?') + '?'
    # Noun phrases → "X: Complete Guide"
    return f"{q[0].upper() + q[1:]}: What You Need to Know"


def run_analysis(csv_path: str) -> str:
    rows_raw = load_gsc_csv(csv_path)
    rows = [r for r in (parse_row(row) for row in rows_raw) if r is not None]

    if not rows:
        return "ERROR: No rows parsed. Check CSV format."

    # Classify opportunities
    gaps, ctr_leaks, quick_wins = [], [], []
    for r in rows:
        opp = classify_opportunity(r)
        if opp == 'gap':
            gaps.append(r)
        elif opp == 'ctr_leak':
            ctr_leaks.append(r)
        elif opp == 'quick_win':
            quick_wins.append(r)

    gaps       = sorted(gaps,       key=lambda x: -x['impressions'])[:10]
    ctr_leaks  = sorted(ctr_leaks,  key=lambda x: -x['impressions'])[:5]
    quick_wins = sorted(quick_wins, key=lambda x: -x['impressions'])[:5]

    cannibals  = find_cannibalization(rows)[:5]
    emerging   = find_emerging_queries(rows, top_n=5)

    # ── Build report ──────────────────────────────────────────────────────────
    now = datetime.now().strftime('%Y-%m-%d')
    lines = [
        f"# GSC Gap Analysis — {now}",
        f"Source: `{csv_path}`  |  Rows: {len(rows)}  |  Gaps: {len(gaps)}  |  CTR leaks: {len(ctr_leaks)}",
        "",
        "---",
        "",
        "## 🎯 Priority 1 — Keyword Gaps (write these articles first)",
        "_Queries with 20+ impressions but no dedicated ranking page or avg position > 15._",
        "",
        "| Query | Impressions | Position | CTR | Suggested Article Title |",
        "|---|---|---|---|---|",
    ]
    for r in gaps:
        title = suggest_article_title(r['query'])
        lines.append(f"| {r['query']} | {r['impressions']:,} | {r['position']:.1f} | {r['ctr']*100:.1f}% | {title} |")

    lines += [
        "",
        "---",
        "",
        "## ⚡ Priority 2 — Quick Win Positions (11–20)",
        "_Good impressions, close to page 1 — one new targeted article can steal these._",
        "",
        "| Query | Impressions | Position | CTR | Suggested Article Title |",
        "|---|---|---|---|---|",
    ]
    for r in quick_wins:
        title = suggest_article_title(r['query'])
        lines.append(f"| {r['query']} | {r['impressions']:,} | {r['position']:.1f} | {r['ctr']*100:.1f}% | {title} |")

    lines += [
        "",
        "---",
        "",
        "## 📉 Priority 3 — CTR Leaks (good position, low clicks)",
        "_Page is ranking but title/meta isn't compelling. Fix meta description + title tag._",
        "",
        "| Query | Impressions | Position | CTR | Fix |",
        "|---|---|---|---|---|",
    ]
    for r in ctr_leaks:
        lines.append(f"| {r['query']} | {r['impressions']:,} | {r['position']:.1f} | {r['ctr']*100:.1f}% | Rewrite title + meta to include query + outcome |")

    if cannibals:
        lines += [
            "",
            "---",
            "",
            "## ⚠️  Cannibalization Issues",
            "_Two pages competing within 3 positions on the same query — consolidate or differentiate._",
            "",
            "| Query | Page A | Pos A | Page B | Pos B | Impressions |",
            "|---|---|---|---|---|---|",
        ]
        for c in cannibals:
            pa = c['page_a'].replace('https://nebulacomponents.shop','')
            pb = c['page_b'].replace('https://nebulacomponents.shop','')
            lines.append(f"| {c['query']} | {pa} | {c['pos_a']:.1f} | {pb} | {c['pos_b']:.1f} | {c['impressions']:,} |")

    if emerging:
        lines += [
            "",
            "---",
            "",
            "## 🚀 Emerging Queries (Google testing us — act fast)",
            "_High impressions, position > 20, near-zero clicks. Write a dedicated article this week._",
            "",
            "| Query | Impressions | Position | Suggested Article Title |",
            "|---|---|---|---|",
        ]
        for r in emerging:
            title = suggest_article_title(r['query'])
            lines.append(f"| {r['query']} | {r['impressions']:,} | {r['position']:.1f} | {title} |")

    lines += [
        "",
        "---",
        "",
        "## Weekly Action Checklist",
        "",
        "- [ ] Write 3–5 articles targeting Priority 1 gaps above",
        "- [ ] Deploy + submit for indexing via Google Search Console",
        "- [ ] Fix CTR leaks: update `<title>` + `<meta description>` on affected pages",
        "- [ ] Check cannibalization: consolidate or add `rel=canonical` to weaker page",
        "- [ ] Re-run this script next Monday with fresh GSC export",
        "",
        "_The compound loop: each new ranking article generates new impressions for related queries → feeds next week's gap list → creates more articles._",
    ]

    return '\n'.join(lines)


def main():
    csv_path = sys.argv[1] if len(sys.argv) > 1 else 'gsc_export.csv'

    if not os.path.exists(csv_path):
        print(f"""
GSC Gap Analysis — Nebula Components
=====================================
CSV not found: {csv_path}

To use this script:
  1. Go to Google Search Console → Performance → Queries
  2. Set date range to last 28 days
  3. Export → Download CSV
  4. Save as: {csv_path}
  5. Run: python3 gsc_gap_analysis.py

Expected CSV columns: Query, Clicks, Impressions, CTR, Position
(Standard GSC export format — no modifications needed)
""")
        sys.exit(1)

    print(f"Loading {csv_path}...")
    report = run_analysis(csv_path)

    out_path = 'keyword_gaps.md'
    with open(out_path, 'w') as f:
        f.write(report)

    print(report)
    print(f"\n✓ Report saved to {out_path}")


if __name__ == '__main__':
    main()
