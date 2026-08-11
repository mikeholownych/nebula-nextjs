#!/usr/bin/env python3
"""
reply_monitor.py — Check AgentMail inbox for human replies, classify, persist.
Run every 15-30 min via cron. Idempotent — never double-processes a thread.

Persists transactionally to outbound_delivery.db via OutboundReleaseGate.
The historical replied_emails.jsonl is imported once and retained as a local migration artifact.
For "unsubscribe" signals, also marks the lead as bounced in LeadStore.
"""

import sys
import json
from datetime import datetime, timezone
from pathlib import Path

NEBULA = Path("/home/mike/nebula")
sys.path.insert(0, str(NEBULA))
from agentmail_client import AgentMailClient
from outbound_release_gate import OutboundReleaseGate


def load_processed_threads(gate: OutboundReleaseGate | None = None) -> set:
    """Return thread IDs from the canonical transactional reply store."""
    return (gate or OutboundReleaseGate()).processed_thread_ids()


def save_reply(
    gate: OutboundReleaseGate,
    email: str,
    classification: str,
    thread_id: str,
    message_excerpt: str = "",
) -> bool:
    """Persist reply classification in the canonical transactional store."""
    inserted = gate.record_reply(
        email=email,
        classification=classification,
        thread_id=thread_id,
        detected_at=datetime.now(timezone.utc).isoformat(),
        message_excerpt=message_excerpt,
    )
    if inserted:
        print(f"  [REPLIED] {email} -> {classification}")
    return inserted


def mark_bounced(email: str, reason: str) -> bool:
    """Mark email as bounced in LeadStore so all pipelines skip it."""
    try:
        from lead_store import LeadStore
        db = LeadStore()
        db.upsert_lead(email=email, stage="bounced",
                       error_info=f"reply_unsubscribe: {reason[:200]}")
        print(f"  [SUPPRESS_BOUNCE] {email}")
        return True
    except Exception as e:
        print(f"  [BOUNCE LOG ERROR] {e}")
        return False


def get_sender_email(thread: dict, our_inbox: str = "ops@launchcrate.io") -> str | None:
    """Extract the first real human sender email from a thread's senders list."""
    senders = thread.get("senders", [])
    inbox_lower = our_inbox.lower()
    for s in senders:
        # Extract email from "Name <email>" format
        if "<" in s and ">" in s:
            addr = s.split("<")[1].split(">")[0].strip().lower()
        else:
            addr = s.strip().lower()
        # Skip system / our own addresses
        if any(skip in addr for skip in
               ["agentmail.to", "mailer-daemon", "amazonses.com",
                "postmaster", inbox_lower, "launchcrate.io"]):
            continue
        return addr
    return None


def main():
    dry_run = "--dry-run" in sys.argv
    print(f"reply_monitor.py {'(DRY-RUN)' if dry_run else '(LIVE)'} — {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")

    gate = OutboundReleaseGate()
    processed = load_processed_threads(gate)

    # Watch both inboxes: new domain (all future sends) + legacy (existing sequences)
    inboxes_to_watch = [
        "sedrick@nebulacomponents.com",
        "nebulashop@agentmail.to",
    ]
    all_human_threads = []
    for inbox_id in inboxes_to_watch:
        try:
            am_inbox = AgentMailClient(inbox=inbox_id)
            threads = am_inbox.get_human_replies()
            print(f"  Inbox {inbox_id}: {len(threads)} human reply threads")
            all_human_threads.extend(threads)
        except Exception as e:
            print(f"  Inbox {inbox_id}: error — {e}")

    # Use default client for sending replies (uses new domain)
    am = AgentMailClient()
    human_threads = all_human_threads
    new_threads = [t for t in human_threads if t.get("thread_id") not in processed]
    print(f"\nHuman reply threads: {len(human_threads)}  Unprocessed: {len(new_threads)}")

    for thread in new_threads:
        thread_id = thread.get("thread_id", "")
        email = get_sender_email(thread)
        if not email:
            print(f"  [SKIP] thread {thread_id[:8]} — no identifiable sender")
            continue

        # Get the latest message body for classification
        msgs = am.list_messages(thread_id=thread_id, limit=3)
        latest_body = ""
        for m in reversed(msgs):
            body = m.get("text", "") or m.get("body", "") or ""
            if body.strip():
                latest_body = body[:500]  # first 500 chars is enough
                break

        classification = am.classify_reply(thread, latest_body)

        # 48-hour diagnostic: log which sentence failed for copy improvement.
        diag = am.diagnose_reply(thread, latest_body)
        if diag != "none":
            print(f"  [DIAGNOSTIC] {diag} — {email} ({classification})")
            try:
                with open(NEBULA / "reply_diagnostics.jsonl", "a") as f:
                    f.write(json.dumps({
                        "ts": datetime.now(timezone.utc).isoformat(),
                        "diagnosis": diag,
                        "classification": classification,
                        "sender": email,
                        "thread_id": thread_id,
                        "subject": (thread.get("subject") or "")[:120],
                        "preview": latest_body[:200],
                    }) + "\n")
            except Exception as e:
                print(f"  [DIAGNOSTIC LOG ERROR] {e}")

        print(f"  {email} -> {classification} (thread: {thread_id[:12]}...)")

        if dry_run:
            continue

        save_reply(gate, email, classification, thread_id, latest_body)

    if dry_run:
        print(f"\nDone. {len(new_threads)} new replies inspected; no state or actions changed.")
        return

    completed = 0
    for thread_id in gate.actionable_reply_thread_ids():
        action = gate.claim_reply_action(thread_id)
        if action is None:
            continue
        success = process_reply_action(action)
        gate.complete_reply_action(
            thread_id,
            success=success,
            error="" if success else "downstream_action_failed",
        )
        completed += int(success)

    print(f"\nDone. {len(new_threads)} new replies classified; {completed} actions completed.")


