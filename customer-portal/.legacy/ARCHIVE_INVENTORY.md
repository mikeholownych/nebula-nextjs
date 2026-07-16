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

## Stale public audit entry pages (archived 2026-07-16)

| Original route | Archived source | Active replacement |
|---|---|---|
| `/audit-lander` | `.legacy/app/audit-lander/page.tsx` | Redirect to transparent `/audit` maintenance page |
| `/index-old` | `.legacy/app/index-old/page.tsx` | Redirect to transparent `/audit` maintenance page |

The home and pricing pages were replaced in place with bounded maintenance messaging. Their prior versions remain recoverable from Git history at commit `60e77635`.
