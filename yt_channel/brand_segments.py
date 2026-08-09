"""
brand_segments.py — Branded intro and outro card sequences.

Generates multi-frame Pillow sequences that represent the Nebula brand
intro and outro as video segments. Each sequence is a list of (PIL.Image, dur_s)
tuples — the caller steps through them, saves PNGs, and passes to motion.py.

Brand spec from nebulacomponents.com/brand:
  - Near Black bg:     #050505
  - Signal Teal:       #00C2A0
  - Off White:         #F5F5F5
  - Muted Gray:        #9E9E9E
  - Signal Fail amber: #F59E0B (not used in intro/outro)
  - Mark: 3×3 grid, 9 nodes, 6 pass (teal), 3 neutral (gray)
  - Pattern: top 2 rows + col 1 of row 3 = pass; rest neutral
  - Tagline: "The problem was never the ad. It was the page."
  - Motion: scan line, counter-up, node pulse

Intro sequence (total ~3s):
  Frame 0 (0.6s) — Black canvas, diagnostic ring fades in
  Frame 1 (0.6s) — Signal node grid builds (nodes appear)
  Frame 2 (0.8s) — Wordmark + "Nebula Components" fades in
  Frame 3 (1.0s) — Tagline appears + scan-line flourish

Outro sequence (total ~4s):
  Frame 0 (1.0s) — Score counter result (e.g. "6.9/10  Grade: B")
  Frame 1 (1.0s) — Verdict card: SIG:PASS or SIG:FAIL telemetry label
  Frame 2 (1.2s) — Mark + wordmark centered
  Frame 3 (0.8s) — CTA: nebulacomponents.com/audit
"""

from pathlib import Path
from typing import Optional
from PIL import Image, ImageDraw, ImageFont
from PIL.ImageDraw import ImageDraw as _Draw

# ── Brand constants ──────────────────────────────────────────────────
BG         = (5, 5, 5, 255)          # #050505
TEAL       = (0, 194, 160, 255)      # #00C2A0
TEAL_DIM   = (0, 194, 160, 60)
WHITE      = (245, 245, 245, 255)    # #F5F5F5
GRAY       = (158, 158, 158, 255)    # #9E9E9E
GRAY_DIM   = (158, 158, 158, 80)
DARK_PANEL = (11, 17, 16, 230)       # warm-tinted surface

BRAND_DIR = Path(__file__).parent / "assets" / "brand"
MARK_PNG  = BRAND_DIR / "mark-dark-256.png"
WORD_PNG  = BRAND_DIR / "wordmark-dark-512.png"

TAGLINE = "The problem was never the ad. It was the page."

# Node grid: pass (teal) pattern = top 2 rows (6 nodes) + top-left of row 3
NODE_STATES = [
    True,  True,  True,   # row 1 — all pass
    True,  True,  True,   # row 2 — all pass
    False, False, False,  # row 3 — all neutral
]


def _font(size: int, bold: bool = False):
    try:
        return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
                                   if bold else
                                   "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", size)
    except Exception:
        return ImageFont.load_default()


