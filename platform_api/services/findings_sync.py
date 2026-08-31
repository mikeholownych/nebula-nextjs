"""Durable findings sync.

Called when an audit completes. Reconciles the audit's findings array against
the durable findings store:

- signal present  + no durable row      -> create (status 'new', 'detected')
- signal present  + row already open    -> touch last_seen ('redetected')
- signal present  + row resolved/settled -> flip to 'regressed' (re-detection)
- signal absent   + row still open      -> auto-resolve (fixed)
- signal absent   + row already settled -> leave untouched

Idempotent per audit: every event carries request_id 'sync:<audit_id>' and is
skipped if that exact event already exists. Out-of-order protection: an audit
older than a finding's last_seen_at never mutates it.

Failure contract: callers wrap this in try/except; a sync failure must never
break audit completion.
"""

from __future__ import annotations

import json
import uuid
from typing import Any

import psycopg2
import psycopg2.extras


def _domain_from_url(url: str | None) -> str | None:
    if not url:
        return None
    host = url.split("//", 1)[-1].split("/", 1)[0].strip().lower()
    if host.startswith("www."):
        host = host[4:]
    return host or None


def _provenance(f: dict[str, Any], page_intent: str | None = None) -> dict[str, Any]:
    prov = dict(f.get("scoring_provenance") or {})
    for key in (
        "condition_id",
        "condition_version",
        "registry_version",
        "determination",
        "determination_reason_code",
        "observation_integrity",
        "observation_integrity_reason",
        "determination_confidence",
        "not_established",
    ):
        if f.get(key) is not None:
            prov[key] = f[key]
    if page_intent:
        prov.setdefault("page_intent", page_intent)
    if prov.get("determination") in {"FAIL", "REVIEW"} and not prov.get("not_established"):
        from platform_api.services.epistemic import NOT_ESTABLISHED_DEFAULT
        prov["not_established"] = NOT_ESTABLISHED_DEFAULT
    return prov


def _evidence_class(f: dict[str, Any]) -> str:
    ev = f.get("evidence") or {}
    measured = ev.get("measured")
    if isinstance(measured, (int, float)) or ev.get("confidence"):
        return "observed"
    return "inferred"


