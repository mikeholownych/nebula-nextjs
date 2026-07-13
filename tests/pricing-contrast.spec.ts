import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://nebulacomponents.shop';

function parseRGB(s: string): [number, number, number] {
  const m = s.match(/\d+/g)!.map(Number);
  return [m[0], m[1], m[2]];
}
function lum(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function ratio(fg: string, bg: string): number {
  const [fr, fg2, fb] = parseRGB(fg);
  const [br, bg2, bb] = parseRGB(bg);
  return (Math.max(lum(fr, fg2, fb), lum(br, bg2, bb)) + 0.05) / (Math.min(lum(fr, fg2, fb), lum(br, bg2, bb)) + 0.05);
}
// Composite bg over page bg rgb(8,9,10)
function composite(bg: string): string {
  if (bg.startsWith('rgba')) {
    const m = bg.match(/[\d.]+/g)!.map(Number);
    const [r, g, b, a] = m;
    const pr = 8, pg = 9, pb = 10;
    return `rgb(${Math.round(r * a + pr * (1 - a))}, ${Math.round(g * a + pg * (1 - a))}, ${Math.round(b * a + pb * (1 - a))})`;
  }
  return bg;
}

test('pricing text contrast passes WCAG AA (composited)', async ({ page }) => {
  await page.goto(BASE_URL + '?v=' + Date.now(), { waitUntil: 'networkidle' });
  await page.waitForTimeout(4500);
  await page.locator('#pricing').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const data = await page.evaluate(() => {
    const out: any[] = [];
    const root = document.querySelector('#pricing')!;
    root.querySelectorAll('*').forEach((el: any) => {
      const txt = el.textContent?.trim();
      if (!txt || el.children.length > 0) return;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') return;
      let node: any = el, bg = 'rgb(8, 9, 10)';
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
    const realBg = composite(d.bg);
    const rat = ratio(d.fg, realBg);
    if (rat < 4.5) { failures++; console.log(`FAIL ${d.tag} "${d.text}": ${rat.toFixed(2)}:1 fg=${d.fg} bg=${realBg}`); }
  });
  console.log(`Checked ${data.length} nodes — failures: ${failures}`);
  expect(failures).toBe(0);
});
