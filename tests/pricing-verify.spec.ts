import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://nebulacomponents.shop';

test('pricing cards become fully visible after scroll + safety net', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });

  // Scroll pricing into view
  await page.evaluate(() => document.querySelector('#pricing')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(4000); // allow anim + 3s safety net

  const cards = page.locator('#pricing .card');
  const count = await cards.count();
  console.log('CARD COUNT:', count);

  for (let i = 0; i < count; i++) {
    const opacity = await cards.nth(i).evaluate((el) => parseFloat(getComputedStyle(el).opacity));
    const transform = await cards.nth(i).evaluate((el) => el.style.transform || getComputedStyle(el).transform);
    console.log(`CARD ${i}: opacity=${opacity.toFixed(3)} transform=${transform}`);
    expect(opacity).toBeGreaterThan(0.9);
  }

  console.log('JS ERRORS:', JSON.stringify(errors));
});

test('no JS errors on load', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log('PAGE ERRORS:', JSON.stringify(errors));
  expect(errors.filter(e => !e.includes('rb2b') && !e.includes('ERR_NAME_NOT_RESOLVED'))).toHaveLength(0);
});
