"""Sonic Foundation — the audio engine of the production line.

Blueprint (professional automated video pipeline): "Audio accounts for
more than half of a viewer's perceived video quality. Professional
automation treats the audio track as the absolute anchor of the
project."

This module implements the audio-side deltas that a single-clip TTS
+ proportional-duration approach cannot:
  1. Per-segment TTS with deterministic pitch micro-variation so the
     voice sounds organic rather than robotic (Phase 2 "pacing realism").
  2. Dead-air elimination: leading/trailing silence trimmed from every
     segment clip (Phase 2 "dead-air elimination").
  3. Controlled inter-segment pacing gaps (<= 0.2s) — momentum stays
     tight, but speech never overlaps between cards.
  4. Transition whoosh SFX layer at every visual boundary, mixed at
     low volume to fake high production value (Phase 5 "audio
     triggers").
  5. Final loudness normalization to -14 LUFS (YouTube standard) so the
     narration dominates a consistent audio landscape (Phase 2
     "dynamic audio leveling").

Usage (async):
    await tts_segment(text, clip_mp3, pitch_hz=2)
    trim_silence(clip_mp3, clip_wav)
    build_narration([wavs], gaps, narration_wav)
    build_sfx_track(events, total_dur, sfx_wav)      # events may be []
    finalize(narration_wav, sfx_wav, out_wav)

All processing is done in 48 kHz mono WAV; the final mux re-encodes to
AAC (motion.assemble_motion_video already does -c:a aac).
"""
import subprocess
from pathlib import Path

# ── Tuning constants ────────────────────────────────────────────────
PITCH_CYCLE = [-2, 1, -1, 2, -3, 0, 2, -1, 1, -2]   # Hz, deterministic
GAP_S = 0.18                 # inter-segment pacing gap (blueprint: <= 0.2s)
STING_GAP_S = 2.0            # brand-sting window after the hook (long-form)
TRIM_THRESHOLD_DB = -45.0    # silence below this is dead air
TRIM_MIN_KEEP_S = 0.15       # guard: never destroy an almost-silent clip
SFX_LEVEL_DB = -28.0         # transition whooshes: subtle
STING_SFX_DB = -16.0         # brand sting whoosh: present but not loud
LOUDNESS_I = -14.0           # YouTube loudness target (LUFS)
SAMPLE_RATE = 48000

VOICE = "en-US-AriaNeural"
RATE_LONG = "+10%"
RATE_SHORT = "+15%"


def _run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True, capture_output=True)


def probe_duration(path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        capture_output=True, text=True,
    )
    try:
        return float(out.stdout.strip())
    except ValueError:
        return 0.0


async def tts_segment(text: str, out_path, pitch_hz: int = 0,
                      rate: str = RATE_LONG, voice: str = VOICE) -> Path:
    """Generate TTS for one segment with an optional pitch offset (Hz).

    pitch_hz follows PITCH_CYCLE per segment index — a small, same-
    speaker variation that reads as human prosody, never as different
    voices.
    """
    import edge_tts
    out_path = Path(out_path)
    # edge_tts pitch must be "+/-N Hz" format; omit param if no offset.
    kwargs = {"voice": voice, "rate": rate}
    if pitch_hz != 0:
        kwargs["pitch"] = f"{pitch_hz:+d}Hz"
    communicate = edge_tts.Communicate(text, **kwargs)
    await communicate.save(str(out_path))
    return out_path


def trim_silence(in_path, out_path) -> float:
    """Trim leading + trailing silence from a TTS clip. Returns duration.

    Uses silenceremove on both ends (areverse trick for the tail). If
    the trim would destroy the clip (guard), keep the original.
    """
    in_path, out_path = Path(in_path), Path(out_path)
    _run([
        "ffmpeg", "-y", "-i", str(in_path), "-af",
        (f"silenceremove=start_periods=1:start_threshold={TRIM_THRESHOLD_DB}dB"
         f":start_silence=0.01,areverse,"
         f"silenceremove=start_periods=1:start_threshold={TRIM_THRESHOLD_DB}dB"
         f":start_silence=0.01,areverse"),
        "-ar", str(SAMPLE_RATE), "-ac", "1", str(out_path),
    ])
    dur = probe_duration(out_path)
    if dur < TRIM_MIN_KEEP_S:
        _run([
            "ffmpeg", "-y", "-i", str(in_path),
            "-ar", str(SAMPLE_RATE), "-ac", "1", str(out_path),
        ])
        dur = probe_duration(out_path)
    return dur


