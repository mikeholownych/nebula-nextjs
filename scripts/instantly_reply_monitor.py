#!/usr/bin/env python3
"""Monitor Instantly AI SDR for inbound replies and surface them.

Polls /api/v2/ai-agents/sales/{id}/activities for action_type=email_received
(inbound prospect replies). Watermarks by timestamp to avoid re-alerting.
Prints new replies to stdout; empty stdout = nothing new (watchdog pattern).

Usage: python3 scripts/instantly_reply_monitor.py [--json]
"""
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

AGENT_ID = "019f5ee5-b2db-7063-b8bc-60d0e4efd390"
BASE = "https://api.instantly.ai/api/v2"
ENV_PATH = "/home/mike/nebula/.env"
WATERMARK_FILE = Path("/home/mike/nebula/seo-reports/instantly-reply-watermark.json")


def _load_key() -> str:
    key = os.environ.get("INSTANTLY_API_KEY")
    if key:
        return key
    if os.path.exists(ENV_PATH):
        with open(ENV_PATH) as f:
            for line in f:
                line = line.strip()
                if line.startswith("INSTANTLY_API_KEY="):
                    return line.split("=", 1)[1].strip()
    raise RuntimeError("INSTANTLY_API_KEY not set")


def _get(path: str) -> dict:
    key = _load_key()
    req = urllib.request.Request(
        BASE + path,
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "User-Agent": "NebulaComponents/1.0 (+https://nebulacomponents.com)",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def load_watermark() -> str:
    if WATERMARK_FILE.exists():
        return json.loads(WATERMARK_FILE.read_text()).get("last_seen", "")
    return ""


def save_watermark(ts: str) -> None:
    WATERMARK_FILE.parent.mkdir(exist_ok=True)
    WATERMARK_FILE.write_text(json.dumps({"last_seen": ts, "updated_at": datetime.now(timezone.utc).isoformat()}))


def main():
    as_json = "--json" in sys.argv
    last_seen = load_watermark()

    # Fetch recent activities — look for email_received (inbound prospect reply)
    data = _get(f"/ai-agents/sales/{AGENT_ID}/activities?limit=100")
    activities = data.get("items", data if isinstance(data, list) else [])

    new_replies = []
    newest_ts = last_seen

    for act in activities:
        if act.get("action_type") != "email_received":
            continue
        ts = act.get("timestamp_created", "")
        if ts <= last_seen:
            continue
        if ts > newest_ts:
            newest_ts = ts
        output = act.get("action_output", {})
        new_replies.append({
            "timestamp": ts,
            "lead_email": output.get("lead_email", ""),
            "from_email": output.get("from_email", output.get("lead_email", "")),
            "subject": output.get("subject", ""),
            "body_preview": output.get("body_text", output.get("body_html", ""))[:300].strip(),
            "thread_id": output.get("thread_id", ""),
            "activity_id": act.get("id", ""),
        })

    if newest_ts > last_seen:
        save_watermark(newest_ts)

    if not new_replies:
        return  # empty stdout = nothing new (watchdog pattern)

    if as_json:
        print(json.dumps(new_replies, indent=2))
        return

    print(f"Instantly: {len(new_replies)} new inbound reply/replies")
    print()
    for r in new_replies:
        print(f"  From: {r['from_email']}")
        print(f"  Subject: {r['subject']}")
        print(f"  When: {r['timestamp'][:16]}")
        if r['body_preview']:
            print(f"  Preview: {r['body_preview'][:150]}")
        print()


if __name__ == "__main__":
    main()
