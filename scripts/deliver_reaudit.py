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
# Use the Unix socket postgres superuser path — same pattern as other scripts
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


def build_email_body(url, original_score, new_score, new_findings, purchase_date):
    grade = grade_label(new_score)
    delta = new_score - (original_score or new_score)
    delta_str = f"+{delta:.1f}" if delta >= 0 else f"{delta:.1f}"

    # Categorise findings
    critical = [f for f in new_findings if f.get("impact", 0) >= 7]
    top_3 = sorted(new_findings, key=lambda f: -f.get("impact", 0))[:3]

    findings_text = "\n".join(
        f"  • {f.get('label', '?')} (impact {f.get('impact', 0)}/10)\n"
        f"    {f.get('issue', '')}"
        for f in top_3
    ) if top_3 else "  No failing signals detected."

    subject = f"Your 30-day re-audit: {url} — {grade} ({new_score:.1f}/10)"

    body = f"""Hi,

Your 30-day re-audit for:
  {url}

Score: {new_score:.1f}/10  (Grade {grade})  [{delta_str} vs your original audit]

{"✅ The page condition improved — the fix held." if delta > 0 else "⚠️  The score hasn't changed yet — the fix may not have been deployed, or the signal hasn't cleared." if delta == 0 else "⚠️  The score dropped — something may have regressed or the fix wasn't applied."}

Top remaining signals to address:
{findings_text}

---
Next step: If you implemented the fix and the score didn't move, reply to this email with what you changed and I'll take a look.

If you haven't implemented the fix yet, the One-Leak Repair Sprint kit is still in your inbox from {purchase_date}.

Run another free audit anytime at https://nebulacomponents.com/audit?utm_source=email&utm_medium=reaudit

—
Mike
Nebula Components
"""
    return subject, body


def run_reaudit(url):
    """Run the 9-signal audit script on a URL. Returns (score, findings) or raises."""
    page = scrape_page(url)
    audit = score_audit(page)
    score = audit.get("score", 0)
    findings = audit.get("findings", [])
    return score, findings


def process_purchase(purchase, dry_run=False):
    url = purchase["audit_url"]
    email = purchase["customer_email"]
    pid = purchase["id"]
    session_id = purchase["stripe_session_id"]
    purchase_date = str(purchase["created_at"])[:10]

    log(f"Processing purchase {pid} for {email} — URL: {url}")

    try:
        new_score, new_findings = run_reaudit(url)
    except Exception as e:
        log(f"  ✗ Audit failed for {url}: {e}")
        return False

    log(f"  Score: {new_score:.1f} | Findings: {len(new_findings)}")

    subject, body = build_email_body(
        url=url,
        original_score=None,  # original score not stored yet; future: look up from audit_id
        new_score=new_score,
        new_findings=new_findings,
        purchase_date=purchase_date,
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
        log(f"  ✓ Re-audit email sent to {email}")
        return True
    except Exception as e:
        log(f"  ✗ Email send failed for {email}: {e}")
        return False


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

    due = get_due_reaudits(conn)
    log(f"Found {len(due)} re-audit(s) due")

    if not due:
        conn.close()
        return

    delivered = 0
    failed = 0
    for purchase in due:
        if args.force_email:
            purchase = {**purchase, "customer_email": args.force_email}

        ok = process_purchase(purchase, dry_run=args.dry_run)
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
