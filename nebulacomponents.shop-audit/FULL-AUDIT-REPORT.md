# Full SEO Audit — nebulacomponents.shop

**Date:** 2026-07-26
**Business type:** Hybrid productized-service + content publisher (one-time $97 landing-page conversion "Fix Pack," free automated `/audit` tool, $497 agency-partner and $1,497/mo retainer tiers; ~26-article `/learning-centre` content hub). Not e-commerce, not a local/brick-and-mortar business — the `.shop` TLD is not indicative of the actual business model.
**Method:** Direct verification (curl/render_page.py/Playwright) plus 10 specialist passes: Technical, Content, Schema, Sitemap, Performance, Visual, GEO, SXO, Backlinks, Cluster. Google Search Console/PageSpeed/GA4 field data unavailable (no API credentials configured); Moz/Bing backlink APIs unavailable (no keys configured) — Common Crawl domain-graph data used instead.

**Scope extension (2026-07-26, same day):** the original audit above was run against the ~35 pages known at the time. A subsequent production build revealed **123 total routes** — the site had grown substantially in parallel (a separate in-flight session was shipping a "landing page intelligence stack" and related pages on the same branch). See "Scope Extension Findings" below for the full delta: what's live, what's dead code, and what was fixed as part of continuing this audit's own action plan. The category scores and findings above reflect the original ~35-page scope; the scope extension section documents what changed the picture and what's now fixed.

---

## SEO Health Score: 55 / 100 (Needs Work)

| Category | Weight | Score | Weighted |
|---|---|---|---|
| Technical SEO | 22% | 58 | 12.8 |
| Content Quality | 23% | 52 | 12.0 |
| On-Page SEO | 20% | 50* | 10.0 |
| Schema / Structured Data | 10% | 76 | 7.6 |
| Performance (CWV) | 10% | 48 | 4.8 |
| AI Search Readiness (GEO) | 10% | 69 | 6.9 |
| Images | 5% | 15 | 0.75 |
| **Total** | | | **54.8 ≈ 55** |

\* On-Page SEO is a blended estimate (internal-linking health from the Cluster audit + heading/URL cleanliness from Technical/Content) — no dedicated title-tag/meta-description sweep was run across all 33+ pages this round. Recommend a follow-up `/seo page` pass per key template to firm this number up.

**This score is a snapshot of a site in an actively degraded state.** The technical (58) and performance (48) category scores both already reflect a live production incident (see below) — they are not "normal baseline minus points," they are "currently broken, here's the damage." Fixing the incident alone would likely move Technical and Performance up meaningfully without any further SEO work.

---

## Read This First: Live Production Incident (not a backlog item)

**Every page on nebulacomponents.shop is currently rendering with zero CSS applied.** Verified independently multiple times during this audit (curl + fresh Playwright screenshots):

- The stylesheet linked by `/`, `/audit`, `/pricing` (`/_next/static/chunks/1mmbcl4bayr4n.css`) returns **HTTP 500**, `content-type: text/plain`.
- The stylesheet linked by `/learning-centre/*` articles (`/_next/static/chunks/1x9hofplatikt.css`) returns **HTTP 404**.
- JS chunks load fine (200) — only CSS is affected.

**Root cause:** stale ISR-cached HTML referencing a build's asset-hash manifest that no longer matches what's actually deployed, most likely triggered by commit `8aa1434a` ("fix: add cache headers for static assets") landing ~2 hours before this audit and forcing a rebuild without fully revalidating already-cached page HTML.

**Compounding defect in the same commit:** the cache-header fix that commit intended to ship *also didn't take effect*. `customer-portal/next.config.ts` places the new `/_next/static/(.*)` immutable-cache rule *after* a pre-existing catch-all `/(.*)` rule that sets `max-age=0, must-revalidate` — the catch-all wins in production (confirmed by curling both the public URL and the Next.js origin directly, bypassing Cloudflare). Every hashed JS/CSS/font asset re-validates on every load instead of being cached for a year.

**Impact:** every visitor — including anyone arriving from paid ads, the free `/audit` tool, or mid-checkout — currently sees raw, unstyled HTML. The product being sold is landing-page conversion diagnosis; the seller's own landing pages are unstyled right now.

