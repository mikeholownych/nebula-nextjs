# Local blog migration release record

Date: 2026-09-05 UTC
Scope: Task 6 only, local blog delivery and sitemap parity

## Change

The canonical `/blog` and `/blog/[slug]` routes now use the repository loader and local Markdown articles. The temporary Opinly catch-all blog route and Opinly webhook route were removed. The sitemap now emits local article URLs only. The Opinly analytics pixel and unrelated analytics and purchase tracking remain in place.

## Traceability

Implementation commit: `606c49f9e4bf0c9213baa409e73f67c95ee39059` (`chore(blog): remove temporary Opinly blog dependency`).

Evidence correction commit: `c6d18a53422a4b157c8456fd4c39de5ea6f417f6` (`docs(blog): separate preserved analytics evidence`). The implementation commit and evidence correction commit are distinct.

Traceability follow-up commit: `805ad1942` (`docs(blog): correct Task 6 traceability`). This documentation-only follow-up records the complete Task 6 commit chain. It is not a rollback target.

## Exact evidence

Source inventory command:

```text
git grep -n -i -E '@opinly|OPINLY_|opinly|withOpinlyConfig|buildSitemapEntries' -- customer-portal ':!customer-portal/.next*'
```

Evidence fields:

```text
analytics_pixel_preserved=true; source=customer-portal/app/layout.tsx; id=opinly-pixel; src=https://static.opinly.ai/p.js
blog_runtime_opinly_delivery=false
blog_route_opinly_markers_absent=true
blog_api_request_markers_absent=true
sitemap_opinly_markers_absent=true
```

```text
git grep exit=0
blog route source matches: none
blog loader source matches: none
sitemap source matches: none
API route source: customer-portal/app/api/opinly/route.ts absent
preserved matches: app/layout.tsx:134-136 pixel; analytics runtime/checkout/thank-you; stripe webhook purchase tracking; app/lib/opinly.ts support; package.json/package-lock.json @opinly/backend
```

Remaining matches are classified as follows:

- Analytics pixel: `customer-portal/app/layout.tsx`, `id="opinly-pixel"`, `https://static.opinly.ai/p.js`.
- Browser analytics: `customer-portal/app/components/AnalyticsRuntime.tsx`, `app/audit/[id]/processing/page.tsx`, `app/checkout/CheckoutCTAButton.tsx`, and `app/thank-you/PurchaseTracker.tsx`.
- Unrelated revenue analytics: `customer-portal/app/api/webhooks/stripe/route.ts` imports `getOpinlyClient` and tracks `purchase` when configured. Checkout preserves `opinly_anon_id` metadata.
- Runtime support for unrelated analytics: `customer-portal/app/lib/opinly.ts` retains `@opinly/backend`, API key handling, and the `opinly` cache tag.
- No local blog route, loader, or sitemap source contains Opinly references after the change.
- No source consumer of `customer-portal/app/api/opinly/route.ts` was found. The route itself was the only webhook route reference. It was removed.
- `@opinly/next`, `@opinly/react`, and `@opinly/shared` had no remaining source consumers after the blog route, sitemap integration, and Next config wrapper were removed. They were removed from `package.json` and `package-lock.json`. `@opinly/backend` remains required by Stripe purchase analytics.

File checks:

```text
legacy Opinly blog route: absent
Opinly webhook route: absent
package Opinly deps: [ '@opinly/backend' ]
```

## Verification

- Focused Jest: `3 suites passed, 43 focused tests passed`.
- Full Jest: `102 suites passed, 844 passed, 8 skipped, 852 total`.
- Playwright: `54 passed`.
- TypeScript: `npm run typecheck`, exit 0.
- ESLint: `npm run lint`, exit 0.
- Production build: `npm run build`, exit 0. Build compiled successfully, TypeScript completed, and 358 static pages generated. Prebuild test passed with 38 tests.
- Analytics preservation test: blog route test confirms `id="opinly-pixel"` and `https://static.opinly.ai/p.js` remain.

## Local HTTP probes

Server: `npx next start --port 3101`, built local artifact only. No production restart was performed. The probe classified the preserved global pixel separately from blog-runtime delivery.

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

Both article probes confirmed one rendered H1, canonical metadata, and JSON-LD. No blog route, request, API, or sitemap Opinly delivery marker was present.
## Release and rollback

Current production release reference before this Task 6 commit:

```text
e81c6f830ee60397d783df2abdf4e31ec6aff4b6
revision in customer-portal/app/lib/build-info.json
service state observed: nebula-nextjs.service active/running
```

Rollback reference: revert implementation commit `606c49f9e4bf0c9213baa409e73f67c95ee39059`, then rebuild from `e81c6f830ee60397d783df2abdf4e31ec6aff4b6`. Evidence correction commit is documentation and test traceability only, not a rollback target. Do not use this document as deployment authorization.

Deployment authorization boundary: this worker performed no deploy, restart, publish, URL submission, external CMS operation, payment, lead mutation, credential operation, or analytics mutation. Production deployment requires explicit operator authorization after review of this record and the Task 6 report.

## Fresh local verification rerun

Working directory: `/home/mike/nebula/customer-portal`. The original blocker was an incomplete dependency tree: `npm test -- --runInBand` failed with `Error: Cannot find module 'slash'` from `@jest/reporters`. `npm ci --ignore-scripts` was rerun after removing the untracked `node_modules` tree and installed 1,464 packages with exit 0. No production or canonical-domain call was made.

Fresh results:

```text
npm run typecheck                         EXIT 0
npm run lint                              EXIT 0
npm run check:blog-content                47 passed; EXIT 0
focused blog Jest                         3 suites; 38 passed; EXIT 0
npm run build                             compiled; 358/358 static pages; EXIT 0
npm test -- --runInBand                   102 suites; 844 passed; 8 skipped; 852 total; EXIT 0
npm run test:e2e                          54 passed; EXIT 0
```

The eight skipped tests are unchanged, unrelated planned topic-guide assertions in `customer-portal/__tests__/topic-guides-editorial.test.tsx` (`it.skip.each(topicArticles)` across four planned articles). No Task 6 test was skipped or bypassed.

Local server: `next start` at `http://127.0.0.1:4173`. The local sitemap route probe returned HTTP 200 for the sitemap and all 186 unique sitemap paths, each with a nonempty body. Local `/blog`, two published article routes, and a missing article returned `200`, `200`, `200`, and `404`; the three published routes had canonical metadata, JSON-LD, and CTA markers. The first probe attempt correctly failed with connection refused because the local server was not yet running, then the local-only rerun passed. Exact logs are packaged under `.superpowers/sdd/task-6-review-package/verification/`.
