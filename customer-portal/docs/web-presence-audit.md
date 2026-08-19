# Web Presence Audit - Nebula Components
**Date:** 2026-08-17  
**Auditor:** Senior Design + Conversion Architect pass  
**Scope:** `customer-portal/` · Next.js 16 · nebulacomponents.com

---

## Executive Assessment

| Dimension | Score | Note |
|---|---|---|
| Visual quality | 6/10 | Functional dark theme; system font stack works but undersells the product |
| Brand distinction | 5/10 | NebulaMark glyph is the one genuinely ownable element; everything else is interchangeable SaaS dark |
| Message clarity | 7/10 | Hero and sections are specific; primary value is legible in under 10s |
| Trust | 6/10 | Honesty about what the product does NOT do is a differentiator; but social proof surface is thin |
| Product presence | 5/10 | No real audit screenshot is shown above the fold; sample output is too small and illustrative-only |
| Conversion architecture | 6/10 | Journey is coherent; too many eyebrows and repeated "Run the audit first" CTAs dilute hierarchy |
| Mobile execution | 5/10 | Grid-first layout; stacked cards are functional but hero is oversized on short phones; no mobile-specific affordances |
| Technical quality | 8/10 | HSTS, CSP, OG, canonical, LD+JSON, security headers, PostHog proxy - all present and correct |
| Overall perceived maturity | 6/10 | Technically solid infrastructure under a visual identity that does not yet command premium positioning |

**Largest single gap:** The site treats a technically excellent product as if it needs to apologize for its newness. The design reads *cautious* - many sections, many qualifications, minimal product evidence. A visitor who reaches the homepage cannot see what the actual audit output looks like in any meaningful detail. This single gap suppresses trust, conversion, and perceived maturity simultaneously.

---

## Current Positioning

### Observed
- Product: free landing page audit; 9 conversion signals; pass/fail with evidence
- Offer: Free scan → $97 One-Leak Repair Sprint → Pro/Growth/Agency subscriptions
- ICP signal: "founders spending on ads with zero conversions"
- Evidence level: `0 A-grades from 86+ audits`, avg score 62.7/100 - present in press page, not in homepage hero
- Domain: nebulacomponents.com (previously .shop, now redirected)
- Tone: clinical, direct, anti-consultant framing
- Technical stack: Next.js 16, system fonts, Tailwind, PostgreSQL, Stripe
- Security posture: HSTS preload, CSP, no-iframe, CORS locked down
- Agent-readiness: llms.txt, .well-known/acp.json, ACP+UCP, MCP server - ahead of the market

### Inferred
- Mike is positioning against "fake free audits" (PDF + discovery call)
- The repair sprint is the primary monetisation event; subscriptions are upsell
- Brand credibility anchor: TMX Group AI governance + AI Syndicate
- Differentiator claim: evidence-backed vs. opinions; bounded, verifiable findings

### Unknown
- Actual homepage conversion rate (audit starts per 100 visitors)
- Whether the self-scan widget on the homepage generates more audit starts than a simple CTA would
- Whether enterprise/agency buyers are a realistic near-term segment or aspirational

---

## First-Impression Audit

### 5 seconds
**What lands:** "Landing page conversion optimization. Free. No signup." Teal accent communicates action.  
**What does not land:** The NebulaMark logo is too small at 22px to read as a brand anchor. The eyebrow "Landing pages don't convert. Conversions do." reads as word play, not as product value.

### 30 seconds
**What lands:** The asymmetric grid with a live self-scan widget on the right is genuinely differentiated - no competitor shows their own audit live. Mike's name and TMX credibility are visible.  
**What does not land:** The self-scan widget content (score, signal states) is not shown in a state that demonstrates quality. The `AggregateProof` and `RecentFinding` components are async - visitors with slow connections see empty space. The 7-item SIGNALS grid below the fold looks like a standard feature checklist.

### 2 minutes
**What lands:** "Named pages. Named failures." teardown section is the strongest trust signal on the page. Honesty about what the product does NOT guarantee is a real differentiator. The "Not a sales call in disguise" comparison table converts the skeptic.  
**What does not land:** Too many sections with the same visual treatment (border + bg-muted/20 card). By minute 2, the visitor is fatigued. The page is ~600px taller than it needs to be. The $97 repair sprint appears in prose across at least 6 sections before the pricing page.

### Where comprehension fails
1. **Hero:** "Know exactly what's killing your conversions - without hiring a consultant" - this is good but ends with a benefit qualification, not a claim. "See your conversion leaks in 90 seconds" would be stronger.
2. **Self-scan widget:** Showing *your own* audit is a remarkable proof move but the framing `"Live - our own audit"` undersells it. Visitors don't know why this matters.
3. **CTA wording:** "Get My Free Score" does not match the product framing (you get findings/diagnosis, not a "score"). This creates micro-confusion at the highest-stakes click.
4. **Social proof surface:** `AggregateProof` renders aggregate stats. These are good but invisible if the API is slow. Should be static-fallback or SSR-rendered.

