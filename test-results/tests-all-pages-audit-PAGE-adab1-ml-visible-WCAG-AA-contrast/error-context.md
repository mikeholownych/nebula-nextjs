# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/all-pages-audit.spec.ts >> PAGE /thank-you.html: visible + WCAG AA contrast
- Location: tests/all-pages-audit.spec.ts:41:7

# Error details

```
Error: /thank-you.html contrast failures

expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 1
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]: ✓
    - heading "Your audit is running." [level=1] [ref=e4]:
      - text: Your audit is
      - emphasis [ref=e5]: running
      - text: .
    - paragraph [ref=e6]: Check your inbox in about 60 seconds. Your scored 5-dimension teardown — with the exact fixes ranked by dollar impact — is on its way.
    - list [ref=e7]:
      - listitem [ref=e8]:
        - generic [ref=e9]: "1."
        - generic [ref=e10]:
          - strong [ref=e11]: Audit runs
          - text: — we score your page on 5 conversion dimensions right now.
      - listitem [ref=e12]:
        - generic [ref=e13]: "2."
        - generic [ref=e14]:
          - strong [ref=e15]: Email lands
          - text: — top leaks ranked, not a 40-item list.
      - listitem [ref=e16]:
        - generic [ref=e17]: "3."
        - generic [ref=e18]:
          - strong [ref=e19]: You decide
          - text: — apply the free kit yourself, or get the $147 Fix Pack.
    - generic [ref=e20]:
      - link "See the $147 Fix Pack →" [ref=e21] [cursor=pointer]:
        - /url: /#pricing
      - link "Run another audit" [ref=e22] [cursor=pointer]:
        - /url: /audit.html
    - paragraph [ref=e23]: 30-day money-back guarantee on the Fix Pack. No sales call. No obligation.
  - generic [ref=e25]:
    - generic [ref=e26]:
      - strong [ref=e27]: We respect your privacy.
      - paragraph [ref=e28]:
        - text: We use cookies to analyze traffic and improve your experience. No tracking for marketing or ad targeting.
        - link "Privacy Policy" [ref=e29] [cursor=pointer]:
          - /url: /privacy-policy
    - generic [ref=e30]:
      - button "Accept Analytics" [ref=e31] [cursor=pointer]
      - button "Decline" [ref=e32] [cursor=pointer]
```

# Test source

