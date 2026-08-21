# Case-study HTML (R32) — deferred

Do not delete `public/case-studies/*.html` until the paths below are proven not still live.

## What is already owned by App Router

- `/case-studies` → `app/case-studies/page.tsx`
- `/case-studies/[slug]` → `app/case-studies/[slug]/page.tsx`
- `app/case-studies/[slug]/data.ts` currently exports `caseStudies = []`; published entries come from `app/lib/public-facts.ts`

## What is not proven

There are 418 files under `public/case-studies/*.html`. Next serves `public/` as static files at the same URL, so `/case-studies/ecommerce-airbnb-com.html` is a different path from `/case-studies/ecommerce-airbnb-com`.

`next.config.ts` does **not** 301/410 those HTML files. The only case-study redirect is `/case-studies/self-audit.html` → `/case-studies`. The hyphenated rewrites (`/:path(\\w+-\\w+-\\w+)` → `/:path.html` and the two-word equivalent) match **root** paths only, not `/case-studies/*`.

## Confirmation still needed before archive/delete

1. Crawl / GSC inventory of indexed `/case-studies/*.html` URLs (and any inbound links).
2. A 301 or 410 map for each HTML path that should no longer be served as static files.
3. Proof that App Router `[slug]` (or public-facts slugs) is the canonical target for those URLs, not a 404.

Until then, leave the static HTML in place. Do not 404 crawlable URLs.