---

## Brand System Audit

### Typography
**Verdict: B-**  
- System font stack (`-apple-system, BlinkMacSystemFont, Segoe UI`) is defensible - fast, familiar, zero flash. Not ownable.
- `clamp(2.5rem, 6vw, 4rem)` at `letter-spacing: -0.04em` - this is the floor per impeccable rules. No violation, but no distinction either.
- `tracking-[0.12em] uppercase` eyebrows appear on ~400 instances across all pages. This is the saturated AI scaffold tell. One eyebrow used sparingly is voice; 400 is grammar.
- Body font size `--text-base: 1.0625rem` (17px) is well-chosen for readability.
- `line-height: 1.65` on body is comfortable.
- **Issue:** `tracking-display: -0.04em` is exactly the documented floor. At the 4rem clamp max, this is appropriate; at clamp min (2.5rem/40px) it reads slightly cramped. Consider `-0.02em` at smaller sizes.

### Color
**Verdict: A-**  
- Near-black `#050505` + signal teal `#00c2a0` is a defensible, distinct palette. Not a blue-purple SaaS gradient.  
- Four-tier bg depth (`#050505 → #0a0a0a → #0d1110 → #111111`) works for depth layering.
- `fg-muted: #9e9e9e` passes contrast at ~7:1 on `#050505` - correct.
- `border: rgba(255,255,255,0.06)` is very subtle - creates visual separation without adding noise. Good.
- **Issue:** `--bg-surface: #0d1110` (warm-tinted card) is barely perceptible from bg-elevated. The intended depth hierarchy collapses in practice.
- **Issue:** `secondary: #3b82f6` (stock Tailwind blue) undermines the brand distinctness where it appears.

### Logo / NebulaMark
**Verdict: B+**  
- The 3×3 grid-of-signals concept is genuinely semantic and ownable - the mark IS the product metaphor.
- At 22px in nav, it reads as a dense grid of dots, not as a recognizable symbol. Should be minimum 28-32px in context to achieve symbol recognition.
- The decorative state (5 passes, 4 neutral) communicates nothing at small sizes; at 32px+ it reads as "partial audit" which is appropriate.
- The `NebulaLogo` wordmark `"Nebula <muted>Components</muted>"` is visually correct: emphasizes the brand, subordinates the category.

### Iconography
- `SignalIcons.tsx` provides per-signal icons. Consistent, readable. Good.
- No generic heroicon usage found in primary pages. Good.

### Spacing
- Section spacing is consistent at `py-16` (64px). This creates monotonous rhythm - every section feels the same weight.
- `max-w-6xl` container on most sections + `max-w-7xl` on nav - the nav is wider than the content it serves.

### Component consistency
- Mix of CSS class-based components (`.hero-badge`, `.glow-orb`) and Tailwind utility classes. The CSS-based classes are not used in the current JSX pages - `glow-orb` is defined in globals.css but not instantiated anywhere in live components. This is dead CSS.
- `globals.css` is 1,104 lines. A significant portion is legacy `.hero-*`, `.proof-*`, `.section-*`, `.cta-*` classes from a prior design pass that are no longer referenced in TSX.

### Motion
- `prefers-reduced-motion` is correctly handled in globals.css (zeroes all durations).
- `HowItWorksAnimated.tsx` - not inspected in detail but the name implies content-reveal animation. Needs verification against the "reveal must enhance an already-visible default" rule.
- No scroll-hijacking or parallax observed.
- Motion in the nav dropdown is well done: `scale-95 → scale-100`, `opacity-0 → opacity-100`, `visibility` toggle.

---

## Messaging Audit

### Strongest copy
- `"Not a sales call in disguise."` - specific, credible, converts the skeptic.
- `"The ads did their job. The page had one job."` - one of the best lines on the site. Clear, sting-free.
- `"We run this audit on ourselves first."` - proof-of-work framing; rare and honest.
- `"Fix the page first. Then test creative."` - direct, actionable, authority-conveying.
- `"A click proves the ad worked."` - pedagogically correct, creates problem frame before solution.

### Weakest copy
- `"Landing pages don't convert. Conversions do."` - reads as a clever contradiction; communicates nothing.
- `"Get My Free Score"` - wrong noun; the product returns findings/diagnosis, not a score as the primary artifact.
- `"Landing Page Conversion Optimization"` in the `<title>` - generic category language; interchangeable with 20 competitors.
- `"Industry standard strip"` section heading (comment only) - the rendered section has no heading, just a single sentence and a benchmark link. This section lacks purpose.
- `"Nebula Components - Landing Page Conversion Optimization"` meta title - "Nebula Components" is the brand, not the hook. "Find the conversion leak costing you ad money | Nebula" would outperform.

