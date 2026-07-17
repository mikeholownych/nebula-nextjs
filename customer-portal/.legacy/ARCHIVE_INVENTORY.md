# Archive Inventory

## CSS Files (moved 2026-07-16)
Files consolidated into `app/globals.css`. These page-specific CSS files are archived but can be referenced for style extraction.

| File | Original Location | Size |
|------|-------------------|------|
| ad-burn-leaderboard.css | app/ad-burn-leaderboard/ | 7.5KB |
| audit-lander.css | app/audit-lander/ | 7KB |
| component-showcase.css | app/component-showcase/ | 722B |
| learning-centre.css | app/learning-centre/ | 4.3KB |
| marketing-ops.css | app/marketing-ops/ | 6.4KB |
| pricing.css | app/pricing/ | 3.7KB |
| styles.css | app/accessible-nebula/ | 10KB |

**Action:** Pages now import `@/app/globals.css` directly.

## Components (archived 2026-07-16)
Duplicate implementations kept for reference:

| File | Status | Notes |
|------|--------|-------|
| BreadcrumbServer.tsx | Archived | Kept Breadcrumb.tsx as canonical |
| Breadcrumbs.tsx | Archived | Kept Breadcrumb.tsx as canonical |

**Canonical component:** `app/components/Breadcrumb.tsx`

## Scripts (archived 2026-07-16)
One-time migration scripts no longer needed:

- `add-breadcrumb-*.py` — Component migration scripts
- `bulk-add-breadcrumb-*.sh` — Bulk update scripts
- `bulk-seo-update.py` — SEO metadata migration

**Keep scripts in `/scripts/`:**
- `health-check.sh` — Production monitoring
- `lint.sh` — CI lint runner
- `typecheck.sh` — CI typecheck runner
- `process-emails.sh` — Email queue processor
- `seo-audit.sh` — SEO audit runner
- `update-articles.sh` — Article update utility
- `verify-deploy.sh` — Deployment verification

## Unsafe purchase prototypes (archived 2026-07-16)

The original source is retained under `.legacy/app/` for audit history. Public route stubs now return 404 and explicitly disallow indexing.

| Original route | Archived source | Classification | Safe replacement |
|---|---|---|---|
| `/checkout-impulse` | `.legacy/app/checkout-impulse/page.tsx` | Unsupported card-entry prototype; stored PAN, expiry, and CVC in React state | `/checkout` using Stripe-hosted checkout |
| `/checkout-v2` | `.legacy/app/checkout-v2/page.tsx` | Duplicate prototype checkout | `/checkout` using the canonical Fix Pack Payment Link |
| `/create-97-checkout` | `.legacy/app/create-97-checkout/page.tsx` | Stale, price-inconsistent checkout | `/checkout` |
| `/launch-page-97` | `.legacy/app/launch-page-97/page.tsx` | Unsupported launch offer after route-register classification | 404 pending product-owner review |
| `/checkout-impulse.html` | `.legacy/public/checkout-impulse.html` | Static duplicate of raw card-entry prototype | Removed from `public/`; `/checkout` is the only supported checkout |
| `/checkout_v2.html` | `.legacy/public/checkout_v2.html` | Static duplicate that persisted query-string PII in local storage | Removed from `public/` |
| `/create_97_checkout.html` | `.legacy/public/create_97_checkout.html` | Static price/product-mismatched checkout | Removed from `public/` |
| `/audit-lander.html` | `.legacy/public/audit-lander.html` | Public PII form, stale audit submission, and unsupported delivery claims | Removed from `public/` |
| `/index-old.html` | `.legacy/public/index-old.html` | Legacy audit/results/purchase flow with unsupported proof | Removed from `public/` |
| `/part_before.html` | `.legacy/public/part_before.html` | Orphaned legacy audit-page fragment with unsupported audit claims | Removed from `public/` |
| `/part_after.html` | `.legacy/public/part_after.html` | Orphaned live audit form/results fragment | Removed from `public/` |
| `/thank-you.html` | `.legacy/public/thank-you.html` | Direct-visit page falsely emitted audit completion and delivery messaging | Removed from `public/` |

All remaining legacy `public/**/*.html` files are quarantined at the HTTP boundary by root `proxy.ts`: requests return 404 with `X-Robots-Tag: noindex, nofollow`. This fail-closed control remains until Task 11 verifies claims and Task 14 completes the full App Router migration.

## Stale public audit entry pages (archived 2026-07-16)

| Original route | Archived source | Active replacement |
|---|---|---|
| `/audit-lander` | `.legacy/app/audit-lander/page.tsx` | Redirect to transparent `/audit` maintenance page |
| `/index-old` | `.legacy/app/index-old/page.tsx` | Redirect to transparent `/audit` maintenance page |
| `/part-before` | `.legacy/app/part-before/page.tsx` | 404; stale audit metadata/claims removed |
| `/part-after` | `.legacy/app/part-after/page.tsx` | 404; inert PII form and unsupported scoring/delivery flow removed |
| `/ad-burn-leaderboard` | `.legacy/app/ad-burn-leaderboard/page.tsx` | 404; absent submission endpoint and query-string email flow removed |
| `/audit/results` | `.legacy/app/audit/results/` | 404; stale score renderer and email gate removed |
| `/audit/sample` | `.legacy/app/audit/sample/page.tsx` | 404; unsupported sample scores and findings removed |
| Global 404 UI | `.legacy/app/not-found.tsx` | Safe not-found page with no PII collection or fabricated proof |
| Global error UI | `.legacy/app/error.tsx` | Safe retry page with no PII collection or audit promise |

