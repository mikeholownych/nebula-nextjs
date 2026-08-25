#!/usr/bin/env python3
"""Backfill durable findings from audits.findings JSONB.

Reads every audit with non-empty findings, creates one findings row per
(domain, signal_key), keeps the highest-impact variant, appends
finding_events rows for first detection and any re-detections.

Idempotent: re-running updates last_seen_at / evidence instead of duplicating.
Dry-run by default; pass --commit to write.
"""
import json
import sys
from urllib.parse import urlparse

import psycopg2

DSN = "host=/var/run/postgresql port=5433 dbname=nebula_audit user=postgres"

VALID_STATUS = {
    "new", "acknowledged", "in_progress", "resolved",
    "accepted_risk", "ignored", "regressed",
}


def normalize_domain(url: str) -> str:
    host = urlparse(url).netloc.lower()
    return host[4:] if host.startswith("www.") else host


def next_public_id(cur) -> str:
    cur.execute("SELECT nextval('finding_public_id_seq')")
    return f"NBL-{cur.fetchone()[0]}"


def main(commit: bool) -> None:
    conn = psycopg2.connect(DSN)
    cur = conn.cursor()

    cur.execute(
        """
        SELECT id, url, email, findings, created_at, completed_at
        FROM audits
        WHERE findings IS NOT NULL
          AND jsonb_typeof(findings) = 'array'
          AND jsonb_array_length(findings) > 0
        ORDER BY created_at ASC
        """
    )
    audits = cur.fetchall()
    print(f"audits with findings: {len(audits)}")

    stats = {"rows_created": 0, "rows_updated": 0, "events": 0, "skipped_bad": 0}
    seen: dict = {}

    for audit_id, url, _email, payload, created, completed in audits:
        try:
            items = json.loads(json.dumps(payload))
        except Exception:
            stats["skipped_bad"] += 1
            continue
        domain = normalize_domain(url or "")
        if not domain or "." not in domain:
            stats["skipped_bad"] += 1
            continue
        for item in items:
            if not isinstance(item, dict):
                continue
            key = item.get("key")
            if not key:
                stats["skipped_bad"] += 1
                continue
            impact = float(item.get("impact") or 0)
            k = (domain, key)
            rec = {
                "item": item,
                "audit_id": str(audit_id),
                "seen": created,
                "last_seen": completed or created,
                "impact": impact,
            }
            prev = seen.get(k)
            if prev is None or impact > prev["impact"]:
                if prev is not None:
                    rec["first_seen"] = prev.get("first_seen", prev["seen"])
                else:
                    rec["first_seen"] = rec["seen"]
                seen[k] = rec
            else:
                # keep earlier first_seen, extend last_seen window
                prev_first = prev.get("first_seen", prev["seen"])
                prev["last_seen"] = max(prev["last_seen"], rec["last_seen"])
                prev.setdefault("redetect", []).append(str(audit_id))

    for (domain, key), rec in seen.items():
        item = rec["item"]
        cur.execute(
            "SELECT id FROM findings WHERE domain=%s AND signal_key=%s",
            (domain, key),
        )
        row = cur.fetchone()
        evidence_class = "observed"
        prov = item.get("scoring_provenance") or {}
        basis = str(prov.get("basis", "")).lower()
        if "rule" not in basis and basis:
            evidence_class = "inferred"

        if row is None:
            public_id = next_public_id(cur)
            cur.execute(
                """
                INSERT INTO findings (
                    public_id, audit_id, domain, signal_key, label, issue, fix,
                    quadrant, impact, effort, signal_type, evidence,
                    scoring_provenance, evidence_class, status,
                    first_seen_at, last_seen_at, created_at, updated_at
                ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'new',%s,%s,now(),now())
                RETURNING id
                """,
                (
                    public_id, rec["audit_id"], domain, key,
                    item.get("label"), item.get("issue"), item.get("fix"),
                    item.get("quadrant"), item.get("impact"), item.get("effort"),
                    item.get("signal_type"),
                    json.dumps(item.get("evidence")) if item.get("evidence") else None,
                    json.dumps(prov) if prov else None,
                    evidence_class,
                    rec.get("first_seen", rec["seen"]), rec["last_seen"],
                ),
            )
            row_out = cur.fetchone()
            if row_out is None:
                raise RuntimeError('INSERT RETURNING produced no row')
            fid = row_out[0]
            stats["rows_created"] += 1
            cur.execute(
                """
                INSERT INTO finding_events (finding_id, event_type, new_status, audit_id, occurred_at)
                VALUES (%s,'detected','new',%s,%s)
                """,
                (fid, rec["audit_id"], rec.get("first_seen", rec["seen"])),
            )
            stats["events"] += 1
        else:
            fid = row[0]
            cur.execute(
                """
                UPDATE findings SET
                    label=COALESCE(%s,label), issue=COALESCE(%s,issue),
                    fix=COALESCE(%s,fix), quadrant=COALESCE(%s,quadrant),
                    impact=GREATEST(impact,%s), effort=COALESCE(%s,effort),
                    evidence=COALESCE(%s,evidence),
                    scoring_provenance=COALESCE(%s,scoring_provenance),
                    last_seen_at=GREATEST(last_seen_at,%s), updated_at=now()
                WHERE id=%s
                """,
                (
                    item.get("label"), item.get("issue"), item.get("fix"),
                    item.get("quadrant"), item.get("impact"), item.get("effort"),
                    json.dumps(item.get("evidence")) if item.get("evidence") else None,
                    json.dumps(prov) if prov else None,
                    rec["last_seen"], fid,
                ),
            )
            stats["rows_updated"] += 1

    if commit:
        conn.commit()
    else:
        conn.rollback()

    print(f"unique (domain,signal): {len(seen)}")
    print(f"stats: {json.dumps(stats)} mode={'COMMIT' if commit else 'DRY-RUN'}")
    cur.close()
    conn.close()


if __name__ == "__main__":
    main(commit="--commit" in sys.argv)
