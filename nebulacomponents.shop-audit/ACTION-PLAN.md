# Action Plan — nebulacomponents.shop

Prioritized by severity and dependency. Complete Phase 1 before anything else — several later items (performance re-measurement, visual/AAA re-check) can't be validated until it's done.

## Phase 0: Production Incident — ✅ DONE

1. ✅ **Fixed site-wide CSS delivery failure.** Root cause turned out to be simpler than an ISR-cache issue: `nebula-nextjs.service` had been running since before the current build finished, serving a stale in-memory asset manifest. Fixed by restarting the service to pick up the build already on disk.
2. ✅ **Cache-header behavior fixed** — same restart resolved it; the `next.config.ts` rule ordering was never actually the bug, the running process just hadn't loaded the new config yet. Verified `cache-control: public, max-age=31536000, immutable` on both CSS and JS chunks, at the edge and the origin.
3. ✅ **Added `scripts/deploy_customer_portal.sh`** — atomic build → restart → verify, and extended `scripts/verify_production_services.sh` to check that a page's actual linked stylesheet resolves (not just the page's own status code), so this exact incident can't recur silently. Documented as the required deploy path in `deploy/systemd/README.md`.

## Phase 1: Critical Fixes — ✅ DONE (expanded scope)

4. ✅ **Server-rendered the full `/learning-centre` article list.** `CategoryAccordion.tsx` only mounted a category's `<Link>` elements into the DOM after a client-side click — collapsed categories had zero server-rendered links. Changed to always-render, CSS-collapsed (`hidden`) instead of conditional mounting. While verifying, found a second, more severe version of the same bug: articles whose category wasn't in the index page's hardcoded `categoryOrder` array were dropped entirely, in every state — this affected the 3 restored AI Ops Systems articles plus a 4th ("Conversion Systems") from concurrent work. Fixed both categories into `categoryOrder` and added a regression test (`learning-centre-category-coverage.test.ts`).
5. ✅ **Reconciled the pricing/deliverable contradiction — and it was much wider than one article.** Checked the actual purchase-adjacent pages: `/pricing` and `/checkout` both consistently and independently describe the $97 Fix Pack as an AI prompt pack the customer runs themselves, delivered within minutes. 13 learning-centre articles, `llms.txt`, `llms-full.txt`, and the (unused) `faq-schemas.ts` exports all said the opposite — that Nebula implements the fixes within 24-48 hours. Treated `/pricing`+`/checkout` as the source of truth (most commercially authoritative, internally consistent with each other) and corrected every other surface to match.
6. ✅ **Fixed the canonical bug — and it was much bigger than 2 pages.** A full sweep of all 48 live pages (done during the scope extension) found 9 real, indexable pages self-canonicalizing to the homepage instead of themselves, not just `/terms` and `/about/team`: also `/7-systems`, `/ai-sdr-vs-audit`, `/cta-optimization`, `/editorial-standards`, `/headline-optimization`, `/mobile-landing-page-optimization`, `/roas-cliff`. Root cause: `app/layout.tsx` sets a sitewide default canonical to the homepage, and pages that don't override `alternates.canonical` inherit it. Fixed on all 9.
7. ✅ **Sitemap gaps closed — original 8 plus 10 more found during the scope extension.** Added `meta.json` to `founder-second-brain`, `linkedin-skill-engine`, `specialist-ai-agent-library` (restores their sitemap presence; see the still-open relocate/prune decision below) and added a CI guard to `sitemap-inventory.test.ts` that now fails the build if any learning-centre article lacks `meta.json`. Also added 10 previously-never-added content pages (`/7-systems`, `/ai-sdr-vs-audit`, `/concepts`, `/cta-optimization`, `/editorial-standards`, `/headline-optimization`, `/mobile-landing-page-optimization`, `/page-speed-conversion`, `/roas-cliff`, `/social-proof-landing-page`, `/what-is-landing-page-audit`) plus `/terms`, `/about`, `/about/team` to `sitemap.ts`, and restructured priority into tiers (commercial 0.9 → hubs 0.8 → content 0.7 → about 0.5 → legal 0.2) instead of a flat 0.9 default.
8. ✅ **Added `WebApplication` schema to `/audit`** (completing the FAQ→WebApplication swap started by a concurrent session). The static example-output section is still open.

### New from the scope extension (fixed alongside the above)
- ✅ **Fixed corrupted content on `/roas-cliff`**, live since the page's original commit: every dollar figure in its "leak math" example was stripped (`"At ,000/month..."`, `"8 sales — 76 revenue — ,224 net loss"`), and its checkout CTA read `"Skip ahead — 47 Fix Pack"` instead of `$97`. Reconstructed with internally-consistent numbers; corrected the price; also fixed an unrelated overclaim on the same page ("5-dimension"/"same scoring system" when only 3 dimensions are implemented → "3-dimension"/"a preview of the scoring system").
- ✅ **Added `noindex` to `/checkout`** — a transactional page with a live Stripe link had no robots directive at all.
- **Still open, needs your decision, not a mechanical fix:** `founder-second-brain`, `linkedin-skill-engine`, `specialist-ai-agent-library` are back in the sitemap (status quo restored) but are still topically off-hub per the Cluster audit. Decide: relocate to a separate path, or prune.
- **New, not yet done:** ~25 page components are dead code behind a `notFound()` kill-switch (`/checkout-v2`, `/ad-burn-leaderboard`, `/growth-launch`, `/beta-tester`, `/dashboard`, ~20 more). Not an SEO issue (correctly non-indexable) — a code-hygiene item for whenever there's a lull: delete instead of permanently gating.

