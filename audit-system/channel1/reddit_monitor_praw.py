#!/usr/bin/env python3
"""
[READ-ONLY MONITOR - 2026-07-31] Reddit is DEAD for outreach (account standing,
API apps denied, comments auto-deleted). This script is KEPT ONLY as a read-only
market-signal monitor (PRAW official API). It MUST NOT send, reply, or auto-post
anything. Outreach path: ops/lead_lanes + teardown engine (ramp_pipeline_fill.py v2).
"""
"""
channel1/reddit_monitor_praw.py - Official Reddit API lead monitor (PRAW).

Why this exists (2026-07-31): unauthenticated Reddit access is fully blocked
(JSON API 403, old.reddit Cloudflare, RSS, Apify actors noisy). The OFFICIAL
API via PRAW is a separate, legitimate path - free tier, narrow subreddit
monitoring only. This replaces the web_search fallback for freshness: real
subreddit + real-time new posts + no LLM filter noise.

Requires OAuth credentials (2-minute setup, Mike-only):
  1. https://www.reddit.com/prefs/apps → "create another app..."
     type: script, name: nebula-lead-monitor, redirect: http://localhost:8080
  2. Save client_id + secret to ~/.hermes/secrets/reddit.env:
       REDDIT_CLIENT_ID=<14-char id>
       REDDIT_CLIENT_SECRET=<secret>
       REDDIT_USER_AGENT="nebula-lead-monitor/1.0 by <your_reddit_username>"
  (Or export the same vars in the shell.)

Usage:
  venv/bin/python3 reddit_monitor_praw.py            # baseline on first run, emit new after
  venv/bin/python3 reddit_monitor_praw.py --once     # force emit regardless of baseline
  venv/bin/python3 reddit_monitor_praw.py --dry-run  # fetch + score, print, write nothing

Output: appends to channel1/reddit_leads.jsonl, shaped like signal_queue.jsonl
so intake_signal_queue.py can consume it: intake_signal_queue.py --queue reddit_leads.jsonl

Scoring (matches high-intent-outreach skill): +1 per trigger phrase, +2 live
product URL, +2 dollar amount (active spend). Cap 10. If BOTH spend and
zero-result patterns match, floor at 7 (skill's soft pre-score heuristic).
Emit score >= 3 (2-3 = "queue for batch"; 0-1 = skip).
"""

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).parent
OUT = HERE / "reddit_leads.jsonl"
STATE = HERE / "reddit_seen.json"
SECRETS = Path.home() / ".hermes" / "secrets" / "reddit.env"

# From high-intent-outreach skill - ICP-relevant subreddits
SUBREDDITS = [
    "startups", "SaaS", "PPC", "FacebookAds", "googleads", "ecommerce",
    "smallbusiness", "digital_marketing", "marketing", "EntrepreneurRideAlong",
    "SideProject", "GrowthHacking", "Entrepreneur", "advancedentrepreneur",
]

# From high-intent-outreach skill TRIGGER_PHRASES
TRIGGER_PHRASES = [
    "roast my landing page", "landing page not converting",
    "ads not converting", "spending on ads", "burning through",
    "wasting money on ads", "no conversions", "zero conversions",
    "terrible conversion", "low conversion", "conversion rate help",
    "cro help", "cro audit", "review my landing page",
    "my ads aren't working", "roas is terrible", "roas tanked",
    "cost per lead too high", "burning budget", "burning cash on ads",
    "help with my funnel", "funnel not converting",
]

# Financial regex - extended to catch €, K suffix, currency-after-amount
FINANCIAL = re.compile(
    r"(\$\s?\d[\d,]*k?|€\s?\d[\d,]*k?|\d[\d,]*k?\s?(usd|eur|cad)|spent|burning|wasted|blew|throwing)",
    re.I,
)
ZERO_PATTERN = re.compile(
    r"(zero|0\s*(sales|signups|customers|conversions|leads)|no\s*(sales|signups|customers|conversions|leads)|not converting)",
    re.I,
)


def load_env(path: Path) -> None:
    if path.exists():
        for line in path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip().strip('"'))


def load_seen() -> set:
    if STATE.exists():
        try:
            return set(json.loads(STATE.read_text()))
        except json.JSONDecodeError:
            return set()
    return set()


def save_seen(seen: set) -> None:
    STATE.write_text(json.dumps(sorted(seen)))


def score_post(title: str, selftext: str, url: str) -> tuple[int, list[str]]:
    text = f"{title} {selftext}"
    low = text.lower()
    hits = [p for p in TRIGGER_PHRASES if p in low]
    score = len(hits)
    if url and url.startswith("http") and "reddit.com" not in url:
        score += 2
    if FINANCIAL.search(text):
        score += 2
    if ZERO_PATTERN.search(text):
        score += 2
    if FINANCIAL.search(text) and ZERO_PATTERN.search(text):
        score = max(score, 7)
    return min(score, 10), hits


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--once", action="store_true", help="emit even on first run")
    p.add_argument("--limit", type=int, default=25, help="posts per subreddit")
    args = p.parse_args()

    load_env(SECRETS)
    client_id = os.environ.get("REDDIT_CLIENT_ID", "").strip()
    client_secret = os.environ.get("REDDIT_CLIENT_SECRET", "").strip()
    user_agent = os.environ.get("REDDIT_USER_AGENT", "").strip()

    if not (client_id and client_secret and user_agent):
        print("❌ Missing Reddit OAuth credentials.")
        print("   Create a script app at https://www.reddit.com/prefs/apps, then write")
        print(f"   {SECRETS} with REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET / REDDIT_USER_AGENT.")
        print("   (PRAW is the OFFICIAL API - distinct from the blocked scraping paths.)")
        return 1

    import praw

    reddit = praw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        user_agent=user_agent,
    )

    seen = load_seen()
    first_run = not seen and not args.once
    emitted = 0

    for sub_name in SUBREDDITS:
        try:
            sub = reddit.subreddit(sub_name)
            for post in sub.new(limit=args.limit):
                pid = post.id
                title = post.title or ""
                selftext = (post.selftext or "")[:500]
                url = post.url or ""
                if pid in seen:
                    continue
                seen.add(pid)
                score, hits = score_post(title, selftext, url)
                if score < 3:
                    continue
                entry = {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "source": "reddit_praw",
                    "url": f"https://www.reddit.com{post.permalink}",
                    "author": str(post.author) if post.author else "",
                    "product_url": url if url.startswith("http") and "reddit.com" not in url else "",
                    "headline": title[:300],
                    "trigger_text": f"{hits} | {selftext[:200]}",
                    "signal_score": score,
                    "contacted": False,
                }
                if args.dry_run:
                    print(f"  [SCORE {score}] r/{sub_name}: {title[:80]}")
                else:
                    with open(OUT, "a") as f:
                        f.write(json.dumps(entry) + "\n")
                emitted += 1
        except Exception as e:
            print(f"  ⚠️ r/{sub_name}: {e}")
        time.sleep(2)  # polite rate limiting between subreddits

    if not args.dry_run:
        save_seen(seen)

    if first_run:
        print(f"Baseline recorded ({emitted} matching posts seen, none emitted). "
              f"Next run will emit new matches to {OUT.name}.")
    else:
        print(f"Emitted {emitted} new lead(s) → {OUT.name if not args.dry_run else '(dry run)'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