**Action:** Force a clean redeploy that regenerates and revalidates all ISR-cached HTML against the current `_next/static/` manifest, then fix the `next.config.ts` header rule ordering (move/scope the catch-all so it can't shadow the specific `_next/static` rule), and re-verify both with the exact `curl -sI` commands used in this audit before considering it closed. This is a P0 infra incident, not a queued SEO fix.

---

## Top 5 Critical / High-Impact Findings (beyond the incident above)

1. **The `/learning-centre` hub is only crawlable for 5 of 26 articles.** The other 21 exist solely inside a client-side JSON hydration payload behind an accordion `useState` toggle — no server-rendered `<a href>` anywhere. Googlebot doesn't simulate clicks, so these pages are reachable only via `sitemap.xml` (and several aren't even in there). *(Cluster audit, Critical)*

2. **`sitemap.xml` is stale and about to get worse.** 8 live, 200-status pages are missing from the sitemap (5 learning-centre articles, `/terms`, `/about`, `/about/team` — the latter two are fully orphaned with no internal link anywhere). An **uncommitted** rewrite of `sitemap.ts` already sitting in the working tree fixes the stale-array root cause but will silently drop 3 *other* live articles that lack a `meta.json` file (`founder-second-brain`, `linkedin-skill-engine`, `specialist-ai-agent-library`) unless that's fixed first. *(Sitemap audit, High)*

3. **Two pages carry a live, public, mutually contradictory claim about the core deliverable.** `/pricing`'s FAQ schema says Nebula delivers AI prompts for the customer to self-implement ("you keep control of implementation... not a multi-day process"); `/learning-centre/landing-page-not-converting`'s FAQ schema says "Nebula's $97 Fix Pack implements all identified fixes... within 48 hours." Both carry live `FAQPage` schema and are equally citable by AI answer engines. This is a live instance of a drift pattern already named in this repo's own CLAUDE.md ("Drift surfaces: $97, 48 hours... verify against canonical before commit"). *(SXO audit, High)*

4. **The site's strongest E-E-A-T claim exists only in AI-facing files, invisible to humans.** "Built 50+ landing pages, identified 7 recurring conversion killers" appears in `llms.txt`/`llms-full.txt` only — not on `/about`, `/about/team`, or anywhere a human visitor or Google quality rater would see it. The founder bio itself is 45 words with no methodology, no credentials, and uses "Mike H" instead of the canonical "Mike Holownych" used everywhere else. *(Content + GEO audits, High)*

5. **`/audit` — the highest-leverage page in the funnel — is invisible as a tool to search/AI systems.** Zero `WebApplication`/`SoftwareApplication` schema, zero example/sample output anywhere in crawlable content, while 5 of 7 organic results for "landing page audit tool free" are genuine Tool-type pages that demonstrate output. The tool itself works fine post-hydration for a human visitor — this is a discoverability/trust gap, not a product gap. *(SXO + Schema audits, High)*

---

## Category Findings

### 1. Technical SEO — 58/100
**What works:** robots.txt correctly segments AI-training vs. AI-retrieval crawlers; all 33 sitemap URLs self-canonicalize correctly; clean single-hop protocol/host redirects; no noindex leakage; correct mobile viewport tag; full SSR content (no CSR dependency); the entire `.well-known/` agent-discovery stack resolves validly; valid JSON-LD everywhere it appears.
**Findings:**
- **[Critical]** Site-wide CSS delivery broken (see above).
- **[High]** `/terms` and `/about/team` both emit `<link rel="canonical" href="https://nebulacomponents.shop"/>` — pointing at the homepage instead of themselves. Google will fold both into the homepage and drop them from independent indexing.
- **[High]** `strict-transport-security: max-age=0` on every response — actively tells browsers to drop any cached HSTS policy rather than just omitting one.
- **[Medium]** No Content-Security-Policy header anywhere, notable given Stripe + x402/USDC payment flows on the domain.
- **[Medium]** `/pricing` and `/pricing/` both return 200 with no redirect between them — relies solely on canonical to prevent duplication.
- **[Low]** `x-powered-by: Next.js` framework-fingerprint header exposed; no IndexNow integration; `/api/audit/run` is crawlable JSON with no `X-Robots-Tag`; sitemap `lastmod` is a single uniform build timestamp, not real per-page freshness.

