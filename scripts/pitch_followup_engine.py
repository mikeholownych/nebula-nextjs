#!/usr/bin/env python3
"""
Pitch Follow-Up Engine for Nebula Components.

Reads seo/ledger/pitches.jsonl and manages follow-up cadence for editorial pitches:
- 7 days no reply: sends follow-up 1
- 14 days no reply: sends follow-up 2
- Reply detected: marks replied

Usage:
    python3 scripts/pitch_followup_engine.py           # live mode
    python3 scripts/pitch_followup_engine.py --dry-run # checks logic, no sends
"""

import json
import os
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

DRY_RUN = "--dry-run" in sys.argv
REPO_ROOT = Path(__file__).resolve().parent.parent
LEDGER_PATH = REPO_ROOT / "seo" / "ledger" / "pitches.jsonl"
LEAD_DB = REPO_ROOT / "lead_state.db"
FROM_INBOX = "mike@nebulacomponents.com"

FOLLOW_UP_1_DAYS = 7
FOLLOW_UP_2_DAYS = 14


def _first_name(email: str) -> str:
    """Extract a best-guess first name from an email address."""
    local = email.split("@")[0]
    # stefan@cxl.com -> Stefan; hello@unbounce.com -> there
    parts = local.replace(".", " ").replace("_", " ").replace("-", " ").split()
    if parts and parts[0].lower() not in ("hello", "info", "contact", "hi", "hey", "team", "admin", "support"):
        return parts[0].capitalize()
    return "there"


def _follow_up_1_body(first_name: str, subject: str) -> str:
    return f"""Hi {first_name},

Wanted to follow up on the pitch I sent last week.

One additional data point: social proof issues have the highest per-finding conversion impact in our dataset (4.3 out of 5) but show up in only 7.1% of pages. When social proof architecture is wrong, it is usually very wrong -- and it is almost never on anyone's radar.

Happy to send a full draft if that would make the decision easier.

Mike
Nebula Components
mike@nebulacomponents.com"""


def _follow_up_2_body(first_name: str, subject: str) -> str:
    return f"""Hi {first_name},

Last follow-up on this. I have a full 2,500-word draft ready if you would like to read it before deciding -- no commitment to publish, just easier to evaluate with something concrete in hand.

Happy to send it over. Otherwise no worries.

Mike"""


def _load_pitches():
    pitches = []
    with open(LEDGER_PATH) as f:
        for line in f:
            line = line.strip()
            if line:
                pitches.append(json.loads(line))
    return pitches


def _save_pitches(pitches):
    with open(LEDGER_PATH, "w") as f:
        for p in pitches:
            f.write(json.dumps(p) + "\n")


def _days_since(iso_ts: str) -> float:
    sent = datetime.fromisoformat(iso_ts.replace("Z", "+00:00"))
    now = datetime.now(timezone.utc)
    return (now - sent).total_seconds() / 86400


def _has_reply_in_thread(am, thread_id: str, our_email: str) -> tuple[bool, str]:
    """Check thread for replies from anyone other than us. Returns (has_reply, preview)."""
    if not thread_id:
        return False, ""
    msgs = am.list_messages(thread_id=thread_id, limit=50)
    our_lower = our_email.lower()
    for msg in msgs:
        sender = (msg.get("from") or msg.get("sender") or "").lower()
        if sender and our_lower not in sender:
            preview = msg.get("text") or msg.get("body") or msg.get("subject") or ""
            if isinstance(preview, str):
                preview = preview[:120].replace("\n", " ").strip()
            return True, preview
    return False, ""


def _find_thread_by_recipient(am, recipient: str) -> str | None:
    """Find a thread ID by scanning recent threads for recipient match."""
    threads = am.list_threads(limit=100)
    rec_lower = recipient.lower()
    for t in threads:
        recipients = t.get("recipients") or t.get("to") or []
        if isinstance(recipients, str):
            recipients = [recipients]
        for r in recipients:
            if rec_lower in r.lower():
                return t.get("id") or t.get("thread_id")
    return None


