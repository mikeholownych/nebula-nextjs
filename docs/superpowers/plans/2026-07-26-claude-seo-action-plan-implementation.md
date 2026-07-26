# Claude SEO Review Action Plan — Implementation Plan

> Execution note: implement this plan task by task with test-first changes, an isolated task implementer, and an independent task reviewer. Do not publish fabricated cases, benchmark results, customer outcomes, workflow success, or deployment receipts.

**Goal:** Apply the original lessons from the Claude SEO review to Nebula by making public facts consistent and fail-closed, restoring full Learning Centre discovery and production reliability checks, and giving Citable a focused evidence-led information architecture.

**Architecture:** Keep external package release facts in the existing deterministic Citable projection. Add one typed public-facts registry for commercial and proof availability facts, one Citable route/content registry for the new information architecture, and generated proof projections that emit nothing unless every evidence requirement passes. Derive page rendering, sitemap routes, static parameters, and transactional validation from those sources rather than maintaining duplicate literals.

**Stack:** Next.js App Router, TypeScript, React, Jest, Playwright, GitHub Actions, Lighthouse CI, JSON/YAML projections, Node scripts.

## Global constraints

- Work only in `/home/mike/nebula/.worktrees/claude-seo-action-plan`.
- Preserve the existing empty public case-study state until verified evidence, permission, methodology, and measurement windows exist.
- Keep `/resources/citable` as the canonical product overview and `/resources/citable#software` as the stable software entity identifier.
- Do not modify byte-exact controlled release assets under `public/resources/citable/`.
- Do not use runtime GitHub status calls as proof. Unknown or missing receipts must render as unavailable.
- Do not present Lighthouse lab results as field INP or real-user performance.
- Do not deploy to production without explicit approval.

## Task 1: Restore the complete Learning Centre inventory

**Files:**

- Modify: `customer-portal/__tests__/metadata/sitemap-inventory.test.ts`
- Modify: `customer-portal/app/learning-centre/lib/getArticles.ts`
- Add: `customer-portal/app/learning-centre/{15-missing-slugs}/meta.json`

**Steps:**

1. Strengthen the failing inventory test so it enumerates every article directory containing `page.tsx`, requires a valid `meta.json`, validates `slug`, `title`, `description`, and `category`, and asserts the metadata slug matches its directory.
2. Run the focused test and retain the observed failure for all missing directories.
3. Add the 15 metadata sidecars using the page’s existing exported title and description, an existing category label, and the directory slug.
4. Make malformed metadata an explicit development/test error rather than a silent skip while keeping production rendering fail-safe.
5. Run:

   ```bash
   npm test -- --runInBand __tests__/metadata/sitemap-inventory.test.ts __tests__/metadata/learning-centre-category-coverage.test.ts
   ```

**Acceptance:** all 45 article pages are represented by `getArticles()`, the Learning Centre hub, and the sitemap.

## Task 2: Establish a canonical, fail-closed public-fact registry

**Files:**

- Add: `customer-portal/app/lib/public-facts.ts`
- Add: `customer-portal/__tests__/public-facts.test.ts`
- Add: `customer-portal/__tests__/metadata/offer-proof-consistency.test.ts`
- Modify: `customer-portal/app/pricing/page.tsx`
- Modify: `customer-portal/app/checkout/page.tsx`
- Modify: `customer-portal/app/api/webhooks/stripe/route.ts`
- Modify: `customer-portal/app/case-studies/page.tsx`
- Modify: `customer-portal/app/case-studies/[slug]/page.tsx`
- Modify: `customer-portal/app/sitemap.ts`
- Modify: `customer-portal/app/terms/page.tsx`
- Modify: `customer-portal/app/ai-sdr-vs-audit/page.tsx`
- Modify: `customer-portal/components/WebMCP.tsx`
- Modify: `customer-portal/PRODUCT.md`
- Modify: `customer-portal/public/llms.txt`
- Modify: `customer-portal/public/llms-full.txt`
- Remove: `customer-portal/app/CaseStudyPage.tsx`

**Registry contract:**

- `fixPack`: active status, price in cents, price validity, checkout identity, automated prompt-pack delivery, customer/developer implementation boundary, and re-audit status.
- `caseStudies`: `none_published` with an empty array until each record has evidence, a measurement window, permission, disclosure, and publication metadata.
- `citable`: imports release facts from `data/citable-release.json`; deployment/workflow checks default to `unknown` without a committed fresh receipt.

**Steps:**

1. Write tests proving invalid, expired, unsupported, or incomplete facts are omitted.
2. Add the typed registry and accessors; make the active offer `$97` / `9700` cents and describe delivery as an automated prompt pack available within minutes.
3. Derive pricing metadata/schema, checkout copy and URL, Stripe amount validation, case-study routing, and sitemap case routes through accessors.
4. Reconcile terms and product documentation with the customer/developer implementation boundary. Do not invent refund or implementation promises.
5. Reconcile `llms.txt` and `llms-full.txt`.
6. Delete the unused legacy case-study component that contains unsupported promises.
7. Add a scoped consistency test that rejects retired prices, bespoke-implementation promises, unverified case outcomes, and delivery-window drift across active commercial, legal, machine-readable, and comparison surfaces. Price display literals may remain in editorial copy when they match the registry; transactional validation and structured data must derive from the registry.
8. Run:

   ```bash
   npm test -- --runInBand __tests__/public-facts.test.ts __tests__/metadata/offer-proof-consistency.test.ts __tests__/containment/production-safety.test.ts
   npm run typecheck
   npm run lint
   ```

