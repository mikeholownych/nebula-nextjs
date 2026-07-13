# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/all-pages-audit.spec.ts >> PAGE /audit-lander.html: visible + WCAG AA contrast
- Location: tests/all-pages-audit.spec.ts:40:7

# Error details

```
Error: /audit-lander.html page errors

expect(received).toHaveLength(expected)

Expected length: 0
Received length: 1
Received array:  ["Unexpected identifier 'll'"]
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - heading "97% of ad clicks don't convert. Your page is the leak." [level=1] [ref=e3]:
      - text: 97% of ad clicks don't convert.
      - emphasis [ref=e4]: Your page
      - text: is the leak.
    - paragraph [ref=e5]: "Paste your URL. In 60 seconds you get a scored teardown: exactly which 5 leaks are burning your ad budget — and how to fix each one."
    - generic [ref=e6]: 97% of ad clicks don't convert. Most founders buy more traffic. Smart ones fix the page first.
    - generic [ref=e7]:
      - generic [ref=e8]: No sales call
      - generic [ref=e9]: No hidden obligation
      - generic [ref=e10]: Private link in 60s
      - generic [ref=e11]: See a real audit ↓
      - generic [ref=e12]: Full refund if not satisfied
  - generic [ref=e13]:
    - link "📋 See a real audit report before you submit →" [ref=e14] [cursor=pointer]:
      - /url: /audit.html
    - generic [ref=e15]:
      - heading "What's included in your free audit full scope" [level=2] [ref=e16]:
        - text: What's included in your free audit
        - generic [ref=e17]: full scope
      - paragraph [ref=e18]: "No guesswork. Every audit scores these 5 dimensions and delivers a prioritized fix list tailored to your page:"
      - list [ref=e19]:
        - listitem [ref=e20]:
          - strong [ref=e21]: 1. Headline Clarity
          - text: — Does your headline name the visitor's problem or just describe your product? We score specificity, emotional resonance, and promise clarity.
        - listitem [ref=e22]:
          - strong [ref=e23]: 2. CTA Friction
          - text: — Is your call-to-action buried, vague, or competing with too many options? We measure actionability and visual prominence.
        - listitem [ref=e24]:
          - strong [ref=e25]: 3. Trust Proof
          - text: — Testimonials, case studies, logos, guarantees. We check if proof exists where the visitor needs it (before the decision, not after).
        - listitem [ref=e26]:
          - strong [ref=e27]: 4. Offer Specificity
          - text: — Does your page say exactly what happens when they click? Vague offers kill conversions. We flag generic language.
        - listitem [ref=e28]:
          - strong [ref=e29]: 5. Implementation Difficulty
          - text: — Can the fixes be done in 24h or do they need a redesign? We prioritize quick wins first.
      - paragraph [ref=e30]: "Plus: page speed score, mobile responsiveness check, ad-to-page alignment audit, and a prioritized opportunity matrix ranked by impact vs. effort."
    - generic [ref=e31]:
      - heading "See exactly what is leaking" [level=2] [ref=e32]
      - paragraph [ref=e33]: The audit checks 5 dimensions and delivers a prioritized fix list to your inbox. No sales call. No follow-up spam.
      - generic [ref=e34]:
        - generic [ref=e35]: Your landing page URL
        - textbox "Your landing page URL" [ref=e36]:
          - /placeholder: https://your-landing-page.com
        - generic [ref=e37]: Email for delivery
        - textbox "Email for delivery" [ref=e38]:
          - /placeholder: you@example.com
        - generic [ref=e39]: Primary conversion goal
        - combobox "Primary conversion goal" [ref=e40]:
          - option "Sales" [selected]
          - option "Leads"
          - option "Signups"
          - option "Bookings"
        - generic [ref=e41]: Monthly ad spend (helps us prioritize fixes)
        - combobox "Monthly ad spend (helps us prioritize fixes)" [ref=e42]:
          - option "Select if applicable" [selected]
          - option "$0 - $500/mo"
          - option "$500 - $2k/mo"
          - option "$2k - $10k/mo"
          - option "$10k+/mo"
        - paragraph [ref=e43]:
          - text: Your URL and email are used to generate, email, and log the audit. No resale. No spam.
          - link "Privacy Policy" [ref=e44] [cursor=pointer]:
            - /url: /privacy-policy
        - button "Run my free teardown →" [ref=e45] [cursor=pointer]
        - generic [ref=e46]: 🏷️ Full refund if the $97 fix doesn't improve your conversion rate
    - generic [ref=e47]:
      - generic [ref=e48]:
        - generic [ref=e49]: "01"
        - paragraph [ref=e50]: Paste your URL. No login, no extension, no account.
      - generic [ref=e51]:
        - generic [ref=e52]: "02"
        - paragraph [ref=e53]: AI scores 5 dimensions against a fixed conversion rubric.
      - generic [ref=e54]:
        - generic [ref=e55]: "03"
        - paragraph [ref=e56]: Private fix list + opportunity matrix lands in your inbox. 60 seconds total.
      - generic [ref=e57]:
        - generic [ref=e58]: "04"
        - paragraph [ref=e59]: "Optional: $97 ships the top fixes in 24h. Full refund if CVR doesn't improve."
    - generic [ref=e60]:
      - generic [ref=e61]: "\"The audit nailed exactly why my Google Ads weren't converting. Fixed the headline in 20 minutes. First conversion by end of week.\""
      - generic [ref=e62]: — Danny R., Founder, Repair & Square
    - generic [ref=e63]:
      - heading "$147 fix pack — zero risk, full refund guaranteed" [level=2] [ref=e64]:
        - text: $147 fix pack — zero risk, full refund
        - generic [ref=e65]: guaranteed
      - paragraph [ref=e66]: "After your free audit, you can buy the fix implementation. Here's exactly what that includes — and how we protect you:"
      - generic [ref=e67]:
        - generic [ref=e68]:
          - generic [ref=e69]: $147 one-time
          - generic [ref=e70]: 24-hour implementation
          - generic [ref=e71]: 📋 We duplicate your page — zero risk to live campaigns
        - generic [ref=e72]:
          - generic [ref=e73]: $0 if it doesn't work
          - generic [ref=e74]: Full refund guarantee
          - generic [ref=e75]: 📈 Full refund if your conversion rate doesn't improve within 14 days
      - paragraph [ref=e76]:
        - text: No call required. No retainer. No commitment beyond the fix.
        - link "Full FAQ →" [ref=e77] [cursor=pointer]:
          - /url: /primer.html
    - generic [ref=e78]:
      - heading "Data privacy — exactly what we access transparent" [level=2] [ref=e79]:
        - text: Data privacy — exactly what we access
        - generic [ref=e80]: transparent
      - paragraph [ref=e81]: "This is the #1 question founders ask. Here's the honest answer — no fine print:"
      - generic [ref=e82]:
        - generic [ref=e83]:
          - heading "✓ What we access" [level=3] [ref=e84]
          - list [ref=e85]:
            - listitem [ref=e86]: ✓Your landing page URL (public content only — same as visiting it in a browser)
            - listitem [ref=e87]: ✓Page HTML, meta tags, and inline content (what any visitor sees)
            - listitem [ref=e88]: ✓Your email address (for delivery — stored securely, never shared)
            - listitem [ref=e89]: ✓Conversion goal you select (to tailor the fix priority)
        - generic [ref=e90]:
          - heading "✗ What we NEVER access" [level=3] [ref=e91]
          - list [ref=e92]:
            - listitem [ref=e93]: ✗Your analytics dashboard or login credentials
            - listitem [ref=e94]: ✗Customer data, PII, or payment info
            - listitem [ref=e95]: ✗Your ad accounts (Google, Meta, LinkedIn)
            - listitem [ref=e96]: ✗Your CMS, backend, or server access
            - listitem [ref=e97]: ✗Cookies, sessions, or tracking data
      - paragraph [ref=e98]: The audit is a public-page analysis — the same data any visitor sees, scored against a conversion rubric. If you later buy the $97 fix and choose to share access for implementation, we sign a data processing agreement and provide a documented rollback plan before any work begins.
    - generic [ref=e99]:
      - generic [ref=e100]:
        - generic [ref=e101]: 60s
        - generic [ref=e102]: audit delivery time
      - generic [ref=e103]:
        - generic [ref=e104]: "5"
        - generic [ref=e105]: dimensions scored
      - generic [ref=e106]:
        - generic [ref=e107]: $0
        - generic [ref=e108]: no hidden upsell
    - paragraph [ref=e109]:
      - text: Questions?
      - link "ops@launchcrate.io" [ref=e110] [cursor=pointer]:
        - /url: mailto:ops@launchcrate.io
  - generic [ref=e112]:
    - generic [ref=e113]:
      - strong [ref=e114]: We respect your privacy.
      - paragraph [ref=e115]:
        - text: We use cookies to analyze traffic and improve your experience. No tracking for marketing or ad targeting.
        - link "Privacy Policy" [ref=e116] [cursor=pointer]:
          - /url: /privacy-policy
    - generic [ref=e117]:
      - button "Accept Analytics" [ref=e118] [cursor=pointer]
      - button "Decline" [ref=e119] [cursor=pointer]
```

