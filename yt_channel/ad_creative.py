#!/usr/bin/env python3
"""UGC-style video ad generator — the "HeyGen" analog from Simon Høiberg's
one-person SaaS AI stack (v-AkmjJNxZo).

Turns a promoted URL into a vertical (9:16) UGC-style ad creative:
  hook variants → scored by title_score (deterministic pick)
  → 4-segment UGC script (hook / problem / proof / CTA)
  → per-segment voiceover (edge-tts, no API key)
  → cards over a REAL darkened screenshot of the page (contrast panels)
  → Ken Burns motion assembly (yt_channel.motion)
  → fail-closed QA gate (yt_channel.qa_video)

No upload — ad creatives are produced for review, not auto-published.

Usage:
  python3 yt_channel/ad_creative.py --url https://nebulacomponents.com/audit \
      --out yt_channel/ads/my-campaign --duration 25

Output: <out>/ad.mp4 + <out>/manifest.json (hooks, script, durations, QA result).
Exit 0 = produced + QA pass, 1 = any failure.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import subprocess
import sys
from pathlib import Path

# Ensure the repo root is importable (scripts run from anywhere, incl. cron).
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from PIL import Image, ImageDraw, ImageFont

from yt_channel.motion import assemble_motion_video
from yt_channel.screenshot import capture_page, prepare_bg
from yt_channel.title_score import score_title

# ── Visual constants (match produce_short.py design language) ──────────
SW, SH = 1080, 1920
BG = (13, 17, 23)
BG_CARD = (22, 27, 34)
ACCENT = (16, 185, 129)
WHITE = (255, 255, 255)
MUTED = (148, 163, 184)
FPS = 30

FONT_DIR = Path("/usr/share/fonts/truetype")
FONT_CANDIDATES = [
    FONT_DIR / "dejavu/DejaVuSans-Bold.ttf",
    FONT_DIR / "liberation/LiberationSans-Bold.ttf",
]


def _load_fonts() -> dict[str, ImageFont.FreeTypeFont]:
    path = next((p for p in FONT_CANDIDATES if p.exists()), FONT_CANDIDATES[0])
    return {
        "xs": ImageFont.truetype(str(path), 34),
        "sm": ImageFont.truetype(str(path), 44),
        "md": ImageFont.truetype(str(path), 56),
        "lg": ImageFont.truetype(str(path), 76),
    }


def _wrap(text: str, font, max_width: int, draw) -> list[str]:
    words, lines, line = text.split(), [], ""
    for w in words:
        test = f"{line} {w}".strip()
        if draw.textlength(test, font=font) <= max_width:
            line = test
        else:
            if line:
                lines.append(line)
            line = w
    if line:
        lines.append(line)
    return lines


def _draw_wrapped(draw, text, font, x, y, max_width, fill, line_spacing=14, anchor_center=False):
    lines = _wrap(text, font, max_width, draw)
    for line in lines:
        if anchor_center:
            draw.text((SW // 2, y), line, fill=fill, font=font, anchor="mm")
            bbox = font.getbbox(line)
            y += (bbox[3] - bbox[1]) + line_spacing
        else:
            draw.text((x, y), line, fill=fill, font=font)
            bbox = font.getbbox(line)
            y += (bbox[3] - bbox[1]) + line_spacing
    return y


def _panel(d, x, y, w, h, border=ACCENT, radius=28):
    d.rounded_rectangle([x, y, x + w, y + h], radius=radius, fill=BG, outline=border, width=3)


def make_card(lines: list[str], kicker: str, footer: str, bg=None) -> Image.Image:
    img = prepare_bg(bg, SW, SH, darken=0.38) or Image.new("RGB", (SW, SH), BG)
    d = ImageDraw.Draw(img)
    f = _load_fonts()
    d.rectangle([0, 0, SW, 8], fill=ACCENT)

    font = f["lg"]
    max_width = SW - 200
    wrapped = _wrap(lines[0], font, max_width, d)
    if len(wrapped) > 3:
        font = f["md"]
        wrapped = _wrap(lines[0], font, max_width, d)
    line_h = 78 if font is f["lg"] else 60
    block_h = len(wrapped) * line_h

    panel_w = SW - 140
    panel_h = block_h + 230
    px = (SW - panel_w) // 2
    py = SH // 2 - panel_h // 2
    _panel(d, px, py, panel_w, panel_h)

    d.text((SW // 2, py + 60), kicker, fill=ACCENT, font=f["sm"], anchor="mm")
    y0 = py + 60 + 70
    for i, line in enumerate(wrapped):
        d.text((SW // 2, y0 + i * line_h + line_h // 2), line, fill=WHITE, font=font, anchor="mm")
    d.text((SW // 2, py + panel_h - 60), footer, fill=MUTED, font=f["sm"], anchor="mm")

    d.rectangle([0, SH - 8, SW, SH], fill=ACCENT)
    return img


# ── UGC script generation ──────────────────────────────────────────────

def hook_variants(domain: str) -> list[str]:
    d = domain.split(".")[0] if domain else "your page"
    return [
        f"Why isn't {d} converting? It's not the traffic.",
        f"Your landing page is bleeding money. Here's the leak.",
        f"Stop blaming the ads. Your page is the problem.",
        f"I ran a free audit on {d}. The headline is costing you sales.",
        f"Still paying for clicks that never convert?",
        f"This 2-minute audit found why {d} loses customers.",
        f"Your ad says one thing. Your page says another.",
        f"Most landing pages fail this one check. Does yours?",
    ]


def build_script(hook: str, domain: str) -> list[dict]:
    d = domain.split(".")[0] if domain else "your page"
    return [
        {"seg": "hook", "text": hook},
        {"seg": "problem",
         "text": f"Here's the thing. You're paying for clicks, people land on {d}, and nothing happens. "
                 f"Nine out of ten times it's not the ad — it's the page."},
        {"seg": "proof",
         "text": "In under two minutes, a free audit scores your headline, your CTA, your trust signals, "
                 "and tells you exactly where the leak is. No signup. No sales call."},
        {"seg": "cta",
         "text": "Get your free landing page audit at nebulacomponents.com. Find the leak before you "
                 "spend another dollar on ads."},
    ]


# ── Audio ──────────────────────────────────────────────────────────────

async def _tts(text: str, output: Path) -> None:
    import edge_tts
    communicate = edge_tts.Communicate(text, voice="en-US-AriaNeural", rate="+12%")
    await communicate.save(str(output))


def probe_duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


def concat_audios(parts: list[Path], out: Path) -> float:
    with open("/tmp/ad_concat.txt", "w") as f:
        for p in parts:
            f.write(f"file '{p.resolve()}'\n")
    subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", "/tmp/ad_concat.txt",
         "-c", "copy", str(out)],
        check=True, capture_output=True,
    )
    return probe_duration(out)


# ── Main ───────────────────────────────────────────────────────────────

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--url", required=True, help="promoted page URL (e.g. https://nebulacomponents.com/audit)")
    ap.add_argument("--out", default="yt_channel/ads/default", help="output dir")
    ap.add_argument("--duration", type=int, default=25, help="target ad duration in seconds")
    ap.add_argument("--keep-audio", action="store_true", help="keep per-segment audio files")
    args = ap.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    domain = args.url.replace("https://", "").replace("http://", "").split("/")[0]

    # 1. Hook: generate variants, score deterministically, pick best.
    variants = hook_variants(domain)
    scored = sorted(
        (score_title(v, is_short=True, domain=domain) for v in variants),
        key=lambda o: -o.score,
    )
    hook = scored[0].title
    print(f"hook: {hook}  (score {scored[0].score})")
    print("  runner-ups: " + " | ".join(f"{o.score}:{o.title[:40]}" for o in scored[1:4]))

    # 2. Script + audio per segment.
    script = build_script(hook, domain)
    audio_parts: list[Path] = []
    total_audio = 0.0
    for seg in script:
        part = out_dir / f"audio_{seg['seg']}.mp3"
        asyncio.run(_tts(seg["text"], part))
        audio_parts.append(part)
        total_audio += probe_duration(part)
        print(f"  audio[{seg['seg']}] {probe_duration(part):.1f}s")

    voiceover = out_dir / "voiceover.mp3"
    total_audio = concat_audios(audio_parts, voiceover)
    print(f"voiceover total: {total_audio:.1f}s")

    # 3. Cards over a real screenshot of the promoted page (fail-open bg).
    shot = capture_page(args.url, width=1280, height=800)
    bg = shot if shot else None

    # Segment timings proportional to audio, then scale to target duration.
    seg_durs = [probe_duration(p) for p in audio_parts]
    total_seg = sum(seg_durs) or 1.0
    scale = max(1.0, args.duration / total_seg)
    durations = [max(2.0, round(d * scale, 2)) for d in seg_durs]

    frames = [
        make_card([hook], "NEBULA AUDITS · FREE AUDIT", domain, bg=bg),
        make_card([script[1]["text"]], "THE PROBLEM", domain, bg=bg),
        make_card([script[2]["text"]], "THE PROOF", domain, bg=bg),
        make_card([script[3]["text"]], "FIX IT TODAY", "nebulacomponents.com/audit", bg=bg),
    ]

    frame_paths = []
    for i, frame in enumerate(frames):
        p = out_dir / f"card_{i}.png"
        frame.save(p)
        frame_paths.append(p)

    # 4. Motion assembly (Ken Burns + crossfade + mux voiceover).
    ad_path = out_dir / "ad.mp4"
    assemble_motion_video(frame_paths, durations, voiceover, ad_path, SW, SH, fps=FPS)
    print(f"assembled: {ad_path} ({sum(durations):.1f}s)")

    # 5. Fail-closed QA gate (short bounds: 1080x1920, 20-60s).
    title = hook[:90]
    description = (
        f"{hook}\n\nFree landing page audit: https://nebulacomponents.com/audit"
        f"?utm_source=youtube-ad&utm_medium=ugc-creative\n"
        f"Score your page across 9 conversion signals in under 2 minutes — no signup."
    )
    qa = subprocess.run(
        [sys.executable, "yt_channel/qa_video.py", "--video", str(ad_path),
         "--kind", "short", "--title", title, "--description", description],
        capture_output=True, text=True,
    )
    qa_json = {}
    try:
        qa_json = json.loads(qa.stdout) if qa.stdout else {}
    except Exception:
        pass

    manifest = {
        "url": args.url,
        "domain": domain,
        "hook": hook,
        "hook_score": scored[0].score,
        "script": script,
        "segment_durations_s": durations,
        "total_duration_s": round(sum(durations), 2),
        "ad": str(ad_path),
        "qa_pass": qa.returncode == 0,
        "qa": qa_json,
    }
    with open(out_dir / "manifest.json", "w") as f:
        json.dump(manifest, f, indent=2)

    if qa.returncode != 0:
        print("QA FAILED:", qa.stdout[:800], file=sys.stderr)
        return 1
    print(f"QA PASS — {ad_path} ready for review (manifest: {out_dir / 'manifest.json'})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
