#!/usr/bin/env python3
"""Daily social drip — posts the next queued LinkedIn post via Zernio.

Queue: ops/social_drip_queue.json — {"posted": {id: zernio_post_id}, "queue": [...]}
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

DRY_RUN = "--dry-run" in sys.argv


def main() -> int:
    with open(QUEUE_PATH) as f:
        state = json.load(f)

    pending = [p for p in state["queue"] if p["id"] not in state["posted"]]
    if not pending:
        # Silent when healthy/empty — watchdog contract
        return 0

    post = pending[0]
    if DRY_RUN:
        print(f"DRY RUN — would post '{post['id']}' ({len(post['content'])} chars) to linkedin + bluesky")
        return 0

    client = ZernioClient()

    # ── LinkedIn ──────────────────────────────────────────────────────────
    li_result = client.create_post(
        post["content"],
        platform="linkedin",
        account_id="6a71436beb10586dadceb928",  # Sedrick Murphy — confirmed active 2026-08-05
        draft=False,
        publish_now=True,
    )
    li_id = li_result.get("id") or li_result.get("_id") or li_result.get("post", {}).get("id") or "unknown"
    state["posted"][post["id"]] = li_id

    # ── Bluesky ───────────────────────────────────────────────────────────
    # Bluesky has a 300-char limit; trim content and append audit CTA if needed
    bsky_content = post["content"]
    if len(bsky_content) > 290:
        # Take first meaningful chunk + audit link
        lines = bsky_content.split("\n")
        bsky_short = ""
        for line in lines:
            if len(bsky_short) + len(line) + 1 > 240:
                break
            bsky_short += line + "\n"
        bsky_content = bsky_short.strip() + "\n\nhttps://nebulacomponents.com/audit"
    bsky_content = bsky_content[:300]

    try:
        bsky_result = client.create_post(
            bsky_content,
            platform="bluesky",
            account_id="6a716822eb10586dadd70840",  # Bluesky account
            draft=False,
            publish_now=True,
        )
        bsky_id = bsky_result.get("id") or bsky_result.get("_id") or "unknown"
    except Exception as e:
        bsky_id = f"error:{e}"

    tmp = QUEUE_PATH + ".tmp"
    with open(tmp, "w") as f:
        json.dump(state, f, indent=1)
    os.rename(tmp, QUEUE_PATH)

    remaining = len([p for p in state["queue"] if p["id"] not in state["posted"]])
    print(f"📤 Drip posted '{post['id']}' — LinkedIn:{li_id} Bluesky:{bsky_id}. {remaining} left.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        print(f"❌ social drip failed: {e}", file=sys.stderr)
        sys.exit(1)