def build_narration(clip_paths, gaps, out_path) -> float:
    """Concat per-segment clips with controlled gaps. Returns duration.

    gaps[i] = silence to insert AFTER clip i (last should be 0). The
    brand-sting window is expressed as a larger gap after the hook.
    """
    clip_paths = [Path(p) for p in clip_paths]
    out_path = Path(out_path)
    n = len(clip_paths)
    assert len(gaps) == n, "one gap per clip"
    inputs = []
    for p in clip_paths:
        inputs += ["-i", str(p)]
    chain = []
    for i in range(n):
        if gaps[i] > 0:
            chain.append(f"[{i}:a]apad=pad_dur={gaps[i]:.3f}[a{i}]")
        else:
            chain.append(f"[{i}:a]anull[a{i}]")
    chain.append(
        "".join(f"[a{i}]" for i in range(n))
        + f"concat=n={n}:v=0:a=1[out]"
    )
    _run([
        "ffmpeg", "-y", *inputs,
        "-filter_complex", ";".join(chain),
        "-map", "[out]", "-ar", str(SAMPLE_RATE), "-ac", "1",
        str(out_path),
    ])
    return probe_duration(out_path)


def synth_whoosh(out_path, dur: float = 0.35) -> Path:
    """Synthesize a subtle whoosh: descending chirp + noise, faded.

    A 'whoosh' is a downward frequency sweep — aevalsrc gives the chirp,
    anoisesrc adds air. Kept as one reusable asset.
    """
    out_path = Path(out_path)
    _run([
        "ffmpeg", "-y",
        "-f", "lavfi", "-i",
        f"aevalsrc=0.6*sin(2*PI*(700-1200*t)*t):d={dur}:s={SAMPLE_RATE}",
        "-f", "lavfi", "-i",
        f"anoisesrc=color=white:amplitude=0.30:d={dur}:s={SAMPLE_RATE}",
        "-filter_complex",
        ("[0:a][1:a]amix=inputs=2:duration=first:normalize=0,"
         f"afade=t=in:st=0:d=0.06,afade=t=out:st={dur-0.11:.2f}:d=0.11"),
        "-ar", str(SAMPLE_RATE), "-ac", "1", str(out_path),
    ])
    return out_path


def build_sfx_track(events, total_dur, out_path, whoosh_path=None):
    """Place whoosh events on a timeline. Returns None if no events.

    events: list of (offset_seconds, gain_db). Each event is a whoosh
    delayed to its offset, gain-adjusted, mixed, and trimmed to the
    narration length so it never extends past the video.
    """
    if not events:
        return None
    out_path = Path(out_path)
    whoosh = Path(whoosh_path) if whoosh_path else synth_whoosh(out_path.with_name("_whoosh.wav"))
    n = len(events)
    inputs = []
    for _ in events:
        inputs += ["-i", str(whoosh)]
    chain = []
    for i, (offset, gain_db) in enumerate(events):
        ms = int(offset * 1000)
        chain.append(
            f"[{i}:a]adelay={ms}|{ms},volume={gain_db}dB[e{i}]"
        )
    chain.append(
        "".join(f"[e{i}]" for i in range(n))
        + f"amix=inputs={n}:duration=first:normalize=0,"
        + f"atrim=0:{total_dur:.3f},apad=pad_dur=0.2[mix]"
    )
    _run([
        "ffmpeg", "-y", *inputs,
        "-filter_complex", ";".join(chain),
        "-map", "[mix]", "-ar", str(SAMPLE_RATE), "-ac", "1",
        str(out_path),
    ])
    return out_path


def finalize(narration_path, sfx_path, out_path) -> float:
    """Mix narration + optional SFX, normalize to -14 LUFS. Returns duration."""
    narration_path, out_path = Path(narration_path), Path(out_path)
    if sfx_path and Path(sfx_path).exists():
        _run([
            "ffmpeg", "-y", "-i", str(narration_path), "-i", str(sfx_path),
            "-filter_complex",
            ("[0:a]anull[n];[1:a]anull[s];"
             "[n][s]amix=inputs=2:duration=first:normalize=0,"
             f"loudnorm=I={LOUDNESS_I}:TP=-1.5:LRA=11[a]"),
            "-map", "[a]", "-ar", str(SAMPLE_RATE), "-ac", "1",
            str(out_path),
        ])
    else:
        _run([
            "ffmpeg", "-y", "-i", str(narration_path),
            "-af", f"loudnorm=I={LOUDNESS_I}:TP=-1.5:LRA=11",
            "-ar", str(SAMPLE_RATE), "-ac", "1", str(out_path),
        ])
    return probe_duration(out_path)