def _draw_signal_nodes(draw: "_Draw", cx: int, cy: int,
                       cell: int = 28, gap: int = 8,
                       alpha_pass: int = 255, alpha_neutral: int = 80) -> None:
    """Draw 3×3 signal node grid centered at (cx, cy)."""
    stride = cell + gap
    total = 3 * stride - gap
    x0 = cx - total // 2
    y0 = cy - total // 2

    for i, is_pass in enumerate(NODE_STATES):
        col = i % 3
        row = i // 3
        x = x0 + col * stride
        y = y0 + row * stride
        r = cell // 2
        color = (*TEAL[:3], alpha_pass) if is_pass else (*GRAY[:3], alpha_neutral)
        draw.rounded_rectangle([x, y, x + cell, y + cell],
                                radius=max(3, cell // 6), fill=color)


def _draw_scan_line(draw: ImageDraw, W: int, H: int, progress: float = 0.6,
                    color=(*TEAL[:3], 40)) -> None:
    """Draw a horizontal scan line at (progress * H)."""
    y = int(H * progress)
    draw.line([(0, y), (W, y)], fill=color, width=2)


def _draw_diagnostic_ring(draw: ImageDraw, cx: int, cy: int,
                           r: int = 90, color=(*TEAL[:3], 30)) -> None:
    """Draw subtle diagnostic circle ring."""
    bbox = [cx - r, cy - r, cx + r, cy + r]
    draw.ellipse(bbox, outline=color, width=1)
    # Second ring
    r2 = r + 18
    bbox2 = [cx - r2, cy - r2, cx + r2, cy + r2]
    draw.ellipse(bbox2, outline=(*GRAY[:3], 20), width=1)


def _place_asset(canvas: Image.Image, asset_path: Path,
                 cx: int, cy: int, max_w: int, max_h: int) -> None:
    """Paste a PNG asset centered at (cx, cy), scaled to fit max_w × max_h."""
    if not asset_path.exists():
        return
    try:
        img = Image.open(asset_path).convert("RGBA")
        scale = min(max_w / img.width, max_h / img.height, 1.0)
        new_w = max(1, int(img.width * scale))
        new_h = max(1, int(img.height * scale))
        img = img.resize((new_w, new_h), Image.LANCZOS)
        x = cx - new_w // 2
        y = cy - new_h // 2
        canvas.paste(img, (x, y), img)
    except Exception as e:
        print(f"[brand_segments] asset paste failed ({asset_path.name}): {e}")


def make_intro_frames(W: int, H: int) -> list[tuple[Image.Image, float]]:
    """
    Return list of (PIL.Image, duration_seconds) for the intro sequence.
    Caller saves each frame to disk and passes to the video assembler.
    """
    cx, cy = W // 2, H // 2
    frames = []

    # ── Frame 0: dark canvas + diagnostic ring (0.5s) ─────────────
    img0 = Image.new("RGBA", (W, H), BG)
    d = ImageDraw.Draw(img0)
    _draw_diagnostic_ring(d, cx, cy, r=min(W, H) // 5)
    _draw_diagnostic_ring(d, cx, cy, r=min(W, H) // 3, color=(*GRAY[:3], 12))
    # SIG telemetry label top-right
    font_tele = _font(14)
    d.text((W - 20, 20), "SIG:PASS 6/9 · GRADE:B", font=font_tele,
           fill=(*TEAL[:3], 120), anchor="ra")
    frames.append((img0.convert("RGB"), 0.5))

    # ── Frame 1: signal node grid appears (0.6s) ────────────────
    img1 = img0.copy().convert("RGBA")
    d1 = ImageDraw.Draw(img1)
    _draw_signal_nodes(d1, cx, cy - 30, cell=32, gap=10)
    frames.append((img1.convert("RGB"), 0.6))

    # ── Frame 2: wordmark fades in below nodes (0.7s) ───────────
    img2 = img1.copy().convert("RGBA")
    _place_asset(img2, WORD_PNG, cx, cy + 70, max_w=min(W - 80, 360), max_h=80)
    frames.append((img2.convert("RGB"), 0.7))

    # ── Frame 3: tagline + scan line (1.0s) ─────────────────────
    img3 = img2.copy().convert("RGBA")
    d3 = ImageDraw.Draw(img3)
    font_tag = _font(max(16, W // 60))
    # Wrap tagline
    tagline_y = cy + 130 if H > 500 else cy + 100
    d3.text((cx, tagline_y), TAGLINE, font=font_tag,
            fill=(*GRAY[:3], 200), anchor="mm")
    _draw_scan_line(d3, W, H, progress=0.62)
    frames.append((img3.convert("RGB"), 1.0))

    return frames


def make_outro_frames(W: int, H: int,
                      score: float = 0.0,
                      grade: str = "B",
                      domain: str = "") -> list[tuple[Image.Image, float]]:
    """
    Return list of (PIL.Image, duration_seconds) for the outro sequence.
    """
    cx, cy = W // 2, H // 2
    frames = []

    verdict_label = "SIG:PASS" if score >= 7.0 else "SIG:WARN" if score >= 5.5 else "SIG:FAIL"
    verdict_color = TEAL if score >= 7.0 else (245, 158, 11, 255) if score >= 5.5 else (243, 121, 121, 255)

    # ── Frame 0: score result (1.0s) ────────────────────────────
    img0 = Image.new("RGBA", (W, H), BG)
    d0 = ImageDraw.Draw(img0)
    _draw_diagnostic_ring(d0, cx, cy - 30, r=min(W, H) // 4)
    font_score = _font(max(48, W // 18), bold=True)
    font_label = _font(max(18, W // 44))
    font_grade = _font(max(28, W // 26), bold=True)
    d0.text((cx, cy - 60), f"{score:.1f}/10", font=font_score,
            fill=WHITE, anchor="mm")
    d0.text((cx, cy + 20), f"Grade: {grade}", font=font_grade,
            fill=(*TEAL[:3], 230), anchor="mm")
    if domain:
        font_dom = _font(max(14, W // 70))
        d0.text((cx, cy + 60), domain, font=font_dom,
                fill=(*GRAY[:3], 160), anchor="mm")
    frames.append((img0.convert("RGB"), 1.0))

    # ── Frame 1: verdict telemetry card (0.9s) ──────────────────
    img1 = img0.copy().convert("RGBA")
    d1 = ImageDraw.Draw(img1)
    # Panel
    pw, ph = min(W - 60, 340), 64
    px, py = cx - pw // 2, cy + 100
    d1.rounded_rectangle([px, py, px + pw, py + ph],
                          radius=10, fill=DARK_PANEL)
    d1.rounded_rectangle([px, py, px + pw, py + ph],
                          radius=10, outline=(*verdict_color[:3], 120), width=1)
    font_verd = _font(max(20, W // 44), bold=True)
    d1.text((cx, py + ph // 2), verdict_label, font=font_verd,
            fill=(*verdict_color[:3], 230), anchor="mm")
    frames.append((img1.convert("RGB"), 0.9))

    # ── Frame 2: mark + wordmark centered (1.2s) ─────────────────
    img2 = Image.new("RGBA", (W, H), BG)
    d2 = ImageDraw.Draw(img2)
    _draw_diagnostic_ring(d2, cx, cy - 20, r=min(W, H) // 5)
    node_cy = cy - 60 if MARK_PNG.exists() else cy - 20
    _draw_signal_nodes(d2, cx, node_cy, cell=28, gap=9)
    _place_asset(img2, WORD_PNG, cx, cy + 40, max_w=min(W - 80, 320), max_h=70)
    frames.append((img2.convert("RGB"), 1.2))

    # ── Frame 3: CTA (0.8s) ──────────────────────────────────────
    img3 = img2.copy().convert("RGBA")
    d3 = ImageDraw.Draw(img3)
    font_cta_label = _font(max(13, W // 75))
    font_cta_url = _font(max(18, W // 48), bold=True)
    cta_y = cy + 130 if H > 500 else cy + 110
    d3.text((cx, cta_y), "FREE AUDIT — NO SIGNUP", font=font_cta_label,
            fill=(*GRAY[:3], 160), anchor="mm")
    d3.text((cx, cta_y + 28), "nebulacomponents.com/audit", font=font_cta_url,
            fill=(*TEAL[:3], 230), anchor="mm")
    # Subscribe nudge
    font_sub = _font(max(13, W // 75))
    d3.text((cx, cta_y + 60), "↑ Subscribe for daily audits", font=font_sub,
            fill=(*GRAY[:3], 120), anchor="mm")
    frames.append((img3.convert("RGB"), 0.8))

    return frames
