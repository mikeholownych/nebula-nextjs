"""Produce a YouTube video from audit data.

Pipeline: script → TTS audio + visual cards → ffmpeg assembly → thumbnail.
"""

import json, asyncio, subprocess, textwrap, math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from . import config
from .script_gen import generate_script, DIM_LABELS

# ── Colour palette (dark Nebula theme) ──────────────────────────────
BG      = (15, 23, 42)       # slate-900
BG_CARD = (30, 41, 59)       # slate-800
WHITE   = (248, 250, 252)    # slate-50
GREEN   = (5, 150, 105)      # emerald-600
RED     = (220, 38, 38)      # red-600
YELLOW  = (217, 119, 6)      # amber-600
MUTED   = (148, 163, 184)    # slate-400
DIM     = (71, 85, 105)      # slate-500
ACCENT  = (52, 211, 153)     # emerald-400

W, H = 1280, 720  # 16:9


def _score_colour(s):
    if s < 4: return RED
    if s < 6.5: return YELLOW
    return GREEN


def _wrap(text, font, max_width, draw):
    """Wrap text to fit within max_width pixels."""
    words = text.split()
    lines = []
    line = ""
    for w in words:
        test = f"{line} {w}".strip()
        if draw.textlength(test, font=font) > max_width:
            lines.append(line)
            line = w
        else:
            line = test
    if line:
        lines.append(line)
    return lines


