"""
Screenshot capture for audit visual diffs.

One Chromium at a time (semaphore). The browser process is reused across
captures in this worker. Failures never block audit completion.
"""

import asyncio
import os
from pathlib import Path
from typing import Optional

SCREENSHOT_CONCURRENCY = 1
_capture_sem = asyncio.Semaphore(SCREENSHOT_CONCURRENCY)
_browser_lock = asyncio.Lock()
_playwright = None
_browser = None

SCREENSHOT_DIR = Path(
    os.getenv(
        "AUDIT_SCREENSHOT_DIR",
        "/home/mike/nebula/customer-portal/public/audit-screenshots",
    )
)


async def _get_browser():
    global _playwright, _browser
    async with _browser_lock:
        if _browser is not None:
            return _browser
        from playwright.async_api import async_playwright

        _playwright = await async_playwright().start()
        _browser = await _playwright.chromium.launch(args=[
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox",
            "--disable-dev-shm-usage",
        ])
        return _browser


async def capture_audit_screenshot(audit_id: str, url: str) -> Optional[str]:
    """Capture `url` as `{audit_id}.png`. Returns public path or None."""
    async with _capture_sem:
        try:
            SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
            out_path = SCREENSHOT_DIR / f"{audit_id}.png"
            browser = await _get_browser()
            ctx = await browser.new_context(
                viewport={"width": 1280, "height": 800},
                user_agent=(
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/125.0.0.0 Safari/537.36"
                ),
                locale="en-US",
            )
            page = await ctx.new_page()
            await page.add_init_script(
                "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
            )
            try:
                try:
                    await page.goto(url, wait_until="networkidle", timeout=25_000)
                except Exception:
                    await page.goto(url, wait_until="domcontentloaded", timeout=15_000)
                await page.screenshot(
                    path=str(out_path),
                    clip={"x": 0, "y": 0, "width": 1280, "height": 800},
                )
            finally:
                await ctx.close()
            return f"/audit-screenshots/{audit_id}.png"
        except Exception:
            return None
