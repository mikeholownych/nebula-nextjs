#!/usr/bin/env python3
"""Send queued replies from ops/queued_replies.json that have passed send_after_utc."""
from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path('/home/mike/nebula')
sys.path.insert(0, str(ROOT))

from agentmail_client import AgentMailClient
from send_window import in_send_window
from lead_store import LeadStore

QUEUE_FILE = ROOT / 'ops' / 'queued_replies.json'
SENT_LOG = ROOT / 'ledgers' / 'queued_replies_sent.jsonl'


def is_approved(item: dict) -> bool:
    """Fail closed unless an explicit approver and timestamp are persisted."""
    return bool(
        item.get('status') == 'approved'
        and item.get('approved_by')
        and item.get('approved_at')
    )


def queue_disposition(item: dict) -> str:
    if item.get('status') == 'rejected':
        return 'drop'
    if is_approved(item):
        return 'send'
    return 'retain'


def main() -> int:
    if not QUEUE_FILE.exists():
        return 0

    queue = json.loads(QUEUE_FILE.read_text())
    if not queue:
        return 0

    now = datetime.now(timezone.utc)
    am = AgentMailClient()
    db = LeadStore()

    remaining = []
    sent = 0

    for item in queue:
        to = item.get('to', '')
        send_after = item.get('send_after_utc')

        disposition = queue_disposition(item)
        if disposition == 'drop':
            continue
        if disposition == 'retain':
            remaining.append(item)
            continue

        # Check time gate
        if send_after:
            send_after_dt = datetime.fromisoformat(send_after.replace('Z', '+00:00'))
            if now < send_after_dt:
                remaining.append(item)
                continue

        # Check send window
        if not in_send_window(to):
            remaining.append(item)
            continue

        # Check bounce/suppress
        if db.is_bounced(to):
            print(f"SKIP {to} — bounced")
            continue

        # Send — reply() requires the message_id of the last message in the thread
        try:
            message_id = item.get('in_reply_to', '')
            if not message_id:
                print(f"SKIP {to} — no in_reply_to message_id")
                continue
            result = am.reply(
                message_id,
                recipient=to,
                text=item.get('body', ''),
            )
            sent += 1
            print(f"SENT → {to} | {item.get('subject','')[:50]}")

            # Log
            with open(SENT_LOG, 'a') as f:
                f.write(json.dumps({
                    'sent_at': now.isoformat(),
                    'to': to,
                    'subject': item.get('subject'),
                    'result': str(result)[:200],
                }) + '\n')

        except Exception as e:
            print(f"ERROR sending to {to}: {e}")
            remaining.append(item)

    # Write back unsent
    QUEUE_FILE.write_text(json.dumps(remaining, indent=2))
    print(f"[queued_replies] sent={sent} remaining={len(remaining)}")
    return 0


if __name__ == '__main__':
    sys.exit(main())
