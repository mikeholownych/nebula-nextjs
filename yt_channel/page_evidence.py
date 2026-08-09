"""
page_evidence.py — Element-level screenshot crops for video teardowns.

Captures specific DOM elements from the audited page and annotates them
to show exactly what the finding is referring to. Each crop becomes a
video frame that appears while the narrator explains the issue.

Finding key → what to capture:
  headline        → h1 element (full-width crop, red underline annotation)
  cta             → primary button/CTA (zoomed crop, red arrow/circle)
  social_proof    → testimonial area or lack thereof (viewport section)
  message_match   → hero headline vs ad message (top-of-page crop)
  mobile          → 375px viewport above-fold screenshot
  load_speed      → full-page weight indicator (full-page screenshot)
  seo_foundations → title/h1 area with missing element overlay
  above_fold      → 1280×720 viewport screenshot (what visitor first sees)
  ai_readiness    → page source meta tags area (schematic overlay)

Usage:
    evidence = await capture_finding_evidence(url, findings, job_dir)
    # Returns dict: {finding_key: Path_to_annotated_png}
"""

import asyncio
import logging
from pathlib import Path
from typing import Optional

from PIL import Image, ImageDraw, ImageFont

log = logging.getLogger("page_evidence")

# Teal + red annotation colors matching brand
TEAL = (0, 194, 160)
RED  = (243, 79, 79)
WHITE = (245, 245, 245)
DARK  = (5, 5, 5)

# Map finding key → Playwright selector to focus on
# Each entry is a list tried in order; first visible one wins
FINDING_SELECTORS: dict[str, list[str]] = {
    "headline":        ["h1", "h2", ".hero h1", ".hero h2", "[data-testid*='headline']"],
    "cta":             ["a[href*='get'], a[href*='start'], a[href*='buy'], a[href*='sign']",
                        "button:not([aria-hidden])", ".cta", "a.btn", "a.button",
                        "[class*='cta']", "[class*='btn']"],
    "social_proof":    [".testimonial", ".review", "[class*='testimonial']",
                        "[class*='review']", "[class*='trust']", ".social-proof"],
    "message_match":   ["h1", ".hero"],
    "above_fold":      ["body"],   # full above-fold viewport
    "seo_foundations": ["head title", "h1"],
    "mobile":          ["body"],   # captured at 375px width
    "load_speed":      ["body"],   # full page
    "ai_readiness":    ["body"],
    "ad_signals":      ["body"],
}

# Viewport for above-fold captures
DESKTOP_W, DESKTOP_H = 1280, 720
MOBILE_W, MOBILE_H   = 375, 812


def _font(size: int = 24, bold: bool = False):
    try:
        name = "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
        return ImageFont.truetype(f"/usr/share/fonts/truetype/dejavu/{name}", size)
    except Exception:
        return ImageFont.load_default()


