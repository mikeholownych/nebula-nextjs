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

        # Cold replies get one chance — mark in replied state but don't bounce
        # Warm replies get flagged; triage will handle escalation

    print(f"\nDone. {len(new_threads)} new replies classified.")


if __name__ == "__main__":
    main()
