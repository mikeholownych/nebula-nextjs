# Nebula Components Buyer Psychology + Autonomous Funnel Optimization

Evidence inspected:
- Live homepage: `https://nebulacomponents.shop/`
- Live audit page: `https://nebulacomponents.shop/audit.html`
- Live checkout paths: `/checkout?price=7`, `/checkout?price=97`
- Local files: `/home/mike/nebula/index.html`, `checkout.html`, `audit.html`

Critical execution findings:
- Homepage form posts to `/audit` → live `GET /audit` is 404; browser submit navigated to an error page.
- Homepage CTAs point to `/checkout?price=7` and `/checkout?price=97` → both return 404 live.
- Existing `checkout.html` expects query params but homepage links omit `.html`.
- Live audit page is static/generic and not tied to submitted URL.
- $97 copy says AI implements automatically, but the page does not disclose platform support, authorization, preview, fallback, revision, or refund policy.

## 1. Skeptical Buyer Belief Audit

### Free audit
| Required belief | Current support | Fix |
|---|---:|---|
| Not spam | Weak | Add company identity, privacy line, sample audit, no-call promise. |
| URL not abused | Fails | Add URL-use statement: fetched once, stored for audit/logging, no resale. |
| Useful output | Weak | Show sample report with 5 concrete categories. |
| Fast enough | Fails | State delivery: instant/on-page or email in X minutes. |
| Better than generic AI | Fails | Explain scoring rubric + deterministic checks + page evidence. |
| No hidden obligation | Weak | Explicit: no call, no subscription, no obligation. |
| Understands conversion | Weak | Add pain-specific sections: message match, CTA friction, proof gap, offer clarity. |

### $7 DIY kit
| Required belief | Current support | Fix |
|---|---:|---|
| Immediately usable | Weak | List exact files/templates/prompts. |
| Saves time | Weak | Promise “apply top 5 fixes in under 60 minutes.” |
| Conversion-specific | Weak | Position around audit-to-fix workflow, not generic checklist. |
| Non-expert usable | Weak | Add screenshots/examples/checklist. |
| Risk negligible | Weak | 7-day refund if not useful. |
| Instant access | Weak | State instant download/email and fix broken checkout path. |

### $97 implementation
| Required belief | Current support | Fix |
|---|---:|---|
| AI safely improves page | Fails | Reframe to AI-assisted conversion fix pack. |
| Won’t break site | Fails | No production changes without customer pre-authorization. |
| Scope clear | Fails | Define: copy, CTA, structure, trust section, FAQ, implementation instructions. |
| Review before live | Fails | Add preview/artifact-first fulfillment. |
| Limits disclosed | Fails | Add unsupported platform fallback. |
| Delivery credible | Weak | Show exact 24h workflow and inputs required. |
| Access/input clarity | Fails | Ask URL + email + optional platform; access only if authorized. |
| Refund/revision | Fails | Add one revision or refund if scope not met. |
| Worth $97 | Weak | Compare to freelancer/ChatGPT: prioritized, implementation-ready, QA’d, delivered. |

## 2. Psychographic Buyer Analysis / Segments

| Segment | Pain language | Desired outcome | Fear | Skepticism | Trigger phrase | Best CTA | Best offer | Proof asset | Abandonment reason | Best angle |
|---|---|---|---|---|---|---|---|---|---|---|
| Frustrated Founder | “Traffic is landing but nobody acts.” | Know what to change first. | Wasting more traffic. | Generic AI advice. | “Show me the top 5 leaks.” | Run free teardown | Free audit → $7 kit | Sample audit | Too vague | “Stop guessing why visitors bounce.” |
| Broke Indie Hacker | “I need cheap fixes today.” | Checklist + prompts. | Paying for fluff. | “ChatGPT is free.” | “Give me the checklist.” | Get $7 fix kit | $7 DIY | Before/after examples | $97 feels risky | “Fix the obvious conversion leaks tonight.” |
| Time-Starved Operator | “I don’t want to learn CRO.” | Done-for-me artifact. | Site breakage/time sink. | “Will this be safe?” | “Turn this into ready-to-ship fixes.” | Get $97 fix pack | $97 implementation-ready bundle | Workflow + policy | Unclear scope | “Get reviewable fixes without a call.” |
| Skeptical Professional | “Most audits are fake.” | Evidence and specificity. | Looking amateur. | Thin credibility. | “Show me a sample first.” | View sample audit | Free audit first | Public sample report | No proof | “No scorecard fluff. Evidence-backed teardown.” |

