#!/usr/bin/env python3
"""Checkout abandonment recovery email.

Finds audits where:
  - email_sent_at IS NOT NULL (user unlocked the audit)
  - paid_at IS NULL (never paid)
  - status = 'completed'
  - email NOT a test/internal address
  - created_at is between 2 and 72 hours ago (past the browse window, before going stale)
  - NOT already sent a recovery email (tracks via outbox_messages)

Sends one recovery email per audit, records it in outbox_messages to prevent
duplicate sends.

Safe to run on a cron: idempotent, flock-protected, silent when nothing to do.

Usage:
    venv/bin/python3 scripts/checkout_abandonment_recovery.py [--dry-run]
"""
import argparse
import fcntl
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

NEBULA_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(NEBULA_DIR))

LOCK_FILE = "/tmp/checkout_abandonment_recovery.lock"
CHANNEL = "checkout_abandonment_recovery"

# Window: send after 2h, stop after 72h (stale)
SEND_AFTER_HOURS = 2
STOP_AFTER_HOURS = 72

# Excluded addresses — internal / test
EXCLUDED_DOMAINS = {"example.com", "example.invalid", "invalid.nebulacomponents.com"}
EXCLUDED_PREFIXES = ("anonymous+", "qa-", "test@", "ux-audit-test@", "e2e-")


def log(msg: str) -> None:
    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    print(f"[{ts}] {msg}", flush=True)


def is_excluded(email: str) -> bool:
    email_lower = email.lower()
    domain = email_lower.split("@")[-1] if "@" in email_lower else ""
    if domain in EXCLUDED_DOMAINS:
        return True
    return any(email_lower.startswith(p) for p in EXCLUDED_PREFIXES)


def build_email(email: str, audit_id: str, url: str, score: int, grade: str, findings: list) -> dict:
    # Direct re-entry link back to their specific audit
    audit_url = f"https://nebulacomponents.com/audit/{audit_id}"
    checkout_url = f"https://nebulacomponents.com/checkout?audit_id={audit_id}&from=stripe_cancel"

    # Top failing finding for personalisation
    top_finding = None
    if findings:
        try:
            parsed = findings if isinstance(findings, list) else json.loads(findings)
            failing = [f for f in parsed if isinstance(f, dict) and f.get("score", 10) < 7]
            if failing:
                top_finding = max(failing, key=lambda f: f.get("impact", 0))
        except (json.JSONDecodeError, TypeError, KeyError):
            pass

    finding_line = ""
    if top_finding:
        label = top_finding.get("label") or top_finding.get("key", "")
        issue = top_finding.get("issue", "")
        if label:
            finding_line = f"\nYour highest-impact finding: {label}"
            if issue:
                finding_line += f"\n→ {issue[:140]}"

    domain = url.replace("https://", "").replace("http://", "").split("/")[0]

    subject = f"Your {domain} audit — the fix is ready"

    text = f"""Your audit findings for {url} are saved.

Score: {score}/10 (Grade {grade}){finding_line}

The $97 One-Leak Repair Sprint delivers the targeted fix for your highest-impact finding — exact copy, code, or configuration change for your specific page. Includes a 30-day re-audit to verify the fix held.

Resume checkout:
{checkout_url}

Or reopen your full audit:
{audit_url}

If you have questions before purchasing, reply to this email.

— Mike
Nebula Components
nebulacomponents.com"""

    # Build top finding HTML block separately to avoid nested f-string quote issues
    if top_finding:
        label_html = top_finding.get('label', '')
        issue_text = top_finding.get('issue', '')
        issue_html = f'<p style="margin:6px 0 0;font-size:13px;color:#555">{issue_text[:200]}</p>' if issue_text else ''
        finding_block = f'''<div style="border-left:3px solid #f59e0b;padding:12px 16px;margin:20px 0;background:#fffbf0;border-radius:0 8px 8px 0">
  <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#666;text-transform:uppercase;letter-spacing:.05em">Highest-impact finding</p>
  <p style="margin:0;font-weight:600;color:#1a1a1a">{label_html}</p>
  {issue_html}
</div>'''
    else:
        finding_block = ""

    html = f"""<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a1a">

<p style="font-size:14px;color:#666;margin-bottom:24px">
  <a href="https://nebulacomponents.com" style="color:#00c2a0;text-decoration:none;font-weight:600">Nebula Components</a>
</p>

<h1 style="font-size:22px;font-weight:700;margin-bottom:8px">Your audit findings for {domain} are saved.</h1>

<div style="background:#f7f7f7;border-radius:10px;padding:16px;margin:20px 0;font-family:monospace;font-size:14px">
  <span style="color:#1a1a1a;font-weight:700">{score}/10</span>
  <span style="color:#666;font-size:12px;margin-left:8px">Grade {grade} — {url}</span>
</div>

{finding_block}

<p style="color:#444;line-height:1.6">
  The <strong>$97 One-Leak Repair Sprint</strong> delivers the targeted fix for your highest-impact finding —
  exact copy, code, or configuration change written for your specific page.
  Includes a 30-day re-audit to verify the fix held.
</p>

<div style="margin:28px 0">
  <a href="{checkout_url}"
     style="background:#00c2a0;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;display:inline-block">
    Get the fix — $97 →
  </a>
</div>

<p style="font-size:13px;color:#888">
  Or <a href="{audit_url}" style="color:#00c2a0">reopen your full audit</a> to review all findings first.
</p>

<hr style="border:none;border-top:1px solid #eee;margin:32px 0">
<p style="font-size:12px;color:#aaa">
  Nebula Components · <a href="https://nebulacomponents.com" style="color:#aaa">nebulacomponents.com</a><br>
  You're receiving this because you ran a free audit and unlocked your results.
  Reply to unsubscribe.
</p>

</body>
</html>"""

    return {
        "to": email,
        "subject": subject,
        "text": text,
        "html": html,
    }


