#!/usr/bin/env python3
"""Post-purchase outcome nurture — sends follow-up emails after the 30-day re-audit.

Two paths based on score change:
  IMPROVED (delta > 0):  "The fix held. Want to share your result?"
                          → soft referral + case study recruitment
  UNCHANGED/WORSE:        "What did you implement? Let me check."
                          → diagnostic follow-up to understand what happened

Runs daily at 09:00 UTC, after deliver_reaudit.py (08:00 UTC).
Silent when no qualifying rows.
"""
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

NEBULA_DIR = Path("/home/mike/nebula")
sys.path.insert(0, str(NEBULA_DIR))

from agentmail_client import AgentMailClient  # noqa: E402

TELEGRAM_TARGET = "telegram:5920497760"

REPLY_IMPROVED = """\
Hi,

Your 30-day re-audit just came back — the score moved in the right direction.

That's rare enough that I wanted to flag it. Most people buy a kit, implement something, assume it worked, and never check. You checked.

Two questions if you have a minute:

1. What did you actually implement? (I'm building a record of what fixes move the needle.)
2. Would you be willing to let me publish the before/after as an anonymized case study? No name or company unless you want it attributed. Just the finding, what changed, and the score shift.

If yes to #2, I'll draft the write-up and send it to you for approval before anything goes live.

Either way — good work.

—
Mike
Nebula Components
"""

REPLY_UNCHANGED = """\
Hi,

Your 30-day re-audit ran. The score is about the same as when you first audited.

That usually means one of three things:
1. The fix wasn't implemented yet
2. The fix was implemented but something else is overriding it
3. The finding the kit targeted wasn't the actual conversion bottleneck

Can you tell me what you changed on the page? I'll look at the specific condition again and tell you what I see.

No charge — this is part of the sprint.

—
Mike
Nebula Components
"""

REPLY_REFERRAL = """\
One more thing:

If you know another founder running paid traffic to a page that isn't converting, the free audit is worth 90 seconds of their time:
https://nebulacomponents.com/audit?utm_source=email&utm_medium=referral

—
"""


def log(msg):
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    print(f"[{ts}] {msg}", flush=True)


def telegram(msg):
    import subprocess
    try:
        subprocess.run(
            ["hermes", "send", "--to", TELEGRAM_TARGET, msg],
            capture_output=True, timeout=15,
        )
    except Exception:
        pass


def get_reaudit_eligible():
    """Purchases with reaudit_sent_at in the last 48h — ready for outcome nurture."""
    import psycopg2
    db_url = "postgresql://postgres@/nebula_platform?host=/var/run/postgresql&port=5433"

    # Ensure column exists
    try:
        conn = psycopg2.connect(db_url)
        with conn.cursor() as cur:
            cur.execute("ALTER TABLE purchases ADD COLUMN IF NOT EXISTS nurture_sent_at TIMESTAMP WITH TIME ZONE")
        conn.commit()
        conn.close()
    except Exception:
        pass

    try:
        conn = psycopg2.connect(db_url)
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, customer_email, audit_url, stripe_session_id,
                       reaudit_sent_at, created_at
                FROM purchases
                WHERE livemode = TRUE
                  AND payment_status = 'paid'
                  AND reaudit_sent_at IS NOT NULL
                  AND reaudit_sent_at > now() - INTERVAL '48 hours'
                  AND nurture_sent_at IS NULL
                ORDER BY reaudit_sent_at
                """,
            )
            cols = [d[0] for d in cur.description]
            rows = [dict(zip(cols, row)) for row in cur.fetchall()]
        conn.close()
        return rows
    except Exception as e:
        log(f"DB error: {e}")
        return []


def get_original_score(audit_url: str) -> float | None:
    """Get the original audit score for comparison."""
    try:
        import psycopg2
        conn = psycopg2.connect(
            "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433"
        )
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT score FROM audits
                WHERE url = %s AND status = 'completed'
                ORDER BY created_at ASC LIMIT 1
                """,
                (audit_url,),
            )
            row = cur.fetchone()
        conn.close()
        return row[0] / 10.0 if row else None
    except Exception:
        return None


def get_latest_score(audit_url: str) -> float | None:
    """Get the most recent audit score."""
    try:
        import psycopg2
        conn = psycopg2.connect(
            "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433"
        )
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT score FROM audits
                WHERE url = %s AND status = 'completed'
                ORDER BY created_at DESC LIMIT 1
                """,
                (audit_url,),
            )
            row = cur.fetchone()
        conn.close()
        return row[0] / 10.0 if row else None
    except Exception:
        return None


def mark_nurture_sent(purchase_id: int):
    try:
        import psycopg2
        conn = psycopg2.connect(
            "postgresql://postgres@/nebula_platform?host=/var/run/postgresql&port=5433"
        )
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE purchases SET nurture_sent_at = now() WHERE id = %s",
                (purchase_id,),
            )
        conn.commit()
        conn.close()
    except Exception as e:
        log(f"Mark nurture failed: {e}")


def main(dry_run=False):
    # Ensure column exists
    try:
        import psycopg2
        conn = psycopg2.connect(
            "postgresql://postgres@/nebula_platform?host=/var/run/postgresql&port=5433"
        )
        with conn.cursor() as cur:
            cur.execute("ALTER TABLE purchases ADD COLUMN IF NOT EXISTS nurture_sent_at TIMESTAMP WITH TIME ZONE")
        conn.commit()
        conn.close()
    except Exception:
        pass

    eligible = get_reaudit_eligible()
    log(f"Found {len(eligible)} eligible for outcome nurture")

    if not eligible:
        return

    am = AgentMailClient()
    sent = 0

    for purchase in eligible:
        email = purchase["customer_email"]
        url = purchase.get("audit_url", "")
        pid = purchase["id"]

        original = get_original_score(url)
        latest = get_latest_score(url)

        if original is None or latest is None:
            log(f"  Skipping {email} — no score data")
            continue

        delta = latest - original
        improved = delta > 0.3  # meaningful improvement threshold

        log(f"  {email} | {url} | orig={original:.1f} latest={latest:.1f} delta={delta:+.1f}")

        if improved:
            subject = f"Your re-audit: score improved on {url}"
            body = REPLY_IMPROVED + REPLY_REFERRAL
        else:
            subject = f"Your 30-day re-audit: {url} — what did you implement?"
            body = REPLY_UNCHANGED

        if dry_run:
            log(f"  [DRY RUN] Would send '{subject}' to {email}")
            continue

        try:
            result = am.send_transactional(to=[email], subject=subject, text=body)
            if result.get("message_id") or result.get("id"):
                mark_nurture_sent(pid)
                sent += 1
                log(f"  ✓ Sent nurture to {email}")
                # Alert Mike
                telegram(
                    f"📊 Outcome nurture sent\n"
                    f"To: {email}\n"
                    f"Score: {original:.1f} → {latest:.1f} ({delta:+.1f})\n"
                    f"Type: {'IMPROVED — referral ask' if improved else 'UNCHANGED — diagnostic'}"
                )
            else:
                log(f"  ✗ Send failed: {result}")
        except Exception as e:
            log(f"  ✗ Error for {email}: {e}")

        time.sleep(3)

    log(f"Done. {sent} nurture email(s) sent.")


if __name__ == "__main__":
    import sys
    main(dry_run="--dry-run" in sys.argv)
