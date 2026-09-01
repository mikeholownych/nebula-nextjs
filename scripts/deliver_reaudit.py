#!/usr/bin/env python3
"""30-day re-audit delivery for Fix Pack buyers.

Scans the purchases table for rows where:
  - fulfillment_status = 'delivered'
  - reaudit_due_at <= now()
  - reaudit_sent_at IS NULL
  - livemode = TRUE
  - audit_url IS NOT NULL

For each due re-audit:
  1. Re-runs the 9-signal audit on the original URL
  2. Emails the buyer a comparison (original score vs new score, what changed)
  3. Stamps reaudit_sent_at to prevent re-delivery

Usage:
  venv/bin/python3 scripts/deliver_reaudit.py [--dry-run] [--force-email EMAIL]

Schedule via cron at 08:00 UTC daily.
"""
import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

NEBULA_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(NEBULA_DIR))

from deliver_audit import scrape_page, score_audit, send_via_agentmail  # noqa: E402

TELEGRAM_TARGET = "telegram:5920497760"
# Use the Unix socket postgres superuser path - same pattern as other scripts
DEFAULT_DB = "postgresql://postgres@/nebula_platform?host=/var/run/postgresql&port=5433"
DB_URL = os.environ.get("DATABASE_URL") or os.environ.get("AUDIT_DATABASE_URL") or DEFAULT_DB


def log(msg):
    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    print(f"[{ts}] {msg}", flush=True)


def telegram_notify(message):
    try:
        subprocess.run(
            ["hermes", "send", "--to", TELEGRAM_TARGET, message],
            capture_output=True, timeout=15,
        )
    except Exception as e:
        log(f"telegram notify failed: {e}")


def get_due_reaudits(conn):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, customer_email, audit_url, stripe_session_id, created_at
            FROM purchases
            WHERE fulfillment_status = 'delivered'
              AND reaudit_due_at <= now()
              AND reaudit_sent_at IS NULL
              AND livemode = TRUE
              AND audit_url IS NOT NULL
            ORDER BY reaudit_due_at
            LIMIT 20
            """
        )
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, row)) for row in cur.fetchall()]


def mark_sent(conn, purchase_id):
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE purchases SET reaudit_sent_at = now() WHERE id = %s",
            (purchase_id,),
        )
    conn.commit()


def grade_label(score):
    if score >= 9.0:
        return "A"
    if score >= 8.0:
        return "B"
    if score >= 7.0:
        return "C"
    if score >= 5.0:
        return "D"
    return "F"


def build_email_body(url, original_score, new_score, new_findings, purchase_date, transitions=None):
    grade = grade_label(new_score)
    delta = new_score - (original_score or new_score)
    delta_str = f"+{delta:.1f}" if delta >= 0 else f"{delta:.1f}"

    critical = [f for f in new_findings if f.get("impact", 0) >= 7]
    top_3 = sorted(new_findings, key=lambda f: -f.get("impact", 0))[:3]

    findings_text = "\n".join(
        f"  • {f.get('label', '?')} (impact {f.get('impact', 0)}/10)\n"
        f"    {f.get('issue', '')}"
        for f in top_3
    ) if top_3 else "  No failing signals detected."

    transition_lines = []
    for row in transitions or []:
        mark = "VERIFIED condition change" if row.get("verified_condition_change") else "observed change"
        transition_lines.append(
            f"  • {row.get('condition_id')} v{row.get('condition_version')}: "
            f"{row.get('from') or 'n/a'} -> {row.get('to') or 'n/a'} ({mark})"
        )
    transitions_text = "\n".join(transition_lines) if transition_lines else "  No condition transitions vs the original audit."

    subject = f"Your 30-day re-audit: {url} - {grade} ({new_score:.1f}/10)"

    body = f"""Hi,

Your 30-day re-audit for:
  {url}

Score: {new_score:.1f}/10  (Grade {grade})  [{delta_str} vs your original audit]

Condition changes (same condition ID and version only):
{transitions_text}

