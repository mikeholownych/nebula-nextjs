# Task 6 report

## Status

Local blog migration committed. No production deploy or restart performed.

## Traceability

Implementation commit: `606c49f9e4bf0c9213baa409e73f67c95ee39059` (`chore(blog): remove temporary Opinly blog dependency`).

Evidence correction commit: `c6d18a53422a4b157c8456fd4c39de5ea6f417f6` (`docs(blog): separate preserved analytics evidence`). This commit corrects the evidence classification and traceability in this report, the release document, and the regression test. The implementation commit and evidence correction commit are distinct.

Traceability follow-up commit: `805ad1942` (`docs(blog): correct Task 6 traceability`). This documentation-only follow-up adds the commit chain to the Task 6 evidence. It is not a rollback target.

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
43 focused tests passed, 43 total
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
Tests: 8 skipped, 844 passed, 852 total
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

Traceability regression RED and GREEN:

```text
RED command: deterministic check against HEAD^ report and release document
AssertionError: .superpowers/sdd/task-6-report.md: missing Implementation commit: `606c49f9e4bf0c9213baa409e73f67c95ee39059`
EXIT 1

GREEN command: deterministic check against corrected report and release document
traceability and preserved-evidence check: PASS (2 documents)
EXIT 0
```

Fresh focused checks after the correction:

```text
npx jest __tests__/blog-routes.test.tsx __tests__/blog-loader.test.ts __tests__/metadata/sitemap-inventory.test.ts --runInBand --no-cache
Test Suites: 3 passed, 3 total
Tests: 43 passed, 43 total
EXIT 0

npm run typecheck
EXIT 0

npm run lint
EXIT 0

npm run build
Compiled successfully
Finished TypeScript
Generating static pages using 11 workers (358/358)
EXIT 0

git diff --check
clean
```

The source and evidence scan retains `analytics_pixel_preserved=true` and `blog_runtime_opinly_delivery=false`; remaining Opinly matches are limited to preserved analytics instrumentation, checkout metadata, Stripe purchase tracking, and `@opinly/backend` support. No production deployment, restart, publish, URL submission, payment, lead mutation, credential, external-service, or analytics mutation was performed.

## Route probes

Command: `npx next start --port 3101`, local built artifact only. The probe classified the preserved global pixel separately from blog-runtime delivery.

```text
analytics_pixel_preserved=true; source=customer-portal/app/layout.tsx; id=opinly-pixel; src=https://static.opinly.ai/p.js
blog_runtime_opinly_delivery=false
blog_route_opinly_markers_absent=true
blog_api_request_markers_absent=true
sitemap_opinly_markers_absent=true
/blog: status=200; h1=1; canonical=https://nebulacomponents.com/blog; jsonld=true; cta=false; opinly_request_marker=false
/blog/paid-traffic-not-converting: status=200; h1=1; canonical=https://nebulacomponents.com/blog/paid-traffic-not-converting; jsonld=true; cta=true; cta_text=Run the free audit; opinly_request_marker=false
/blog/what-we-got-wrong-about-filter-based-targeting: status=200; h1=1; canonical=https://nebulacomponents.com/blog/what-we-got-wrong-about-filter-based-targeting; jsonld=true; cta=false; opinly_request_marker=false
/blog/not-a-local-article: status=404
/sitemap.xml: status=200; local_sitemap_urls=2; opinly_request_marker=false
/api/opinly: status=404; request_marker=false
```

The acquisition article probe confirmed the rendered CTA `Run the free audit`. Both article probes confirmed one rendered H1, canonical metadata, and JSON-LD. No blog route, request, API, or sitemap Opinly delivery marker was present. The sitemap contains two local blog URLs.

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

```text
git grep exit=0
blog route source matches: none
blog loader source matches: none
sitemap source matches: none
API route source: customer-portal/app/api/opinly/route.ts absent
preserved matches: app/layout.tsx:134-136 pixel; analytics runtime/checkout/thank-you; stripe webhook purchase tracking; app/lib/opinly.ts support; package.json/package-lock.json @opinly/backend
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

Rollback reference: revert implementation commit `606c49f9e4bf0c9213baa409e73f67c95ee39059`, then rebuild from `e81c6f830ee60397d783df2abdf4e31ec6aff4b6`. Evidence correction commit is documentation and test traceability only, not a rollback target. Production deployment requires explicit operator authorization after review. This worker had no deployment, restart, publish, URL submission, payment, lead mutation, credential, external-service, or analytics mutation authority.

## Concerns

- `npm install --package-lock-only --ignore-scripts` reported 23 pre-existing dependency vulnerabilities: 7 low, 7 moderate, 9 high. Dependency remediation was outside Task 6 scope.
- Local HTTP probes used port 3101 because port 3100 was already occupied. No production port or service was touched.

## Fresh local verification rerun

Working directory for every command below: `/home/mike/nebula/customer-portal`.

Initial failure captured before reinstall:

```text
npm test -- --runInBand
Error: Cannot find module 'slash'
Require stack: @jest/reporters/build/index.js ...
```

The first clean-install attempt also hit `ENOTEMPTY` while removing the old incomplete `node_modules` tree. After removing that untracked dependency tree and rerunning the lockfile install, the install completed:

```text
rm -rf node_modules
npm ci --ignore-scripts
added 1464 packages, and audited 1465 packages in 1m
EXIT 0
```

Fresh commands and exact results:

```text
npm run typecheck
EXIT 0

npm run lint
EXIT 0

npm run check:blog-content
47 passed in 5.56s
EXIT 0

npm test -- --runInBand __tests__/blog-loader.test.ts __tests__/blog-publish-readiness.test.tsx __tests__/blog-routes.test.tsx
Test Suites: 3 passed, 3 total
Tests: 38 passed, 38 total
EXIT 0

npm run build
Compiled successfully
Finished TypeScript
Generating static pages: 358/358
EXIT 0

npm test -- --runInBand
Test Suites: 102 passed, 102 total
Tests: 8 skipped, 844 passed, 852 total
EXIT 0

npm run test:e2e
54 passed (28.4s)
EXIT 0
```

The eight skips are the two `it.skip.each(topicArticles)` assertions in `customer-portal/__tests__/topic-guides-editorial.test.tsx`, expanded across four planned topic-guide articles. `git diff -- customer-portal/__tests__/topic-guides-editorial.test.tsx` was empty, and no Task 6 test was skipped or bypassed.

The first sitemap attempt against `http://127.0.0.1:4173` failed because no local server was running (`curl` exit 7). A local `next start` server was then started on `127.0.0.1:4173`; no production process or canonical domain was contacted. The equivalent local route probe fetched the local sitemap, rewrote each canonical sitemap path to the local origin, and checked each local route:

```text
sitemapUrl=http://127.0.0.1:4173/sitemap.xml
sitemapStatus=200
routeCount=186
failures=[]
Local sitemap route probe passed: 186 canonical sitemap paths returned HTTP 200 with nonempty bodies.
EXIT 0
```

Local blog route probe:

```text
/blog: 200, nonempty=true, canonical=true, jsonLd=true, cta=true
/blog/paid-traffic-not-converting: 200, nonempty=true, canonical=true, jsonLd=true, cta=true
/blog/what-we-got-wrong-about-filter-based-targeting: 200, nonempty=true, canonical=true, jsonLd=true, cta=true
/blog/does-not-exist-task6: 404, notFound=true
EXIT 0
```

Fresh command logs are committed in `.superpowers/sdd/task-6-review-package/verification/`; the temporary `customer-portal/.task6-verification/` directory was removed after packaging.
