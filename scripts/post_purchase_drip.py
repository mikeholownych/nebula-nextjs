#!/usr/bin/env python3
"""Post-purchase drip for $97 One-Leak Repair Sprint buyers.

Triggered by crm_hooks.purchase_completed() after Stripe confirms payment.
Sends 3 emails over 14 days:

  D3  — Check-in: have you applied the fix yet?
  D7  — Re-audit reminder + $29/mo subscription CTA
  D14 — Subscription last touch (suppressed if they subscribed)

All sends go through the outbound_delivery.db release gate (same as
outreach). Sequence is suppressed per-recipient if they subscribe before
the next step fires.

Usage (direct):
  venv/bin/python3 scripts/post_purchase_drip.py --email buyer@example.com
    --audit-url https://example.com --finding "Social proof missing near CTA"
    [--dry-run]

Usage (cron / daemon — processes pending steps):
  venv/bin/python3 scripts/post_purchase_drip.py --run-pending [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import os
import sqlite3
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode

NEBULA_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(NEBULA_DIR))
sys.path.insert(0, str(NEBULA_DIR / "venv" / "lib" / "python3.12" / "site-packages"))

DRIP_DB = NEBULA_DIR / "lead_gen" / "post_purchase_drip.db"
INBOX = "nebulashop@agentmail.to"
STRIPE_97_LINK = "https://buy.stripe.com/5kQbJ1eawdj6eql1Jg43S0h"
STRIPE_PRO_LINK = "https://nebulacomponents.com/pricing"  # links to pricing page; Pro CTA is there

# Step definitions — days after purchase_ts
STEPS = [
    {
        "step_id": "d3_check_in",
        "day": 3,
        "subject_template": "Did the {finding_label} fix land?",
        "body_template": """\
Quick check-in on {audit_url}.

Your audit flagged {finding_label} as the top conversion leak. If you've \
applied the fix — or had it applied — the fastest way to confirm it held is \
to re-run the same audit on your page.

Run the same audit again (free, takes 90 seconds):
https://nebulacomponents.com/audit?url={audit_url_encoded}&utm_source=drip&utm_medium=email&utm_campaign=d3_checkin

If you ran into any friction implementing it, just reply. I can clarify or \
adjust the kit for your specific setup.

- Nebula Components
""",
    },
    {
        "step_id": "d7_reaudit",
        "day": 7,
        "subject_template": "30-day re-audit window — {audit_domain}",
        "body_template": """\
Your 30-day re-audit window is included with the repair sprint.

Run it now while your changes are fresh:
https://nebulacomponents.com/audit?url={audit_url_encoded}&utm_source=drip&utm_medium=email&utm_campaign=d7_reaudit

The re-audit checks the same signals as the original. If {finding_label} \
still shows as failing, the implementation needs adjustment — reply and I'll \
help you fix that.

──

If the fix held, pages like yours tend to drift. The most common pattern: \
a developer pushes a change, the CTA moves, the social proof disappears, \
the score drops, and nobody notices for months.

Pro monitoring watches your page weekly and alerts you when any signal drops. \
$29/month. Cancel any time.

https://nebulacomponents.com/pricing?utm_source=drip&utm_medium=email&utm_campaign=d7_reaudit

- Nebula Components
""",
    },
    {
        "step_id": "d14_subscription",
        "day": 14,
        "subject_template": "One thing that catches drift before your ads notice",
        "body_template": """\
Two weeks since the sprint. One thing worth knowing:

Most conversion drops are silent. The page looks fine. The CTA is still \
there. But something small changed — a headline got edited, a trust block \
got moved below the fold on mobile, a form label disappeared — and the \
score dropped without anyone noticing.

The only way to catch it before your ad spend does is to re-audit \
consistently.

Pro monitoring does this automatically: weekly audit on any page you \
add, Telegram or email alert if a signal drops, score history so you can \
see when it changed and what caused it.

$29/month. You can add the page you just fixed and see whether it holds.

https://nebulacomponents.com/pricing?utm_source=drip&utm_medium=email&utm_campaign=d14_subscription

If the fixed page is already converted and running well — that's the \
outcome. Nothing more to do.

