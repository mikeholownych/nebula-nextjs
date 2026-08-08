#!/usr/bin/env python3
"""Reddit signal alerter — surfaces live trigger posts to Mike for manual reply.

No auto-posting (Reddit account not configured in Zernio). This surfaces
high-signal posts via Telegram so Mike can manually drop a value-first comment
from his Reddit account.

Run every 4h by cron. Deduped by post ID.
"""
import json
import os
import re
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path
import sys

NEBULA_DIR = Path("/home/mike/nebula")
SEEN_FILE = NEBULA_DIR / ".reddit_seen_posts.json"
TELEGRAM_TARGET = "telegram:5920497760"

COMMENT_HINTS = {
    "roast_request": (
        "Value-first reply:\n"
        '"Happy to look. I can run a structured 9-signal audit — specific findings rather than '
        'subjective impressions. Run it yourself in ~90s: '
        'https://nebulacomponents.com/audit?utm_source=reddit&utm_medium=manual — or drop the URL here."'
    ),
    "zero_conversions": (
        "Value-first reply:\n"
        '"The ad→page disconnect is usually the culprit. Headline/ad mismatch, CTA not visible above fold, '
        'no social proof near the CTA — these account for most drops. Free 9-signal audit: '
        'https://nebulacomponents.com/audit?utm_source=reddit&utm_medium=manual"'
    ),
    "ads_not_working": (
        "Value-first reply:\n"
        '"Worth checking if it\'s the page before adjusting the campaign. Ads deliver traffic; '
        'the page converts it (or doesn\'t). Free audit: '
        'https://nebulacomponents.com/audit?utm_source=reddit&utm_medium=manual"'
    ),
}

def load_seen():
    if SEEN_FILE.exists():
        return set(json.loads(SEEN_FILE.read_text()))
    return set()

def save_seen(seen: set):
    tmp = str(SEEN_FILE) + ".tmp"
    with open(tmp, "w") as f:
        json.dump(sorted(seen), f)
    os.rename(tmp, str(SEEN_FILE))

def telegram(msg):
    try:
        subprocess.run(["hermes", "send", "--to", TELEGRAM_TARGET, msg],
                      capture_output=True, timeout=20)
    except Exception:
        pass

def extract_post_id(url):
    m = re.search(r'/comments/([a-z0-9]+)/', url)
    return m.group(1) if m else None

def main():
    # Load the queue file written by the scanner cron
    queue_file = NEBULA_DIR / ".reddit_comment_queue.json"
    if not queue_file.exists():
        return

    queue = json.loads(queue_file.read_text())
    pending = queue.get("pending", [])
    seen = load_seen()

    alerted = 0
    newly_seen = set()

    for post in pending:
        post_id = post.get("post_id")
        if not post_id or post_id in seen:
            continue

        trigger = post.get("trigger_type", "zero_conversions")
        hint = COMMENT_HINTS.get(trigger, COMMENT_HINTS["zero_conversions"])

        msg = (
            f"📌 Reddit trigger post — manual comment opportunity\n\n"
            f"Subreddit: {post.get('subreddit', '?')}\n"
            f"Title: {post.get('title', '')[:100]}\n"
            f"URL: {post.get('url', '')}\n\n"
            f"{hint}"
        )
        telegram(msg)
        newly_seen.add(post_id)
        alerted += 1
        time.sleep(2)

    if newly_seen:
        save_seen(seen | newly_seen)
        print(f"Alerted: {alerted} Reddit post(s)")

if __name__ == "__main__":
    main()
