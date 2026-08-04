#!/usr/bin/env python3
"""
Reddit comment queue — fires one comment per cron tick (every 30 min).
State: /home/mike/nebula/.reddit_comment_queue.json
Exit 0 + no stdout = silent (no Telegram delivery) when queue is empty.
Exit 0 + stdout = delivers result to Telegram.
Exit 1 = rate-limited or API error (Telegram gets error alert).
"""
import json, os, sys, urllib.request, urllib.error
from datetime import datetime, timezone

# Load env from .env if not already set (for cron context)
ENV_FILE = "/home/mike/nebula/.env"
if not os.environ.get("ZERNIO_API_KEY") and os.path.exists(ENV_FILE):
    for line in open(ENV_FILE):
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

QUEUE_FILE = "/home/mike/nebula/.reddit_comment_queue.json"
ACCOUNT_ID = "6a71416deb10586dadce3a88"  # NebulaCRO
BASE = "https://zernio.com/api/v1"


def load_queue():
    if os.path.exists(QUEUE_FILE):
        return json.load(open(QUEUE_FILE))
    return {"pending": [], "sent": [], "failed": []}


def save_queue(q):
    tmp = QUEUE_FILE + ".tmp"
    with open(tmp, "w") as f:
        json.dump(q, f, indent=2)
    os.rename(tmp, QUEUE_FILE)


def post_comment(api_key, post_id, message):
    url = f"{BASE}/inbox/comments/{post_id}"
    body = json.dumps({"accountId": ACCOUNT_ID, "message": message}).encode()
    req = urllib.request.Request(url, data=body, method="POST",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def main():
    api_key = os.environ.get("ZERNIO_API_KEY")
    if not api_key:
        print("ERROR: ZERNIO_API_KEY not set")
        sys.exit(1)

    q = load_queue()
    if not q["pending"]:
        # Silent exit — cron delivers nothing to Telegram, job stays scheduled but quiet
        sys.exit(0)

    item = q["pending"][0]
    post_id = item["post_id"]
    message = item["message"]
    label = item.get("label", post_id)
    remaining_after = len(q["pending"]) - 1

    try:
        result = post_comment(api_key, post_id, message)
        comment_id = result.get("data", {}).get("commentId")
        item["comment_id"] = comment_id
        item["sent_at"] = datetime.now(timezone.utc).isoformat()
        q["sent"].append(item)
        q["pending"].pop(0)
        save_queue(q)
        # stdout goes to Telegram
        print(f"✅ Reddit comment posted\n{label}\ncommentId: {comment_id}\nRemaining in queue: {remaining_after}")
    except urllib.error.HTTPError as e:
        err = e.read().decode()[:300]
        print(f"❌ Reddit comment FAILED (will retry next tick)\n{label}\n{err}")
        # Don't pop from pending — retry next tick
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {type(e).__name__}: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
