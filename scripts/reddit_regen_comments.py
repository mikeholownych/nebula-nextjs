#!/usr/bin/env python3
"""Regenerate the Reddit comment queue with governance-compliant messages.

Rule mapping (per reddit_governance.py SUBREDDIT_RULES, verified 2026-08-08):
  BANNED subs (r/PPC, r/FacebookAds, r/GoogleAds, r/ecommerce):
    - Pure value comment. No URL. No product mention. No DM offer.
    - The audit offer is IMPOSSIBLE on these subs. Just help.
  THREAD_ONLY (r/Entrepreneur, r/SaaS):
    - No URL/mention/DM outside the weekly thread. Pure value.
  CONTEXT subs (r/SideProject, r/buildinpublic):
    - Value + build context. May end with "happy to share the link" (no URL).
    - NO UTM params ever.

Usage: python scripts/reddit_regen_comments.py [--dry-run]
"""
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

QUEUE_FILE = Path("/home/mike/nebula/.reddit_comment_queue.json")

# Banned subs: pure value only — diagnosis + one concrete check, zero promo
VALUE_COMMENTS = {
    "roast_request": (
        "A couple of things I'd check first: what's the first thing a visitor "
        "sees in the first viewport, and does it match what the ad promised? "
        "Those two mismatches account for most of the drop-off I see on pages "
        "like this. If the headline doesn't restate the offer, people bounce "
        "before they read anything else."
    ),
    "zero_conversions": (
        "The ad-to-page disconnect is usually the first thing to look at. "
        "Check three things: does the page headline restate the ad's promise, "
        "is the CTA visible without scrolling, and is there any proof near "
        "that CTA? Most pages fail on at least one of those, and each one "
        "quietly kills conversions."
    ),
    "ads_not_working": (
        "Worth separating the campaign question from the page question. "
        "Ads bring traffic; the page decides what happens next. Check whether "
        "the page actually delivers what the ad promised within the first "
        "screen — headline, offer, CTA. If that's clean, then look at the "
        "campaign. Fixing the page first is cheaper than re-testing ads."
    ),
}

# Context subs (SideProject / buildinpublic): value + optional link offer
CONTEXT_COMMENTS = {
    "roast_request": (
        "Took a quick look. The thing that stood out to me: the first screen "
        "doesn't tell me what the product does or what I'd get by signing up. "
        "I had to scroll to figure out the core offer. That's the most common "
        "pattern I see on new launches — the build is great but the page "
        "assumes too much. Happy to share a link to a free structured audit "
        "if you want specific findings."
    ),
    "zero_conversions": (
        "A few things worth checking in order: 1) does the headline restate "
        "what the ad promised, 2) is the CTA visible without scrolling, "
        "3) is there proof next to the CTA. Most early-stage pages fail one "
        "of those and it reads as 'this isn't for me'. Happy to share a link "
        "to a free structured audit if you want the full breakdown."
    ),
    "ads_not_working": (
        "Check the page before you touch the campaign. If the headline doesn't "
        "match the ad and the CTA is below the fold, the traffic is arriving "
        "but the page isn't doing its job. Happy to share a link to a free "
        "structured audit if you want specific findings."
    ),
}


def main(dry_run=False):
    q = json.loads(QUEUE_FILE.read_text())
    pending = q.get("pending", [])

    rewritten = 0
    for item in pending:
        sub = (item.get("subreddit", "") or "").lstrip("r/").lower()
        trigger = item.get("trigger_type", "zero_conversions")
        ctx = item.get("title", "")[:60]

        if sub in ("sideproject", "buildinpublic"):
            new_msg = CONTEXT_COMMENTS.get(trigger, CONTEXT_COMMENTS["zero_conversions"])
        else:
            # Banned + thread_only subs: pure value, no offer at all
            new_msg = VALUE_COMMENTS.get(trigger, VALUE_COMMENTS["zero_conversions"])

        # Strip any URL remnants just in case
        new_msg = re.sub(r"https?://\S+", "", new_msg).strip()

        if new_msg != item.get("message"):
            item["message"] = new_msg
            item["governance"] = {
                "regenerated_at": datetime.now(timezone.utc).isoformat(),
                "policy": "value-only" if sub not in ("sideproject", "buildinpublic") else "context-value",
            }
            rewritten += 1
            if dry_run:
                print(f"[DRY] r/{sub} | {ctx}\n  -> {new_msg[:110]}...\n")

    if not dry_run and rewritten:
        tmp = str(QUEUE_FILE) + ".tmp"
        with open(tmp, "w") as f:
            json.dump(q, f, indent=2)
        import os
        os.rename(tmp, str(QUEUE_FILE))

    print(f"Rewritten {rewritten}/{len(pending)} queued messages")
    return 0


if __name__ == "__main__":
    sys.exit(main("--dry-run" in sys.argv))
