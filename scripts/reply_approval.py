#!/usr/bin/env python3
"""Approve or reject one exact queued support reply.

Approval records actor and timestamp. It does not send directly; the existing
bounded sender performs suppression, send-window, and reply checks.
"""

from __future__ import annotations

import argparse
import fcntl
import json
import os
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path("/home/mike/nebula")
DEFAULT_QUEUE = ROOT / "ops" / "queued_replies.json"
DEFAULT_LOCK = ROOT / ".queued_replies.lock"


def update_status(
    queue_path: Path,
    item_id: str,
    action: str,
    actor: str,
    timestamp: str | None = None,
    lock_path: Path | None = None,
) -> str:
    if action not in {"approve", "reject"}:
        raise ValueError("action must be approve or reject")
    actor = actor.strip()
    if not actor:
        raise ValueError("actor is required")
    timestamp = timestamp or datetime.now(timezone.utc).isoformat()
    lock_path = lock_path or queue_path.with_suffix(".lock")
    lock_path.parent.mkdir(parents=True, exist_ok=True)

    with open(lock_path, "a+") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        try:
            queue = json.loads(queue_path.read_text()) if queue_path.exists() else []
            target = next((item for item in queue if item.get("id") == item_id), None)
            if target is None:
                raise KeyError(item_id)
            if target.get("status") != "pending_approval":
                raise ValueError(f"draft is already {target.get('status', 'unknown')}")

            if action == "approve":
                target["status"] = "approved"
                target["approved_by"] = actor
                target["approved_at"] = timestamp
                result = "approved"
            else:
                target["status"] = "rejected"
                target["rejected_by"] = actor
                target["rejected_at"] = timestamp
                target.pop("approved_by", None)
                target.pop("approved_at", None)
                result = "rejected"

            tmp = queue_path.with_suffix(".tmp")
            tmp.write_text(json.dumps(queue, indent=2))
            os.replace(tmp, queue_path)
            return result
        finally:
            fcntl.flock(lock, fcntl.LOCK_UN)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=("approve", "reject"))
    parser.add_argument("item_id")
    parser.add_argument("--by", required=True, dest="actor")
    parser.add_argument("--queue", type=Path, default=DEFAULT_QUEUE)
    args = parser.parse_args()

    result = update_status(
        args.queue,
        args.item_id,
        args.action,
        args.actor,
        lock_path=DEFAULT_LOCK if args.queue == DEFAULT_QUEUE else None,
    )
    print(f"{result}: {args.item_id}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
