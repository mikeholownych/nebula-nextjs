#!/usr/bin/env python3
"""Backfill non-authorizing gateway enrichment into MailCheck evidence rows."""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path
import sys

ROOT = Path('/home/mike/nebula')
sys.path.insert(0, str(ROOT))

from gateway_fingerprint import enrich_gateway_evidence

DB = ROOT / 'mailcheck_beta.db'


def main() -> int:
    updated = 0
    with sqlite3.connect(DB) as db:
        rows = db.execute('SELECT verification_id, evidence_json FROM evidence').fetchall()
        for verification_id, raw in rows:
            evidence = json.loads(raw)
            enriched = enrich_gateway_evidence(evidence)
            if enriched.get('gateway_enrichment') != evidence.get('gateway_enrichment'):
                db.execute(
                    'UPDATE evidence SET evidence_json = ? WHERE verification_id = ?',
                    (json.dumps(enriched, sort_keys=True), verification_id),
                )
                updated += 1
    print(json.dumps({'rows_seen': len(rows), 'rows_updated': updated}))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
