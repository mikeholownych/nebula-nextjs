import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://nebulacomponents.shop';

test.describe('Pricing Animation Validation', () => {
  test('pricing cards are visible (not stuck opacity:0)', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Scroll to pricing section
    await page.evaluate(() => {
      document.querySelector('#pricing')?.scrollIntoView({ behavior: 'instant', block: 'center' });
    });

    // Wait for GSAP + 3s safety net to settle
    await page.waitForTimeout(3500);

    const cards = page.locator('#pricing .card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const opacity = await cards.nth(i).evaluate((el) => parseFloat(getComputedStyle(el).opacity));
      console.log(`Card ${i} opacity: ${opacity}`);
      expect(opacity).toBeGreaterThan(0.9);
    }
  });

  test('pricing cards visible even with JS disabled (default state)', async ({ page }) => {
    // Block gsap scripts to simulate JS failure
    await page.route('**/gsap*.js', (route) => route.abort());
    await page.route('**/gsap-animations.js', (route) => route.abort());

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const cards = page.locator('#pricing .card');
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const opacity = await cards.nth(i).evaluate((el) => parseFloat(getComputedStyle(el).opacity));
      expect(opacity).toBeGreaterThan(0.9);
    }
  });
});
