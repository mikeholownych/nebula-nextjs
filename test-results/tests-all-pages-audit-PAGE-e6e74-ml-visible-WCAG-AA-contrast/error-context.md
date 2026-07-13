# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/all-pages-audit.spec.ts >> PAGE /marketing-ops.html: visible + WCAG AA contrast
- Location: tests/all-pages-audit.spec.ts:41:7

# Error details

```
Error: /marketing-ops.html contrast failures

expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 47
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]: "N"
    - generic [ref=e4]: Nebula Components
  - generic [ref=e5]:
    - generic [ref=e6]:
      - generic [ref=e7]: AI Marketing Ops
      - heading "Your marketing engine, running 24/7 without you." [level=1] [ref=e8]:
        - text: Your marketing engine,
        - text: running 24/7 without you.
      - paragraph [ref=e9]: We deploy the same autonomous lead-gen + conversion stack we built for ourselves — running continuously for your business. No agency markup. No headcount. No Monday morning stand-ups.
      - generic [ref=e10]:
        - link "Talk to us →" [ref=e11] [cursor=pointer]:
          - /url: mailto:ops@launchcrate.io?subject=AI Marketing Ops inquiry
        - link "See pricing ↓" [ref=e12] [cursor=pointer]:
          - /url: "#pricing"
    - generic [ref=e13]:
      - generic [ref=e14]: What it is
      - heading "A full outbound + conversion loop — autonomous" [level=2] [ref=e15]
      - paragraph [ref=e16]: We run a multi-agent pipeline that continuously finds leads with active buying signals, reaches out with a useful artifact (a real audit of their page), and pushes qualified respondents toward your offer — all without human handoff.
    - generic [ref=e17]:
      - generic [ref=e18]: How it works
      - heading "The agent loop" [level=2] [ref=e19]
      - generic [ref=e20]:
        - generic [ref=e21]:
          - generic [ref=e22]: "1"
          - generic [ref=e23]:
            - strong [ref=e24]: Trigger detection
            - paragraph [ref=e25]: Agents scan Reddit, Upwork, LinkedIn, and Product Hunt 24/7 for founders posting buying signals — "my page isn't converting," "running ads with no ROI," "bounce rate too high."
        - generic [ref=e26]:
          - generic [ref=e27]: "2"
          - generic [ref=e28]:
            - strong [ref=e29]: ICP qualification
            - paragraph [ref=e30]: Every lead scored against your ICP — budget signals, company size, platform, vertical. Off-ICP leads discarded automatically.
        - generic [ref=e31]:
          - generic [ref=e32]: "3"
          - generic [ref=e33]:
            - strong [ref=e34]: Value-first outreach
            - paragraph [ref=e35]: Lead receives a personalized artifact — a real audit of their landing page with specific findings — before any pitch. Not a cold email. A free consult frame.
        - generic [ref=e36]:
          - generic [ref=e37]: "4"
          - generic [ref=e38]:
            - strong [ref=e39]: Auto follow-up + upsell
            - paragraph [ref=e40]: Responders are tracked. Non-buyers get a retainer pitch at 24h. Buyers get delivery confirmation + onboarding automatically.
        - generic [ref=e41]:
          - generic [ref=e42]: "5"
          - generic [ref=e43]:
            - strong [ref=e44]: Daily ops report
            - paragraph [ref=e45]: "Every morning you get a digest: leads contacted, replies received, proposals queued, revenue events logged. Nothing to manage."
    - generic [ref=e46]:
      - generic [ref=e47]: What's included
      - heading "Full stack, configured for your business" [level=2] [ref=e48]
      - generic [ref=e49]:
        - generic [ref=e50]:
          - generic [ref=e51]: 🔍
          - strong [ref=e52]: Trigger-aware lead scraper
          - paragraph [ref=e53]: Reddit, Upwork, LinkedIn — qualified by buying signal, not demographics
        - generic [ref=e54]:
          - generic [ref=e55]: 📊
          - strong [ref=e56]: Automated audit engine
          - paragraph [ref=e57]: 5-dimension page audit generated per lead, delivered as a personalized email
        - generic [ref=e58]:
          - generic [ref=e59]: ✉️
          - strong [ref=e60]: Outreach + follow-up sequences
          - paragraph [ref=e61]: Initial contact, retainer upsell, and digest — all autonomous via AgentMail
        - generic [ref=e62]:
          - generic [ref=e63]: 💳
          - strong [ref=e64]: Self-serve checkout pipeline
          - paragraph [ref=e65]: Stripe-linked delivery — buyer pays, receives deliverables automatically
        - generic [ref=e66]:
          - generic [ref=e67]: 📈
          - strong [ref=e68]: Lead state tracking
          - paragraph [ref=e69]: SQLite ledger — every lead tracked from discovery to paid, with full audit trail
        - generic [ref=e70]:
          - generic [ref=e71]: 🛡️
          - strong [ref=e72]: SRE + health monitoring
          - paragraph [ref=e73]: Cron health checks, dead letter queue, bounce handling, Telegram alerts
    - generic [ref=e74]:
      - generic [ref=e75]: Who it's for
      - heading "SMBs replacing manual marketing ops" [level=2] [ref=e76]
      - generic [ref=e77]:
        - generic [ref=e78]:
          - generic [ref=e79]: 🏢
          - generic [ref=e80]:
            - strong [ref=e81]: Agencies with a productized service
            - paragraph [ref=e82]: You have an offer. You just need a machine that finds buyers and books the work.
        - generic [ref=e83]:
          - generic [ref=e84]: 🚀
          - generic [ref=e85]:
            - strong [ref=e86]: SaaS companies running performance marketing
            - paragraph [ref=e87]: Outbound + landing page optimization running as a single autonomous loop.
        - generic [ref=e88]:
          - generic [ref=e89]: 🛒
          - generic [ref=e90]:
            - strong [ref=e91]: E-commerce brands spending on ads
            - paragraph [ref=e92]: Continuous CRO audit loop — catch conversion drops before they compound.
    - generic [ref=e93]:
      - generic [ref=e94]: Why not an agency
      - heading "Autonomous ops vs. traditional agency" [level=2] [ref=e95]
      - table [ref=e96]:
        - rowgroup [ref=e97]:
          - row "Factor Agency retainer Nebula AI Ops" [ref=e98]:
            - columnheader "Factor" [ref=e99]
            - columnheader "Agency retainer" [ref=e100]
            - columnheader "Nebula AI Ops" [ref=e101]
        - rowgroup [ref=e102]:
          - row "Monthly cost $3,000–$10,000 $497/mo" [ref=e103]:
            - cell "Monthly cost" [ref=e104]
            - cell "$3,000–$10,000" [ref=e105]
            - cell "$497/mo" [ref=e106]
          - row "Lead gen Manual SDR team Autonomous, 24/7" [ref=e107]:
            - cell "Lead gen" [ref=e108]
            - cell "Manual SDR team" [ref=e109]
            - cell "Autonomous, 24/7" [ref=e110]
          - row "Outreach personalization Templates + bulk sends Per-lead artifact (real audit)" [ref=e111]:
            - cell "Outreach personalization" [ref=e112]
            - cell "Templates + bulk sends" [ref=e113]
            - cell "Per-lead artifact (real audit)" [ref=e114]
          - row "Reporting Monthly PDF deck Daily digest, real data" [ref=e115]:
            - cell "Reporting" [ref=e116]
            - cell "Monthly PDF deck" [ref=e117]
            - cell "Daily digest, real data" [ref=e118]
          - row "Human required Account manager + weekly calls None (escalation only)" [ref=e119]:
            - cell "Human required" [ref=e120]
            - cell "Account manager + weekly calls" [ref=e121]
            - cell "None (escalation only)" [ref=e122]
          - row "Setup time 4–8 weeks onboarding 1 week" [ref=e123]:
            - cell "Setup time" [ref=e124]
            - cell "4–8 weeks onboarding" [ref=e125]
            - cell "1 week" [ref=e126]
    - generic [ref=e127]:
      - generic [ref=e128]: Pricing
      - heading "One flat monthly rate" [level=2] [ref=e129]
      - generic [ref=e130]:
        - generic [ref=e131]:
          - generic [ref=e132]: $497
          - generic [ref=e133]: /month
        - generic [ref=e134]: "No contract. Cancel any time. Setup fee: $0."
        - list [ref=e135]:
          - listitem [ref=e136]:
            - generic [ref=e137]: ✓
            - text: Full trigger-aware lead scraper (Reddit + Upwork + LinkedIn)
          - listitem [ref=e138]:
            - generic [ref=e139]: ✓
            - text: Automated audit generation + outreach emails
          - listitem [ref=e140]:
            - generic [ref=e141]: ✓
            - text: Retainer upsell + follow-up sequences
          - listitem [ref=e142]:
            - generic [ref=e143]: ✓
            - text: Self-serve Stripe checkout + automated delivery
          - listitem [ref=e144]:
            - generic [ref=e145]: ✓
            - text: Lead state DB + daily ops digest
          - listitem [ref=e146]:
            - generic [ref=e147]: ✓
            - text: SRE health monitoring + Telegram alerts
          - listitem [ref=e148]:
            - generic [ref=e149]: ✓
            - text: 1-week setup + handover documentation
          - listitem [ref=e150]:
            - generic [ref=e151]: ✓
            - text: Monthly strategy call (optional, 30 min)
        - link "Get started — email us →" [ref=e152] [cursor=pointer]:
          - /url: mailto:ops@launchcrate.io?subject=AI Marketing Ops — let%27s talk
        - paragraph [ref=e153]: We onboard 2–3 clients/month. Reply and we'll confirm availability.
    - generic [ref=e154]:
      - generic [ref=e155]: FAQ
      - heading "Common questions" [level=2] [ref=e156]
      - generic [ref=e157]:
        - generic [ref=e158]:
          - strong [ref=e159]: Is this just a SaaS tool I configure myself?
          - paragraph [ref=e160]: No. We deploy, configure, and operate the full pipeline for your business. You receive daily reports. We handle everything else.
        - generic [ref=e161]:
          - strong [ref=e162]: What do I need to provide?
          - paragraph [ref=e163]: Your offer URL, your ICP definition, and your Stripe account. We handle scraping, outreach infrastructure, audit generation, and delivery.
        - generic [ref=e164]:
          - strong [ref=e165]: How many leads does it generate per month?
          - paragraph [ref=e166]: "Depends on your ICP density. Typical range: 30–150 qualified leads/month contacted. We track reply rate and iterate on messaging."
        - generic [ref=e167]:
          - strong [ref=e168]: What if I already have a CRM?
          - paragraph [ref=e169]: We export lead data as JSON/CSV daily. HubSpot/Airtable webhook integration available on request.
        - generic [ref=e170]:
          - strong [ref=e171]: Do I need to approve every outreach email?
          - paragraph [ref=e172]: No. The pipeline is autonomous. You can review the proposals queue before submission if preferred — that's a config toggle.
        - generic [ref=e173]:
          - strong [ref=e174]: What's the cancellation policy?
          - paragraph [ref=e175]: Cancel any time. No long-term contract. Your data is exported and handed off on cancel.
    - generic [ref=e176]:
      - heading "Ready to run on autopilot?" [level=2] [ref=e177]
      - paragraph [ref=e178]: Email us and we'll confirm availability. Onboarding takes 1 week.
      - link "ops@launchcrate.io →" [ref=e179] [cursor=pointer]:
        - /url: mailto:ops@launchcrate.io?subject=AI Marketing Ops — let%27s talk
```

# Test source

```ts
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
  104 |     expect(vis.length, `${pagePath} has hidden elements`).toBe(0);
> 105 |     expect(contrastFails, `${pagePath} contrast failures`).toBe(0);
      |                                                            ^ Error: /marketing-ops.html contrast failures
  106 |     expect(pageErrors.filter(e => !e.includes('rb2b') && !e.includes('ERR_NAME_NOT_RESOLVED')), `${pagePath} page errors`).toHaveLength(0);
  107 |   });
  108 | }
  109 | 
```