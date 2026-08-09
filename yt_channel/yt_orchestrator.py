#!/usr/bin/env python3
"""YouTube video orchestrator — picks a lead, audits, produces video, uploads.

Pipeline:
  1. Pick the most recent eligible lead from audit_leads.jsonl that hasn't
     had a YouTube video produced yet (or fall back to nebulacomponents.com)
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
# Per-stage activity log (the "agents log every task" DB from the
# content-studio pattern — enables the studio dashboard's real success
# rate and failure view instead of guesswork).
STUDIO_ACTIVITY_LOG = NEBULA_DIR / "yt_channel" / "logs" / "studio_activity.jsonl"


def log_stage(stage: str, domain: str, status: str, detail: str = ""):
    """Append one stage event to studio_activity.jsonl atomically.

    stage: pick|audit|script|render|qa|upload
    status: ok|fail|skip
    Mirrors the per-agent activity logging in the content-studio pattern:
    every stage logs its name, target, outcome, and timestamp so the
    dashboard shows real runs + success rate (no fake metrics).
    """
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "stage": stage,
        "domain": domain,
        "status": status,
        "detail": detail[:300],
    }
    try:
        STUDIO_ACTIVITY_LOG.parent.mkdir(parents=True, exist_ok=True)
        tmp = STUDIO_ACTIVITY_LOG.with_suffix(".jsonl.tmp")
        with open(tmp, "w") as f:
            if STUDIO_ACTIVITY_LOG.exists():
                f.write(STUDIO_ACTIVITY_LOG.read_text())
            f.write(json.dumps(entry) + "\n")
        os.replace(tmp, STUDIO_ACTIVITY_LOG)
    except Exception as e:
        log.warning(f"Could not write studio activity log: {e}")
    return entry
AUDIT_LEADS_FILE = NEBULA_DIR / "audit_leads.jsonl"
COUNTER_FILE = NEBULA_DIR / "yt_channel" / "tmp" / ".subject_counter"
SKIP_DOMAINS = {"example.com", "test.com", "localhost"}
# Domains we've already done (read from production log)
PRODUCED_DOMAINS_CACHE = None

# Renewable pool for daily shorts — high-traffic sites with clear conversion
# surfaces. Round-robin via COUNTER_FILE so we never run out of subjects.
SUBJECT_POOL = [
    "https://www.shopify.com",
    "https://www.notion.so",
    "https://www.airbnb.com",
    "https://www.mailchimp.com",
    "https://www.squarespace.com",
    # NOTE: wix.com REMOVED — SPA HTML exceeds MAX_AUDIT_HTML_BYTES (2MB),
    # scrape_page raises and previously killed the whole daily run.
    "https://www.canva.com",
    "https://www.dropbox.com",
    "https://www.slack.com",
    "https://www.figma.com",
    "https://www.hubspot.com",
    "https://www.clickfunnels.com",
]


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


def pick_lead(exclude: set[str] | None = None) -> tuple[str, str, dict | None]:
    """Pick the best lead from audit_leads.jsonl.

    Returns (url, email, existing_audit).
    Chooses the most recent entry that hasn't had a video yet.
    Falls back to nebulacomponents.com / round-robin pool.
    `exclude` — domains to skip (used when a subject fails to scrape,
    so the pipeline self-heals instead of dying on one bad URL).
    """
    exclude = exclude or set()
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
            if domain in SKIP_DOMAINS or domain in exclude:
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

    # Fallback: round-robin through the renewable subject pool
    # (fresh audits each day; pool cycles so subjects repeat but with
    #  a long gap between visits)
    try:
        counter = int(COUNTER_FILE.read_text().strip() or "0")
    except Exception:
        counter = 0
    url = SUBJECT_POOL[counter % len(SUBJECT_POOL)]
    counter += 1
    COUNTER_FILE.parent.mkdir(parents=True, exist_ok=True)
    COUNTER_FILE.write_text(str(counter))
    log.info(f"No new leads — pool subject #{counter - 1}: {url}")
    return url, "admin@nebulacomponents.shop", None


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


async def run_pipeline(upload: bool = False, mode: str = "both", hold_long: bool = False):
    """Full production pipeline. mode: 'both' | 'short' | 'long'."""
    import asyncio
    # 1. Pick lead — self-healing: if a subject fails to scrape (SPA >
    # size cap, bot-block, network), advance to the next subject instead
    # of killing the run. Max 3 attempts.
    attempted: set[str] = set()
    url, email, existing_audit = None, None, None
    domain = ""
    page = audit = None
    for _ in range(3):
        url, email, existing_audit = pick_lead(exclude=attempted)
        domain = url.replace("https://", "").replace("http://", "").split("/")[0]
        if existing_audit and "dimensions" in existing_audit:
            break  # cached audit — no scrape needed
        log.info(f"Running live audit on {url}")
        try:
            page = scrape_page(url)
            audit = score_audit(page)
            log_stage("audit", domain, "ok", f"score {audit['overall']}/10")
            break
        except Exception as e:
            log.warning(f"Scrape failed for {domain}: {e} — trying next subject")
            log_stage("audit", domain, "fail", str(e)[:200])
            attempted.add(domain)
            page = audit = None
    if page is None or audit is None:
        raise RuntimeError(f"No scrapeable subject found (tried: {sorted(attempted)})")
    log.info(f"Target domain: {domain}")

    # 2. Audit data ready (cached path reuses `audit` from cache)
    if not (existing_audit and "dimensions" in existing_audit):
        log.info(f"Audit complete: {audit['overall']}/10 ({audit['overall_grade']})")
    else:
        page = {"url": url}
        audit = existing_audit
        log.info(f"Using cached audit data for {domain}")

    # 3. Produce videos (both, or only the requested one)
    log.info("Producing video...")
    from yt_channel.produce_short import produce_short
    long_result = None
    short_result = None
    if mode == "both":
        long_result, short_result = await asyncio.gather(
            produce_video(page, audit, url),
            produce_short(page, audit, url),
        )
        result = long_result
        video_path = Path(result["video_path"])
        thumbnail_path = Path(result["thumbnail_path"])
        script = result["script"]
        short_path = Path(short_result["video_path"])
        log_stage("render", domain, "ok", f"long+short ({result['audio_duration']:.0f}s / {short_result['audio_duration']:.0f}s)")
        log.info(f"Short produced: {short_path.name} ({short_result['audio_duration']:.1f}s)")
        log.info(f"Video produced: {video_path.name} ({result['audio_duration']:.1f}s)")
    elif mode == "short":
        short_result = await produce_short(page, audit, url)
        result = None
        video_path = None
        thumbnail_path = None
        script = short_result["script"]
        short_path = Path(short_result["video_path"])
        log_stage("render", domain, "ok", f"short ({short_result['audio_duration']:.0f}s)")
        log.info(f"Short produced: {short_path.name} ({short_result['audio_duration']:.1f}s)")
    else:  # long
        result = await produce_video(page, audit, url)
        video_path = Path(result["video_path"])
        thumbnail_path = Path(result["thumbnail_path"])
        script = result["script"]
        short_path = None
        log_stage("render", domain, "ok", f"long ({result['audio_duration']:.0f}s)")
        log.info(f"Video produced: {video_path.name} ({result['audio_duration']:.1f}s)")

    # 4. Log production
    entry = log_production(
        domain=domain,
        title=script["title"],
        score=script["overall_score"],
        video_path=video_path or short_path,
        duration=(result or short_result)["audio_duration"],
    )

    # 5. Upload to YouTube (optional) — upload BOTH when mode=both
    if upload:
        try:
            from yt_channel.upload import upload_video, set_thumbnail, _get_authenticated_service
            from yt_channel.post_upload import ensure_playlist, run_post_upload

            svc = _get_authenticated_service()
            uploads = []
            if video_path is not None:
                uploads.append((video_path, script["title"], script["description"], thumbnail_path, "long"))
            if short_path is not None and short_result is not None:
                short_script = short_result.get("script") or {}
                # E'Calm Shorts system (srDpvEnGQg4): pick the BEST MOMENT
                # as the Short thumbnail — the frame people are most likely
                # to click, so the video keeps pulling traffic after the
                # algorithm slows down. For us that's the reward/payoff card
                # (the big score reveal). We extract it from the rendered
                # Short and pass it as the custom thumbnail.
                short_thumb = None
                try:
                    import subprocess as _sp
                    # ffmpeg is already a pipeline dependency; extract a frame
                    # at ~62% of the Short (the reward/payoff card) directly.
                    probe = _sp.run(
                        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
                         "-of", "default=noprint_wrappers=1:nokey=1", str(short_path)],
                        capture_output=True, text=True)
                    dur = float(probe.stdout.strip() or 0)
                    t = max(0.0, dur * 0.62)
                    frame_png = Path("/tmp") / f"short_frame_{domain.replace('.', '_')}.png"
                    _sp.run(
                        ["ffmpeg", "-y", "-v", "error", "-ss", f"{t:.2f}",
                         "-i", str(short_path), "-frames:v", "1", str(frame_png)],
                        check=True, capture_output=True)
                    if frame_png.exists():
                        # Shorts thumbnail: 9:16 vertical, high-res
                        from PIL import Image
                        img = Image.open(frame_png).convert("RGB")
                        img = img.resize((1080, 1920), Image.LANCZOS)
                        short_thumb = Path("/tmp") / f"short_thumb_{domain.replace('.', '_')}.png"
                        img.save(str(short_thumb))
                        log.info(f"Short thumbnail picked at t={t:.1f}s/{dur:.1f}s (reward moment)")
                except Exception as e:
                    log.warning(f"Could not extract short thumbnail: {e}")
                uploads.append((short_path, short_script.get("title", ""), short_script.get("description", ""), short_thumb, "short"))

            for path, title, description, thumb, kind in uploads:
                # ── Quality gate — fail-closed: broken renders never upload ──
                qa_cmd = [
                    sys.executable, "yt_channel/qa_video.py",
                    "--video", str(path),
                    "--kind", kind,
                    "--title", title,
                    "--description", description,
                ]
                if thumb is not None:
                    qa_cmd += ["--thumbnail", str(thumb)]
                qa = subprocess.run(qa_cmd, capture_output=True, text=True)
                if qa.returncode != 0:
                    log.warning(
                        f"QA FAILED for {kind} ({title[:50]}) — upload skipped: "
                        f"{qa.stdout.strip()[:300]}"
                    )
                    log_stage("qa", domain, "fail", f"{kind}: {qa.stdout.strip()[:200]}")
                    continue
                log_stage("qa", domain, "ok", kind)

                # Per-video tags: domain + worst dimension + niche keywords
                # (helps YouTube/advertisers classify; cheap, 20 seconds of
                # effort per Shane's upload-package step).
                tags = [
                    "landing page audit", "landing page teardown", "CRO",
                    "conversion optimization", "website audit",
                    "landing page review",
                    domain.replace("www.", ""),
                    title.split(":")[0].split("—")[0].strip()[:30],
                ]
                log.info(f"Uploading {kind} to YouTube...")
                # Shane Hummus (N45nMvSOgFQ) tip #7: file name = title —
                # YouTube reads the filename during processing (SEO metadata).
                # 'this tip alone probably got me an extra 10-20M views'.
                from yt_channel.post_upload import rename_to_title
                path = rename_to_title(path, title)

                # tip #1: hold LONG-FORM private 24-48h (YouTube's AI scans
                # new uploads; new channels get fewer resources so trust
                # matters more). Shorts stay public — the Shorts feed is the
                # discovery surface and is time-sensitive. publish_held.py
                # (run by yt_cron.sh) flips held videos to public at 24h.
                privacy = "private" if (kind == "long" and hold_long) else "public"
                video_id = upload_video(
                    video_path=str(path),
                    title=title,
                    description=description,
                    tags=tags,
                    privacy=privacy,
                )
                if video_id:
                    log.info(f"✅ Uploaded {kind} ({privacy}): https://youtube.com/watch?v={video_id}")
                    log_stage("upload", domain, "ok", f"{kind} {video_id} {privacy}")
                    if thumb is not None and thumb.exists():
                        set_thumbnail(video_id, str(thumb))
                        log.info("✅ Thumbnail set")
                    # Post-upload playbook (Shane N45nMvSOgFQ tips #6/#9):
                    # deep-link into the teardown playlist + self-comment
                    # with the free-audit link. Fail-closed: never breaks
                    # the pipeline if a step fails.
                    try:
                        pl_id = ensure_playlist(svc)
                        post = run_post_upload(svc, video_id, kind, playlist_id=pl_id)
                        log.info(f"Post-upload: playlist={post.get('playlist')} comment={post.get('comment')}")
                    except Exception as e:
                        log.warning(f"Post-upload steps failed: {e}")
                else:
                    log.warning(f"Upload returned no video ID ({kind})")
                    log_stage("upload", domain, "fail", f"{kind}: no video id")
        except Exception as e:
            log.warning(f"Upload failed (OAuth may not be set up): {e}")
            log_stage("upload", domain, "fail", str(e)[:200])

    return entry


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Nebula Audits YouTube pipeline")
    parser.add_argument("--upload", action="store_true", help="Upload to YouTube after production")
    parser.add_argument("--hold-long", action="store_true",
                        help="Upload long-form as private, publish after 24h (Shane N45nMvSOgFQ tip #1)")
    parser.add_argument("--mode", choices=["both", "short", "long"], default="both",
                        help="Which video(s) to produce/upload (default: both)")
    parser.add_argument("--batch", type=int, default=1,
                        help="Produce N videos in one run (no upload — backlog/buffer pre-production). "
                             "Subjects advance round-robin each iteration.")
    args = parser.parse_args()

    import asyncio
    if args.batch > 1 and args.upload:
        log.warning("--batch forces upload=False (never auto-post a burst — account-risk). "
                    "Producing backlog only.")
        args.upload = False

    entries = []
    for i in range(args.batch):
        if args.batch > 1:
            log.info(f"── Batch item {i + 1}/{args.batch} ──")
        try:
            entry = asyncio.run(run_pipeline(upload=args.upload, mode=args.mode, hold_long=args.hold_long))
        except Exception as e:
            log.error(f"Batch item {i + 1} failed: {e} — continuing with next item")
            continue
        entries.append(entry)
        # Refresh produced-domain cache so the next iteration picks a NEW subject
        global PRODUCED_DOMAINS_CACHE
        PRODUCED_DOMAINS_CACHE = None

    # Print result summary
    for entry in entries:
        print(json.dumps(entry, indent=2))
        print(f"\n✅ Video ready: {entry['video_path']}")
    if args.upload:
        print(f"   Title: {entries[-1]['title']}")


if __name__ == "__main__":
    main()
