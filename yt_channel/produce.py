"""Produce a YouTube video from audit data.

Pipeline: script → TTS audio + visual cards → ffmpeg assembly → thumbnail.
"""

import json, asyncio, subprocess, textwrap, math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from . import config
from .script_gen import generate_script, DIM_LABELS
from .screenshot import prepare_bg as _prepare_bg
from .screenshot import capture_page

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


def _panel(d, x, y, w, h, border=ACCENT, radius=24):
    """Solid contrast panel so text is readable over any background."""
    d.rounded_rectangle([x, y, x + w, y + h], radius=radius,
                        fill=BG, outline=border, width=2)


def make_intro_card(domain, overall, grade, bg=None):
    """Channel intro frame."""
    img = _prepare_bg(bg, W, H) or Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    _panel(d, 70, 60, 1140, 600)
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
    # Grade line BELOW the circle (not overlapping its bottom stroke)
    d.text((cx, cy+75), f"/10 · Grade {grade}", fill=MUTED, font=label_font, anchor="mm")
    return img


def make_score_card(overall, grade, band, dim_count, bg=None):
    """Overall score summary frame."""
    img = _prepare_bg(bg, W, H) or Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    _panel(d, 70, 60, 1140, 600)
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


def make_dim_card(dim_key, label, score, issue, fix, bg=None):
    """Single dimension breakdown frame."""
    img = _prepare_bg(bg, W, H) or Image.new("RGB", (W, H), BG_CARD)
    d = ImageDraw.Draw(img)
    _panel(d, 70, 60, 1140, 600, border=_score_colour(score))
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


def _dashed_rect(d, box, dash=16, gap=12, width=2, fill=None, outline=None):
    """Draw a dashed rectangle outline (PIL has no native dash)."""
    x0, y0, x1, y1 = box
    segments = []
    def _dash(p0, p1):
        length = max(abs(p1[0] - p0[0]) + abs(p1[1] - p0[1]), 1)
        pos, step = 0.0, dash + gap
        while pos < length:
            seg_end = min(pos + dash, length)
            t0, t1 = pos / length, seg_end / length
            segments.append((
                (p0[0] + (p1[0] - p0[0]) * t0, p0[1] + (p1[1] - p0[1]) * t0),
                (p0[0] + (p1[0] - p0[0]) * t1, p0[1] + (p1[1] - p0[1]) * t1),
            ))
            pos += step
    _dash((x0, y0), (x1, y0))
    _dash((x1, y0), (x1, y1))
    _dash((x1, y1), (x0, y1))
    _dash((x0, y1), (x0, y0))
    for p0, p1 in segments:
        d.line([p0, p1], fill=outline or ACCENT, width=width)


