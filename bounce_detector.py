#!/usr/bin/env python3
"""
bounce_detector.py — SMTP bounce classification + inbox scanning.

Scans AgentMail inbox for bounce-related messages (NDR/DSN)
and cross-references against the lead store.

Three detection paths:
  1. SMTP-level rejection patterns (called inline from send_email)
  2. Inbound NDR emails (called via cron)
  3. Delivery status API (future)
"""

import json, os, re, sys, time
from datetime import datetime, timezone
from pathlib import Path

NEBULA = Path("/home/mike/nebula")
sys.path.insert(0, str(NEBULA))

# ── Classification patterns ──────────────────────────────────────

# SMTP error codes that indicate permanent (hard) bounces
HARD_SMTP_CODES = {
    550,  # mailbox unavailable / user unknown
    551,  # user not local
    552,  # mailbox exceeded storage
    553,  # mailbox name not allowed
    554,  # transaction failed (permanent)
    521,  # server does not accept mail
    530,  # access denied
}

SOFT_SMTP_CODES = {
    450,  # mailbox temporarily unavailable
    451,  # local error / temporary failure
    452,  # insufficient storage
    421,  # service temporarily unavailable
    447,  # timeout
}

HARD_BOUNCE_KEYWORDS = re.compile(
    r"(user unknown|no such (user|mailbox|recipient|person)|"
    r"mailbox (not found|unavailable|disabled|full)|"
    r"address rejected|invalid address|invalid (email|mailbox)|"
    r"recipient rejected|account (disabled|suspended|closed)|"
    r"permanent (failure|error)|does not (exist|accept)|"
    r"undeliverable|delivery (failed|not possible)|"
    r"name server: .+ not found|550 5\.1\.1|"
    r"550 5\.1\.0|554 5\.4\.4|unrouteable address)",
    re.IGNORECASE,
)

SOFT_BOUNCE_KEYWORDS = re.compile(
    r"(temporarily (unavailable|rejected)|"
    r"temporary (failure|error)|"
    r"try (again|later)|mailbox (busy|full)|"
    r"service (unavailable|temporarily)|"
    r"too many connections|rate limit|"
    r"450 4\.\d\.\d|451 4\.\d\.\d|452 4\.\d\.\d|421 4\.\d\.\d)",
    re.IGNORECASE,
)

DELIVERY_STATUS_SUBJECTS = re.compile(
    r"(returned mail|undelivered|delivery (status|failure|notification)|"
    r"mail delivery failed|delivery report|bounce|non-?delivery|"
    r"auto-?reply|out of (office|the office))",
    re.IGNORECASE,
)

BOUNCE_SENDER_PATTERNS = re.compile(
    r"(mailer-daemon|postmaster|mailer-daemon@|MAILER-DAEMON|"
    r"noreply@|no-reply@|\bbounce\b|returnpath|mta)",
    re.IGNORECASE,
)


def classify_smtp_response(response_text: str) -> tuple:
    """Classify an SMTP sendmail() response dict into (bounce_type, reason).
    
    Returns ('hard', reason), ('soft', reason), or (None, '') if not a bounce.
    """
    if not response_text:
        return (None, "")
    
    # Extract SMTP code from response
    code_match = re.search(r"(\d{3})", str(response_text))
    code = int(code_match.group(1)) if code_match else None
    
    # Check code-based classification first
    if code in HARD_SMTP_CODES:
        return ("hard", response_text[:200])
    if code in SOFT_SMTP_CODES:
        return ("soft", response_text[:200])
    
    # Check keyword-based classification for response text
    text = str(response_text)
    if HARD_BOUNCE_KEYWORDS.search(text):
        return ("hard", text[:200])
    if SOFT_BOUNCE_KEYWORDS.search(text):
        return ("soft", text[:200])
    
    return (None, "")


def extract_bounced_email_from_ndr(body: str, subject: str = "") -> str | None:
    """Try to extract the original recipient from an NDR/bounce email."""
    patterns = [
        # Postfix/Qmail style: <bounced@example.com>
        r"<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>",
        # Final-recipient: RFC822; bounced@example.com
        r"final-recipient:\s*(?:RFC\d{3,4};)?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})",
        # Original-Recipient
        r"original-recipient:\s*(?:RFC\d{3,4};)?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})",
        # "bounced@example.com" in subject
        r"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})",
    ]
    
    haystack = f"{subject}\n{body}"
    for pattern in patterns:
        match = re.search(pattern, haystack)
        if match:
            email = match.group(1).lower().strip()
            # Skip common NDR senders
            if email and "mailer-daemon" not in email and "postmaster" not in email:
                return email
    return None


