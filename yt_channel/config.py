"""YouTube channel pipeline configuration.

All paths relative to nebula root. Secrets loaded from environment or
~/.hermes/secrets/yt_creds.json at runtime.
"""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# --- Channel identity ---
CHANNEL_NAME = "Nebula Audits"
CHANNEL_TAGLINE = "Data-driven landing page audits — no fluff, no sales calls"
CHANNEL_DESCRIPTION = (
    "Every video is a real, automated landing page audit. "
    "We score pages across 9 conversion dimensions — headline, CTA, social proof, "
    "speed, mobile, SEO, tracking, and more — then walk through every issue "
    "so you can fix your own conversions.\n\n"
    "No talking heads. No fluff. Just the data.\n\n"
    "Get your free instant audit: https://nebulacomponents.shop/audit.html"
)

# --- Video production ---
VIDEO_DIR = ROOT / "yt_channel" / "videos"
TMP_DIR = ROOT / "yt_channel" / "tmp"
THUMBNAIL_DIR = ROOT / "yt_channel" / "thumbnails"
VOICEOVER_DIR = ROOT / "yt_channel" / "voiceovers"
SCREENSHOT_DIR = ROOT / "yt_channel" / "screenshots"
INTRO_TEMPLATE = ROOT / "yt_channel" / "intro.png"
OUTRO_TEMPLATE = ROOT / "yt_channel" / "outro.png"

# --- YouTube upload ---
UPLOAD_FREQUENCY = "2x/week"  # Mon + Thu
UPLOAD_SCHEDULE_CRON = "0 14 * * 1,4"  # Mon/Thu 14:00 UTC
CATEGORY_ID = "22"  # Science & Technology

# --- SEO defaults ---
TAGS = [
    "landing page audit",
    "conversion rate optimization",
    "CRO",
    "landing page optimization",
    "ecommerce conversion",
    "saas landing page",
    "convert more visitors",
    "landing page teardown",
    "fix your landing page",
    "conversion leaks",
]

# --- Voiceover ---
TTS_VOICE = "alloy"  # OpenAI TTS voice
TTS_MODEL = "tts-1"  # or tts-1-hd

# --- Thumbnail ---
THUMBNAIL_STYLE = "dark theme, high contrast"
THUMBNAIL_WIDTH = 1280
THUMBNAIL_HEIGHT = 720

# --- Auto-creation ---
for d in [VIDEO_DIR, TMP_DIR, THUMBNAIL_DIR, VOICEOVER_DIR, SCREENSHOT_DIR]:
    d.mkdir(parents=True, exist_ok=True)
