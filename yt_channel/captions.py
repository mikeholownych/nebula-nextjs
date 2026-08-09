"""
captions.py — Word-level animated karaoke captions.

Pipeline:
  1. Run faster-whisper on the final mixed audio to get word timestamps
  2. Generate an ASS (Advanced SubStation Alpha) subtitle file
     with karaoke-style word highlighting in Nebula teal
  3. Burn into the video via ffmpeg subtitles filter (libass)

Style:
  - Font: Arial Bold 52px (scales down for Shorts: 42px)
  - Position: bottom third (Alignment=2 = bottom-center in ASS)
  - Normal words: white with black outline
  - Active (spoken) word: Nebula teal (#00C2A0) with glow
  - Max 6 words per line; line breaks at natural pauses
  - Fade-in 80ms per word (feels snappy, not sluggish)

Usage:
    ass_path = generate_captions(audio_path, ass_path, is_short=False)
    burn_captions(video_path, ass_path, output_path, is_short=False)
"""

import re
import subprocess
from pathlib import Path
from typing import Optional

# ── Style constants ──────────────────────────────────────────────────
FONT_NAME = "Arial"
FONT_SIZE_LONG = 52
FONT_SIZE_SHORT = 42
TEXT_COLOR = "&H00FFFFFF"          # white (ASS BGR format)
OUTLINE_COLOR = "&H00000000"       # black outline
HIGHLIGHT_COLOR = "&H00A0C200"     # Nebula teal in ASS BGR (&HBBGGRR)
OUTLINE_SIZE = 3
SHADOW_SIZE = 1
MAX_WORDS_PER_LINE = 6
FADE_MS = 80                        # per-word fade-in duration


def _ass_time(seconds: float) -> str:
    """Convert seconds to ASS timestamp h:mm:ss.cs"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    cs = int((seconds % 1) * 100)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def _wrap_words(words: list[dict], max_per_line: int = MAX_WORDS_PER_LINE) -> list[list[dict]]:
    """Split word list into display lines of max_per_line words."""
    lines = []
    for i in range(0, len(words), max_per_line):
        lines.append(words[i:i + max_per_line])
    return lines


def generate_captions(audio_path, ass_path, is_short: bool = False) -> Optional[Path]:
    """
    Run faster-whisper on audio_path, build an ASS subtitle file at ass_path.
    Returns ass_path on success, None on failure (non-fatal).
    """
    audio_path = Path(audio_path)
    ass_path = Path(ass_path)

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print("[captions] faster_whisper not installed — skipping captions")
        return None

    try:
        # Use base model (fast, accurate enough for clear TTS audio)
        model = WhisperModel("base", device="cpu", compute_type="int8")
        segments, info = model.transcribe(
            str(audio_path),
            word_timestamps=True,
            language="en",
            beam_size=5,
            vad_filter=True,        # skip silence — cleaner word boundaries
        )

        # Collect all words with timestamps
        all_words: list[dict] = []
        for seg in segments:
            if seg.words:
                for w in seg.words:
                    all_words.append({
                        "word": w.word.strip(),
                        "start": w.start,
                        "end": w.end,
                    })

        if not all_words:
            print("[captions] No words detected — skipping")
            return None

        _write_ass(all_words, ass_path, is_short=is_short)
        return ass_path

    except Exception as e:
        print(f"[captions] Whisper failed: {e}")
        return None


def _write_ass(words: list[dict], ass_path: Path, is_short: bool = False) -> None:
    """Write ASS subtitle file with karaoke word highlighting."""
    font_size = FONT_SIZE_SHORT if is_short else FONT_SIZE_LONG

    # ASS header
    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: {1920 if is_short else 720}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{FONT_NAME},{font_size},{TEXT_COLOR},{HIGHLIGHT_COLOR},{OUTLINE_COLOR},&H80000000,-1,0,0,0,100,100,0,0,1,{OUTLINE_SIZE},{SHADOW_SIZE},2,80,80,60,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    lines_out = [header]

    # Group words into display lines
    line_groups = _wrap_words(words)

    for group in line_groups:
        if not group:
            continue

        line_start = group[0]["start"]
        line_end = group[-1]["end"] + 0.1  # small tail

        # Build karaoke text: {\\k<duration_cs>}word for each word
        # \\k = fill highlight advancing left-to-right per word
        parts = []
        for i, w in enumerate(group):
            dur_cs = max(1, int((w["end"] - w["start"]) * 100))
            # Add space before word (except first)
            if i > 0:
                parts.append(f"{{\\k{dur_cs}}} {w['word']}")
            else:
                parts.append(f"{{\\k{dur_cs}}}{w['word']}")

        text = "".join(parts)

        # Add fade-in tag for the whole line
        text = f"{{\\fad({FADE_MS},0)}}{text}"

        lines_out.append(
            f"Dialogue: 0,{_ass_time(line_start)},{_ass_time(line_end)},"
            f"Default,,0,0,0,,{text}"
        )

    ass_path.write_text("".join(lines_out), encoding="utf-8")


def burn_captions(video_path, ass_path, output_path, is_short: bool = False) -> Path:
    """
    Burn ASS captions into the video using ffmpeg subtitles filter.
    Returns output_path.
    """
    video_path = Path(video_path)
    ass_path = Path(ass_path)
    output_path = Path(output_path)

    # Escape path for ffmpeg filter (colons need escaping on Linux)
    escaped = str(ass_path).replace("\\", "\\\\").replace(":", "\\:")

    subprocess.run([
        "ffmpeg", "-y",
        "-i", str(video_path),
        "-vf", f"subtitles={escaped}",
        "-c:v", "libx264", "-crf", "18", "-preset", "fast",
        "-c:a", "copy",
        str(output_path),
    ], check=True, capture_output=True)

    return output_path
