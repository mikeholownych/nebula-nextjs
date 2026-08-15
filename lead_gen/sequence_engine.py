"""Outreach sequence engine - human-mimicking multi-touch pipeline.

Manages per-prospect sequences in lead_state.db.
Runs as a cron job every 6 hours. Only sends when the right day hits.

Sequence (mirroring the framework):
  D1:  Email sent (manually or by this engine)
  D3:  LinkedIn profile view (logged, done manually by Sedrick)
  D7:  Reply-thread follow-up ("Thoughts?" + one value add)
  D12: LinkedIn DM (if connected - manual flag)
  D17: Breakup email ("I'll stop reaching out...")

State stored in: lead_gen/lead_state.db → sequence_state table
Reply detection: checks AgentMail thread for inbound messages → pauses sequence
"""
from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime, timezone, timedelta
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "lead_gen" / "lead_state.db"
import sys
sys.path.insert(0, str(DB_PATH.parents[1]))
from agentmail_client import AgentMailClient
from hunter_parallel import HunterAdapter
from mailcheck_adapter import MailCheckAdapter, MailCheckError

INBOX = "sedrick@nebulacomponents.com"

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
    """Run Hunter and MailCheck for every lookup; MailCheck informs Nebula's gate."""
    hunter = HunterAdapter(db_path=Path(__file__).parent.parent / "mailcheck_beta.db").verify(email)
    result = {
        "deliverable": hunter.get("result") == "deliverable" or hunter.get("status") in ("valid", "webmail"),
        "status": hunter.get("status", "unknown"),
        "score": hunter.get("score", 0),
        "result": hunter.get("result", ""),
        "reason": f"Hunter status={hunter.get('status', '')} score={hunter.get('score', '')} result={hunter.get('result', '')}",
        "hunter": hunter,
        "mailcheck_allowed": False,
    }
    try:
        mc = MailCheckAdapter(db_path=Path(__file__).parent.parent / "mailcheck_beta.db")
        decision = mc.verify_for_outreach(email, lead_id="sequence:" + email, source="lead_gen.sequence_engine")
        result["mailcheck"] = {
            "verification_id": decision.verification_id,
            "classification": decision.classification,
            "decision": decision.decision,
            "reason": decision.reason,
        }
        result["mailcheck_allowed"] = decision.allowed
        if not decision.allowed:
            result["deliverable"] = False
            result["status"] = "mailcheck_blocked"
            result["reason"] += "; MailCheck " + decision.reason
    except (MailCheckError, ValueError):
        result["mailcheck"] = {"error": "MAILCHECK_UNAVAILABLE"}
        result["deliverable"] = False
        result["status"] = "mailcheck_unavailable"
        result["reason"] += "; MailCheck unavailable"
    return result


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
        print(f"  ⚠ RISKY {email}: {result['reason']} - sending anyway")
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
    columns = {row[1] for row in db.execute("PRAGMA table_info(sequence_state)")}
    if "mailcheck_verification_id" not in columns:
        db.execute("ALTER TABLE sequence_state ADD COLUMN mailcheck_verification_id TEXT")
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
    mailcheck_verification_id: str = "",
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
             thread_id, message_id, d1_sent_at, status, hook_variant, mailcheck_verification_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
        ON CONFLICT(email) DO UPDATE SET
            thread_id     = EXCLUDED.thread_id,
            message_id    = EXCLUDED.message_id,
            d1_sent_at    = EXCLUDED.d1_sent_at,
            signal_notes  = COALESCE(EXCLUDED.signal_notes, sequence_state.signal_notes),
            audit_finding = COALESCE(EXCLUDED.audit_finding, sequence_state.audit_finding),
            hook_variant  = COALESCE(EXCLUDED.hook_variant, sequence_state.hook_variant),
            mailcheck_verification_id = COALESCE(EXCLUDED.mailcheck_verification_id, sequence_state.mailcheck_verification_id),
            updated_at    = CURRENT_TIMESTAMP
    """, (email, first_name, product_url, signal_notes, audit_finding,
          thread_id, message_id, datetime.now(timezone.utc).isoformat(), hook_variant, mailcheck_verification_id))
    db.commit()
    db.close()


# ── AgentMail helpers ──────────────────────────────────────────────────────

def _agentmail() -> AgentMailClient:
    return AgentMailClient(inbox=INBOX)


def _am_send(*, email: str, subject: str, text: str, html: str | None = None, client_id: str, labels: list[str]) -> dict:
    return _agentmail().send(
        [email], subject, text=text, html=html, client_id=client_id, labels=labels
    )


def _am_reply(*, message_id: str, recipient: str, text: str, client_id: str) -> dict:
    return _agentmail().reply(
        message_id, recipient=recipient, text=text, client_id=client_id
    )


def has_reply(thread_id: str) -> bool:
    """Check if a prospect has replied to our thread."""
    if not thread_id:
        return False
    try:
        for msg in _agentmail().list_messages(thread_id=thread_id):
            labels = msg.get("labels", [])
            if "received" in labels and "sent" not in labels:
                from_addr = str(msg.get("from", "")).lower()
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

    subject = f"Re: {domain} - still a problem?"
    text = f"""Hey {name},

