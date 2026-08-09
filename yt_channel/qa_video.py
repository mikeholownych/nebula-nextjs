#!/usr/bin/env python3
"""Automated quality gate for produced Nebula Audits videos.

Run before ANY upload. Fail-closed: any check failing returns exit 1
with reasons, so broken renders never reach YouTube.

Checks:
  - file exists + non-empty
  - resolution matches expected (short: 1080x1920, long: 1280x720)
  - duration within bounds (short 20-60s, long 60-300s)
  - audio stream present + not silent (mean_volume > -40 dB)
  - title: 5-100 chars, no forbidden unicode/control chars
  - description: has nebulacomponents.com + utm_source=youtube
  - thumbnail exists (long-form only)

Usage:
  python3 yt_channel/qa_video.py --video PATH --kind short|long \
      --title "..." --description "..." [--thumbnail PATH]
Exit 0 = pass, 1 = fail. Prints JSON.
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

# Forbidden chars from repo pre-commit rule (CLAUDE.md):
# block elements U+2580-259F, replacement char U+FFFD, geometric shapes U+25A0-25FF
FORBIDDEN_RE = re.compile(
    "[\u2580-\u259f\uFFFD\u25a0-\u25ff"
    "\x00-\x08\x0b\x0c\x0e-\x1f\x7f]"
)

EXPECTED_RES = {"short": (1080, 1920), "long": (1280, 720)}
DURATION_RANGE = {"short": (20, 60), "long": (60, 300)}


def ffprobe(video_path: str, args: list[str]) -> str:
    out = subprocess.run(
        ["ffprobe", "-v", "error", *args, str(video_path)],
        capture_output=True, text=True,
    )
    return out.stdout.strip()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--kind", required=True, choices=["short", "long"])
    ap.add_argument("--title", required=True)
    ap.add_argument("--description", required=True)
    ap.add_argument("--thumbnail")
    args = ap.parse_args()

    checks = {}

    # 1. File exists + non-empty
    p = Path(args.video)
    checks["file_exists"] = p.exists() and p.stat().st_size > 50_000

    # 2. Resolution
    res = ffprobe(args.video, [
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height",
        "-of", "csv=p=0",
    ])
    try:
        w, h = (int(x) for x in res.split(","))
        checks["resolution"] = (w, h) == EXPECTED_RES[args.kind]
        if not checks["resolution"]:
            checks["resolution_detail"] = f"got {w}x{h}, want {EXPECTED_RES[args.kind]}"
    except Exception:
        checks["resolution"] = False
        checks["resolution_detail"] = f"unparsable ffprobe: {res!r}"

    # 3. Duration
    dur = float(ffprobe(args.video, [
        "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1",
    ]) or 0)
    lo, hi = DURATION_RANGE[args.kind]
    checks["duration"] = lo <= dur <= hi
    if not checks["duration"]:
        checks["duration_detail"] = f"{dur:.1f}s (want {lo}-{hi}s)"

    # 4. Audio present + non-silent
    has_audio = "audio" in ffprobe(args.video, [
        "-show_entries", "stream=codec_type", "-of", "csv=p=0",
    ])
    vol = ffprobe(args.video, [
        "-select_streams", "a:0", "-show_entries", "stream=start_time",
        "-of", "default=noprint_wrappers=1:nokey=1",
    ])
    mean_vol = -100.0
    if has_audio:
        vd = subprocess.run(
            ["ffmpeg", "-i", args.video, "-af", "volumedetect",
             "-f", "null", "-"],
            capture_output=True, text=True,
        ).stderr
        m = re.search(r"mean_volume:\s*([-\d.]+) dB", vd)
        if m:
            mean_vol = float(m.group(1))
    checks["audio_present"] = has_audio
    checks["audio_not_silent"] = has_audio and mean_vol > -40.0
    if not checks["audio_not_silent"]:
        checks["audio_detail"] = f"mean_volume={mean_vol:.1f} dB, audio={has_audio}"

    # 5. Title
    t = args.title.strip()
    checks["title_length"] = 5 <= len(t) <= 100
    checks["title_charset"] = not FORBIDDEN_RE.search(t)
    if not checks["title_charset"]:
        checks["title_detail"] = repr(t)

    # 6. Description
    d = args.description or ""
    checks["desc_cta"] = "nebulacomponents.com" in d
    checks["desc_utm"] = "utm_source=youtube" in d
    checks["desc_charset"] = not FORBIDDEN_RE.search(d)

    # 7. Thumbnail (long-form)
    checks["thumbnail"] = True
    if args.kind == "long":
        th = Path(args.thumbnail) if args.thumbnail else None
        checks["thumbnail"] = bool(th and th.exists() and th.stat().st_size > 5_000)

    # 8. No dead audio tail (Jenny Hoyos: 'every second counts' — she
    #    trimmed a 1s silent tail and retention went 83%→88%). Audio
    #    should play through to the end; a silent final second is a
    #    drop-off point. Compare audio stream duration vs video.
    audio_dur = 0.0
    if has_audio:
        audio_dur = float(ffprobe(args.video, [
            "-select_streams", "a:0",
            "-show_entries", "stream=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
        ]) or 0)
    # allow muxer padding (~0.4s); flag anything over 0.6s of silence
    checks["no_dead_tail"] = (dur - audio_dur) <= 0.6 if has_audio else False
    if not checks["no_dead_tail"]:
        checks["dead_tail_detail"] = f"video {dur:.2f}s, audio {audio_dur:.2f}s ({(dur-audio_dur):.2f}s tail)"

    failed = [k for k, v in checks.items() if v is False]
    result = {
        "pass": not failed,
        "video": args.video,
        "kind": args.kind,
        "failed_checks": failed,
        "checks": checks,
    }
    print(json.dumps(result, indent=2))
    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main())