def _ensure_lead(email: str, source: str = "pitch-outreach"):
    """Register the pitch target in lead_state.db if not present."""
    if DRY_RUN:
        return
    if not LEAD_DB.exists():
        return
    try:
        conn = sqlite3.connect(str(LEAD_DB))
        existing = conn.execute("SELECT email FROM leads WHERE email=?", (email,)).fetchone()
        if not existing:
            conn.execute(
                "INSERT INTO leads (email, url, stage, source) VALUES (?, ?, ?, ?)",
                (email, "", "pitched", source),
            )
            conn.commit()
        else:
            # Update stage to pitched if earlier
            conn.execute(
                "UPDATE leads SET stage=?, source=?, pitch_sent_at=COALESCE(pitch_sent_at, datetime('now')) WHERE email=? AND stage NOT IN ('pitched', 'replied', 'closed-won')",
                ("pitched", source, email),
            )
            conn.commit()
        conn.close()
    except Exception as e:
        # Lead DB failure is not fatal - pitch engine continues
        print(f"[WARN] lead_state.db update failed for {email}: {e}", file=sys.stderr)


def main():
    if not LEDGER_PATH.exists():
        # Nothing to process
        return

    pitches = _load_pitches()
    if not pitches:
        return

    # Import here so --dry-run still tests the import path
    sys.path.insert(0, str(REPO_ROOT))
    from agentmail_client import AgentMailClient

    am = AgentMailClient(inbox=FROM_INBOX)

    changed = False
    actions = []

    for pitch in pitches:
        if pitch.get("status") != "sent":
            continue

        recipient = pitch["to"]
        subject = pitch["subject"]
        thread_id = pitch.get("thread_id")
        sent_at = pitch["sent_at"]
        pitch_id = pitch["id"]
        first_name = _first_name(recipient)
        days = _days_since(sent_at)

        # Ensure this recipient is registered in lead_state.db
        _ensure_lead(recipient)

        # If thread_id is missing, try to discover it
        if not thread_id:
            if not DRY_RUN:
                found_tid = _find_thread_by_recipient(am, recipient)
                if found_tid:
                    pitch["thread_id"] = found_tid
                    thread_id = found_tid
                    changed = True

        # Check for reply in thread
        has_reply, reply_preview = False, ""
        if thread_id:
            has_reply, reply_preview = _has_reply_in_thread(am, thread_id, FROM_INBOX)

        if has_reply and pitch.get("status") == "sent":
            pitch["status"] = "replied"
            pitch["reply_preview"] = reply_preview
            changed = True
            actions.append(f"[{pitch_id}] Reply detected from {recipient} -- marked replied")
            continue

        # Follow-up 2: 14 days, no reply, not yet sent
        if days >= FOLLOW_UP_2_DAYS and pitch.get("follow_up_2_sent") is None and pitch.get("follow_up_1_sent") is not None:
            fu2_subject = f"Re: {subject}"
            fu2_body = _follow_up_2_body(first_name, subject)
            if not DRY_RUN:
                result = am.send(
                    to=[recipient],
                    subject=fu2_subject,
                    text=fu2_body,
                    client_id=f"campaign:{pitch_id}-fu2",
                )
                if result.get("_error"):
                    actions.append(f"[{pitch_id}] ERROR sending follow-up 2 to {recipient}: {result.get('_reason', result['_error'])}")
                    continue
            pitch["follow_up_2_sent"] = datetime.now(timezone.utc).isoformat()
            changed = True
            mode = "[DRY-RUN] " if DRY_RUN else ""
            actions.append(f"{mode}[{pitch_id}] Follow-up 2 sent to {recipient} (day {days:.0f})")

        # Follow-up 1: 7 days, no reply, not yet sent
        elif days >= FOLLOW_UP_1_DAYS and pitch.get("follow_up_1_sent") is None:
            fu1_subject = f"Re: {subject}"
            fu1_body = _follow_up_1_body(first_name, subject)
            if not DRY_RUN:
                result = am.send(
                    to=[recipient],
                    subject=fu1_subject,
                    text=fu1_body,
                    client_id=f"campaign:{pitch_id}-fu1",
                )
                if result.get("_error"):
                    actions.append(f"[{pitch_id}] ERROR sending follow-up 1 to {recipient}: {result.get('_reason', result['_error'])}")
                    continue
            pitch["follow_up_1_sent"] = datetime.now(timezone.utc).isoformat()
            changed = True
            mode = "[DRY-RUN] " if DRY_RUN else ""
            actions.append(f"{mode}[{pitch_id}] Follow-up 1 sent to {recipient} (day {days:.0f})")

    if changed and not DRY_RUN:
        _save_pitches(pitches)

    for line in actions:
        print(line)


if __name__ == "__main__":
    main()