def make_outro_card(domain, bg=None):
    """End-screen template (blueprint Phase 4 'Interactive Outro').

    The bottom corners are RESERVED EMPTY ZONES for YouTube's end-screen
    elements (subscribe + next-video). End screens cannot be set via the
    Data API — a human drops the elements into these zones in Studio.
    The zones are drawn as dashed placeholders so the safe area is
    obvious during manual setup; they read as 'empty on purpose'.
    """
    img = _prepare_bg(bg, W, H) or Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    _panel(d, 70, 60, 1140, 600)
    try:
        big = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36)
        body = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 26)
        small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
    except:
        big = body = small = ImageFont.load_default()

    d.text((W//2, 170), "Get Your Free Audit", fill=ACCENT, font=big, anchor="mm")
    d.text((W//2, 240), "nebulacomponents.com/audit", fill=WHITE, font=body, anchor="mm")
    d.text((W//2, 310), "No call · No credit card · Instant results", fill=MUTED, font=small, anchor="mm")

    d.text((W//2, 410), "DIY Fix Kit: nebulacomponents.com/checkout", fill=DIM, font=small, anchor="mm")
    d.text((W//2, 450), "$97 Done-For-You Fix Pack available", fill=DIM, font=small, anchor="mm")

    # Reserved end-screen zones (YouTube safe area, bottom corners)
    z_w, z_h, z_y = 330, 190, 540
    _dashed_rect(d, (80, z_y, 80 + z_w, z_y + z_h), outline=DIM)
    d.text((80 + z_w // 2, z_y + z_h // 2), "END SCREEN\nSUBSCRIBE", fill=DIM, font=small, anchor="mm")
    _dashed_rect(d, (W - 80 - z_w, z_y, W - 80, z_y + z_h), outline=DIM)
    d.text((W - 80 - z_w // 2, z_y + z_h // 2), "END SCREEN\nNEXT VIDEO", fill=DIM, font=small, anchor="mm")

    d.text((W//2, 636), "Nebula Components — Autonomous Conversion Engineering", fill=DIM, font=small, anchor="mm")
    return img


def make_sting_card(bg=None):
    """Brand sting (blueprint Phase 4 'The 3-Second Rule').

    A static, standardized logo flash shown between the hook and the
    body (the 'content gap' — never before the hook). Short, silent
    (the whoosh is mixed by the audio engine), and identical on every
    video to build brand equity.
    """
    img = _prepare_bg(bg, W, H) or Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    try:
        big = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 76)
        sub = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 30)
        small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 22)
    except:
        big = sub = small = ImageFont.load_default()

    # Logo lockup on a clean panel
    _panel(d, 240, 220, 800, 280, border=DIM)
    d.text((W//2, 300), "NEBULA AUDITS", fill=ACCENT, font=big, anchor="mm")
    d.text((W//2, 380), "Real audits. Real scores. No fluff.", fill=MUTED, font=sub, anchor="mm")
    d.text((W//2, 560), "THE VERDICT", fill=DIM, font=small, anchor="mm")
    return img


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
    # Try to capture the real page as a background (fallback: flat colour)
    from yt_channel.screenshot import capture_page_async
    bg = await capture_page_async(url) if url else None

    frames = []
    for i, seg in enumerate(script["segments"]):
        dim_key = seg["dimension"]
        visual_type = seg["visual"]

        if visual_type == "intro_card":
            img = make_intro_card(domain, overall, grade, bg)
        elif visual_type == "score_card":
            band = "critical" if overall < 4 else "needs work" if overall < 6.5 else "decent" if overall < 8 else "strong"
            img = make_score_card(overall, grade, band, len(dims), bg)
        elif visual_type == "outro_card":
            img = make_outro_card(domain, bg)
        elif visual_type.startswith("dimension_") and dim_key:
            label = DIM_LABELS.get(dim_key, dim_key.replace("_", " ").title())
            data = dims.get(dim_key, {})
            img = make_dim_card(
                dim_key, label,
                data.get("score", 5),
                data.get("issue", ""),
                data.get("fix", ""),
                bg,
            )
        else:
            # Fallback to intro-style
            img = make_intro_card(domain, overall, grade, bg)

        frame_path = frames_dir / f"frame_{i:04d}.png"
        img.save(frame_path)
        frames.append(frame_path)

    # Brand sting (blueprint Phase 4): logo flash over the hook→body
    # transition, never before the hook. Inserted as its own 2s frame +
    # a 2s silent window in the narration (audio engine adds the whoosh).
    use_sting = len(script["segments"]) >= 2
    if use_sting:
        sting_img = make_sting_card(bg)
        sting_path = frames_dir / "sting.png"
        sting_img.save(sting_path)
        frames.insert(1, sting_path)

    # 2. Sonic Foundation — per-segment TTS with deterministic pitch
    #    micro-variation, leading/trailing silence trim, controlled
    #    pacing gaps (<= 0.2s), transition whoosh SFX layer, and -14 LUFS
    #    loudness normalization (see audio_engine.py).
    from yt_channel.audio_engine import (
        tts_segment, trim_silence, build_narration, build_sfx_track,
        finalize, PITCH_CYCLE, GAP_S, STING_GAP_S, SFX_LEVEL_DB,
        STING_SFX_DB, RATE_LONG,
    )
    segs = script["segments"]
    n = len(segs)
    clips_dir = job_dir / "audio"
    clips_dir.mkdir(exist_ok=True)

    clip_wavs, dur_actual = [], []
    for i, seg in enumerate(segs):
        pitch = PITCH_CYCLE[i % len(PITCH_CYCLE)]
        raw = clips_dir / f"seg_{i:02d}.mp3"
        wav = clips_dir / f"seg_{i:02d}.wav"
        await tts_segment(seg["text"], raw, pitch_hz=pitch, rate=RATE_LONG)
        dur_actual.append(trim_silence(raw, wav))
        clip_wavs.append(wav)

    # gaps[i] = silence AFTER clip i; the sting window is the hook's gap.
    gaps = [GAP_S] * n
    gaps[-1] = 0.0
    if use_sting:
        gaps[0] = STING_GAP_S

    narration_wav = job_dir / "narration.wav"
    build_narration(clip_wavs, gaps, narration_wav)

    # Video timeline: [hook (dur0), sting (2.0), seg1 (dur1+gap), ...]
    durations = []
    offsets = []          # (timestamp, gain_db) whoosh events
    cursor = 0.0
    for i in range(n):
        if use_sting and i == 0:
            durations.append(dur_actual[i])
            cursor += dur_actual[i]
            offsets.append((cursor, STING_SFX_DB))       # hook → sting
            durations.append(STING_GAP_S)
            cursor += STING_GAP_S
            offsets.append((cursor, SFX_LEVEL_DB))       # sting → body
        else:
            d_seg = dur_actual[i] + (gaps[i] if i < n - 1 else 0.0)
            durations.append(d_seg)
            if i < n - 1:
                cursor += d_seg
                offsets.append((cursor, SFX_LEVEL_DB))   # body transitions
            else:
                cursor += d_seg

    sfx_wav = build_sfx_track(offsets, cursor, job_dir / "sfx.wav")
    audio_path = job_dir / "voiceover.wav"
    audio_duration = finalize(narration_wav, sfx_wav, audio_path)

    # 4/5. Motion assembly — Ken Burns per segment + fades, then mux audio
    from yt_channel.motion import assemble_motion_video
    video_path = config.VIDEO_DIR / f"{job_id}.mp4"
    assemble_motion_video(
        frames, durations, audio_path, video_path, W, H,
    )

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
