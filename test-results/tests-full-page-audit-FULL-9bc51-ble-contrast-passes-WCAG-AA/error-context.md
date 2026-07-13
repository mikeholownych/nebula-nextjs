# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/full-page-audit.spec.ts >> FULL PAGE: all animated sections visible + contrast passes WCAG AA
- Location: tests/full-page-audit.spec.ts:28:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 2
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
      - generic [ref=e44]:
        - text: "40"
        - generic [ref=e45]: +
      - generic [ref=e46]: pages scored
    - generic [ref=e48]:
      - generic [ref=e50]: "3.1"
      - generic [ref=e51]:
        - text: avg leak categories
        - text: found per audit
    - generic [ref=e53]:
      - generic [ref=e55]:
        - text: <60
        - generic [ref=e56]: min
      - generic [ref=e57]: avg response, 24/7
    - generic [ref=e59]:
      - generic [ref=e61]: $147
      - generic [ref=e62]:
        - text: full implementation,
        - text: no call required
  - main [ref=e63]:
    - generic [ref=e64]:
      - heading "Sound familiar?" [level=2] [ref=e65]
      - generic [ref=e66]:
        - generic [ref=e67]:
          - paragraph [ref=e68]: Without a teardown
          - paragraph [ref=e69]: ❌ You buy more traffic hoping something changes
          - paragraph [ref=e70]: ❌ You rewrite the headline. Same result.
          - paragraph [ref=e71]: ❌ 4% CTR. 0% conversion. No idea why.
          - paragraph [ref=e72]: ❌ Your agency says "needs more time"
          - paragraph [ref=e73]: ❌ You kill the campaign before finding the real leak
        - generic [ref=e74]:
          - paragraph [ref=e75]: After 60 seconds here
          - paragraph [ref=e76]: ✅ Know which fix pays back fastest — ranked priority, not a 40-item list
          - paragraph [ref=e77]: ✅ Stop guessing — scored across 5 dimensions so you know exactly what broke
          - paragraph [ref=e78]: ✅ In your inbox before your next ad spend — 30 seconds to submit, 60 seconds back
    - generic [ref=e79]:
      - heading "Who is this for?" [level=2] [ref=e80]
      - paragraph [ref=e81]: One tool. Two use cases.
      - generic [ref=e82]:
        - generic [ref=e83]:
          - generic [ref=e84]: 🚀
          - paragraph [ref=e85]: Founders running paid traffic
          - paragraph [ref=e86]:
            - text: You have a working funnel but your landing page is the leak. Clicks come in, conversions don't. You need to know
            - emphasis [ref=e87]: exactly
            - text: what's broken before you spend another dollar.
          - list [ref=e88]:
            - listitem [ref=e89]: ✅ Free scored teardown → inbox in 60s
            - listitem [ref=e90]: "✅ $147 Fix Pack: rewritten copy + step-by-step fixes"
            - listitem [ref=e91]: ✅ No agency. No retainer. No call.
          - link "Run my free audit →" [ref=e92] [cursor=pointer]:
            - /url: "#audit-form-card"
        - generic [ref=e93]:
          - generic [ref=e94]: 🏢
          - paragraph [ref=e95]: Agencies & consultants
          - paragraph [ref=e96]: You work with clients running paid ads. Add a conversion audit to your discovery process — or white-label the output. Runs in 60 seconds per URL, scales to your whole book.
          - list [ref=e97]:
            - listitem [ref=e98]: ✅ Credible, data-backed audit report for every client
            - listitem [ref=e99]: ✅ Sell the fix pack as a $147 quick-win upsell
            - listitem [ref=e100]: ✅ No setup. Audit any URL instantly.
          - link "Talk to us about volume →" [ref=e101] [cursor=pointer]:
            - /url: "#audit-form-card"
    - generic [ref=e102]:
      - heading "How it works" [level=2] [ref=e103]
      - paragraph [ref=e104]: Three steps. Under 5 minutes total.
      - generic [ref=e105]:
        - generic [ref=e106]:
          - generic [ref=e107]: "1"
          - paragraph [ref=e108]: Paste your URL
          - paragraph [ref=e109]: Drop your landing page URL + email below. Takes 30 seconds.
        - generic [ref=e110]:
          - generic [ref=e111]: "2"
          - paragraph [ref=e112]: Get your scored audit
          - paragraph [ref=e113]: 5 dimensions scored. Top leaks ranked. Free fix kit in your inbox in 60 seconds.
        - generic [ref=e114]:
          - generic [ref=e115]: "3"
          - paragraph [ref=e116]: Fix it or hand it off
          - paragraph [ref=e117]: "Use the free kit yourself — or get the $147 Fix Pack: rewritten copy, delivered in 72h."
    - generic [ref=e118]:
      - heading "Run the free audit. See exactly where your page leaks." [level=2] [ref=e119]
      - paragraph [ref=e120]: The more context you give, the more surgical the audit. Two required fields. Everything else sharpens the diagnosis.
      - generic [ref=e121]:
        - generic [ref=e122]: Landing page URL (the exact page taking ad traffic)
        - textbox "Landing page URL (the exact page taking ad traffic)" [ref=e123]:
          - /placeholder: https://your-landing-page.com
        - generic [ref=e124]: Email for delivery (audit arrives in <60 seconds)
        - textbox "Email for delivery (audit arrives in <60 seconds)" [ref=e125]:
          - /placeholder: you@example.com
        - generic [ref=e126]: What is this page supposed to do?
        - combobox "What is this page supposed to do?" [ref=e127] [cursor=pointer]:
          - option "Get a sale — visitor should pay on this page" [selected]
          - option "Capture a lead — visitor should leave an email or number"
          - option "Book a call — visitor should schedule time"
          - option "Drive a signup — visitor should create an account"
        - generic [ref=e128]: Who lands here? (optional — sharpens the headline and CTA analysis)
        - textbox "Who lands here? (optional — sharpens the headline and CTA analysis)" [ref=e129]:
          - /placeholder: e.g. overwhelmed founders running paid ads, $5K+/mo spend
        - generic [ref=e130]: What feeling should the page give? (optional)
        - textbox "What feeling should the page give? (optional)" [ref=e131]:
          - /placeholder: e.g. calm and premium, or urgent and direct, or technical and trusted
        - generic [ref=e132]: Your role (optional — changes the follow-up question)
        - combobox "Your role (optional — changes the follow-up question)" [ref=e133] [cursor=pointer]:
          - option "Prefer not to say" [selected]
          - option "Founder / CEO / Owner"
          - option "Marketer / Growth / Ads"
          - option "Agency / Freelancer / Consultant"
          - option "Developer / Engineer"
        - generic [ref=e134]: Monthly ad spend (optional — sizes the waste estimate)
        - combobox "Monthly ad spend (optional — sizes the waste estimate)" [ref=e135] [cursor=pointer]:
          - option "Prefer not to say" [selected]
          - option "Under $500/mo"
          - option "$500–$1K/mo"
          - option "$1K–$5K/mo"
          - option "$5K–$10K/mo"
          - option "$10K–$20K/mo"
          - option "$20K+/mo"
        - paragraph [ref=e136]: Your URL and email are used to generate, email, and log the audit. No resale. No spam.
        - paragraph [ref=e137]: ✓ 40+ audits delivered · avg score back in 60s · full refund if CVR doesn't improve
        - paragraph [ref=e138]:
          - link "📋 See a real audit report before you submit →" [ref=e139] [cursor=pointer]:
            - /url: /audit.html
        - button "Get Your Free Audit Now →" [ref=e140] [cursor=pointer]
    - generic [ref=e141]:
      - generic [ref=e142]:
        - generic [ref=e143]:
          - generic [ref=e144]: Audit grade
          - generic [ref=e145]: C
        - generic [ref=e146]:
          - generic [ref=e147]: Overall score
          - generic [ref=e148]: 5.8/10
      - generic [ref=e149]:
        - generic [ref=e150]:
          - generic [ref=e151]: 🎯 Clarity
          - generic [ref=e154]: "7"
        - generic [ref=e155]:
          - generic [ref=e156]: 🖱️ CTA friction
          - generic [ref=e159]: "5"
        - generic [ref=e160]:
          - generic [ref=e161]: 🤝 Trust gap
          - generic [ref=e164]: "5"
        - generic [ref=e165]:
          - generic [ref=e166]: 📦 Offer specificity
          - generic [ref=e169]: "8"
        - generic [ref=e170]:
          - generic [ref=e171]: 🔧 Implementation difficulty
          - generic [ref=e174]: "8"
      - generic [ref=e175]:
        - generic [ref=e176]: Top 3 prioritized fixes
        - generic [ref=e177]:
          - generic [ref=e178]: copy
          - generic [ref=e179]: Hero describes product features, not buyer outcome → rewrite for result
        - generic [ref=e180]:
          - generic [ref=e181]: cta
          - generic [ref=e182]: No visible CTA above the fold → add action + benefit button
        - generic [ref=e183]:
          - generic [ref=e184]: tracking
          - generic [ref=e185]: No FB Pixel or GA4 detected → install conversion tracking
      - generic [ref=e186]:
        - link "Run my free audit →" [ref=e187] [cursor=pointer]:
          - /url: "#audit-form-card"
        - generic [ref=e188]: Takes 60 seconds. No account needed.
    - generic [ref=e189]:
      - heading "Sample fix from a real audit" [level=2] [ref=e190]
      - paragraph [ref=e191]:
        - strong [ref=e192]: "Problem:"
        - text: Hero headline describes what the product is, not what the buyer gets.
      - paragraph [ref=e193]:
        - strong [ref=e194]: "Why it matters:"
        - text: Cold visitors decide in under 5 seconds whether the page is for them. A feature headline loses 40-60% of them before they scroll.
      - paragraph [ref=e195]:
        - strong [ref=e196]: "Fix:"
        - text: Replace "AI workflow platform for teams" with "Turn messy customer messages into support-ready replies in 30 seconds."
      - paragraph [ref=e197]:
        - strong [ref=e198]: "Difficulty:"
        - text: Low — copy-only.
        - strong [ref=e199]: "Priority:"
        - text: 9/10.
      - paragraph [ref=e200]: "Every dimension in the audit returns the same structure: evidence → why it matters → the exact fix → difficulty rating."
    - generic [ref=e201]:
      - heading "What the audit scores" [level=2] [ref=e202]
      - generic [ref=e203]:
        - generic [ref=e204]:
          - strong [ref=e205]: 🎯 Clarity
          - text: Can a stranger explain the offer in 5 seconds?
        - generic [ref=e206]:
          - strong [ref=e207]: 🖱️ CTA friction
          - text: Is the next action obvious and zero-risk?
        - generic [ref=e208]:
          - strong [ref=e209]: 🤝 Trust gap
          - text: Is proof visible before the ask?
        - generic [ref=e210]:
          - strong [ref=e211]: 📦 Offer specificity
          - text: Does the page say what buyers get and when?
        - generic [ref=e212]:
          - strong [ref=e213]: 🔧 Implementation difficulty
          - text: Copy-only, layout, technical, or unsupported.
    - generic [ref=e214]:
      - generic [ref=e215]:
        - generic [ref=e216]: Free — instant access
        - heading "🎁 Landing Page Fix Kit" [level=2] [ref=e217]
        - generic [ref=e218]: $0
        - paragraph [ref=e219]: For founders who want to apply fixes themselves today. The audit-to-implementation checklist in 5 pages.
        - generic [ref=e220]:
          - textbox "you@example.com" [ref=e221]
          - button "Download Your Free Fix Kit →" [ref=e222] [cursor=pointer]
        - list [ref=e223]:
          - listitem [ref=e224]: 5-step audit-to-fix checklist
          - listitem [ref=e225]: Headline rewrite prompts (3 templates)
          - listitem [ref=e226]: CTA and trust-section copy templates
          - listitem [ref=e227]: FAQ block templates with examples
          - listitem [ref=e228]: Delivered instantly to your inbox
        - paragraph [ref=e229]: No spam. Unsubscribe anytime. Your email is used only to send the kit and occasional follow-up resources you can opt out of.
      - generic [ref=e230]:
        - generic [ref=e231]: Most popular
        - generic [ref=e232]: 30-minute refund
        - heading "💥 Conversion Fix Pack" [level=2] [ref=e233]
        - generic [ref=e234]: $490 $147 one-time
        - paragraph [ref=e235]: Your audit → turned into implementation-ready fixes. Hero, CTA, trust proof, offer, FAQ — rewritten and prioritized.
        - generic [ref=e236]:
          - generic [ref=e237]:
            - paragraph [ref=e238]: "Stack value: $490 → $147"
            - list [ref=e239]:
              - listitem [ref=e240]:
                - generic [ref=e241]: Rewritten conversion copy
                - generic [ref=e242]: $150
              - listitem [ref=e243]:
                - generic [ref=e244]: Prioritized fix list w/ difficulty
                - generic [ref=e245]: $100
              - listitem [ref=e246]:
                - generic [ref=e247]: Step-by-step implementation
                - generic [ref=e248]: $120
              - listitem [ref=e249]:
                - generic [ref=e250]: One revision pass
                - generic [ref=e251]: $60
              - listitem [ref=e252]:
                - generic [ref=e253]: Direct implementation option
                - generic [ref=e254]: $60
            - paragraph [ref=e255]: You pay $147 because the audit tool makes it efficient to produce at scale. The value is real.
          - paragraph [ref=e256]: "Your fix pack week:"
          - generic [ref=e257]:
            - generic [ref=e258]:
              - generic [ref=e259]: Mon
              - text: Audit lands
            - generic [ref=e260]:
              - generic [ref=e261]: Wed
              - text: Fix pack sent
            - generic [ref=e262]:
              - generic [ref=e263]: Fri
              - text: Results check
          - generic [ref=e264]: → Then you buy and your fix is in your inbox within 72h
        - paragraph [ref=e265]: No production changes without your go-ahead. Safe fallback artifact if direct implementation is unsupported. One reasonable revision included.
        - link "Get the Conversion Fix Pack →" [ref=e266] [cursor=pointer]:
          - /url: https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b
        - generic [ref=e267]:
          - img "Visa" [ref=e268]:
            - generic [ref=e270]: VISA
          - img "Mastercard" [ref=e271]
          - img "Stripe" [ref=e276]:
            - generic [ref=e278]: stripe
          - generic [ref=e279]:
            - img [ref=e280]
            - text: 256-bit SSL
        - generic [ref=e283]:
          - generic [ref=e284]: 🛡
          - generic [ref=e285]:
            - text: 30-min or 30-day refund. No reason. No questions.
            - link "Full policy ↓" [ref=e286] [cursor=pointer]:
              - /url: "#guarantee"
    - generic [ref=e287]:
      - generic [ref=e288]: New — AI Ops Retainer
      - heading "Protect the savings. Stop redoing discovery." [level=2] [ref=e289]
      - paragraph [ref=e290]:
        - text: Your audit proved a real dollar leak. That number stays real only if someone watches the page — month after month.
        - strong [ref=e291]: $1,497/mo
        - text: for monitoring, iteration, and AI governance. 3-month pilot. No long-term contract.
      - link "Learn more →" [ref=e292] [cursor=pointer]:
        - /url: mailto:ops@launchcrate.io?subject=Retainer inquiry
      - paragraph [ref=e293]:
        - text: "Agencies:"
        - link "email us about white-label →" [ref=e294] [cursor=pointer]:
          - /url: mailto:ops@launchcrate.io?subject=Agency inquiry
    - generic [ref=e295]:
      - heading "Before you ask" [level=2] [ref=e296]
      - generic [ref=e297]:
        - strong [ref=e298]: Why is the Fix Pack only $147? That seems cheap.
        - paragraph [ref=e299]: Because the audit does the heavy lifting. We don't charge for discovery calls, account research, or "brand strategy." You give us the audit URL, we find the leaks, we write the fixes. No overhead, no meetings, no delays.
      - generic [ref=e300]:
        - strong [ref=e301]: If this works so well, why don't you sell it for more?
        - paragraph [ref=e302]: We do. The $147 fix pack is the entry point. The Growth Launch ($997) includes implementation deployment, monitoring, and a 60-day "no customer, we work free" guarantee. This page exists because $147 removes the "should I think about it?" hesitation. You can see if our output is real for the price of a nice dinner.
      - generic [ref=e303]:
        - strong [ref=e304]: $490 crossed out — did it ever cost that?
        - paragraph [ref=e305]: "That is the value of the deliverables you get: rewritten conversion copy ($150), prioritized fix list ($100), implementation instructions ($120), one revision ($60), and direct implementation option ($60). You're paying $147 for the bundle because the audit tool makes it efficient to produce at scale. The value is real even if the line-item prices are estimates."
      - generic [ref=e306]:
        - strong [ref=e307]: Is this just AI-generated fluff?
        - paragraph [ref=e308]: "The audit follows a fixed conversion rubric — 5 dimensions, each scored against visible page evidence. The output is not a \"make it pop\" paragraph. It is: evidence → why it matters → the exact fix → difficulty rating. You can verify every recommendation against your own page in under 30 seconds."
      - generic [ref=e309]:
        - strong [ref=e310]: What if you can't implement the fix (Shopify, Webflow, etc.)?
        - paragraph [ref=e311]: We return rewritten copy, layout recommendations, and step-by-step implementation instructions. If your platform is one we configure directly (Laravel, React, Next.js), we can do it with your authorization. If not, you hand the artifact to your developer — same fix, one hop.
      - generic [ref=e312]:
        - strong [ref=e313]: What if I want my money back 29 days from now?
        - paragraph [ref=e314]:
          - text: Same process as 30 minutes. Email ops@launchcrate.io, say "refund please," and we return every cent without asking why. Between myself and the support team, average response time is under 60 minutes over a 24/7 period.
          - link "Full policy below." [ref=e315] [cursor=pointer]:
            - /url: "#guarantee"
    - generic [ref=e317]:
      - generic [ref=e318]: M
      - generic [ref=e319]:
        - paragraph [ref=e320]: Mike H.
        - paragraph [ref=e321]: Founder · Nebula Components
        - paragraph [ref=e322]:
          - text: "I built the five-tool audit stack myself — the per-seat SaaS bills, the agency retainer that delivered a 40-page PDF nobody read, the \"strategy call\" that turned into a 3-month discovery engagement. I didn't want another tool. I wanted a diagnostic that said:"
          - emphasis [ref=e323]: here is the specific thing broken, here is the exact copy to replace it with, here is how hard the fix is.
          - text: That's what this does. 60 seconds, $0. If you don't see a leak worth fixing, you get every cent back, no question asked.
    - generic [ref=e324]:
      - heading "Who this is not for" [level=2] [ref=e325]:
        - text: Who this is
        - emphasis [ref=e326]: not
        - text: for
      - paragraph [ref=e327]: We only get useful results with a narrow set of people. If you're not in it, this will waste your time.
      - generic [ref=e328]:
        - paragraph [ref=e330]:
          - text: ✕ Not for you if your page has zero traffic. The audit tells you
          - emphasis [ref=e331]: why
          - text: traffic isn't converting — if you're still testing whether the audience exists, fix that first.
        - paragraph [ref=e333]: ✕ Not for you if you want a full agency engagement. This is a 60-second diagnostic, not a 3-month retainer. The $147 Fix Pack is implementation-ready artifacts — you (or your dev) ships the changes.
        - paragraph [ref=e335]: ✕ Not for you if you're looking for brand strategy or a "make it pop" redesign. This audits specific conversion leaks — headline clarity, CTA friction, trust signals, offer specificity. Not aesthetics.
        - paragraph [ref=e337]: ✓ This is for you if you're paying for traffic that clicks but doesn't convert, and you want to know the specific dollar leak before your next ad spend. That's the whole job.
    - generic [ref=e338]:
      - heading "Why Trust Nebula Components?" [level=2] [ref=e339]
      - generic [ref=e340]:
        - generic [ref=e342]:
          - generic [ref=e343]: 🔒
          - generic [ref=e344]:
            - heading "Secure Processing" [level=3] [ref=e345]
            - paragraph [ref=e346]: All transactions processed through Stripe with industry-standard encryption.
        - generic [ref=e348]:
          - generic [ref=e349]: 🛡️
          - generic [ref=e350]:
            - heading "GDPR-Ready" [level=3] [ref=e351]
            - paragraph [ref=e352]: We follow strict data privacy practices compliant with GDPR requirements.
        - generic [ref=e354]:
          - generic [ref=e355]: 📈
          - generic [ref=e356]:
            - heading "Proven Results" [level=3] [ref=e357]
            - paragraph [ref=e358]: Our framework has helped clients recover millions in wasted ad spend.
        - generic [ref=e360]:
          - generic [ref=e361]: ⚖️
          - generic [ref=e362]:
            - heading "Unconditional Guarantee" [level=3] [ref=e363]
            - paragraph [ref=e364]: 30-minute or 30-day money-back guarantee with no questions asked.
    - generic [ref=e365]:
      - generic [ref=e366]:
        - generic [ref=e367]: 🛡
        - generic [ref=e368]:
          - generic [ref=e369]: Your money back. No reason. No delay.
          - paragraph [ref=e370]: "Avg response time: <60 min · 24/7 · 365 days"
      - heading "\"30 Minutes or 30 Days\" Unconditional Guarantee" [level=2] [ref=e371]
      - paragraph [ref=e372]: Sign up for the $147 Conversion Fix Pack. Run your audit. Read the output.
      - paragraph [ref=e373]:
        - text: If you do not see a conversion leak worth fixing —
        - strong [ref=e374]: in the first 30 minutes or on day 29
        - text: — email
        - strong [ref=e375]: ops@launchcrate.io
        - text: and say "refund please."
      - paragraph [ref=e376]:
        - text: We return
        - strong [ref=e377]: every single cent
        - text: promptly and quietly. No reason needed. No "but the work was done." No weasel clauses.
      - paragraph [ref=e378]: Between me and the support team, average response time is under 60 minutes over a 24/7, 365-day period.
      - paragraph [ref=e379]:
        - link "Get the $147 Fix Pack →" [ref=e380] [cursor=pointer]:
          - /url: https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b
      - paragraph [ref=e381]:
        - text: Or
        - link "run the free audit first" [ref=e382] [cursor=pointer]:
          - /url: "#audit-form-card"
        - text: — no payment needed.
    - generic [ref=e383]:
      - heading "Why Our Clients Trust Us" [level=2] [ref=e384]
      - paragraph [ref=e385]: (Because results speak louder than promises.)
      - generic [ref=e386]:
        - generic [ref=e387]:
          - heading "Sarah Johnson" [level=3] [ref=e388]
          - paragraph [ref=e389]: CMO, TechSolutions
          - paragraph [ref=e390]: "\"We went from burning $210K/month on ads to profitable growth in just 8 weeks. Nebula's framework identified leaks we couldn't see ourselves.\""
        - generic [ref=e391]:
          - heading "Michael Chen" [level=3] [ref=e392]
          - paragraph [ref=e393]: Marketing Director, CloudServices
          - paragraph [ref=e394]: "\"After trying countless agencies, Nebula's systematic approach delivered real results. Our conversion rate doubled in month one.\""
        - generic [ref=e395]:
          - heading "David Rodriguez" [level=3] [ref=e396]
          - paragraph [ref=e397]: VP of Marketing, Acme Corp
          - paragraph [ref=e398]: "\"Nebula transformed our marketing. We've tried countless tools and agencies, but their diagnostic framework delivers measurable results.\""
      - paragraph [ref=e400]: Join hundreds of satisfied clients who have recovered millions in wasted ad spend.
    - generic [ref=e401]:
      - heading "Industry Validation" [level=2] [ref=e402]
      - generic [ref=e403]:
        - generic [ref=e404]:
          - heading "Digital Marketing Experts" [level=3] [ref=e405]
          - paragraph [ref=e406]: "\"Nebula Components has cracked the code on conversion optimization. Their Diagnostic Discipline framework is the most systematic approach I've seen in the industry.\""
          - paragraph [ref=e407]: Alex Johnson, PhD, NYU Stern
        - generic [ref=e408]:
          - heading "Conversion Rate Experts" [level=3] [ref=e409]
          - paragraph [ref=e410]: "\"The Diagnostic Discipline framework is revolutionary. It transforms conversion optimization from guesswork to a precise, measurable science.\""
          - paragraph [ref=e411]: Michael Chen, CXL Institute
        - generic [ref=e412]:
          - heading "AI & Analytics Experts" [level=3] [ref=e413]
          - paragraph [ref=e414]: "\"Nebula's integration of AI into their diagnostic process is ahead of the curve. This is the future of marketing optimization.\""
          - paragraph [ref=e415]: Dr. Emily Rodriguez, Stanford University
    - generic [ref=e416]:
      - heading "Featured In" [level=2] [ref=e417]
      - generic [ref=e418]:
        - generic [ref=e419]:
          - heading "Marketing Dive" [level=3] [ref=e420]
          - paragraph [ref=e421]: "\"Nebula Components Revolutionizes Conversion Optimization With AI-Powered Framework\""
        - generic [ref=e422]:
          - heading "AdWeek" [level=3] [ref=e423]
          - paragraph [ref=e424]: "\"How Nebula Components Helped TechSolutions Recover $145K/Month in Wasted Ad Spend\""
        - generic [ref=e425]:
          - heading "HubSpot Blog" [level=3] [ref=e426]
          - paragraph [ref=e427]: "\"The Future of Conversion Optimization: An Inside Look at Nebula Components\""
    - generic [ref=e428]:
      - heading "Strategic Partnerships" [level=2] [ref=e429]
      - generic [ref=e430]:
        - img "McKinsey & Company" [ref=e432]
        - img "CXL Institute" [ref=e434]
        - img "NYU Stern" [ref=e436]
        - img "Stanford University" [ref=e438]
        - img "Stripe" [ref=e440]
        - img "Google Cloud" [ref=e442]
        - img "AWS" [ref=e444]
    - generic [ref=e445]:
      - heading "What the audit won't do for you" [level=2] [ref=e446]
      - paragraph [ref=e447]: (Because you deserve to know before you pay for anything.)
      - generic [ref=e448]:
        - generic [ref=e449]:
          - paragraph [ref=e450]: ✅ It will tell you exactly where your page leaks conversions
          - paragraph [ref=e451]: Scored across 5 dimensions — headline, CTA, trust, offer, speed — with a dollar estimate on what you're losing. The $147 Fix Pack turns those findings into implementation-ready copy.
        - generic [ref=e452]:
          - paragraph [ref=e453]: ❌ It won't magically fix your broken funnel
          - paragraph [ref=e454]: This audit only looks at your landing page. If your funnel has issues before or after this page, you'll need to fix those separately.
    - paragraph [ref=e455]: "New with this audit: we check your brand's presence in ChatGPT, Claude, Perplexity, and Gemini against the queries your buyers actually type. If your competitor shows up and you don't, we name the gap."
    - generic [ref=e456]:
      - paragraph [ref=e457]: ❌ It will not magically earn you Tier-1 press coverage
      - paragraph [ref=e458]: AI citation requires editorial relationships built over years. If the audit reveals that landing FT, Forbes, or Reuters placements is the fix, we'll tell you. But we won't pretend this tool replaces a PR agency. We'll point you to people who do that.
    - paragraph [ref=e459]:
      - text: The audit tells you
      - strong [ref=e460]: what
      - text: to fix and
      - strong [ref=e461]: why
      - text: . The $147 Fix Pack gives you the
      - strong [ref=e462]: implementation
      - text: . For ongoing monitoring, there's the
      - link "AI Ops Retainer" [ref=e463] [cursor=pointer]:
        - /url: /ai-ops-retainer.html
      - text: .
    - generic [ref=e464]:
      - heading "Unsolicited, unvarnished feedback" [level=2] [ref=e465]
      - paragraph [ref=e466]: (punctuation theirs — we didn't edit a word)
      - generic [ref=e467]:
        - generic [ref=e468]:
          - paragraph [ref=e469]: "\"Above-fold score was a 4. I had no idea the CTA was invisible on mobile. Fixed in an hour.\""
          - paragraph [ref=e470]: James R. · SaaS founder · $2k/mo ad spend
        - generic [ref=e471]:
          - paragraph [ref=e472]: "\"Audit flagged that my social proof was below the fold. Moved it up, CVR went from 0.9% to 2.1%.\""
          - paragraph [ref=e473]: Maria C. · eComm brand · $1.5k/mo spend
        - generic [ref=e474]:
          - paragraph [ref=e475]: "\"The ad-signal gap killed me. No thank-you page event, so Meta was optimizing blind. Fixed the next day.\""
          - paragraph [ref=e476]: Priya T. · D2C founder · $5k/mo spend
        - generic [ref=e477]:
          - paragraph [ref=e478]: "\"Free audit saved me from a $3k agency rebrand. Just needed 2 copy tweaks.\""
          - paragraph [ref=e479]: Tom H. · Agency owner
      - link "Got your audit? Reply with your result →" [ref=e481] [cursor=pointer]:
        - /url: mailto:hello@nebulacomponents.shop?subject=My audit result
      - paragraph [ref=e482]:
        - text: 👻
        - link "We audit ourselves too." [ref=e483] [cursor=pointer]:
          - /url: /case-studies/self-audit.html
        - text: "Score: 6.8/10 B. Fixed the 3/10 SEO in 2 minutes."
    - generic [ref=e484]:
      - heading "Your data, your model, your rules" [level=2] [ref=e485]
      - paragraph [ref=e486]: Your audit runs on the model you choose — Claude, OpenAI, Gemini, or Mistral. No vendor lock-in. Every inference call logged, tamper-evident, production-ready for regulator review.
      - generic [ref=e487]:
        - generic [ref=e488]: ✓ SOC 2 practices
        - generic [ref=e489]: ✓ GDPR-ready
        - generic [ref=e490]: ✓ HIPAA-ready
        - generic [ref=e491]: ✓ EU AI Act 2026
        - generic [ref=e492]: ✓ DORA audit rights
      - paragraph [ref=e493]:
        - text: Not certified against every standard — built for auditability from day one.
        - 'link "Agency partners: request compliance documentation →" [ref=e494] [cursor=pointer]':
          - /url: mailto:ops@launchcrate.io?subject=Compliance docs
    - generic [ref=e496]:
      - heading "The Old Way → The Nebula Way" [level=2] [ref=e497]
      - generic [ref=e498]:
        - generic [ref=e499]:
          - generic [ref=e500]: ❌ Old Way
          - list [ref=e501]:
            - listitem [ref=e502]:
              - text: Spent $10k on ads,
              - strong [ref=e503]: zero conversions
            - listitem [ref=e504]:
              - text: "Agency:"
              - strong [ref=e505]: $3-8k/mo for 3 months
              - text: of "testing"
            - listitem [ref=e506]:
              - text: "Ahrefs/Semrush:"
              - strong [ref=e507]: $400-500/mo
              - text: for DIY to-do lists
            - listitem [ref=e508]:
              - text: Invisible in
              - strong [ref=e509]: ChatGPT, Claude, Perplexity
            - listitem [ref=e510]: Generic "brand strategy" PDFs nobody reads
        - generic [ref=e511]:
          - generic [ref=e512]: ✓ Nebula Way
          - list [ref=e513]:
            - listitem [ref=e514]:
              - text: Exact diagnosis of
              - strong [ref=e515]: what's blocking orders
              - text: in 60s
            - listitem [ref=e516]:
              - strong [ref=e517]: $97 self-serve fix pack
              - text: ", live in 24h"
            - listitem [ref=e518]:
              - text: "Specific Fixes: headline, CTA, trust, offer —"
              - strong [ref=e519]: not generic tools
            - listitem [ref=e520]:
              - strong [ref=e521]: AI-optimized pages
              - text: that get cited
            - listitem [ref=e522]:
              - text: Implementation-ready copy,
              - strong [ref=e523]: not "strategy"
      - table [ref=e525]:
        - rowgroup [ref=e526]:
          - row "Option Cost Time Result" [ref=e527]:
            - columnheader "Option" [ref=e528]
            - columnheader "Cost" [ref=e529]
            - columnheader "Time" [ref=e530]
            - columnheader "Result" [ref=e531]
        - rowgroup [ref=e532]:
          - row "Agency retainer $3-8k/mo 3 months \"Testing phase\"" [ref=e533]:
            - cell "Agency retainer" [ref=e534]
            - cell "$3-8k/mo" [ref=e535]
            - cell "3 months" [ref=e536]
            - cell "\"Testing phase\"" [ref=e537]
          - row "Ahrefs + Semrush $400-500/mo Forever DIY to-do lists" [ref=e538]:
            - cell "Ahrefs + Semrush" [ref=e539]
            - cell "$400-500/mo" [ref=e540]
            - cell "Forever" [ref=e541]
            - cell "DIY to-do lists" [ref=e542]
          - row "Nebula Fix Pack $97 24 hours Specific fixes, live" [ref=e543]:
            - cell "Nebula Fix Pack" [ref=e544]
            - cell "$97" [ref=e545]
            - cell "24 hours" [ref=e546]
            - cell "Specific fixes, live" [ref=e547]
      - generic [ref=e548]:
        - strong [ref=e549]: Pay once.
        - text: Use forever. No monthly creep. 30-day refund.
    - generic [ref=e550]:
      - heading "How It Works" [level=2] [ref=e551]
      - paragraph [ref=e552]: Our Diagnostic Discipline framework systematically identifies and fixes conversion leaks in your marketing funnel.
      - generic [ref=e553]:
        - generic [ref=e554]:
          - heading "Discovery & Understanding" [level=3] [ref=e556]
          - paragraph [ref=e557]: We start by deeply understanding your current marketing situation through a comprehensive discovery process.
        - generic [ref=e558]:
          - heading "Data Analysis & Diagnosis" [level=3] [ref=e560]
          - paragraph [ref=e561]: Using advanced AI-powered analysis, we identify the exact points where your marketing spend is leaking money.
        - generic [ref=e562]:
          - heading "Prescription & Implementation" [level=3] [ref=e564]
          - paragraph [ref=e565]: Based on our diagnosis, we create a tailored implementation plan with specific fixes for each identified issue.
        - generic [ref=e566]:
          - heading "Implementation & Monitoring" [level=3] [ref=e568]
          - paragraph [ref=e569]: We help you implement the fixes and monitor results in real-time with ongoing optimization.
      - paragraph [ref=e570]:
        - link "See how it works with your page →" [ref=e571] [cursor=pointer]:
          - /url: "#audit-form-card"
    - generic [ref=e572]:
      - heading "Run your free audit" [level=2] [ref=e573]
      - generic [ref=e574]:
        - strong [ref=e575]: How is this different from an AI SDR tool?
        - paragraph [ref=e576]: An AI SDR sends emails. This audits your landing page and tells you what to fix. Different job entirely. distinct from AI SDR tools — different job entirely.
        - generic [ref=e577]:
          - strong [ref=e578]: Do you need access to my website?
          - paragraph [ref=e579]: Not for the free audit or the Fix Kit. For the $147 Fix Pack, access is optional — we request it only if direct implementation is part of the deliverable, and only with your explicit authorization.
        - generic [ref=e580]:
          - strong [ref=e581]: Will changes go live automatically?
          - paragraph [ref=e582]: No. Production changes require your explicit go-ahead. Default delivery is an implementation-ready artifact you deploy yourself.
        - generic [ref=e583]:
          - strong [ref=e584]: Is the Fix Kit really free?
          - paragraph [ref=e585]: Yes. Enter your email. We send it instantly. No payment, no obligation, no hidden upsell required. You can unsubscribe any time.
    - generic [ref=e586]:
      - heading "You are one audit away from knowing what is broken." [level=2] [ref=e587]
      - paragraph [ref=e588]: Free audit takes 60 seconds. Fix pack ($147) turns it into implementation-ready copy. If it doesn't show you a leak worth fixing — 30 minutes or 30 days — you get every cent back, no questions asked.
      - link "Run my free audit →" [ref=e589] [cursor=pointer]:
        - /url: "#audit-form-card"
      - paragraph [ref=e590]: No account required. No sales call. Unconditional guarantee on paid plans.
  - generic [ref=e592]:
    - heading "Find out how much your page is costing you" [level=2] [ref=e593]
    - paragraph [ref=e594]: 3 inputs. Real math. See the bleed before you decide.
    - generic [ref=e595]:
      - generic [ref=e596]:
        - generic [ref=e597]: Monthly ad spend ($)
        - spinbutton [ref=e598]
      - generic [ref=e599]:
        - generic [ref=e600]: Current conversion rate (%)
        - spinbutton [ref=e601]
      - generic [ref=e602]:
        - generic [ref=e603]: Average order / lead value ($)
        - spinbutton [ref=e604]
      - button "Calculate my leak →" [ref=e605] [cursor=pointer]
  - generic [ref=e607]:
    - heading "The cost of not knowing" [level=2] [ref=e608]
    - generic [ref=e609]:
      - generic [ref=e610]:
        - paragraph [ref=e611]: Without the audit
        - list [ref=e612]:
          - listitem [ref=e613]:
            - generic [ref=e614]: ✗
            - text: Guessing which headline to test next
          - listitem [ref=e615]:
            - generic [ref=e616]: ✗
            - text: Every ad dollar partially wasted on a leaky page
          - listitem [ref=e617]:
            - generic [ref=e618]: ✗
            - text: Agency says "more traffic" — your CPA keeps climbing
          - listitem [ref=e619]:
            - generic [ref=e620]: ✗
            - text: No score — no way to prioritize
          - listitem [ref=e621]:
            - generic [ref=e622]: ✗
            - text: Months of iteration with no clear win
      - generic [ref=e623]:
        - paragraph [ref=e624]: With your Nebula audit
        - list [ref=e625]:
          - listitem [ref=e626]:
            - generic [ref=e627]: ✓
            - text: "Scored teardown — worst leak ranked #1"
          - listitem [ref=e628]:
            - generic [ref=e629]: ✓
            - text: Know the one fix that pays back fastest
          - listitem [ref=e630]:
            - generic [ref=e631]: ✓
            - text: In your inbox in 60 seconds — before your next ad spend
          - listitem [ref=e632]:
            - generic [ref=e633]: ✓
            - text: $147 to fix it — or ignore it free. Your call.
          - listitem [ref=e634]:
            - generic [ref=e635]: ✓
            - text: No call. No contract. No agency markup.
    - paragraph [ref=e636]:
      - link "Run my free audit →" [ref=e637] [cursor=pointer]:
        - /url: "#audit-form-card"
  - generic [ref=e639]:
    - paragraph [ref=e640]: What founders said after seeing their score
    - generic [ref=e641]:
      - generic [ref=e642]:
        - paragraph [ref=e643]: "\"Above-fold score was a 4. I had no idea the CTA was invisible on mobile. Fixed in an hour.\""
        - paragraph [ref=e644]: James R. · SaaS founder
      - generic [ref=e645]:
        - paragraph [ref=e646]: "\"Audit flagged that my social proof was below the fold. Moved it up, CVR went from 0.9% to 2.1%.\""
        - paragraph [ref=e647]: Maria C. · eComm brand
      - generic [ref=e648]:
        - paragraph [ref=e649]: "\"The ad-signal gap killed me. No thank-you page event, so Meta was optimizing blind. Fixed the next day.\""
        - paragraph [ref=e650]: Priya T. · D2C founder
      - generic [ref=e651]:
        - paragraph [ref=e652]: "\"Free audit saved me from a $3k agency rebrand. Just needed 2 copy tweaks.\""
        - paragraph [ref=e653]: Tom H. · Agency owner
      - generic [ref=e654]:
        - paragraph [ref=e655]: "\"Score was 5.5/10. I thought the page was fine. It was not. The fix kit was worth it.\""
        - paragraph [ref=e656]: Sarah K. · Course creator
      - generic [ref=e657]:
        - paragraph [ref=e658]: "\"Exact element, exact fix. Not a 30-page PDF of best practices. Just: headline is too vague, here's the rewrite.\""
        - paragraph [ref=e659]: David L. · Founder
    - generic [ref=e660]: 40+ pages scored · avg response <60min · 30-day money-back guarantee
  - generic [ref=e661]:
    - heading "Your next ad dollar is a guess without this." [level=2] [ref=e662]
    - paragraph [ref=e663]: Free scored teardown. Worst leak ranked first. In your inbox in 60 seconds.
    - link "Run my free audit →" [ref=e664] [cursor=pointer]:
      - /url: "#audit-form-card"
    - paragraph [ref=e665]: No sales call · No agency · No commitment
  - generic [ref=e666]:
    - paragraph [ref=e667]: Want weekly teardowns?
    - paragraph [ref=e668]: Real landing pages. Real leaks. Real fixes. One email per week.
    - textbox "you@example.com" [ref=e669]
    - button "Get Weekly Insights →" [ref=e670] [cursor=pointer]
    - paragraph [ref=e671]:
      - text: No spam. Unsubscribe anytime. ·
      - link "Privacy Policy" [ref=e672] [cursor=pointer]:
        - /url: /privacy-policy
  - complementary "Quick audit access" [ref=e673]:
    - generic [ref=e674]: ⚡ 3 audits delivered today
    - link "Run my free audit →" [ref=e675] [cursor=pointer]:
      - /url: "#audit-form-card"
    - generic [ref=e676]: 60 seconds · no account · unconditional guarantee
    - button "Dismiss" [ref=e677] [cursor=pointer]: ✕
  - dialog "One-time offer":
    - button "Dismiss": ✕
    - generic: 🔍
    - paragraph:
      - strong: Still deciding?
      - text: The free audit is genuinely free — no payment, no obligation. 60 seconds and you'll know exactly where your page leaks.
    - link "Run my free audit →":
      - /url: "#audit-form-card"
  - generic [ref=e679]:
    - generic [ref=e680]:
      - strong [ref=e681]: We respect your privacy.
      - paragraph [ref=e682]:
        - text: We use cookies to analyze traffic and improve your experience. No tracking for marketing or ad targeting.
        - link "Privacy Policy" [ref=e683] [cursor=pointer]:
          - /url: /privacy-policy
    - generic [ref=e684]:
      - button "Accept Analytics" [ref=e685] [cursor=pointer]
      - button "Decline" [ref=e686] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const BASE_URL = process.env.BASE_URL || 'https://nebulacomponents.shop';
  4   | 
  5   | function parseRGB(s: string): [number, number, number] {
  6   |   const m = s.match(/\d+/g)!.map(Number);
  7   |   return [m[0], m[1], m[2]];
  8   | }
  9   | function lum(r: number, g: number, b: number): number {
  10  |   const a = [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  11  |   return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  12  | }
  13  | function ratio(fg: string, bg: string): number {
  14  |   const [fr, fg2, fb] = parseRGB(fg);
  15  |   const [br, bg2, bb] = parseRGB(bg);
  16  |   return (Math.max(lum(fr, fg2, fb), lum(br, bg2, bb)) + 0.05) / (Math.min(lum(fr, fg2, fb), lum(br, bg2, bb)) + 0.05);
  17  | }
  18  | // Composite a possibly-transparent bg over the page bg rgb(8,9,10)
  19  | function composite(bg: string): string {
  20  |   if (bg.startsWith('rgba')) {
  21  |     const m = bg.match(/[\d.]+/g)!.map(Number);
  22  |     const [r, g, b, a] = m;
  23  |     return `rgb(${Math.round(r * a + 8 * (1 - a))}, ${Math.round(g * a + 9 * (1 - a))}, ${Math.round(b * a + 10 * (1 - a))})`;
  24  |   }
  25  |   return bg;
  26  | }
  27  | 
  28  | test('FULL PAGE: all animated sections visible + contrast passes WCAG AA', async ({ page }) => {
  29  |   const pageErrors: string[] = [];
  30  |   page.on('pageerror', (e) => pageErrors.push(e.message));
  31  | 
  32  |   await page.goto(BASE_URL + '?full=' + Date.now(), { waitUntil: 'networkidle' });
  33  |   await page.waitForTimeout(4500); // safety net window
  34  | 
  35  |   // Sweep: scroll through entire page in steps so every ScrollTrigger fires
  36  |   const height = await page.evaluate(() => document.body.scrollHeight);
  37  |   const vh = await page.evaluate(() => window.innerHeight);
  38  |   for (let y = 0; y < height; y += vh) {
  39  |     await page.evaluate((yy) => window.scrollTo(0, yy), y);
  40  |     await page.waitForTimeout(200);
  41  |   }
  42  |   await page.evaluate(() => window.scrollTo(0, 0));
  43  |   await page.waitForTimeout(500);
  44  | 
  45  |   // 1) VISIBILITY: every card / section / how-step / heading / paragraph visible
  46  |   const vis = await page.evaluate(() => {
  47  |     const sels = '.card, section, .how-step, h1, h2, h3, p, li, .pill, .badge, .btn, button, input, a';
  48  |     const bad: any[] = [];
  49  |     document.querySelectorAll(sels).forEach((el: any) => {
  50  |       const cs = getComputedStyle(el);
  51  |       if (cs.display === 'none' || cs.visibility === 'hidden') return;
  52  |       const op = parseFloat(cs.opacity);
  53  |       // Only flag elements that have visible content/尺寸
  54  |       const r = el.getBoundingClientRect();
  55  |       if (r.width < 2 || r.height < 2) return;
  56  |       if (op < 0.95) {
  57  |         bad.push({ sel: el.tagName + (el.className ? '.' + String(el.className).split(' ')[0] : ''), op, text: (el.textContent || '').trim().slice(0, 30) });
  58  |       }
  59  |     });
  60  |     return bad;
  61  |   });
  62  | 
  63  |   // 2) CONTRAST: every leaf text node
  64  |   const contrast = await page.evaluate(() => {
  65  |     const out: any[] = [];
  66  |     document.querySelectorAll('*').forEach((el: any) => {
  67  |       const txt = el.textContent?.trim();
  68  |       if (!txt || el.children.length > 0) return;
  69  |       const cs = getComputedStyle(el);
  70  |       if (cs.visibility === 'hidden' || cs.display === 'none') return;
  71  |       let node: any = el, bg = 'rgb(8, 9, 10)';
  72  |       while (node) {
  73  |         const b = getComputedStyle(node).backgroundColor;
  74  |         if (b && b !== 'rgba(0, 0, 0, 0)' && b !== 'transparent') { bg = b; break; }
  75  |         node = node.parentElement;
  76  |       }
  77  |       out.push({ tag: el.tagName, text: txt.slice(0, 26), fg: cs.color, bg });
  78  |     });
  79  |     return out;
  80  |   });
  81  | 
  82  |   let contrastFails = 0;
  83  |   contrast.forEach((d) => {
  84  |     const realBg = composite(d.bg);
  85  |     const rat = ratio(d.fg, realBg);
  86  |     if (rat < 4.5) {
  87  |       contrastFails++;
  88  |       console.log(`CONTRAST FAIL ${d.tag} "${d.text}": ${rat.toFixed(2)}:1 fg=${d.fg} bg=${realBg}`);
  89  |     }
  90  |   });
  91  | 
  92  |   console.log(`VISIBILITY: ${vis.length} hidden/animated elements below 0.95 opacity`);
  93  |   vis.slice(0, 20).forEach((v: any) => console.log(`  HIDDEN ${v.sel} op=${v.op} "${v.text}"`));
  94  |   console.log(`CONTRAST: checked ${contrast.length} nodes, failures=${contrastFails}`);
  95  |   console.log(`PAGE ERRORS: ${JSON.stringify(pageErrors.filter(e => !e.includes('rb2b') && !e.includes('ERR_NAME_NOT_RESOLVED')))}`);
  96  | 
> 97  |   expect(vis.length).toBe(0);
      |                      ^ Error: expect(received).toBe(expected) // Object.is equality
  98  |   expect(contrastFails).toBe(0);
  99  |   expect(pageErrors.filter(e => !e.includes('rb2b') && !e.includes('ERR_NAME_NOT_RESOLVED'))).toHaveLength(0);
  100 | });
  101 | 
```