def _annotate_crop(img: Image.Image, finding_key: str,
                   label: str, issue: str) -> Image.Image:
    """Add annotation overlay: red rectangle outline + label bar."""
    img = img.copy().convert("RGB")
    W, H = img.size
    draw = ImageDraw.Draw(img)

    # Red border on the crop
    border = 6
    draw.rectangle([0, 0, W - 1, H - 1], outline=RED, width=border)

    # Label bar at bottom
    bar_h = max(44, H // 12)
    draw.rectangle([0, H - bar_h, W, H], fill=(*DARK, 220))
    font_label = _font(max(16, bar_h // 3), bold=True)
    font_issue = _font(max(13, bar_h // 4))
    draw.text((12, H - bar_h + 4), label.upper(), font=font_label, fill=(*TEAL, 255))
    # Truncate issue text to fit
    issue_short = issue[:80] + ("…" if len(issue) > 80 else "")
    draw.text((12, H - bar_h + 4 + bar_h // 3 + 2), issue_short,
              font=font_issue, fill=(*WHITE, 200))

    return img


def _annotate_missing(img: Image.Image, what_is_missing: str) -> Image.Image:
    """Red X overlay for 'this element doesn't exist' evidence."""
    img = img.copy().convert("RGB")
    W, H = img.size
    draw = ImageDraw.Draw(img)

    # Darkening overlay
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 120))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)

    # Large red X
    cx, cy = W // 2, H // 2
    size = min(W, H) // 4
    draw.line([(cx - size, cy - size), (cx + size, cy + size)], fill=RED, width=8)
    draw.line([(cx + size, cy - size), (cx - size, cy + size)], fill=RED, width=8)

    font_miss = _font(max(22, W // 36), bold=True)
    draw.text((cx, cy + size + 20), f"MISSING: {what_is_missing}",
              font=font_miss, fill=(*RED, 255), anchor="mm")
    return img


async def _capture_with_playwright(url: str, selector: str,
                                   out_path: Path,
                                   mobile: bool = False) -> Optional[Path]:
    """Capture a specific element or viewport via Playwright."""
    try:
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-dev-shm-usage"],
            )
            vp_w = MOBILE_W if mobile else DESKTOP_W
            vp_h = MOBILE_H if mobile else DESKTOP_H
            page = await browser.new_page(viewport={"width": vp_w, "height": vp_h})
            await page.goto(url, timeout=20000, wait_until="load")
            await page.wait_for_timeout(2000)

            # Dismiss banners
            for btn_sel in ['button:has-text("Accept")', 'button:has-text("Agree")',
                             '#onetrust-accept-btn-handler']:
                try:
                    btn = page.locator(btn_sel).first
                    if await btn.count() and await btn.is_visible():
                        await btn.click(timeout=1500)
                        await page.wait_for_timeout(400)
                        break
                except Exception:
                    pass

            out_path.parent.mkdir(parents=True, exist_ok=True)

            if selector == "body" or not selector:
                # Full viewport screenshot
                await page.screenshot(path=str(out_path), clip={
                    "x": 0, "y": 0, "width": vp_w, "height": vp_h,
                })
            else:
                # Try to find and screenshot the element
                found = False
                for sel in (selector.split(",") if "," in selector else [selector]):
                    sel = sel.strip()
                    try:
                        loc = page.locator(sel).first
                        if await loc.count() and await loc.is_visible():
                            # Screenshot the element
                            await loc.screenshot(path=str(out_path))
                            found = True
                            break
                    except Exception:
                        continue
                if not found:
                    # Fallback: full viewport
                    await page.screenshot(path=str(out_path), clip={
                        "x": 0, "y": 0, "width": vp_w, "height": vp_h,
                    })

            await browser.close()
            return out_path if out_path.exists() else None
    except Exception as e:
        log.warning(f"[evidence] Playwright capture failed for {selector}: {e}")
        return None


async def capture_finding_evidence(
    url: str,
    findings: list[dict],
    job_dir: Path,
    max_findings: int = 4,
) -> dict[str, Path]:
    """
    Capture annotated screenshots for the top N findings.
    Returns {finding_key: annotated_png_path}.
    Fail-closed: missing captures are excluded from the result silently.
    """
    evidence: dict[str, Path] = {}
    evidence_dir = job_dir / "evidence"
    evidence_dir.mkdir(parents=True, exist_ok=True)

    # Take the full above-fold desktop screenshot once (shared as base)
    base_shot = evidence_dir / "base_desktop.png"
    base_mobile = evidence_dir / "base_mobile.png"

    base_task = _capture_with_playwright(url, "body", base_shot, mobile=False)
    mobile_task = _capture_with_playwright(url, "body", base_mobile, mobile=True)

    # Capture element-level shots in parallel
    async def _capture_finding(f: dict) -> Optional[tuple[str, Path]]:
        key = f.get("key", "")
        label = f.get("label", key.replace("_", " ").title())
        issue = f.get("issue", "")

        if key == "mobile":
            # Special case: use the mobile viewport
            raw = evidence_dir / f"{key}_raw.png"
            await _capture_with_playwright(url, "body", raw, mobile=True)
            if raw.exists():
                img = Image.open(raw)
                # Resize to 1280×720 (fit with letterbox)
                ratio = min(DESKTOP_W / img.width, DESKTOP_H / img.height)
                new_w = int(img.width * ratio)
                new_h = int(img.height * ratio)
                bg = Image.new("RGB", (DESKTOP_W, DESKTOP_H), DARK)
                resized = img.resize((new_w, new_h), Image.LANCZOS)
                bg.paste(resized, ((DESKTOP_W - new_w) // 2, (DESKTOP_H - new_h) // 2))
                annotated = _annotate_crop(bg, key, "MOBILE VIEWPORT", issue)
                out = evidence_dir / f"{key}.png"
                annotated.save(out)
                return key, out
        else:
            selectors = FINDING_SELECTORS.get(key, ["body"])
            # Try each selector
            for sel in selectors:
                raw = evidence_dir / f"{key}_raw.png"
                result = await _capture_with_playwright(url, sel, raw, mobile=False)
                if result and raw.exists():
                    img = Image.open(raw).convert("RGB")
                    # Scale to fit 1280×720 if larger, or pad if smaller
                    if img.width < 200 or img.height < 60:
                        # Element too small — use viewport with highlight
                        break
                    # Resize to 1280×720 preserving aspect
                    ratio = min(DESKTOP_W / img.width, DESKTOP_H / img.height)
                    if ratio < 1.0:
                        new_w = int(img.width * ratio)
                        new_h = int(img.height * ratio)
                        img = img.resize((new_w, new_h), Image.LANCZOS)
                    bg = Image.new("RGB", (DESKTOP_W, DESKTOP_H), DARK)
                    x = (DESKTOP_W - img.width) // 2
                    y = (DESKTOP_H - img.height) // 2
                    bg.paste(img, (x, y))
                    annotated = _annotate_crop(bg, key, label, issue)
                    out = evidence_dir / f"{key}.png"
                    annotated.save(out)
                    return key, out

        # Fallback: annotate the base desktop screenshot with "missing" overlay
        if base_shot.exists():
            img = Image.open(base_shot).convert("RGB")
            annotated = _annotate_missing(img, label)
            # Add label
            draw = ImageDraw.Draw(annotated)
            bar_h = 44
            draw.rectangle([0, annotated.height - bar_h, annotated.width, annotated.height],
                            fill=(*DARK, 220))
            draw.text((12, annotated.height - bar_h + 12), label.upper(),
                      font=_font(16, bold=True), fill=(*TEAL, 255))
            out = evidence_dir / f"{key}.png"
            annotated.save(out)
            return key, out

        return None

    # Parallel capture
    tasks = [_capture_finding(f) for f in findings[:max_findings]]
    # Base screenshots run first since finding captures may depend on them
    await asyncio.gather(base_task, mobile_task)
    results = await asyncio.gather(*tasks, return_exceptions=True)

    for res in results:
        if isinstance(res, tuple) and res is not None:
            key, path = res
            if path and path.exists():
                evidence[key] = path

    # Always include the above-fold viewport
    if base_shot.exists() and "above_fold" not in evidence:
        evidence["above_fold"] = base_shot
    if base_mobile.exists() and "mobile" not in evidence:
        img = Image.open(base_mobile)
        ratio = min(DESKTOP_W / img.width, DESKTOP_H / img.height)
        new_w = int(img.width * ratio)
        new_h = int(img.height * ratio)
        bg = Image.new("RGB", (DESKTOP_W, DESKTOP_H), DARK)
        resized = img.resize((new_w, new_h), Image.LANCZOS)
        bg.paste(resized, ((DESKTOP_W - new_w) // 2, (DESKTOP_H - new_h) // 2))
        mobile_out = evidence_dir / "mobile.png"
        bg.save(mobile_out)
        evidence["mobile"] = mobile_out

    log.info(f"[evidence] Captured {len(evidence)} evidence frames for {url}")
    return evidence