**Acceptance:** every active commercial surface says `$97`, prompt pack within minutes, customer/developer implements; published case inventory is zero; unsupported claims fail closed.

## Task 3: Add crawlability, contextual-link, and live-sitemap reliability gates

**Files:**

- Add: `customer-portal/e2e/learning-centre-crawlability.spec.ts`
- Add: `customer-portal/e2e/learning-centre-contextual-links.spec.ts`
- Add: `customer-portal/scripts/check-sitemap-routes.mjs`
- Add: `customer-portal/__tests__/scripts/check-sitemap-routes.test.ts`
- Modify: `customer-portal/app/learning-centre/CategoryAccordion.tsx`
- Modify: relevant Learning Centre pages with missing contextual routes
- Modify: `.github/workflows/production-smoke.yml`
- Modify: `customer-portal/package.json`

**Steps:**

1. Add a raw-response test proving the hub HTML contains an anchor for every article before client JavaScript.
2. Add a contextual-link test that rejects nonexistent Learning Centre targets and requires useful article-to-article routes. Fix the existing `/learning-centre/trust-signals-landing-page` broken target.
3. Prefer a small shared, context-aware related-reading projection over hand-copying generic links into every article. Preserve existing hand-curated links.
4. Implement a bounded-concurrency sitemap checker with request timeout, retries for transient 5xx responses, and nonzero exit for sitemap fetch failure or any persistent 5xx/empty response.
5. Test it against local fixture servers that return 200, intermittent 500→200, persistent 500, timeout, and malformed sitemap responses.
6. Invoke the checker from the scheduled and main-push production smoke workflow.
7. Run the focused Jest and Playwright tests.

**Acceptance:** all article anchors exist in raw hub HTML, internal Learning Centre targets resolve to real routes, and production smoke fails on persistent sitemap-route 5xx responses.

## Task 4: Build a single Citable route/content registry and shared shell

**Files:**

- Add: `customer-portal/app/resources/citable/content.ts`
- Add: `customer-portal/components/citable/CitablePageShell.tsx`
- Add: `customer-portal/components/citable/CitableProofPanel.tsx`
- Add: `customer-portal/components/citable/CitableJobTemplate.tsx`
- Add: `customer-portal/__tests__/citable-information-architecture.test.ts`
- Modify: `customer-portal/app/resources/citable/page.tsx`
- Modify: `customer-portal/app/resources/page.tsx`
- Modify: `customer-portal/app/sitemap.ts`
- Modify: `customer-portal/__tests__/citable-projection.test.ts`

**Steps:**

1. Write registry tests for unique paths, titles, H1s, primary questions, sitemap coverage, and overview navigation coverage.
2. Define the bounded route map:
   - `/resources/citable/quick-start`
   - `/resources/citable/jobs/technical-retrieval-audit`
   - `/resources/citable/jobs/claim-evidence-governance`
   - `/resources/citable/jobs/answer-extractability-audit`
   - `/resources/citable/jobs/entity-narrative-audit`
   - `/resources/citable/jobs/release-deployment-verification`
   - `/resources/citable/compare`
   - `/resources/citable/releases`
3. Build shared components using Nebula’s existing visual primitives.
4. Refactor the monolithic overview into a concise hub. Remove stale hard-coded counts, the unsubstantiated vendor matrix, runtime workflow status proof, and manually duplicated release history.
5. Derive release facts from `data/citable-release.json` and routes from `content.ts`.
6. Update projection tests so a future synchronized Citable release does not fail because of old hard-coded expected counts.

**Acceptance:** Citable has one bounded route authority, the overview links every child, the sitemap derives from the same registry, and render files contain no release-count duplication.

## Task 5: Publish the Citable quick start and five job pages

**Files:**

- Add: `customer-portal/app/resources/citable/quick-start/page.tsx`
- Add: `customer-portal/app/resources/citable/jobs/[slug]/page.tsx`
- Add: `customer-portal/e2e/citable-information-architecture.spec.ts`

**Steps:**

1. Write route tests for metadata, canonical URL, unique H1/question, static parameters, and explicit evidence boundaries.
2. Write the quick start around install → audit → inspect evidence → decide → verify, using current package commands only.
3. Write five non-overlapping job pages from the registry. Each must start with a direct answer, state what Citable observes, state what it cannot establish, show evidence artifacts, and give the next operational step.
4. Use existing article and breadcrumb schema helpers.
5. Run Jest, Playwright, typecheck, and lint for the new routes.

**Acceptance:** each page answers a distinct evidence-governance job and makes no ranking, citation, conversion, or deployment-success promise.

## Task 6: Publish an honest comparison and evidence-led release page

**Files:**