def process_reply_action(action: dict[str, str]) -> bool:
    """Execute one leased downstream action; callers persist success/failure."""
    classification = action["classification"]
    email = action["email"]
    body = action.get("message_excerpt", "")
    thread_id = action["thread_id"]
    if classification in {"unsubscribe", "unsubscribed", "do_not_contact", "stop_reply"}:
        return mark_bounced(email, body[:120] or "unsubscribe signal")
    if classification == "warm":
        return handle_warm_reply(email, body, thread_id, False)
    if classification == "cold":
        return handle_referral_mention(email, body, False)
    return True


def handle_warm_reply(email: str, body: str, thread_id: str, dry_run: bool) -> bool:
    """
    G1 + G4: Warm reply → advance LeadStore stage to 'warm', pause cold
    sequence, run audit if URL known, send $97 pitch with Stripe link.
    """
    print(f"  [WARM] {email} — advancing stage + triggering audit/pitch")

    # 1. Advance stage in LeadStore
    try:
        from lead_store import LeadStore
        db = LeadStore()
        lead = db.get_lead(email)
        note = f"warm_reply: {body[:200]}"
        if lead:
            db.advance_stage(email, "warm", notes=note)
        else:
            db.upsert_lead(email=email, stage="warm", source="reply_monitor",
                           notes=note)
    except Exception as e:
        print(f"  [WARM STAGE ERROR] {e}")
        return False

    if dry_run:
        print(f"  [DRY-RUN] would deliver audit + $97 pitch to {email}")
        return True

    # 2. Attempt audit + $97 pitch
    try:
        from followup_sequence import get_audit_data, send_email
        from stripe_links import get_97_checkout_url

        url = (lead or {}).get("url", "")
        domain = url.replace("https://", "").replace("http://", "").split("/")[0] if url else ""

        if url:
            audit = get_audit_data(url)
            score = float(audit.get("score") or 5)
            grade = audit.get("grade", "C")
            issue = audit.get("top_issue", "conversion gap")
            fix   = audit.get("top_fix", "Add a clear CTA above the fold.")
        else:
            score, grade, issue, fix = 5.0, "C", "conversion gap", "Add a clear CTA above the fold."
            domain = email.split("@")[-1] if "@" in email else ""

        stripe_url = get_97_checkout_url(email=email, lead_url=url or f"https://{domain}",
                                         audit_score=score, domain=domain)

        subject = f"re: {domain} — here's what I found" if domain else "re: your site audit"
        body_out = (
            f"Hey — thanks for getting back.\n\n"
            f"Ran the audit on {domain or 'your site'}. Score: {score}/10 ({grade}).\n\n"
            f"Main issue: {issue}\n\n"
            f"Fix: {fix}\n\n"
            f"We implement it in 24h for $97. Full refund if it doesn't move your numbers.\n\n"
            f"→ {stripe_url}\n\n"
            f"—\nReply STOP to opt out."
        )
        ok = send_email(email, subject, body_out, dry_run=False, conversation=True)
        if ok:
            try:
                from lead_store import LeadStore as _LS
                _LS().advance_stage(email, "pitch_sent",
                                    notes=f"stripe_url: {stripe_url} | subject: {subject}")
            except Exception as exc:
                print(f"  [WARM STAGE ERROR] {email}: {exc}")
                return False
            print(f"  [WARM PITCH SENT] {email}")
            return True
        else:
            print(f"  [WARM PITCH FAILED] {email}")
            return False
    except Exception as e:
        print(f"  [WARM PITCH ERROR] {email}: {e}")
        return False


def handle_referral_mention(email: str, body: str, dry_run: bool) -> bool:
    """
    G5: If a cold reply contains a name/email referral, extract and enqueue
    as a new lead with source='referral' and parent_email set.
    Looks for patterns like: 'talk to John / john@company.com / our head of marketing'.
    """
    import re
    # Detect embedded email address in reply body
    email_re = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
    found = [m for m in email_re.findall(body) if m.lower() != email.lower()]
    if not found:
        return True

    success = True
    for ref_email in found[:2]:  # cap at 2 per reply
        print(f"  [REFERRAL] {email} mentioned {ref_email}")
        if dry_run:
            print(f"  [DRY-RUN] would enqueue referral lead {ref_email}")
            continue
        try:
            from lead_store import LeadStore
            db = LeadStore()
            existing = db.get_lead(ref_email)
            if existing:
                print(f"  [REFERRAL SKIP] {ref_email} already in system")
                continue
            db.upsert_lead(
                email=ref_email,
                stage="free_kit",
                source="referral",
                notes=f"referral_from:{email} context:{body[:200]}",
            )
            print(f"  [REFERRAL ENQUEUED] {ref_email} ← {email}")
        except Exception as e:
            print(f"  [REFERRAL ERROR] {ref_email}: {e}")
            success = False
    return success


if __name__ == "__main__":
    main()
