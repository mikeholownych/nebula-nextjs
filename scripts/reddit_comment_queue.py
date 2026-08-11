#!/usr/bin/env python3
"""
Reddit comment queue - fires one comment per cron tick (every 30 min).
State: /home/mike/nebula/.reddit_comment_queue.json
Exit 0 + no stdout = silent (no Telegram delivery) when queue is empty.
Exit 0 + stdout = delivers result to Telegram.
Exit 1 = rate-limited or API error (Telegram gets error alert).
"""
import json, os, sys, urllib.request, urllib.error
from datetime import datetime, timezone
from pathlib import Path

# Governance gate - fail-closed. Any violation blocks the send.
sys.path.insert(0, str(Path(__file__).parent))
from reddit_governance import govern_reddit_content, record_activity

# Load env from .env if not already set (for cron context)
ENV_FILE = "/home/mike/nebula/.env"
if not os.environ.get("ZERNIO_API_KEY") and os.path.exists(ENV_FILE):
    for line in open(ENV_FILE):
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

QUEUE_FILE = "/home/mike/nebula/.reddit_comment_queue.json"
ACCOUNT_ID = "6a772422d0fe733d1a3f3959"  # Reddit: Elegant_Exam_8860
BASE = "https://zernio.com/api/v1"

# Slow-warm: max one send per RATE_LIMIT_HOURS. After the sitewide removal
# (2026-08-08), the account must not blast comments. One/day, promo-friendly
# subs only.
RATE_LIMIT_HOURS = 24

# Subs where API-posted comments have already triggered Reddit's sitewide
# filter or whose mods auto-remove anything that looks like promotion.
# Comments here are HELD for manual review, never auto-sent.
RISK_HOLD_SUBS = {"ppc", "facebookads", "googleads", "ecommerce", "entrepreneur"}


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
        # Silent exit - cron delivers nothing to Telegram, job stays scheduled but quiet
        sys.exit(0)

    item = q["pending"][0]
    post_id = item["post_id"]
    message = item["message"]
    label = item.get("label", post_id)
    remaining_after = len(q["pending"]) - 1
    sub = (item.get("subreddit", "") or "").lstrip("r/").lower()

    # ── RISK-TIER HOLD (fail-closed) ────────────────────────────────────
    # Subs that already triggered Reddit's sitewide filter or whose mods
    # auto-remove promotion. Never auto-send; hold for human review.
    if sub in RISK_HOLD_SUBS:
        item["risk_held_at"] = datetime.now(timezone.utc).isoformat()
        item["risk_hold_reason"] = f"subreddit '{sub}' in RISK_HOLD_SUBS (sitewide-removal risk)"
        q.setdefault("held", []).append(item)
        q["pending"].pop(0)
        save_queue(q)
        print(f"⛔ Reddit comment HELD (risk tier: {sub})\n{label}\nReason: {item['risk_hold_reason']}\nHeld for review: {len(q['held'])}")
        sys.exit(0)

    # ── RATE LIMIT (slow-warm: 1/day) ───────────────────────────────────
    if q.get("sent"):
        last_sent = datetime.fromisoformat(q["sent"][-1]["sent_at"])
        hours_since = (datetime.now(timezone.utc) - last_sent).total_seconds() / 3600
        if hours_since < RATE_LIMIT_HOURS:
            # Silent exit - within cooldown, nothing to report
            sys.exit(0)

    # ── GOVERNANCE GATE (fail-closed) ──────────────────────────────────
    g = govern_reddit_content(message, sub, "comment", account_id=ACCOUNT_ID)
    if not g["pass"]:
        item["governance_blocked_at"] = datetime.now(timezone.utc).isoformat()
        item["governance_reason"] = g["reason"]
        q.setdefault("held", []).append(item)
        q["pending"].pop(0)
        save_queue(q)
        print(f"⛔ Reddit comment HELD by governance (no send)\n{label}\nreason: {g['reason']}\nHeld for review: {len(q['held'])}")
        sys.exit(0)  # no Telegram error - deliberate hold, not a failure

    try:
        result = post_comment(api_key, post_id, message)
        comment_id = result.get("data", {}).get("commentId")
        item["comment_id"] = comment_id
        item["sent_at"] = datetime.now(timezone.utc).isoformat()
        # Post-send verification is MANUAL: Reddit's sitewide filter can remove
        # a comment while Zernio reports success. Flag for eyeball check.
        item["verification"] = "pending"
        item["verify_url"] = f"https://www.reddit.com/r/{sub}/comments/{post_id}/"
        q["sent"].append(item)
        q["pending"].pop(0)
        # Record activity for 90/10 + rate limiting
        is_promo = "sideproject" in sub or "buildinpublic" in sub
        record_activity(ACCOUNT_ID, "comment", sub, is_promo)
        save_queue(q)
        # stdout goes to Telegram
        print(f"✅ Reddit comment posted\n{label}\ncommentId: {comment_id}\nVERIFY: {item['verify_url']}\nRemaining in queue: {remaining_after}")
    except urllib.error.HTTPError as e:
        err = e.read().decode()[:300]
        print(f"❌ Reddit comment FAILED (will retry next tick)\n{label}\n{err}")
        # Don't pop from pending - retry next tick
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {type(e).__name__}: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
