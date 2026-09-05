#!/usr/bin/env python3
"""Reconcile a competitor SERP export with Nebula's local SEO metrics.

The input is a provider export, not a scraper. It must contain one row per
observed keyword/domain/market/device position. Competitor rows stay outside
GA4, GSC, Bing, and PostHog; this script produces a local comparison artifact.

Usage:
  python3 scripts/competitor_serp_reconcile.py --input /path/export.json
"""
from __future__ import annotations

import argparse
import json
from collections import defaultdict
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

NEBULA = Path('/home/mike/nebula')
SITE = 'nebulacomponents.com'
CONFIG_DIR = NEBULA / 'memory' / 'sites' / SITE
REPORT_DIR = NEBULA / 'seo-reports'


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def canonical_targets() -> tuple[set[str], set[str]]:
    keywords_data = load_json(CONFIG_DIR / 'keywords.json')
    config = load_json(CONFIG_DIR / 'site-config.json')
    keywords = set()
    for values in keywords_data.get('primary_keywords', {}).values():
        keywords.update(values)
    for values in keywords_data.get('secondary_keywords', {}).values():
        keywords.update(values)
    return keywords, set(config.get('competitor_domains', []))


def normalise_rows(payload: Any) -> list[dict[str, Any]]:
    rows = payload.get('rows', payload) if isinstance(payload, dict) else payload
    if not isinstance(rows, list):
        raise ValueError('input must be a JSON array or an object with a rows array')
    required = {'keyword', 'market', 'device', 'domain', 'position'}
    output = []
    for index, row in enumerate(rows):
        if not isinstance(row, dict) or not required.issubset(row):
            raise ValueError(f'row {index} is missing one of {sorted(required)}')
        try:
            position = int(row['position'])
        except (TypeError, ValueError) as exc:
            raise ValueError(f'row {index} has a non-integer position') from exc
        if position < 1:
            raise ValueError(f'row {index} position must be >= 1')
        output.append({
            'keyword': str(row['keyword']).strip().lower(),
            'market': str(row['market']).strip().upper(),
            'device': str(row['device']).strip().lower(),
            'domain': str(row['domain']).strip().lower().removeprefix('www.'),
            'position': position,
            'ranking_url': row.get('ranking_url'),
            'serp_features': row.get('serp_features', []),
            'source': str(row.get('source', 'provider_export')),
        })
    return output


def reconcile(rows: list[dict[str, Any]], observed_at: str) -> dict[str, Any]:
    keywords, competitors = canonical_targets()
    allowed_domains = competitors | {SITE}
    filtered = [r for r in rows if r['keyword'] in keywords and r['domain'] in allowed_domains]
    by_key: dict[tuple[str, str, str], list[dict[str, Any]]] = defaultdict(list)
    for row in filtered:
        by_key[(row['keyword'], row['market'], row['device'])].append(row)

    domains = [SITE, *sorted(competitors)]
    domain_stats = {d: {'appearances': 0, 'top_3': 0, 'top_10': 0} for d in domains}
    keyword_rows = []
    for key in sorted(by_key):
        keyword, market, device = key
        observations = sorted(by_key[key], key=lambda r: (r['position'], r['domain']))
        best = {r['domain']: r for r in observations}
        for domain, row in best.items():
            stats = domain_stats[domain]
            stats['appearances'] += 1
            stats['top_3'] += int(row['position'] <= 3)
            stats['top_10'] += int(row['position'] <= 10)
        nebula_pos = best.get(SITE, {}).get('position')
        competitor_positions = [r['position'] for d, r in best.items() if d != SITE]
        best_competitor_pos = min(competitor_positions) if competitor_positions else None
        keyword_rows.append({
            'keyword': keyword,
            'market': market,
            'device': device,
            'nebula_position': nebula_pos,
            'best_competitor_position': best_competitor_pos,
            'rank_gap': (nebula_pos - best_competitor_pos) if nebula_pos and best_competitor_pos else None,
            'domains_observed': sorted(best),
        })

    observed_combinations = len(by_key)
    return {
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'observed_at': observed_at,
        'site': SITE,
        'source': 'provider_export',
        'target_keyword_count': len(keywords),
        'target_competitor_count': len(competitors),
        'observed_keyword_market_device_combinations': observed_combinations,
        'domain_stats': domain_stats,
        'keyword_comparisons': keyword_rows,
        'unobserved_target_count': max(len(keywords) - len({r['keyword'] for r in filtered}), 0),
        'proof_boundary': {
            'proves': ['provider-observed SERP positions for imported rows', 'comparative visibility within the imported snapshot'],
            'does_not_prove': ['competitor traffic', 'competitor conversions', 'competitor revenue', 'causal effect on Nebula performance'],
        },
    }


def write_report(result: dict[str, Any], output_dir: Path) -> tuple[Path, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    stamp = date.today().isoformat()
    json_path = output_dir / f'competitor-serp-{stamp}.json'
    md_path = output_dir / f'competitor-serp-{stamp}.md'
    json_path.write_text(json.dumps(result, indent=2) + '\n')
    lines = [
        f"# Competitor SERP reconciliation: {stamp}", '',
        f"Source: `{result['source']}`", 
        f"Target keywords: {result['target_keyword_count']}",
        f"Target competitors: {result['target_competitor_count']}",
        f"Observed keyword/market/device combinations: {result['observed_keyword_market_device_combinations']}", '',
        '## Domain visibility', '',
        '| Domain | Appearances | Top 3 | Top 10 |',
        '|---|---:|---:|---:|',
    ]
    for domain, stats in result['domain_stats'].items():
        lines.append(f"| {domain} | {stats['appearances']} | {stats['top_3']} | {stats['top_10']} |")
    lines += ['', '## Boundary', '', '- Competitor SERP observations remain local comparison data.',
              '- They are not emitted as GA4, GSC, Bing, or PostHog events.',
              '- Competitor traffic, conversions, and revenue remain unobserved.', '']
    md_path.write_text('\n'.join(lines))
    return json_path, md_path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True, type=Path)
    parser.add_argument('--output-dir', type=Path, default=REPORT_DIR)
    parser.add_argument('--observed-at', default=None)
    args = parser.parse_args()
    payload = load_json(args.input)
    rows = normalise_rows(payload)
    result = reconcile(rows, args.observed_at or datetime.now(timezone.utc).isoformat())
    json_path, md_path = write_report(result, args.output_dir)
    print(f'rows_imported={len(rows)}')
    print(f'rows_reconciled={sum(s["appearances"] for s in result["domain_stats"].values())}')
    print(f'json_report={json_path}')
    print(f'markdown_report={md_path}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
