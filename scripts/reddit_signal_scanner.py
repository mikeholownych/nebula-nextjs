#!/usr/bin/env python3
"""Reddit trigger scanner — finds live posts with paid-traffic pain, queues
Zernio comments that offer the free audit.

Searches Google for recent Reddit posts with buying triggers, extracts post IDs,
drafts value-first comments, and adds them to .reddit_comment_queue.json.

Runs daily. Comment delivery is handled by reddit_comment_queue.py (every 30min).

Rules:
- Comments must be value-first — no pitch in the first comment
- Each post gets one comment max (deduped by post_id)
- Max 5 new posts per run (Zernio rate limit awareness)
"""
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
import subprocess

NEBULA_DIR = Path(__file__).resolve().parents[1]
QUEUE_FILE = NEBULA_DIR / ".reddit_comment_queue.json"
SEEN_FILE = NEBULA_DIR / ".reddit_seen_posts.json"
MAX_PER_RUN = 5

TELEGRAM_TARGET = "telegram:5920497760"

# Value-first comment templates per trigger type
COMMENT_TEMPLATES = {
    "zero_conversions": (
        "The ad → page disconnect is usually the culprit here. Most pages fail 3-4 of the "
        "same signals (headline doesn't match the ad, CTA above the fold isn't visible, "
        "social proof is absent or buried). If you share your landing page URL I can run a "
        "quick diagnostic — free tool, takes about 90 seconds: "
        "https://nebulacomponents.com/audit?utm_source=reddit&utm_medium=comment&utm_campaign=zero-conversions"
    ),
    "ads_not_working": (
        "Before adjusting the campaign, worth checking if the issue is the page rather than "
        "the ad. Ads deliver traffic; the page converts it (or doesn't). A few specific "
        "signals — message match, above-fold clarity, CTA strength — account for most of "
        "the drop. Free audit if you want a specific read on your page: "
        "https://nebulacomponents.com/audit?utm_source=reddit&utm_medium=comment&utm_campaign=ads-not-working"
    ),
    "high_cpc_no_sales": (
        "High CPC with no sales usually means the traffic is qualified but something on the "
        "page breaks trust or clarity before they convert. The most common culprits: "
        "headline/ad mismatch, no visible proof above the fold, vague CTA. "
        "If you want a specific breakdown of what's failing on your page, there's a free "
        "9-signal audit here: "
        "https://nebulacomponents.com/audit?utm_source=reddit&utm_medium=comment&utm_campaign=high-cpc"
    ),
    "roast_landing_page": (
        "Happy to take a look. I'll run it through a structured audit — 9 conversion signals "
        "with specific findings rather than subjective impressions. "
        "You can run it yourself in ~90s here: "
        "https://nebulacomponents.com/audit?utm_source=reddit&utm_medium=comment&utm_campaign=roast-request\n\n"
        "Or drop the URL and I'll post back what I find."
    ),
}


def load_queue():
    if QUEUE_FILE.exists():
        return json.loads(QUEUE_FILE.read_text())
    return {"pending": [], "sent": [], "failed": []}


def save_queue(q):
    tmp = str(QUEUE_FILE) + ".tmp"
    with open(tmp, "w") as f:
        json.dump(q, f, indent=2)
    os.rename(tmp, str(QUEUE_FILE))


def load_seen():
    if SEEN_FILE.exists():
        return set(json.loads(SEEN_FILE.read_text()))
    return set()


def save_seen(seen: set):
    tmp = str(SEEN_FILE) + ".tmp"
    with open(tmp, "w") as f:
        json.dump(sorted(seen), f)
    os.rename(tmp, str(SEEN_FILE))


def extract_reddit_post_id(url: str) -> str | None:
    """Extract Reddit post ID from URL."""
    m = re.search(r'/comments/([a-z0-9]+)/', url)
    return m.group(1) if m else None


def telegram(message: str):
    try:
        subprocess.run(
            ["hermes", "send", "--to", TELEGRAM_TARGET, message],
            capture_output=True, timeout=15,
        )
    except Exception:
        pass


def log(msg):
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    print(f"[{ts}] {msg}", flush=True)


def classify_trigger(title: str, snippet: str) -> str | None:
    """Classify which comment template to use."""
    t = (title + " " + snippet).lower()
    if any(w in t for w in ["roast", "feedback", "review my", "critique", "thoughts on"]):
        return "roast_landing_page"
    if any(w in t for w in ["zero conversions", "0 conversions", "no conversions", "zero sales", "0 sales"]):
        return "zero_conversions"
    if any(w in t for w in ["not converting", "not working", "not getting conversions", "poor conversion"]):
        return "ads_not_working"
    if any(w in t for w in ["high cpc", "high cost", "spent $", "burned $", "wasted $", "no sales", "no purchase"]):
        return "high_cpc_no_sales"
    return None


def search_reddit_signals() -> list[dict]:
    """Use system web_search equivalent — grep Hermes search output."""
    queries = [
        'site:reddit.com "ads not converting" landing page 2026',
        'site:reddit.com "zero conversions" "ads" "landing page" 2026',
        'site:reddit.com "roast my landing page" OR "feedback on my landing page" 2026',
        'site:reddit.com "spent $1000" OR "spent $500" "no conversions" 2026',
    ]

    results = []
    for query in queries:
        try:
            r = subprocess.run(
                ["hermes", "search", query, "--limit", "5"],
                capture_output=True, text=True, timeout=20, cwd=str(NEBULA_DIR),
            )
            if r.returncode == 0:
                # Try to parse JSON output
                try:
                    data = json.loads(r.stdout)
                    for item in data.get("results", []):
                        results.append({
                            "url": item.get("url", ""),
                            "title": item.get("title", ""),
                            "snippet": item.get("description", ""),
                        })
                except json.JSONDecodeError:
                    pass
        except Exception:
            pass
        time.sleep(1)

    return results


def run(dry_run=False):
    queue = load_queue()
    seen = load_seen()
    queued_ids = {item.get("post_id") for item in queue["pending"] + queue["sent"]}

    log(f"Queue: {len(queue['pending'])} pending, {len(queue['sent'])} sent")
    log(f"Seen: {len(seen)} post IDs")

    # Use web search to find signals
    results = search_reddit_signals()
    log(f"Search returned {len(results)} candidates")

    added = 0
    new_seen = set()

    for result in results:
        if added >= MAX_PER_RUN:
            break

        url = result.get("url", "")
        title = result.get("title", "")
        snippet = result.get("snippet", "")

        post_id = extract_reddit_post_id(url)
        if not post_id:
            continue

        if post_id in seen or post_id in queued_ids:
            continue

        trigger_type = classify_trigger(title, snippet)
        if not trigger_type:
            continue

        comment = COMMENT_TEMPLATES[trigger_type]
        entry = {
            "post_id": post_id,
            "url": url,
            "title": title[:120],
            "trigger_type": trigger_type,
            "message": comment,
            "queued_at": datetime.now(timezone.utc).isoformat(),
        }

        log(f"  + [{trigger_type}] {post_id}: {title[:60]}")

        if not dry_run:
            queue["pending"].append(entry)
        new_seen.add(post_id)
        added += 1

    if not dry_run and new_seen:
        save_queue(queue)
        save_seen(seen | new_seen)

    if added > 0:
        telegram(f"📌 Reddit queue: +{added} new comment(s) queued\n{chr(10).join(r['title'][:60] for r in queue['pending'][-added:])}")
    else:
        log("No new actionable posts found.")


def main():
    dry_run = "--dry-run" in sys.argv
    run(dry_run=dry_run)


if __name__ == "__main__":
    main()