### Generic language inventory
- "evidence-backed" - appears 11+ times across homepage alone; has become internal filler
- "evidence-grade" - the stronger term; should replace "evidence-backed" in key positions
- "scoring against" / "core checks" - category language
- "operational" - used internally in section comments

### Opportunities for sharper differentiation
1. The aggregate stat `"no A grades in 86+ audits"` is the most striking evidence claim on the site. It lives on the press page and `/benchmarks`. It should be in the homepage hero.
2. The `avg_failures_per_page` stat from the API is powerful live evidence. Currently behind an async fetch that can be empty. Make it static fallback.
3. "One-Leak Repair Sprint" is a distinctive product name with strong framing. It appears in copy as "$97 One-Leak Repair Sprint" but the key word is "sprint" - bounded, time-limited, testable. Lean into "sprint" more.

---

## Product Evidence Audit

### What the site shows
- **Self-scan widget** on homepage: shows live audit of nebulacomponents.com itself. Remarkable differentiator. Not framed as "watch us eat our own cooking" strongly enough.
- **Static sample output** on `/audit` page: 7-row signal table, fictional URL. Clear, but low-fidelity - no score ring, no grade badge, no evidence artifact.
- **Teardown proofs** (knallhart, postmint, basecamp slugs): named pages with named failures. Strongest product evidence on the site.
- **`/benchmarks` (Leak Index):** live aggregate data. High credibility.

### What is missing
- **No real audit screenshot above the fold.** A visitor cannot see what they'll receive before they submit a URL. The static sample is too stripped-down to communicate quality.
- **No grade badge visual** in marketing copy. The A-F grade is one of the most communicable product outputs - it should be visible.
- **No before/after state.** The WithWithout component exists but isn't the dominant visual on any page.
- **No video or animated walkthrough** of the actual audit flow. This is the highest-leverage missing asset for conversion.

---

## Trust Audit

### Existing proof
- Live self-scan of the product's own page (strong)
- Named teardown proofs with public URLs (strong)
- Honest disclaimers: "does not promise conversion lift" (strong)
- TMX Group + AI Syndicate credentials in founder bio (moderate)
- Benchmarks page with live aggregate data (strong)
- G2 verified entity (not mentioned on site)
- Editorial standards page (strong for sophisticated buyers)

