#!/usr/bin/env python3
"""
reply_monitor.py — Check AgentMail inbox for human replies, classify, persist.
Run every 15-30 min via cron. Idempotent — never double-processes a thread.

Persists to replied_emails.jsonl: {email, classification, thread_id, timestamp}
For "unsubscribe" signals, also marks the lead as bounced in LeadStore.
"""

import json, sys
from datetime import datetime, timezone
from pathlib import Path

NEBULA = Path("/home/mike/nebula")
REPLIED_FILE = NEBULA / "replied_emails.jsonl"

sys.path.insert(0, str(NEBULA))
from agentmail_client import AgentMailClient


def load_processed_threads() -> set:
    """Return set of thread_ids already processed."""
    if not REPLIED_FILE.exists():
        return set()
    processed = set()
    with open(REPLIED_FILE) as f:
        for line in f:
            if line.strip():
                try:
                    entry = json.loads(line)
                    if entry.get("thread_id"):
                        processed.add(entry["thread_id"])
                except json.JSONDecodeError:
                    continue
    return processed


def save_reply(email: str, classification: str, thread_id: str):
    """Persist a reply classification."""
    record = {
        "email":         email.lower(),
        "classification": classification,
        "thread_id":     thread_id,
        "detected_at":   datetime.now(timezone.utc).isoformat(),
    }
    with open(REPLIED_FILE, "a") as f:
        f.write(json.dumps(record) + "\n")
    print(f"  [REPLIED] {email} -> {classification}")


def mark_bounced(email: str, reason: str):
    """Mark email as bounced in LeadStore so all pipelines skip it."""
    try:
        from lead_store import LeadStore
        db = LeadStore()
        db.upsert_lead(email=email, stage="bounced",
                       error_info=f"reply_unsubscribe: {reason[:200]}")
        print(f"  [SUPPRESS_BOUNCE] {email}")
    except Exception as e:
        print(f"  [BOUNCE LOG ERROR] {e}")


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

    am = AgentMailClient()
    processed = load_processed_threads()
    human_threads = am.get_human_replies()

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
        print(f"  {email} -> {classification} (thread: {thread_id[:12]}...)")

        if dry_run:
            continue

        save_reply(email, classification, thread_id)

        # Unsubscribe signals = mark as bounced immediately
        if classification == "unsubscribe":
            mark_bounced(email, latest_body[:120] if latest_body else "unsubscribe signal")

        # ── G1 + G4: Warm reply → advance stage + trigger audit delivery ──
        elif classification == "warm":
            handle_warm_reply(email, latest_body, thread_id, dry_run)

        # ── G5: Referral mention → create new lead ───────────────────────
        elif classification == "cold":
            handle_referral_mention(email, latest_body, dry_run)

    print(f"\nDone. {len(new_threads)} new replies classified.")


def handle_warm_reply(email: str, body: str, thread_id: str, dry_run: bool) -> None:
    """
    G1 + G4: Warm reply → advance LeadStore stage to 'warm', pause cold
    sequence, run audit if URL known, send $147 pitch with Stripe link.
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
        lead = None

    if dry_run:
        print(f"  [DRY-RUN] would deliver audit + $147 pitch to {email}")
        return

    # 2. Attempt audit + $147 pitch
    try:
        from followup_sequence import NEBULA, get_audit_data, send_email, DRY_RUN
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
            f"We implement it in 24h for $147. Full refund if it doesn't move your numbers.\n\n"
            f"→ {stripe_url}\n\n"
            f"—\nReply STOP to opt out."
        )
        ok = send_email(email, subject, body_out, DRY_RUN)
        if ok:
            try:
                from lead_store import LeadStore as _LS
                _LS().advance_stage(email, "pitch_sent",
                                    notes=f"stripe_url: {stripe_url} | subject: {subject}")
            except Exception:
                pass
            print(f"  [WARM PITCH SENT] {email}")
        else:
            print(f"  [WARM PITCH FAILED] {email}")
    except Exception as e:
        print(f"  [WARM PITCH ERROR] {email}: {e}")


def handle_referral_mention(email: str, body: str, dry_run: bool) -> None:
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
        return

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


if __name__ == "__main__":
    main()