### 2. Content Quality — 52/100
**What works:** Zero content-integrity corruption found across 33 sampled pages; honest "no case studies yet, on purpose" framing is a genuine trust asset; the 9-article well-developed batch (2026-07-21 dates, 1,100–2,300 words) has strong passage-level structure ideal for AI citation; correct technical vocabulary throughout.
**Findings:**
- **[High]** Weighted E-E-A-T ≈ 41/100 (Weak band) — driven by the unsubstantiated-on-page "50+ landing pages" claim and a 45-word founder bio with no credentials/methodology.
- **[High]** 9 of 25 live learning-centre articles are under 500 words (as low as 297) — thin by any informational-content standard.
- **[Medium]** Clear bifurcation between a strong batch (real 2026-07-21 dates) and a weak batch (fallback 2026-01-01 date) — the weak batch also has a live templating bug (`"Meta Ads Leaks · meta-ads-high-frequency-not-converting"` — raw slug leaking into visible UI).
- **[Medium]** Real but bounded cannibalization: 4 articles (`cta-not-working`, `proof-before-cta`, `message-match-checklist`, `no-testimonials-on-landing-page`) converge on the same trust/CTA-sequencing argument with thin differentiation.
- **[Medium]** 3 articles (`founder-second-brain`, `linkedin-skill-engine`, `specialist-ai-agent-library`) are topically off-hub; one explicitly discloses it was "extracted from NipPro AI," a different product.