def main(dry_run: bool = False) -> None:
    import psycopg

    db_url = os.environ.get("AUDIT_DATABASE_URL") or os.environ.get("DATABASE_URL")
    if not db_url:
        log("ERROR: AUDIT_DATABASE_URL not set")
        sys.exit(1)

    platform_api = os.environ.get("PLATFORM_API_URL", "http://127.0.0.1:8001")

    with psycopg.connect(db_url) as conn:
        with conn.cursor() as cur:
            # Find eligible audits
            cur.execute("""
                SELECT a.id, a.email, a.url, a.score, a.grade, a.findings, a.email_sent_at
                FROM audits a
                WHERE a.email_sent_at IS NOT NULL
                  AND a.paid_at IS NULL
                  AND a.status = 'completed'
                  AND a.email_sent_at < now() - make_interval(hours => %s)
                  AND a.email_sent_at > now() - make_interval(hours => %s)
                  AND a.email NOT LIKE '%%@example.com'
                  AND a.email NOT LIKE '%%@example.invalid'
                  AND a.email NOT LIKE '%%invalid.nebulacomponents.com'
                  AND NOT EXISTS (
                      SELECT 1 FROM outbox_messages o
                      WHERE o.channel = %s
                        AND o.recipient = a.email
                        AND (o.payload->>'audit_id') = a.id::text
                  )
                ORDER BY a.email_sent_at DESC
            """, (SEND_AFTER_HOURS, STOP_AFTER_HOURS, CHANNEL))

            rows = cur.fetchall()

        if not rows:
            log("No eligible audits for recovery email — silent exit")
            return

        log(f"Found {len(rows)} eligible audit(s) for recovery email")



        sent = 0
        for row in rows:
            audit_id, email, url, score, grade, findings, email_sent_at = row

            if is_excluded(email):
                log(f"SKIP excluded address: {email}")
                continue

            log(f"{'[DRY RUN] ' if dry_run else ''}Sending recovery email to {email} for audit {audit_id} ({url}, {score}/10)")

            payload = build_email(email, str(audit_id), url, score or 0, grade or "?", findings or [])

            if not dry_run:
                try:
                    from agentmail_client import AgentMailClient
                    am = AgentMailClient()
                    am.send_audit(
                        to=[email],
                        subject=payload["subject"],
                        text=payload["text"],
                        html=payload["html"],
                    )
                    log(f"Email sent OK via AgentMail to {email}")
                except Exception as e:
                    log(f"ERROR sending to {email}: {e}")
                    continue

                # Record in outbox_messages to prevent duplicate sends
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO outbox_messages (channel, recipient, payload, status)
                        VALUES (%s, %s, %s, 'sent')
                    """, (
                        CHANNEL,
                        email,
                        json.dumps({"audit_id": str(audit_id), "url": url, "score": score}),
                    ))
                conn.commit()

            sent += 1

        log(f"{'[DRY RUN] ' if dry_run else ''}Done — {sent} recovery email(s) {'would be ' if dry_run else ''}sent")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Checkout abandonment recovery email")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be sent without sending")
    args = parser.parse_args()

    # flock: only one instance at a time
    lock_fd = open(LOCK_FILE, "w")
    try:
        fcntl.flock(lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        log("Another instance is running — exiting")
        sys.exit(0)

    try:
        # Load .env
        env_file = NEBULA_DIR / ".env"
        if env_file.exists():
            for line in env_file.read_text().splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, _, v = line.partition("=")
                    os.environ.setdefault(k.strip(), v.strip())

        main(dry_run=args.dry_run)
    finally:
        fcntl.flock(lock_fd, fcntl.LOCK_UN)
        lock_fd.close()
        try:
            os.unlink(LOCK_FILE)
        except OSError:
            pass
