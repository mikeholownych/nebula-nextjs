#!/usr/bin/env python3
"""
Reddit Trigger Monitor — automated Reddit prospecting for Nebula Components.

Searches Reddit for buying triggers using Apify actors. Scores threads,
generates value-first replies, logs leads into lead_manager.

Two search modes:
  - Search (harshmaur/reddit-scraper): keyword search across Reddit
  - Subreddit (trudax/reddit-scraper-lite): scrape specific subreddits

Run: python3 reddit_trigger_monitor.py [--dry-run] [--smoke]
Cron: every 4 hours
"""

import json, os, sys, datetime, subprocess, urllib.request, re
from pathlib import Path

BASE = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE))
import lead_manager

# Content Firewall — synthetic content filter
try:
    from growth_system.content_firewall import filter_lead
    HAS_FIREWALL = True
except ImportError:
    HAS_FIREWALL = False

DRY_RUN = "--dry-run" in sys.argv
SMOKE = "--smoke" in sys.argv

# Actor for search — more reliable than subreddit scraping
SEARCH_ACTOR = "harshmaur/reddit-scraper"

# ─── SEARCH QUERIES ──────────────────────────────────────────────
# Plain language queries — NOT Google operators. Reddit text search.
SEARCH_QUERIES = [
    # Ad + conversion pain (highest intent)
    '"ad spend" "no conversions"',
    '"wasting money" ads',
    '"no conversions" landing page',
    '"burning money" ads',
    '"no sales" "landing page" ',
    '"not converting" help',
    '"zero conversions"',

    # Landing page specific
    '"landing page" "not converting"',
    '"landing page" critique',
    '"landing page" review feedback',
    '"roast my landing page"',
    '"review my landing page"',

    # SaaS / startup specific
    'saas "no signups"',
    'startup "no customers"',
    '"need help" landing page',
]

# Buying trigger regex patterns
BUYING_TRIGGERS = [
    # Direct ad spend pain
    r"(ad spend|ads|ppc|google ad|facebook ad).*(no|zero|0|not|waste|burn|fail|nothing)",
    r"(wasting|burning|blowing|throwing).*(money|budget|cash).*(ads|ad )",
    r"no conversion|zero conversion|0 conversion|not a single conversion",
    r"(traffic|visitor|click).*(no|zero|0|not).*(convert|sale|lead|signup|customer)",

    # Landing page help requests
    r"(landing page|homepage|website|site).*(not|fix|critique|review|help|roast|problem|feedback|suck)",
    r"(review|critique|roast|feedback).*(landing page|homepage|website|site)",

    # Direct pain signals
    r"(no sales|no leads|no signups|no customers|no one.*buy)",
    r"(desperate|about to (shut down|give up|fail)|going under|running out of (money|time|runway))",
    r"(need help|any advice|what should i do).*(convert|customer|sale|lead|signup|traction)",

    # Specific ecom/SaaS pain
    r"(shopify|store).*(no sales|no orders|not converting)",
    r"(saas|startup).*(no signups|no customers|no traction|zero users)",
]

TRIGGER_PATTERNS = [re.compile(t, re.IGNORECASE) for t in BUYING_TRIGGERS]
SPAM_PATTERNS = [re.compile(r"visit (my|our|this)|check out|book a|dm me|hire me|free consult", re.IGNORECASE)]


def has_buying_trigger(text):
    return any(p.search(text) for p in TRIGGER_PATTERNS)


def is_spam(text):
    return sum(1 for p in SPAM_PATTERNS if p.search(text)) >= 2


def score_post(title, body, community, upvotes, comments):
    text = f"{title} {body}".lower()
    score = 5
    trigger_count = sum(1 for p in TRIGGER_PATTERNS if p.search(text))
    score += min(trigger_count, 4)
    if upvotes and upvotes > 3:
        score += 1
    if comments and comments > 3:
        score += 1
    if body and len(body) > 200:
        score += 0.5
    if is_spam(text):
        score -= 5
    return max(0, min(10, round(score, 1)))