NOT ESTABLISHED: conversion or revenue impact. A condition changing from FAIL to PASS means the observed page condition changed. It does not prove conversion changed.

Top remaining signals to address:
{findings_text}

---
Next step: If you implemented the fix and the condition did not change, reply to this email with what you changed and I'll take a look.

If you haven't implemented the fix yet, the One-Leak Repair Sprint kit is still in your inbox from {purchase_date}.

Run another free audit anytime at https://nebulacomponents.com/audit?utm_source=email&utm_medium=reaudit

-
Mike
Nebula Components
"""
    return subject, body


def lookup_predecessor(conn, email, url, before):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, score, findings, engine_output, completed_at
            FROM audits
            WHERE lower(coalesce(email,'')) = lower(%s)
              AND url = %s
              AND status = 'completed'
              AND completed_at <= %s
            ORDER BY completed_at DESC
            LIMIT 1
            """,
            (email or "", url, before),
        )
        row = cur.fetchone()
        if not row:
            return None
        cols = [d[0] for d in cur.description]
        return dict(zip(cols, row))


def _case_file_rows(audit_or_output):
    if not isinstance(audit_or_output, dict):
        return []
    case_file = audit_or_output.get("case_file")
    if isinstance(case_file, dict) and isinstance(case_file.get("determinations"), list):
        return case_file["determinations"]
    engine_output = audit_or_output.get("engine_output")
    if isinstance(engine_output, str):
        try:
            engine_output = json.loads(engine_output)
        except json.JSONDecodeError:
            engine_output = {}
    if isinstance(engine_output, dict):
        nested = engine_output.get("case_file") or {}
        if isinstance(nested, dict) and isinstance(nested.get("determinations"), list):
            return nested["determinations"]
    return []


def ensure_reaudit_columns(conn):
    with conn.cursor() as cur:
        cur.execute("ALTER TABLE purchases ADD COLUMN IF NOT EXISTS predecessor_audit_id UUID")
        cur.execute("ALTER TABLE purchases ADD COLUMN IF NOT EXISTS reaudit_condition_delta JSONB")
    conn.commit()


