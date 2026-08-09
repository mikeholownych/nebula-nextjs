#!/usr/bin/env python3
"""Draft replacement comments for safe subs (SideProject/buildinpublic) and validate against the governance gate."""
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from reddit_governance import govern_reddit_content

ACCOUNT_ID = "6a772422d0fe733d1a3f3959"

DRAFTS = [
    {
        "subreddit": "r/SideProject",
        "post_id": "1vbour5",
        "label": "SideProject: Launched first app, great feedback, almost no sales",
        "message": (
            "Congrats on shipping, that first launch is the hardest part. The gap between people "
            "saying they like it and people actually paying is almost never the product, it's the "
            "moment between landing and deciding. First thing I'd check: what does the first screen "
            "promise, and does it match what the app actually does? Then look at the price. If "
            "visitors have to scroll to find it or do mental math on what they get, most of them "
            "leave before the decision. A cheap test that costs nothing: put the price and the "
            "single biggest benefit in the hero for a week and watch what happens. That one change "
            "moves more fresh launches than anything else I've seen."
        ),
    },
    {
        "subreddit": "r/buildinpublic",
        "post_id": "1ribs4a",
        "label": "buildinpublic: Launched MVP, traffic but almost no signups",
        "message": (
            "Traffic with no signups usually means the page explains what the thing is, but not why "
            "someone should care right now. Two checks worth doing: is the core value visible in the "
            "first viewport, and is there exactly one obvious next step? Three CTAs or a wall of "
            "features above the fold is the classic leak. Also worth splitting traffic by source. "
            "Cold visitors from a launch post behave completely differently from people who found "
            "you through search or a referral, and the page needs to speak to whichever one you're "
            "actually getting. If most of the traffic is cold, the fix is usually a sharper headline "
            "that names the problem, not the product."
        ),
    },
    {
        "subreddit": "r/buildinpublic",
        "post_id": "1t64d9v",
        "label": "buildinpublic: indie devtool went 1-3 sales/day to almost 0",
        "message": (
            "Going from steady sales to zero is a different animal from never having sales, and it "
            "usually points at one of three things: a change in the traffic source, a change on the "
            "page itself, or a shift in visitor intent. Since it dropped suddenly, I'd check the "
            "traffic side first. Same channel volume as before? Then diff the current landing page "
            "against the version from when sales were healthy. Even a small headline or pricing "
            "block edit can quietly kill a page, and it's easy to miss because nothing looks broken. "
            "Do you have analytics from before the drop? Comparing week over week usually surfaces "
            "the exact day something changed."
        ),
    },
    {
        "subreddit": "r/buildinpublic",
        "post_id": "1qi4v0z",
        "label": "buildinpublic: roast my website, can't get a single conversion at $4.99/mo",
        "message": (
            "At $4.99 the price is not the blocker. Nobody hesitates over five bucks, but they do "
            "hesitate when they can't tell in five seconds what the thing does and whether it's "
            "still alive. So my roast: the first screen is probably burying the actual function "
            "under branding, or there's no visible proof the product works. The fix that works for "
            "cheap products is a real use case front and center. Show what happens after someone "
            "signs up, a concrete before and after. At that price the page has to sell itself in "
            "one screen, there's no salesperson coming to rescue it. Visitors decide in seconds, "
            "so the hero either converts or the rest of the page never gets read."
        ),
    },
    {
        "subreddit": "r/buildinpublic",
        "post_id": "1rhkx96",
        "label": "buildinpublic: advice on marketing / getting product out there",
        "message": (
            "Hard to be specific without knowing the product, but the pattern I see most with "
            "projects that stall is marketing the features instead of the outcome. People don't buy "
            "a tool, they buy the result the tool gets them. So the first question to answer: what "
            "does a user have after using this that they didn't have before, and can that fit in one "
            "sentence? If the landing page can't say it in one sentence, the ads and posts won't "
            "either. Then pick one channel and go deep instead of being everywhere at low effort. "
            "Depth beats breadth when you're small, and it gives you data to learn from instead of "
            "a thin layer of noise across five platforms."
        ),
    },
]

results = []
for d in DRAFTS:
    sub = d["subreddit"].lstrip("r/").lower()
    g = govern_reddit_content(d["message"], sub, "comment", account_id=ACCOUNT_ID)
    d["_pass"] = g["pass"]
    d["_violations"] = g["violations"]
    results.append(d)
    status = "PASS" if g["pass"] else "FAIL"
    wc = len(d["message"].split())
    print(f"[{status}] r/{sub} {d['post_id']} ({wc} words)")
    if not g["pass"]:
        print(f"        violations: {g['violations']}")

all_pass = all(r["_pass"] for r in results)
print(f"\nALL PASS: {all_pass} ({sum(1 for r in results if r['_pass'])}/{len(results)})")
if all_pass:
    # Append to queue as drafts (NOT pending) for Mike review
    qpath = "/home/mike/nebula/.reddit_comment_queue.json"
    q = json.load(open(qpath))
    q.setdefault("drafts", [])
    for d in results:
        item = {k: v for k, v in d.items() if not k.startswith("_")}
        item["drafted_at"] = __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat()
        # dedup by post_id
        if not any(x.get("post_id") == item["post_id"] for x in q["drafts"]):
            q["drafts"].append(item)
    with open(qpath + ".tmp", "w") as f:
        json.dump(q, f, indent=2)
    import os
    os.rename(qpath + ".tmp", qpath)
    print(f"Saved {len(results)} drafts to queue (pending={len(q.get('pending',[]))}, drafts={len(q.get('drafts',[]))}, held={len(q.get('held',[]))})")
