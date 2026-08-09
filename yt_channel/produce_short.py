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


from yt_channel.screenshot import prepare_bg as _prepare_bg


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

def _panel(d, x, y, w, h, border=ACCENT, radius=28):
    """Solid contrast panel so text is readable over any background."""
    d.rounded_rectangle([x, y, x + w, y + h], radius=radius,
                        fill=BG, outline=border, width=3)


def make_hook_card(hook_text, overall, domain, bg=None):
    img = _prepare_bg(bg, SW, SH) or Image.new("RGB", (SW, SH), BG)
    d = ImageDraw.Draw(img)
    f = _load_fonts()

    # Top accent bar
    d.rectangle([0, 0, SW, 8], fill=ACCENT)

    # Hook text — width-wrapped, font drops if long
    margin = 90
    max_width = SW - margin * 2
    font = f["lg"]
    lines = _wrap(hook_text, font, max_width, d)
    if len(lines) > 3:
        font = f["md"]
        lines = _wrap(hook_text, font, max_width, d)
    line_h = 64 if font is f["lg"] else 46
    block_h = len(lines) * line_h

    # Contrast panel around the whole message
    panel_w = SW - 140
    panel_h = block_h + 190
    px = (SW - panel_w) // 2
    py = SH // 2 - panel_h // 2
    _panel(d, px, py, panel_w, panel_h)

    d.text((SW // 2, py + 55), "NEBULA AUDITS", fill=ACCENT, font=f["sm"], anchor="mm")
    y0 = py + 55 + 48
    for i, line in enumerate(lines):
        d.text((SW // 2, y0 + i * line_h + line_h // 2), line,
               fill=WHITE, font=font, anchor="mm")
    d.text((SW // 2, py + panel_h - 55), domain, fill=MUTED, font=f["sm"], anchor="mm")

    # Bottom bar
    d.rectangle([0, SH - 8, SW, SH], fill=ACCENT)
    return img


def make_score_card_short(domain, overall, grade, bg=None):
    img = _prepare_bg(bg, SW, SH) or Image.new("RGB", (SW, SH), BG)
    d = ImageDraw.Draw(img)
    f = _load_fonts()

    d.rectangle([0, 0, SW, 8], fill=ACCENT)

    # Contrast panel holding the score presentation
    panel_w = 920
    panel_h = 980
    px = (SW - panel_w) // 2
    py = 150
    _panel(d, px, py, panel_w, panel_h)

    d.text((SW // 2, py + 70), "LANDING PAGE AUDIT", fill=MUTED, font=f["xs"], anchor="mm")
    # Domain — shrink font if too wide for safe margins
    dom_font = f["md"] if d.textlength(domain, font=f["md"]) < panel_w - 140 else f["sm"]
    d.text((SW // 2, py + 160), domain, fill=WHITE, font=dom_font, anchor="mm")

    # Big score
    colour = _score_colour(overall)
    cy = py + 500
    r = 160
    d.ellipse([SW // 2 - r, cy - r, SW // 2 + r, cy + r], outline=colour, width=8)
    d.text((SW // 2, cy - 20), f"{overall:.0f}", fill=colour, font=f["xl"], anchor="mm")
    # Grade line BELOW the circle (circle bottom edge = cy+160)
    d.text((SW // 2, cy + 185), f"/ 10  Grade {grade}", fill=MUTED, font=f["sm"], anchor="mm")

    d.rectangle([0, SH - 8, SW, SH], fill=colour)
    return img


def make_problem_card(worst_label, worst_score, problem_text, bg=None):
    img = _prepare_bg(bg, SW, SH) or Image.new("RGB", (SW, SH), BG_CARD)
    d = ImageDraw.Draw(img)
    f = _load_fonts()
    colour = _score_colour(worst_score)

    d.rectangle([0, 0, SW, 8], fill=RED)

    # Contrast panel
    panel_w = 920
    panel_h = 900
    px = (SW - panel_w) // 2
    py = 150
    _panel(d, px, py, panel_w, panel_h, border=RED)

    d.text((SW // 2, py + 70), "BIGGEST PROBLEM", fill=RED, font=f["sm"], anchor="mm")
    # Label — shrink font if too wide for safe margins
    label = worst_label.upper()
    lf = f["lg"] if d.textlength(label, font=f["lg"]) < panel_w - 140 else f["md"]
    d.text((SW // 2, py + 170), label, fill=WHITE, font=lf, anchor="mm")

    # Score badge
    cx, cy = SW // 2, py + 380
    r = 80
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=colour, width=6)
    d.text((cx, cy), f"{worst_score:.0f}", fill=colour, font=f["xl"], anchor="mm")
    d.text((cx, cy + 95), "/ 10", fill=MUTED, font=f["sm"], anchor="mm")

    # Problem text
    y = py + 560
    margin = 90
    _draw_wrapped(d, problem_text, f["sm"], margin, y, panel_w - margin * 2, MUTED, line_spacing=14)

    d.rectangle([0, SH - 8, SW, SH], fill=RED)
    return img


def make_fix_card(worst_label, fix_text, bg=None):
    img = _prepare_bg(bg, SW, SH) or Image.new("RGB", (SW, SH), BG_CARD)
    d = ImageDraw.Draw(img)
    f = _load_fonts()

    d.rectangle([0, 0, SW, 8], fill=GREEN)

    # Contrast panel
    panel_w = 920
    panel_h = 820
    px = (SW - panel_w) // 2
    py = 160
    _panel(d, px, py, panel_w, panel_h, border=GREEN)

    d.text((SW // 2, py + 70), "THE FIX", fill=GREEN, font=f["sm"], anchor="mm")
    # Label — shrink font if too wide for safe margins
    label = worst_label.upper()
    lf = f["lg"] if d.textlength(label, font=f["lg"]) < panel_w - 140 else f["md"]
    d.text((SW // 2, py + 170), label, fill=WHITE, font=lf, anchor="mm")

    # Arrow icon area
    d.text((SW // 2, py + 280), "→", fill=ACCENT, font=f["xl"], anchor="mm")

    # Fix text
    y = py + 400
    margin = 90
    _draw_wrapped(d, fix_text, f["md"], margin, y, panel_w - margin * 2, WHITE, line_spacing=16)

    d.rectangle([0, SH - 8, SW, SH], fill=GREEN)
    return img


def make_reward_card(domain, overall, grade, bg=None):
    """The payoff moment (E'Calm retention psychology): the most rewarding
    reveal goes at the END so the viewer feels payoff, then cut immediately.
    Here: the audited domain's score as the 'reveal' — the thing the whole
    video has been building toward."""
    img = _prepare_bg(bg, SW, SH) or Image.new("RGB", (SW, SH), BG)
    d = ImageDraw.Draw(img)
    f = _load_fonts()
    colour = _score_colour(overall)

    d.rectangle([0, 0, SW, 8], fill=ACCENT)

    # Contrast panel — match score_card proportions (fuller, less dead space)
    panel_w = 920
    panel_h = 980
    px = (SW - panel_w) // 2
    py = 150
    _panel(d, px, py, panel_w, panel_h, border=colour)

    d.text((SW // 2, py + 70), "THE VERDICT", fill=colour, font=f["sm"], anchor="mm")
    d.text((SW // 2, py + 160), domain, fill=WHITE, font=f["md"], anchor="mm")

    # Big score — the payoff
    r = 150
    cy = py + 500
    d.ellipse([SW // 2 - r, cy - r, SW // 2 + r, cy + r], outline=colour, width=8)
    d.text((SW // 2, cy - 20), f"{overall:.0f}", fill=colour, font=f["xl"], anchor="mm")
    d.text((SW // 2, cy + 185), f"/ 10  Grade {grade}", fill=MUTED, font=f["sm"], anchor="mm")
    d.rectangle([0, SH - 8, SW, SH], fill=colour)
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
    d.text((SW // 2, box_y + box_h // 2), "nebulacomponents.com", fill=ACCENT, font=f["md"], anchor="mm")

    d.text((SW // 2, 740), "No call · No credit card", fill=MUTED, font=f["sm"], anchor="mm")
    d.text((SW // 2, 800), "Instant results", fill=MUTED, font=f["sm"], anchor="mm")

    # Nebula badge
    d.text((SW // 2, SH - 100), "NEBULA AUDITS", fill=DIM_C, font=f["xs"], anchor="mm")
    d.rectangle([0, SH - 8, SW, SH], fill=ACCENT)
    return img


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
    # Try to capture the real page as a background (fallback: flat colour)
    from yt_channel.screenshot import capture_page_async
    bg = await capture_page_async(url) if url else None

    card_map = {
        "hook_card":    lambda: make_hook_card(script["segments"][0]["text"], overall, domain, bg),
        "score_card":   lambda: make_score_card_short(domain, overall, grade, bg),
        "problem_card": lambda: make_problem_card(worst_label, worst_score,
                                                   script["segments"][2]["text"], bg),
        "fix_card":     lambda: make_fix_card(worst_label, script["segments"][3]["text"], bg),
        "reward_card":  lambda: make_reward_card(domain, overall, grade, bg),
        "cta_card":     lambda: make_cta_card(),
    }

    frames = []
    for i, seg in enumerate(script["segments"]):
        visual = seg["visual"]
        maker = card_map.get(visual)
        img = maker() if maker else make_hook_card(seg["text"], overall, domain, bg)
        path = frames_dir / f"frame_{i:04d}.png"
        img.save(path)
        frames.append(path)

    # 2. Sonic Foundation — per-segment TTS (pitch micro-variation),
    #    silence trim, pacing gaps, transition whooshes, -14 LUFS.
    from yt_channel.audio_engine import (
        tts_segment, trim_silence, build_narration, build_sfx_track,
        finalize, PITCH_CYCLE, GAP_S, SFX_LEVEL_DB, RATE_SHORT,
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
        await tts_segment(seg["text"], raw, pitch_hz=pitch, rate=RATE_SHORT)
        dur_actual.append(trim_silence(raw, wav))
        clip_wavs.append(wav)

    # Shorts have no brand sting — tight pacing gaps only.
    gaps = [GAP_S] * n
    gaps[-1] = 0.0
    narration_wav = job_dir / "narration.wav"
    build_narration(clip_wavs, gaps, narration_wav)

    durations = []
    offsets = []          # (timestamp, gain_db) whoosh events
    cursor = 0.0
    for i in range(n):
        d_seg = dur_actual[i] + (gaps[i] if i < n - 1 else 0.0)
        durations.append(d_seg)
        if i < n - 1:
            cursor += d_seg
            offsets.append((cursor, SFX_LEVEL_DB))
        else:
            cursor += d_seg

    sfx_wav = build_sfx_track(offsets, cursor, job_dir / "sfx.wav")
    audio_path = job_dir / "voiceover.wav"
    audio_dur = finalize(narration_wav, sfx_wav, audio_path)

    # 4. Motion assembly — Ken Burns per segment + fades, then mux audio
    from yt_channel.motion import assemble_motion_video
    video_path = config.VIDEO_DIR / f"{job_id}.mp4"
    assemble_motion_video(
        frames, durations, audio_path, video_path, SW, SH,
    )

    # 5. Burn animated word-level captions (Phase 2 — Shorts)
    from yt_channel.captions import generate_captions, burn_captions
    cap_tmp_dir = job_dir.parent / f"{job_id}_cap"
    cap_tmp_dir.mkdir(parents=True, exist_ok=True)
    ass_file = generate_captions(audio_path, cap_tmp_dir / f"{job_id}.ass",
                                 is_short=True)
    if ass_file:
        captioned_path = config.VIDEO_DIR / f"{job_id}_short_cap.mp4"
        try:
            burn_captions(video_path, ass_file, captioned_path, is_short=True)
            import os as _os
            _os.replace(str(captioned_path), str(video_path))
        except Exception as _cap_err:
            print(f"[produce_short] caption burn failed (non-fatal): {_cap_err}")
        finally:
            shutil.rmtree(str(cap_tmp_dir), ignore_errors=True)

    shutil.rmtree(job_dir, ignore_errors=True)

    return {
        "video_path": str(video_path),
        "script": script,
        "audio_duration": audio_dur,
    }


def run(page, audit, url=None):
    """Synchronous entry point."""
    return asyncio.run(produce_short(page, audit, url))