# Test source

```ts
  5   | // All revenue + funnel pages served by the tunnel (excludes deprecated drafts part_before/part_after)
  6   | const PAGES = [
  7   |   '/',
  8   |   '/checkout.html',
  9   |   '/audit.html',
  10  |   '/audit-lander.html',
  11  |   '/ai-ops-retainer.html',
  12  |   '/agency-partner.html',
  13  |   '/marketing-ops.html',
  14  | ];
  15  | 
  16  | function parseRGB(s: string): [number, number, number] {
  17  |   const m = s.match(/\d+/g)!.map(Number);
  18  |   return [m[0], m[1], m[2]];
  19  | }
  20  | function lum(r: number, g: number, b: number): number {
  21  |   const a = [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  22  |   return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  23  | }
  24  | function ratio(fg: string, bg: string): number {
  25  |   const [fr, fg2, fb] = parseRGB(fg);
  26  |   const [br, bg2, bb] = parseRGB(bg);
  27  |   return (Math.max(lum(fr, fg2, fb), lum(br, bg2, bb)) + 0.05) / (Math.min(lum(fr, fg2, fb), lum(br, bg2, bb)) + 0.05);
  28  | }
  29  | // Composite a possibly-transparent bg over the page bg rgb(8,9,10)
  30  | function composite(bg: string): string {
  31  |   if (bg.startsWith('rgba')) {
  32  |     const m = bg.match(/[\d.]+/g)!.map(Number);
  33  |     const [r, g, b, a] = m;
  34  |     return `rgb(${Math.round(r * a + 8 * (1 - a))}, ${Math.round(g * a + 9 * (1 - a))}, ${Math.round(b * a + 10 * (1 - a))})`;
  35  |   }
  36  |   return bg;
  37  | }
  38  | 
  39  | for (const pagePath of PAGES) {
  40  |   test(`PAGE ${pagePath}: visible + WCAG AA contrast`, async ({ page }) => {
  41  |     const pageErrors: string[] = [];
  42  |     page.on('pageerror', (e) => pageErrors.push(e.message));
  43  | 
  44  |     await page.goto(BASE_URL + pagePath + '?audit=' + Date.now(), { waitUntil: 'networkidle' });
  45  |     await page.waitForTimeout(4500);
  46  | 
  47  |     const height = await page.evaluate(() => document.body.scrollHeight);
  48  |     const vh = await page.evaluate(() => window.innerHeight);
  49  |     for (let y = 0; y < height; y += vh) {
  50  |       await page.evaluate((yy) => window.scrollTo(0, yy), y);
  51  |       await page.waitForTimeout(150);
  52  |     }
  53  |     await page.evaluate(() => window.scrollTo(0, 0));
  54  |     await page.waitForTimeout(400);
  55  | 
  56  |     const vis = await page.evaluate(() => {
  57  |       const sels = '.card, section, .how-step, h1, h2, h3, p, li, .pill, .badge, .btn, button, input, a, span, div';
  58  |       const bad: any[] = [];
  59  |       document.querySelectorAll(sels).forEach((el: any) => {
  60  |         const cs = getComputedStyle(el);
  61  |         if (cs.display === 'none' || cs.visibility === 'hidden') return;
  62  |         const op = parseFloat(cs.opacity);
  63  |         const r = el.getBoundingClientRect();
  64  |         if (r.width < 2 || r.height < 2) return;
  65  |         if (op < 0.95) {
  66  |           bad.push({ tag: el.tagName + (el.className ? '.' + String(el.className).split(' ')[0] : ''), op: op.toFixed(2), text: (el.textContent || '').trim().slice(0, 30) });
  67  |         }
  68  |       });
  69  |       return bad;
  70  |     });
  71  | 
  72  |     const contrast = await page.evaluate(() => {
  73  |       const out: any[] = [];
  74  |       document.querySelectorAll('*').forEach((el: any) => {
  75  |         const txt = el.textContent?.trim();
  76  |         if (!txt || el.children.length > 0) return;
  77  |         const cs = getComputedStyle(el);
  78  |         if (cs.visibility === 'hidden' || cs.display === 'none') return;
  79  |         let node: any = el, bg = 'rgb(8, 9, 10)';
  80  |         while (node) {
  81  |           const b = getComputedStyle(node).backgroundColor;
  82  |           if (b && b !== 'rgba(0, 0, 0, 0)' && b !== 'transparent') { bg = b; break; }
  83  |           node = node.parentElement;
  84  |         }
  85  |         out.push({ tag: el.tagName, text: txt.slice(0, 24), fg: cs.color, bg });
  86  |       });
  87  |       return out;
  88  |     });
  89  | 
  90  |     let contrastFails = 0;
  91  |     contrast.forEach((d) => {
  92  |       const realBg = composite(d.bg);
  93  |       const rat = ratio(d.fg, realBg);
  94  |       if (rat < 4.5) {
  95  |         contrastFails++;
  96  |         console.log(`[${pagePath}] CONTRAST FAIL ${d.tag} "${d.text}": ${rat.toFixed(2)}:1 fg=${d.fg} bg=${realBg}`);
  97  |       }
  98  |     });
  99  | 
  100 |     console.log(`[${pagePath}] VISIBILITY hidden=${vis.length} CONTRAST failures=${contrastFails} PAGE_ERRORS=${pageErrors.filter(e => !e.includes('rb2b') && !e.includes('ERR_NAME_NOT_RESOLVED')).length}`);
  101 |     if (vis.length) console.log(`[${pagePath}] HIDDEN: ` + vis.slice(0, 10).map((v: any) => `${v.tag}@${v.op} "${v.text}"`).join(' | '));
  102 | 
  103 |     expect(vis.length, `${pagePath} has hidden elements`).toBe(0);
  104 |     expect(contrastFails, `${pagePath} contrast failures`).toBe(0);
> 105 |     expect(pageErrors.filter(e => !e.includes('rb2b') && !e.includes('ERR_NAME_NOT_RESOLVED')), `${pagePath} page errors`).toHaveLength(0);
      |                                                                                                                            ^ Error: /audit-lander.html page errors
  106 |   });
  107 | }
  108 | 
```