Primary segment for 7-day competition: **Frustrated Founder with active traffic and weak conversions**.
Reason: strongest pain + fastest self-serve conversion path + naturally accepts free audit first. Secondary monetization: Broke Indie Hacker buys $7; Time-Starved Operator buys $97 after audit.

## 3. Emotional Journey

| Step | Visitor thought | Emotion | Friction | Current failure | Required move |
|---|---|---|---|---|---|
| Arrival | “What is this?” | Guarded | Thin page | Generic headline | Call out traffic/no-conversion pain. |
| Skepticism | “Is this spam?” | Distrust | No identity/privacy | No proof | Show sample, privacy, no-call. |
| Curiosity | “Maybe it can spot leaks.” | Interested | No sample | Static claims | Show 5 checks and example finding. |
| Risk | “What happens to my URL/email?” | Defensive | No data policy | Only URL form | Explain storage/use. |
| Value | “Will I learn anything?” | Evaluating | Vague output | “conversion killers” only | List exact deliverables. |
| Proof | “Show me first.” | Skeptical | No sample | None | Embed sample audit preview. |
| CTA | “What do I click?” | Ready/uncertain | Broken form/links | 404 | Fix paths + email field + confirmation. |
| Payment | “Why pay?” | Hesitant | No scope/refund | Bad $97 claim | Add $7/$97 precise offer cards. |
| Post-pay | “Did I get it?” | Anxious | No expectations | Unknown | Confirmation + delivery SLA. |
| Fulfillment | “Can I trust this?” | Relief if clear | No policy | None | Send artifact, logs, support/refund rules. |

## 4. Revised Offer Strategy

### Free audit rewrite
**Offer:** “Paste your landing page URL. Get a prioritized teardown of the top 5 conversion leaks: headline clarity, CTA friction, trust gap, offer specificity, and implementation difficulty.”

Bullets:
- Delivered on-page and by email.
- No sales call. No hidden obligation.
- URL is used only to generate and log your audit.
- Includes a recommended next step: DIY checklist or implementation-ready fix pack.

CTA: **Run my free landing page teardown**

### $7 DIY kit rewrite
**Offer:** “The 60-Minute Landing Page Fix Kit — $7”

Includes:
- 5-step audit-to-fix checklist.
- Headline rewrite prompts.
- CTA rewrite examples.
- Trust-section templates.
- FAQ block templates.
- Before/after mini examples.
- Instant download after checkout.

CTA: **Get the $7 fix kit**
Guarantee: “If it does not give you at least one concrete fix to apply, request a refund within 7 days.”

### $97 service rewrite
Rename: **$97 Conversion Fix Pack**

Safer promise:
“Turn your audit into implementation-ready landing page improvements. You receive rewritten sections, layout recommendations, and step-by-step implementation instructions. If your platform supports safe direct edits and you explicitly authorize access, changes are previewed before going live.”

Includes:
- Priority fixes from audit.
- Rewritten hero, CTA, trust section, FAQ, and offer copy.
- Implementation instructions for your stack.
- Optional direct implementation only with explicit customer authorization.
- Safe fallback artifact if direct implementation is unsupported.
- One reasonable revision if deliverable misses stated scope.

CTA: **Get my $97 conversion fix pack**

## 5. Current Site Friction Audit

