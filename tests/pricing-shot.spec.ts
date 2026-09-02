import { test } from '@playwright/test';
test('capture pricing screenshot', async ({ page }) => {
  await page.goto('https://nebulacomponents.com?v=final', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4500);
  await page.locator('#pricing').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'test-results/pricing-fixed-final.png' });
  console.log('screenshot saved');
});
