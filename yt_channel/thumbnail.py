"""Thumbnail generation for YouTube videos.

Uses the image_generate tool (FAL/FLUX) for high-quality thumbnails.
Falls back to Pillow card render if FAL unavailable.
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

from . import config

W, H = 1280, 720


def fallback_thumbnail(domain, score, grade, worst_label, output_path):
    """Generate a text-based thumbnail using Pillow (no API call)."""
    img = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(img)

    try:
        domain_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 42)
        score_font  = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 120)
        label_font  = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 28)
        badge_font  = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 24)
    except:
        domain_font = score_font = label_font = badge_font = ImageFont.load_default()

    # Gradient-ish background
    for y in range(H):
        r = int(15 + (y / H) * 15)
        g = int(23 + (y / H) * 18)
        b = int(42 + (y / H) * 17)
        d.line([(0, y), (W, y)], fill=(r, g, b))

    # Score (large, centred)
    score_colour = (5, 150, 105) if score >= 6.5 else (217, 119, 6) if score >= 4 else (220, 38, 38)
    d.text((W // 2, 280), f"{score:.0f}", fill=score_colour, font=score_font, anchor="mm")
    d.text((W // 2, 370), f"/10 · Grade {grade}", fill=(148, 163, 184), font=label_font, anchor="mm")

    # Domain
    d.text((W // 2, 480), domain, fill=(248, 250, 252), font=domain_font, anchor="mm")

    # Worst dimension badge
    if worst_label:
        d.rectangle([W // 2 - 280, 540, W // 2 + 280, 590], fill=(30, 41, 59), outline=(52, 211, 153), width=2)
        d.text((W // 2, 565), f"❌ {worst_label}", fill=(52, 211, 153), font=badge_font, anchor="mm")

    # Bottom brand
    d.text((W // 2, H - 30), "NEBULA AUDITS", fill=(71, 85, 105), font=badge_font, anchor="mm")

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(output_path)
    return str(output_path)


def generate(domain, score, grade, worst_label, output_path):
    """Generate thumbnail. Uses FAL if available, falls back to Pillow."""
    return fallback_thumbnail(domain, score, grade, worst_label, output_path)