def store_reaudit_link(conn, purchase_id, predecessor_id, delta):
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE purchases
            SET predecessor_audit_id = COALESCE(%s, predecessor_audit_id),
                reaudit_condition_delta = %s
            WHERE id = %s
            """,
            (predecessor_id, json.dumps(delta), purchase_id),
        )
    conn.commit()


def run_reaudit(url):
    """Run the 9-signal audit. Returns the full audit dict."""
    page = scrape_page(url)
    return score_audit(page)


def process_purchase(purchase, conn=None, dry_run=False):
    url = purchase["audit_url"]
    email = purchase["customer_email"]
    pid = purchase["id"]
    purchase_date = str(purchase["created_at"])[:10]

    log(f"Processing purchase {pid} for {email} - URL: {url}")

    try:
        audit = run_reaudit(url)
    except Exception as e:
        log(f"  Audit failed for {url}: {e}")
        return False

    new_score = float(audit.get("overall") or audit.get("score") or 0)
    new_findings = audit.get("opp_matrix") or audit.get("findings") or []
    predecessor = None
    original_score = None
    transitions = []
    if conn is not None:
        try:
            predecessor = lookup_predecessor(conn, email, url, purchase["created_at"])
            if predecessor:
                original_score = predecessor.get("score")
                if original_score is not None:
                    original_score = float(original_score) / 10.0 if float(original_score) > 10 else float(original_score)
                from platform_api.services.epistemic import diff_determinations
                transitions = diff_determinations(
                    _case_file_rows(predecessor),
                    _case_file_rows(audit),
                )
                if not dry_run:
                    store_reaudit_link(
                        conn,
                        pid,
                        predecessor.get("id"),
                        {
                            "predecessor_audit_id": str(predecessor.get("id")),
                            "registry_version": audit.get("registry_version"),
                            "transitions": transitions,
                        },
                    )
        except Exception as e:
            log(f"  predecessor link failed: {e}")

    log(f"  Score: {new_score:.1f} | Findings: {len(new_findings)} | transitions: {len(transitions)}")

    subject, body = build_email_body(
        url=url,
        original_score=original_score,
        new_score=new_score,
        new_findings=new_findings,
        purchase_date=purchase_date,
        transitions=transitions,
    )

    if dry_run:
        log(f"  [DRY RUN] Would send to {email}:")
        log(f"  Subject: {subject}")
        log(f"  Body preview: {body[:200]}...")
        return True

    try:
        send_via_agentmail(
            to=email,
            subject=subject,
            body=body,
        )
        log(f"  Re-audit email sent to {email}")
        return True
    except Exception as e:
        log(f"  Email send failed for {email}: {e}")
        return False


def write_verification_ledger(conn) -> None:
    """Refresh ledgers/repair_verification.json: how many delivered re-audits
    exist, and of the conditions they re-observed, how many moved FAIL->PASS.
    Facts about condition-state changes only; no conversion claims."""
    import json as _json
    from datetime import datetime, timezone
    ledger_path = Path(__file__).resolve().parent.parent / "ledgers" / "repair_verification.json"
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT reaudit_condition_delta
                FROM purchases
                WHERE reaudit_condition_delta IS NOT NULL
                """
            )
            rows = cur.fetchall()
    except Exception as e:
        log(f"verification ledger query failed: {e}")
        return

    reaudits = len(rows)
    conditions_reobserved = 0
    fail_to_pass = 0
    fail_to_fail = 0
    for (delta,) in rows:
        if isinstance(delta, str):
            try:
                delta = _json.loads(delta)
            except Exception:
                continue
        if not isinstance(delta, dict):
            continue
        for _cid, change in delta.items():
            if not isinstance(change, dict):
                continue
            conditions_reobserved += 1
            before = str(change.get("before", "")).upper()
            after = str(change.get("after", "")).upper()
            if before == "FAIL" and after == "PASS":
                fail_to_pass += 1
            elif before == "FAIL" and after == "FAIL":
                fail_to_fail += 1

    ledger_path.parent.mkdir(exist_ok=True)
    ledger_path.write_text(_json.dumps({
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "delivered_reaudits": reaudits,
        "conditions_reobserved": conditions_reobserved,
        "fail_to_pass": fail_to_pass,
        "fail_to_fail": fail_to_fail,
        "note": "Condition-state changes on re-observation. Not conversion claims.",
    }, indent=2))
    log(f"verification ledger written: {ledger_path}")


def main():
    parser = argparse.ArgumentParser(description="Deliver 30-day re-audits")
    parser.add_argument("--dry-run", action="store_true", help="Print without sending")
    parser.add_argument("--force-email", help="Override target email (for testing)")
    args = parser.parse_args()

    import psycopg2
    try:
        conn = psycopg2.connect(DB_URL)
    except Exception as e:
        log(f"ERROR: DB connection failed: {e}")
        sys.exit(1)

    try:
        ensure_reaudit_columns(conn)
    except Exception as e:
        log(f"reaudit column ensure failed: {e}")

    due = get_due_reaudits(conn)
    log(f"Found {len(due)} re-audit(s) due")

    write_verification_ledger(conn)

    if not due:
        conn.close()
        return

    delivered = 0
    failed = 0
    for purchase in due:
        if args.force_email:
            purchase = {**purchase, "customer_email": args.force_email}

        ok = process_purchase(purchase, conn=conn, dry_run=args.dry_run)
        if ok and not args.dry_run:
            mark_sent(conn, purchase["id"])
            delivered += 1
        elif not ok:
            failed += 1

    conn.close()

    summary = f"Re-audit run complete: {delivered} delivered, {failed} failed, {len(due)} total due"
    log(summary)

    if (delivered > 0 or failed > 0) and not args.dry_run:
        telegram_notify(f"📊 {summary}")


if __name__ == "__main__":
    main()
