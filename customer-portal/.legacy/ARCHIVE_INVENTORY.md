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
