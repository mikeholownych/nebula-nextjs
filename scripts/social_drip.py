#!/usr/bin/env python3
"""Daily social drip - posts the next queued LinkedIn post via Zernio.

Queue: ops/social_drip_queue.json - {"posted": {id: zernio_post_id}, "queue": [...]}
Pops the first unposted entry, publishes, records the Zernio post id.

Output contract (no_agent cron): one line on post, SILENT when queue is empty,
non-zero exit on failure (so the cron alerts).
"""
import json
import os
import sys

REPO = "/home/mike/nebula"
QUEUE_PATH = os.path.join(REPO, "ops", "social_drip_queue.json")

# Load ZERNIO_API_KEY from repo .env without printing anything
env_path = os.path.join(REPO, ".env")
with open(env_path) as f:
    for line in f:
        if line.startswith("ZERNIO_API_KEY="):
            os.environ["ZERNIO_API_KEY"] = line.strip().split("=", 1)[1]
            break

sys.path.insert(0, REPO)
from zernio_client import ZernioClient  # noqa: E402

# Reddit governance - fail-closed gate (loads SUBREDDIT_RULES)
sys.path.insert(0, os.path.join(REPO, "scripts"))
from reddit_governance import govern_reddit_content  # noqa: E402

DRY_RUN = "--dry-run" in sys.argv

# ── Reddit cross-post config (FAIL-CLOSED) ────────────────────────────
# Empty list = no Reddit posting until subreddits are explicitly whitelisted.
# REDDIT_PUBLISH=False = posts go to Zernio DRAFTS for review, never live.
# Flip both only after Mike approves subreddit targets + account standing.
# Reddit content is NEVER the same as LinkedIn content - the drip queue is
# LinkedIn-native (teardowns + links). Cross-posting it to Reddit gets it
# removed. REDDIT_SUBREDDITS must be paired with a Reddit-native rewrite.
REDDIT_ACCOUNT_ID = "6a772422d0fe733d1a3f3959"  # Elegant_Exam_8860 - connected 2026-08-08
REDDIT_SUBREDDITS = []       # e.g. ["SideProject", "PPC"] - whitelist here
REDDIT_PUBLISH = False       # True = publish_now; False = draft for review


def main() -> int:
    with open(QUEUE_PATH) as f:
        state = json.load(f)

    pending = [p for p in state["queue"] if p["id"] not in state["posted"]]
    if not pending:
        # Silent when healthy/empty - watchdog contract
        return 0

    post = pending[0]
    if DRY_RUN:
        print(f"DRY RUN - would post '{post['id']}' ({len(post['content'])} chars) to linkedin"
              + (f" + reddit ({REDDIT_SUBREDDITS})" if REDDIT_SUBREDDITS else " (reddit: no subs whitelisted)"))
        return 0

    client = ZernioClient()

    # ── LinkedIn ──────────────────────────────────────────────────────────
    li_result = client.create_post(
        post["content"],
        platform="linkedin",
        account_id="6a71436beb10586dadceb928",  # Sedrick Murphy - confirmed active 2026-08-05
        draft=False,
        publish_now=True,
    )
    li_id = li_result.get("id") or li_result.get("_id") or li_result.get("post", {}).get("id") or "unknown"
    state["posted"][post["id"]] = li_id

    # ── Reddit (fail-closed: only when subreddits are whitelisted) ───────
    reddit_ids = []
    if REDDIT_SUBREDDITS:
        for sub in REDDIT_SUBREDDITS:
            # GOVERNANCE GATE - LinkedIn content will fail for banned/thread_only
            # subs and needs humanization for context subs. Fail-closed.
            g = govern_reddit_content(post["content"], sub, "post", account_id=REDDIT_ACCOUNT_ID)
            if not g["pass"]:
                reddit_ids.append(f"{sub}:HELD:{g['reason'][:60]}")
                continue
            try:
                r_result = client.create_post(
                    post["content"],
                    platform="reddit",
                    account_id=REDDIT_ACCOUNT_ID,
                    subreddit=sub,
                    draft=not REDDIT_PUBLISH,   # draft by default - review in Zernio before live
                    publish_now=REDDIT_PUBLISH,
                )
                r_id = r_result.get("id") or r_result.get("_id") or "unknown"
                reddit_ids.append(f"{sub}:{r_id}")
            except Exception as e:
                reddit_ids.append(f"{sub}:error:{e}")

    tmp = QUEUE_PATH + ".tmp"
    with open(tmp, "w") as f:
        json.dump(state, f, indent=1)
    os.rename(tmp, QUEUE_PATH)

    remaining = len([p for p in state["queue"] if p["id"] not in state["posted"]])
    print(f"📤 Drip posted '{post['id']}' - LinkedIn:{li_id}" + (f" Reddit:[{', '.join(reddit_ids)}]" if reddit_ids else " (reddit skipped)") + f". {remaining} left.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        print(f"❌ social drip failed: {e}", file=sys.stderr)
        sys.exit(1)