### 3. On-Page SEO / Internal Linking — ~50/100 (blended estimate)
- **[Critical]** 21 of 26 learning-centre articles have no server-rendered internal links pointing to them from the hub page (see Top Findings #1).
- **[High]** The de facto pillar (`landing-page-not-converting`) receives links from nearly every spoke but links back to only 5 of ~25 — link equity flows up, not down.
- **[Medium]** Confirmed cannibalization: `landing-page-not-converting` vs. `ecommerce-landing-page-not-converting` share 4 of ~7 top SERP results. Other vertical variants (b2b-saas, pricing, coach-consultant) tested as genuinely distinct — this is isolated, not systemic.
- **[Medium]** Single-article "categories" (TikTok Ads Leaks, LinkedIn Ads Leaks) have zero inbound internal links despite being presented as peer categories.
- No dedicated title-tag/meta-description audit was run this round — flagged as a follow-up.

### 4. Schema / Structured Data — 76/100
**What works:** Well-built `@id`-linked Organization/founder/WebSite graph; genuinely complete `Service`+`Offer`+`OfferCatalog` on `/pricing`; working `Article` schema across the learning-centre template; the most sophisticated block on the site (`/resources/citable`'s `@graph` TechArticle+SoftwareApplication); correctly *no* fake Review/AggregateRating on `/case-studies`.
**Findings:**
- **[High]** Deprecated `HowTo` schema still live on the homepage (retired by Google Sept 2023) — remove outright.
- **[Info]** `FAQPage` on `/pricing` — Google retired FAQ rich results for all sites May 7, 2026. Valid and harmless; do not remove, do not add elsewhere for SERP benefit.
- **[Medium]** Article schema missing `image` (blocks Top Stories eligibility) on every article checked.
- **[Medium]** Article `author` re-declares the founder inline as `"Mike H"` instead of referencing the canonical `@id: #founder` node — entity fragmentation that dilutes E-E-A-T signal.
- **[Medium]** No `BreadcrumbList` anywhere on the site — an active, non-deprecated rich result left entirely on the table.
- **[Low-Medium]** `/learning-centre` index has no `CollectionPage`/`ItemList` manifest of its articles.
- **[Medium]** `/about/team` has no enriched Person schema for the founder (image, description, sameAs).
- **[Low]** `/audit` has no `WebApplication` schema (see Top Finding #5).

### 5. Performance / Core Web Vitals — 48/100
Lab data only (Unlighthouse/local Lighthouse; PSI/CrUX unavailable — no Google API key configured). Tested `/`, `/audit`, `/pricing`, one learning-centre article × mobile/desktop (8 runs).
- **[Critical]** The `8aa1434a` cache-headers fix didn't take effect — an older catch-all rule in `next.config.ts` still wins, so every hashed static asset re-validates on every load instead of caching for a year (confirmed at both the Cloudflare edge and the Next.js origin directly).
- **[High]** LCP fails "Good" (≤2.5s) on all 8 page/device combinations tested — mobile ranges 3.56s–4.28s (3 of 4 in the outright *Poor* >4.0s band), desktop 3.5–3.8s everywhere.
- **[High]** Mobile interactivity risk is poor — Total Blocking Time (INP proxy) 538–894ms across all 4 pages on mobile, with a consistent 490–503 KB of unused JS on every page regardless of route (shared-bundle bloat).
- **[Medium]** Homepage-only CLS problem (0.171 mobile / 0.118 desktop); other 3 pages measured near-zero.
- TTFB, DOM size, third-party script loading, and font-preload strategy are all already solid.

### 6. AI Search Readiness (GEO) — 69/100
**What works:** robots.txt correctly separates AI-training crawlers (disallowed) from AI-answer-engine crawlers (allowed) — most sites get this wrong in one direction; spec-compliant, well-organized `llms.txt`/`llms-full.txt`; a mostly-functional `.well-known/` agent-discovery stack with genuinely working x402 payments; consistent brand-entity naming; strong direct-answer/question-heading citability patterns in the well-developed articles.
**Findings:**
- **[High]** The `/a2a` and `/mcp` service endpoints advertised by `agent.json`/`mcp/server-card.json` both 404 on every method — a real discovery-to-execution failure (unlike the working x402 endpoints).
- **[Medium]** The "50+ landing pages" claim exists only in AI-facing files (see Top Finding #4).
- **[Medium]** `/about` and `/about/team` — the pages carrying the strongest entity signals — are absent from `sitemap.xml`.
- **[Medium]** Multi-modal content is effectively zero (no images, no video/YouTube) — YouTube mentions are the single strongest brand-mention correlate with AI citation per available research, and this site has none.
- **[Low]** robots.txt AI-crawler list is well-designed but missing `Applebot-Extended` and Anthropic's newer `Claude-User`/`Claude-SearchBot` retrieval tokens for full mid-2026 currency; no RSL 1.0 file backing the informal `ai-train=no` signal.

### 7. Images — 15/100
- **[High]** Zero `<img>` tags found across every sampled page (homepage, `/audit`, `/pricing`, all learning-centre articles) — only small inline UI-icon SVGs. For a product whose entire premise is visual landing-page diagnosis, this is a significant gap in both user engagement and AI Overview/Google Images visual-citation eligibility.

### 8. Backlinks — Insufficient data (not scored numerically)
Domain not yet present in Common Crawl's web graph and no Moz/Bing API credentials configured — this is expected for a young domain, not a defect. Two concrete zero-cost fixes identified: the founder's GitHub profile website field points to `aisyndicate.io` instead of `nebulacomponents.shop`, and `linkedin.com/company/nebula-components` 404s. Realistic near-term link-building angles (submitting the open-source `citable` CLI to dev-tool directories, Show HN, guest posts on PPC/CRO publications) are detailed in `findings/backlinks.md`.

### 9. Search Experience (SXO) — 47/100
SERP-backwards analysis of `/audit`, `/pricing`, and 3 learning-centre articles. `landing-page-not-converting` is the best-aligned page in the sample (matches the ~83%-dominant numbered-listicle format for its query). `/audit` is the clearest mismatch (Top Finding #5). `google-ads-quality-score-low` is missing the `Article`/`FAQPage` schema and real dates its sibling articles already have, despite competing in a Q&A-dominated SERP. Full persona scoring and user stories in `findings/sxo.md`.

### 10. Content Cluster Architecture — 48/100
Detailed in `findings/cluster.md` — includes a proposed 6-cluster hub-and-spoke restructuring (consolidating the current fragmented 13-category taxonomy) and a minimum-viable internal-link fix sequence.

---

## Synthesis (PERCEIVE → ANALYZE → VALIDATE → ACT)

**PERCEIVE:** The site presents two faces — a genuinely well-engineered technical/schema/AI-discovery foundation (correct crawler segmentation, real Service/Offer schema, working x402 payments, strong article citability patterns) and a set of live, user-facing failures (broken CSS, a factual self-contradiction, an invisible content hub) that undercut all of it in practice right now.

**ANALYZE:** Nearly every High/Critical finding traces to one of three root causes, not twenty-seven unrelated bugs: (1) a deploy/cache-invalidation gap (the CSS outage + the ineffective cache-header fix, both from the same commit), (2) a single hand-maintained sitemap slug list that's fallen out of sync with reality twice over (missing pages, and an in-flight fix that will regress three others), and (3) a content-authoring process that lets the same fact (deliverable mechanics, "50+ landing pages") diverge between an AI-facing file and human-facing pages. Fixing the root cause in each case (deploy verification, a generated-not-hand-maintained sitemap with a CI guard, and a single source of truth for offer mechanics) closes multiple findings at once.

**VALIDATE:** Each fix below has a concrete "how would we know this failed" check baked into the action plan (a `curl -sI` header check, a sitemap-coverage test already scaffolded in the repo at `customer-portal/__tests__/metadata/sitemap-inventory.test.ts`, a grep for "48 hours"/"implements" across all pages). None of the recommendations require new tooling to verify — the repo already has the test infrastructure to prevent these classes of regression from recurring.

**ACT / leading indicators to monitor without re-running the full audit:** (1) `curl -sI https://nebulacomponents.shop/` → confirm the linked CSS chunk 200s; (2) `curl -sI .../_next/static/chunks/<any>.js` → confirm `max-age=31536000, immutable`; (3) page count in Google Search Console's indexed-pages report should rise toward 26+ learning-centre articles once the hub is server-rendered and the sitemap gaps close; (4) grep the two contradictory FAQ answers monthly until a CI guard exists.

---

## Scope Extension Findings (2026-07-26)

A production build run later the same day listed **123 total routes** — the site grew from ~35 pages to well past 100 while a separate in-flight session shipped a "landing page intelligence stack" and related pages on this same branch. Every route was checked live (`curl`) and classified:

| Category | Count |
|---|---|
| Live, indexable HTML pages (200, no noindex) | 48 |
| Live but intentionally non-indexed (200 + `noindex`, e.g. `/checkout`, `/thank-you`, `/unsubscribe`) | 3 |
| Redirects (307/308) | 4 — `/audit-lander`→`/audit`, `/index-old`→`/audit`, `/company/about`→`/about`, `/company/team`→`/about/team`. No action needed. |
| Dead code — route exists, returns 404 via an explicit `notFound()` kill-switch | ~25 |
| Utility/image-generation routes (`/og-card-source`, `/opengraph-image`), API routes, dynamic segments | remainder |

### What was already known and is now confirmed fixed
- **[Fixed]** The sitemap regression predicted in the original Sitemap audit (Finding #2) — `founder-second-brain`, `linkedin-skill-engine`, `specialist-ai-agent-library` dropping out once `sitemap.ts` switched to a filesystem scan — **actually happened**. Added `meta.json` to all three (restoring prior sitemap coverage) and added a CI guard (`__tests__/metadata/sitemap-inventory.test.ts`) that now fails the build if any learning-centre article directory lacks `meta.json`, so this exact class of regression can't recur silently again.
- **[Decision needed, not auto-fixed]** These same three articles are still topically off-hub per the Cluster audit's Finding #2 (founder-productivity/AI-tooling content mixed into a landing-page-conversion hub). Restoring `meta.json` keeps them indexed at their pre-existing status quo; it does **not** resolve whether they belong on `/learning-centre` at all. Recommend you decide: relocate to a separate path (e.g. `/playbooks/`) or prune. Left as-is pending that call.

### New Critical/High findings from the expanded inventory (fixed)
1. **[Critical→Fixed] The homepage-canonical bug was systemic, not isolated to 2 pages.** The original audit found `/terms` and `/about/team` self-canonicalizing to the homepage (Technical Finding #2). A full sweep of all 48 live pages found **9 real, indexable pages** with the same bug (root cause: `app/layout.tsx` sets a sitewide default `alternates.canonical` to the homepage, and any page that doesn't override it inherits that default instead of self-canonicalizing): `/7-systems`, `/about/team`, `/ai-sdr-vs-audit`, `/cta-optimization`, `/editorial-standards`, `/headline-optimization`, `/mobile-landing-page-optimization`, `/roas-cliff`, `/terms`. All would have been folded into the homepage by Google despite being real, substantial content (260–1,166 words each). **Fixed** — added explicit `alternates.canonical` to each page's metadata.
2. **[Critical→Fixed] Corrupted live content on `/roas-cliff`, present since the page's original commit.** Its "leak math" worked example had every dollar figure stripped (`"At ,000/month in ad spend and a 7 average order value"`, `"8 sales — 76 revenue — ,224 net loss"`), and its checkout CTA read `"Skip ahead — 47 Fix Pack"` next to the real $97 Stripe link. Root cause traced via `git log`/`git show` to the file's very first commit — not a later regression, so there was no intact version to restore from history. **Fixed**: reconstructed the worked example with internally-consistent illustrative numbers ($5,000 spend / $150 AOV / 2,000 clicks — preserves the two figures that survived corruption, 8 and 30 sales, and the stated 0.4%/1.5% conversion rates), corrected the CTA to "$97 Fix Pack", and corrected an unrelated overclaim on the same page ("The 5-dimension self-audit... the same scoring system used on every audit" when only 3 dimensions are actually implemented) to "The 3-dimension self-audit... a preview of the scoring system."
3. **[High→Fixed] 10 legitimate new content pages were never added to `sitemap.ts`.** `/7-systems`, `/ai-sdr-vs-audit`, `/concepts`, `/cta-optimization`, `/editorial-standards`, `/headline-optimization`, `/mobile-landing-page-optimization`, `/page-speed-conversion`, `/roas-cliff`, `/social-proof-landing-page`, `/what-is-landing-page-audit` — all live, indexable, reasonably substantial (260–1,166 words) — plus `/terms`, `/about`, `/about/team` (already known). **Fixed**: added all to `sitemap.ts`, and restructured the priority scheme from a flat 0.9-for-everything default (the original Sitemap Finding #4) into tiers that reflect actual importance (commercial 0.9 → hub pages 0.8 → content pages 0.7 → about 0.5 → legal 0.2).
4. **[Medium→Fixed] `/checkout` had no `noindex` directive.** A transactional page with a real Stripe link and no robots meta — added `robots: { index: false, follow: false }`.
5. **[Info, not fixed]** ~25 page components in the codebase are dead code — built, then gated behind an explicit `notFound()` call (`/checkout-v2`, `/ad-burn-leaderboard`, `/growth-launch`, `/beta-tester`, `/dashboard`, and ~20 more), with a containment test (`__tests__/containment/production-safety.test.ts`) explicitly asserting 9 of them stay disabled. Correctly non-indexable, so not an SEO defect — but worth a code-hygiene pass to delete rather than permanently kill-switch, since the current pattern means every future contributor has to know not to accidentally re-enable them.

### Good news the expanded scope surfaced
- **18 new learning-centre articles** exist beyond the original ~25 audited. They're a materially stronger batch than the original weak half: 682–1,885 words each (only `landing-page-intelligence-stack` is thin at ~440), all with correct self-referencing canonicals and `Article` schema out of the box. No action needed here.

### Updated SEO Health Score context
The original 55/100 score is not being recomputed against the full 123-route inventory (that would require re-running the full 10-specialist pipeline at the new scale, which wasn't requested). Directionally: the canonical-bug fix and sitemap expansion should move Technical SEO and On-Page SEO up from their original 58/50; the roas-cliff content-integrity fix removes a genuine E-E-A-T liability that would have dragged Content Quality down further had it been in the original sample. Recommend a full re-audit once the site's page count stabilizes.

---

## Files in this audit
- `findings/technical.md`, `content.md`, `schema.md`, `sitemap.md`, `performance.md`, `visual.md`, `geo.md`, `sxo.md`, `backlinks.md`, `cluster.md`
- `screenshots/` — desktop + mobile captures of `/`, `/audit`, `/pricing`, one learning-centre article (all currently show the CSS-outage state; re-capture after the fix)
- `ACTION-PLAN.md` — prioritized, phased fix list
- `audit-data.json` — structured data envelope for PDF report generation
