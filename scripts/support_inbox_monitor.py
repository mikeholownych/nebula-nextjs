#!/usr/bin/env python3
"""Automated support agent for Nebula Components.

Handles inbound email automatically for:
  ✅ Spam / cold outreach → silent label (no reply)
  ✅ Positive feedback / praise → brief thank-you + re-audit reminder
  ✅ Re-audit requests → trigger re-audit and confirm
  ✅ Implementation questions (generic) → pre-written guidance
  ✅ Billing / refund questions → policy reply + Telegram heads-up

Escalates to Mike (Telegram) only for:
  🔴 Implementation help that requires looking at the specific kit
  🔴 Complaints / genuine issues
  🔴 Anything unclassifiable that looks real

Usage:
  venv/bin/python3 scripts/support_inbox_monitor.py [--dry-run]

Cron: every 15 minutes.
"""

import argparse
import fcntl
import json
import os
import re
import sys
import subprocess
import time
from pathlib import Path

NEBULA_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(NEBULA_DIR))

from agentmail_client import AgentMailClient  # noqa: E402

TELEGRAM_TARGET = "telegram:5920497760"
LABEL_NOTIFIED   = "support-notified"
LABEL_AUTO_REPLIED = "auto-replied"
LABEL_SPAM       = "spam"
LABEL_CLOSED_WON = "closed-won"
APPROVAL_QUEUE = NEBULA_DIR / "ops" / "queued_replies.json"
APPROVAL_LOCK = NEBULA_DIR / ".queued_replies.lock"
MAX_APPROVAL_QUEUE = 1000

SKIP_SENDERS = {
    "noreply", "no-reply", "mailer-daemon", "postmaster",
    "donotreply", "do-not-reply", "bounce", "support@stripe.com",
    "notifications@", "agentmail", "nebulashop@",
}

# ── Automated reply templates ─────────────────────────────────────────────────

REPLY_REAUDIT_TRIGGERED = """\
Hi,

I've just triggered your 30-day re-audit on the same URL we diagnosed originally. \
You'll receive the results within a few minutes.

If the score hasn't moved after implementing the fix, reply here with a quick description \
of what you changed and I'll take a look at what might be blocking the signal.

-
Mike
Nebula Components
"""

REPLY_IMPLEMENTATION_GENERIC = """\
Hi,

Thanks for reaching out. A few things that help when implementing the kit:

1. Run the prompt exactly as delivered - it's already filled in with your real page context.
2. Use a coding agent with terminal + file access (Claude Code, Cursor, or Codex work well).
3. After implementing, give it 24-48h for any CDN/cache to clear before re-auditing.

If you're hitting a specific error or the agent is asking for something it shouldn't need, \
reply here with the exact prompt step and I'll debug it with you.

-
Mike
Nebula Components
"""

REPLY_POSITIVE = """\
Hi,

Thanks - genuinely appreciate it.

When you're ready to re-audit (or audit another page), the free tool is always at:
https://nebulacomponents.com/audit?utm_source=email&utm_medium=support

-
Mike
"""

REPLY_BILLING = """\
Hi,

Thanks for getting in touch about billing.

Our refund policy: if you haven't received your kit within 24 hours of purchase, \
email me with your Stripe receipt and I'll resolve it same day. \
If you received the kit but it wasn't useful for your situation, \
reply with what you were hoping it would address and I'll either \
fix the kit or issue a refund - your call.

Receipt lookup: check your email for "Your One-Leak Repair Sprint" \
or the Stripe receipt from Nebula Components.

-
Mike
Nebula Components
"""

REPLY_UNSUBSCRIBE = """\
Hi,

Done - you're removed. You won't hear from us again.

-
Mike
"""


# ── Classification ────────────────────────────────────────────────────────────

