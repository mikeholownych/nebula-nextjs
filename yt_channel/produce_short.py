"""Produce a YouTube Short (vertical 1080x1920, ~35s) from audit data.

Pipeline: short_script → TTS → Pillow vertical cards → ffmpeg → mp4
"""

import asyncio, subprocess, shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from . import config
from .short_gen import generate_short_script

# ── Dimensions ──────────────────────────────────────────────────────
SW, SH = 1080, 1920   # Shorts: 9:16 vertical

# ── Colour palette (dark Nebula theme) ──────────────────────────────
BG      = (15, 23, 42)
BG_CARD = (30, 41, 59)
WHITE   = (248, 250, 252)
GREEN   = (5, 150, 105)
RED     = (220, 38, 38)
YELLOW  = (217, 119, 6)
MUTED   = (148, 163, 184)
DIM_C   = (71, 85, 105)
ACCENT  = (52, 211, 153)


def _score_colour(s):
    if s < 4: return RED
    if s < 6.5: return YELLOW
    return GREEN


def _load_fonts():
    base = "/usr/share/fonts/truetype/dejavu/DejaVuSans"
    try:
        return {
            "xl":    ImageFont.truetype(f"{base}-Bold.ttf", 72),
            "lg":    ImageFont.truetype(f"{base}-Bold.ttf", 52),
            "md":    ImageFont.truetype(f"{base}.ttf", 38),
            "sm":    ImageFont.truetype(f"{base}.ttf", 28),
            "xs":    ImageFont.truetype(f"{base}.ttf", 22),
        }
    except Exception:
        f = ImageFont.load_default()
        return {k: f for k in ("xl", "lg", "md", "sm", "xs")}


def _wrap(text, font, max_width, draw):
    words = text.split()
    lines, line = [], ""
    for w in words:
        test = f"{line} {w}".strip()
        if draw.textlength(test, font=font) > max_width:
            if line:
                lines.append(line)
            line = w
        else:
            line = test
    if line:
        lines.append(line)
    return lines


def _draw_wrapped(draw, text, font, x, y, max_width, fill, line_spacing=12):
    lines = _wrap(text, font, max_width, draw)
    for line in lines:
        draw.text((x, y), line, fill=fill, font=font)
        bbox = font.getbbox(line)
        y += (bbox[3] - bbox[1]) + line_spacing
    return y


# ── Card generators ─────────────────────────────────────────────────

