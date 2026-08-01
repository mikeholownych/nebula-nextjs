#!/usr/bin/env python3
import asyncio
import subprocess
from playwright.async_api import async_playwright

async def main():
    url = "http://localhost:3000/audit/b7e24c63-62fa-4c1b-9050-1d7e0b666fdb/results"
    png_path = "/tmp/audit-results-example.png"
    out_path = "/home/mike/nebula/customer-portal/public/screenshots/audit-results-example.webp"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(args=['--no-sandbox', '--disable-blink-features=AutomationControlled'])
        ctx = await browser.new_context(
            viewport={'width': 1600, 'height': 650},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
        )
        page = await ctx.new_page()
        await page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        print(f"Navigating to: {url}")
        await page.goto(url, wait_until='networkidle', timeout=30000)
        
        # Wait for actual score value (not the skeleton dash)
        try:
            await page.wait_for_function(
                "() => document.body.innerText.includes('/10') && !document.body.innerText.includes('—/10')",
                timeout=15000
            )
            print("Score loaded")
        except Exception as e:
            print(f"Wait condition: {e}")
        
        # Small delay for full render
        await asyncio.sleep(2)
        
        # Dismiss cookie banner if present
        try:
            btn = page.locator('#cookie-consent-essential')
            if await btn.is_visible(timeout=2000):
                await btn.click()
                await asyncio.sleep(0.5)
        except:
            pass
        
        await page.screenshot(path=png_path)
        print(f"PNG saved to: {png_path}")
        
        # Get text to verify score
        content = await page.inner_text('body')
        import re
        scores = re.findall(r'(\d+\.?\d*)\s*/\s*10', content)
        grades = re.findall(r'Grade\s+([A-F][+-]?)', content)
        print(f"Found scores: {scores}")
        print(f"Found grades: {grades}")
        
        await browser.close()
    
    # Convert PNG to webp using cwebp or ffmpeg
    result = subprocess.run(['cwebp', '-q', '90', png_path, '-o', out_path], capture_output=True, text=True)
    if result.returncode != 0:
        # Try ffmpeg
        result = subprocess.run(['ffmpeg', '-y', '-i', png_path, '-q:v', '85', out_path], capture_output=True, text=True)
        if result.returncode != 0:
            # Try PIL/Pillow
            from PIL import Image
            img = Image.open(png_path)
            img.save(out_path, 'webp', quality=90)
            print(f"Converted via Pillow: {out_path}")
        else:
            print(f"Converted via ffmpeg: {out_path}")
    else:
        print(f"Converted via cwebp: {out_path}")

asyncio.run(main())
