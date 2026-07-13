# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/all-pages-audit.spec.ts >> PAGE /audit.html: visible + WCAG AA contrast
- Location: tests/all-pages-audit.spec.ts:41:7

# Error details

```
Error: /audit.html has hidden elements

expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 1
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - heading "Sample Landing Page Audit" [level=1] [ref=e3]
    - paragraph [ref=e4]:
      - text: This is the exact format you'll receive for your own page.
      - link "Run your free audit →" [ref=e5] [cursor=pointer]:
        - /url: /audit
  - main [ref=e6]:
    - generic [ref=e7]:
      - strong [ref=e8]: This is a real audit format.
      - text: The scores and fixes below are from a sample page.
      - link "Get your own audit →" [ref=e9] [cursor=pointer]:
        - /url: /audit
      - text: — your URL gets scored in 60 seconds, no account required.
    - generic [ref=e10]:
      - heading "Audit Summary" [level=2] [ref=e11]
      - paragraph [ref=e12]:
        - strong [ref=e13]: "Overall Score:"
        - text: "6.8/10 (Grade: C)"
      - paragraph [ref=e14]:
        - text: This page converts but has 2 significant leaks costing you leads. At $5K/mo in ad spend, the headline and CTA alone are wasting an estimated
        - strong [ref=e15]: $850–$1,700/mo
        - text: .
    - generic [ref=e16]:
      - heading "Dimension Scores" [level=2] [ref=e17]
      - list [ref=e18]:
        - listitem [ref=e19]:
          - strong [ref=e20]: "Headline Clarity:"
          - text: 5/10 — Describes the product, not the problem your buyer feels.
        - listitem [ref=e21]:
          - strong [ref=e22]: "CTA Actionability:"
          - text: 4/10 — Generic button text ("Learn more") — no outcome, no urgency.
        - listitem [ref=e23]:
          - strong [ref=e24]: "Trust Proof:"
          - text: 7/10 — Testimonials present but below the fold; visitor decides before they see them.
        - listitem [ref=e25]:
          - strong [ref=e26]: "Page Speed:"
          - text: 8/10 — Good Core Web Vitals.
        - listitem [ref=e27]:
          - strong [ref=e28]: "Mobile Responsiveness:"
          - text: 9/10 — Works well on mobile.
    - generic [ref=e29]:
      - heading "Top 5 Priority Fixes" [level=2] [ref=e30]
      - list [ref=e31]:
        - listitem [ref=e32]:
          - strong [ref=e33]: "Headline clarity:"
          - text: "Replace product-description language with buyer-outcome language. Difficulty: low, copy-only."
        - listitem [ref=e34]:
          - strong [ref=e35]: "CTA specificity:"
          - text: "Change vague CTAs like \"Learn more\" to action + outcome copy. Difficulty: low."
        - listitem [ref=e36]:
          - strong [ref=e37]: "Trust gap:"
          - text: "Add proof before the first major ask: customers, screenshots, numbers, guarantees, or credible process details. Difficulty: medium."
        - listitem [ref=e38]:
          - strong [ref=e39]: "Offer specificity:"
          - text: "State what the buyer gets, when they get it, and what happens after they click. Difficulty: low."
        - listitem [ref=e40]:
          - strong [ref=e41]: "Friction:"
          - text: "Reduce unnecessary fields and explain privacy near the form. Difficulty: low."
    - generic [ref=e42]:
      - heading "How your audit will differ" [level=2] [ref=e43]
      - paragraph [ref=e44]: "Your audit is scored against your specific page, traffic source, and conversion goal. It includes:"
      - list [ref=e45]:
        - listitem [ref=e46]: Scores calibrated to your industry and audience
        - listitem [ref=e47]: Dollar-figured waste estimate based on your ad spend
        - listitem [ref=e48]: Opportunity matrix ranked by impact vs. effort
        - listitem [ref=e49]: Quick wins you can implement in 24 hours
        - listitem [ref=e50]: Personalized follow-up question based on your role
    - generic [ref=e51]:
      - 'heading "Next step: $147 fix implementation" [level=2] [ref=e52]'
      - paragraph [ref=e53]: "After your free audit, you can buy the fix pack. Here's what makes it risk-free:"
      - list [ref=e54]:
        - listitem [ref=e55]:
          - strong [ref=e56]: Page duplicated for testing
          - text: — zero risk to your live campaigns
        - listitem [ref=e57]:
          - strong [ref=e58]: Full refund
          - text: if your conversion rate doesn't improve within 14 days
        - listitem [ref=e59]:
          - strong [ref=e60]: No call required
          - text: — everything ships via email
        - listitem [ref=e61]:
          - strong [ref=e62]: Documented rollback
          - text: — one-click revert if you don't like the changes
      - generic [ref=e63]: 🏷️ Full refund if your conversion rate doesn't improve. No questions asked.
      - link "Run my free audit →" [ref=e64] [cursor=pointer]:
        - /url: /audit
      - link "Free DIY fix kit" [ref=e65] [cursor=pointer]:
        - /url: /checkout.html
    - generic [ref=e66]:
      - heading "Data privacy — what this audit accesses" [level=2] [ref=e67]
      - paragraph [ref=e68]:
        - text: Your audit analyzes only the
        - strong [ref=e69]: public HTML content
        - text: of your page — the same data any visitor sees. We
        - strong [ref=e70]: never
        - text: access your analytics, ad accounts, CMS, customer data, or server. Your email is used only for delivery and never shared.
      - paragraph [ref=e71]:
        - text: Full data policy at
        - link "nebulacomponents.shop/audit →" [ref=e72] [cursor=pointer]:
          - /url: /audit#data-privacy
  - generic [ref=e74]:
    - generic [ref=e75]:
      - strong [ref=e76]: We respect your privacy.
      - paragraph [ref=e77]:
        - text: We use cookies to analyze traffic and improve your experience. No tracking for marketing or ad targeting.
        - link "Privacy Policy" [ref=e78] [cursor=pointer]:
          - /url: /privacy-policy
    - generic [ref=e79]:
      - button "Accept Analytics" [ref=e80] [cursor=pointer]
      - button "Decline" [ref=e81] [cursor=pointer]
```

# Test source

```ts
  4   | 
  5   | // All revenue + funnel pages served by the tunnel
  6   | const PAGES = [
  7   |   '/',
  8   |   '/checkout.html',
  9   |   '/audit.html',
  10  |   '/audit-lander.html',
  11  |   '/ai-ops-retainer.html',
  12  |   '/agency-partner.html',
  13  |   '/marketing-ops.html',
  14  |   '/part_after.html',
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
> 104 |     expect(vis.length, `${pagePath} has hidden elements`).toBe(0);
      |                                                           ^ Error: /audit.html has hidden elements
  105 |     expect(contrastFails, `${pagePath} contrast failures`).toBe(0);
  106 |     expect(pageErrors.filter(e => !e.includes('rb2b') && !e.includes('ERR_NAME_NOT_RESOLVED')), `${pagePath} page errors`).toHaveLength(0);
  107 |   });
  108 | }
  109 | 
```