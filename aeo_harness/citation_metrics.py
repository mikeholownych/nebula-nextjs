#!/usr/bin/env python3
"""Measure citations from captured AI-engine response JSONL.

Captures are grouped by run, prompt set, engine, and query so before/after
comparisons retain sample identity. No captured rows means no-data, not zero.
"""
from __future__ import annotations
import argparse, collections, json, re
from pathlib import Path
from urllib.parse import urlparse

CANONICAL_HOST = 'nebulacomponents.com'
REQUIRED = {'run_id', 'prompt_set', 'query_id', 'engine', 'model', 'query', 'timestamp', 'answer', 'citations', 'raw_response_sha256'}
SHA256 = re.compile(r'^[a-f0-9]{64}$')


def is_canonical(url):
    return urlparse(url).netloc.lower().removeprefix('www.') == CANONICAL_HOST


def main(path):
    rows = [json.loads(x) for x in Path(path).read_text().splitlines() if x.strip()]
    if not rows:
        return {'status': 'no_data', 'rows': 0}
    invalid = []
    for i, row in enumerate(rows, 1):
        missing = sorted(REQUIRED - set(row))
        if missing:
            invalid.append({'row': i, 'missing': missing})
        elif not SHA256.fullmatch(row['raw_response_sha256']):
            invalid.append({'row': i, 'error': 'raw_response_sha256 must be 64 lowercase hex characters'})
    if invalid:
        raise SystemExit(json.dumps({'status': 'invalid_capture', 'errors': invalid}))

    runs = {(row['run_id'], row['prompt_set']) for row in rows}
    if len(runs) != 1:
        raise SystemExit(json.dumps({'status': 'invalid_capture', 'errors': [{'error': 'captures must contain exactly one run_id and prompt_set'}]}))

    def metrics(items):
        mentioned = sum('nebula' in row.get('answer', '').lower() for row in items)
        cited = sum(bool(row.get('citations')) for row in items)
        canonical = [citation for row in items for citation in row.get('citations', []) if is_canonical(citation['url'])]
        all_citations = [citation for row in items for citation in row.get('citations', [])]
        positions = [c.get('position') for c in canonical if isinstance(c.get('position'), int)]
        paths = collections.Counter(urlparse(c['url']).path or '/' for c in canonical)
        return {
            'responses': len(items),
            'mention_rate': round(mentioned / len(items), 4),
            'citation_rate': round(cited / len(items), 4),
            'canonical_citation_precision': round(len(canonical) / len(all_citations), 4) if all_citations else None,
            'canonical_citations': len(canonical),
            'mean_citation_position': round(sum(positions) / len(positions), 2) if positions else None,
            'canonical_paths': dict(paths),
        }

    by_engine = collections.defaultdict(list)
    by_query = collections.defaultdict(list)
    for row in rows:
        by_engine[row['engine']].append(row)
        by_query[row['query_id']].append(row)
    run_id, prompt_set = next(iter(runs))
    return {
        'status': 'ok',
        'run_id': run_id,
        'prompt_set': prompt_set,
        'rows': len(rows),
        'query_count': len(by_query),
        'engines': {engine: metrics(items) for engine, items in by_engine.items()},
        'queries': {query_id: metrics(items) for query_id, items in by_query.items()},
    }


ap = argparse.ArgumentParser()
ap.add_argument('--captures', required=True)
ap.add_argument('--output', default='aeo_harness/output/citations.json')
args = ap.parse_args()
report = main(args.captures)
Path(args.output).parent.mkdir(parents=True, exist_ok=True)
Path(args.output).write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