The home and pricing pages were replaced in place with bounded maintenance messaging. Their prior versions remain recoverable from Git history at commit `60e77635`.

## Unsupported App Router prototypes and unverified product surfaces (archived 2026-07-16)

The original route implementations are retained under `.legacy/app/`. Every active route below now returns 404 with noindex metadata. They may only be restored after their authentication, API, fulfillment, pricing, evidence, and legal contracts are implemented and independently verified.

| Original route | Archived source | Containment reason |
|---|---|---|
| `/accessible-nebula` | `.legacy/app/accessible-nebula/page.tsx` | Expired $7 offer, artificial countdown, unsupported guarantee, and stale checkout links |
| `/agency-partner` | `.legacy/app/agency-partner/page.tsx` | Unverified white-label, compliance, trial, and fulfillment claims |
| `/ai-ops-retainer` | `.legacy/app/ai-ops-retainer/page.tsx` | Paused audit dependencies and unsupported monitoring, savings, response-time, and compliance claims |
| `/audit-dashboard` | `.legacy/app/audit-dashboard/page.tsx` | Hard-coded audit scores and automatic password bypass |
| `/audits` | `.legacy/app/audits/page.tsx` | Unauthenticated customer UI against an unverified platform API |
| `/beta-tester` | `.legacy/app/beta-tester/page.tsx` | PII collection against a missing API plus unsupported fulfillment promise |
| `/component-showcase` | `.legacy/app/component-showcase/page.tsx` | Public product prototype with misleading input controls |
| `/dashboard` | `.legacy/app/dashboard/page.tsx` | Unauthenticated mock account state and false active-subscription status |
| `/demo` | `.legacy/app/demo/page.tsx` | Fabricated customer logos, testimonials, product metrics, pricing, and SLA |
| `/generator` | `.legacy/app/generator/page.tsx` | Stale $7 product upsell and retired offer links |
| `/growth-launch` | `.legacy/app/growth-launch/page.tsx` | Unsupported $997 purchase, fulfillment, outreach, and guarantee claims |
| `/growth-launch-confirmation` | `.legacy/app/growth-launch-confirmation/page.tsx` | Direct-visit payment confirmation, stale PII intake, and false active guarantee |
| `/lead-dashboard` | `.legacy/app/lead-dashboard/page.tsx` | Public operational controls against missing lead APIs |
| `/marketing-ops` | `.legacy/app/marketing-ops/page.tsx` | Claims the paused audit and unverified autonomous fulfillment pipeline are operational |
| `/organization` | `.legacy/app/organization/page.tsx` | Unauthenticated mock member-management UI and stale PII form |
| `/subscription` | `.legacy/app/subscription/page.tsx` | Prototype checkout plans, incorrect Payment Link, and unsupported refund/subscription claims |
| `/case-studies/[slug]` | `.legacy/app/case-studies/[slug]/page.tsx` | Fabricated scored case study and unsupported `CaseStudy` structured data |
| `/about` | `.legacy/app/about/page-task1.tsx` | Unsupported spend, audit-count, and pattern-frequency proof claims removed from replacement |
| `/about/team` | `.legacy/app/about/team/page-task1.tsx` | Unsupported spend, audit-count, pattern-frequency, and social-profile claims removed from replacement |
| `/company/about` | `.legacy/app/company/about/page-task1.tsx` | Duplicate company page with unsupported fulfillment and paused-retainer claims; now redirects to `/about` |
|| `/company/team` | `.legacy/app/company/team/page-task1.tsx` | Duplicate team page with unsupported portfolio-count claim; now redirects to `/about/team` |

---

## Task 1 Completion Record (2026-07-17)

**Commit:** e5f3f7eec2a56e36f845611c342bc92ea0e681dd
**Date:** 2026-07-17T00:08:33Z
**Status:** PASS

**Static review:**
- 50+ files changed in quarantine commit
- 16 App Router routes quarantined with `notFound()` + `robots: { index: false, follow: false }`
- 9 additional routes quarantined (checkout variants, audit subpaths, HTML files)
- Rewritten `/about` and `/about/team`: no fabricated proof claims
- Canonical `/checkout`: verified Stripe Payment Link only
- API routes: audit/email return 503 `AUDIT_REBUILD_IN_PROGRESS`
- Global schema: Organization + WebSite only (no audit/review/price claims)
- Sitemap: excludes case-studies and blocked routes
- Jest: 48/48 PASS, TypeScript: PASS, Build: PASS
- No forms, email inputs, or links to quarantined routes in active pages

**Live review:**
- 25 quarantined routes: all return HTTP 404
- 404 pages: neutral UI, noindex/nofollow, no forms/checkout/fabricated content
- Root: maintenance notice rendered, no email capture
- Footer: no blocked links
- JSON-LD: clean Organization/WebSite (no 60-second/rating/review/$97)
- Sitemap: excludes case-studies and blocked routes
- `/about` and `/about/team`: no `$2.3M`/`200+ landing pages` metrics
- API: POST `/api/audit` → 503, POST `/api/audit/email` → 503
- HTML files: all 404

**Decision:** Task 1 complete. Production fails closed across all routes, APIs, schemas, sitemap, and rendered surfaces.
