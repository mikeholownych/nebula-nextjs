#!/usr/bin/env python3
"""
Append missed leads that scored 5 due to regex quirks.
Fix: € instead of $, $8K format, truncated search snippets.
"""
import json, os, re
from datetime import datetime, timezone
from collections import Counter

BASE_DIR = "/home/mike/nebula"
QUEUE_FILE = os.path.join(BASE_DIR, "signal_queue.jsonl")
SEEN_FILE = os.path.join(BASE_DIR, "signal_seen.json")

def load_seen():
    if os.path.exists(SEEN_FILE):
        try:
            with open(SEEN_FILE) as f:
                data = json.load(f)
                return set(data) if isinstance(data, list) else set(data.keys())
        except:
            pass
    return set()

def save_seen(seen_set):
    with open(SEEN_FILE, "w") as f:
        json.dump(sorted(seen_set), f, indent=2)

def append_signal(signal):
    with open(QUEUE_FILE, "a") as f:
        f.write(json.dumps(signal) + "\n")

# Leads that scored low due to regex issues - manually scored
leads = [
    # Reddit: € ad spend + zero conversions - € broke $ regex
    ("reddit",
     "https://www.reddit.com/r/startups/comments/1tum2d5/spent_174_on_reddit_ads_for_a_b2b_saas_111927/",
     "unknown",
     "Spent €174 on Reddit ads for a B2B SaaS. 111,927 impressions, Zero conversions",
     "Spent €174 on Reddit ads for a B2B SaaS. 111,927 impressions. Zero conversions from ~44 cold visitors to a paid B2B SaaS offer.",
     "", 9),

    # Reddit: $8K broke $[\\d,]+ regex (K suffix)
    ("reddit",
     "https://www.reddit.com/r/GrowthHacking/comments/1qh3e75/we_spent_8k_on_linkedin_ads_and_got_clicks_but/",
     "unknown",
     "We spent $8K on LinkedIn ads and got clicks, but zero conversions",
     "We spent $8K on LinkedIn ads and got clicks, but zero conversions.",
     "", 9),

    # SideProject: 0 signups - snippet truncated, missed regex
    ("reddit",
     "https://www.reddit.com/r/SideProject/comments/1q4u32b/5_days_sharing_my_side_project_0_signups_what_am/",
     "unknown",
     "5 days sharing my side project, 0 signups - what am I missing?",
     "Week 1 of my dropship side project — made big progress, but 0 signups. What am I missing?",
     "", 9),

    # SideProject: 6 months 0 users - explicit zero users pain
    ("reddit",
     "https://www.reddit.com/r/SideProject/comments/1ffrzeg/i_spent_6_months_on_a_web_app_as_a_side_project/",
     "unknown",
     "I spent 6 months on a web app as a side project, and got 0 users",
     "I spent 6 months on a web app as a side project, and got 0 users. Zero ranking, zero new users.",
     "", 9),

    # SideProject: 70 free users, no one purchased - explicit conversion pain
    ("reddit",
     "https://www.reddit.com/r/SideProject/comments/1l44pq8/more_than_70_free_users_yet_no_one_purchased/",
     "unknown",
     "More than 70 free users yet no one purchased",
     "More than 70 free users yet no one purchased.",
     "", 7),
]

seen = load_seen()
print(f"Loaded {len(seen)} seen URLs")

new_signals = []
for source, url, author, headline, trigger_text, product_url, score in leads:
    if url in seen:
        print(f"  SKIP (seen): {url}")
        continue

    seen.add(url)
    signal = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source": source,
        "url": url,
        "author": author,
        "product_url": product_url,
        "headline": headline,
        "trigger_text": trigger_text[:500],
        "signal_score": score,
        "contacted": False,
    }
    new_signals.append(signal)
    append_signal(signal)
    print(f"  QUEUED [score={score}] {source:<12} {headline[:65]}")

save_seen(seen)
print(f"\n=== SUMMARY ===")
print(f"Additional signals queued: {len(new_signals)}")
print(f"Total in seen: {len(seen)}")
