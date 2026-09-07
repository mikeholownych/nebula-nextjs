"""n8n Reply Handler - classify prospect replies, update lead_state.db.

Implements Stage 5 of the trigger-aware lead gen pipeline:
  Input: n8n webhook POST to /webhook/outbound-reply
  Output: Classify reply (interested | not_interested | spam)
  Storage: Update contacts.reply_status in lead_state.db

n8n workflow:
1. Email reply received (via Gmail API, Outlook, or manual forwarding)
2. POST to /webhook/outbound-reply with reply text + prospect email
3. This handler classifies + updates DB
4. n8n sends notification to SDR (Sedrick Murphy) for manual follow-up

Webhook payload:
{
    "prospect_id": "stripe_founder1",
    "email": "patrick@stripe.com",
    "reply_text": "Yeah, we've been thinking about this. Can you send more details?",
    "reply_timestamp": "2026-08-10T09:15:00Z"
}
"""
import json
import sqlite3
from pathlib import Path
from datetime import UTC, datetime


DB_PATH = Path(__file__).parent / "lead_state.db"


def classify_reply(reply_text: str) -> dict:
    """Use heuristics to classify a reply (fast, no LLM call).

    Returns:
        {
            "classification": "interested" | "not_interested" | "spam",
            "confidence": 0.0-1.0,
            "reasoning": "..."
        }
    """
    reply_lower = reply_text.lower()

    # Interested signals
    interested_keywords = [
        "can you", "send more", "tell me more", "details", "how much",
        "pricing", "interested", "sounds good", "let's talk", "call",
        "meeting", "demo", "setup", "when can", "available", "yes",
        "sounds great", "let's discuss", "more info"
    ]

    # Not interested signals
    not_interested_keywords = [
        "not interested", "no thanks", "pass", "not relevant", "wrong",
        "unsubscribe", "remove", "stop", "don't", "can't help", "busy",
        "not looking", "already have", "no need"
    ]

    # Spam signals
    spam_keywords = [
        "viagra", "casino", "lottery", "click here", "free money",
        "congratulations you won", "confirm your account"
    ]

    # Score
    interested_count = sum(1 for kw in interested_keywords if kw in reply_lower)
    not_interested_count = sum(1 for kw in not_interested_keywords if kw in reply_lower)
    spam_count = sum(1 for kw in spam_keywords if kw in reply_lower)

    # Classify
    if spam_count > 0:
        return {
            "classification": "spam",
            "confidence": 0.9,
            "reasoning": f"Detected {spam_count} spam signal(s)"
        }
    elif interested_count >= 2:
        return {
            "classification": "interested",
            "confidence": 0.95,
            "reasoning": f"Detected {interested_count} interested signal(s): {', '.join([kw for kw in interested_keywords if kw in reply_lower][:3])}"
        }
    elif interested_count == 1:
        return {
            "classification": "interested",
            "confidence": 0.7,
            "reasoning": f"Detected 1 interested signal"
        }
    elif not_interested_count > 0:
        return {
            "classification": "not_interested",
            "confidence": 0.9,
            "reasoning": f"Detected {not_interested_count} not-interested signal(s)"
        }
    else:
        # Neutral - could go either way, assume interested (reply = engagement)
        return {
            "classification": "interested",
            "confidence": 0.5,
            "reasoning": "Reply received but no clear signals. Assuming engaged."
        }


