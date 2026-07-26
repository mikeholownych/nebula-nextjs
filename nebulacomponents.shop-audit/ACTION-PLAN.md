# Action Plan — nebulacomponents.shop

Prioritized by severity and dependency. Complete Phase 1 before anything else — several later items (performance re-measurement, visual/AAA re-check) can't be validated until it's done.

## Phase 0: Production Incident — ✅ DONE

1. ✅ **Fixed site-wide CSS delivery failure.** Root cause turned out to be simpler than an ISR-cache issue: `nebula-nextjs.service` had been running since before the current build finished, serving a stale in-memory asset manifest. Fixed by restarting the service to pick up the build already on disk.
2. ✅ **Cache-header behavior fixed** — same restart resolved it; the `next.config.ts` rule ordering was never actually the bug, the running process just hadn't loaded the new config yet. Verified `cache-control: public, max-age=31536000, immutable` on both CSS and JS chunks, at the edge and the origin.
3. ✅ **Added `scripts/deploy_customer_portal.sh`** — atomic build → restart → verify, and extended `scripts/verify_production_services.sh` to check that a page's actual linked stylesheet resolves (not just the page's own status code), so this exact incident can't recur silently. Documented as the required deploy path in `deploy/systemd/README.md`.

## Phase 1: Critical Fixes — ✅ DONE (expanded scope)

4. **Server-render the full `/learning-centre` article list.** Still open — the accordion pattern gating articles behind a client-side `useState` toggle has not been touched. Now applies to more articles than originally counted (44 total learning-centre articles as of the scope extension).
5. **Reconcile the pricing/deliverable contradiction.** Still open — grep `/learning-centre` articles and `/pricing` for "implements," "48 hours," "we fix," "prompts" and pick one canonical description.
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

18. Relocate or prune the 3 topically off-hub articles (`founder-second-brain`, `linkedin-skill-engine`, `specialist-ai-agent-library`) — one explicitly discloses it was sourced from a different product.
19. Add `Article`+`FAQPage` schema and real dates to `google-ads-quality-score-low` to match its siblings.
20. Fix or remove the dead `/a2a` and `/mcp` endpoints (agent.json/mcp/server-card.json advertise them; both 404).
21. Add a CSP header (start `Report-Only`, tune around Stripe/GA4/Consent Mode, then enforce).
22. Add `poweredByHeader: false`; add a normalizing redirect for the `/pricing`/`/pricing/` trailing-slash variant.
23. Publish one founder-narrated video (audit walkthrough) — YouTube is the strongest available brand-mention correlate with AI citation and this site currently has zero.
24. Add `CollectionPage`/`ItemList` schema to `/learning-centre`; add `WebApplication` schema to `/audit`; add enriched `Person` schema to `/about/team`.
25. Set up Moz + Bing Webmaster free-tier API keys for real backlink/DA-PA data on the next audit.

## Phase 4: Monitoring & Iteration (ongoing)

26. Re-run this audit's Performance and Visual passes once Phase 0 ships — current numbers reflect the outage state.
27. Capture a drift baseline (`/seo drift baseline https://nebulacomponents.shop`) now that a full audit exists, so future changes can be diffed against this state.
28. Set up Google Search Console + PageSpeed Insights API credentials to replace lab-only estimates with real field data.
29. Add `Applebot-Extended` to the robots.txt training-block list; update `llms.txt` to reference canonical `/about`/`/about/team` URLs instead of the redirecting `/company/*` aliases.
30. Once a real client outcome exists, publish it as the first case study — the site's own "no fake case studies" stance makes this a genuinely linkable, citable asset when it lands.
