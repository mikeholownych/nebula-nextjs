#!/usr/bin/env python3
"""
upscale_winners.py - generates Topaz Video AI upscale briefs for winning clips.
Usage: python3 upscale_winners.py shot3.mp4 shot5.mp4
Or:    echo -e "shot3.mp4\nshot5.mp4" | python3 upscale_winners.py
"""

import sys, os
from pathlib import Path
from datetime import datetime

MOTION_DIR = Path.home() / "Videos" / "nebula-shoots"
QUEUE_DIR  = MOTION_DIR / "upscale-queue"
QUEUE_DIR.mkdir(parents=True, exist_ok=True)

ANCHOR = (
    "RED Komodo, 35mm anamorphic lens, soft monitor-glow practicals, "
    "near-black with teal accent, light film grain, slight vignette"
)

BRIEF_TEMPLATE = """\
# Topaz Video AI - Master Upscale Brief
# Generated: {date}
# Source: {filepath}

## Upscale Settings

Target resolution: 3840×2160 (4K UHD)
Preserve grain: YES - do not denoise, do not apply noise reduction
Motion artifact handling: preserve as cinematic texture
Output format: ProRes 422 HQ

## Style anchor (paste into Topaz style hint field)
{anchor}

## Paste-ready brief (for Topaz Video AI or similar)

> Upscale {filename} to 3840x2160. Preserve film grain and motion artifacts
> as cinematic texture - do not denoise, do not apply noise reduction.
> Style anchor: {anchor}.
> Output as ProRes 422 HQ for editorial.

## Destination check (confirm before running)
- [ ] Phone feed only (TikTok/Reels/Shorts) → SKIP - keep 1080p
- [ ] YouTube desktop / brand archive → PROCEED with 4K
- [ ] LinkedIn / one-off post → SKIP - feed compresses anyway
"""

def generate_brief(filename: str) -> Path:
    src = MOTION_DIR / filename
    brief_path = QUEUE_DIR / (Path(filename).stem + ".brief.txt")
    brief = BRIEF_TEMPLATE.format(
        date=datetime.now().strftime("%Y-%m-%d %H:%M"),
        filepath=src,
        filename=filename,
        anchor=ANCHOR,
    )
    brief_path.write_text(brief)
    return brief_path

def main():
    filenames = []
    if not sys.stdin.isatty():
        filenames = [line.strip() for line in sys.stdin if line.strip()]
    filenames += [a for a in sys.argv[1:] if not a.startswith("-")]

    if not filenames:
        print("Usage: python3 upscale_winners.py shot3.mp4 shot5.mp4")
        print("   Or: echo 'shot3.mp4' | python3 upscale_winners.py")
        sys.exit(1)

    print(f"\nGenerating upscale briefs → {QUEUE_DIR}\n")
    for fn in filenames:
        path = generate_brief(fn)
        size = Path(MOTION_DIR / fn).stat().st_size / 1e6 if (MOTION_DIR / fn).exists() else 0
        print(f"  ✓ {fn} ({size:.1f}MB) → {path.name}")

    print(f"\n{len(filenames)} brief(s) written to {QUEUE_DIR}")
    print("Open each .brief.txt and paste into Topaz Video AI.")

if __name__ == "__main__":
    main()
