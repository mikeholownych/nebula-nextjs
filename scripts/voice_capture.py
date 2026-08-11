#!/usr/bin/env python3
"""Voice capture layer - the "Wispr Flow" analog from Simon Høiberg's
one-person SaaS AI stack (v-AkmjJNxZo).

Turns spoken ideas (voice memos, phone recordings, meeting captures) into
clean text notes appended to a dated capture file, so Mike can dump ideas
by voice and Hermes/workflows can pick them up later.

Server is headless (no microphone), so this is a FILE-DROP design:
record on any device, drop the audio file anywhere, run:

    python3 scripts/voice_capture.py ~/Dropbox/voice/idea-2026-08-09.m4a

Provider cascade (first available wins):
  1. OpenAI-compatible Whisper (OPENAI_API_KEY / VOICE_TOOLS_OPENAI_KEY)
     - uses the configured STT_OPENAI_MODEL (default whisper-1)
  2. local faster-whisper (pip install faster-whisper) - no API key
  3. fail-closed with a clear install/key message (never silently pass)

Fail-closed: non-zero exit on any failure, nothing partial written.
"""
from __future__ import annotations

import argparse
import datetime as dt
import os
import subprocess
import sys
from pathlib import Path

# Capture file default: ~/inbox/voice-notes.md (created on first use).
DEFAULT_NOTES = Path.home() / "inbox" / "voice-notes.md"

AUDIO_EXTS = {".mp3", ".wav", ".m4a", ".ogg", ".webm", ".flac", ".aac", ".opus"}

# Load keys from ~/.hermes/.env if not already in the environment.
def _load_env() -> None:
    env_path = Path.home() / ".hermes" / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip()
        if key in ("OPENAI_API_KEY", "VOICE_TOOLS_OPENAI_KEY", "OPENAI_BASE_URL") and val and key not in os.environ:
            os.environ[key] = val


def _transcribe_openai(audio: Path) -> str:
    import openai

    model = os.environ.get("STT_OPENAI_MODEL", "whisper-1")
    client = openai.OpenAI(
        api_key=os.environ.get("VOICE_TOOLS_OPENAI_KEY") or os.environ.get("OPENAI_API_KEY"),
        base_url=os.environ.get("OPENAI_BASE_URL") or None,
    )
    with open(audio, "rb") as f:
        resp = client.audio.transcriptions.create(model=model, file=f)
    text = (resp.text or "").strip()
    if not text:
        raise RuntimeError("Whisper returned empty transcript")
    return text


def _transcribe_local(audio: Path) -> str:
    from faster_whisper import WhisperModel

    model = WhisperModel("base", device="cpu", compute_type="int8")
    segments, _ = model.transcribe(str(audio))
    text = " ".join(seg.text.strip() for seg in segments).strip()
    if not text:
        raise RuntimeError("faster-whisper returned empty transcript")
    return text


def transcribe(audio: Path) -> str:
    """Run the provider cascade. Raises RuntimeError with actionable message."""
    key = os.environ.get("VOICE_TOOLS_OPENAI_KEY") or os.environ.get("OPENAI_API_KEY")
    if key:
        return _transcribe_openai(audio)

    try:
        import faster_whisper  # noqa: F401
        return _transcribe_local(audio)
    except ImportError:
        pass

    raise RuntimeError(
        "No transcription backend available.\n"
        "  Option A (cloud): set OPENAI_API_KEY or VOICE_TOOLS_OPENAI_KEY in ~/.hermes/.env\n"
        "  Option B (local): pip install faster-whisper  (no API key needed)"
    )


def append_note(notes: Path, audio_name: str, text: str, dry_run: bool) -> Path:
    now = dt.datetime.now(dt.timezone.utc)
    stamp = now.strftime("%Y-%m-%d %H:%M UTC")
    entry = (
        f"\n## {stamp} - voice note ({audio_name})\n\n"
        f"{text.strip()}\n"
    )
    if dry_run:
        print(f"[dry-run] would append to {notes}")
        print(entry)
        return notes
    notes.parent.mkdir(parents=True, exist_ok=True)
    with open(notes, "a", encoding="utf-8") as f:
        f.write(entry)
    return notes


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("audio", nargs="+", help="audio file(s) to transcribe")
    parser.add_argument("--notes", default=str(DEFAULT_NOTES),
                        help=f"capture file to append to (default {DEFAULT_NOTES})")
    parser.add_argument("--dry-run", action="store_true",
                        help="print what would be appended, write nothing")
    args = parser.parse_args()

    _load_env()

    notes = Path(args.notes).expanduser()
    ok, failed = 0, 0
    for raw in args.audio:
        audio = Path(raw).expanduser()
        if not audio.exists():
            print(f"✗ {raw}: file not found", file=sys.stderr)
            failed += 1
            continue
        if audio.suffix.lower() not in AUDIO_EXTS:
            print(f"✗ {raw}: unsupported audio type {audio.suffix} (want {sorted(AUDIO_EXTS)})", file=sys.stderr)
            failed += 1
            continue
        try:
            text = transcribe(audio)
        except Exception as e:
            print(f"✗ {raw}: {e}", file=sys.stderr)
            failed += 1
            continue
        try:
            append_note(notes, audio.name, text, args.dry_run)
            print(f"✓ {raw} → {notes} ({len(text)} chars)")
            ok += 1
        except Exception as e:
            print(f"✗ {raw}: {e}", file=sys.stderr)
            failed += 1

    if failed:
        print(f"voice_capture: {ok} ok, {failed} failed", file=sys.stderr)
        return 1
    print(f"voice_capture: {ok} note(s) captured")
    return 0


if __name__ == "__main__":
    sys.exit(main())
