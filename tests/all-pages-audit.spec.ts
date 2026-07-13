import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://nebulacomponents.shop';

// All revenue + funnel pages served by the tunnel (excludes deprecated drafts part_before/part_after)
const PAGES = [
  '/',
  '/checkout.html',
  '/audit.html',
  '/audit-lander.html',
  '/thank-you.html',
  '/ai-ops-retainer.html',
  '/agency-partner.html',
  '/marketing-ops.html',
];

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
// Composite a possibly-transparent bg over the page bg rgb(8,9,10)
function composite(bg: string): string {
  if (bg.startsWith('rgba')) {
    const m = bg.match(/[\d.]+/g)!.map(Number);
    const [r, g, b, a] = m;
    return `rgb(${Math.round(r * a + 8 * (1 - a))}, ${Math.round(g * a + 9 * (1 - a))}, ${Math.round(b * a + 10 * (1 - a))})`;
  }
  return bg;
}

for (const pagePath of PAGES) {
  test(`PAGE ${pagePath}: visible + WCAG AA contrast`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));

    await page.goto(BASE_URL + pagePath + '?audit=' + Date.now(), { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);

    const height = await page.evaluate(() => document.body.scrollHeight);
    const vh = await page.evaluate(() => window.innerHeight);
    for (let y = 0; y < height; y += vh) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(150);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);

    const vis = await page.evaluate(() => {
      const sels = '.card, section, .how-step, h1, h2, h3, p, li, .pill, .badge, .btn, button, input, a, span, div';
      const bad: any[] = [];
      document.querySelectorAll(sels).forEach((el: any) => {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        const op = parseFloat(cs.opacity);
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return;
        if (op < 0.95) {
          bad.push({ tag: el.tagName + (el.className ? '.' + String(el.className).split(' ')[0] : ''), op: op.toFixed(2), text: (el.textContent || '').trim().slice(0, 30) });
        }
      });
      return bad;
    });

    const contrast = await page.evaluate(() => {
      const out: any[] = [];
      document.querySelectorAll('*').forEach((el: any) => {
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
        out.push({ tag: el.tagName, text: txt.slice(0, 24), fg: cs.color, bg });
      });
      return out;
    });

    let contrastFails = 0;
    contrast.forEach((d) => {
      const realBg = composite(d.bg);
      const rat = ratio(d.fg, realBg);
      if (rat < 4.5) {
        contrastFails++;
        console.log(`[${pagePath}] CONTRAST FAIL ${d.tag} "${d.text}": ${rat.toFixed(2)}:1 fg=${d.fg} bg=${realBg}`);
      }
    });

    console.log(`[${pagePath}] VISIBILITY hidden=${vis.length} CONTRAST failures=${contrastFails} PAGE_ERRORS=${pageErrors.filter(e => !e.includes('rb2b') && !e.includes('ERR_NAME_NOT_RESOLVED')).length}`);
    if (vis.length) console.log(`[${pagePath}] HIDDEN: ` + vis.slice(0, 10).map((v: any) => `${v.tag}@${v.op} "${v.text}"`).join(' | '));

    expect(vis.length, `${pagePath} has hidden elements`).toBe(0);
    expect(contrastFails, `${pagePath} contrast failures`).toBe(0);
    expect(pageErrors.filter(e => !e.includes('rb2b') && !e.includes('ERR_NAME_NOT_RESOLVED')), `${pagePath} page errors`).toHaveLength(0);
  });
}