| Friction | Type | Severity | Impact | Fix | Immediate? | Expected lift |
|---|---|---:|---|---|---:|---:|
| `/audit` form action 404 | Technical | Critical | Kills free audit | Point to working endpoint or JS confirmation flow | Yes | Very high |
| `/checkout?price=*` 404 | Payment | Critical | Kills purchases | Link to Stripe URLs or `/checkout.html?price=*` | Yes | Very high |
| No email field | Fulfillment | Critical | Cannot deliver audit | Add email required + optional goal | Yes | High |
| Generic audit output | Proof | High | Looks fake | Generate URL-specific audit or label sample as sample | Significant | High |
| “AI implements automatically” | Risk/trust | High | Refund/dispute risk | Reframe as fix pack with authorization levels | Yes | High |
| No privacy statement | Trust | High | URL submit hesitation | Add URL/data policy | Yes | Medium-high |
| No sample audit | Proof | High | Skeptics bounce | Add embedded sample | Yes | High |
| No refund/revision policy | Risk | High | Payment hesitation | Add clear terms | Yes | Medium-high |
| No delivery timeline | Clarity | High | Uncertainty | Add instant/24h SLA | Yes | Medium |
| Thin page | Offer | High | Low credibility | Add full buyer-answering structure | Yes | High |
| No supported platforms | Fulfillment | High | $97 fear | Add supported/unsupported/fallback | Yes | Medium-high |
| No post-payment expectations | Fulfillment | Medium | Support/refunds | Add confirmation/email | Yes | Medium |

## 6. Required Page Structure / Wireframe

1. Hero: “Find the 5 landing page leaks costing you signups.”
2. Audience callout: “For founders with traffic but weak conversions.”
3. URL + email form + optional goal.
4. Trust strip: “No call. No spam. URL used only for audit. Review before implementation.”
5. Sample audit preview.
6. What the audit checks: clarity, CTA, proof, offer, friction/speed.
7. What you receive: prioritized fixes + difficulty + next step.
8. Why not generic AI: evidence from rendered page + fixed rubric + implementation difficulty.
9. $7 DIY kit card.
10. $97 conversion fix pack card.
11. Scope boundaries and authorization levels.
12. Timeline.
13. Refund/revision policy.
14. Privacy statement.
15. FAQ.
16. Final CTA.

## 7. Full Replacement Landing Page Copy

### Hero
**Your landing page is leaking buyers. Get the top 5 fixes in minutes.**

Paste your URL. Nebula checks the parts that usually block conversions: headline clarity, CTA friction, trust proof, offer specificity, and implementation difficulty.

**No sales call. No fake scorecard. No obligation.**

Form:
- Landing page URL
- Email address
- Optional goal: leads / sales / signups / bookings

CTA: **Run my free teardown**
Microcopy: “We use your URL only to generate and log the audit. No resale. No spam.”

### Sample audit preview
**Example finding**
- Problem: Hero headline explains the product but not the buyer outcome.
- Why it matters: Cold visitors decide in seconds whether the page is for them.
- Fix: Replace “AI workflow platform for teams” with “Turn messy customer messages into support-ready replies in 30 seconds.”
- Difficulty: Low — copy-only.
- Priority: 9/10.

### What the free audit checks
- Above-the-fold clarity: can a stranger explain the offer in 5 seconds?
- CTA clarity: is the next action obvious and low-friction?
- Trust gap: is proof visible before the ask?
- Offer specificity: does the page say what the buyer gets, when, and why now?
- Implementation difficulty: copy-only, layout, technical, or unsupported.

### Why this is different from generic AI advice
Generic AI gives broad CRO tips. Nebula returns a prioritized fix list tied to your visible page: what is wrong, why it matters, what to change, and how hard it is to implement.

### $7 DIY card
**Want to fix it yourself? Get the $7 60-Minute Landing Page Fix Kit.**
Instant download includes the 5-step checklist, headline prompts, CTA examples, trust-section templates, FAQ templates, and before/after examples.

CTA: **Get the $7 fix kit**
Microcopy: “Instant access. 7-day refund if it does not give you one concrete fix.”

### $97 service card
**Want the fixes turned into implementation-ready changes? Get the $97 Conversion Fix Pack.**
We convert your audit into rewritten sections, layout recommendations, and step-by-step implementation instructions. If safe direct implementation is supported and you explicitly authorize access, you review changes before anything goes live.

CTA: **Get the $97 conversion fix pack**
Microcopy: “No production changes without your authorization. Unsupported platforms receive implementation-ready copy and instructions.”

