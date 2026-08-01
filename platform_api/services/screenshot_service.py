"""
Screenshot capture for audit visual diffs.

Runs headless Playwright to capture the audited page at completion.
Saves to /public/audit-screenshots/{audit_id}.png served statically by Next.js.
Stealth UA to avoid bot detection (same pattern as teardown screenshots).
"""

import asyncio
import os
from pathlib import Path
from typing import Optional

# Static directory served by nebula-nextjs
SCREENSHOT_DIR = Path("/home/mike/nebula/customer-portal/public/audit-screenshots")
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)


async def capture_audit_screenshot(audit_id: str, url: str) -> Optional[str]:
    """
    Capture a screenshot of `url` and save as `audit_id.png`.
    Returns the public path '/audit-screenshots/{audit_id}.png' on success, None on failure.
    """
    try:
        from playwright.async_api import async_playwright

        out_path = SCREENSHOT_DIR / f"{audit_id}.png"

        async with async_playwright() as p:
            browser = await p.chromium.launch(args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-dev-shm-usage",
            ])
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
                await page.goto(url, wait_until="networkidle", timeout=25_000)
            except Exception:
                try:
                    await page.goto(url, wait_until="domcontentloaded", timeout=15_000)
                except Exception:
                    await browser.close()
                    return None

            await asyncio.sleep(1)
            await page.screenshot(
                path=str(out_path),
                clip={"x": 0, "y": 0, "width": 1280, "height": 800},
            )
            await browser.close()

        return f"/audit-screenshots/{audit_id}.png"

    except Exception:
        return None