- Add: `customer-portal/app/resources/citable/compare/page.tsx`
- Add: `customer-portal/app/resources/citable/releases/page.tsx`
- Modify: `customer-portal/e2e/citable-information-architecture.spec.ts`

**Steps:**

1. Write tests requiring comparison states `documented`, `not assessed`, or `requires external source`.
2. Compare product categories and workflows, not unverified named-vendor feature claims.
3. Explain when Citable is appropriate and when a crawler, rank tracker, or AI-visibility platform is still required.
4. Generate the current release page from the synchronized projection, link controlled assets, and label live deployment verification unavailable unless a valid receipt exists.
5. Verify canonical metadata, schema, links, and disclosure text.

**Acceptance:** the comparison is useful without unsupported competitor claims; release notes are data-driven and evidence-bounded.

## Task 7: Add answer-first editorial and route-level performance gates

**Files:**

- Add: `customer-portal/lighthouserc.cjs`
- Add: `customer-portal/__tests__/performance-budget-config.test.ts`
- Modify: selected high-priority Learning Centre pages
- Modify: `customer-portal/package.json`
- Modify: `customer-portal/package-lock.json`
- Modify: `.github/workflows/ci.yml`

**Steps:**

1. Add tests for answer-first structure on the highest-priority Learning Centre pages: direct answer near the top, explicit evidence boundary, descriptive internal links, and no unsupported outcome promise.
2. Apply the standard to a bounded priority set selected by conversion intent and current traffic journey; do not mass-rewrite all articles.
3. Add Lighthouse CI budgets for `/learning-centre`, a representative long article, `/resources/citable`, and one Citable job page:
   - performance score ≥ 0.90
   - LCP ≤ 2.5 seconds
   - CLS ≤ 0.10
   - TBT ≤ 200 milliseconds
4. Add a CI job that builds, starts, and audits the selected routes. Keep Lighthouse findings labelled as lab measurements.
5. Run the config test and a local Lighthouse pass.

**Acceptance:** priority editorial surfaces answer first and CI enforces explicit lab-performance budgets on representative routes.

## Task 8: Add evidence-gated proof and benchmark scaffolding

**Files:**

- Add: `customer-portal/data/public-proof-surfaces.json`
- Add: `customer-portal/data/public-proof.generated.json`
- Add: `customer-portal/scripts/compile-public-proof.mjs`
- Add: `customer-portal/__tests__/citable-proof-integrity.test.ts`
- Modify: `customer-portal/app/case-studies/page.tsx`
- Modify: `customer-portal/app/case-studies/[slug]/page.tsx`
- Modify: `customer-portal/app/sitemap.ts`
- Modify: `customer-portal/components/citable/CitableProofPanel.tsx`
- Modify: `customer-portal/package.json`

**Steps:**

1. Write rejection tests for missing evidence, expired review, missing methodology, missing measurement window, missing source artifact, missing disclosure, and missing publication permission.
2. Compile only fully supported public cases/benchmarks; produce an empty projection for the current repository state.
3. Derive case-study static parameters and sitemap entries from the generated projection.
4. Render the honest “not published yet” state when the projection is empty. Do not create thin benchmark or case-detail routes.
5. Add the projection check to CI.

**Acceptance:** public proof cannot appear from manually written copy or an incomplete record; current case and benchmark counts remain zero.

## Task 9: Full verification and review

**Files:**

- Update: `.superpowers/sdd/progress.md`
- Update: this plan with any accepted deviations

**Steps:**

1. Run:

   ```bash
   npm run governance:check
   npm run lint
   npm run typecheck
   npm test -- --runInBand
   npm run build
   npm run check:citable-projection
   npm run check:evidence-atoms
   npm run check:public-proof
   npm run test:e2e
   npm run test:performance
   ```

2. Run the sitemap checker against the configured public base URL three consecutive times and retain per-pass receipts.
3. Request an independent final review for scope, proof integrity, crawlability, accessibility, performance, and contradictions.
4. Resolve all blockers and rerun affected verification.
5. Stop before production deployment and present the tested branch for approval.

**Done when:** all repository checks are green, the live-readiness gates are repeatable, no unsupported public proof exists, and the branch is ready for explicit deployment approval.

## Accepted verification deviations

- The repository has no `governance:check` npm script. Task 9 runs the workflow's actual validator directly with `node scripts/validate-governance.mjs`.
- Lighthouse remains a lab gate, not a production claim. The CI profile is explicitly desktop and retains the fixed performance score, LCP, CLS, and TBT budgets; mobile rendering is covered separately by the Playwright mobile project. Application-level hydration, prefetch, and route-wide webfont sources were removed from the audited shell, and all four representative routes pass three-run median collection on the isolated branch server.
- Local Lighthouse collection uses isolated port `3102` so an existing production server on the conventional port cannot be mistaken for the branch build. Container verification also supplies Lighthouse with Playwright's Chromium binary; `--no-sandbox` is required by this verification host's disabled user namespaces.
- The production origin recovered before final closure. Three consecutive sitemap checks each returned 68/68 HTTP 200 responses with nonempty bodies, and a separate direct check returned HTTP 200 for all 45 Learning Centre article routes.
