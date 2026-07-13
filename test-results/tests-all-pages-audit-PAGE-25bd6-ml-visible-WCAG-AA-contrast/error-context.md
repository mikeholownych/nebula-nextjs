# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/all-pages-audit.spec.ts >> PAGE /part_after.html: visible + WCAG AA contrast
- Location: tests/all-pages-audit.spec.ts:41:7

# Error details

```
Error: /part_after.html contrast failures

expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 171
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
        - text: If any of that landed â€”
        - strong [ref=e10]: you're exactly who this is for.
        - text: 60 seconds. No pitch. The exact leak, ranked by dollar cost. That's it.
    - heading "4% CTR. 0% conversion. Here’s where it breaks." [level=1] [ref=e11]:
      - text: 4% CTR. 0% conversion.
      - generic [ref=e12]:
        - emphasis [ref=e13]: Here’s where it breaks.
        - img [ref=e14]
    - paragraph [ref=e16]: Your ad spend is leaking somewhere between the click and the checkout. This finds the exact gap, estimates the monthly dollar cost, and gives you the fix. 60 seconds. $0. No testing phase. No agency.
    - generic [ref=e17]:
      - text: 97% of ad clicks don't convert.
      - strong [ref=e18]: Most vendors sell you more traffic. We tell you the specific dollar amount burning on your page â€” then fix it.
    - generic [ref=e19]:
      - strong [ref=e20]: We audited 200+ landing pages that burned $10k+ in ads with zero conversions.
      - text: Same 5 leaks every time. Fixable in 24 hours. This finds yours.
    - generic [ref=e21]:
      - text: ChatGPT links out 0.7% of the time. The other 99.3% it just names a brand.
      - strong [ref=e22]: Your competitors are the answer. You're not. That's a visibility leak that costs you deals before they reach your landing page.
      - link "Check AI citation â†’" [ref=e23] [cursor=pointer]:
        - /url: /audit
    - generic [ref=e24]: No testing phase. No 3-month retainer. No discovery call. Paste your URL, see your leak, buy the fix if you want it. That's the whole thing.
    - generic [ref=e25]: No sales call No hidden obligation URL used only for audit Full refund if not satisfied We duplicate your page
    - generic [ref=e26]:
      - link "Run my free audit â†’" [ref=e27] [cursor=pointer]:
        - /url: "#audit-form-card"
      - paragraph [ref=e28]: Free Â· 60 seconds Â· no account required
    - generic [ref=e29]:
      - text: Scored 40+ ad-funded landing pages Â· avg 3.1 leak categories found per audit Â·
      - strong [ref=e30]: avg reply <60 min, 24/7
    - navigation [ref=e31]:
      - link "How it works" [ref=e32] [cursor=pointer]:
        - /url: "#how-it-works"
      - link "Compare" [ref=e33] [cursor=pointer]:
        - /url: /compare/landing-page-audit-tools.html
      - link "Fix pack" [ref=e34] [cursor=pointer]:
        - /url: "#pricing"
      - link "Reviews" [ref=e35] [cursor=pointer]:
        - /url: "#testimonials"
      - link "Run my free audit â†’" [ref=e36] [cursor=pointer]:
        - /url: "#audit-form-card"
  - generic [ref=e38]:
    - generic [ref=e39]:
      - generic [ref=e41]: 40+
      - text: pages scored
    - generic [ref=e42]:
      - generic [ref=e43]: "3.1"
      - generic [ref=e44]:
        - text: avg leak categories
        - text: found per audit
    - generic [ref=e45]:
      - generic [ref=e47]: <60min
      - text: avg response, 24/7
    - generic [ref=e48]:
      - generic [ref=e49]: $147
      - generic [ref=e50]:
        - text: full implementation,
        - text: no call required
  - main [ref=e51]:
    - generic [ref=e52]:
      - heading "Sound familiar?" [level=2] [ref=e53]
      - generic [ref=e54]:
        - generic [ref=e55]:
          - paragraph [ref=e56]: Without a teardown
          - paragraph [ref=e57]: "â\x9dŒ You buy more traffic hoping something changes"
          - paragraph [ref=e58]: "â\x9dŒ You rewrite the headline. Same result."
          - paragraph [ref=e59]: "â\x9dŒ 4% CTR. 0% conversion. No idea why."
          - paragraph [ref=e60]: "â\x9dŒ Your agency says \"needs more time\""
          - paragraph [ref=e61]: "â\x9dŒ You kill the campaign before finding the real leak"
        - generic [ref=e62]:
          - paragraph [ref=e63]: After 60 seconds here
          - paragraph [ref=e64]: âœ… Know which fix pays back fastest â€” ranked priority, not a 40-item list
          - paragraph [ref=e65]: âœ… Stop guessing â€” scored across 5 dimensions so you know exactly what broke
          - paragraph [ref=e66]: âœ… In your inbox before your next ad spend â€” 30 seconds to submit, 60 seconds back
    - generic [ref=e67]:
      - heading "Who is this for?" [level=2] [ref=e68]
      - paragraph [ref=e69]: One tool. Two use cases.
      - generic [ref=e70]:
        - generic [ref=e71]:
          - generic [ref=e72]: ðŸš€
          - paragraph [ref=e73]: Founders running paid traffic
          - paragraph [ref=e74]:
            - text: You have a working funnel but your landing page is the leak. Clicks come in, conversions don't. You need to know
            - emphasis [ref=e75]: exactly
            - text: what's broken before you spend another dollar.
          - list [ref=e76]:
            - listitem [ref=e77]: ✅ Free scored teardown â†’ inbox in 60s
            - listitem [ref=e78]: "✅ $147 Fix Pack: rewritten copy + step-by-step fixes"
            - listitem [ref=e79]: ✅ No agency. No retainer. No call.
          - link "Run my free audit â†’" [ref=e80] [cursor=pointer]:
            - /url: "#audit-form-card"
        - generic [ref=e81]:
          - generic [ref=e82]: "ðŸ\x8f¢"
          - paragraph [ref=e83]: Agencies & consultants
          - paragraph [ref=e84]: You work with clients running paid ads. Add a conversion audit to your discovery process â€” or white-label the output. Runs in 60 seconds per URL, scales to your whole book.
          - list [ref=e85]:
            - listitem [ref=e86]: ✅ Credible, data-backed audit report for every client
            - listitem [ref=e87]: ✅ Sell the fix pack as a $147 quick-win upsell
            - listitem [ref=e88]: ✅ No setup. Audit any URL instantly.
          - link "Talk to us about volume â†’" [ref=e89] [cursor=pointer]:
            - /url: "#audit-form-card"
    - generic [ref=e90]:
      - heading "How it works" [level=2] [ref=e91]
      - paragraph [ref=e92]: Three steps. Under 5 minutes total.
      - generic [ref=e93]:
        - generic [ref=e94]:
          - generic [ref=e95]: "1"
          - paragraph [ref=e96]: Paste your URL
          - paragraph [ref=e97]: Drop your landing page URL + email below. Takes 30 seconds.
        - generic [ref=e98]:
          - generic [ref=e99]: "2"
          - paragraph [ref=e100]: Get your scored audit
          - paragraph [ref=e101]: 5 dimensions scored. Top leaks ranked. Free fix kit in your inbox in 60 seconds.
        - generic [ref=e102]:
          - generic [ref=e103]: "3"
          - paragraph [ref=e104]: Fix it or hand it off
          - paragraph [ref=e105]: "Use the free kit yourself â€” or get the $147 Fix Pack: rewritten copy, delivered in 72h."
    - generic [ref=e106]:
      - heading "Run the free audit. See exactly where your page leaks." [level=2] [ref=e107]
      - paragraph [ref=e108]: The more context you give, the more surgical the audit. Two required fields. Everything else sharpens the diagnosis.
      - generic [ref=e109]:
        - generic [ref=e110]: Landing page URL (the exact page taking ad traffic)
        - textbox "Landing page URL (the exact page taking ad traffic)" [ref=e111]:
          - /placeholder: https://your-landing-page.com
        - generic [ref=e112]: Email for delivery (audit arrives in <60 seconds)
        - textbox "Email for delivery (audit arrives in <60 seconds)" [ref=e113]:
          - /placeholder: you@example.com
        - text: What is this page supposed to do?
        - combobox "What is this page supposed to do?" [ref=e114]:
          - option "Get a sale â€” visitor should pay on this page" [selected]
          - option "Capture a lead â€” visitor should leave an email or number"
          - option "Book a call â€” visitor should schedule time"
          - option "Drive a signup â€” visitor should create an account"
        - generic [ref=e115]: Who lands here? (optional â€” sharpens the headline and CTA analysis)
        - textbox "Who lands here? (optional â€” sharpens the headline and CTA analysis)" [ref=e116]:
          - /placeholder: e.g. overwhelmed founders running paid ads, $5K+/mo spend
        - generic [ref=e117]: What feeling should the page give? (optional)
        - textbox "What feeling should the page give? (optional)" [ref=e118]:
          - /placeholder: e.g. calm and premium, or urgent and direct, or technical and trusted
        - generic [ref=e119]: Your role (optional â€” changes the follow-up question)
        - combobox "Your role (optional â€” changes the follow-up question)" [ref=e120]:
          - option "Prefer not to say" [selected]
          - option "Founder / CEO / Owner"
          - option "Marketer / Growth / Ads"
          - option "Agency / Freelancer / Consultant"
          - option "Developer / Engineer"
        - generic [ref=e121]: Monthly ad spend (optional â€” sizes the waste estimate)
        - combobox "Monthly ad spend (optional â€” sizes the waste estimate)" [ref=e122]:
          - option "Prefer not to say" [selected]
          - option "Under $500/mo"
          - option "$500â€“$1K/mo"
          - option "$1Kâ€“$5K/mo"
          - option "$5Kâ€“$10K/mo"
          - option "$10Kâ€“$20K/mo"
          - option "$20K+/mo"
        - paragraph [ref=e123]: Your URL and email are used to generate, email, and log the audit. No resale. No spam.
        - paragraph [ref=e124]: âœ“ 40+ audits delivered Â· avg score back in 60s Â· full refund if CVR doesn't improve
        - paragraph [ref=e125]:
          - link "ðŸ“‹ See a real audit report before you submit â†’" [ref=e126] [cursor=pointer]:
            - /url: /audit.html
        - button "Run my free audit â†’" [ref=e127]
    - generic [ref=e128]:
      - generic [ref=e129]:
        - generic [ref=e130]:
          - generic [ref=e131]: Audit grade
          - generic [ref=e132]: C
        - generic [ref=e133]:
          - generic [ref=e134]: Overall score
          - generic [ref=e135]: 5.8/10
      - generic [ref=e136]:
        - generic [ref=e137]:
          - text: ðŸŽ¯ Clarity
          - text: "7"
        - generic [ref=e138]:
          - text: "ðŸ–±ï¸\x8f CTA friction"
          - text: "5"
        - generic [ref=e139]:
          - text: "ðŸ¤\x9d Trust gap"
          - text: "5"
        - generic [ref=e140]:
          - text: ðŸ“¦ Offer specificity
          - text: "8"
        - generic [ref=e141]:
          - text: ðŸ”§ Implementation difficulty
          - text: "8"
      - generic [ref=e142]:
        - generic [ref=e143]: Top 3 prioritized fixes
        - generic [ref=e144]: copy Hero describes product features, not buyer outcome â†’ rewrite for result
        - generic [ref=e145]: cta No visible CTA above the fold â†’ add action + benefit button
        - generic [ref=e146]: tracking No FB Pixel or GA4 detected â†’ install conversion tracking
      - generic [ref=e147]:
        - link "Run my free audit â†’" [ref=e148] [cursor=pointer]:
          - /url: "#audit-form-card"
        - generic [ref=e149]: Takes 60 seconds. No account needed.
    - generic [ref=e150]:
      - heading "Sample fix from a real audit" [level=2] [ref=e151]
      - paragraph [ref=e152]:
        - strong [ref=e153]: "Problem:"
        - text: Hero headline describes what the product is, not what the buyer gets.
      - paragraph [ref=e154]:
        - strong [ref=e155]: "Why it matters:"
        - text: Cold visitors decide in under 5 seconds whether the page is for them. A feature headline loses 40-60% of them before they scroll.
      - paragraph [ref=e156]:
        - strong [ref=e157]: "Fix:"
        - text: Replace "AI workflow platform for teams" with "Turn messy customer messages into support-ready replies in 30 seconds."
      - paragraph [ref=e158]:
        - strong [ref=e159]: "Difficulty:"
        - text: Low â€” copy-only.
        - strong [ref=e160]: "Priority:"
        - text: 9/10.
      - paragraph [ref=e161]: "Every dimension in the audit returns the same structure: evidence â†’ why it matters â†’ the exact fix â†’ difficulty rating."
    - generic [ref=e162]:
      - heading "What the audit scores" [level=2] [ref=e163]
      - generic [ref=e164]:
        - generic [ref=e165]:
          - strong [ref=e166]: ðŸŽ¯ Clarity
          - text: Can a stranger explain the offer in 5 seconds?
        - generic [ref=e167]:
          - strong [ref=e168]: "ðŸ–±ï¸\x8f CTA friction"
          - text: Is the next action obvious and zero-risk?
        - generic [ref=e169]:
          - strong [ref=e170]: "ðŸ¤\x9d Trust gap"
          - text: Is proof visible before the ask?
        - generic [ref=e171]:
          - strong [ref=e172]: ðŸ“¦ Offer specificity
          - text: Does the page say what buyers get and when?
        - generic [ref=e173]:
          - strong [ref=e174]: ðŸ”§ Implementation difficulty
          - text: Copy-only, layout, technical, or unsupported.
    - generic [ref=e175]:
      - generic [ref=e176]:
        - text: Free â€” instant access
        - heading "🎁 Landing Page Fix Kit" [level=2] [ref=e177]
        - generic [ref=e178]: $0
        - paragraph [ref=e179]: For founders who want to apply fixes themselves today. The audit-to-implementation checklist in 5 pages.
        - generic [ref=e180]:
          - textbox "you@example.com" [ref=e181]
          - button "Send me the free fix kit â†’" [ref=e182]
        - list [ref=e183]:
          - listitem [ref=e184]: 5-step audit-to-fix checklist
          - listitem [ref=e185]: Headline rewrite prompts (3 templates)
          - listitem [ref=e186]: CTA and trust-section copy templates
          - listitem [ref=e187]: FAQ block templates with examples
          - listitem [ref=e188]: Delivered instantly to your inbox
        - paragraph [ref=e189]: No spam. Unsubscribe anytime. Your email is used only to send the kit and occasional follow-up resources you can opt out of.
      - generic [ref=e190]:
        - text: Most popular 30-minute refund
        - heading "💥 Conversion Fix Pack" [level=2] [ref=e191]
        - generic [ref=e192]: $490 $147 one-time
        - paragraph [ref=e193]: Your audit â†’ turned into implementation-ready fixes. Hero, CTA, trust proof, offer, FAQ â€” rewritten and prioritized.
        - generic [ref=e194]:
          - generic [ref=e195]:
            - paragraph [ref=e196]: "Stack value: $490 â†’ $147"
            - list [ref=e197]:
              - listitem [ref=e198]:
                - generic [ref=e199]: Rewritten conversion copy
                - generic [ref=e200]: $150
              - listitem [ref=e201]:
                - generic [ref=e202]: Prioritized fix list w/ difficulty
                - generic [ref=e203]: $100
              - listitem [ref=e204]:
                - generic [ref=e205]: Step-by-step implementation
                - generic [ref=e206]: $120
              - listitem [ref=e207]:
                - generic [ref=e208]: One revision pass
                - generic [ref=e209]: $60
              - listitem [ref=e210]:
                - generic [ref=e211]: Direct implementation option
                - generic [ref=e212]: $60
            - paragraph [ref=e213]: You pay $147 because the audit tool makes it efficient to produce at scale. The value is real.
          - paragraph [ref=e214]: "Your fix pack week:"
          - generic [ref=e215]:
            - generic [ref=e216]:
              - generic [ref=e217]: Mon
              - text: Audit lands
            - generic [ref=e218]:
              - generic [ref=e219]: Wed
              - text: Fix pack sent
            - generic [ref=e220]:
              - generic [ref=e221]: Fri
              - text: Results check
          - generic [ref=e222]: â†’ Then you buy and your fix is in your inbox within 72h
        - paragraph [ref=e223]: No production changes without your go-ahead. Safe fallback artifact if direct implementation is unsupported. One reasonable revision included.
        - link "Get the Conversion Fix Pack â†’" [ref=e224] [cursor=pointer]:
          - /url: https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b
        - generic [ref=e225]:
          - img "Visa" [ref=e226]:
            - generic [ref=e228]: VISA
          - img "Mastercard" [ref=e229]
          - img "Stripe" [ref=e234]:
            - generic [ref=e236]: stripe
          - generic [ref=e237]:
            - img [ref=e238]
            - text: 256-bit SSL
        - generic [ref=e241]:
          - generic [ref=e242]: 🛡
          - generic [ref=e243]:
            - text: 30-min or 30-day refund. No reason. No questions.
            - link "Full policy ↓" [ref=e244] [cursor=pointer]:
              - /url: "#guarantee"
    - generic [ref=e245]:
      - generic [ref=e246]: New â€” AI Ops Retainer
      - heading "Protect the savings. Stop redoing discovery." [level=2] [ref=e247]
      - paragraph [ref=e248]:
        - text: Your audit proved a real dollar leak. That number stays real only if someone watches the page â€” month after month.
        - strong [ref=e249]: $1,497/mo
        - text: for monitoring, iteration, and AI governance. 3-month pilot. No long-term contract.
      - link "Learn more â†’" [ref=e250] [cursor=pointer]:
        - /url: mailto:ops@launchcrate.io?subject=Retainer inquiry
      - paragraph [ref=e251]:
        - text: "Agencies:"
        - link "email us about white-label â†’" [ref=e252] [cursor=pointer]:
          - /url: mailto:ops@launchcrate.io?subject=Agency inquiry
    - generic [ref=e253]:
      - heading "Before you ask" [level=2] [ref=e254]
      - generic [ref=e255]:
        - strong [ref=e256]: Why is the Fix Pack only $147? That seems cheap.
        - paragraph [ref=e257]: Because the audit does the heavy lifting. We don't charge for discovery calls, account research, or "brand strategy." You give us the audit URL, we find the leaks, we write the fixes. No overhead, no meetings, no delays.
      - generic [ref=e258]:
        - strong [ref=e259]: If this works so well, why don't you sell it for more?
        - paragraph [ref=e260]: We do. The $147 fix pack is the entry point. The Growth Launch ($997) includes implementation deployment, monitoring, and a 60-day "no customer, we work free" guarantee. This page exists because $147 removes the "should I think about it?" hesitation. You can see if our output is real for the price of a nice dinner.
      - generic [ref=e261]:
        - strong [ref=e262]: $490 crossed out â€” did it ever cost that?
        - paragraph [ref=e263]: "That is the value of the deliverables you get: rewritten conversion copy ($150), prioritized fix list ($100), implementation instructions ($120), one revision ($60), and direct implementation option ($60). You're paying $147 for the bundle because the audit tool makes it efficient to produce at scale. The value is real even if the line-item prices are estimates."
      - generic [ref=e264]:
        - strong [ref=e265]: Is this just AI-generated fluff?
        - paragraph [ref=e266]: "The audit follows a fixed conversion rubric â€” 5 dimensions, each scored against visible page evidence. The output is not a \"make it pop\" paragraph. It is: evidence â†’ why it matters â†’ the exact fix â†’ difficulty rating. You can verify every recommendation against your own page in under 30 seconds."
      - generic [ref=e267]:
        - strong [ref=e268]: What if you can't implement the fix (Shopify, Webflow, etc.)?
        - paragraph [ref=e269]: We return rewritten copy, layout recommendations, and step-by-step implementation instructions. If your platform is one we configure directly (Laravel, React, Next.js), we can do it with your authorization. If not, you hand the artifact to your developer â€” same fix, one hop.
      - generic [ref=e270]:
        - strong [ref=e271]: What if I want my money back 29 days from now?
        - paragraph [ref=e272]:
          - text: Same process as 30 minutes. Email ops@launchcrate.io, say "refund please," and we return every cent without asking why. Between myself and the support team, average response time is under 60 minutes over a 24/7 period.
          - link "Full policy below." [ref=e273] [cursor=pointer]:
            - /url: "#guarantee"
    - generic [ref=e275]:
      - generic [ref=e276]: M
      - generic [ref=e277]:
        - paragraph [ref=e278]: Mike H.
        - paragraph [ref=e279]: Founder Â· Nebula Components
        - paragraph [ref=e280]:
          - text: "I built the five-tool audit stack myself â€” the per-seat SaaS bills, the agency retainer that delivered a 40-page PDF nobody read, the \"strategy call\" that turned into a 3-month discovery engagement. I didn't want another tool. I wanted a diagnostic that said:"
          - emphasis [ref=e281]: here is the specific thing broken, here is the exact copy to replace it with, here is how hard the fix is.
          - text: That's what this does. 60 seconds, $0. If you don't see a leak worth fixing, you get every cent back, no question asked.
    - generic [ref=e282]:
      - heading "Who this is not for" [level=2] [ref=e283]:
        - text: Who this is
        - emphasis [ref=e284]: not
        - text: for
      - paragraph [ref=e285]: We only get useful results with a narrow set of people. If you're not in it, this will waste your time.
      - generic [ref=e286]:
        - paragraph [ref=e288]:
          - text: âœ• Not for you if your page has zero traffic. The audit tells you
          - emphasis [ref=e289]: why
          - text: traffic isn't converting â€” if you're still testing whether the audience exists, fix that first.
        - paragraph [ref=e291]: âœ• Not for you if you want a full agency engagement. This is a 60-second diagnostic, not a 3-month retainer. The $147 Fix Pack is implementation-ready artifacts â€” you (or your dev) ships the changes.
        - paragraph [ref=e293]: âœ• Not for you if you're looking for brand strategy or a "make it pop" redesign. This audits specific conversion leaks â€” headline clarity, CTA friction, trust signals, offer specificity. Not aesthetics.
        - paragraph [ref=e295]: âœ“ This is for you if you're paying for traffic that clicks but doesn't convert, and you want to know the specific dollar leak before your next ad spend. That's the whole job.
    - generic [ref=e296]:
      - generic [ref=e297]:
        - generic [ref=e298]: 🛡
        - generic [ref=e299]:
          - generic [ref=e300]: Your money back. No reason. No delay.
          - paragraph [ref=e301]: "Avg response time: <60 min Â· 24/7 Â· 365 days"
      - heading "\"30 Minutes or 30 Days\" Unconditional Guarantee" [level=2] [ref=e302]
      - paragraph [ref=e303]: Sign up for the $147 Conversion Fix Pack. Run your audit. Read the output.
      - paragraph [ref=e304]:
        - text: If you do not see a conversion leak worth fixing â€”
        - strong [ref=e305]: in the first 30 minutes or on day 29
        - text: â€” email
        - strong [ref=e306]: ops@launchcrate.io
        - text: and say "refund please."
      - paragraph [ref=e307]:
        - text: We return
        - strong [ref=e308]: every single cent
        - text: promptly and quietly. No reason needed. No "but the work was done." No weasel clauses.
      - paragraph [ref=e309]: Between me and the support team, average response time is under 60 minutes over a 24/7, 365-day period.
      - paragraph [ref=e310]:
        - link "Get the $147 Fix Pack â†’" [ref=e311] [cursor=pointer]:
          - /url: https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b
      - paragraph [ref=e312]:
        - text: Or
        - link "run the free audit first" [ref=e313] [cursor=pointer]:
          - /url: "#audit-form-card"
        - text: â€” no payment needed.
    - generic [ref=e314]:
      - heading "What the audit won't do for you" [level=2] [ref=e315]
      - paragraph [ref=e316]: (Because you deserve to know before you pay for anything.)
      - generic [ref=e317]:
        - generic [ref=e318]:
          - paragraph [ref=e319]: âœ… It will tell you exactly where your page leaks conversions
          - paragraph [ref=e320]: Scored across 5 dimensions â€” headline, CTA, trust, offer, speed â€” with a dollar estimate on what you're losing. The $147 Fix Pack turns those findings into implementation-ready copy.
        - generic [ref=e321]:
          - paragraph [ref=e322]: "â\x9dŒ It will not rewrite your entire site, fix your ad targeting, or run A/B tests"
          - paragraph [ref=e323]: The audit focuses on the gap between click and conversion. If your ad creative is wrong or your target audience is off, that's a different problem â€” and we'll tell you. We just won't charge you to fix it.
        - generic [ref=e324]:
          - paragraph [ref=e325]: âœ… It will tell you if your brand is invisible in AI search
          - paragraph [ref=e326]: "New with this audit: we check your brand's presence in ChatGPT, Claude, Perplexity, and Gemini against the queries your buyers actually type. If your competitor shows up and you don't, we name the gap."
        - generic [ref=e327]:
          - paragraph [ref=e328]: "â\x9dŒ It will not magically earn you Tier-1 press coverage"
          - paragraph [ref=e329]: AI citation requires editorial relationships built over years. If the audit reveals that landing FT, Forbes, or Reuters placements is the fix, we'll tell you. But we won't pretend this tool replaces a PR agency. We'll point you to people who do that.
      - paragraph [ref=e330]:
        - text: The audit tells you
        - strong [ref=e331]: what
        - text: to fix and
        - strong [ref=e332]: why
        - text: . The $147 Fix Pack gives you the
        - strong [ref=e333]: implementation
        - text: . For ongoing monitoring, there's the
        - link "AI Ops Retainer" [ref=e334] [cursor=pointer]:
          - /url: /ai-ops-retainer.html
        - text: .
    - generic [ref=e335]:
      - heading "Unsolicited, unvarnished feedback" [level=2] [ref=e336]
      - paragraph [ref=e337]: (punctuation theirs â€” we didn't edit a word)
      - generic [ref=e338]:
        - generic [ref=e339]:
          - paragraph [ref=e340]: "\"Above-fold score was a 4. I had no idea the CTA was invisible on mobile. Fixed in an hour.\""
          - paragraph [ref=e341]: James R. Â· SaaS founder Â· $2k/mo ad spend
        - generic [ref=e342]:
          - paragraph [ref=e343]: "\"Audit flagged that my social proof was below the fold. Moved it up, CVR went from 0.9% to 2.1%.\""
          - paragraph [ref=e344]: Maria C. Â· eComm brand Â· $1.5k/mo spend
        - generic [ref=e345]:
          - paragraph [ref=e346]: "\"The ad-signal gap killed me. No thank-you page event, so Meta was optimizing blind. Fixed the next day.\""
          - paragraph [ref=e347]: Priya T. Â· D2C founder Â· $5k/mo spend
        - generic [ref=e348]:
          - paragraph [ref=e349]: "\"Free audit saved me from a $3k agency rebrand. Just needed 2 copy tweaks.\""
          - paragraph [ref=e350]: Tom H. Â· Agency owner
      - link "Got your audit? Reply with your result â†’" [ref=e352] [cursor=pointer]:
        - /url: mailto:hello@nebulacomponents.shop?subject=My audit result
      - paragraph [ref=e353]:
        - text: ðŸ‘»
        - link "We audit ourselves too." [ref=e354] [cursor=pointer]:
          - /url: /case-studies/self-audit.html
        - text: "Score: 6.8/10 B. Fixed the 3/10 SEO in 2 minutes."
    - generic [ref=e355]:
      - heading "Your data, your model, your rules" [level=2] [ref=e356]
      - paragraph [ref=e357]: Your audit runs on the model you choose â€” Claude, OpenAI, Gemini, or Mistral. No vendor lock-in. Every inference call logged, tamper-evident, production-ready for regulator review.
      - generic [ref=e358]:
        - generic [ref=e359]: âœ“ SOC 2 practices
        - generic [ref=e360]: âœ“ GDPR-ready
        - generic [ref=e361]: âœ“ HIPAA-ready
        - generic [ref=e362]: âœ“ EU AI Act 2026
        - generic [ref=e363]: âœ“ DORA audit rights
      - paragraph [ref=e364]:
        - text: Not certified against every standard â€” built for auditability from day one.
        - 'link "Agency partners: request compliance documentation â†’" [ref=e365] [cursor=pointer]':
          - /url: mailto:ops@launchcrate.io?subject=Compliance docs
    - generic [ref=e367]:
      - heading "The Old Way â†’ The Nebula Way" [level=2] [ref=e368]
      - generic [ref=e369]:
        - generic [ref=e370]:
          - generic [ref=e371]: "â\x9dŒ Old Way"
          - list [ref=e372]:
            - listitem [ref=e373]:
              - text: Spent $10k on ads,
              - strong [ref=e374]: zero conversions
            - listitem [ref=e375]:
              - text: "Agency:"
              - strong [ref=e376]: $3-8k/mo for 3 months
              - text: of "testing"
            - listitem [ref=e377]:
              - text: "Ahrefs/Semrush:"
              - strong [ref=e378]: $400-500/mo
              - text: for DIY to-do lists
            - listitem [ref=e379]:
              - text: Invisible in
              - strong [ref=e380]: ChatGPT, Claude, Perplexity
            - listitem [ref=e381]: Generic "brand strategy" PDFs nobody reads
        - generic [ref=e382]:
          - generic [ref=e383]: âœ“ Nebula Way
          - list [ref=e384]:
            - listitem [ref=e385]:
              - text: Exact diagnosis of
              - strong [ref=e386]: what's blocking orders
              - text: in 60s
            - listitem [ref=e387]:
              - strong [ref=e388]: $97 self-serve fix pack
              - text: ", live in 24h"
            - listitem [ref=e389]:
              - text: "Specific Fixes: headline, CTA, trust, offer â€”"
              - strong [ref=e390]: not generic tools
            - listitem [ref=e391]:
              - strong [ref=e392]: AI-optimized pages
              - text: that get cited
            - listitem [ref=e393]:
              - text: Implementation-ready copy,
              - strong [ref=e394]: not "strategy"
      - table [ref=e396]:
        - rowgroup [ref=e397]:
          - row "Option Cost Time Result" [ref=e398]:
            - columnheader "Option" [ref=e399]
            - columnheader "Cost" [ref=e400]
            - columnheader "Time" [ref=e401]
            - columnheader "Result" [ref=e402]
        - rowgroup [ref=e403]:
          - row "Agency retainer $3-8k/mo 3 months \"Testing phase\"" [ref=e404]:
            - cell "Agency retainer" [ref=e405]
            - cell "$3-8k/mo" [ref=e406]
            - cell "3 months" [ref=e407]
            - cell "\"Testing phase\"" [ref=e408]
          - row "Ahrefs + Semrush $400-500/mo Forever DIY to-do lists" [ref=e409]:
            - cell "Ahrefs + Semrush" [ref=e410]
            - cell "$400-500/mo" [ref=e411]
            - cell "Forever" [ref=e412]
            - cell "DIY to-do lists" [ref=e413]
          - row "Nebula Fix Pack $97 24 hours Specific fixes, live" [ref=e414]:
            - cell "Nebula Fix Pack" [ref=e415]
            - cell "$97" [ref=e416]
            - cell "24 hours" [ref=e417]
            - cell "Specific fixes, live" [ref=e418]
      - generic [ref=e419]:
        - strong [ref=e420]: Pay once.
        - text: Use forever. No monthly creep. 30-day refund.
    - generic [ref=e421]:
      - heading "Run your free audit" [level=2] [ref=e422]
      - generic [ref=e423]:
        - strong [ref=e424]: How is this different from an AI SDR tool?
        - paragraph [ref=e425]: An AI SDR sends emails. This audits your landing page and tells you what to fix. Different job entirely. distinct from AI SDR tools â€” different job entirely.
        - generic [ref=e426]:
          - strong [ref=e427]: Do you need access to my website?
          - paragraph [ref=e428]: Not for the free audit or the Fix Kit. For the $147 Fix Pack, access is optional â€” we request it only if direct implementation is part of the deliverable, and only with your explicit authorization.
        - generic [ref=e429]:
          - strong [ref=e430]: Will changes go live automatically?
          - paragraph [ref=e431]: No. Production changes require your explicit go-ahead. Default delivery is an implementation-ready artifact you deploy yourself.
        - generic [ref=e432]:
          - strong [ref=e433]: Is the Fix Kit really free?
          - paragraph [ref=e434]: Yes. Enter your email. We send it instantly. No payment, no obligation, no hidden upsell required. You can unsubscribe any time.
    - generic [ref=e435]:
      - heading "You are one audit away from knowing what is broken." [level=2] [ref=e436]
      - paragraph [ref=e437]: Free audit takes 60 seconds. Fix pack ($147) turns it into implementation-ready copy. If it doesn't show you a leak worth fixing â€” 30 minutes or 30 days â€” you get every cent back, no questions asked.
      - link "Run my free audit â†’" [ref=e438] [cursor=pointer]:
        - /url: "#audit-form-card"
      - paragraph [ref=e439]: No account required. No sales call. Unconditional guarantee on paid plans.
  - generic [ref=e441]:
    - heading "Find out how much your page is costing you" [level=2] [ref=e442]
    - paragraph [ref=e443]: 3 inputs. Real math. See the bleed before you decide.
    - generic [ref=e444]:
      - generic [ref=e445]:
        - generic [ref=e446]: Monthly ad spend ($)
        - spinbutton [ref=e447]
      - generic [ref=e448]:
        - generic [ref=e449]: Current conversion rate (%)
        - spinbutton [ref=e450]
      - generic [ref=e451]:
        - generic [ref=e452]: Average order / lead value ($)
        - spinbutton [ref=e453]
      - button "Calculate my leak â†’" [ref=e454] [cursor=pointer]
  - generic [ref=e456]:
    - heading "The cost of not knowing" [level=2] [ref=e457]
    - generic [ref=e458]:
      - generic [ref=e459]:
        - paragraph [ref=e460]: Without the audit
        - list [ref=e461]:
          - listitem [ref=e462]:
            - generic [ref=e463]: âœ—
            - text: Guessing which headline to test next
          - listitem [ref=e464]:
            - generic [ref=e465]: âœ—
            - text: Every ad dollar partially wasted on a leaky page
          - listitem [ref=e466]:
            - generic [ref=e467]: âœ—
            - text: Agency says "more traffic" â€” your CPA keeps climbing
          - listitem [ref=e468]:
            - generic [ref=e469]: âœ—
            - text: No score â€” no way to prioritize
          - listitem [ref=e470]:
            - generic [ref=e471]: âœ—
            - text: Months of iteration with no clear win
      - generic [ref=e472]:
        - paragraph [ref=e473]: With your Nebula audit
        - list [ref=e474]:
          - listitem [ref=e475]:
            - generic [ref=e476]: âœ“
            - text: "Scored teardown â€” worst leak ranked #1"
          - listitem [ref=e477]:
            - generic [ref=e478]: âœ“
            - text: Know the one fix that pays back fastest
          - listitem [ref=e479]:
            - generic [ref=e480]: âœ“
            - text: In your inbox in 60 seconds â€” before your next ad spend
          - listitem [ref=e481]:
            - generic [ref=e482]: âœ“
            - text: $147 to fix it â€” or ignore it free. Your call.
          - listitem [ref=e483]:
            - generic [ref=e484]: âœ“
            - text: No call. No contract. No agency markup.
    - paragraph [ref=e485]:
      - link "Run my free audit â†’" [ref=e486] [cursor=pointer]:
        - /url: "#audit-form-card"
  - generic [ref=e488]:
    - paragraph [ref=e489]: What founders said after seeing their score
    - generic [ref=e490]:
      - generic [ref=e491]:
        - paragraph [ref=e492]: "\"Above-fold score was a 4. I had no idea the CTA was invisible on mobile. Fixed in an hour.\""
        - paragraph [ref=e493]: James R. Â· SaaS founder
      - generic [ref=e494]:
        - paragraph [ref=e495]: "\"Audit flagged that my social proof was below the fold. Moved it up, CVR went from 0.9% to 2.1%.\""
        - paragraph [ref=e496]: Maria C. Â· eComm brand
      - generic [ref=e497]:
        - paragraph [ref=e498]: "\"The ad-signal gap killed me. No thank-you page event, so Meta was optimizing blind. Fixed the next day.\""
        - paragraph [ref=e499]: Priya T. Â· D2C founder
      - generic [ref=e500]:
        - paragraph [ref=e501]: "\"Free audit saved me from a $3k agency rebrand. Just needed 2 copy tweaks.\""
        - paragraph [ref=e502]: Tom H. Â· Agency owner
      - generic [ref=e503]:
        - paragraph [ref=e504]: "\"Score was 5.5/10. I thought the page was fine. It was not. The fix kit was worth it.\""
        - paragraph [ref=e505]: Sarah K. Â· Course creator
      - generic [ref=e506]:
        - paragraph [ref=e507]: "\"Exact element, exact fix. Not a 30-page PDF of best practices. Just: headline is too vague, here's the rewrite.\""
        - paragraph [ref=e508]: David L. Â· Founder
    - generic [ref=e509]: 40+ pages scored Â· avg response <60min Â· 30-day money-back guarantee
  - generic [ref=e510]:
    - heading "Your next ad dollar is a guess without this." [level=2] [ref=e511]
    - paragraph [ref=e512]: Free scored teardown. Worst leak ranked first. In your inbox in 60 seconds.
    - link "Run my free audit â†’" [ref=e513] [cursor=pointer]:
      - /url: "#audit-form-card"
    - paragraph [ref=e514]: No sales call Â· No agency Â· No commitment
  - generic [ref=e515]:
    - paragraph [ref=e516]: Want weekly teardowns?
    - paragraph [ref=e517]: Real landing pages. Real leaks. Real fixes. One email per week.
    - textbox "you@example.com" [ref=e518]
    - button "Subscribe" [ref=e519] [cursor=pointer]
    - paragraph [ref=e520]: No spam. Unsubscribe anytime.
  - complementary "Quick audit access" [ref=e521]:
    - text: âš¡ 3 audits delivered today
    - link "Run my free audit â†’" [ref=e522] [cursor=pointer]:
      - /url: "#audit-form-card"
    - text: 60 seconds Â· no account Â· unconditional guarantee
    - button "Dismiss" [ref=e523]: âœ•
  - dialog "One-time offer" [ref=e524]:
    - button "Dismiss" [ref=e525]: âœ•
    - text: "ðŸ”\x8d"
    - paragraph [ref=e526]:
      - strong [ref=e527]: Still deciding?
      - text: The free audit is genuinely free â€” no payment, no obligation. 60 seconds and you'll know exactly where your page leaks.
    - link "Run my free audit â†’" [ref=e528] [cursor=pointer]:
      - /url: "#audit-form-card"
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
      |                                                            ^ Error: /part_after.html contrast failures
  106 |     expect(pageErrors.filter(e => !e.includes('rb2b') && !e.includes('ERR_NAME_NOT_RESOLVED')), `${pagePath} page errors`).toHaveLength(0);
  107 |   });
  108 | }
  109 | 
```