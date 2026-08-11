"""
broll.py - Per-segment B-roll footage sourcing.

Strategy:
  1. Extract search keywords from each segment (finding label + domain context)
  2. Fetch relevant HD video clip from Pexels API (free, no attribution required
     for online use when PEXELS_API_KEY is set)
  3. Cache downloads to avoid re-fetching the same clip across runs
  4. Composite: B-roll plays as background, Pillow text card overlaid at 70% opacity
     so the key information is always readable

Fallback chain (when PEXELS_API_KEY absent or fetch fails):
  → Playwright screenshot of the audited page (already existing behaviour)
  → Flat Nebula dark background

Usage:
    clip_path = await fetch_broll(keywords, cache_dir, duration_s)
    frame = composite_broll_card(pillow_card, clip_path, timestamp_s)
"""

import hashlib
import os
import subprocess
from pathlib import Path
from typing import Optional

import httpx

PEXELS_API_KEY = os.environ.get("PEXELS_API_KEY", "")
PEXELS_BASE = "https://api.pexels.com/videos"
CACHE_DIR = Path(__file__).parent / "tmp" / "broll_cache"

# Keyword map: finding key → Pexels search terms that match the narrative
FINDING_KEYWORDS: dict[str, str] = {
    "headline":       "website landing page typography",
    "cta":            "button click conversion website",
    "social_proof":   "customer testimonial review trust",
    "message_match":  "advertising marketing billboard",
    "mobile":         "smartphone mobile phone scrolling",
    "load_speed":     "loading waiting computer frustrated",
    "seo_foundations":"search engine google results",
    "ad_signals":     "digital advertising analytics data",
    "ai_readiness":   "artificial intelligence technology data",
    "above_fold":     "website landing page scroll",
    "score_card":     "analytics dashboard data charts",
    "intro_card":     "digital marketing website business",
    "outro_card":     "success growth results business",
    "cta_card":       "call to action conversion funnel",
    "hook_card":      "attention grabbing dramatic reveal",
    "problem_card":   "problem frustrated business loss",
    "fix_card":       "solution fix repair improvement",
    "reward_card":    "success celebrate achievement result",
}

DEFAULT_KEYWORDS = "digital marketing website conversion"


def _keywords_for_segment(seg: dict) -> str:
    """Extract Pexels search keywords from a segment dict."""
    visual = seg.get("visual", "")
    dim_key = seg.get("dimension", "")

    # Check finding key first, then visual type
    if dim_key and dim_key in FINDING_KEYWORDS:
        return FINDING_KEYWORDS[dim_key]
    # Strip 'dimension_' prefix
    clean_visual = visual.replace("dimension_", "")
    if clean_visual in FINDING_KEYWORDS:
        return FINDING_KEYWORDS[clean_visual]
    return DEFAULT_KEYWORDS


def _cache_key(keywords: str) -> str:
    return hashlib.md5(keywords.encode()).hexdigest()[:12]


async def fetch_broll(keywords: str, duration_s: float = 5.0) -> Optional[Path]:
    """
    Fetch a Pexels video clip matching keywords.
    Returns local path to downloaded MP4, or None if unavailable.
    Downloads are cached by keyword hash to avoid repeat API calls.
    """
    if not PEXELS_API_KEY:
        return None

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_key = _cache_key(keywords)
    cached = CACHE_DIR / f"{cache_key}.mp4"
    if cached.exists() and cached.stat().st_size > 10_000:
        return cached

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{PEXELS_BASE}/search",
                headers={"Authorization": PEXELS_API_KEY},
                params={
                    "query": keywords,
                    "per_page": 5,
                    "orientation": "landscape",
                    "size": "medium",
                },
            )
            if not resp.is_success:
                return None

            data = resp.json()
            videos = data.get("videos", [])
            if not videos:
                return None

            # Pick the video whose duration is closest to target
            def score(v):
                return abs(v.get("duration", 10) - max(duration_s, 5))
            video = min(videos, key=score)

            # Get the HD file (prefer 1280×720)
            files = sorted(
                video.get("video_files", []),
                key=lambda f: abs(f.get("width", 0) - 1280),
            )
            if not files:
                return None

            download_url = files[0].get("link")
            if not download_url:
                return None

            # Download
            dl = await client.get(download_url, timeout=60.0, follow_redirects=True)
            if not dl.is_success:
                return None
            cached.write_bytes(dl.content)
            return cached

    except Exception as e:
        print(f"[broll] fetch failed for '{keywords}': {e}")
        return None


def extract_frame(video_path: Path, timestamp_s: float, out_path: Path) -> Optional[Path]:
    """Extract a single frame from a video at timestamp_s as PNG."""
    try:
        subprocess.run([
            "ffmpeg", "-y",
            "-ss", str(timestamp_s),
            "-i", str(video_path),
            "-frames:v", "1",
            "-q:v", "2",
            str(out_path),
        ], check=True, capture_output=True)
        return out_path if out_path.exists() else None
    except subprocess.CalledProcessError:
        return None


def composite_over_broll(card_img, broll_path: Optional[Path],
                         timestamp_s: float = 1.5, tmp_dir: Optional[Path] = None):
    """
    Composite a Pillow card image over a B-roll frame.
    If broll_path is None or extraction fails, returns card_img unchanged.

    card_img: PIL Image (the existing Pillow card with contrast panel)
    Returns: PIL Image with B-roll background
    """
    if broll_path is None:
        return card_img

    try:
        from PIL import Image
        W, H = card_img.size
        tmp_frame = (tmp_dir or Path("/tmp")) / f"broll_frame_{id(card_img)}.png"
        result = extract_frame(broll_path, timestamp_s, tmp_frame)
        if result is None:
            return card_img

        bg = Image.open(tmp_frame).convert("RGBA").resize((W, H))
        # Darken background so text stays readable
        dark = Image.new("RGBA", (W, H), (0, 0, 0, 160))
        bg = Image.alpha_composite(bg, dark)
        # Overlay card at 90% opacity (keep contrast panels visible)
        card_rgba = card_img.convert("RGBA")
        composite = Image.alpha_composite(bg, card_rgba)
        return composite.convert("RGB")
    except Exception as e:
        print(f"[broll] composite failed: {e}")
        return card_img
