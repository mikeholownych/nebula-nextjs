import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://nebulacomponents.shop';

function lum(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function ratio(fg: string, bg: string): number {
  const fp = fg.match(/\d+/g)!.map(Number);
  const bp = bg.match(/\d+/g)!.map(Number);
  const l1 = lum(fp[0], fp[1], fp[2]);
  const l2 = lum(bp[0], bp[1], bp[2]);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
// Walk up to find the nearest non-transparent bg
function effectiveBg(el: Element): string {
  let node: any = el;
  while (node) {
    const bg = getComputedStyle(node).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
    node = node.parentElement;
  }
  return 'rgb(8, 9, 10)'; // page default dark
}

test('pricing text contrast passes WCAG AA', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(4500);
  await page.locator('#pricing').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const data = await page.evaluate(() => {
    const out: any[] = [];
    const root = document.querySelector('#pricing')!;
    root.querySelectorAll('*').forEach((el: any) => {
      const txt = el.textContent?.trim();
      if (!txt || el.children.length > 0) return; // leaf text nodes only
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') return;
      // find effective bg by walking up
      let node: any = el;
      let bg = 'rgb(8, 9, 10)';
      while (node) {
        const b = getComputedStyle(node).backgroundColor;
        if (b && b !== 'rgba(0, 0, 0, 0)' && b !== 'transparent') { bg = b; break; }
        node = node.parentElement;
      }
      out.push({ tag: el.tagName, text: txt.slice(0, 28), fg: cs.color, bg });
    });
    return out;
  });

  let failures = 0;
  data.forEach((d) => {
    const rat = ratio(d.fg, d.bg);
    const pass = rat >= 4.5;
    if (!pass) { failures++; console.log(`FAIL ${d.tag} "${d.text}": ${rat.toFixed(2)}:1 fg=${d.fg} bg=${d.bg}`); }
  });
  console.log(`Checked ${data.length} leaf text nodes in #pricing — failures: ${failures}`);
  expect(failures).toBe(0);
});
