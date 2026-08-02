#!/usr/bin/env python3
"""Validate one Evidence Dispatch JSON instance against Nebula's publication gate."""
from __future__ import annotations
import json
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = ROOT / 'ops/evidence-dispatch.schema.json'
LEDGER = ROOT / 'audit-system/channel1/teardown_ledger.jsonl'

def load_ledger_slugs() -> set[str]:
    if not LEDGER.exists():
        return set()
    out=set()
    for line in LEDGER.read_text().splitlines():
        if line.strip():
            row=json.loads(line)
            if row.get('slug'): out.add(row['slug'])
    return out

def main(path: str) -> int:
    data=json.loads(Path(path).read_text())
    schema=json.loads(SCHEMA.read_text())
    try:
        import jsonschema
        jsonschema.validate(data, schema)
    except ImportError:
        required=set(schema['required'])
        missing=required-set(data)
        if missing: raise ValueError(f'missing required fields: {sorted(missing)}')
    errors=[]
    for key in ('source_url',):
        if not urlparse(data['trigger'][key]).scheme: errors.append(f'{key} must be an absolute URL')
    if not urlparse(data['evidence']['page_url']).scheme: errors.append('evidence.page_url must be an absolute URL')
    if data['status'] in {'published','measuring'}:
        if data['review']['decision'] != 'approved': errors.append('published/measuring dispatch must have approved review')
        if not data['distribution']['approved']: errors.append('published/measuring dispatch must have approved distribution')
        if data['measurement']['ledger_slug'] not in load_ledger_slugs():
            errors.append(f"ledger_slug not found: {data['measurement']['ledger_slug']}")
    for item in data['evidence']['items']:
        if item.get('status') == 'retracted': errors.append('retracted evidence cannot support a dispatch')
    if errors:
        print(json.dumps({'status':'invalid','errors':errors}, indent=2)); return 1
    print(json.dumps({'status':'valid','dispatch_id':data['dispatch_id'],'publication_ready':data['status'] in {'published','measuring'}}, indent=2)); return 0

if __name__ == '__main__':
    if len(sys.argv) != 2: raise SystemExit('usage: validate_evidence_dispatch.py <dispatch.json>')
    raise SystemExit(main(sys.argv[1]))