def classify(subject: str, body: str) -> str:
    """Classify inbound. Returns one of: spam, reaudit, implementation,
    positive, billing, unsubscribe, complaint, escalate."""
    t = (subject + " " + body).lower()

    # Spam / cold outreach signals - no reply
    spam_signals = [
        "i wanted to reach out", "i came across your", "we've seen a few simple strategies",
        "we help companies like", "quick question about your visibility",
        "i might have a few ideas", "partnership opportunity", "collaboration",
        "seo services", "link building", "guest post", "backlink",
        "digital marketing agency", "we specialize in", "your website",
        "increase your revenue", "drive more traffic", "i noticed your site",
        "lead generation services", "would love to connect",
        "online sales", "sales strategy", "boost your sales",
        "i'd love to schedule", "quick chat", "15 minutes",
        "we work with companies", "growth strategy", "scale your",
        "b2b", "outreach services", "email marketing service",
        # Autoresponder patterns
        "welcome you and thank you for your continued dedication",
        "synchronized global launch",
        "just-in-time luxury",
        "noreply", "no-reply", "auto-reply", "automatic reply",
        "out of office", "vacation", "away from the office",
        "this is an automated",
    ]
    if any(s in t for s in spam_signals):
        return "spam"

    if any(w in t for w in ["unsubscribe", "remove me", "opt out", "opt-out", "stop emailing"]):
        return "unsubscribe"

    if any(w in t for w in ["re-audit", "reaudit", "30 day", "30-day", "run again", "audit again"]):
        return "reaudit"

    if any(w in t for w in ["refund", "cancel", "charged", "charge", "receipt", "invoice", "billing", "money back"]):
        return "billing"

    if any(w in t for w in ["thank", "worked", "great", "love", "amazing", "fixed it", "it worked", "conversion"]):
        return "positive"

    if any(w in t for w in ["broken", "doesn't work", "not working", "error", "bug", "failed", "crashed", "wrong output"]):
        return "complaint"

    if any(w in t for w in ["how do i", "how to", "how do", "which file", "what file", "where do i",
                              "can you help", "help me", "i'm stuck", "agent says", "prompt says",
                              "implement", "deploy", "edit", "replace", "change"]):
        return "implementation"

    # Anything else that looks real gets escalated
    return "escalate"


# ── DB helpers ────────────────────────────────────────────────────────────────

def get_customer_purchase(email: str) -> dict | None:
    try:
        import psycopg2
        conn = psycopg2.connect(
            "postgresql://postgres@/nebula_platform?host=/var/run/postgresql&port=5433"
        )
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT offer_key, amount_total, fulfillment_status, audit_url, stripe_session_id, created_at
                FROM purchases
                WHERE LOWER(customer_email) = LOWER(%s)
                  AND livemode = TRUE AND payment_status = 'paid'
                ORDER BY created_at DESC LIMIT 1
                """,
                (email,),
            )
            row = cur.fetchone()
        conn.close()
        if row:
            return {
                "offer_key": row[0], "amount": row[1], "status": row[2],
                "audit_url": row[3], "session_id": row[4], "created_at": str(row[5])[:10],
            }
    except Exception:
        pass
    return None


def trigger_reaudit_for_customer(purchase: dict, email: str) -> bool:
    """Force a re-audit now by setting reaudit_due_at = past timestamp."""
    try:
        import psycopg2
        conn = psycopg2.connect(
            "postgresql://postgres@/nebula_platform?host=/var/run/postgresql&port=5433"
        )
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE purchases
                SET reaudit_due_at = now() - INTERVAL '1 second',
                    reaudit_sent_at = NULL
                WHERE stripe_session_id = %s
                """,
                (purchase["session_id"],),
            )
        conn.commit()
        conn.close()
        # Immediately run the re-audit script
        subprocess.Popen(
            [str(NEBULA_DIR / "venv" / "bin" / "python3"),
             str(NEBULA_DIR / "scripts" / "deliver_reaudit.py")],
            cwd=str(NEBULA_DIR),
        )
        return True
    except Exception as e:
        log(f"  Re-audit trigger failed: {e}")
        return False


# ── Helpers ───────────────────────────────────────────────────────────────────

def log(msg):
    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    print(f"[{ts}] {msg}", flush=True)


def telegram(message: str):
    try:
        subprocess.run(
            ["hermes", "send", "--to", TELEGRAM_TARGET, message],
            capture_output=True, timeout=20,
        )
    except Exception as e:
        log(f"Telegram failed: {e}")


def extract_email(sender: str) -> str:
    if "<" in sender and ">" in sender:
        return sender.split("<")[1].split(">")[0].strip().lower()
    return sender.strip().lower()


def is_skip_sender(addr: str) -> bool:
    return any(s in addr.lower() for s in SKIP_SENDERS)


def _draft_for_intent(intent: str, is_customer: bool) -> str:
    if intent == "billing":
        return REPLY_BILLING
    if intent == "implementation":
        return REPLY_IMPLEMENTATION_GENERIC
    if intent == "positive":
        return REPLY_POSITIVE
    if intent == "reaudit":
        if is_customer:
            return (
                "Hi,\n\nI found your purchase and can trigger the included re-audit. "
                "I am checking the original audit URL before I run it.\n\n-\nMike\nNebula Components"
            )
        return (
            "Hi,\n\nI could not match this address to a purchase. Reply with the "
            "email on your Stripe receipt and I will check it manually.\n\n-\nMike\nNebula Components"
        )
    return ""