def is_ndr_message(subject: str, sender: str) -> bool:
    """Check if an inbound message is an NDR/bounce report."""
    if BOUNCE_SENDER_PATTERNS.search(sender or ""):
        return True
    if subject and DELIVERY_STATUS_SUBJECTS.search(subject):
        return True
    return False


def scan_inbox_for_bounces(am_client, max_messages: int = 50) -> list[dict]:
    """Scan AgentMail inbox for bounce/NDR messages. Returns list of bounce events."""
    from lead_store import LeadStore
    
    bounces_found = []
    db = LeadStore()
    
    try:
        messages = am_client.list_messages(limit=max_messages)
    except Exception as e:
        print(f"  [BOUNCE] Cannot list messages: {e}")
        return bounces_found
    
    for msg in messages:
        mid = msg.get("message_id") or msg.get("id", "")
        subject = (msg.get("subject") or "")
        sender = (msg.get("from") or msg.get("sender") or "")
        
        if not is_ndr_message(subject, sender):
            continue
        
        # Fetch full message body
        try:
            full = am_client.get_message(mid)
            body = full.get("text", "") or full.get("body", "") or ""
        except Exception:
            body = ""
        
        target_email = extract_bounced_email_from_ndr(body, subject)
        if not target_email:
            continue
        
        # Check if this address is in our DB
        if db.is_bounced(target_email):
            continue  # Already flagged
        
        bounce_event = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "message_id": mid,
            "subject": subject,
            "sender": sender,
            "target_email": target_email,
            "source": "inbox_ndr",
        }
        
        # Mark hard bounce
        db.mark_bounced(target_email, bounce_type="hard", bounce_detail=f"NDR: {subject[:100]}")
        bounces_found.append(bounce_event)
        print(f"  [BOUNCE] {target_email} — NDR detected: {subject[:60]}")
    
    return bounces_found


def load_bounce_ledger() -> list[dict]:
    """Load all bounce events from the bounce ledger."""
    ledger_path = NEBULA / "ledgers" / "bounce_ledger.jsonl"
    if not ledger_path.exists():
        return []
    entries = []
    for line in ledger_path.read_text().splitlines():
        if line.strip():
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                pass
    return entries


def log_bounce_event(event: dict):
    """Persist a bounce event to the bounce ledger."""
    ledger_path = NEBULA / "ledgers" / "bounce_ledger.jsonl"
    ledger_path.parent.mkdir(parents=True, exist_ok=True)
    with open(ledger_path, "a") as f:
        f.write(json.dumps(event) + "\n")


def report_bounce_stats() -> dict:
    """Return bounce statistics for health monitoring."""
    from lead_store import LeadStore
    db = LeadStore()
    
    all_bounced = db.get_bounced_leads()
    ledger = load_bounce_ledger()
    
    hard_count = db.get_bounce_count()
    soft_count = sum(1 for e in ledger if e.get("bounce_type") == "soft")
    
    return {
        "hard_bounces": hard_count,
        "soft_bounces": soft_count,
        "total_bounce_events": len(ledger),
        "bounced_emails": [l.get("email") for l in all_bounced],
        "last_events": ledger[-10:] if ledger else [],
    }


if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else "help"
    
    if action == "report":
        stats = report_bounce_stats()
        print(json.dumps(stats, indent=2, ensure_ascii=False))
    
    elif action == "test":
        # Test classification
        tests = [
            ("550 5.1.1 user unknown", "hard"),
            ("550 5.1.0 address rejected", "hard"),
            ("451 4.3.0 temporary failure", "soft"),
            ("OK", None),
            ("250 2.0.0 Message accepted", None),
        ]
        for response, expected in tests:
            btype, _ = classify_smtp_response(response)
            status = "✅" if btype == expected else "❌"
            print(f"  {status} classify({response!r}) = {btype!r} (expected {expected!r})")
    
    else:
        print("Usage: bounce_detector.py [report|test]")
