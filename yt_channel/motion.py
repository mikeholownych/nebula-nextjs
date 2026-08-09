"""Motion assembly — turn static cards into alive video.

Each frame becomes a slow Ken Burns clip (alternating zoom-in / zoom-out
with fade in/out), clips are concatenated, then the TTS audio is muxed.

Usage:
    assemble_motion_video(frames, durations, audio_path, out_path,
                          width, height, fps=30)

frames:    list of paths to PNG frames (one per segment)
durations: list of per-segment durations in seconds (same length)
"""
import subprocess
import tempfile
from pathlib import Path

FPS = 30
ZOOM_MAX = 1.14
ZOOM_STEP = 0.0009


def _make_clip(frame: Path, dur: float, out: Path, w: int, h: int,
               idx: int, fps: int = FPS) -> None:
    """One segment: slow zoom (direction alternates) + fade in/out."""
    frames_n = max(int(dur * fps), 2)
    zoom_out = (idx % 2) == 1
    if zoom_out:
        zexpr = f"max({ZOOM_MAX}-{ZOOM_STEP}*on,1.0)"
    else:
        zexpr = f"min(zoom+{ZOOM_STEP},{ZOOM_MAX})"
    fade_out_start = max(dur - 0.35, 0.05)
    vf = (
        f"scale={int(w*1.3)}:{int(h*1.3)}:force_original_aspect_ratio=increase,"
        f"crop={int(w*1.3)}:{int(h*1.3)},"
        f"zoompan=z='{zexpr}':d={frames_n}:s={w}x{h}:fps={fps},"
        f"fade=t=in:st=0:d=0.25,"
        f"fade=t=out:st={fade_out_start:.2f}:d=0.30"
    )
    subprocess.run(
        ["ffmpeg", "-y", "-loop", "1", "-i", str(frame),
         "-vf", vf, "-t", f"{dur:.3f}",
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
         "-pix_fmt", "yuv420p", "-r", str(fps), str(out)],
        check=True, capture_output=True,
    )


def assemble_motion_video(frames, durations, audio_path, out_path,
                          width, height, fps: int = FPS) -> str:
    """Build the final MP4 with motion + audio. Returns out_path."""
    frames = [Path(f) for f in frames]
    out_path = Path(out_path)
    if len(frames) != len(durations):
        raise ValueError(f"{len(frames)} frames vs {len(durations)} durations")

    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        clips = []
        for i, (fr, dur) in enumerate(zip(frames, durations)):
            clip = tmp / f"clip_{i:03d}.mp4"
            _make_clip(fr, dur, clip, width, height, i, fps)
            clips.append(clip)

        # Concat clips (re-encode for uniform codec params)
        concat_list = tmp / "concat.txt"
        concat_list.write_text(
            "\n".join(f"file '{c.resolve()}'" for c in clips) + "\n"
        )
        silent = tmp / "silent.mp4"
        subprocess.run(
            ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_list),
             "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
             "-pix_fmt", "yuv420p", "-r", str(fps), str(silent)],
            check=True, capture_output=True,
        )

        # Mux audio
        subprocess.run(
            ["ffmpeg", "-y", "-i", str(silent), "-i", str(audio_path),
             "-c:v", "copy", "-c:a", "aac", "-b:a", "128k",
             "-shortest", str(out_path)],
            check=True, capture_output=True,
        )
    return str(out_path)