def make_intro_card(domain, overall, grade):
    """Channel intro frame."""
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    try:
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 52)
        sub_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 28)
        score_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 80)
        label_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
    except:
        title_font = sub_font = score_font = label_font = ImageFont.load_default()

    # Channel name
    d.text((W//2, 160), "NEBULA AUDITS", fill=ACCENT, font=title_font, anchor="mm")
    d.text((W//2, 230), "Landing Page Audit", fill=MUTED, font=sub_font, anchor="mm")

    # Domain + score
    d.text((W//2, 380), domain, fill=WHITE, font=sub_font, anchor="mm")

    # Score circle
    cx, cy = W//2, 520
    colour = _score_colour(overall)
    d.ellipse([cx-60, cy-60, cx+60, cy+60], outline=colour, width=6)
    d.text((cx, cy), f"{overall:.0f}", fill=colour, font=score_font, anchor="mm")
    d.text((cx, cy+55), f"/10 · Grade {grade}", fill=MUTED, font=label_font, anchor="mm")

    d.text((W//2, H-40), "nebulacomponents.shop", fill=DIM, font=label_font, anchor="mm")
    return img


def make_score_card(overall, grade, band, dim_count):
    """Overall score summary frame."""
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    try:
        big = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 100)
        sub = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 32)
        label = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 22)
    except:
        big = sub = label = ImageFont.load_default()

    colour = _score_colour(overall)
    d.text((W//2, 200), f"{overall:.1f}", fill=colour, font=big, anchor="mm")
    d.text((W//2, 290), f"/10 · Grade {grade} · {band}", fill=MUTED, font=sub, anchor="mm")
    d.text((W//2, 400), f"Scored across {dim_count} conversion dimensions", fill=WHITE, font=label, anchor="mm")
    d.text((W//2, 450), "Scroll down for the full breakdown", fill=DIM, font=label, anchor="mm")
    return img


def make_dim_card(dim_key, label, score, issue, fix):
    """Single dimension breakdown frame."""
    img = Image.new("RGB", (W, H), BG_CARD)
    d = ImageDraw.Draw(img)
    try:
        title_f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 38)
        body_f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
        score_f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 64)
        label_f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
    except:
        title_f = body_f = score_f = label_f = ImageFont.load_default()

    colour = _score_colour(score)

    # Score circle (top left)
    cx, cy = 140, 180
    d.ellipse([cx-55, cy-55, cx+55, cy+55], outline=colour, width=5)
    d.text((cx, cy), f"{score}", fill=colour, font=score_f, anchor="mm")
    d.text((cx, cy+50), "/10", fill=MUTED, font=label_f, anchor="mm")

    # Dimension label
    d.text((260, 120), label, fill=WHITE, font=title_f)

    # Issue text (wrapped)
    if issue:
        wrapped = _wrap(issue, body_f, 900, d)
        y = 200
        for line in wrapped[:4]:
            d.text((260, y), line, fill=MUTED, font=body_f)
            y += 36

    # Fix text
    if fix:
        d.text((260, 420), "→ Fix:", fill=ACCENT, font=body_f)
        wrapped_fix = _wrap(fix, body_f, 900, d)
        y = 460
        for line in wrapped_fix[:3]:
            d.text((260, y), line, fill=WHITE, font=body_f)
            y += 36

    # Bottom bar
    d.rectangle([0, H-6, W, H], fill=colour)

    return img


def make_outro_card(domain):
    """CTA frame."""
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    try:
        big = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36)
        body = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 26)
        small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
    except:
        big = body = small = ImageFont.load_default()

    d.text((W//2, 200), "Get Your Free Audit", fill=ACCENT, font=big, anchor="mm")
    d.text((W//2, 270), "nebulacomponents.shop/audit", fill=WHITE, font=body, anchor="mm")
    d.text((W//2, 340), "No call · No credit card · Instant results", fill=MUTED, font=small, anchor="mm")

    d.text((W//2, 480), "DIY Fix Kit: nebulacomponents.shop/checkout", fill=DIM, font=small, anchor="mm")
    d.text((W//2, 520), "$97 Done-For-You Fix Pack available", fill=DIM, font=small, anchor="mm")

    d.text((W//2, H-40), "Nebula Components — Autonomous Conversion Engineering", fill=DIM, font=small, anchor="mm")
    return img


# ── Async TTS via edge-tts ──────────────────────────────────────────

async def _generate_voiceover(text, output_path):
    """Generate TTS audio file using edge-tts (free, no API key)."""
    import edge_tts
    communicate = edge_tts.Communicate(text, voice="en-US-AriaNeural", rate="+10%")
    await communicate.save(str(output_path))
    return output_path


# ── Main pipeline ───────────────────────────────────────────────────

def _ensure_font():
    """Try to load a decent font, fall back to default."""
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]
    for c in candidates:
        if Path(c).exists():
            return c
    return None


async def produce_video(page, audit, url=None):
    """Full production pipeline: script → cards → TTS → ffmpeg → thumbnail.

    Returns {"video_path": str, "thumbnail_path": str, "script": dict}
    """
    script = generate_script(page, audit, url)
    domain = script["domain"]
    overall = script["overall_score"]
    grade = audit.get("overall_grade", "?")
    dims = audit["dimensions"]

    # Make temp dir for this video
    job_id = domain.replace(".", "_")
    job_dir = config.TMP_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    frames_dir = job_dir / "frames"
    frames_dir.mkdir(exist_ok=True)

    # 1. Generate visual frames
    _ensure_font()

    frames = []
    for i, seg in enumerate(script["segments"]):
        dim_key = seg["dimension"]
        visual_type = seg["visual"]

        if visual_type == "intro_card":
            img = make_intro_card(domain, overall, grade)
        elif visual_type == "score_card":
            band = "critical" if overall < 4 else "needs work" if overall < 6.5 else "decent" if overall < 8 else "strong"
            img = make_score_card(overall, grade, band, len(dims))
        elif visual_type == "outro_card":
            img = make_outro_card(domain)
        elif visual_type.startswith("dimension_") and dim_key:
            label = DIM_LABELS.get(dim_key, dim_key.replace("_", " ").title())
            data = dims.get(dim_key, {})
            img = make_dim_card(
                dim_key, label,
                data.get("score", 5),
                data.get("issue", ""),
                data.get("fix", ""),
            )
        else:
            # Fallback to intro-style
            img = make_intro_card(domain, overall, grade)

        frame_path = frames_dir / f"frame_{i:04d}.png"
        img.save(frame_path)
        frames.append(frame_path)

    # 2. Generate voiceover audio
    narration = " ".join(s["text"] for s in script["segments"])
    audio_path = job_dir / "voiceover.mp3"
    await _generate_voiceover(narration, audio_path)

    # 3. Get audio duration
    probe = subprocess.run([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(audio_path)
    ], capture_output=True, text=True)
    audio_duration = float(probe.stdout.strip()) if probe.stdout.strip() else script["total_duration"]

    # 4. Calculate per-frame display durations based on segment timing
    total_seg_duration = script["total_duration"]
    # Create a concat file for ffmpeg
    concat_path = job_dir / "concat.txt"
    with open(concat_path, "w") as f:
        for i, seg in enumerate(script["segments"]):
            seg_dur = seg["end"] - seg["start"]
            # Scale to actual audio duration
            scaled_dur = seg_dur * (audio_duration / max(total_seg_duration, 1))
            f.write(f"file '{frames[i]}'\n")
            f.write(f"duration {scaled_dur:.3f}\n")
        # Last frame needs an extra entry for mkv format
        f.write(f"file '{frames[-1]}'\n")

    # 5. Assemble video with ffmpeg
    video_path = config.VIDEO_DIR / f"{job_id}.mp4"
    subprocess.run([
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0", "-i", str(concat_path),
        "-i", str(audio_path),
        "-c:v", "libx264", "-preset", "medium", "-crf", "23",
        "-c:a", "aac", "-b:a", "128k",
        "-pix_fmt", "yuv420p",
        "-shortest",
        str(video_path)
    ], check=True, capture_output=True)

    # 6. Generate thumbnail
    from yt_channel.thumbnail import generate as gen_thumbnail
    thumbnail_path = config.THUMBNAIL_DIR / f"{job_id}.png"
    gen_thumbnail(
        domain=domain,
        score=overall,
        grade=grade,
        worst_label=script["worst_label"],
        output_path=str(thumbnail_path),
    )

    # Cleanup temp
    import shutil
    shutil.rmtree(job_dir, ignore_errors=True)

    return {
        "video_path": str(video_path),
        "thumbnail_path": str(thumbnail_path),
        "script": script,
        "audio_duration": audio_duration,
    }


# ── Entry point ─────────────────────────────────────────────────────

def run(page, audit, url=None):
    """Synchronous entry point."""
    return asyncio.run(produce_video(page, audit, url))