def make_hook_card(hook_text, overall, domain):
    img = Image.new("RGB", (SW, SH), BG)
    d = ImageDraw.Draw(img)
    f = _load_fonts()

    # Top accent bar
    d.rectangle([0, 0, SW, 8], fill=ACCENT)

    # Channel badge
    d.text((SW // 2, 100), "NEBULA AUDITS", fill=ACCENT, font=f["sm"], anchor="mm")

    # Big hook text (centred, wrapped)
    words = hook_text.split()
    # Split into 2 lines max for visual punch
    mid = len(words) // 2
    line1 = " ".join(words[:mid])
    line2 = " ".join(words[mid:])

    d.text((SW // 2, SH // 2 - 80), line1, fill=WHITE, font=f["lg"], anchor="mm")
    d.text((SW // 2, SH // 2 + 10), line2, fill=WHITE, font=f["lg"], anchor="mm")

    # Domain hint
    d.text((SW // 2, SH // 2 + 120), domain, fill=MUTED, font=f["sm"], anchor="mm")

    # Bottom bar
    d.rectangle([0, SH - 8, SW, SH], fill=ACCENT)
    return img


def make_score_card_short(domain, overall, grade):
    img = Image.new("RGB", (SW, SH), BG)
    d = ImageDraw.Draw(img)
    f = _load_fonts()

    d.rectangle([0, 0, SW, 8], fill=ACCENT)
    d.text((SW // 2, 160), "LANDING PAGE AUDIT", fill=MUTED, font=f["xs"], anchor="mm")
    d.text((SW // 2, 240), domain, fill=WHITE, font=f["md"], anchor="mm")

    # Big score
    colour = _score_colour(overall)
    cy = SH // 2
    r = 160
    d.ellipse([SW // 2 - r, cy - r, SW // 2 + r, cy + r], outline=colour, width=8)
    d.text((SW // 2, cy - 20), f"{overall:.0f}", fill=colour, font=f["xl"], anchor="mm")
    d.text((SW // 2, cy + 90), f"/ 10  Grade {grade}", fill=MUTED, font=f["md"], anchor="mm")

    d.rectangle([0, SH - 8, SW, SH], fill=colour)
    return img


def make_problem_card(worst_label, worst_score, problem_text):
    img = Image.new("RGB", (SW, SH), BG_CARD)
    d = ImageDraw.Draw(img)
    f = _load_fonts()
    colour = _score_colour(worst_score)

    d.rectangle([0, 0, SW, 8], fill=RED)
    d.text((SW // 2, 120), "BIGGEST PROBLEM", fill=RED, font=f["sm"], anchor="mm")
    d.text((SW // 2, 210), worst_label.upper(), fill=WHITE, font=f["lg"], anchor="mm")

    # Score badge
    cx, cy = SW // 2, 370
    r = 80
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=colour, width=6)
    d.text((cx, cy), f"{worst_score:.0f}", fill=colour, font=f["xl"], anchor="mm")
    d.text((cx, cy + 95), "/ 10", fill=MUTED, font=f["sm"], anchor="mm")

    # Problem text
    y = 520
    margin = 60
    _draw_wrapped(d, problem_text, f["sm"], margin, y, SW - margin * 2, MUTED, line_spacing=14)

    d.rectangle([0, SH - 8, SW, SH], fill=RED)
    return img


def make_fix_card(worst_label, fix_text):
    img = Image.new("RGB", (SW, SH), BG)
    d = ImageDraw.Draw(img)
    f = _load_fonts()

    d.rectangle([0, 0, SW, 8], fill=GREEN)
    d.text((SW // 2, 120), "THE FIX", fill=GREEN, font=f["sm"], anchor="mm")
    d.text((SW // 2, 210), worst_label.upper(), fill=WHITE, font=f["lg"], anchor="mm")

    # Arrow icon area
    d.text((SW // 2, 340), "→", fill=ACCENT, font=f["xl"], anchor="mm")

    # Fix text
    y = 460
    margin = 60
    _draw_wrapped(d, fix_text, f["md"], margin, y, SW - margin * 2, WHITE, line_spacing=16)

    d.rectangle([0, SH - 8, SW, SH], fill=GREEN)
    return img


def make_cta_card():
    img = Image.new("RGB", (SW, SH), BG)
    d = ImageDraw.Draw(img)
    f = _load_fonts()

    d.rectangle([0, 0, SW, 8], fill=ACCENT)

    d.text((SW // 2, 300), "FREE AUDIT", fill=ACCENT, font=f["xl"], anchor="mm")
    d.text((SW // 2, 420), "of YOUR site", fill=WHITE, font=f["lg"], anchor="mm")

    # URL box
    box_y = 560
    box_h = 100
    d.rounded_rectangle([80, box_y, SW - 80, box_y + box_h], radius=12, fill=BG_CARD)
    d.text((SW // 2, box_y + box_h // 2), "nebulacomponents.shop", fill=ACCENT, font=f["md"], anchor="mm")

    d.text((SW // 2, 740), "No call · No credit card", fill=MUTED, font=f["sm"], anchor="mm")
    d.text((SW // 2, 800), "Instant results", fill=MUTED, font=f["sm"], anchor="mm")

    # Nebula badge
    d.text((SW // 2, SH - 100), "NEBULA AUDITS", fill=DIM_C, font=f["xs"], anchor="mm")
    d.rectangle([0, SH - 8, SW, SH], fill=ACCENT)
    return img


# ── TTS ─────────────────────────────────────────────────────────────

async def _tts(text, output_path):
    import edge_tts
    communicate = edge_tts.Communicate(text, voice="en-US-AriaNeural", rate="+15%")
    await communicate.save(str(output_path))


# ── Main pipeline ────────────────────────────────────────────────────

async def produce_short(page, audit, url=None):
    """Produce a vertical Short MP4.

    Returns {"video_path": str, "script": dict}
    """
    script = generate_short_script(page, audit, url)
    domain = script["domain"]
    overall = script["overall_score"]
    grade = audit.get("overall_grade", "?")
    worst = script["worst_dimension"]
    worst_label = script["worst_label"]
    worst_score = script["worst_score"]

    job_id = f"{domain.replace('.', '_')}_short"
    job_dir = config.TMP_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    frames_dir = job_dir / "frames"
    frames_dir.mkdir(exist_ok=True)

    # 1. Build frames per segment
    card_map = {
        "hook_card":    lambda: make_hook_card(script["segments"][0]["text"], overall, domain),
        "score_card":   lambda: make_score_card_short(domain, overall, grade),
        "problem_card": lambda: make_problem_card(worst_label, worst_score,
                                                   script["segments"][2]["text"]),
        "fix_card":     lambda: make_fix_card(worst_label, script["segments"][3]["text"]),
        "cta_card":     lambda: make_cta_card(),
    }

    frames = []
    for i, seg in enumerate(script["segments"]):
        visual = seg["visual"]
        maker = card_map.get(visual)
        img = maker() if maker else make_hook_card(seg["text"], overall, domain)
        path = frames_dir / f"frame_{i:04d}.png"
        img.save(path)
        frames.append(path)

    # 2. TTS
    narration = " ".join(s["text"] for s in script["segments"])
    audio_path = job_dir / "voiceover.mp3"
    await _tts(narration, audio_path)

    # 3. Probe audio duration
    probe = subprocess.run([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(audio_path)
    ], capture_output=True, text=True)
    audio_dur = float(probe.stdout.strip()) if probe.stdout.strip() else script["total_duration"]

    # 4. Concat manifest
    total_seg = script["total_duration"]
    concat_path = job_dir / "concat.txt"
    with open(concat_path, "w") as f:
        for i, seg in enumerate(script["segments"]):
            dur = (seg["end"] - seg["start"]) * (audio_dur / max(total_seg, 1))
            f.write(f"file '{frames[i]}'\n")
            f.write(f"duration {dur:.3f}\n")
        f.write(f"file '{frames[-1]}'\n")

    # 5. ffmpeg — vertical 1080x1920
    video_path = config.VIDEO_DIR / f"{job_id}.mp4"
    subprocess.run([
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0", "-i", str(concat_path),
        "-i", str(audio_path),
        "-vf", f"scale={SW}:{SH}:force_original_aspect_ratio=decrease,"
               f"pad={SW}:{SH}:(ow-iw)/2:(oh-ih)/2:color={BG[0]:02x}{BG[1]:02x}{BG[2]:02x}",
        "-c:v", "libx264", "-preset", "medium", "-crf", "23",
        "-c:a", "aac", "-b:a", "128k",
        "-pix_fmt", "yuv420p",
        "-shortest",
        str(video_path)
    ], check=True, capture_output=True)

    shutil.rmtree(job_dir, ignore_errors=True)

    return {
        "video_path": str(video_path),
        "script": script,
        "audio_duration": audio_dur,
    }


def run(page, audit, url=None):
    """Synchronous entry point."""
    return asyncio.run(produce_short(page, audit, url))