def sync_findings_for_audit(audit_id: str, dsn: str) -> dict:
    """Reconcile one completed audit into the findings store. Returns counts."""
    conn = psycopg2.connect(dsn)
    counts = {
        "created": 0,
        "redetected": 0,
        "regressed": 0,
        "resolved": 0,
        "skipped_stale": 0,
        "not_applicable": 0,
        "skipped_not_applicable": 0,
    }
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, url, email, findings, status,
                       COALESCE(completed_at, created_at) AS finished_at,
                       page_intent
                FROM audits WHERE id = %s
                """,
                (audit_id,),
            )
            audit = cur.fetchone()
            if not audit or audit["status"] != "completed":
                return {"error": f"audit {audit_id} not found or not completed"}

            domain = _domain_from_url(audit["url"])
            if not domain:
                return {"error": f"audit {audit_id} has no parsable domain"}

            # Page intent gates signal relevance. Null / unknown -> no gating.
            page_intent: str = (audit.get("page_intent") or "unknown") or "unknown"

            raw = audit["findings"]
            if isinstance(raw, str):
                raw = json.loads(raw)
            incoming_all = [
                f for f in (raw or [])
                if isinstance(f, dict) and f.get("key")
            ]

            # Failures stay in the workspace lifecycle. NOT_APPLICABLE is
            # recorded on the audit case file and must not auto-resolve
            # an open finding as if the condition passed.
            try:
                from platform_api.services.epistemic import gated_signal_keys
                from platform_api.services.signal_intent_map import is_relevant
                incoming = [
                    f for f in incoming_all
                    if is_relevant(str(f["key"]), page_intent)
                    and f.get("determination") != "NOT_APPLICABLE"
                ]
                counts["not_applicable"] = len(incoming_all) - len(incoming)
            except Exception:
                incoming = incoming_all
                counts["not_applicable"] = 0

            incoming_keys = [str(f["key"]) for f in incoming]
            sync_marker = f"sync:{audit_id}"
            finished_at = audit["finished_at"]

            cur.execute(
                "SELECT id, public_id, signal_key, status, last_seen_at FROM findings WHERE domain = %s",
                (domain,),
            )
            existing = {r["signal_key"]: r for r in cur.fetchall()}

            # --- pass 1: signals present in this audit (and relevant for intent) ---
            for f in incoming:
                key = str(f["key"])
                row = existing.get(key)

                if row is None:
                    impact = f.get("impact")
                    effort = f.get("effort")
                    cur.execute(
                        """
                        INSERT INTO findings (
                            domain, signal_key, label, issue, fix, quadrant,
                            impact, effort, signal_type, evidence_class, evidence,
                            scoring_provenance, status, owner_email,
                            first_seen_at, last_seen_at
                        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'new',%s,%s,%s)
                        RETURNING id, public_id
                        """,
                        (
                            domain, key,
                            f.get("label"), f.get("issue"),
                            (f.get("evidence") or {}).get("fix_suggestion") or f.get("fix"),
                            f.get("quadrant"), impact, effort, f.get("signal_type"),
                            _evidence_class(f),
                            json.dumps(f.get("evidence") or {}),
                            json.dumps(_provenance(f, page_intent)),
                            (audit["email"] or "").strip().lower() or None,
                            finished_at, finished_at,
                        ),
                    )
                    new_row = cur.fetchone()
                    if new_row is None:
                        continue
                    cur.execute(
                        """
                        INSERT INTO finding_events (
                            finding_id, event_type, new_status,
                            note, occurred_at, request_id
                        ) VALUES (%s,'detected','new','first detection',%s,%s)
                        """,
                        (new_row["id"], finished_at, sync_marker),
                    )
                    counts["created"] += 1
                    continue

                # stale audit never mutates newer state
                if row["last_seen_at"] and finished_at < row["last_seen_at"]:
                    counts["skipped_stale"] += 1
                    continue

                cur.execute(
                    "SELECT 1 FROM finding_events WHERE finding_id=%s AND request_id=%s LIMIT 1",
                    (row["id"], sync_marker),
                )
                already = cur.fetchone()

                if not already:
                    if row["status"] in ("resolved", "accepted_risk", "ignored"):
                        cur.execute(
                            """
                            UPDATE findings SET status='regressed', resolved_at=NULL,
                                last_seen_at=%s, updated_at=now() WHERE id=%s
                            """,
                            (finished_at, row["id"]),
                        )
                        cur.execute(
                            """
                            INSERT INTO finding_events (
                                finding_id, event_type, old_status, new_status,
                                note, occurred_at, request_id
                            ) VALUES (%s,'status_changed',%s,'regressed',
                                      'signal failed again on latest audit',%s,%s)
                            """,
                            (row["id"], row["status"], finished_at, sync_marker),
                        )
                        counts["regressed"] += 1
                    else:
                        cur.execute(
                            "UPDATE findings SET last_seen_at=%s, updated_at=now() WHERE id=%s",
                            (finished_at, row["id"]),
                        )
                        cur.execute(
                            """
                            INSERT INTO finding_events (
                                finding_id, event_type, note, occurred_at, request_id
                            ) VALUES (%s,'redetected','present in latest audit',%s,%s)
                            """,
                            (row["id"], finished_at, sync_marker),
                        )
                        counts["redetected"] += 1

            na_keys = set()
            try:
                from platform_api.services.epistemic import gated_signal_keys
                na_keys = gated_signal_keys(list(existing.keys()), page_intent)
            except Exception:
                na_keys = set()

            # --- pass 2: durable open signals absent from this audit ---
            for key, row in existing.items():
                if key in incoming_keys:
                    continue
                if key in na_keys:
                    counts["skipped_not_applicable"] += 1
                    continue
                if row["status"] not in ("new", "acknowledged", "in_progress", "regressed"):
                    continue
                if row["last_seen_at"] and finished_at < row["last_seen_at"]:
                    counts["skipped_stale"] += 1
                    continue
                cur.execute(
                    "SELECT 1 FROM finding_events WHERE finding_id=%s AND request_id=%s LIMIT 1",
                    (row["id"], sync_marker),
                )
                if cur.fetchone():
                    continue
                cur.execute(
                    """
                    UPDATE findings SET status='resolved', resolved_at=%s,
                        last_seen_at=%s, updated_at=now() WHERE id=%s
                    """,
                    (finished_at, finished_at, row["id"]),
                )
                cur.execute(
                    """
                    INSERT INTO finding_events (
                        finding_id, event_type, old_status, new_status,
                        note, occurred_at, request_id
                    ) VALUES (%s,'status_changed',%s,'resolved',
                              'signal passed on latest audit (auto-resolve)',%s,%s)
                    """,
                    (row["id"], row["status"], finished_at, sync_marker),
                )
                counts["resolved"] += 1

        conn.commit()
        return {"audit_id": str(audit_id), "domain": domain, **counts}
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    import sys

    dsn = "host=/var/run/postgresql port=5433 dbname=nebula_audit user=postgres"
    for aid in sys.argv[1:]:
        print(json.dumps(sync_findings_for_audit(aid, dsn)))