- Nebula Components
""",
    },
]


def _init_db() -> sqlite3.Connection:
    DRIP_DB.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(str(DRIP_DB))
    db.execute("""
        CREATE TABLE IF NOT EXISTS drip_sequences (
            email TEXT NOT NULL,
            audit_url TEXT NOT NULL,
            finding_label TEXT NOT NULL DEFAULT '',
            purchase_ts REAL NOT NULL,
            suppressed INTEGER NOT NULL DEFAULT 0,
            suppressed_reason TEXT,
            created_at REAL NOT NULL DEFAULT (unixepoch()),
            PRIMARY KEY (email)
        )
    """)
    db.execute("""
        CREATE TABLE IF NOT EXISTS drip_sends (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            step_id TEXT NOT NULL,
            sent_at REAL,
            status TEXT NOT NULL DEFAULT 'pending',
            message_id TEXT,
            error TEXT,
            scheduled_for REAL NOT NULL,
            UNIQUE(email, step_id)
        )
    """)
    db.commit()
    return db


def enroll(email: str, audit_url: str, finding_label: str, purchase_ts: float | None = None) -> None:
    """Enroll a buyer in the post-purchase drip. Idempotent."""
    purchase_ts = purchase_ts or time.time()
    db = _init_db()
    try:
        db.execute("""
            INSERT OR IGNORE INTO drip_sequences (email, audit_url, finding_label, purchase_ts)
            VALUES (?, ?, ?, ?)
        """, (email.strip().lower(), audit_url, finding_label, purchase_ts))

        # Schedule the 3 steps
        for step in STEPS:
            scheduled_for = purchase_ts + (step["day"] * 86400)
            db.execute("""
                INSERT OR IGNORE INTO drip_sends (email, step_id, scheduled_for)
                VALUES (?, ?, ?)
            """, (email.strip().lower(), step["step_id"], scheduled_for))

        db.commit()
        print(f"[drip] Enrolled {email} — {len(STEPS)} steps scheduled", flush=True)
    finally:
        db.close()


def suppress(email: str, reason: str = "subscribed") -> None:
    """Suppress all future drip emails for this buyer (e.g. they subscribed)."""
    db = _init_db()
    try:
        db.execute("""
            UPDATE drip_sequences SET suppressed = 1, suppressed_reason = ?
            WHERE email = ?
        """, (reason, email.strip().lower()))
        db.commit()
        print(f"[drip] Suppressed {email}: {reason}", flush=True)
    finally:
        db.close()


def _is_suppressed(db: sqlite3.Connection, email: str) -> bool:
    """Check if the buyer is suppressed (subscribed, opted out, bounced)."""
    row = db.execute(
        "SELECT suppressed FROM drip_sequences WHERE email = ?",
        (email,)
    ).fetchone()
    return bool(row and row[0])


def _is_subscribed(email: str) -> bool:
    """Check PostgreSQL for an active subscription — suppresses d7/d14 CTA."""
    try:
        env_file = NEBULA_DIR / "customer-portal" / ".env.local"
        db_url = None
        for line in env_file.read_text().splitlines():
            if line.startswith("DATABASE_URL="):
                db_url = line.split("=", 1)[1].strip()
                break
        if not db_url:
            return False

        import psycopg
        conn = psycopg.connect(db_url)
        row = conn.execute(
            "SELECT 1 FROM customers WHERE email = $1 AND subscription_status = 'active' LIMIT 1",
            (email.strip().lower(),)
        ).fetchone()
        conn.close()
        return row is not None
    except Exception:
        return False  # fail open — still send, better than missing


def _is_bounced(email: str) -> bool:
    """Check outbound_delivery.db for a hard bounce on this recipient."""
    try:
        from lead_store import LeadStore
        store = LeadStore()
        return store.is_bounced(email)
    except Exception:
        pass
    # Fallback: check suppression list
    sup_path = NEBULA_DIR / "ledgers" / "suppression_list.jsonl"
    if sup_path.exists():
        for line in sup_path.read_text().splitlines():
            try:
                row = json.loads(line)
                if row.get("email", "").lower() == email.strip().lower():
                    return True
            except Exception:
                continue
    return False


def _send_step(email: str, step: dict, seq: dict, dry_run: bool = False) -> str:
    """Compose and send one drip step. Returns 'sent', 'dry_run', or 'error:<msg>'."""
    from agentmail_client import AgentMailClient

    audit_url = seq["audit_url"]
    finding_label = seq["finding_label"] or "the top conversion leak"
    try:
        from urllib.parse import urlparse
        audit_domain = urlparse(audit_url).netloc or audit_url
    except Exception:
        audit_domain = audit_url

    audit_url_encoded = urlencode({"url": audit_url})[4:]  # strip 'url='

    subject = step["subject_template"].format(
        finding_label=finding_label,
        audit_url=audit_url,
        audit_domain=audit_domain,
    )
    body = step["body_template"].format(
        finding_label=finding_label,
        audit_url=audit_url,
        audit_url_encoded=audit_url_encoded,
        audit_domain=audit_domain,
        stripe_97=STRIPE_97_LINK,
        stripe_pro=STRIPE_PRO_LINK,
    )

    if dry_run:
        print(f"\n=== DRY RUN: {step['step_id']} → {email} ===")
        print(f"Subject: {subject}")
        print(body)
        return "dry_run"

    try:
        client = AgentMailClient(inbox=INBOX)
        result = client.send(
            to=[email],
            subject=subject,
            text=body,
            labels=["post_purchase_drip", step["step_id"]],
        )
        if result.get("_error"):
            return f"error:{result.get('_reason', 'unknown')}"
        return result.get("message_id") or result.get("id") or "sent"
    except Exception as exc:
        return f"error:{exc}"


def run_pending(dry_run: bool = False) -> None:
    """Process all steps that are due. Called by cron every 2h."""
    db = _init_db()
    now = time.time()

    due = db.execute("""
        SELECT ds.email, ds.step_id, ds.scheduled_for,
               seq.audit_url, seq.finding_label, seq.purchase_ts, seq.suppressed
        FROM drip_sends ds
        JOIN drip_sequences seq ON ds.email = seq.email
        WHERE ds.status = 'pending'
          AND ds.scheduled_for <= ?
        ORDER BY ds.scheduled_for ASC
    """, (now,)).fetchall()

    print(f"[drip] {len(due)} step(s) due", flush=True)

    for row in due:
        email, step_id, scheduled_for, audit_url, finding_label, purchase_ts, suppressed = row

        # Skip suppressed sequences
        if suppressed:
            db.execute(
                "UPDATE drip_sends SET status='suppressed' WHERE email=? AND step_id=?",
                (email, step_id)
            )
            db.commit()
            print(f"[drip] SKIP {step_id} → {email}: suppressed", flush=True)
            continue

        # Check real-time subscription (suppress d7/d14 if subscribed)
        if step_id in ("d7_reaudit", "d14_subscription") and _is_subscribed(email):
            suppress(email, reason="subscribed")
            db.execute(
                "UPDATE drip_sends SET status='suppressed' WHERE email=? AND step_id=?",
                (email, step_id)
            )
            db.commit()
            print(f"[drip] SKIP {step_id} → {email}: already subscribed", flush=True)
            continue

        # Check bounce
        if _is_bounced(email):
            suppress(email, reason="bounced")
            db.execute(
                "UPDATE drip_sends SET status='suppressed' WHERE email=? AND step_id=?",
                (email, step_id)
            )
            db.commit()
            print(f"[drip] SKIP {step_id} → {email}: bounced", flush=True)
            continue

        step_def = next((s for s in STEPS if s["step_id"] == step_id), None)
        if not step_def:
            print(f"[drip] ERROR: unknown step_id {step_id}", flush=True)
            continue

        seq = {"audit_url": audit_url, "finding_label": finding_label}
        result = _send_step(email, step_def, seq, dry_run=dry_run)

        if dry_run:
            continue

        if result.startswith("error:"):
            db.execute(
                "UPDATE drip_sends SET status='error', error=?, sent_at=? WHERE email=? AND step_id=?",
                (result[6:], now, email, step_id)
            )
            print(f"[drip] ERROR {step_id} → {email}: {result[6:]}", flush=True)
        else:
            db.execute(
                "UPDATE drip_sends SET status='sent', message_id=?, sent_at=? WHERE email=? AND step_id=?",
                (result, now, email, step_id)
            )
            print(f"[drip] SENT {step_id} → {email}: {result}", flush=True)

        db.commit()

    db.close()


def _status(email: str) -> None:
    db = _init_db()
    seq = db.execute(
        "SELECT * FROM drip_sequences WHERE email = ?", (email,)
    ).fetchone()
    if not seq:
        print(f"No drip sequence found for {email}")
        db.close()
        return
    print(f"Sequence: {dict(zip(['email','audit_url','finding_label','purchase_ts','suppressed','suppressed_reason','created_at'], seq))}")
    sends = db.execute(
        "SELECT step_id, status, scheduled_for, sent_at, message_id, error FROM drip_sends WHERE email = ?",
        (email,)
    ).fetchall()
    for s in sends:
        scheduled = datetime.fromtimestamp(s[2], tz=timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        print(f"  {s[0]:20} {s[1]:12} scheduled={scheduled} sent={s[3]} msg={s[4]} err={s[5]}")
    db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Post-purchase drip for $97 repair sprint buyers")
    sub = parser.add_subparsers(dest="cmd")

    enroll_p = sub.add_parser("enroll", help="Enroll a buyer")
    enroll_p.add_argument("--email", required=True)
    enroll_p.add_argument("--audit-url", required=True)
    enroll_p.add_argument("--finding", default="", help="Top failing signal label")
    enroll_p.add_argument("--purchase-ts", type=float, default=None)

    run_p = sub.add_parser("run-pending", help="Process due steps (cron)")
    run_p.add_argument("--dry-run", action="store_true")

    sup_p = sub.add_parser("suppress", help="Suppress a recipient")
    sup_p.add_argument("--email", required=True)
    sup_p.add_argument("--reason", default="manual")

    stat_p = sub.add_parser("status", help="Show sequence status for email")
    stat_p.add_argument("--email", required=True)

    args = parser.parse_args()

    if args.cmd == "enroll":
        enroll(args.email, args.audit_url, args.finding, args.purchase_ts)
    elif args.cmd == "run-pending":
        run_pending(dry_run=args.dry_run)
    elif args.cmd == "suppress":
        suppress(args.email, args.reason)
    elif args.cmd == "status":
        _status(args.email)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
