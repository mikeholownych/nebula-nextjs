#!/usr/bin/env python3
"""YouTube channel orchestrator — run this to produce and publish a video.

Usage:
  python3 yt_orchestrator.py                         # auto-pick next subject
  python3 yt_orchestrator.py --url https://...        # audit specific URL
  python3 yt_orchestrator.py --dry-run                # generate only, no upload
"""

import sys, os, json, argparse, logging, asyncio
from pathlib import Path
from datetime import datetime, timezone

# ── Ensure we run from nebula root ──────────────────────────────────
ROOT = Path(__file__).resolve().parent
os.chdir(ROOT)
sys.path.insert(0, str(ROOT))

from yt_channel import config
from yt_channel.produce import produce_video
from yt_channel.produce_short import produce_short
from yt_channel.script_gen import generate_script

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger("orchestrator")

# ── Subject pool — sites to audit for YouTube content ───────────────
SUBJECT_POOL = [
    # Rotating pool of sites that our scraper can actually fetch.
    "https://nebulacomponents.shop",
    "https://www.producthunt.com",
    "https://www.shopify.com/pricing",
    "https://webflow.com/pricing",
    "https://calendly.com/pricing",
    "https://www.notion.so/pricing",
    "https://www.figma.com/pricing",
    "https://slack.com/pricing",
    "https://zoom.us/pricing",
    "https://www.atlassian.com/software/jira/pricing",
]

FALLBACK_URL = "https://nebulacomponents.shop"


def _get_next_subject():
    """Pick next subject from pool (round-robin via counter file)."""
    counter_file = config.TMP_DIR / ".subject_counter"
    try:
        idx = int(open(counter_file).read().strip())
    except (FileNotFoundError, ValueError):
        idx = 0
    subject = SUBJECT_POOL[idx % len(SUBJECT_POOL)]
    with open(counter_file, "w") as f:
        f.write(str((idx + 1) % len(SUBJECT_POOL)))
    return subject


def _log_result(video_path, script):
    """Append to video production log."""
    log_file = config.VIDEO_DIR / "production_log.jsonl"
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "domain": script["domain"],
        "title": script["title"],
        "score": script["overall_score"],
        "video_path": video_path,
        "duration": script["total_duration"],
    }
    with open(log_file, "a") as f:
        f.write(json.dumps(entry) + "\n")
    logger.info(f"Logged production: {script['domain']}")


async def produce(url=None, dry_run=False, publish=True):
    """Main orchestration: audit → produce → upload (unless dry-run)."""
    # 1. Pick subject (provided URL or rotate pool)
    target_url = url or _get_next_subject()
    logger.info(f"Subject: {target_url}")

    # 2. Import and run audit
    sys.path.insert(0, str(ROOT))
    from deliver_audit import scrape_page, score_audit

    try:
        logger.info("Scraping page...")
        page = scrape_page(target_url)
        logger.info(f"Page fetched: {page.get('url', target_url)}")
    except Exception as e:
        logger.warning(f"Failed to fetch {target_url}: {e}")
        if url is None:
            logger.info(f"Falling back to {FALLBACK_URL}")
            page = scrape_page(FALLBACK_URL)
            target_url = FALLBACK_URL
        else:
            raise

    logger.info("Scoring audit...")
    audit = score_audit(page)
    logger.info(f"Score: {audit['overall']:.1f}/10 ({audit.get('overall_grade', '?')})")

    # 3. Produce long-form video + Short in parallel
    logger.info("Producing long-form video + Short...")
    long_result, short_result = await asyncio.gather(
        produce_video(page, audit, url=target_url),
        produce_short(page, audit, url=target_url),
    )
    video_path = long_result["video_path"]
    thumbnail_path = long_result["thumbnail_path"]
    script = long_result["script"]
    short_path = short_result["video_path"]
    short_script = short_result["script"]

    logger.info(f"Long-form: {video_path} ({long_result['audio_duration']:.0f}s)")
    logger.info(f"Short:     {short_path} ({short_result['audio_duration']:.0f}s)")

    _log_result(video_path, script)

    if dry_run:
        logger.info("DRY RUN — stopping before upload")
        return {
            "status": "dry_run",
            "video_path": video_path,
            "short_path": short_path,
            "script": script,
        }

    # 4. Upload (if OAuth configured and publish=True)
    if publish:
        from yt_channel.upload import upload_video, set_thumbnail, TOKEN_FILE
        if not TOKEN_FILE.exists():
            logger.warning("OAuth not configured — skipping upload.")
            return {"status": "no_auth", "video_path": video_path}

        # Upload long-form
        logger.info("Uploading long-form video...")
        video_id = upload_video(
            video_path=video_path,
            title=script["title"],
            description=script["description"],
            privacy="public",
        )
        if video_id:
            logger.info(f"✅ Long-form: https://youtube.com/watch?v={video_id}")
            set_thumbnail(video_id, thumbnail_path)
        else:
            logger.error("Long-form upload failed")

        # Upload Short
        logger.info("Uploading Short...")
        short_id = upload_video(
            video_path=short_path,
            title=short_script["title"],
            description=short_script["description"],
            privacy="public",
        )
        if short_id:
            logger.info(f"✅ Short: https://youtube.com/shorts/{short_id}")
        else:
            logger.error("Short upload failed")

        return {
            "status": "published",
            "video_id": video_id,
            "short_id": short_id,
            "video_path": video_path,
            "short_path": short_path,
        }

    return {"status": "produced", "video_path": video_path, "short_path": short_path}


def main():
    parser = argparse.ArgumentParser(description="Nebula Audits — YouTube Pipeline")
    parser.add_argument("--url", help="Audit a specific URL")
    parser.add_argument("--dry-run", action="store_true", help="Generate video only")
    parser.add_argument("--no-publish", action="store_true", help="Skip upload even if auth exists")
    args = parser.parse_args()

    result = asyncio.run(produce(
        url=args.url,
        dry_run=args.dry_run,
        publish=not args.no_publish,
    ))

    status = result.get("status", "unknown")
    print(f"\n=== Result: {status} ===")
    if "video_path" in result:
        print(f"Video: {result['video_path']}")
    if "video_id" in result:
        print(f"Long-form: https://youtube.com/watch?v={result['video_id']}")
    if "short_id" in result:
        print(f"Short:     https://youtube.com/shorts/{result['short_id']}")


if __name__ == "__main__":
    main()