Is the {finding} still an issue, or have you sorted it out?

Just checking in - happy to share the quick fix either way.

- Sedrick
nebulacomponents.com/audit"""

    return subject, text


def _d17_email(row) -> tuple[str, str]:
    """Day 17 breakup: final polite close."""
    name = row["first_name"] or "there"
    product = row["product_url"] or "your site"
    domain = product.replace("https://", "").replace("http://", "").split("/")[0]

    subject = f"Closing the loop on {domain}"
    text = f"""Hey {name},

Since timing seems off, I'll stop reaching out - don't want to clog your inbox.

If you ever want to run {domain} through an audit, it's always free at nebulacomponents.com/audit. No email required to see the results.

Best of luck with the launch.

- Sedrick
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
            log.append(f"✓ REPLIED: {email} - sequence paused, move to manual follow-up")
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
                result = _am_reply(
                    message_id=row["message_id"],
                    recipient=email,
                    text=text,
                    client_id=f"outreach-{email.split('@')[0]}-d7-{d1_dt.strftime('%Y%m%d')}",
                )
            else:
                result = _am_send(
                    email=email,
                    subject=subject,
                    text=text,
                    client_id=f"outreach-{email.split('@')[0]}-d7-{d1_dt.strftime('%Y%m%d')}",
                    labels=["sequence-d7"],
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
                log.append(f"✗ D7 FAILED: {email} - {result.get('_error')} {result.get('_body','')[:80]}")
            continue  # only one touch per run

        # D17: Breakup if D7 sent and 17+ days since D1 and not yet sent
        if row["d7_sent_at"] and not row["d17_sent_at"] and days_since_d1 >= 17:
            if not verify_before_send(email, db):
                log.append(f"✗ D17 SKIPPED (verify failed): {email}")
                continue
            subject, text = _d17_email(row)
            result = _am_send(
                email=email,
                subject=subject,
                text=text,
                client_id=f"outreach-{email.split('@')[0]}-d17-{d1_dt.strftime('%Y%m%d')}",
                labels=["sequence-d17"],
            )
            if "_error" not in result:
                db.execute("""
                    UPDATE sequence_state
                    SET d17_sent_at = ?, status = 'completed', updated_at = ?
                    WHERE email = ?
                """, (now.isoformat(), now.isoformat(), email))
                db.commit()
                log.append(f"✓ D17 SENT (breakup): {email} - sequence completed")
            else:
                log.append(f"✗ D17 FAILED: {email} - {result.get('_error')}")

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
            subject="yourproduct.com - one finding",
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

    if not verification.get("mailcheck_allowed"):
        return {
            "sent": False,
            "reason": "MailCheck release decision did not authorize this send",
            "verified": verification,
        }

    # Step 2: Send
    domain = email.split("@")[0]
    import time
    idempotency_key = f"outreach-{domain}-d1-{int(time.time()) // 86400}"

    result = _am_send(
        email=email,
        subject=subject,
        text=body_text,
        html=body_html,
        client_id=idempotency_key,
        labels=["targeted-outreach", "sequence-d1"],
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
        mailcheck_verification_id=verification.get("mailcheck", {}).get("verification_id", ""),
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

    # Step 5: Record the actual downstream send event for the design-partner loop.
    outcome_error = ""
    try:
        verification_id = verification.get("mailcheck", {}).get("verification_id", "")
        if verification_id:
            MailCheckAdapter(db_path=Path(__file__).parent.parent / "mailcheck_beta.db").record_outcome(
                verification_id,
                email=email,
                outcome="SENT",
                source_system="nebula-outreach",
                provider="agentmail",
            )
    except MailCheckError:
        outcome_error = "MAILCHECK_OUTCOME_RECORD_FAILED"

    return {
        "sent": True,
        "thread_id": result.get("thread_id"),
        "message_id": result.get("message_id"),
        "verified": verification,
        "outcome_error": outcome_error,
    }


if __name__ == "__main__":
    import urllib.parse  # needed for URL encoding in reply path
    results = run_sequence()
    if results:
        for line in results:
            print(line)
    else:
        print("No sequence touches due today.")
