#!/usr/bin/env python3
"""
Zernio posting CLI — create drafts / schedule / publish social posts for outreach.

DRAFT-BY-DEFAULT: without --publish or --schedule, this creates a DRAFT that
publishes nothing. Publishing requires an explicit flag (and --yes for
immediate publish).

Examples:
  # list connected accounts
  python3 zernio_post.py --list-accounts

  # create a LinkedIn draft (safe, publishes nothing)
  python3 zernio_post.py --platform linkedin --content "Your ads are fine. Your page is the leak."

  # create a Reddit draft from a file
  python3 zernio_post.py --platform reddit --content-file outreach/reddit_post.md

  # schedule a LinkedIn post (future ISO timestamp) — requires explicit --schedule
  python3 zernio_post.py --platform linkedin --content "..." --schedule 2026-08-06T09:00:00Z

  # publish immediately — requires explicit --publish --yes
  python3 zernio_post.py --platform linkedin --content "..." --publish --yes
"""

import argparse
import json
import os
import sys

from zernio_client import ZernioClient, ZernioError

# Known connected account IDs (override via env if accounts change)
ACCOUNT_IDS = {
    "linkedin": os.environ.get("ZERNIO_LINKEDIN_ACCOUNT_ID", "6a71436beb10586dadceb928"),
    "reddit": os.environ.get("ZERNIO_REDDIT_ACCOUNT_ID", "6a71416deb10586dadce3a88"),
}
PLATFORMS = sorted(ACCOUNT_IDS.keys())


def load_content(args) -> str:
    if args.content and args.content_file:
        raise SystemExit("pass either --content or --content-file, not both")
    if args.content_file:
        with open(args.content_file) as f:
            return f.read().strip()
    if not args.content:
        raise SystemExit("missing content: pass --content or --content-file")
    return args.content


def main() -> int:
    p = argparse.ArgumentParser(description="Zernio posting CLI (draft-by-default)")
    p.add_argument("--list-accounts", action="store_true", help="list connected accounts and exit")
    p.add_argument("--list-drafts", action="store_true", help="list recent drafts and exit")
    p.add_argument("--platform", choices=PLATFORMS, help="target platform (linkedin|reddit)")
    p.add_argument("--content", help="post content")
    p.add_argument("--content-file", help="path to file with post content")
    p.add_argument("--title", help="optional title (LinkedIn)")
    p.add_argument("--schedule", help='future ISO timestamp to schedule, e.g. 2026-08-06T09:00:00Z')
    p.add_argument("--publish", action="store_true", help="publish immediately (requires --yes)")
    p.add_argument("--yes", action="store_true", help="confirm immediate publish")
    args = p.parse_args()

    z = ZernioClient()

    if args.list_accounts:
        for a in z.list_accounts():
            print(f"  {a.get('platform'):10s} {a.get('displayName') or a.get('username'):30s} {a.get('_id')}")
        return 0

    if args.list_drafts:
        for pst in z.list_posts(status="draft", limit=20):
            print(f"  {pst.get('_id')}  {str(pst.get('content'))[:80]}")
        return 0

    if not args.platform:
        p.print_help()
        return 2

    content = load_content(args)

    # ── Safety gate: publishing requires explicit intent ──────────────────
    publish_now = args.publish
    scheduled = args.schedule
    if publish_now and scheduled:
        raise SystemExit("--publish and --schedule are mutually exclusive")
    if publish_now and not args.yes:
        raise SystemExit(
            "immediate publish requires --publish --yes (drafts are free; publishing is permanent)"
        )
    if publish_now:
        print("PUBLISHING IMMEDIATELY — this goes live now.")
    elif scheduled:
        print(f"SCHEDULING for {scheduled}.")
    else:
        print("Creating DRAFT — nothing will be published.")

    post = z.create_post(
        content=content,
        platform=args.platform,
        account_id=ACCOUNT_IDS[args.platform],
        draft=not (publish_now or scheduled),
        scheduled_for=scheduled,
        publish_now=publish_now,
        title=args.title or "",
    )

    pid = post.get("post", {}).get("_id") or post.get("_id")
    print(f"OK post created: {pid} ({args.platform})")
    print(f"  status: {post.get('post', {}).get('status') or (post.get('status') or 'see dashboard')}")
    print(f"  review at: https://zernio.com/dashboard/posts")
    return 0


if __name__ == "__main__":
    sys.exit(main())
