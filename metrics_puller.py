#!/usr/bin/env python3
"""
metrics_puller.py — G6: Pull live open/reply metrics from AgentMail and
feed them into copy_fatigue_detector's A/B registry.

Run on schedule (every 6h) via cron:
    python3 /home/mike/nebula/metrics_puller.py

For each sent thread in ab_registry.jsonl that lacks outcome data, check
AgentMail for replies (→ replied=True) and mark opened heuristically
(AgentMail doesn't expose open events; we treat any reply as opened).

Also writes a summary line to metrics_pull_log.jsonl for auditing.
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, "/home/mike/nebula")

AB_REGISTRY   = Path("/home/mike/nebula/ab_registry.jsonl")
METRICS_LOG   = Path("/home/mike/nebula/metrics_pull_log.jsonl")
NEBULA        = Path("/home/mike/nebula")


def _load_lines(path: Path) -> list[dict]:
    if not path.exists():
        return []
    out = []
    for ln in path.read_text().splitlines():
        ln = ln.strip()
        if ln:
            try:
                out.append(json.loads(ln))
            except json.JSONDecodeError:
                pass
    return out


def _write_lines(path: Path, rows: list[dict]) -> None:
    tmp = str(path) + ".tmp"
    with open(tmp, "w") as f:
        for r in rows:
            f.write(json.dumps(r) + "\n")
    os.rename(tmp, str(path))


def pull_and_update() -> dict:
    """
    Main entry point.  Returns summary dict: {checked, updated, errors}.
    """
    from agentmail_client import AgentMailClient
    am = AgentMailClient()

    rows = _load_lines(AB_REGISTRY)
    if not rows:
        print("[metrics_puller] ab_registry.jsonl empty — nothing to update")
        return {"checked": 0, "updated": 0, "errors": 0}

    # Build index: email → list of row indices that need outcome update
    pending: dict[str, list[int]] = {}
    for i, r in enumerate(rows):
        if not r.get("replied") and not r.get("opened"):
            em = r.get("email", "")
            if em:
                pending.setdefault(em, []).append(i)

    if not pending:
        print("[metrics_puller] All registry entries already have outcomes — done")
        return {"checked": 0, "updated": 0, "errors": 0}

    print(f"[metrics_puller] Checking {len(pending)} emails for reply/open outcomes…")

    # Pull all human reply threads once
    try:
        reply_threads = am.get_human_replies()
    except Exception as e:
        print(f"[metrics_puller] ERROR fetching threads: {e}")
        return {"checked": 0, "updated": 0, "errors": 1}

    # Build set of emails that have replied
    replied_emails: set[str] = set()
    positive_signals = ("yes", "interested", "tell me more", "how much",
                        "send it", "sounds good", "let's", "sure", "go ahead")
    positive_emails: set[str] = set()

    for t in reply_threads:
        senders = t.get("senders", [])
        for s in senders:
            addr = s.split("<")[-1].split(">")[0].strip().lower() if "<" in s else s.strip().lower()
            if addr:
                replied_emails.add(addr)
        # Check snippet for positive signals
        snippet = (t.get("snippet") or "").lower()
        if any(sig in snippet for sig in positive_signals):
            for s in senders:
                addr = s.split("<")[-1].split(">")[0].strip().lower() if "<" in s else s.strip().lower()
                if addr:
                    positive_emails.add(addr)

    updated = 0
    for email, indices in pending.items():
        if email.lower() not in replied_emails:
            continue
        is_positive = email.lower() in positive_emails
        for i in indices:
            rows[i]["replied"] = True
            rows[i]["opened"]  = True  # treat reply as open confirmation
            if is_positive:
                rows[i]["positive"] = True
        updated += len(indices)
        print(f"  [updated] {email} → replied=True positive={is_positive}")

    if updated:
        _write_lines(AB_REGISTRY, rows)
        print(f"[metrics_puller] Updated {updated} registry entries")
    else:
        print(f"[metrics_puller] No new outcomes found")

    # Append audit log entry
    summary = {
        "ts":           datetime.now(timezone.utc).isoformat(),
        "rows_checked": len(pending),
        "reply_threads": len(reply_threads),
        "updated":      updated,
    }
    with open(METRICS_LOG, "a") as f:
        f.write(json.dumps(summary) + "\n")

    return {"checked": len(pending), "updated": updated, "errors": 0}


if __name__ == "__main__":
    result = pull_and_update()
    print(f"\n[metrics_puller] done — {result}")
