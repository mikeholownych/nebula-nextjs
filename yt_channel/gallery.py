#!/usr/bin/env python3
"""Generate a self-contained visual gallery of every produced video.

The 'gallery wall' idea from the Higgsfield-replacement playbook
(RoboNuggets 9C4TRbucmhQ): "with matters of design and visuals, you need
to be able to SEE what Claude and the models are generating for you to
properly assess if they're good or not."

Our version: extract a preview frame from every video in the production
log (or reuse the long-form thumbnail), embed them as data URIs in a
single portable HTML file, and join with studio activity to show upload
status. Open yt_channel/gallery.html in any browser — no server needed.

Usage:
  python3 yt_channel/gallery.py [--out yt_channel/gallery.html]
"""

import sys, json, base64, subprocess, logging
from pathlib import Path
from datetime import datetime

NEBULA_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(NEBULA_DIR))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("gallery")

VIDEO_DIR = NEBULA_DIR / "yt_channel" / "videos"
THUMB_DIR = NEBULA_DIR / "yt_channel" / "thumbnails"
ACTIVITY = NEBULA_DIR / "yt_channel" / "logs" / "studio_activity.jsonl"
PRODUCTION_LOG = VIDEO_DIR / "production_log.jsonl"

FRAME_W = 360  # preview width (px) — keep HTML small


def _read_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    out = []
    for line in path.read_text().strip().splitlines():
        if not line:
            continue
        try:
            out.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return out


def _extract_frame(video_path: Path, out_png: Path) -> bool:
    """Grab a mid-video frame at FRAME_W width. Returns True on success."""
    try:
        subprocess.run(
            [
                "ffmpeg", "-y", "-ss", "00:00:01.5", "-i", str(video_path),
                "-frames:v", "1", "-vf", f"scale={FRAME_W}:-2",
                str(out_png),
            ],
            capture_output=True, text=True, timeout=60,
        )
        return out_png.exists() and out_png.stat().st_size > 0
    except Exception as e:
        log.warning(f"frame extract failed for {video_path.name}: {e}")
        return False


def _data_uri(path: Path) -> str:
    return "data:image/png;base64," + base64.b64encode(path.read_bytes()).decode()


def _uploaded_domains(activity: list[dict]) -> set[str]:
    return {e["domain"] for e in activity
            if e.get("stage") == "upload" and e.get("status") == "ok"}


def build(out_path: Path) -> int:
    prods = _read_jsonl(PRODUCTION_LOG)
    activity = _read_jsonl(ACTIVITY)
    uploaded = _uploaded_domains(activity)

    cards = []
    frame_dir = NEBULA_DIR / "yt_channel" / "logs" / "gallery_frames"
    frame_dir.mkdir(parents=True, exist_ok=True)

    for i, p in enumerate(prods):
        domain = p.get("domain", "?")
        title = p.get("title", "")
        score = p.get("score")
        duration = p.get("duration")
        ts = p.get("timestamp", "")[:16].replace("T", " ")
        video_path = Path(p.get("video_path", ""))
        if not video_path.exists():
            # fall back to the conventional filename
            cand = VIDEO_DIR / f"{domain.replace('.', '_')}.mp4"
            short_cand = VIDEO_DIR / f"{domain.replace('.', '_')}_short.mp4"
            video_path = cand if cand.exists() else short_cand
        if not video_path.exists():
            log.warning(f"missing file for {domain} — skipping card")
            continue

        # Prefer the long-form thumbnail if it exists, else extract a frame
        thumb_candidates = [
            THUMB_DIR / f"{domain.replace('.', '_')}.png",
            THUMB_DIR / f"{domain}.png",
        ]
        thumb = next((t for t in thumb_candidates if t.exists()), None)
        frame_png = frame_dir / f"card_{i}.png"
        if thumb is None:
            if not _extract_frame(video_path, frame_png):
                continue
            thumb = frame_png
        img_uri = _data_uri(thumb)

        cards.append({
            "domain": domain,
            "title": title,
            "score": score,
            "duration": duration,
            "ts": ts,
            "uploaded": domain in uploaded,
            "video": video_path.name,
            "img": img_uri,
        })

    cards.sort(key=lambda c: c["ts"], reverse=True)

    def card_html(c: dict) -> str:
        badge = ("<span class='badge up'>▲ uploaded</span>" if c["uploaded"]
                 else "<span class='badge back'>▣ backlog</span>")
        score = f"<span class='score'>{c['score']:.1f}</span>" if c["score"] is not None else ""
        dur = f"{c['duration']:.0f}s" if c["duration"] else ""
        return f"""
        <div class="card">
          <div class="thumb"><img src="{c['img']}" alt="{c['domain']}" loading="lazy"></div>
          <div class="meta">
            <div class="row1"><span class="domain">{c['domain']}</span>{badge}</div>
            <div class="title">{c['title']}</div>
            <div class="row2">{score} <span class="ts">{c['ts']}</span> <span class="dur">{dur}</span></div>
          </div>
        </div>"""

    html = f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Nebula Audits — Video Gallery</title>
<style>
  body {{ font-family: -apple-system, system-ui, sans-serif; margin: 0; background: #0f1115; color: #e8eaed; }}
  header {{ padding: 20px 28px; border-bottom: 1px solid #23272f; display: flex; justify-content: space-between; align-items: baseline; }}
  h1 {{ font-size: 20px; margin: 0; }} header small {{ color: #9aa0a6; }}
  .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px; padding: 24px 28px; }}
  .card {{ background: #161a21; border: 1px solid #23272f; border-radius: 12px; overflow: hidden; }}
  .thumb {{ aspect-ratio: 9/16; background: #000; overflow: hidden; }}
  .thumb img {{ width: 100%; height: 100%; object-fit: cover; display: block; }}
  .meta {{ padding: 10px 12px 12px; }}
  .row1 {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }}
  .domain {{ font-weight: 600; color: #fff; }}
  .badge {{ font-size: 10px; padding: 2px 8px; border-radius: 999px; }}
  .badge.up {{ background: #1a3a2a; color: #4ade80; }}
  .badge.back {{ background: #33291a; color: #fbbf24; }}
  .title {{ font-size: 13px; color: #cfd3da; line-height: 1.35; min-height: 36px; }}
  .row2 {{ display: flex; gap: 10px; align-items: center; margin-top: 6px; font-size: 12px; color: #9aa0a6; }}
  .score {{ font-size: 15px; font-weight: 700; color: #7dd3fc; }}
  .ts {{ color: #6b7280; }}
</style></head><body>
<header><h1>🎬 Nebula Audits — Video Gallery</h1>
<small>{len(cards)} videos · generated {datetime.now().strftime('%Y-%m-%d %H:%M UTC')} · uploaded {sum(1 for c in cards if c['uploaded'])} / {len(cards)}</small></header>
<div class="grid">{''.join(card_html(c) for c in cards)}</div>
</body></html>"""

    out_path.write_text(html)
    log.info(f"Gallery written: {out_path} ({len(cards)} cards, {out_path.stat().st_size // 1024} KB)")
    return len(cards)


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Nebula Audits video gallery")
    parser.add_argument("--out", default=str(NEBULA_DIR / "yt_channel" / "gallery.html"))
    args = parser.parse_args()
    n = build(Path(args.out))
    print(f"Gallery built: {args.out} ({n} videos)")


if __name__ == "__main__":
    main()
