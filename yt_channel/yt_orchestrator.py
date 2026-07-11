#!/usr/bin/env python3
"""YouTube video orchestrator — picks a lead, audits, produces video, uploads.

Pipeline:
  1. Pick the most recent eligible lead from audit_leads.jsonl that hasn't
     had a YouTube video produced yet (or fall back to nebulacomponents.shop)
  2. Scrape page HTML & run the full structured audit
  3. Produce a long-form video + thumbnail
  4. Upload to YouTube (if OAuth is set up)
  5. Log to production_log.jsonl

Run from nebula root:
  python3 yt_channel/yt_orchestrator.py [--upload]

Environment:
  - OAuth token in yt_channel/creds/token.pickle  (skip upload if absent)
"""

import sys, json, os, subprocess, random, logging
from pathlib import Path
from datetime import datetime, timezone

# ── Setup ────────────────────────────────────────────────────────────
NEBULA_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(NEBULA_DIR))
# Add venv site-packages for edge-tts, requests, bs4, etc.
sys.path.insert(0, str(NEBULA_DIR / "venv" / "lib" / "python3.12" / "site-packages"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("yt_orchestrator")

from deliver_audit import scrape_page, score_audit
from yt_channel.produce import produce_video
from yt_channel.config import VIDEO_DIR, THUMBNAIL_DIR

PRODUCTION_LOG = VIDEO_DIR / "production_log.jsonl"
AUDIT_LEADS_FILE = NEBULA_DIR / "audit_leads.jsonl"
SKIP_DOMAINS = {"example.com", "test.com", "localhost"}
# Domains we've already done (read from production log)
PRODUCED_DOMAINS_CACHE = None


def load_produced_domains():
    """Return set of domains already produced as YouTube videos."""
    global PRODUCED_DOMAINS_CACHE
    if PRODUCED_DOMAINS_CACHE is not None:
        return PRODUCED_DOMAINS_CACHE
    produced = set()
    if PRODUCTION_LOG.exists():
        for line in PRODUCTION_LOG.read_text().strip().splitlines():
            if line:
                try:
                    entry = json.loads(line)
                    produced.add(entry.get("domain", ""))
                except json.JSONDecodeError:
                    pass
    PRODUCED_DOMAINS_CACHE = produced
    return produced


def pick_lead() -> tuple[str, str, dict | None]:
    """Pick the best lead from audit_leads.jsonl.

    Returns (url, email, existing_audit).
    Chooses the most recent entry that hasn't had a video yet.
    Falls back to nebulacomponents.shop.
    """
    produced = load_produced_domains()

    if AUDIT_LEADS_FILE.exists():
        lines = AUDIT_LEADS_FILE.read_text().strip().splitlines()
        # Parse in reverse (most recent first)
        for line in reversed(lines):
            if not line.strip():
                continue
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue
            url = (entry.get("url") or "").strip()
            if not url:
                continue
            domain = url.replace("https://", "").replace("http://", "").split("/")[0]
            if domain in SKIP_DOMAINS:
                continue
            if domain in produced:
                log.info(f"Skipping {domain} — already produced")
                continue
            # Found an eligible lead
            log.info(f"Picked lead: {url} (email={entry.get('email', '?')})")
            # Build a partial audit dict if scores are embedded
            existing_audit = None
            if "overall" in entry and "dimensions" in entry:
                existing_audit = {
                    "overall": entry["overall"],
                    "overall_grade": entry.get("overall_grade", "C"),
                    "dimensions": entry["dimensions"],
                }
            elif entry.get("score") is not None:
                # Some leads only have a flat score — we'll re-audit
                pass
            return url, entry.get("email", ""), existing_audit

    # Fallback: nebulacomponents.shop
    log.info("No new leads found — falling back to nebulacomponents.shop")
    return "https://nebulacomponents.shop", "admin@nebulacomponents.shop", None


def log_production(domain, title, score, video_path, duration):
    """Append to production_log.jsonl atomically."""
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "domain": domain,
        "title": title,
        "score": score,
        "video_path": str(video_path),
        "duration": round(duration, 1),
    }
    tmp = PRODUCTION_LOG.with_suffix(".jsonl.tmp")
    with open(tmp, "w") as f:
        if PRODUCTION_LOG.exists():
            f.write(PRODUCTION_LOG.read_text())
        f.write(json.dumps(entry) + "\n")
    os.replace(tmp, PRODUCTION_LOG)
    log.info(f"Production logged: {domain} — {title}")
    return entry


async def run_pipeline(upload: bool = False):
    """Full production pipeline."""
    # 1. Pick lead
    url, email, existing_audit = pick_lead()
    domain = url.replace("https://", "").replace("http://", "").split("/")[0]
    log.info(f"Target domain: {domain}")

    # 2. Run audit (or use cached)
    if existing_audit and "dimensions" in existing_audit:
        log.info(f"Using cached audit data for {domain}")
        page = {"url": url}
        audit = existing_audit
    else:
        log.info(f"Running live audit on {url}")
        try:
            page = scrape_page(url)
        except Exception as e:
            log.error(f"Scrape failed: {e}")
            raise
        audit = score_audit(page)
        log.info(f"Audit complete: {audit['overall']}/10 ({audit['overall_grade']})")

    # 3. Produce video
    log.info("Producing video...")
    result = await produce_video(page, audit, url)
    video_path = Path(result["video_path"])
    thumbnail_path = Path(result["thumbnail_path"])
    script = result["script"]

    log.info(f"Video produced: {video_path.name} ({result['audio_duration']:.1f}s)")

    # 4. Log production
    entry = log_production(
        domain=domain,
        title=script["title"],
        score=script["overall_score"],
        video_path=video_path,
        duration=result["audio_duration"],
    )

    # 5. Upload to YouTube (optional)
    if upload:
        try:
            from yt_channel.upload import upload_video, set_thumbnail

            log.info("Uploading to YouTube...")
            video_id = upload_video(
                video_path=str(video_path),
                title=script["title"],
                description=script["description"],
                privacy="public",
            )
            if video_id:
                log.info(f"✅ Uploaded: https://youtube.com/watch?v={video_id}")
                if thumbnail_path.exists():
                    set_thumbnail(video_id, str(thumbnail_path))
                    log.info("✅ Thumbnail set")
            else:
                log.warning("Upload returned no video ID")
        except Exception as e:
            log.warning(f"Upload failed (OAuth may not be set up): {e}")

    return entry


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Nebula Audits YouTube pipeline")
    parser.add_argument("--upload", action="store_true", help="Upload to YouTube after production")
    args = parser.parse_args()

    import asyncio
    entry = asyncio.run(run_pipeline(upload=args.upload))

    # Print result summary
    print(json.dumps(entry, indent=2))
    print(f"\n✅ Video ready: {entry['video_path']}")
    if args.upload:
        print(f"   Title: {entry['title']}")


if __name__ == "__main__":
    main()
