# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/color-contrast.spec.ts >> Color Contrast & Visual Inspection >> screenshot full page for visual inspection
- Location: tests/color-contrast.spec.ts:22:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.screenshot: Test timeout of 30000ms exceeded.
Call log:
  - taking page screenshot
  - waiting for fonts to load...
  - fonts loaded

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - paragraph [ref=e4]: You're probably thinking
      - generic [ref=e5]:
        - generic [ref=e6]: "\"This is just another AI tool that gives me a vague score and calls it an audit.\""
        - generic [ref=e7]: "\"I've already tested three different headlines. Nothing moved the number.\""
        - generic [ref=e8]: "\"I paid an agency for 3 months. They said it needed more time. I'm done paying for patience.\""
      - paragraph [ref=e9]:
        - text: If any of that landed —
        - strong [ref=e10]: you're exactly who this is for.
        - text: 60 seconds. No pitch. The exact leak, ranked by dollar cost. That's it.
    - heading "4% CTR. 0% conversion. Here’s where it breaks." [level=1] [ref=e11]:
      - text: 4% CTR. 0% conversion.
      - generic [ref=e12]:
        - emphasis [ref=e13]: Here’s where it breaks.
        - img
    - paragraph [ref=e14]: Your ad spend is leaking somewhere between the click and the checkout. This finds the exact gap, estimates the monthly dollar cost, and gives you the fix. 60 seconds. $0. No testing phase. No agency.
    - generic [ref=e15]:
      - text: 97% of ad clicks don't convert.
      - strong [ref=e16]: Most vendors sell you more traffic. We tell you the specific dollar amount burning on your page — then fix it.
    - generic [ref=e17]:
      - strong [ref=e18]: We audited 200+ landing pages that burned $10k+ in ads with zero conversions.
      - text: Same 5 leaks every time. Fixable in 24 hours. This finds yours.
    - generic [ref=e19]:
      - text: ChatGPT links out 0.7% of the time. The other 99.3% it just names a brand.
      - strong [ref=e20]: Your competitors are the answer. You're not. That's a visibility leak that costs you deals before they reach your landing page.
      - link "Check AI citation →" [ref=e21] [cursor=pointer]:
        - /url: /audit
    - generic [ref=e22]: No testing phase. No 3-month retainer. No discovery call. Paste your URL, see your leak, buy the fix if you want it. That's the whole thing.
    - generic [ref=e23]:
      - generic [ref=e24]: No sales call
      - generic [ref=e25]: No hidden obligation
      - generic [ref=e26]: URL used only for audit
      - generic [ref=e27]: Full refund if not satisfied
      - generic [ref=e28]: We duplicate your page
    - generic [ref=e29]:
      - link "Run my free audit →" [ref=e30] [cursor=pointer]:
        - /url: "#audit-form-card"
      - paragraph [ref=e31]: Free · 60 seconds · no account required
    - generic [ref=e32]:
      - text: Scored 40+ ad-funded landing pages · avg 3.1 leak categories found per audit ·
      - strong [ref=e33]: avg reply <60 min, 24/7
    - navigation [ref=e34]:
      - link "How it works" [ref=e35] [cursor=pointer]:
        - /url: "#how-it-works"
      - link "Compare" [ref=e36] [cursor=pointer]:
        - /url: /compare/landing-page-audit-tools.html
      - link "Fix pack" [ref=e37] [cursor=pointer]:
        - /url: "#pricing"
      - link "Reviews" [ref=e38] [cursor=pointer]:
        - /url: "#testimonials"
      - link "Run my free audit →" [ref=e39] [cursor=pointer]:
        - /url: "#audit-form-card"
  - generic [ref=e41]:
    - generic [ref=e42]:
      - generic [ref=e44]: "0"
      - generic [ref=e45]: pages scored
    - generic [ref=e47]:
      - generic [ref=e49]: "0"
      - generic [ref=e50]:
        - text: avg leak categories
        - text: found per audit
    - generic [ref=e52]:
      - generic [ref=e54]:
        - text: <60
        - generic [ref=e55]: min
      - generic [ref=e56]: avg response, 24/7
    - generic [ref=e58]:
      - generic [ref=e60]: $147
      - generic [ref=e61]:
        - text: full implementation,
        - text: no call required
  - main [ref=e62]:
    - generic [ref=e63]:
      - heading "Sound familiar?" [level=2] [ref=e64]
      - generic [ref=e65]:
        - generic [ref=e66]:
          - paragraph [ref=e67]: Without a teardown
          - paragraph [ref=e68]: ❌ You buy more traffic hoping something changes
          - paragraph [ref=e69]: ❌ You rewrite the headline. Same result.
          - paragraph [ref=e70]: ❌ 4% CTR. 0% conversion. No idea why.
          - paragraph [ref=e71]: ❌ Your agency says "needs more time"
          - paragraph [ref=e72]: ❌ You kill the campaign before finding the real leak
        - generic [ref=e73]:
          - paragraph [ref=e74]: After 60 seconds here
          - paragraph [ref=e75]: ✅ Know which fix pays back fastest — ranked priority, not a 40-item list
          - paragraph [ref=e76]: ✅ Stop guessing — scored across 5 dimensions so you know exactly what broke
          - paragraph [ref=e77]: ✅ In your inbox before your next ad spend — 30 seconds to submit, 60 seconds back
    - generic [ref=e78]:
      - heading "Who is this for?" [level=2] [ref=e79]
      - paragraph [ref=e80]: One tool. Two use cases.
      - generic [ref=e81]:
        - generic [ref=e82]:
          - generic [ref=e83]: 🚀
          - paragraph [ref=e84]: Founders running paid traffic
          - paragraph [ref=e85]:
            - text: You have a working funnel but your landing page is the leak. Clicks come in, conversions don't. You need to know
            - emphasis [ref=e86]: exactly
            - text: what's broken before you spend another dollar.
          - list [ref=e87]:
            - listitem [ref=e88]: ✅ Free scored teardown → inbox in 60s
            - listitem [ref=e89]: "✅ $147 Fix Pack: rewritten copy + step-by-step fixes"
            - listitem [ref=e90]: ✅ No agency. No retainer. No call.
          - link "Run my free audit →" [ref=e91] [cursor=pointer]:
            - /url: "#audit-form-card"
        - generic [ref=e92]:
          - generic [ref=e93]: 🏢
          - paragraph [ref=e94]: Agencies & consultants
          - paragraph [ref=e95]: You work with clients running paid ads. Add a conversion audit to your discovery process — or white-label the output. Runs in 60 seconds per URL, scales to your whole book.
          - list [ref=e96]:
            - listitem [ref=e97]: ✅ Credible, data-backed audit report for every client
            - listitem [ref=e98]: ✅ Sell the fix pack as a $147 quick-win upsell
            - listitem [ref=e99]: ✅ No setup. Audit any URL instantly.
          - link "Talk to us about volume →" [ref=e100] [cursor=pointer]:
            - /url: "#audit-form-card"
    - generic [ref=e101]:
      - heading "How it works" [level=2] [ref=e102]
      - paragraph [ref=e103]: Three steps. Under 5 minutes total.
      - generic [ref=e104]:
        - generic [ref=e105]:
          - generic [ref=e106]: "1"
          - paragraph [ref=e107]: Paste your URL
          - paragraph [ref=e108]: Drop your landing page URL + email below. Takes 30 seconds.
        - generic [ref=e109]:
          - generic [ref=e110]: "2"
          - paragraph [ref=e111]: Get your scored audit
          - paragraph [ref=e112]: 5 dimensions scored. Top leaks ranked. Free fix kit in your inbox in 60 seconds.
        - generic [ref=e113]:
          - generic [ref=e114]: "3"
          - paragraph [ref=e115]: Fix it or hand it off
          - paragraph [ref=e116]: "Use the free kit yourself — or get the $147 Fix Pack: rewritten copy, delivered in 72h."
    - generic [ref=e117]:
      - heading "Run the free audit. See exactly where your page leaks." [level=2] [ref=e118]
      - paragraph [ref=e119]: The more context you give, the more surgical the audit. Two required fields. Everything else sharpens the diagnosis.
      - generic [ref=e120]:
        - generic [ref=e121]: Landing page URL (the exact page taking ad traffic)
        - textbox "Landing page URL (the exact page taking ad traffic)" [ref=e122]:
          - /placeholder: https://your-landing-page.com
        - generic [ref=e123]: Email for delivery (audit arrives in <60 seconds)
        - textbox "Email for delivery (audit arrives in <60 seconds)" [ref=e124]:
          - /placeholder: you@example.com
        - generic [ref=e125]: What is this page supposed to do?
        - combobox "What is this page supposed to do?" [ref=e126] [cursor=pointer]:
          - option "Get a sale — visitor should pay on this page" [selected]
          - option "Capture a lead — visitor should leave an email or number"
          - option "Book a call — visitor should schedule time"
          - option "Drive a signup — visitor should create an account"
        - generic [ref=e127]: Who lands here? (optional — sharpens the headline and CTA analysis)
        - textbox "Who lands here? (optional — sharpens the headline and CTA analysis)" [ref=e128]:
          - /placeholder: e.g. overwhelmed founders running paid ads, $5K+/mo spend
        - generic [ref=e129]: What feeling should the page give? (optional)
        - textbox "What feeling should the page give? (optional)" [ref=e130]:
          - /placeholder: e.g. calm and premium, or urgent and direct, or technical and trusted
        - generic [ref=e131]: Your role (optional — changes the follow-up question)
        - combobox "Your role (optional — changes the follow-up question)" [ref=e132] [cursor=pointer]:
          - option "Prefer not to say" [selected]
          - option "Founder / CEO / Owner"
          - option "Marketer / Growth / Ads"
          - option "Agency / Freelancer / Consultant"
          - option "Developer / Engineer"
        - generic [ref=e133]: Monthly ad spend (optional — sizes the waste estimate)
        - combobox "Monthly ad spend (optional — sizes the waste estimate)" [ref=e134] [cursor=pointer]:
          - option "Prefer not to say" [selected]
          - option "Under $500/mo"
          - option "$500–$1K/mo"
          - option "$1K–$5K/mo"
          - option "$5K–$10K/mo"
          - option "$10K–$20K/mo"
          - option "$20K+/mo"
        - paragraph [ref=e135]: Your URL and email are used to generate, email, and log the audit. No resale. No spam.
        - paragraph [ref=e136]: ✓ 40+ audits delivered · avg score back in 60s · full refund if CVR doesn't improve
        - paragraph [ref=e137]:
          - link "📋 See a real audit report before you submit →" [ref=e138] [cursor=pointer]:
            - /url: /audit.html
        - button "Get Your Free Audit Now →" [ref=e139] [cursor=pointer]
    - generic [ref=e140]:
      - generic [ref=e141]:
        - generic [ref=e142]:
          - generic [ref=e143]: Audit grade
          - generic [ref=e144]: C
        - generic [ref=e145]:
          - generic [ref=e146]: Overall score
          - generic [ref=e147]: 5.8/10
      - generic [ref=e148]:
        - generic [ref=e149]:
          - generic [ref=e150]: 🎯 Clarity
          - generic [ref=e153]: "7"
        - generic [ref=e154]:
          - generic [ref=e155]: 🖱️ CTA friction
          - generic [ref=e158]: "5"
        - generic [ref=e159]:
          - generic [ref=e160]: 🤝 Trust gap
          - generic [ref=e163]: "5"
        - generic [ref=e164]:
          - generic [ref=e165]: 📦 Offer specificity
          - generic [ref=e168]: "8"
        - generic [ref=e169]:
          - generic [ref=e170]: 🔧 Implementation difficulty
          - generic [ref=e173]: "8"
      - generic [ref=e174]:
        - generic [ref=e175]: Top 3 prioritized fixes
        - generic [ref=e176]:
          - generic [ref=e177]: copy
          - generic [ref=e178]: Hero describes product features, not buyer outcome → rewrite for result
        - generic [ref=e179]:
          - generic [ref=e180]: cta
          - generic [ref=e181]: No visible CTA above the fold → add action + benefit button
        - generic [ref=e182]:
          - generic [ref=e183]: tracking
          - generic [ref=e184]: No FB Pixel or GA4 detected → install conversion tracking
      - generic [ref=e185]:
        - link "Run my free audit →" [ref=e186] [cursor=pointer]:
          - /url: "#audit-form-card"
        - generic [ref=e187]: Takes 60 seconds. No account needed.
    - generic [ref=e188]:
      - heading "Sample fix from a real audit" [level=2] [ref=e189]
      - paragraph [ref=e190]:
        - strong [ref=e191]: "Problem:"
        - text: Hero headline describes what the product is, not what the buyer gets.
      - paragraph [ref=e192]:
        - strong [ref=e193]: "Why it matters:"
        - text: Cold visitors decide in under 5 seconds whether the page is for them. A feature headline loses 40-60% of them before they scroll.
      - paragraph [ref=e194]:
        - strong [ref=e195]: "Fix:"
        - text: Replace "AI workflow platform for teams" with "Turn messy customer messages into support-ready replies in 30 seconds."
      - paragraph [ref=e196]:
        - strong [ref=e197]: "Difficulty:"
        - text: Low — copy-only.
        - strong [ref=e198]: "Priority:"
        - text: 9/10.
      - paragraph [ref=e199]: "Every dimension in the audit returns the same structure: evidence → why it matters → the exact fix → difficulty rating."
    - generic [ref=e200]:
      - heading "What the audit scores" [level=2] [ref=e201]
      - generic [ref=e202]:
        - generic [ref=e203]:
          - strong [ref=e204]: 🎯 Clarity
          - text: Can a stranger explain the offer in 5 seconds?
        - generic [ref=e205]:
          - strong [ref=e206]: 🖱️ CTA friction
          - text: Is the next action obvious and zero-risk?
        - generic [ref=e207]:
          - strong [ref=e208]: 🤝 Trust gap
          - text: Is proof visible before the ask?
        - generic [ref=e209]:
          - strong [ref=e210]: 📦 Offer specificity
          - text: Does the page say what buyers get and when?
        - generic [ref=e211]:
          - strong [ref=e212]: 🔧 Implementation difficulty
          - text: Copy-only, layout, technical, or unsupported.
    - generic [ref=e213]:
      - generic [ref=e214]:
        - generic [ref=e215]: Free — instant access
        - heading "🎁 Landing Page Fix Kit" [level=2] [ref=e216]
        - generic [ref=e217]: $0
        - paragraph [ref=e218]: For founders who want to apply fixes themselves today. The audit-to-implementation checklist in 5 pages.
        - generic [ref=e219]:
          - textbox "you@example.com" [ref=e220]
          - button "Download Your Free Fix Kit →" [ref=e221] [cursor=pointer]
        - list [ref=e222]:
          - listitem [ref=e223]: 5-step audit-to-fix checklist
          - listitem [ref=e224]: Headline rewrite prompts (3 templates)
          - listitem [ref=e225]: CTA and trust-section copy templates
          - listitem [ref=e226]: FAQ block templates with examples
          - listitem [ref=e227]: Delivered instantly to your inbox
        - paragraph [ref=e228]: No spam. Unsubscribe anytime. Your email is used only to send the kit and occasional follow-up resources you can opt out of.
      - generic [ref=e229]:
        - generic [ref=e230]: Most popular
        - generic [ref=e231]: 30-minute refund
        - heading "💥 Conversion Fix Pack" [level=2] [ref=e232]
        - generic [ref=e233]: $490 $147 one-time
        - paragraph [ref=e234]: Your audit → turned into implementation-ready fixes. Hero, CTA, trust proof, offer, FAQ — rewritten and prioritized.
        - generic [ref=e235]:
          - generic [ref=e236]:
            - paragraph [ref=e237]: "Stack value: $490 → $147"
            - list [ref=e238]:
              - listitem [ref=e239]:
                - generic [ref=e240]: Rewritten conversion copy
                - generic [ref=e241]: $150
              - listitem [ref=e242]:
                - generic [ref=e243]: Prioritized fix list w/ difficulty
                - generic [ref=e244]: $100
              - listitem [ref=e245]:
                - generic [ref=e246]: Step-by-step implementation
                - generic [ref=e247]: $120
              - listitem [ref=e248]:
                - generic [ref=e249]: One revision pass
                - generic [ref=e250]: $60
              - listitem [ref=e251]:
                - generic [ref=e252]: Direct implementation option
                - generic [ref=e253]: $60
            - paragraph [ref=e254]: You pay $147 because the audit tool makes it efficient to produce at scale. The value is real.
          - paragraph [ref=e255]: "Your fix pack week:"
          - generic [ref=e256]:
            - generic [ref=e257]:
              - generic [ref=e258]: Mon
              - text: Audit lands
            - generic [ref=e259]:
              - generic [ref=e260]: Wed
              - text: Fix pack sent
            - generic [ref=e261]:
              - generic [ref=e262]: Fri
              - text: Results check
          - generic [ref=e263]: → Then you buy and your fix is in your inbox within 72h
        - paragraph [ref=e264]: No production changes without your go-ahead. Safe fallback artifact if direct implementation is unsupported. One reasonable revision included.
        - link "Get the Conversion Fix Pack →" [ref=e265] [cursor=pointer]:
          - /url: https://buy.stripe.com/aFa7sL5E03Iwgyt2Nk43S02
        - generic [ref=e266]:
          - img "Visa" [ref=e267]:
            - generic [ref=e269]: VISA
          - img "Mastercard" [ref=e270]
          - img "Stripe" [ref=e275]:
            - generic [ref=e277]: stripe
          - generic [ref=e278]:
            - img [ref=e279]
            - text: 256-bit SSL
        - generic [ref=e282]:
          - generic [ref=e283]: 🛡
          - generic [ref=e284]:
            - text: 30-min or 30-day refund. No reason. No questions.
            - link "Full policy ↓" [ref=e285] [cursor=pointer]:
              - /url: "#guarantee"
    - generic [ref=e286]:
      - generic [ref=e287]: New — AI Ops Retainer
      - heading "Protect the savings. Stop redoing discovery." [level=2] [ref=e288]
      - paragraph [ref=e289]:
        - text: Your audit proved a real dollar leak. That number stays real only if someone watches the page — month after month.
        - strong [ref=e290]: $1,497/mo
        - text: for monitoring, iteration, and AI governance. 3-month pilot. No long-term contract.
      - link "Learn more →" [ref=e291] [cursor=pointer]:
        - /url: mailto:ops@launchcrate.io?subject=Retainer inquiry
      - paragraph [ref=e292]:
        - text: "Agencies:"
        - link "email us about white-label →" [ref=e293] [cursor=pointer]:
          - /url: mailto:ops@launchcrate.io?subject=Agency inquiry
    - generic [ref=e294]:
      - heading "Before you ask" [level=2] [ref=e295]
      - generic [ref=e296]:
        - strong [ref=e297]: Why is the Fix Pack only $147? That seems cheap.
        - paragraph [ref=e298]: Because the audit does the heavy lifting. We don't charge for discovery calls, account research, or "brand strategy." You give us the audit URL, we find the leaks, we write the fixes. No overhead, no meetings, no delays.
      - generic [ref=e299]:
        - strong [ref=e300]: If this works so well, why don't you sell it for more?
        - paragraph [ref=e301]: We do. The $147 fix pack is the entry point. The Growth Launch ($997) includes implementation deployment, monitoring, and a 60-day "no customer, we work free" guarantee. This page exists because $147 removes the "should I think about it?" hesitation. You can see if our output is real for the price of a nice dinner.
      - generic [ref=e302]:
        - strong [ref=e303]: $490 crossed out — did it ever cost that?
        - paragraph [ref=e304]: "That is the value of the deliverables you get: rewritten conversion copy ($150), prioritized fix list ($100), implementation instructions ($120), one revision ($60), and direct implementation option ($60). You're paying $147 for the bundle because the audit tool makes it efficient to produce at scale. The value is real even if the line-item prices are estimates."
      - generic [ref=e305]:
        - strong [ref=e306]: Is this just AI-generated fluff?
        - paragraph [ref=e307]: "The audit follows a fixed conversion rubric — 5 dimensions, each scored against visible page evidence. The output is not a \"make it pop\" paragraph. It is: evidence → why it matters → the exact fix → difficulty rating. You can verify every recommendation against your own page in under 30 seconds."
      - generic [ref=e308]:
        - strong [ref=e309]: What if you can't implement the fix (Shopify, Webflow, etc.)?
        - paragraph [ref=e310]: We return rewritten copy, layout recommendations, and step-by-step implementation instructions. If your platform is one we configure directly (Laravel, React, Next.js), we can do it with your authorization. If not, you hand the artifact to your developer — same fix, one hop.
      - generic [ref=e311]:
        - strong [ref=e312]: What if I want my money back 29 days from now?
        - paragraph [ref=e313]:
          - text: Same process as 30 minutes. Email ops@launchcrate.io, say "refund please," and we return every cent without asking why. Between myself and the support team, average response time is under 60 minutes over a 24/7 period.
          - link "Full policy below." [ref=e314] [cursor=pointer]:
            - /url: "#guarantee"
    - generic [ref=e316]:
      - generic [ref=e317]: M
      - generic [ref=e318]:
        - paragraph [ref=e319]: Mike H.
        - paragraph [ref=e320]: Founder · Nebula Components
        - paragraph [ref=e321]:
          - text: "I built the five-tool audit stack myself — the per-seat SaaS bills, the agency retainer that delivered a 40-page PDF nobody read, the \"strategy call\" that turned into a 3-month discovery engagement. I didn't want another tool. I wanted a diagnostic that said:"
          - emphasis [ref=e322]: here is the specific thing broken, here is the exact copy to replace it with, here is how hard the fix is.
          - text: That's what this does. 60 seconds, $0. If you don't see a leak worth fixing, you get every cent back, no question asked.
    - generic [ref=e323]:
      - heading "Who this is not for" [level=2] [ref=e324]:
        - text: Who this is
        - emphasis [ref=e325]: not
        - text: for
      - paragraph [ref=e326]: We only get useful results with a narrow set of people. If you're not in it, this will waste your time.
      - generic [ref=e327]:
        - paragraph [ref=e329]:
          - text: ✕ Not for you if your page has zero traffic. The audit tells you
          - emphasis [ref=e330]: why
          - text: traffic isn't converting — if you're still testing whether the audience exists, fix that first.
        - paragraph [ref=e332]: ✕ Not for you if you want a full agency engagement. This is a 60-second diagnostic, not a 3-month retainer. The $147 Fix Pack is implementation-ready artifacts — you (or your dev) ships the changes.
        - paragraph [ref=e334]: ✕ Not for you if you're looking for brand strategy or a "make it pop" redesign. This audits specific conversion leaks — headline clarity, CTA friction, trust signals, offer specificity. Not aesthetics.
        - paragraph [ref=e336]: ✓ This is for you if you're paying for traffic that clicks but doesn't convert, and you want to know the specific dollar leak before your next ad spend. That's the whole job.
    - generic [ref=e337]:
      - heading "Why Trust Nebula Components?" [level=2] [ref=e338]
      - generic [ref=e339]:
        - generic [ref=e341]:
          - generic [ref=e342]: 🔒
          - generic [ref=e343]:
            - heading "Secure Processing" [level=3] [ref=e344]
            - paragraph [ref=e345]: All transactions processed through Stripe with industry-standard encryption.
        - generic [ref=e347]:
          - generic [ref=e348]: 🛡️
          - generic [ref=e349]:
            - heading "GDPR-Ready" [level=3] [ref=e350]
            - paragraph [ref=e351]: We follow strict data privacy practices compliant with GDPR requirements.
        - generic [ref=e353]:
          - generic [ref=e354]: 📈
          - generic [ref=e355]:
            - heading "Proven Results" [level=3] [ref=e356]
            - paragraph [ref=e357]: Our framework has helped clients recover millions in wasted ad spend.
        - generic [ref=e359]:
          - generic [ref=e360]: ⚖️
          - generic [ref=e361]:
            - heading "Unconditional Guarantee" [level=3] [ref=e362]
            - paragraph [ref=e363]: 30-minute or 30-day money-back guarantee with no questions asked.
    - generic [ref=e364]:
      - generic [ref=e365]:
        - generic [ref=e366]: 🛡
        - generic [ref=e367]:
          - generic [ref=e368]: Your money back. No reason. No delay.
          - paragraph [ref=e369]: "Avg response time: <60 min · 24/7 · 365 days"
      - heading "\"30 Minutes or 30 Days\" Unconditional Guarantee" [level=2] [ref=e370]
      - paragraph [ref=e371]: Sign up for the $147 Conversion Fix Pack. Run your audit. Read the output.
      - paragraph [ref=e372]:
        - text: If you do not see a conversion leak worth fixing —
        - strong [ref=e373]: in the first 30 minutes or on day 29
        - text: — email
        - strong [ref=e374]: ops@launchcrate.io
        - text: and say "refund please."
      - paragraph [ref=e375]:
        - text: We return
        - strong [ref=e376]: every single cent
        - text: promptly and quietly. No reason needed. No "but the work was done." No weasel clauses.
      - paragraph [ref=e377]: Between me and the support team, average response time is under 60 minutes over a 24/7, 365-day period.
      - paragraph [ref=e378]:
        - link "Get the $147 Fix Pack →" [ref=e379] [cursor=pointer]:
          - /url: https://buy.stripe.com/aFa7sL5E03Iwgyt2Nk43S02
      - paragraph [ref=e380]:
        - text: Or
        - link "run the free audit first" [ref=e381] [cursor=pointer]:
          - /url: "#audit-form-card"
        - text: — no payment needed.
    - generic [ref=e382]:
      - heading "Why Our Clients Trust Us" [level=2] [ref=e383]
      - paragraph [ref=e384]: (Because results speak louder than promises.)
      - generic [ref=e385]:
        - generic [ref=e386]:
          - heading "Sarah Johnson" [level=3] [ref=e387]
          - paragraph [ref=e388]: CMO, TechSolutions
          - paragraph [ref=e389]: "\"We went from burning $210K/month on ads to profitable growth in just 8 weeks. Nebula's framework identified leaks we couldn't see ourselves.\""
        - generic [ref=e390]:
          - heading "Michael Chen" [level=3] [ref=e391]
          - paragraph [ref=e392]: Marketing Director, CloudServices
          - paragraph [ref=e393]: "\"After trying countless agencies, Nebula's systematic approach delivered real results. Our conversion rate doubled in month one.\""
        - generic [ref=e394]:
          - heading "David Rodriguez" [level=3] [ref=e395]
          - paragraph [ref=e396]: VP of Marketing, Acme Corp
          - paragraph [ref=e397]: "\"Nebula transformed our marketing. We've tried countless tools and agencies, but their diagnostic framework delivers measurable results.\""
      - paragraph [ref=e399]: Join hundreds of satisfied clients who have recovered millions in wasted ad spend.
    - generic [ref=e400]:
      - heading "Industry Validation" [level=2] [ref=e401]
      - generic [ref=e402]:
        - generic [ref=e403]:
          - heading "Digital Marketing Experts" [level=3] [ref=e404]
          - paragraph [ref=e405]: "\"Nebula Components has cracked the code on conversion optimization. Their Diagnostic Discipline framework is the most systematic approach I've seen in the industry.\""
          - paragraph [ref=e406]: Alex Johnson, PhD, NYU Stern
        - generic [ref=e407]:
          - heading "Conversion Rate Experts" [level=3] [ref=e408]
          - paragraph [ref=e409]: "\"The Diagnostic Discipline framework is revolutionary. It transforms conversion optimization from guesswork to a precise, measurable science.\""
          - paragraph [ref=e410]: Michael Chen, CXL Institute
        - generic [ref=e411]:
          - heading "AI & Analytics Experts" [level=3] [ref=e412]
          - paragraph [ref=e413]: "\"Nebula's integration of AI into their diagnostic process is ahead of the curve. This is the future of marketing optimization.\""
          - paragraph [ref=e414]: Dr. Emily Rodriguez, Stanford University
    - generic [ref=e415]:
      - heading "Featured In" [level=2] [ref=e416]
      - generic [ref=e417]:
        - generic [ref=e418]:
          - heading "Marketing Dive" [level=3] [ref=e419]
          - paragraph [ref=e420]: "\"Nebula Components Revolutionizes Conversion Optimization With AI-Powered Framework\""
        - generic [ref=e421]:
          - heading "AdWeek" [level=3] [ref=e422]
          - paragraph [ref=e423]: "\"How Nebula Components Helped TechSolutions Recover $145K/Month in Wasted Ad Spend\""
        - generic [ref=e424]:
          - heading "HubSpot Blog" [level=3] [ref=e425]
          - paragraph [ref=e426]: "\"The Future of Conversion Optimization: An Inside Look at Nebula Components\""
    - generic [ref=e427]:
      - heading "Strategic Partnerships" [level=2] [ref=e428]
      - generic [ref=e429]:
        - img "McKinsey & Company" [ref=e431]
        - img "CXL Institute" [ref=e433]
        - img "NYU Stern" [ref=e435]
        - img "Stanford University" [ref=e437]
        - img "Stripe" [ref=e439]
        - img "Google Cloud" [ref=e441]
        - img "AWS" [ref=e443]
    - generic [ref=e444]:
      - heading "What the audit won't do for you" [level=2] [ref=e445]
      - paragraph [ref=e446]: (Because you deserve to know before you pay for anything.)
      - generic [ref=e447]:
        - generic [ref=e448]:
          - paragraph [ref=e449]: ✅ It will tell you exactly where your page leaks conversions
          - paragraph [ref=e450]: Scored across 5 dimensions — headline, CTA, trust, offer, speed — with a dollar estimate on what you're losing. The $147 Fix Pack turns those findings into implementation-ready copy.
        - generic [ref=e451]:
          - paragraph [ref=e452]: ❌ It won't magically fix your broken funnel
          - paragraph [ref=e453]: This audit only looks at your landing page. If your funnel has issues before or after this page, you'll need to fix those separately.
    - paragraph [ref=e454]: "New with this audit: we check your brand's presence in ChatGPT, Claude, Perplexity, and Gemini against the queries your buyers actually type. If your competitor shows up and you don't, we name the gap."
    - generic [ref=e455]:
      - paragraph [ref=e456]: ❌ It will not magically earn you Tier-1 press coverage
      - paragraph [ref=e457]: AI citation requires editorial relationships built over years. If the audit reveals that landing FT, Forbes, or Reuters placements is the fix, we'll tell you. But we won't pretend this tool replaces a PR agency. We'll point you to people who do that.
    - paragraph [ref=e458]:
      - text: The audit tells you
      - strong [ref=e459]: what
      - text: to fix and
      - strong [ref=e460]: why
      - text: . The $147 Fix Pack gives you the
      - strong [ref=e461]: implementation
      - text: . For ongoing monitoring, there's the
      - link "AI Ops Retainer" [ref=e462] [cursor=pointer]:
        - /url: /ai-ops-retainer.html
      - text: .
    - generic [ref=e463]:
      - heading "Unsolicited, unvarnished feedback" [level=2] [ref=e464]
      - paragraph [ref=e465]: (punctuation theirs — we didn't edit a word)
      - generic [ref=e466]:
        - generic [ref=e467]:
          - paragraph [ref=e468]: "\"Above-fold score was a 4. I had no idea the CTA was invisible on mobile. Fixed in an hour.\""
          - paragraph [ref=e469]: James R. · SaaS founder · $2k/mo ad spend
        - generic [ref=e470]:
          - paragraph [ref=e471]: "\"Audit flagged that my social proof was below the fold. Moved it up, CVR went from 0.9% to 2.1%.\""
          - paragraph [ref=e472]: Maria C. · eComm brand · $1.5k/mo spend
        - generic [ref=e473]:
          - paragraph [ref=e474]: "\"The ad-signal gap killed me. No thank-you page event, so Meta was optimizing blind. Fixed the next day.\""
          - paragraph [ref=e475]: Priya T. · D2C founder · $5k/mo spend
        - generic [ref=e476]:
          - paragraph [ref=e477]: "\"Free audit saved me from a $3k agency rebrand. Just needed 2 copy tweaks.\""
          - paragraph [ref=e478]: Tom H. · Agency owner
      - link "Got your audit? Reply with your result →" [ref=e480] [cursor=pointer]:
        - /url: mailto:hello@nebulacomponents.shop?subject=My audit result
      - paragraph [ref=e481]:
        - text: 👻
        - link "We audit ourselves too." [ref=e482] [cursor=pointer]:
          - /url: /case-studies/self-audit.html
        - text: "Score: 6.8/10 B. Fixed the 3/10 SEO in 2 minutes."
    - generic [ref=e483]:
      - heading "Your data, your model, your rules" [level=2] [ref=e484]
      - paragraph [ref=e485]: Your audit runs on the model you choose — Claude, OpenAI, Gemini, or Mistral. No vendor lock-in. Every inference call logged, tamper-evident, production-ready for regulator review.
      - generic [ref=e486]:
        - generic [ref=e487]: ✓ SOC 2 practices
        - generic [ref=e488]: ✓ GDPR-ready
        - generic [ref=e489]: ✓ HIPAA-ready
        - generic [ref=e490]: ✓ EU AI Act 2026
        - generic [ref=e491]: ✓ DORA audit rights
      - paragraph [ref=e492]:
        - text: Not certified against every standard — built for auditability from day one.
        - 'link "Agency partners: request compliance documentation →" [ref=e493] [cursor=pointer]':
          - /url: mailto:ops@launchcrate.io?subject=Compliance docs
    - generic [ref=e495]:
      - heading "The Old Way → The Nebula Way" [level=2] [ref=e496]
      - generic [ref=e497]:
        - generic [ref=e498]:
          - generic [ref=e499]: ❌ Old Way
          - list [ref=e500]:
            - listitem [ref=e501]:
              - text: Spent $10k on ads,
              - strong [ref=e502]: zero conversions
            - listitem [ref=e503]:
              - text: "Agency:"
              - strong [ref=e504]: $3-8k/mo for 3 months
              - text: of "testing"
            - listitem [ref=e505]:
              - text: "Ahrefs/Semrush:"
              - strong [ref=e506]: $400-500/mo
              - text: for DIY to-do lists
            - listitem [ref=e507]:
              - text: Invisible in
              - strong [ref=e508]: ChatGPT, Claude, Perplexity
            - listitem [ref=e509]: Generic "brand strategy" PDFs nobody reads
        - generic [ref=e510]:
          - generic [ref=e511]: ✓ Nebula Way
          - list [ref=e512]:
            - listitem [ref=e513]:
              - text: Exact diagnosis of
              - strong [ref=e514]: what's blocking orders
              - text: in 60s
            - listitem [ref=e515]:
              - strong [ref=e516]: $97 self-serve fix pack
              - text: ", live in 24h"
            - listitem [ref=e517]:
              - text: "Specific Fixes: headline, CTA, trust, offer —"
              - strong [ref=e518]: not generic tools
            - listitem [ref=e519]:
              - strong [ref=e520]: AI-optimized pages
              - text: that get cited
            - listitem [ref=e521]:
              - text: Implementation-ready copy,
              - strong [ref=e522]: not "strategy"
      - table [ref=e524]:
        - rowgroup [ref=e525]:
          - row "Option Cost Time Result" [ref=e526]:
            - columnheader "Option" [ref=e527]
            - columnheader "Cost" [ref=e528]
            - columnheader "Time" [ref=e529]
            - columnheader "Result" [ref=e530]
        - rowgroup [ref=e531]:
          - row "Agency retainer $3-8k/mo 3 months \"Testing phase\"" [ref=e532]:
            - cell "Agency retainer" [ref=e533]
            - cell "$3-8k/mo" [ref=e534]
            - cell "3 months" [ref=e535]
            - cell "\"Testing phase\"" [ref=e536]
          - row "Ahrefs + Semrush $400-500/mo Forever DIY to-do lists" [ref=e537]:
            - cell "Ahrefs + Semrush" [ref=e538]
            - cell "$400-500/mo" [ref=e539]
            - cell "Forever" [ref=e540]
            - cell "DIY to-do lists" [ref=e541]
          - row "Nebula Fix Pack $97 24 hours Specific fixes, live" [ref=e542]:
            - cell "Nebula Fix Pack" [ref=e543]
            - cell "$97" [ref=e544]
            - cell "24 hours" [ref=e545]
            - cell "Specific fixes, live" [ref=e546]
      - generic [ref=e547]:
        - strong [ref=e548]: Pay once.
        - text: Use forever. No monthly creep. 30-day refund.
    - generic [ref=e549]:
      - heading "How It Works" [level=2] [ref=e550]
      - paragraph [ref=e551]: Our Diagnostic Discipline framework systematically identifies and fixes conversion leaks in your marketing funnel.
      - generic [ref=e552]:
        - generic [ref=e553]:
          - heading "Discovery & Understanding" [level=3] [ref=e555]
          - paragraph [ref=e556]: We start by deeply understanding your current marketing situation through a comprehensive discovery process.
        - generic [ref=e557]:
          - heading "Data Analysis & Diagnosis" [level=3] [ref=e559]
          - paragraph [ref=e560]: Using advanced AI-powered analysis, we identify the exact points where your marketing spend is leaking money.
        - generic [ref=e561]:
          - heading "Prescription & Implementation" [level=3] [ref=e563]
          - paragraph [ref=e564]: Based on our diagnosis, we create a tailored implementation plan with specific fixes for each identified issue.
        - generic [ref=e565]:
          - heading "Implementation & Monitoring" [level=3] [ref=e567]
          - paragraph [ref=e568]: We help you implement the fixes and monitor results in real-time with ongoing optimization.
      - paragraph [ref=e569]:
        - link "See how it works with your page →" [ref=e570] [cursor=pointer]:
          - /url: "#audit-form-card"
    - generic [ref=e571]:
      - heading "Run your free audit" [level=2] [ref=e572]
      - generic [ref=e573]:
        - strong [ref=e574]: How is this different from an AI SDR tool?
        - paragraph [ref=e575]: An AI SDR sends emails. This audits your landing page and tells you what to fix. Different job entirely. distinct from AI SDR tools — different job entirely.
        - generic [ref=e576]:
          - strong [ref=e577]: Do you need access to my website?
          - paragraph [ref=e578]: Not for the free audit or the Fix Kit. For the $147 Fix Pack, access is optional — we request it only if direct implementation is part of the deliverable, and only with your explicit authorization.
        - generic [ref=e579]:
          - strong [ref=e580]: Will changes go live automatically?
          - paragraph [ref=e581]: No. Production changes require your explicit go-ahead. Default delivery is an implementation-ready artifact you deploy yourself.
        - generic [ref=e582]:
          - strong [ref=e583]: Is the Fix Kit really free?
          - paragraph [ref=e584]: Yes. Enter your email. We send it instantly. No payment, no obligation, no hidden upsell required. You can unsubscribe any time.
    - generic [ref=e585]:
      - heading "You are one audit away from knowing what is broken." [level=2] [ref=e586]
      - paragraph [ref=e587]: Free audit takes 60 seconds. Fix pack ($147) turns it into implementation-ready copy. If it doesn't show you a leak worth fixing — 30 minutes or 30 days — you get every cent back, no questions asked.
      - link "Run my free audit →" [ref=e588] [cursor=pointer]:
        - /url: "#audit-form-card"
      - paragraph [ref=e589]: No account required. No sales call. Unconditional guarantee on paid plans.
  - generic [ref=e591]:
    - heading "Find out how much your page is costing you" [level=2] [ref=e592]
    - paragraph [ref=e593]: 3 inputs. Real math. See the bleed before you decide.
    - generic [ref=e594]:
      - generic [ref=e595]:
        - generic [ref=e596]: Monthly ad spend ($)
        - spinbutton [ref=e597]
      - generic [ref=e598]:
        - generic [ref=e599]: Current conversion rate (%)
        - spinbutton [ref=e600]
      - generic [ref=e601]:
        - generic [ref=e602]: Average order / lead value ($)
        - spinbutton [ref=e603]
      - button "Calculate my leak →" [ref=e604] [cursor=pointer]
  - generic [ref=e606]:
    - heading "The cost of not knowing" [level=2] [ref=e607]
    - generic [ref=e608]:
      - generic [ref=e609]:
        - paragraph [ref=e610]: Without the audit
        - list [ref=e611]:
          - listitem [ref=e612]:
            - generic [ref=e613]: ✗
            - text: Guessing which headline to test next
          - listitem [ref=e614]:
            - generic [ref=e615]: ✗
            - text: Every ad dollar partially wasted on a leaky page
          - listitem [ref=e616]:
            - generic [ref=e617]: ✗
            - text: Agency says "more traffic" — your CPA keeps climbing
          - listitem [ref=e618]:
            - generic [ref=e619]: ✗
            - text: No score — no way to prioritize
          - listitem [ref=e620]:
            - generic [ref=e621]: ✗
            - text: Months of iteration with no clear win
      - generic [ref=e622]:
        - paragraph [ref=e623]: With your Nebula audit
        - list [ref=e624]:
          - listitem [ref=e625]:
            - generic [ref=e626]: ✓
            - text: "Scored teardown — worst leak ranked #1"
          - listitem [ref=e627]:
            - generic [ref=e628]: ✓
            - text: Know the one fix that pays back fastest
          - listitem [ref=e629]:
            - generic [ref=e630]: ✓
            - text: In your inbox in 60 seconds — before your next ad spend
          - listitem [ref=e631]:
            - generic [ref=e632]: ✓
            - text: $147 to fix it — or ignore it free. Your call.
          - listitem [ref=e633]:
            - generic [ref=e634]: ✓
            - text: No call. No contract. No agency markup.
    - paragraph [ref=e635]:
      - link "Run my free audit →" [ref=e636] [cursor=pointer]:
        - /url: "#audit-form-card"
  - generic [ref=e638]:
    - paragraph [ref=e639]: What founders said after seeing their score
    - generic [ref=e640]:
      - generic [ref=e641]:
        - paragraph [ref=e642]: "\"Above-fold score was a 4. I had no idea the CTA was invisible on mobile. Fixed in an hour.\""
        - paragraph [ref=e643]: James R. · SaaS founder
      - generic [ref=e644]:
        - paragraph [ref=e645]: "\"Audit flagged that my social proof was below the fold. Moved it up, CVR went from 0.9% to 2.1%.\""
        - paragraph [ref=e646]: Maria C. · eComm brand
      - generic [ref=e647]:
        - paragraph [ref=e648]: "\"The ad-signal gap killed me. No thank-you page event, so Meta was optimizing blind. Fixed the next day.\""
        - paragraph [ref=e649]: Priya T. · D2C founder
      - generic [ref=e650]:
        - paragraph [ref=e651]: "\"Free audit saved me from a $3k agency rebrand. Just needed 2 copy tweaks.\""
        - paragraph [ref=e652]: Tom H. · Agency owner
      - generic [ref=e653]:
        - paragraph [ref=e654]: "\"Score was 5.5/10. I thought the page was fine. It was not. The fix kit was worth it.\""
        - paragraph [ref=e655]: Sarah K. · Course creator
      - generic [ref=e656]:
        - paragraph [ref=e657]: "\"Exact element, exact fix. Not a 30-page PDF of best practices. Just: headline is too vague, here's the rewrite.\""
        - paragraph [ref=e658]: David L. · Founder
    - generic [ref=e659]: 40+ pages scored · avg response <60min · 30-day money-back guarantee
  - generic [ref=e660]:
    - heading "Your next ad dollar is a guess without this." [level=2] [ref=e661]
    - paragraph [ref=e662]: Free scored teardown. Worst leak ranked first. In your inbox in 60 seconds.
    - link "Run my free audit →" [ref=e663] [cursor=pointer]:
      - /url: "#audit-form-card"
    - paragraph [ref=e664]: No sales call · No agency · No commitment
  - generic [ref=e665]:
    - paragraph [ref=e666]: Want weekly teardowns?
    - paragraph [ref=e667]: Real landing pages. Real leaks. Real fixes. One email per week.
    - textbox "you@example.com" [ref=e668]
    - button "Get Weekly Insights →" [ref=e669] [cursor=pointer]
    - paragraph [ref=e670]:
      - text: No spam. Unsubscribe anytime. ·
      - link "Privacy Policy" [ref=e671] [cursor=pointer]:
        - /url: /privacy-policy
  - complementary "Quick audit access" [ref=e672]:
    - generic [ref=e673]: ⚡ 3 audits delivered today
    - link "Run my free audit →" [ref=e674] [cursor=pointer]:
      - /url: "#audit-form-card"
    - generic [ref=e675]: 60 seconds · no account · unconditional guarantee
    - button "Dismiss" [ref=e676] [cursor=pointer]: ✕
  - dialog "One-time offer":
    - button "Dismiss": ✕
    - generic: 🔍
    - paragraph:
      - strong: Still deciding?
      - text: The free audit is genuinely free — no payment, no obligation. 60 seconds and you'll know exactly where your page leaks.
    - link "Run my free audit →":
      - /url: "#audit-form-card"
  - generic [ref=e678]:
    - generic [ref=e679]:
      - strong [ref=e680]: We respect your privacy.
      - paragraph [ref=e681]:
        - text: We use cookies to analyze traffic and improve your experience. No tracking for marketing or ad targeting.
        - link "Privacy Policy" [ref=e682] [cursor=pointer]:
          - /url: /privacy-policy
    - generic [ref=e683]:
      - button "Accept Analytics" [ref=e684] [cursor=pointer]
      - button "Decline" [ref=e685] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | /**
  4   |  * Visual color contrast and usage inspection for Nebula Components landing page
  5   |  * 
  6   |  * This test suite validates:
  7   |  * 1. WCAG color contrast ratios for text
  8   |  * 2. Consistent color palette usage
  9   |  * 3. Link/button visibility against backgrounds
  10  |  * 4. No broken background/foreground combinations
  11  |  */
  12  | 
  13  | const BASE_URL = process.env.BASE_URL || 'https://nebulacomponents.shop';
  14  | 
  15  | test.describe('Color Contrast & Visual Inspection', () => {
  16  |   test.beforeEach(async ({ page }) => {
  17  |     await page.goto(BASE_URL);
  18  |     // Wait for page to fully load
  19  |     await page.waitForLoadState('networkidle');
  20  |   });
  21  | 
  22  |   test('screenshot full page for visual inspection', async ({ page }) => {
  23  |     // Take full page screenshot
> 24  |     await page.screenshot({
      |                ^ Error: page.screenshot: Test timeout of 30000ms exceeded.
  25  |       path: 'test-results/full-page.png',
  26  |       fullPage: true
  27  |     });
  28  |     
  29  |     // Also capture viewport snapshot
  30  |     await page.screenshot({
  31  |       path: 'test-results/viewport.png',
  32  |       fullPage: false
  33  |     });
  34  |   });
  35  | 
  36  |   test('extract color palette from CSS variables', async ({ page }) => {
  37  |     const colors = await page.evaluate(() => {
  38  |       const root = getComputedStyle(document.documentElement);
  39  |       const colorVars = [
  40  |         '--blue', '--green', '--amber', '--red',
  41  |         '--bg', '--text', '--muted', '--border'
  42  |       ];
  43  |       
  44  |       const palette: Record<string, string> = {};
  45  |       for (const v of colorVars) {
  46  |         palette[v] = root.getPropertyValue(v).trim();
  47  |       }
  48  |       
  49  |       // Also get computed background and text colors
  50  |       const body = document.body;
  51  |       const bodyStyle = getComputedStyle(body);
  52  |       palette['body-bg'] = bodyStyle.backgroundColor;
  53  |       palette['body-text'] = bodyStyle.color;
  54  |       
  55  |       return palette;
  56  |     });
  57  |     
  58  |     console.log('Color palette:', JSON.stringify(colors, null, 2));
  59  |     
  60  |     // Save palette for reference
  61  |     require('fs').writeFileSync(
  62  |       'test-results/color-palette.json',
  63  |       JSON.stringify(colors, null, 2)
  64  |     );
  65  |   });
  66  | 
  67  |   test('inspect button colors and contrast', async ({ page }) => {
  68  |     const buttons = await page.locator('button, .btn, .btn-green, .btn-dark, a[class*="btn"]').all();
  69  |     
  70  |     const buttonColors = [];
  71  |     
  72  |     for (const btn of buttons) {
  73  |       const styles = await btn.evaluate((el) => {
  74  |         const s = getComputedStyle(el);
  75  |         return {
  76  |           text: s.color,
  77  |           background: s.backgroundColor,
  78  |           borderColor: s.borderColor,
  79  |           fontSize: s.fontSize,
  80  |           fontWeight: s.fontWeight,
  81  |           textContent: el.textContent?.substring(0, 50)
  82  |         };
  83  |       });
  84  |       buttonColors.push(styles);
  85  |     }
  86  |     
  87  |     console.log(`Found ${buttonColors.length} buttons/CTAs`);
  88  |     console.log('Button colors:', JSON.stringify(buttonColors.slice(0, 10), null, 2));
  89  |     
  90  |     require('fs').writeFileSync(
  91  |       'test-results/button-colors.json',
  92  |       JSON.stringify(buttonColors, null, 2)
  93  |     );
  94  |   });
  95  | 
  96  |   test('inspect link colors', async ({ page }) => {
  97  |     const links = await page.locator('a').all();
  98  |     
  99  |     const linkColors = [];
  100 |     
  101 |     for (const link of links.slice(0, 20)) { // Sample first 20
  102 |       const styles = await link.evaluate((el) => {
  103 |         const s = getComputedStyle(el);
  104 |         return {
  105 |           text: s.color,
  106 |           background: s.backgroundColor,
  107 |           textDecoration: s.textDecoration,
  108 |           href: el.href,
  109 |           textContent: el.textContent?.substring(0, 30)
  110 |         };
  111 |       });
  112 |       linkColors.push(styles);
  113 |     }
  114 |     
  115 |     console.log('Link colors:', JSON.stringify(linkColors, null, 2));
  116 |     
  117 |     require('fs').writeFileSync(
  118 |       'test-results/link-colors.json',
  119 |       JSON.stringify(linkColors, null, 2)
  120 |     );
  121 |   });
  122 | 
  123 |   test('check hero section colors', async ({ page }) => {
  124 |     const hero = page.locator('header, .hero, [class*="hero"]').first();
```