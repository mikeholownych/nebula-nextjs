import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://nebulacomponents.shop';

test('pricing section fully visible + screenshot', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(4500); // let safety net settle

  const cards = page.locator('#pricing .card');
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const opacity = await cards.nth(i).evaluate((el) => parseFloat(getComputedStyle(el).opacity));
    expect(opacity).toBeGreaterThan(0.95);
  }

  await page.locator('#pricing').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'test-results/pricing-final-verify.png', fullPage: false });

  console.log('PASS: pricing cards visible, count=' + count);
});