def run_search(queries, max_results=50):
    """Run Apify search actor."""
    input_data = {
        "searchTerms": queries,
        "maxResults": max_results,
        "sort": "new",
        "searchTime": "week",
        "searchPosts": True,
        "searchComments": False,
    }
    input_file = BASE / "growth_system" / "apify_inputs" / "reddit_search.json"
    input_file.parent.mkdir(parents=True, exist_ok=True)
    input_file.write_text(json.dumps(input_data, indent=2))

    print(f"[REDDIT] Searching via {SEARCH_ACTOR}...")
    cmd = ["apify", "actors", "call", SEARCH_ACTOR, "--input-file", str(input_file), "--json"]
    proc = subprocess.run(cmd, cwd=BASE, text=True, capture_output=True, timeout=600)
    if proc.returncode != 0:
        print(f"[ERROR] Actor failed: {proc.stderr[:200]}")
        return []

    run_info = json.loads(proc.stdout.strip())
    ds_id = run_info.get("storage", {}).get("defaultDatasetId")
    if not ds_id:
        print(f"[ERROR] No dataset ID")
        return []

    token = (Path.home() / ".hermes" / "secrets" / "apify.key").read_text().strip()
    req = urllib.request.Request(
        f"https://api.apify.com/v2/datasets/{ds_id}/items?clean=true&format=json",
        headers={"Authorization": f"Bearer {token}"},
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.load(resp)


def generate_reply(title, body):
    """Generate value-first Reddit reply."""
    text = f"{title} {body}".lower()
    has_ads = any(w in text for w in ["ad ", "ads", "ppc", "google ad", "facebook ad", "spend"])
    has_page = any(w in text for w in ["landing page", "website", "site", "store"])
    has_conversion = any(w in text for w in ["convert", "conversion", "sales", "leads", "customers", "signup"])

    if has_ads and has_page:
        return (
            "Was in the same spot — thought I was bad at ads, turned out the landing page was the problem.\n\n"
            "Built a free tool that grades your page on headline clarity, CTA, trust proof, speed, and mobile — "
            "shows you exactly which leaks are costing you conversions. Takes 30 seconds.\n\n"
            "Link in my profile. No email required to see results."
        )
    if has_page:
        return (
            "Most pages that don't convert share one root cause: the headline describes the product "
            "instead of the problem the visitor already feels.\n\n"
            "Built a free audit tool that checks this. Paste your URL, get scores + specific fixes. 30 seconds.\n\n"
            "Link in my profile."
        )
    if has_conversion:
        return (
            "Most founders think traffic is the problem. It's usually what happens after the click.\n\n"
            "Free audit tool checks headline, CTA, trust, speed, mobile. If any score under 7, "
            "that's where your conversions are going. 30 seconds.\n\n"
            "Link in my profile."
        )
    return (
        "Have you audited your landing page recently? Most conversion issues come from "
        "one of 5 places — headline, CTA, trust, speed, or mobile.\n\n"
        "Built a free tool that checks all 5 in 30 seconds. Link in my profile."
    )


def monitor():
    queries = SEARCH_QUERIES[:3] if SMOKE else SEARCH_QUERIES
    max_res = 15 if SMOKE else 75

    print(f"[REDDIT] Starting ({'SMOKE' if SMOKE else 'FULL'} | {'DRY' if DRY_RUN else 'LIVE'})")
    print(f"[REDDIT] Running {len(queries)} queries...")

    data = run_search(queries, max_results=max_res)
    if not data:
        print("[REDDIT] No results.")
        return {"total_candidates": 0, "high_value": 0}

    print(f"[REDDIT] Raw results: {len(data)}")

    # Process
    candidates = []
    for r in data:
        title = r.get("title", "") or ""
        body = r.get("body", "") or ""
        community = r.get("communityName", "") or ""
        # Fix: some actors return "r/r/SaaS" instead of "SaaS"
        community = community.replace("r/r/", "").replace("r/", "")
        upvotes = r.get("upVotes", 0) or 0
        comments = r.get("commentsCount", 0) or 0
        author = r.get("authorName", "") or ""
        post_url = r.get("postUrl", "") or ""

        if not has_buying_trigger(f"{title} {body}"):
            continue

        # Content Firewall — skip synthetic/vendor-camouflage content
        fw_result = filter_lead(f"{title} {body}", url=post_url, min_score=40) if HAS_FIREWALL else {"passed": True, "score": 100, "verdict": "human"}
        post_firewall_score = fw_result.get("score", 100)
        post_firewall_verdict = fw_result.get("verdict", "human")
        if not fw_result.get("passed", True):
            print(f"  [FIREWALL-BLOCKED] score={post_firewall_score}/100 [{post_firewall_verdict}] — {title[:80]}")
            continue

        score = score_post(title, body, community, upvotes, comments)
        if score <= 0:
            continue

        candidates.append({
            "title": title[:150],
            "url": post_url,
            "community": community,
            "score": score,
            "upvotes": upvotes,
            "comments": comments,
            "author": author,
            "body_preview": body[:300],
        })

    candidates.sort(key=lambda c: c["score"], reverse=True)

    high_value = [c for c in candidates if c["score"] >= 7]
    medium = [c for c in candidates if 5 <= c["score"] < 7]
    low = [c for c in candidates if c["score"] < 5]

    print(f"\n[REDDIT] With triggers: {len(candidates)} (HV: {len(high_value)}, M: {len(medium)}, L: {len(low)})")

    if high_value:
        print(f"\n{'='*60}\nHIGH-VALUE THREADS\n{'='*60}")
        for c in high_value[:5]:
            print(f"\n  [{c['score']}/10] r/{c['community']} — {c['title'][:80]}")
            print(f"  👍 {c['upvotes']} | 💬 {c['comments']} | {c['url']}")
            if c['body_preview']:
                print(f"  > {c['body_preview'][:200]}")

            if not DRY_RUN and c['author']:
                lead_manager.upsert_lead(
                    email=f"reddit_{c['author']}@placeholder.nebula",
                    stage="lead_warm" if c['score'] >= 8 else "lead_free_kit",
                    source="reddit_trigger_monitor",
                    name=f"Reddit: {c['author']}",
                    url=c['url'],
                )

    if medium:
        print(f"\n--- Medium ({len(medium)}) ---")
        for c in medium[:3]:
            print(f"  [{c['score']}/10] r/{c['community']} — {c['title'][:60]}")

    print(f"\n{'='*60}\nSUMMARY\n{'='*60}")
    print(f"  Queries: {len(queries)}")
    print(f"  Raw: {len(data)} | Trigger: {len(candidates)} | HV: {len(high_value)}")

    return {
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "queries": len(queries),
        "raw": len(data),
        "with_triggers": len(candidates),
        "high_value": len(high_value),
        "medium": len(medium),
        "threads": [{"title": c["title"][:80], "url": c["url"], "score": c["score"]} for c in high_value[:5]],
    }


if __name__ == "__main__":
    result = monitor()
    print(f"\n---SUMMARY---\n{json.dumps(result)}")