### Policy summary
- No production changes without buyer authorization.
- Least-privilege access only when needed.
- No unnecessary credentials.
- No guaranteed conversion lift claims.
- One reasonable revision if the deliverable misses stated scope.
- If direct implementation is unsafe or unsupported, you receive the fix pack artifact instead.

## 8. CTA Hierarchy

Primary: **Run my free teardown**
Secondary after audit: **Get the $7 fix kit**
Tertiary/high-intent: **Get the $97 conversion fix pack**
Avoid: “Get started”, “Automated implementation”, “Just results”.

## 9. FAQ

**Is this just ChatGPT output?**  
No. The audit follows a fixed conversion rubric and ties each recommendation to visible page evidence. AI may assist the analysis, but the deliverable is structured around specific page findings, priority, and implementation difficulty.

**Do you need access to my website?**  
Not for the free audit or $7 kit. For the $97 fix pack, access is optional and only requested if you want direct implementation.

**Will changes go live automatically?**  
No. Production changes require explicit authorization. Default delivery is implementation-ready copy and instructions.

**What platforms do you support?**  
Copy/instruction deliverables support any landing page. Direct implementation depends on stack/access. Static HTML is safest. Builders/CMS/custom apps may receive artifact-only delivery.

**What if my page is already good?**  
The audit will say that and recommend the smallest useful next step, not invent issues.

**What if the audit is not useful?**  
Reply/request support. Paid offers have policy-bounded refund or revision terms.

**How fast do I get results?**  
Free audit: instant/on-page or emailed in minutes. $7 kit: instant. $97 fix pack: target delivery within 24 hours after required inputs.

**What does the $7 kit include?**  
Checklist, prompts, examples, trust-section templates, CTA templates, and FAQ templates.

**What does the $97 service include?**  
Priority fix pack: rewritten sections, recommended layout changes, implementation instructions, and optional direct implementation only when safe and authorized.

**What if implementation is not technically possible?**  
You receive implementation-ready copy, layout notes, and step-by-step instructions instead.

**Can I review changes first?**  
Yes. Review is the default before anything goes live.

**Do you store my URL or data?**  
We store the URL, email, audit result, payment/delivery status, and support/refund events for fulfillment and measurement. We do not resell submitted URLs.

**Is there a refund policy?**  
$7: refund within 7 days if no concrete fix. $97: refund or one revision if the deliverable misses stated scope or cannot be fulfilled even as a fallback artifact.

**Who is this best for?**  
Founders with a live landing page, some traffic, and weak conversion.

**Who is this not for?**  
Teams needing full brand strategy, enterprise CRO research, A/B testing infrastructure, custom engineering, or guaranteed conversion lift.

## 10. Post-submit Confirmation Copy

**Your audit is queued.**

We are checking:
- headline clarity
- CTA friction
- trust proof
- offer specificity
- implementation difficulty

You’ll receive the audit at `[email]`. No call required.

While you wait:
- Want to fix findings yourself? **Get the $7 fix kit.**
- Want implementation-ready fixes? **Get the $97 conversion fix pack.**

## 11. $7 Checkout Copy

Headline: **Get the 60-Minute Landing Page Fix Kit**

For founders who want to apply the audit fixes themselves today.

Includes:
- 5-step implementation checklist
- headline rewrite prompts
- CTA examples
- trust-section templates
- FAQ templates
- before/after examples

Delivery: instant download + email receipt.
Guarantee: 7-day refund if it does not give you one concrete fix.
CTA: **Pay $7 — get instant access**

## 12. $97 Checkout Copy

Headline: **Get your Conversion Fix Pack**

We turn your audit into implementation-ready landing page improvements.

Included:
- rewritten hero/CTA/trust/FAQ/offer sections
- prioritized fix list
- implementation instructions
- optional direct implementation only with explicit authorization
- one reasonable revision if scope is missed

Not included:
- guaranteed conversion lift
- custom app engineering
- ads management
- unauthorized production changes

CTA: **Pay $97 — start my fix pack**

## 13. Post-purchase Emails

