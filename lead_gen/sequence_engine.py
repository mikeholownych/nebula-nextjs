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

# Load Hunter key from .env
def _hunter_key() -> str:
    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if line.startswith("HUNTER_API_KEY="):
                return line.split("=", 1)[1].strip()
    return os.environ.get("HUNTER_API_KEY", "")


# ── Email Verification ─────────────────────────────────────────────────────

def verify_email(email: str) -> dict:
    """Verify email via Hunter.io before sending.
    
    Returns:
        { "deliverable": True/False, "status": "valid"|"risky"|"invalid"|"unknown",
          "score": 0-100, "reason": str }
    
    Rules:
        valid (score >= 70)  → send
        risky (score 40-69)  → send with caution (log warning)
        invalid              → skip, mark bounced
        unknown              → send (can't verify, not worth blocking)
    """
    key = _hunter_key()
    if not key:
        return {"deliverable": True, "status": "unknown", "score": 0,
                "reason": "No Hunter key — skipping verification"}

    url = (
        f"https://api.hunter.io/v2/email-verifier"
        f"?email={urllib.parse.quote(email)}&api_key={key}"
    )
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Nebula/1.0"})
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read()).get("data", {})
            status = data.get("status", "unknown")
            score = data.get("score", 0)
            result = data.get("result", "")

            deliverable = status in ("valid", "webmail") or (
                status == "risky" and score >= 40
            )
            reason = f"status={status} score={score} result={result}"
            return {"deliverable": deliverable, "status": status,
                    "score": score, "reason": reason}
    except Exception as e:
        return {"deliverable": True, "status": "unknown", "score": 0,
                "reason": f"Verification error: {e}"}


def verify_before_send(email: str, db: sqlite3.Connection) -> bool:
    """Verify email. Returns True if safe to send. Marks invalid as bounced."""
    result = verify_email(email)
    if result["status"] == "invalid":
        db.execute("""
            UPDATE sequence_state
            SET status = 'bounced', updated_at = ?
            WHERE email = ?
        """, (datetime.now(timezone.utc).isoformat(), email))
        db.commit()
        print(f"  ⚠ SKIP {email}: {result['reason']}")
        return False
    if not result["deliverable"]:
        print(f"  ⚠ SKIP {email}: {result['reason']}")
        return False
    if result["status"] == "risky":
        print(f"  ⚠ RISKY {email}: {result['reason']} — sending anyway")
    return True

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
    hook_variant: str = "",
) -> None:
    """Call this immediately after sending Day 1 email."""
    # Auto-assign hook variant based on send count (round-robin A→B→C)
    if not hook_variant:
        db_tmp = get_db()
        total_sent = db_tmp.execute("SELECT count(*) FROM sequence_state").fetchone()[0]
        db_tmp.close()
        hook_variant = ["A", "B", "C"][total_sent % 3]

    db = get_db()
    db.execute("""
        INSERT INTO sequence_state
            (email, first_name, product_url, signal_notes, audit_finding,
             thread_id, message_id, d1_sent_at, status, hook_variant)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
        ON CONFLICT(email) DO UPDATE SET
            thread_id     = EXCLUDED.thread_id,
            message_id    = EXCLUDED.message_id,
            d1_sent_at    = EXCLUDED.d1_sent_at,
            signal_notes  = COALESCE(EXCLUDED.signal_notes, sequence_state.signal_notes),
            audit_finding = COALESCE(EXCLUDED.audit_finding, sequence_state.audit_finding),
            hook_variant  = COALESCE(EXCLUDED.hook_variant, sequence_state.hook_variant),
            updated_at    = CURRENT_TIMESTAMP
    """, (email, first_name, product_url, signal_notes, audit_finding,
          thread_id, message_id, datetime.now(timezone.utc).isoformat(), hook_variant))
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
    """Day 7 follow-up: lower-stakes check-in, not a re-pitch."""
    name = row["first_name"] or "there"
    finding = row["audit_finding"] or "a conversion gap"
    product = row["product_url"] or "your site"
    domain = product.replace("https://", "").replace("http://", "").split("/")[0]

    subject = f"Re: {domain} — still a problem?"
    text = f"""Hey {name},

Is the {finding} still an issue, or have you sorted it out?

Just checking in — happy to share the quick fix either way.

— Sedrick
nebulacomponents.com/audit"""

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
            if not verify_before_send(email, db):
                log.append(f"✗ D7 SKIPPED (verify failed): {email}")
                continue
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
            if not verify_before_send(email, db):
                log.append(f"✗ D17 SKIPPED (verify failed): {email}")
                continue
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


# ── Public send_d1 API ─────────────────────────────────────────────────────

def send_d1(
    email: str,
    first_name: str,
    subject: str,
    body_text: str,
    body_html: str,
    product_url: str = "",
    signal_notes: str = "",
    audit_finding: str = "",
) -> dict:
    """Verify + send Day 1 email + register in sequence. Single entry point.
    
    Usage:
        result = send_d1(
            email="hello@founder.com",
            first_name="Alice",
            subject="yourproduct.com — one finding",
            body_text="Hey Alice, ...",
            body_html="<p>Hey Alice, ...</p>",
            product_url="https://yourproduct.com",
            signal_notes="$200 FB ads, 0 conversions",
            audit_finding="no social proof above fold",
        )
        print(result)  # {"sent": True, "thread_id": "...", "verified": {...}}
    """
    # Step 1: Verify
    verification = verify_email(email)
    if verification["status"] == "invalid":
        return {
            "sent": False,
            "reason": f"Email invalid: {verification['reason']}",
            "verified": verification,
        }
    if not verification["deliverable"]:
        return {
            "sent": False,
            "reason": f"Email not deliverable: {verification['reason']}",
            "verified": verification,
        }

    # Step 2: Send
    domain = email.split("@")[0]
    import time
    idempotency_key = f"outreach-{domain}-d1-{int(time.time()) // 86400}"

    result = _am_post(
        f"/inboxes/{INBOX}/messages/send",
        {
            "to": [email],
            "subject": subject,
            "text": body_text,
            "html": body_html,
            "client_id": idempotency_key,
            "labels": ["targeted-outreach", "sequence-d1"],
        }
    )

    if "_error" in result:
        return {
            "sent": False,
            "reason": f"Send failed: HTTP {result['_error']} {result.get('_body','')[:200]}",
            "verified": verification,
        }

    # Step 3: Register in sequence
    register_d1_sent(
        email=email,
        first_name=first_name,
        thread_id=result.get("thread_id", ""),
        message_id=result.get("message_id", ""),
        product_url=product_url,
        signal_notes=signal_notes,
        audit_finding=audit_finding,
    )

    # Step 4: Sync to PostgreSQL CRM (fail-silent)
    try:
        import asyncio as _aio
        import sys as _sys
        _sys.path.insert(0, str(Path(__file__).parent.parent))
        from platform_api.services.crm_hooks import outreach_sent as _crm_outreach

        async def _sync_crm():
            await _crm_outreach(
                email=email,
                first_name=first_name,
                product_url=product_url,
                sequence_step="d1",
                signal_notes=signal_notes,
            )
        _aio.run(_sync_crm())
    except Exception:
        pass

    return {
        "sent": True,
        "thread_id": result.get("thread_id"),
        "message_id": result.get("message_id"),
        "verified": verification,
    }


if __name__ == "__main__":
    import urllib.parse  # needed for URL encoding in reply path
    results = run_sequence()
    if results:
        for line in results:
            print(line)
    else:
        print("No sequence touches due today.")
