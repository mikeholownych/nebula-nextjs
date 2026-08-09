"""Outreach sequence engine — human-mimicking multi-touch pipeline.

Manages per-prospect sequences in lead_state.db.
Runs as a cron job every 6 hours. Only sends when the right day hits.

Sequence (mirroring the framework):
  D1:  Email sent (manually or by this engine)
  D3:  LinkedIn profile view (logged, done manually by Sedrick)
  D7:  Reply-thread follow-up ("Thoughts?" + one value add)
  D12: LinkedIn DM (if connected — manual flag)
  D17: Breakup email ("I'll stop reaching out...")

State stored in: lead_gen/lead_state.db → sequence_state table
Reply detection: checks AgentMail thread for inbound messages → pauses sequence
"""
from __future__ import annotations

import json
import os
import sqlite3
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "lead_gen" / "lead_state.db"
KEY_PATH = Path.home() / ".hermes" / "secrets" / "agentmail.key"
INBOX = "nebulashop@agentmail.to"

# ── Schema ─────────────────────────────────────────────────────────────────

SCHEMA = """
CREATE TABLE IF NOT EXISTS sequence_state (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE,
    first_name    TEXT,
    product_url   TEXT,
    signal_notes  TEXT,         -- What pain signal we found (for personalization)
    audit_finding TEXT,         -- Top finding from audit (for follow-up)
    thread_id     TEXT,         -- AgentMail thread_id from D1 send
    message_id    TEXT,         -- AgentMail message_id from D1 send
    d1_sent_at    TIMESTAMP,
    d3_linkedin_viewed INTEGER DEFAULT 0,  -- 1 = done manually
    d7_sent_at    TIMESTAMP,
    d12_linkedin_dm INTEGER DEFAULT 0,     -- 1 = done manually
    d17_sent_at   TIMESTAMP,
    replied_at    TIMESTAMP,               -- Set when prospect replies → pauses all
    status        TEXT DEFAULT 'active',   -- active | replied | bounced | completed | paused
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

# ── DB helpers ─────────────────────────────────────────────────────────────

def get_db() -> sqlite3.Connection:
    db = sqlite3.connect(str(DB_PATH))
    db.row_factory = sqlite3.Row
    db.execute(SCHEMA)
    db.commit()
    return db


def register_d1_sent(
    email: str,
    first_name: str,
    thread_id: str,
    message_id: str,
    product_url: str = "",
    signal_notes: str = "",
    audit_finding: str = "",
) -> None:
    """Call this immediately after sending Day 1 email."""
    db = get_db()
    db.execute("""
        INSERT INTO sequence_state
            (email, first_name, product_url, signal_notes, audit_finding,
             thread_id, message_id, d1_sent_at, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
        ON CONFLICT(email) DO UPDATE SET
            thread_id     = EXCLUDED.thread_id,
            message_id    = EXCLUDED.message_id,
            d1_sent_at    = EXCLUDED.d1_sent_at,
            signal_notes  = COALESCE(EXCLUDED.signal_notes, sequence_state.signal_notes),
            audit_finding = COALESCE(EXCLUDED.audit_finding, sequence_state.audit_finding),
            updated_at    = CURRENT_TIMESTAMP
    """, (email, first_name, product_url, signal_notes, audit_finding,
          thread_id, message_id, datetime.now(timezone.utc).isoformat()))
    db.commit()
    db.close()


# ── AgentMail helpers ──────────────────────────────────────────────────────

def _get_key() -> str:
    return KEY_PATH.read_text().strip()


def _am_get(path: str) -> dict:
    key = _get_key()
    url = f"https://api.agentmail.to{path}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {key}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())


def _am_post(path: str, body: dict) -> dict:
    key = _get_key()
    url = f"https://api.agentmail.to{path}"
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        url, data=data, method="POST",
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return {"_error": e.code, "_body": e.read().decode()[:400]}


def has_reply(thread_id: str) -> bool:
    """Check if a prospect has replied to our thread."""
    if not thread_id:
        return False
    try:
        data = _am_get(f"/inboxes/{INBOX}/threads/{thread_id}")
        messages = data.get("messages", [])
        for msg in messages:
            labels = msg.get("labels", [])
            # Inbound non-bounce message = reply
            if "received" in labels and "sent" not in labels:
                from_addr = msg.get("from", "").lower()
                if not any(x in from_addr for x in ["mailer-daemon", "agentmail.to"]):
                    return True
    except Exception:
        pass
    return False


# ── Email templates ────────────────────────────────────────────────────────

def _d7_email(row) -> tuple[str, str]:
    """Day 7 follow-up: reply in thread with one value-add."""
    name = row["first_name"] or "there"
    finding = row["audit_finding"] or "a few conversion gaps"
    product = row["product_url"] or "your site"

    subject = f"Re: {product.replace('https://', '').replace('http://', '').split('/')[0]} — one thing holding conversions back"
    text = f"""Hey {name},

Following up on my note from last week.

Quick thought: the {finding} issue tends to compound over time — each week without addressing it is more spend going out the door.

Here's a 10-minute fix for the most common version of this:
1. Run the free audit: nebulacomponents.com/audit
2. The results show exactly which issues are costing you the most
3. The fix pack ($97) implements the top 3 changes with copy-paste prompts

If the timing's off, no worries — just thought it might be useful.

— Sedrick
Nebula Components"""

    return subject, text


def _d17_email(row) -> tuple[str, str]:
    """Day 17 breakup: final polite close."""
    name = row["first_name"] or "there"
    product = row["product_url"] or "your site"
    domain = product.replace("https://", "").replace("http://", "").split("/")[0]

    subject = f"Closing the loop on {domain}"
    text = f"""Hey {name},

Since timing seems off, I'll stop reaching out — don't want to clog your inbox.

If you ever want to run {domain} through an audit, it's always free at nebulacomponents.com/audit. No email required to see the results.

Best of luck with the launch.

— Sedrick
Nebula Components"""

    return subject, text


# ── Main sequence runner ───────────────────────────────────────────────────

def run_sequence() -> list[str]:
    """Check all active sequences and send any due touches. Returns log lines."""
    db = get_db()
    now = datetime.now(timezone.utc)
    log = []

    rows = db.execute("""
        SELECT * FROM sequence_state
        WHERE status = 'active'
    """).fetchall()

    for row in rows:
        email = row["email"]
        thread_id = row["thread_id"] or ""

        # Check for reply → pause sequence
        if has_reply(thread_id):
            db.execute("""
                UPDATE sequence_state
                SET status = 'replied', replied_at = ?, updated_at = ?
                WHERE email = ?
            """, (now.isoformat(), now.isoformat(), email))
            db.commit()
            log.append(f"✓ REPLIED: {email} — sequence paused, move to manual follow-up")
            continue

        d1_sent = row["d1_sent_at"]
        if not d1_sent:
            continue

        d1_dt = datetime.fromisoformat(d1_sent.replace("Z", "+00:00"))
        days_since_d1 = (now - d1_dt).days

        # D7: Follow-up if not sent and 7+ days since D1
        if not row["d7_sent_at"] and days_since_d1 >= 7:
            subject, text = _d7_email(row)
            # Reply in the original thread
            if thread_id and row["message_id"]:
                result = _am_post(
                    f"/inboxes/{INBOX}/messages/{urllib.parse.quote(row['message_id'], safe='')}/reply",
                    {"text": text}
                )
            else:
                result = _am_post(
                    f"/inboxes/{INBOX}/messages/send",
                    {
                        "to": [email],
                        "subject": subject,
                        "text": text,
                        "client_id": f"outreach-{email.split('@')[0]}-d7-{d1_dt.strftime('%Y%m%d')}",
                        "labels": ["sequence-d7"]
                    }
                )
            if "_error" not in result:
                db.execute("""
                    UPDATE sequence_state
                    SET d7_sent_at = ?, updated_at = ?
                    WHERE email = ?
                """, (now.isoformat(), now.isoformat(), email))
                db.commit()
                log.append(f"✓ D7 SENT: {email} (day {days_since_d1})")
            else:
                log.append(f"✗ D7 FAILED: {email} — {result.get('_error')} {result.get('_body','')[:80]}")
            continue  # only one touch per run

        # D17: Breakup if D7 sent and 17+ days since D1 and not yet sent
        if row["d7_sent_at"] and not row["d17_sent_at"] and days_since_d1 >= 17:
            subject, text = _d17_email(row)
            result = _am_post(
                f"/inboxes/{INBOX}/messages/send",
                {
                    "to": [email],
                    "subject": subject,
                    "text": text,
                    "client_id": f"outreach-{email.split('@')[0]}-d17-{d1_dt.strftime('%Y%m%d')}",
                    "labels": ["sequence-d17"]
                }
            )
            if "_error" not in result:
                db.execute("""
                    UPDATE sequence_state
                    SET d17_sent_at = ?, status = 'completed', updated_at = ?
                    WHERE email = ?
                """, (now.isoformat(), now.isoformat(), email))
                db.commit()
                log.append(f"✓ D17 SENT (breakup): {email} — sequence completed")
            else:
                log.append(f"✗ D17 FAILED: {email} — {result.get('_error')}")

    db.close()
    return log


if __name__ == "__main__":
    import urllib.parse  # needed for URL encoding in reply path
    results = run_sequence()
    if results:
        for line in results:
            print(line)
    else:
        print("No sequence touches due today.")