### $7 email
Subject: Your Nebula Fix Kit is ready

Your $7 Landing Page Fix Kit is ready: `[download_link]`

Start here:
1. Open the checklist.
2. Apply the hero/CTA fix first.
3. Add one trust section before the next CTA.
4. Use the FAQ template to remove buyer fear.

If it does not give you one concrete fix, request a refund within 7 days.

### $97 email
Subject: Your Nebula Conversion Fix Pack is started

We received your order.

Next steps:
1. We analyze your audit and page.
2. We produce rewritten sections + implementation instructions.
3. If direct implementation is supported and you authorize it, you review changes before production.
4. If direct implementation is unsafe or unsupported, you receive the implementation-ready artifact instead.

Target delivery: within 24 hours after required inputs are available.

## 14. Audit Report Template

Fields:
- Audit ID
- URL
- Page goal
- Screenshot/render timestamp if available
- Overall grade
- Clarity score 1-10
- CTA score 1-10
- Trust score 1-10
- Offer specificity score 1-10
- Friction/speed score 1-10
- Top 5 prioritized fixes
  - issue
  - evidence
  - why it matters
  - recommended rewrite/change
  - implementation difficulty
  - priority
- Recommended next step: no action / $7 DIY / $97 fix pack
- Policy and data footer

## 15. DIY Kit Contents

1. Start-here PDF/checklist.
2. Headline rewrite worksheet.
3. CTA rewrite swipe file.
4. Trust proof block templates.
5. FAQ templates.
6. Before/after mini examples.
7. Copy-paste HTML snippets.
8. “When to buy the $97 fix pack” decision tree.

## 16. $97 Fulfillment SOP

1. Create order record.
2. Pull audit by URL/email.
3. Re-fetch landing page.
4. Generate fix pack from template.
5. Run QA checks:
   - no guaranteed results claim
   - no unsupported direct implementation promise
   - at least 5 concrete page-specific fixes
   - artifact includes implementation difficulty
6. Route by authorization level:
   - Artifact-only: send PDF/HTML/markdown fix pack.
   - Preview-authorized: produce patch/preview link where supported.
   - Direct-authorized: apply only reversible scoped changes; send log.
7. Send delivery email.
8. Append delivery event to customer ledger.
9. If QA fails, refund or deliver safe fallback.

## 17. Refund / Revision Policy

$7: refund within 7 days if the kit does not provide at least one actionable landing page fix.

$97: one reasonable revision if the delivered fix pack misses stated scope. Refund if Nebula cannot deliver either safe implementation-ready artifacts or an authorized implementation attempt.

No guarantee of conversion lift. Refund does not cover customer refusal to provide required inputs after purchase unless policy auto-refund window applies.

## 18. Analytics Event Plan

| Event | Trigger | Storage | Owner | Failure mode |
|---|---|---|---|---|
| `page_visit` | homepage load | web log + analytics jsonl | CEO/Ops | no traffic baseline |
| `audit_form_start` | URL field focus | browser event log | Growth | cannot measure form friction |
| `audit_submit` | form submit | customer-ledger | Support | missed lead |
| `audit_complete` | report generated | customer-ledger | Support | cannot calculate fulfillment |
| `checkout_7_start` | $7 CTA click | revenue-cost-ledger/customer-ledger | Ops | dropoff invisible |
| `purchase_7` | Stripe webhook | revenue-cost-ledger | Ops | revenue untrusted |
| `checkout_97_start` | $97 CTA click | customer-ledger | Ops | no intent signal |
| `purchase_97` | Stripe webhook | revenue-cost-ledger | Ops | revenue untrusted |
| `refund_request` | email/form/refund event | incident + revenue-cost | Support/Ops | refund risk hidden |
| `delivery_complete` | deliverable sent | customer-ledger | Support | disputes unprovable |
| `email_open` | tracking pixel/open if used | email log | Growth | weak follow-up data |
| `email_click` | link click | redirect log | Growth | offer interest hidden |
| `support_inquiry` | inbound email | support ledger | Support | unanswered objections |
| `abandonment_point` | CTA click no purchase | analytics | CEO | cannot improve funnel |

