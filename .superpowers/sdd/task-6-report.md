# Task 6 report

## Status

Local blog migration committed. No production deploy or restart performed.

## Commit

Code and release document commit:

```text
606c49f9e4bf0c9213baa409e73f67c95ee39059
chore(blog): remove temporary Opinly blog dependency
```

The report is intentionally committed separately because its exact final commit SHA cannot be known until the report exists.

## Commands and outputs

Baseline focused tests before the change:

```text
npx jest __tests__/blog-routes.test.tsx __tests__/blog-loader.test.ts __tests__/metadata/sitemap-inventory.test.ts --runInBand --no-cache
Test Suites: 3 passed, 3 total
Tests: 39 passed, 39 total
```

Failing tests added before implementation:

```text
npx jest __tests__/blog-routes.test.tsx --runInBand --no-cache
Test Suites: 1 failed, 16 passed, 2 failed
Failures: local source still contained Opinly sitemap delivery; webhook route still existed
```

Focused green tests:

```text
npx jest __tests__/blog-routes.test.tsx __tests__/blog-loader.test.ts __tests__/metadata/sitemap-inventory.test.ts --runInBand --no-cache
Test Suites: 3 passed, 3 total
Tests: 41 passed, 41 total
```

Typecheck and lint:

```text
rm -rf .next && npm run typecheck
EXIT 0

npm run lint
EXIT 0
```

The initial typecheck against stale generated `.next/types` failed with missing deleted route modules. Removing stale `.next` and rerunning produced exit 0.

Production build:

```text
npm run build
prebuild: 1 suite passed, 38 tests passed
Compiled successfully
Finished TypeScript
Generating static pages: 358/358
EXIT 0
```

Full Jest:

```text
npm test -- --runInBand
Test Suites: 102 passed, 102 total
Tests: 8 skipped, 842 passed, 850 total
EXIT 0
```

Full Playwright:

```text
npm run test:e2e
54 passed (27.1s)
EXIT 0
```

Diff hygiene:

```text
git diff --check
clean after removing one trailing blank line from app/lib/opinly.ts
git diff --cached --check
clean
```

## Route probes

Command: `npx next start --port 3101`, local built artifact only.

```text
/blog: status=200; h1=1; canonical=https://nebulacomponents.com/blog; jsonld=true; cta=false; local_opinly_delivery=true
/blog/paid-traffic-not-converting: status=200; h1=1; canonical=https://nebulacomponents.com/blog/paid-traffic-not-converting; jsonld=true; cta=true; local_opinly_delivery=true
/blog/what-we-got-wrong-about-filter-based-targeting: status=200; h1=1; canonical=https://nebulacomponents.com/blog/what-we-got-wrong-about-filter-based-targeting; jsonld=true; cta=false; local_opinly_delivery=true
/blog/not-a-local-article: status=404
/sitemap.xml: status=200; local_sitemap_urls=2; local_opinly_delivery=true
```

The acquisition article probe also confirmed the rendered CTA `Run the free audit`. Both article probes confirmed one rendered H1, canonical metadata, JSON-LD, and no Opinly delivery marker. The sitemap contains two local blog URLs.

## Opinly inventory

- Blog/runtime before: catch-all route imported `@opinly/react`, `@opinly/next`, `@opinly/backend`, called Opinly posts, categories, authors, and tags, and emitted Opinly JSON-LD.
- Sitemap before: imported `@opinly/shared`, called Opinly routes, and appended remote entries.
- Config before: `withOpinlyConfig` in `next.config.ts` configured blog and image paths.
- Webhook before: `app/api/opinly/route.ts` was the only source reference to the webhook endpoint. Repository source search found no caller or registration dependency outside the route. It was removed.
- Unrelated analytics preserved: `app/layout.tsx` pixel, browser `window.opinly` tracking, checkout `opinly_anon_id`, and Stripe purchase tracking through `@opinly/backend`.
- Packages removed after source proof: `@opinly/next`, `@opinly/react`, `@opinly/shared`.
- Package retained after source proof: `@opinly/backend`, required by Stripe purchase analytics.

Post-change source scan:

```text
git grep -n -i -E '@opinly|OPINLY_|opinly|withOpinlyConfig|buildSitemapEntries' -- customer-portal ':!customer-portal/.next*'
```

Remaining matches are limited to the preserved analytics pixel, browser analytics, checkout metadata, Stripe purchase tracking, and `@opinly/backend` support. No local blog route, loader, or sitemap source matches. Legacy blog route and webhook route are absent.

## Changed files

- `customer-portal/__tests__/blog-routes.test.tsx`
- `customer-portal/app/[blogPath]/[[...slug]]/page.tsx` (deleted)
- `customer-portal/app/api/opinly/route.ts` (deleted)
- `customer-portal/app/lib/opinly.ts`
- `customer-portal/app/sitemap.ts`
- `customer-portal/next.config.ts`
- `customer-portal/package.json`
- `customer-portal/package-lock.json`
- `docs/releases/2026-09-05-local-blog-migration.md`
- this report

Pre-existing unrelated dirty paths were not staged or modified.

## Release and rollback

Current production release reference observed before this commit: `e81c6f830ee60397d783df2abdf4e31ec6aff4b6`, also present in `customer-portal/app/lib/build-info.json`. `nebula-nextjs.service` was observed active/running. Its production process was not restarted.

Rollback reference: revert commit `606c49f9e4bf0c9213baa409e73f67c95ee39059`, then rebuild from `e81c6f830ee60397d783df2abdf4e31ec6aff4b6`. Production deployment requires explicit operator authorization after review. This worker had no deployment, restart, publish, URL submission, payment, lead mutation, credential, external-service, or analytics mutation authority.

## Concerns

- `npm install --package-lock-only --ignore-scripts` reported 23 pre-existing dependency vulnerabilities: 7 low, 7 moderate, 9 high. Dependency remediation was outside Task 6 scope.
- Local HTTP probes used port 3101 because port 3100 was already occupied. No production port or service was touched.