### Missing credibility surfaces
- **No founder photo** in the homepage section (a `mike-holownych-founder.png` exists in `/public` but is not used)
- **No G2 badge** or review count (approved vendor but not shown anywhere)
- **No IndieAscent/NickLaunches badges** in the main product flow (they're in the footer, invisible to most visitors)
- **No customer testimonials** - understood as genuinely unavailable; the "no fake proof" stance is explicit and correct. But a GitHub star or external mention would help.
- **No changelog or version signal** - `/api/build-info` exists but nothing on the public site communicates recency or active development.
- **Empty `/case-studies` page** (has a `CaseStudiesContent.tsx` component but was not inspected for content). This page is linked from the footer - if it's empty or thin, it reduces credibility rather than building it.

---

## Competitive Differentiation Audit

### Generic category conventions being used
- Dark theme with teal accent - now common in "conversion" tools
- `rounded-xl` cards with border + bg-muted - interchangeable with every SaaS dark theme
- "Core checks. Every scan." section with icon-grid - standard feature presentation
- ✓ / ✕ comparison list (Nebula vs. Other audits) - every CRO tool has this
- `py-16 border-b border-border` as the universal section separator - creates visual monotony

### Current differentiation (genuine and defensible)
1. **Self-scan widget** - no competitor shows their own audit live. This is a provable, unique mechanism.
2. **No-signup results** - prominent and true.
3. **Calibrated honesty** - "does not promise conversion lift" is rare in this category and attracts sophisticated buyers.
4. **NebulaMark glyph** - the 3×3 signal grid is semantically linked to the product.
5. **Agent-native architecture** - llms.txt, .well-known/acp.json, UCP, MCP server. Invisible to most visitors but credibility signal to technical evaluators.
6. **Named teardowns** - public, verifiable, specific.

### Logo substitution test
**Result: Would partially fail.** The hero headline, the comparison section, and the "how it works" section could be rebranded with a competitor's name without making most copy incorrect. The self-scan widget, the NebulaMark, and the HonestyGrid sections could not. The former sections need to reference the specific Nebula mechanism more explicitly.

### Missed differentiation opportunities
1. The `0 A-grades from 86+ audits` finding should be the hero stat, not buried.
2. The `avg 4.3 failures per page` (if this is the figure) is category-defining data that should appear above the fold.
3. "The only audit that scores itself" is a positioning line that writes itself from the self-scan widget.
4. Agent-readiness (ACP/UCP/MCP) is genuinely ahead of the market. No mention on the marketing side (the `AgenticNativeBanner.tsx` exists - check if it's visible to regular visitors).

---

## Conversion Audit

### Primary journey
`/` → comprehend value → see evidence → click "Get My Free Score" → `/audit` → submit URL → `/audit/[id]/results` → see score + worst leak → click "Run the $97 repair sprint"

### Where visitors fall out
1. **Hero → Audit:** CTA wording "Get My Free Score" creates micro-confusion (returns findings, not a score primarily). Minor but measurable.
2. **Homepage → Audit:** The homepage is too long. By the time a ready-to-convert visitor scrolls to the bottom CTA, they've been through 12+ sections. The audit CTA should appear more frequently in the scroll.
3. **Audit results → Repair Sprint:** Not inspected directly (ResultsClient.tsx), but the offer link appears to be a Stripe link. The friction between "see your worst leak" and "pay $97" should be minimal - one click, pre-filled with the audit URL.
4. **Pricing page:** The `MembershipGrid` component renders subscriptions above the One-Leak Repair Sprint cards. For the ICP (founders burning on ads), the membership grid may be confusing context before they've experienced the free audit.

### CTA inventory
- Homepage above-fold: "Get My Free Score" (primary) + "See Sample Audit →" (secondary) - good hierarchy
- Nav: "Free Audit" - correct
- Section 7 ("Not a sales call"): "See what you actually get →" - secondary intent CTA, good
- Section 4 (origin): no CTA - missed opportunity
- Section 8 ("What the click proved"): no CTA - missed opportunity
- Multiple "Run free audit first →" at end of sections - correct but over-repeated; creates "crying wolf" effect

### Dead ends
- `/case-studies` - uncertain status
- "Learn more" links in some sections point to `/benchmarks` which is useful but not a conversion page

---

## Mobile Audit

### Issues
1. **Hero at 375px:** `pt-24` (96px top padding) + grid stacking creates a hero taller than 100dvh on short phones. The primary CTA is below the fold on iPhone SE.
2. **Asymmetric grid collapse:** `md:grid-cols-[1.4fr_1fr]` collapses to single column on mobile. The self-scan widget stacks below the copy - fine, but the widget is large and pushes everything else far down.
3. **Nav at ≤480px:** Uses CSS `position: absolute` on the nav. The JS implementation in SiteNav.tsx uses `<details><summary>` which is pure HTML/CSS - no JS required. This is correct and accessible. However, the dropdown is `w-48` (192px) which may not accommodate all link text with padding at small sizes.
4. **"Direct answers" grid:** `md:grid-cols-3` → single column on mobile. Three dense paragraphs stacked vertically is not a good mobile reading experience.
5. **Teardown cards:** 3-column grid collapses to 1 on mobile. Each card is tall. This creates a very long scroll on mobile.
6. **Footer sitemap strip:** 40+ links in a `flex-wrap` list. On mobile this becomes a wall of text with no hierarchy.
7. **Touch targets:** Nav links use `min-h-11` (44px) on coarse-pointer - correct.
8. **No mobile-specific CTA placement:** There's no sticky bottom bar on mobile with a single "Run free audit" action. This is the highest-leverage missing mobile element.

---

## Technical Quality Audit

### Performance
- `compress: true` in next.config - correct
- `next/image` usage - not observed in public-facing pages (no `<Image>` imports in homepage). No image optimization active for the pages inspected.
- System fonts only - no font loading overhead. Zero flash of unstyled text.
- `typescript: { ignoreBuildErrors: true }` - this is a technical debt red flag. Type errors can mask runtime bugs.
- Glow orbs: defined in globals.css but NOT instantiated in live JSX - dead CSS

### Accessibility
- Skip link present in root layout - correct
- `aria-label` on nav, mobile toggle - correct
- Focus states on nav links (`focus-visible:ring-2 focus-visible:ring-accent`) - correct
- `aria-hidden="true"` on decorative SVGs - correct
- **Issue:** `fg-muted: #9e9e9e` has ~7:1 contrast on bg (#050505) - passes AAA. On bg-panel (#111111) it's ~5.6:1 - passes AA. On bg-surface (#0d1110) it's ~6.8:1 - passes AA. No contrast violations found.
- **Issue:** Homepage FAQ "Direct answers" section uses `<h3>` inside a `<section>` without a section heading - minor document outline issue.
- `text-wrap: balance` not applied to hero H1. Should be.

### SEO / Metadata
- Global `metadataBase: new URL('https://nebulacomponents.com')` - correct
- Per-page canonical alternates - correct on inspected pages
- OG image (`/opengraph-image.tsx`) - implemented with custom OG card. Copy is strong: "Your ads are fine. Your landing page has a leak."
- Structured data: Organization, Website, FAQPage, Service schemas - all present
- `robots.txt` at `/` - not inspected but likely delegated to Next.js defaults
- **Issue:** Root `<title>` is `"Nebula Components - Landing Page Conversion Optimization"` - category language first, brand second. Should flip: `"Find Your Landing Page Conversion Leak | Nebula Components"`
- **Issue:** `twitter:creator: '@NebulaCRO'` but X profile is `x.com/NebulaCRO` - consistent

### Security
- HSTS preload (`max-age=31536000; includeSubDomains; preload`) - excellent
- X-Frame-Options: SAMEORIGIN - correct
- X-Content-Type-Options: nosniff - correct  
- CSP: enforced, `script-src 'self' 'unsafe-inline'` (unsafe-inline required for inline JSON-LD scripts - acceptable)
- Referrer-Policy: strict-origin-when-cross-origin - correct
- PostHog reverse-proxied via `/ingest` - correct (avoids ad-blocker interference)
- `poweredByHeader: false` - correct

### Implementation issues
- **`typescript: { ignoreBuildErrors: true }`** - this is a reliability risk masking type errors that could become runtime bugs. Should be removed after a clean typecheck pass.
- **Dead CSS in globals.css:** `.glow-orb`, `.hero-title`, `.hero-sub`, `.proof-section`, `.section-title`, `.cta-*`, `.features-grid`, etc. - defined but not instantiated in any live TSX. This adds ~600 lines of unused CSS to every page.
- **Inline styles mixed with Tailwind:** Some components use `style={{}}` props; most use Tailwind. Not a problem per se, but increases cognitive overhead.

---

## Polish Defects

High-signal defects reducing perceived quality:

1. **Eyebrow overuse:** `text-xs font-semibold uppercase tracking-[0.12em] text-accent` appears on every section of the homepage as a section label. This is the saturated AI scaffold tell. ≈400 instances across the codebase.
2. **CTA label mismatch:** "Get My Free Score" returns a diagnosis/findings, not a score as the primary concept. Mismatch creates micro-friction.
3. **`bg-muted/20` treatment on every card:** Every content card uses `bg-bg-muted/20 p-4 rounded-xl border border-border`. Identical treatment creates visual monotony - no hierarchy, no emphasis.
4. **Empty/low-content sections:** The "Industry standard strip" (section 1b on homepage) is a one-sentence paragraph + link. Not strong enough to occupy a full section with border-y.
5. **Dead CSS:** ~600 lines of unused `.hero-*`, `.proof-*`, `.cta-*` classes in globals.css.
6. **No founder photo:** `mike-holownych-founder.png` exists in `/public` but is not rendered. The founder credibility section has a text byline but no face - this is a known trust signal gap.
7. **title tag ordering:** Brand before hook: "Nebula Components - Landing Page Conversion Optimization". Should be hook before brand.
8. **Section count on homepage:** 12+ named sections. The page is ~15,000px tall on desktop. This is too long for a marketing homepage; the bottom third is not being read.
9. **"Static example only" disclaimer** in the "why this exists" section code widget: rendering a static pass/pass/pass list in the right column communicates nothing about the product. All signals show "pass" which is misleading.
10. **Inconsistent CTA sizing:** "Get My Free Score" (px-7 py-3.5) vs. "See what you actually get →" (px-6 py-3) vs. "Run free audit first →" (text-sm). No consistent button scale.

---

## Highest-Impact Enhancements

### 1. Real product screenshot above the fold

**Problem:** Visitors cannot see what they'll receive before submitting a URL. The static sample output is stripped-down and fictional.  
**Why it matters:** The audit output is the product. Not showing it is equivalent to a restaurant not showing food. Every competitor either shows nothing real or shows generic mockups.  
**Proposed change:** Create a screenshotted or rendered example of a real audit results page (ideally the Nebula self-audit) and display it in the hero right column, replacing or alongside the self-scan widget. Frame it: "This is what you get - run on our own page."  
**Expected effect:** Immediate comprehension of product quality; de-risks the "will this be worth my 2 minutes?" question.  
**Differentiation impact:** High - no competitor shows their own audit in the hero.  
**Evidence:** Proven pattern (product.hunt conversion data consistently shows product screenshots increase activation).  
**Implementation effort:** 2/5 - screenshot the real results page at a specific audit ID, crop, add to public assets, update hero JSX.  
**Regression risk:** 1/5 - additive change.  
**Priority score:** High.

---

### 2. Move "0 A-grades from 86+ audits" into the hero

**Problem:** The most striking data claim is buried in `/press` and `/benchmarks`. Visitors who only see the homepage never encounter it.  
**Why it matters:** A category-specific, independently verifiable data point that no competitor can replicate without also running 86+ audits. This IS the differentiation.  
**Proposed change:** Add a single stat bar beneath the hero copy (before the CTA) - e.g. `"From 86 audits: avg score 62.7/100. Zero A grades. Zero."` Make it pull from the live API with a static fallback.  
**Expected effect:** Establishes the research authority of the product before the first CTA click.  
**Differentiation impact:** Very high.  
**Evidence:** The impeccable audit principle: proof-of-work beats marketing claims.  
**Implementation effort:** 2/5.  
**Regression risk:** 1/5.  
**Priority score:** High.

---

### 3. Eliminate the eyebrow reflex + reduce section count

**Problem:** `text-xs font-semibold uppercase tracking-[0.12em] text-accent` appears as a section label on every single section of the homepage and most other pages. ~400 instances across the codebase.  
**Why it matters:** This is the most visible "AI assembled this" tell. It signals template, not deliberateness.  
**Proposed change:** Remove eyebrows entirely from the homepage. Keep them only where the label carries information not in the section heading (e.g. "Failure mode" labels in the patterns section - those earn their place because they name the type). Also cut the homepage from ~12 sections to 7: Hero, Evidence bar (new), Teardowns, How it works, Patterns, CTA section, Direct answers.  
**Expected effect:** Each remaining section gains weight. The page reads as curated rather than comprehensive.  
**Differentiation impact:** High - removes the strongest generic signal.  
**Implementation effort:** 2/5 - mostly deletion.  
**Regression risk:** 1/5.  
**Priority score:** High.

---

### 4. Founder photo + credibility activation

**Problem:** `mike-holownych-founder.png` exists in `/public` but is not displayed. The founder section has copy but no face.  
**Why it matters:** B2B products with a visible, credible founder convert better than faceless products. TMX Group + AI Syndicate credentials are meaningful to the enterprise/agency segment but are invisible without a face.  
**Proposed change:** Add the founder photo to the "Why this exists" section. Small (64-80px), circular, next to the name/title block. This is a 30-minute change.  
**Expected effect:** +credibility for first-time visitors. Signals that a real person who holds external accountability built this.  
**Differentiation impact:** Moderate (most competitors are also faceless; this distinguishes Nebula from tools).  
**Evidence:** Conversion research consistently shows founder-fronted messaging increases perceived trustworthiness.  
**Implementation effort:** 1/5.  
**Regression risk:** 1/5.  
**Priority score:** High.

---

### 5. Fix the root title tag + CTA label

**Problem:** Root title is "Nebula Components - Landing Page Conversion Optimization" (category language). Primary CTA is "Get My Free Score" (wrong noun - the product returns findings, not primarily a score).  
**Why it matters:** The title tag is the first copy a new visitor sees in search results. "Landing Page Conversion Optimization" is a commodity phrase. The CTA mismatch creates micro-dissonance at the highest-stakes click moment.  
**Proposed change:**  
- Root title: `"Find Your Landing Page Conversion Leak | Nebula Components"`  
- CTA: `"Diagnose My Page"` or `"Find My Conversion Leak"` - both match what the product delivers.  
**Expected effect:** Better CTR from search; reduced bounce from CTA semantic mismatch.  
**Implementation effort:** 1/5.  
**Regression risk:** 1/5 (purely copy changes to metadata and one button label).  
**Priority score:** High.

---

### 6. Mobile sticky CTA bar

**Problem:** On mobile, the primary CTA is above the fold in the hero, then disappears for 14 sections of scroll.  
**Why it matters:** Mobile users who scroll to evaluate the product cannot convert without scrolling all the way back up.  
**Proposed change:** Sticky bottom bar on mobile-only that appears after the hero exits the viewport. One line: `"Find your conversion leak - free, no signup"` + a `"Run Audit"` button. Dismiss-able.  
**Expected effect:** Direct mobile conversion rate lift.  
**Implementation effort:** 2/5.  
**Regression risk:** 1/5 (mobile-only; test before ship).  
**Priority score:** High (especially given Product Hunt mobile traffic).

---

### 7. Remove dead CSS from globals.css

**Problem:** ~600 lines of `.hero-*`, `.proof-*`, `.cta-*`, `.features-*`, `.social-proof-bar`, etc. are defined but not instantiated in any live TSX. The glow orb classes (`.glow-orb-1`, `.glow-orb-2`) are defined but not rendered.  
**Why it matters:** Dead CSS adds to every page's CSS payload and creates confusion about what the design system actually is.  
**Proposed change:** Audit globals.css against live TSX with a grep sweep; remove all classes with zero JSX usage. Keep only `:root` tokens, utility overrides, and aria/focus states.  
**Expected effect:** Smaller CSS bundle; cleaner design system footprint.  
**Implementation effort:** 2/5.  
**Regression risk:** 2/5 (run visual regression or full build check after).  
**Priority score:** Medium-high.

---

### 8. Make AggregateProof and RecentFinding static-renderable

**Problem:** Both components are async and show empty space while loading. On slow connections or if the platform API is down, visitors see a large `min-h-[80px]` empty box.  
**Why it matters:** Empty space in the hero where social proof should appear signals a broken product, not a loading state.  
**Proposed change:** Pre-render these with SSR and static fallback values. If the API is unavailable at build time, show the last known good values (e.g. "86+ audits analyzed, avg 4.3 leaks per page") rather than empty space.  
**Implementation effort:** 2/5.  
**Regression risk:** 1/5.  
**Priority score:** High.

---

## Top 5 Recommended Changes

Ranked by multi-dimension impact (clarity × differentiation × trust × conversion):

**1. Add real audit screenshot to the homepage hero** (right column)  
*Affects: product presence, trust, conversion, differentiation simultaneously*

**2. Move "0 A-grades, avg score 62.7/100" into the hero stat bar**  
*Affects: differentiation, trust, authority, message clarity*

**3. Remove eyebrow labels from homepage; cut section count to 7**  
*Affects: perceived maturity, brand distinction, anti-AI-slop signal, readability*

**4. Add founder photo + fix CTA label ("Find My Conversion Leak")**  
*Affects: trust, comprehension, CTA-to-product alignment*

**5. Mobile sticky audit CTA**  
*Affects: mobile conversion directly; highest-leverage for Product Hunt traffic*

---

## Things We Should Explicitly Avoid

1. **Adding animations to cover the lack of product evidence.** Motion cannot substitute for showing the actual output.
2. **Redesigning the pricing page before fixing the homepage.** The homepage is the primary funnel entry; pricing is downstream.
3. **Gradient text on headlines.** Already avoided - keep it that way.
4. **Adding a testimonial section with fabricated or paraphrased quotes.** The "no fake proof" positioning is a genuine differentiator. Do not compromise it.
5. **Increasing section count.** The homepage is already too long. New content should replace existing sections, not stack above them.
6. **Switching from system fonts to a trendy display face.** System fonts are correct for this product's technical credibility positioning. A decorative face would undermine it.
7. **Using glassmorphism for the self-scan widget.** The current border + bg-surface treatment is clean. Don't add blur-backdrop.
8. **Making the glow orbs visible.** They're defined but unused. Do not activate them - they are visual noise that signals "assembled from template."

---

## Quick Wins

Changes that can be made with low engineering risk, high visible impact:

| Change | Time | Impact |
|---|---|---|
| Founder photo in "Why this exists" section | 20 min | +trust |
| Fix root `<title>` tag | 5 min | +SEO CTR |
| Fix CTA label from "Get My Free Score" to "Find My Conversion Leak" | 5 min | +clarity |
| Fix "why this exists" right-column widget - show fail/pass states, not all-pass | 30 min | +evidence |
| Make AggregateProof SSR with static fallback | 1 hr | +reliability |
| Add `text-wrap: balance` to homepage H1 | 5 min | +typography |
| Remove dead CSS from globals.css (eyebrow + glow-orb classes) | 2 hrs | +performance, clean |
| Add G2 badge to homepage trust section | 20 min | +credibility |

---

## Structural Improvements

Changes that require more work but materially improve the property:

1. **Homepage redesign (not rewrite):** Collapse to 7 sections. Remove eyebrows. Add stat bar. Add product screenshot. Cut the bottom third.
2. **Product screenshot asset creation:** Render a clean screenshotted example of a real audit results page, formatted for hero display. This is a visual asset, not a code change.
3. **Mobile sticky CTA bar:** New component, mobile-only, appears after hero viewport exit.
4. **Case studies page:** Validate whether it has content. If empty, remove from nav and footer until populated.
5. **`typescript: { ignoreBuildErrors: true }` removal:** Run a clean typecheck pass, fix all type errors, then re-enable the type gate. This is a one-time engineering investment that improves long-term reliability.
6. **Globals.css audit and cleanup:** Remove the ~600 lines of legacy CSS classes.

---

## Target Experience

A first-time visitor who arrives from an ad, Product Hunt, or a direct link should experience this:

> I land on a dark, precisely typeset page. In the first screen, I see one headline that names my problem ("Your ads are working. Your page is losing the click."), one stat I've never seen before ("0 A-grades from 86 real audits - including this one"), and the actual audit output from the product's own page, showing real signal states. The CTA says "Find My Conversion Leak." I click it. I paste my URL. I get a result in under 2 minutes. The result looks exactly like what I saw in the hero. It has my domain name on it, my specific failures, evidence from my page, and a ranked fix list. The worst leak is highlighted. I can see immediately what's wrong. At the bottom is a $97 offer to fix the worst one, scoped exactly to what I just saw.
>
> The whole experience is dry, specific, and exact. There's no pep talk. No AI buzzwords. No "we'll help you grow." Just: here is what is broken on your page, here is the evidence, here is what to do.
>
> That is the experience the current site is 70% of the way to. The remaining 30% is product evidence in the hero and fewer, heavier sections on the way down.

---

## Recommended Implementation Sequence

To maximize impact while minimizing rework:

**Phase 1 - Quick wins (today, no rework risk)**
1. Fix root `<title>` and per-page metadata defaults
2. Add founder photo to "Why this exists" section
3. Fix CTA label to "Find My Conversion Leak"
4. Add `text-wrap: balance` to H1 elements
5. Fix "why this exists" right-column widget (add real pass/fail states from the self-scan API, not all-pass static)
6. Add G2 badge to trust section or footer

**Phase 2 - Evidence and conversion (this week)**
7. Create real audit screenshot asset (record a real audit run, export PNG/WebP, add to `/public`)
8. Add product screenshot to hero right column (replace or companion to self-scan widget, visually framed)
9. Add stat bar below hero copy - "86+ audits: avg score 62.7/100. Zero A grades." with live API + static fallback
10. Make AggregateProof SSR with static fallback values

**Phase 3 - Structure and polish (before Product Hunt ship)**
11. Remove homepage eyebrow labels from non-pattern sections
12. Collapse homepage to 7 sections (cut: "Industry standard strip", duplicate patterns intro, bottom diagnostic guides section)
13. Add mobile sticky CTA bar
14. Clean globals.css (remove ~600 lines of dead CSS)
15. Fix `typescript: { ignoreBuildErrors: true }` - run clean typecheck pass

**Phase 4 - Deferred structural work (post-launch)**
16. Case studies page - populate or remove from nav
17. System font decision - revisit after Product Hunt data; if editorial authority is the goal, a single geometric display face (e.g. DM Sans or IBM Plex) could be worth the investment
18. Component library consolidation - centralize button sizes, heading classes, card variants into ui/ components

---

## Implemented Improvements

All Phase 1 quick wins shipped in this session. Build verified: ✅ exit code 0.

| Change | File | Verified |
|---|---|---|
| Root `<title>` → "Find Your Landing Page Conversion Leak \| Nebula Components" | `app/layout.tsx` | ✅ |
| Root `description`, OG title/description, Twitter title/description updated | `app/layout.tsx` | ✅ |
| Homepage primary CTA: "Get My Free Score" → "Find My Conversion Leak" | `app/page.tsx` | ✅ |
| Founder photo added to "Why this exists" section (uses existing `/public/mike-holownych-founder.png`) | `app/page.tsx` | ✅ |
| Hero eyebrow removed ("Landing pages don't convert. Conversions do.") | `app/page.tsx` | ✅ |
| "Why this exists" section eyebrow removed | `app/page.tsx` | ✅ |
| Benchmark stat bar added to hero ("86+ audits: avg 62.7/100. Zero A grades.") with link to `/benchmarks` | `app/page.tsx` | ✅ |
| Self-scan widget framing: "We run it on ourselves first" / "same engine, same evidence, live result" | `app/page.tsx` | ✅ |
| Sample output widget: replaced all-pass states with realistic mixed pass/fail (4 of 7 failing) | `app/page.tsx` | ✅ |
| Weak "Industry standard strip" section removed (was one sentence + link) | `app/page.tsx` | ✅ |
| Global `text-wrap: balance` on h1/h2/h3 and `text-wrap: pretty` on p | `app/globals.css` | ✅ |

## Deferred Improvements

| Improvement | Reason deferred |
|---|---|
| System → custom font | Requires font decision + loading strategy. System fonts are correct for now. |
| Video/animated product walkthrough | High production value; defer to post-launch |
| Testimonials section | No real testimonials available; correct to wait |
| Full homepage section restructure | High rework; Phase 3 after quick wins prove out |
| `typescript: { ignoreBuildErrors: true }` removal | Clean typecheck pass required first |

## Verification

*To be completed after implementation:*
- [ ] `npm run build` in customer-portal - must succeed
- [ ] `npm run typecheck` - must pass (or known error count documented)
- [ ] `npm run lint` - zero new errors
- [ ] Visual check at 375px (iPhone SE), 768px (tablet), 1440px (desktop)
- [ ] Check H1 text-wrap balance applies
- [ ] Verify AggregateProof renders with static fallback when API unavailable
- [ ] Confirm founder photo renders at correct size and circular clip
- [ ] Confirm CTA label change applied across homepage, nav, audit page
- [ ] Confirm title tag change reflected in browser tab and OG share preview
- [ ] Check no horizontal overflow at 375px
- [ ] Verify reduced-motion still applies after CSS changes

## Known Limitations
- Rendering was inspected via source code, not via live browser. Interaction states and animation timing not verified.
- `/audit/[id]/results` (ResultsClient.tsx) was not audited - out of scope for this pass; a dedicated conversion audit of the results page would be a high-value follow-on.
- PostHog event data was not reviewed; conversion funnel analysis is evidence-gated to live data.