def queue_pending_reply(
    *, thread_id: str, message_id: str, recipient: str, subject: str,
    body: str, intent: str, is_customer: bool,
) -> str:
    """Atomically append one idempotent, approval-required reply draft."""
    item_id = f"support:{thread_id}:{message_id}"
    APPROVAL_QUEUE.parent.mkdir(parents=True, exist_ok=True)
    APPROVAL_LOCK.parent.mkdir(parents=True, exist_ok=True)
    with open(APPROVAL_LOCK, "a+") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        try:
            try:
                queue = json.loads(APPROVAL_QUEUE.read_text()) if APPROVAL_QUEUE.exists() else []
            except (json.JSONDecodeError, OSError):
                queue = []
            if any(item.get("id") == item_id for item in queue):
                return item_id
            if len(queue) >= MAX_APPROVAL_QUEUE:
                raise RuntimeError("support approval queue is full")
            queue.append({
                "id": item_id,
                "to": recipient,
                "subject": subject,
                "body": body,
                "in_reply_to": message_id,
                "thread_id": thread_id,
                "intent": intent,
                "is_customer": is_customer,
                "status": "pending_approval",
                "approval_required": True,
                "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            })
            tmp = APPROVAL_QUEUE.with_suffix(".tmp")
            tmp.write_text(json.dumps(queue, indent=2))
            os.replace(tmp, APPROVAL_QUEUE)
            return item_id
        finally:
            fcntl.flock(lock, fcntl.LOCK_UN)


# ── Main processing loop ──────────────────────────────────────────────────────

def process(am: AgentMailClient, dry_run: bool = False):
    log("Scanning inbox...")
    threads = am.list_threads(limit=100)

    acted = 0
    for thread in threads:
        labels = thread.get("labels", [])

        # Skip already handled
        if LABEL_NOTIFIED in labels or LABEL_AUTO_REPLIED in labels or LABEL_SPAM in labels:
            continue
        if LABEL_CLOSED_WON in labels:
            continue
        if "received" not in labels:
            continue

        senders = thread.get("senders", [])
        sender_emails = [extract_email(s) for s in senders]
        human_senders = [e for e in sender_emails if not is_skip_sender(e)]
        if not human_senders:
            continue

        sender_email = human_senders[0]
        subject = thread.get("subject", "")
        preview = thread.get("preview", "")
        last_msg_id = thread.get("last_message_id", "")
        thread_id = thread.get("thread_id") or thread.get("id", "")

        intent = classify(subject, preview)
        purchase = get_customer_purchase(sender_email)
        is_customer = purchase is not None

        log(f"  [{intent}] {sender_email} | {subject[:60]}")

        if intent == "spam":
            # Silent - just label it
            if not dry_run:
                am.label_thread(thread_id, add=[LABEL_SPAM])
            else:
                log("    [DRY RUN] Would label spam")
            acted += 1
            continue

        if intent == "unsubscribe":
            if not dry_run and last_msg_id:
                am.reply(last_msg_id, recipient=sender_email, text=REPLY_UNSUBSCRIBE)
                am.label_thread(thread_id, add=[LABEL_AUTO_REPLIED])
            else:
                log(f"    [DRY RUN] Would send unsubscribe confirmation to {sender_email}")
            acted += 1
            continue

        if intent in {"reaudit", "positive", "billing", "implementation"}:
            draft = _draft_for_intent(intent, is_customer)
            if dry_run:
                log(f"    [DRY RUN] Would queue {intent} reply for approval")
            elif last_msg_id:
                item_id = queue_pending_reply(
                    thread_id=thread_id,
                    message_id=last_msg_id,
                    recipient=sender_email,
                    subject=subject,
                    body=draft,
                    intent=intent,
                    is_customer=is_customer,
                )
                am.label_thread(thread_id, add=[LABEL_NOTIFIED])
                telegram(
                    f"SUPPORT APPROVAL REQUIRED\nIntent: {intent}\nFrom: {sender_email}\n"
                    f"Subject: {subject[:120]}\nDraft ID: {item_id}\n"
                    f"Approve: venv/bin/python3 scripts/reply_approval.py approve '{item_id}' --by mike"
                )
            acted += 1
            continue

        # complaint / escalate - alert Mike with full context
        purchase_ctx = ""
        if is_customer:
            p = purchase
            purchase_ctx = (
                f"\n💰 Customer: {p['offer_key']} / ${(p['amount'] or 0)//100} / "
                f"{p['status']} / {p['created_at']}"
                f"{chr(10) + 'URL: ' + p['audit_url'] if p.get('audit_url') else ''}"
            )

        telegram(
            f"🔴 ESCALATION - needs your response\n"
            f"Intent: {intent}\n"
            f"From: {sender_email}"
            f"{purchase_ctx}\n"
            f"Subject: {subject}\n"
            f"Preview: {preview[:300]}\n\n"
            f"Reply at: nebulashop@agentmail.to"
        )
        if not dry_run:
            am.label_thread(thread_id, add=[LABEL_NOTIFIED])
        acted += 1

    log(f"Done. Acted on {acted} thread(s).")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    try:
        am = AgentMailClient()
    except Exception as e:
        log(f"AgentMail init failed: {e}")
        sys.exit(1)

    process(am, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