## 19. Immediate Implementation Checklist

1. Fix homepage form action. Use working endpoint or JS audit flow; do not point to `/audit` unless route exists.
2. Add email field and optional goal field.
3. Change checkout links to real URLs:
   - $7: Stripe link or `/checkout.html?price=7`
   - $97: Stripe link or `/checkout.html?price=97`
4. Remove “AI implements automatically.” Replace with “Conversion Fix Pack.”
5. Add sample audit preview above paid offers.
6. Add privacy/data line below form.
7. Add refund/revision policy.
8. Add implementation policy summary.
9. Add post-submit confirmation page/copy.
10. Add analytics logging for submit/click/purchase/delivery.

## 20. Risk Register

| Risk | Severity | Mitigation |
|---|---:|---|
| Broken submit/checkout routes | Critical | Fix links/routes before outreach. |
| Overclaiming automated implementation | High | Safer $97 framing + authorization levels. |
| Generic audit output | High | Evidence-based template + QA threshold. |
| Refund disputes | High | Clear scope, fallback, revision/refund policy. |
| Credential exposure | High | Least privilege, no plaintext, no unnecessary access. |
| Unsafe production edits | High | Default artifact-only; explicit authorization for edits. |
| Tracking failure | Medium | Ledger + Stripe webhook as source of truth. |
| Low trust due thin page | High | Sample, policy, scope, FAQ, proof. |
| Too much copy reducing action | Medium | Put short hero + sample + CTA above fold; details below. |

## 21. Autonomy Classification

| Funnel step | Classification | Reason | Remove dependency safely? | Offer/process change |
|---|---|---|---|---|
| Visitor arrives | Fully autonomous now | Static page loads | Yes | Add tracking. |
| URL submit | Autonomous with minor fixes | Current route broken; email missing | Yes | Working endpoint + ledger. |
| Audit generated | Autonomous with significant engineering | Static generic audit now | Yes | Deterministic scraper/scorer + QA. |
| Offer selection | Autonomous with minor fixes | Can route by score/intent | Yes | Rule-based: low score → $7, high intent → $97. |
| Checkout | Autonomous with minor fixes | Links broken but Stripe exists | Yes | Direct Stripe + webhook ledger. |
| $7 fulfillment | Autonomous with minor fixes | Digital file can auto-send | Yes | Stripe webhook → email link. |
| $97 fulfillment | Autonomous with significant engineering | Direct implementation unsafe by default | Partially | Make default artifact-only; direct only by explicit authorization. |
| Customer follow-up | Autonomous with minor fixes | Email automation possible | Yes | Sequence from ledger stage. |
| Metrics | Autonomous with minor fixes | Ledgers exist | Yes | Add events + daily report. |
| Refund triage | Autonomous with significant engineering | Needs bounded policy | Yes for simple cases | Auto-refund rules; edge cases incident ledger. |

Final autonomy recommendation: **Do not sell “automated implementation.” Sell an autonomous “implementation-ready conversion fix pack” with optional pre-authorized direct implementation.** This keeps zero-human operation while reducing refund and safety risk.

## 22. Scoring

| Dimension | Current | Revised target | Fix if below 4 |
|---|---:|---:|---|
| Clarity | 2 | 5 | Say exact output/timeline. |
| Trust | 1 | 4 | Add sample, privacy, policy. |
| Specificity | 2 | 5 | List checks/deliverables. |
| Buyer relevance | 2 | 5 | Target frustrated founders with traffic/no conversion. |
| Proof | 1 | 4 | Show sample audit and real examples. |
| Friction | 1 | 4 | Fix broken routes and fields. |
| Risk reversal | 1 | 4 | Refund/revision terms. |
| Offer strength | 2 | 4 | Reframe $7 and $97. |
| CTA strength | 2 | 5 | One primary CTA + working paid CTAs. |
| Fulfillment credibility | 1 | 4 | SOP, timeline, fallback, authorization. |

Bottom line: Current page is not just thin. It is conversion-blocked by broken routes and overclaiming. Fix route/payment first, then copy/trust.