```ts
  5   | // All revenue + funnel pages served by the tunnel (excludes deprecated drafts part_before/part_after)
  6   | const PAGES = [
  7   |   '/',
  8   |   '/checkout.html',
  9   |   '/audit.html',
  10  |   '/audit-lander.html',
  11  |   '/thank-you.html',
  12  |   '/ai-ops-retainer.html',
  13  |   '/agency-partner.html',
  14  |   '/marketing-ops.html',
  15  | ];
  16  | 
  17  | function parseRGB(s: string): [number, number, number] {
  18  |   const m = s.match(/\d+/g)!.map(Number);
  19  |   return [m[0], m[1], m[2]];
  20  | }
  21  | function lum(r: number, g: number, b: number): number {
  22  |   const a = [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  23  |   return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  24  | }
  25  | function ratio(fg: string, bg: string): number {
  26  |   const [fr, fg2, fb] = parseRGB(fg);
  27  |   const [br, bg2, bb] = parseRGB(bg);
  28  |   return (Math.max(lum(fr, fg2, fb), lum(br, bg2, bb)) + 0.05) / (Math.min(lum(fr, fg2, fb), lum(br, bg2, bb)) + 0.05);
  29  | }
  30  | // Composite a possibly-transparent bg over the page bg rgb(8,9,10)
  31  | function composite(bg: string): string {
  32  |   if (bg.startsWith('rgba')) {
  33  |     const m = bg.match(/[\d.]+/g)!.map(Number);
  34  |     const [r, g, b, a] = m;
  35  |     return `rgb(${Math.round(r * a + 8 * (1 - a))}, ${Math.round(g * a + 9 * (1 - a))}, ${Math.round(b * a + 10 * (1 - a))})`;
  36  |   }
  37  |   return bg;
  38  | }
  39  | 
  40  | for (const pagePath of PAGES) {
  41  |   test(`PAGE ${pagePath}: visible + WCAG AA contrast`, async ({ page }) => {
  42  |     const pageErrors: string[] = [];
  43  |     page.on('pageerror', (e) => pageErrors.push(e.message));
  44  | 
  45  |     await page.goto(BASE_URL + pagePath + '?audit=' + Date.now(), { waitUntil: 'networkidle' });
  46  |     await page.waitForTimeout(4500);
  47  | 
  48  |     const height = await page.evaluate(() => document.body.scrollHeight);
  49  |     const vh = await page.evaluate(() => window.innerHeight);
  50  |     for (let y = 0; y < height; y += vh) {
  51  |       await page.evaluate((yy) => window.scrollTo(0, yy), y);
  52  |       await page.waitForTimeout(150);
  53  |     }
  54  |     await page.evaluate(() => window.scrollTo(0, 0));
  55  |     await page.waitForTimeout(400);
  56  | 
  57  |     const vis = await page.evaluate(() => {
  58  |       const sels = '.card, section, .how-step, h1, h2, h3, p, li, .pill, .badge, .btn, button, input, a, span, div';
  59  |       const bad: any[] = [];
  60  |       document.querySelectorAll(sels).forEach((el: any) => {
  61  |         const cs = getComputedStyle(el);
  62  |         if (cs.display === 'none' || cs.visibility === 'hidden') return;
  63  |         const op = parseFloat(cs.opacity);
  64  |         const r = el.getBoundingClientRect();
  65  |         if (r.width < 2 || r.height < 2) return;
  66  |         if (op < 0.95) {
  67  |           bad.push({ tag: el.tagName + (el.className ? '.' + String(el.className).split(' ')[0] : ''), op: op.toFixed(2), text: (el.textContent || '').trim().slice(0, 30) });
  68  |         }
  69  |       });
  70  |       return bad;
  71  |     });
  72  | 
  73  |     const contrast = await page.evaluate(() => {
  74  |       const out: any[] = [];
  75  |       document.querySelectorAll('*').forEach((el: any) => {
  76  |         const txt = el.textContent?.trim();
  77  |         if (!txt || el.children.length > 0) return;
  78  |         const cs = getComputedStyle(el);
  79  |         if (cs.visibility === 'hidden' || cs.display === 'none') return;
  80  |         let node: any = el, bg = 'rgb(8, 9, 10)';
  81  |         while (node) {
  82  |           const b = getComputedStyle(node).backgroundColor;
  83  |           if (b && b !== 'rgba(0, 0, 0, 0)' && b !== 'transparent') { bg = b; break; }
  84  |           node = node.parentElement;
  85  |         }
  86  |         out.push({ tag: el.tagName, text: txt.slice(0, 24), fg: cs.color, bg });
  87  |       });
  88  |       return out;
  89  |     });
  90  | 
  91  |     let contrastFails = 0;
  92  |     contrast.forEach((d) => {
  93  |       const realBg = composite(d.bg);
  94  |       const rat = ratio(d.fg, realBg);
  95  |       if (rat < 4.5) {
  96  |         contrastFails++;
  97  |         console.log(`[${pagePath}] CONTRAST FAIL ${d.tag} "${d.text}": ${rat.toFixed(2)}:1 fg=${d.fg} bg=${realBg}`);
  98  |       }
  99  |     });
  100 | 
  101 |     console.log(`[${pagePath}] VISIBILITY hidden=${vis.length} CONTRAST failures=${contrastFails} PAGE_ERRORS=${pageErrors.filter(e => !e.includes('rb2b') && !e.includes('ERR_NAME_NOT_RESOLVED')).length}`);
  102 |     if (vis.length) console.log(`[${pagePath}] HIDDEN: ` + vis.slice(0, 10).map((v: any) => `${v.tag}@${v.op} "${v.text}"`).join(' | '));
  103 | 
  104 |     expect(vis.length, `${pagePath} has hidden elements`).toBe(0);
> 105 |     expect(contrastFails, `${pagePath} contrast failures`).toBe(0);
      |                                                            ^ Error: /thank-you.html contrast failures
  106 |     expect(pageErrors.filter(e => !e.includes('rb2b') && !e.includes('ERR_NAME_NOT_RESOLVED')), `${pagePath} page errors`).toHaveLength(0);
  107 |   });
  108 | }
  109 | 
```