## Phase 2: High-Impact Improvements (weeks 2–3)

9. Fix HSTS: replace `max-age=0` with a real `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` (confirm intentional first if this was a deliberate rollback).
10. ✅ **Removed the deprecated `HowTo` JSON-LD block from the homepage.**
11. Fix Article schema entity fragmentation: reference the canonical `@id: #founder` node instead of re-declaring `"Mike H"` inline on every article; add the missing `image` property to the Article template.
12. Add `BreadcrumbList` to the learning-centre article template, `/resources/citable`, and `/about/team`.
13. Substantiate the "50+ landing pages" claim on `/about` and `/about/team` (human-visible, not just `llms.txt`); expand the founder bio past 45 words with real methodology/credentials; use "Mike Holownych" consistently instead of "Mike H".
14. Add pillar → cluster-lead links from `landing-page-not-converting` to at least one representative article per content cluster — it currently receives links from nearly every spoke but only links back to 5.
15. Expand the 9 sub-500-word learning-centre articles to genuine depth, or consolidate the thinnest/most overlapping ones (the `cta-not-working`/`proof-before-cta`/`message-match-checklist`/`no-testimonials-on-landing-page` cluster and the `landing-page-not-converting` vs. `ecommerce-landing-page-not-converting` cannibalization pair).
16. Add real content images (annotated before/after screenshots, `/audit` sample output) — currently zero across the entire site.
17. Fix the two zero-cost backlink issues: GitHub profile website field (`aisyndicate.io` → `nebulacomponents.shop`) and the 404ing LinkedIn company page.

## Phase 3: Content & Authority (month 2)

18. ✅ **Relocated the 3 topically off-hub articles** (`founder-second-brain`, `linkedin-skill-engine`, `specialist-ai-agent-library`) to a new `/playbooks` section, with 301 redirects, sitemap updates, and category cleanup.
19. ⚠️ **Partially done, rest intentionally skipped.** Added `Article` schema and real published/modified dates to `google-ads-quality-score-low` (matching its siblings). Did **not** add `FAQPage` schema — the SEO skill's current guidance is that Google retired FAQ rich results for all sites (May 2026) and explicitly advises against adding *new* FAQPage markup for SERP benefit. This is a deliberate deviation from the original recommendation, not an oversight.
20. ✅ **Removed the dead `/a2a` and `/mcp` endpoints** — deleted `agent.json`, `agent-card.json`, and `mcp/server-card.json` (all three advertised endpoints that live-404; confirmed no real A2A/MCP server exists). Cleaned up the matching Link headers and `agent-skills/index.json` entries.
21. ✅ **Added a CSP header in `Report-Only` mode**, scoped to GA4 (googletagmanager.com), PostHog (proxied same-origin via `/ingest`), and Stripe (plain-link checkout navigation, no script/iframe footprint needed).
22. ✅ **Added `poweredByHeader: false`** and a `/pricing/` → `/pricing` redirect.
23. ⛔ **Not done — needs the founder, not me.** Publishing a founder-narrated video requires real video production by a human; flagging rather than fabricating.
24. ✅ **Added `CollectionPage`/`ItemList` schema to `/learning-centre`.** `WebApplication` schema on `/audit` and enriched `Person` schema on `/about/team` were already completed in Phase 2.
25. ⛔ **Not done — needs your decision.** Moz and Bing Webmaster API signup requires account creation (and a card, for Moz) under your identity — not something to do unilaterally.

## Phase 4: Monitoring & Iteration (ongoing)

26. ✅ **Re-ran Performance and Visual passes.** Both initial re-runs reported false regressions caused by concurrent build/deploy activity during this same session, not real bugs — corrected in both findings files with an explicit note rather than silently overwritten. Genuine remaining findings: LCP fails "Good" on every page/device tested, mobile TBT (INP proxy) is Poor site-wide, homepage has real CLS (0.171 mobile/0.118 desktop) — see `findings/performance.md` for detail. These are real optimization backlog items, not incidents.
27. ✅ **Captured the first drift baseline** for https://nebulacomponents.shop (`baseline_id: 1`, 2026-07-27).
28. ⛔ **Not done — needs your Google account.** GSC + PageSpeed Insights API credentials require OAuth setup under your Google account.
29. ✅ **Added `Applebot-Extended`** to robots.txt's training-block list; **updated `llms.txt`** to point at canonical `/about`/`/about/team` instead of the redirecting `/company/*` aliases.
30. ⛔ **Not actionable yet.** No real client outcome exists yet to publish as a case study — this is correctly blocked on the business having one, not on any technical work.
