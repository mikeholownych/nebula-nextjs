#!/usr/bin/env python3
"""Production observatory for P1 epistemic fields.

Does not change scoring. Reports INDETERMINATE distribution and invariant
violations. Gate: 500 stamped audits OR 14 days after activation, later of the two.
"""
from __future__ import annotations

import json
import os
import sys
from collections import Counter
from datetime import datetime, timezone, timedelta
from pathlib import Path

GATE_AUDIT_COUNT = 500
GATE_DAYS = 14
ACTIVATED_AT = datetime(2026, 8, 31, 22, 0, tzinfo=timezone.utc)
DSN = (
    os.environ.get("AUDIT_DATABASE_URL")
    or "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433"
)
OUT = Path("/home/mike/nebula/ledgers/epistemic_observatory.json")


def _parse_json(value):
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return {}
    return {}


def collect(conn) -> dict:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, url, completed_at, score, page_intent, engine_output, findings
            FROM audits
            WHERE status = 'completed'
              AND completed_at >= %s
            ORDER BY completed_at
            """,
            (ACTIVATED_AT,),
        )
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]

    stamped = []
    reason_codes = Counter()
    condition_indet = Counter()
    integrity_states = Counter()
    determinations = Counter()
    invariant_hits = Counter()
    urls_indet = Counter()

    for row in rows:
        output = _parse_json(row.get("engine_output"))
        case_file = output.get("case_file") if isinstance(output.get("case_file"), dict) else None
        observation = output.get("observation") if isinstance(output.get("observation"), dict) else {}
        if not case_file:
            continue
        stamped.append(row)
        integrity = observation.get("integrity") or case_file.get("observation_integrity")
        integrity_states[str(integrity or "missing")] += 1
        dets = case_file.get("determinations") or []
        had_indet = False
        for det in dets:
            if not isinstance(det, dict):
                continue
            determination = str(det.get("determination") or "")
            determinations[determination] += 1
            cid = f"{det.get('condition_id')}/{det.get('condition_version')}"
            if determination == "INDETERMINATE":
                had_indet = True
                reason_codes[str(det.get("determination_reason_code") or "missing")] += 1
                condition_indet[cid] += 1
            if integrity == "unusable" and determination == "PASS":
                invariant_hits["unusable_integrity_pass"] += 1
        if had_indet:
            urls_indet[str(row.get("url") or "")] += 1

    eligible = len(stamped)
    audits_with_indet = sum(
        1
        for row in stamped
        if any(
            isinstance(d, dict) and d.get("determination") == "INDETERMINATE"
            for d in ((_parse_json(row.get("engine_output")).get("case_file") or {}) or {}).get("determinations") or []
        )
    )
    now = datetime.now(timezone.utc)
    days_open = max(0, (now - ACTIVATED_AT).days)
    gate_ready = eligible >= GATE_AUDIT_COUNT and days_open >= GATE_DAYS
    return {
        "generated_at": now.isoformat(),
        "activation_at": ACTIVATED_AT.isoformat(),
        "completed_audits_since_activation": len(rows),
        "stamped_audits": eligible,
        "audits_with_indeterminate": audits_with_indet,
        "determination_counts": dict(determinations),
        "indeterminate_reason_codes": dict(reason_codes),
        "indeterminate_by_condition": dict(condition_indet),
        "integrity_states": dict(integrity_states),
        "repeated_indeterminate_urls": {k: v for k, v in urls_indet.items() if v > 1},
        "invariant_hits": dict(invariant_hits),
        "gate": {
            "need_stamped_audits": GATE_AUDIT_COUNT,
            "need_days": GATE_DAYS,
            "stamped_audits": eligible,
            "days_open": days_open,
            "ready_to_revisit_scoring": gate_ready,
            "next_decision": (
                "analyze_then_decide_whether_scoring_should_change"
                if gate_ready
                else "do_not_change_scoring"
            ),
        },
    }


def main() -> int:
    import psycopg2

    conn = psycopg2.connect(DSN)
    try:
        report = collect(conn)
    finally:
        conn.close()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    json.dump(report, sys.stdout, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
