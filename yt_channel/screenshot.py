"""Capture real page screenshots for video backgrounds.

Used by produce_short.py / produce.py so cards show the ACTUAL page being
audited (blurred + darkened behind the text) instead of a flat colour.

Fail-closed: any error returns None so the pipeline falls back to the
flat background and still produces a video.
"""
import asyncio
import logging
from pathlib import Path

from PIL import Image, ImageEnhance

log = logging.getLogger("yt_screenshot")

SCREENSHOT_DIR = Path(__file__).resolve().parent / "screenshots"


def prepare_bg(bg_path, w, h, darken=0.42):
    """Load a page screenshot, resize-to-cover canvas, darken for text
    readability. Returns a PIL RGB image or None if unusable."""
    if not bg_path:
        return None
    try:
        img = Image.open(bg_path).convert("RGB")
        scale = max(w / img.width, h / img.height)
        img = img.resize((int(img.width * scale) + 1, int(img.height * scale) + 1),
                         Image.Resampling.LANCZOS)
        left = (img.width - w) // 2
        top = (img.height - h) // 2
        img = img.crop((left, top, left + w, top + h))
        img = ImageEnhance.Brightness(img).enhance(darken)
        return img
    except Exception:
        return None


def capture_page(url: str, width: int = 1280, height: int = 800,
                 timeout_ms: int = 25000) -> str | None:
    """Take a full-viewport screenshot of url. Returns file path or None.

    Uses Playwright headless Chromium. Wrapped in a subprocess-safe way:
    returns None on ANY failure (bot-blocked, timeout, TLS, etc.) so the
    video pipeline never breaks because a screenshot failed.
    """
    if not url or not url.startswith(("http://", "https://")):
        return None
    domain = url.replace("https://", "").replace("http://", "").split("/")[0]
    safe = domain.replace(".", "_")
    out_dir = SCREENSHOT_DIR
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{safe}_{width}x{height}.png"

    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"]
            )
            page = browser.new_page(viewport={"width": width, "height": height})
            page.goto(url, timeout=timeout_ms, wait_until="load")
            page.wait_for_timeout(2500)  # let hero/fonts/real content render
            # Dismiss common cookie/consent banners for a cleaner shot
            try:
                for sel in [
                    'button:has-text("Accept all")',
                    'button:has-text("Accept All")',
                    'button:has-text("Only necessary")',
                    'button:has-text("Reject all")',
                    'button:has-text("Reject")',
                    'button:has-text("Decline")',
                    'button:has-text("Agree")',
                    "button:has-text(\"I'll allow it\")",
                    '#onetrust-accept-btn-handler',
                    '.consent-banner button',
                ]:
                    btn = page.locator(sel).first
                    if btn.count() and btn.is_visible():
                        btn.click(timeout=2000)
                        page.wait_for_timeout(600)
                        break
            except Exception:
                pass
            # Scroll once to trigger lazy-loaded above-the-fold content,
            # then return to top so the screenshot shows the hero.
            page.mouse.wheel(0, 400)
            page.wait_for_timeout(600)
            page.mouse.wheel(0, -400)
            page.wait_for_timeout(400)
            page.screenshot(path=str(out_path))
            browser.close()
        if out_path.exists() and out_path.stat().st_size > 10_000:
            log.info(f"Screenshot OK: {domain} -> {out_path.name}")
            return str(out_path)
        return None
    except Exception as e:
        log.warning(f"Screenshot failed for {domain}: {type(e).__name__}: {e}")
        return None


async def capture_page_async(url: str, width: int = 1280, height: int = 800,
                             timeout_ms: int = 25000) -> str | None:
    """Async wrapper for use inside asyncio.gather pipelines."""
    return await asyncio.to_thread(capture_page, url, width, height, timeout_ms)
