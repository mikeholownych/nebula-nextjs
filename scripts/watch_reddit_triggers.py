#!/usr/bin/env python3
"""Watch Reddit for buying-trigger posts: ad spend bleeding, no conversions, CRO pain.

Polls multiple subreddits for posts matching high-intent buying signals.
Emits ONLY new posts since last watermark — silent on no change.

Usage (cron, no-agent):
    hermes cron create reddit-trigger-watcher \
      --schedule "*_/30 * * * *" --no-agent \
      --script "~/.hermes/skills/devops/watchers/scripts/watch_reddit_triggers.py"

Requires: requests (pip install requests)
State dir: $HERMES_HOME/watcher-state/
"""

from __future__ import annotations

import sys
import time
from pathlib import Path
from xml.etree import ElementTree as ET

try:
    import requests as _requests
    _USE_REQUESTS = True
except ImportError:
    import urllib.request
    _USE_REQUESTS = False

sys.path.insert(0, str(Path(__file__).parent))
from _watermark import Watermark, format_items_as_markdown  # type: ignore

SUBREDDITS = [
    "startups",
    "Entrepreneur",
    "smallbusiness",
    "PPC",
    "digital_marketing",
    "marketing",
    "SaaS",
    "ecommerce",
    "advancedentrepreneur",
    "googleads",
    "facebookads",
]

TRIGGER_PHRASES = [
    "roast my landing page",
    "landing page not converting",
    "landing page isn't converting",
    "ads not converting",
    "spending on ads",
    "burning through",
    "wasting money on ads",
    "no conversions",
    "zero conversions",
    "terrible conversion",
    "low conversion",
    "conversion rate help",
    "conversion rate sucks",
    "cro help",
    "cro audit",
    "review my landing page",
    "critique my landing page",
    "landing page feedback",
    "my ads aren't working",
    "ads not working",
    "roas is terrible",
    "roas tanked",
    "cost per lead too high",
    "cpl is insane",
    "burning budget",
    "burning cash on ads",
    "help with my funnel",
    "funnel not converting",
]

def fetch_subreddit_rss(subreddit: str, limit: int = 25) -> list[dict]:
    """Fetch newest posts from a subreddit via RSS (no auth required)."""
    url = f"https://www.reddit.com/r/{subreddit}/new/.rss?limit={limit}"
    headers = {"User-Agent": "Hermes-NebulaChallengeBot/1.0 (lead signal watcher)"}
    try:
        if _USE_REQUESTS:
            resp = _requests.get(url, headers=headers, timeout=15)
            if resp.status_code != 200:
                print(f"[warn] {subreddit}: HTTP {resp.status_code}", file=sys.stderr)
                return []
            raw = resp.content
        else:
            req = urllib.request.Request(url, headers=headers)  # type: ignore[possibly-unbound]
            with urllib.request.urlopen(req, timeout=15) as r:  # type: ignore[possibly-unbound]
                raw = r.read()
        root = ET.fromstring(raw)
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        entries = root.findall("atom:entry", ns)
        posts = []
        for entry in entries:
            title = entry.findtext("atom:title", "", ns)
            link_el = entry.find("atom:link", ns)
            url_ = link_el.get("href", "") if link_el is not None else ""
            entry_id = entry.findtext("atom:id", "", ns)
            parts = entry_id.split("/")
            post_id = parts[-2] if len(parts) >= 2 else entry_id
            content = entry.findtext("atom:content", "", ns)[:500]
            author_el = entry.find("atom:author/atom:name", ns)
            author = author_el.text if author_el is not None else ""
            posts.append({
                "id": post_id,
                "title": title,
                "url": url_,
                "selftext": content,
                "author": author,
                "score": 0,
            })
        return posts
    except Exception as e:
        print(f"[warn] {subreddit}: {e}", file=sys.stderr)
        return []

def matches_trigger(title: str, selftext: str = "") -> bool:
    """Return True if post matches any buying trigger phrase."""
    combined = (title + " " + selftext).lower()
    return any(phrase in combined for phrase in TRIGGER_PHRASES)

def score_post(title: str, selftext: str = "") -> int:
    """Score a post 0-10 based on trigger density and specificity."""
    combined = (title + " " + selftext).lower()
    score = 0
    for phrase in TRIGGER_PHRASES:
        if phrase in combined:
            score += 1
    # Bonus for URL mentions (they might have a live page to audit)
    if "http" in combined or ".com" in combined:
        score += 2
    # Bonus for dollar amounts (active spend signal)
    import re
    if re.search(r"\$\d+", combined):
        score += 2
    return min(score, 10)

def main() -> None:
    wm = Watermark.load("reddit-triggers")
    all_posts = []

    for subreddit in SUBREDDITS:
        posts = fetch_subreddit_rss(subreddit, limit=25)
        time.sleep(5)  # rate limit — Reddit allows ~1 req/5s per IP

        for post in posts:
            post_id = post.get("id", "")
            if not post_id:
                continue

            title = post.get("title", "")
            selftext = post.get("selftext", "")[:500]

            if matches_trigger(title, selftext):
                score = score_post(title, selftext)
                all_posts.append({
                    "id": post_id,
                    "title": title,
                    "subreddit": subreddit,
                    "url": post.get("url", ""),
                    "author": post.get("author", ""),
                    "score": post.get("score", 0),
                    "trigger_score": score,
                    "selftext_preview": selftext[:200],
                    "created_utc": 0,
                })

    new_items = wm.filter_new(all_posts)
    wm.save()

    if not new_items:
        sys.exit(0)  # silent — nothing new

    # Sort by trigger score descending
    new_items.sort(key=lambda x: x["trigger_score"], reverse=True)

    print(f"## 🎯 {len(new_items)} New Buying-Trigger Posts Found\n")
    for item in new_items:
        stars = "🔥" * min(item["trigger_score"], 5)
        print(f"### {stars} [{item['title']}]({item['url']})")
        print(f"- **Subreddit:** r/{item['subreddit']} | **Trigger Score:** {item['trigger_score']}/10")
        print(f"- **Author:** u/{item['author']} | **Post Score:** {item['score']}")
        if item["selftext_preview"]:
            print(f"- **Preview:** {item['selftext_preview'][:150]}...")
        print()

    print("---")
    print("**Action:** Review top-scored posts. If they have a URL in comments/post, run `deliver_audit.py` dry-run first.")
    print(f"**Lead engine path:** /home/mike/nebula/deliver_audit.py <URL> <their_email> --dry-run")


if __name__ == "__main__":
    main()