def handle_reply_webhook(payload: dict) -> dict:
    """Process reply, classify, and update lead_state.db.

    Args:
        payload: {
            "prospect_id": str,
            "email": str,
            "reply_text": str,
            "reply_timestamp": str (ISO 8601)
        }

    Returns:
        {
            "success": True,
            "prospect_id": str,
            "classification": str,
            "confidence": float,
            "sdr_notification_queued": True
        }
    """
    prospect_id = payload.get("prospect_id", "")
    email = payload.get("email", "")
    reply_text = payload.get("reply_text", "")
    reply_timestamp = payload.get("reply_timestamp", datetime.now(UTC).replace(tzinfo=None).isoformat())

    if not prospect_id or not email:
        return {"success": False, "error": "missing prospect_id or email"}

    if not reply_text:
        return {"success": False, "error": "missing reply_text"}

    # Classify
    classification = classify_reply(reply_text)

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Verify prospect + contact exist
    c.execute(
        "SELECT contact_id FROM contacts WHERE prospect_id = ? AND email = ?",
        (prospect_id, email)
    )
    contact = c.fetchone()

    if not contact:
        conn.close()
        return {
            "success": False,
            "error": f"prospect {prospect_id} / email {email} not found in DB"
        }

    # Update contact
    c.execute(
        """
        UPDATE contacts
        SET reply_status = ?
        WHERE prospect_id = ? AND email = ?
        """,
        (classification["classification"], prospect_id, email)
    )

    # Update prospect status
    if classification["classification"] == "interested":
        c.execute(
            "UPDATE prospects SET status = 'interested', updated_at = CURRENT_TIMESTAMP WHERE prospect_id = ?",
            (prospect_id,)
        )
    elif classification["classification"] == "not_interested":
        c.execute(
            "UPDATE prospects SET status = 'not_interested', updated_at = CURRENT_TIMESTAMP WHERE prospect_id = ?",
            (prospect_id,)
        )
    elif classification["classification"] == "spam":
        c.execute(
            "UPDATE prospects SET status = 'spam', updated_at = CURRENT_TIMESTAMP WHERE prospect_id = ?",
            (prospect_id,)
        )

    conn.commit()
    conn.close()

    # Sync to PostgreSQL CRM (fail-silent, non-blocking)
    try:
        import asyncio, sys
        sys.path.insert(0, str(Path(__file__).parent.parent))
        from platform_api.services.crm_hooks import reply_received

        async def _sync():
            await reply_received(
                email=email,
                reply_text=reply_text[:500],
                classification=classification["classification"],
                source="email_outreach",
            )
        asyncio.run(_sync())
    except Exception:
        pass  # never block reply handling

    return {
        "success": True,
        "prospect_id": prospect_id,
        "email": email,
        "classification": classification["classification"],
        "confidence": classification["confidence"],
        "reasoning": classification["reasoning"],
        "sdr_notification_queued": True,  # n8n should send notification to Sedrick Murphy
        "message": f"Reply classified as '{classification['classification']}'. SDR notified."
    }


def get_interested_prospects(limit=50) -> list[dict]:
    """Get all prospects with 'interested' status for sales follow-up."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute(
        """
        SELECT p.prospect_id, p.domain, p.company_name, p.intent_score,
               c.email, c.first_name, c.last_name, c.job_title, c.reply_status
        FROM prospects p
        LEFT JOIN contacts c ON p.prospect_id = c.prospect_id
        WHERE p.status = 'interested'
        ORDER BY p.updated_at DESC
        LIMIT ?
        """,
        (limit,)
    )

    rows = c.fetchall()
    conn.close()

    return [dict(row) for row in rows]


def get_not_interested_prospects(limit=50) -> list[dict]:
    """Get all prospects with 'not_interested' status (for future re-engagement)."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute(
        """
        SELECT p.prospect_id, p.domain, p.company_name, p.intent_score,
               c.email, c.first_name, c.last_name, c.job_title, c.reply_status
        FROM prospects p
        LEFT JOIN contacts c ON p.prospect_id = c.prospect_id
        WHERE p.status = 'not_interested'
        ORDER BY p.updated_at DESC
        LIMIT ?
        """,
        (limit,)
    )

    rows = c.fetchall()
    conn.close()

    return [dict(row) for row in rows]


if __name__ == "__main__":
    # Example: classify a reply
    payload = {
        "prospect_id": "stripe_founder1",
        "email": "patrick@stripe.com",
        "reply_text": "Yeah, we've been thinking about this. Can you send more details?",
        "reply_timestamp": "2026-08-10T09:15:00Z"
    }

    result = handle_reply_webhook(payload)
    print(json.dumps(result, indent=2, default=str))

    # Show interested prospects
    print("\nInterested prospects:")
    interested = get_interested_prospects(limit=5)
    for p in interested:
        print(f"  {p['email']}: {p['reply_status']}")
