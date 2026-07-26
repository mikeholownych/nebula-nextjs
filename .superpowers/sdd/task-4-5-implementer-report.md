# Tasks 4 and 5 Implementer Report — Citable Information Architecture and Job Guides

## Status

Implemented Tasks 4 and 5 as one atomic route release. The overview, registry,
shared components, quick start, five job pages, sitemap projection, and route
tests ship together, so no published navigation or sitemap entry points to an
unimplemented route.

No deployment was performed.

## TDD evidence

### Red

1. Added `__tests__/citable-information-architecture.test.ts` before the
   registry, shared components, and routes existed.
2. The first focused run failed on all intended boundaries:
   - missing registry, shared components, quick start, and job route;
   - absent supporting routes in the sitemap;
   - runtime GitHub workflow and release fetches;
   - copied release history and named-vendor comparison matrix;
   - hard-coded detector and namespace counts.
3. Added registry tests for the exact bounded route map; unique paths, titles,
   H1s, and primary questions; the five-job content contract; fail-closed proof
   states; canonical metadata; and version-pinned quick-start commands.
4. Added render and route tests for overview navigation, the five-step quick
   start, static parameters, metadata, 404 behavior, evidence boundaries, and
   structured data.
5. Independent review found one remaining red condition: Apache license facts
   were still copied into render and schema files. A regression assertion failed
   on those literals before the license display and URL moved into the release
   projection.

### Green

1. Added one typed route/editorial registry at
   `app/resources/citable/content.ts`. It imports
   `data/citable-release.json`, owns the bounded route map and page records, and
   derives package version, counts, runtime, source, license display, and SPDX
   URL.
2. Published exactly the overview, quick start, and five approved job pages.
   `/compare` and `/releases` remain `planned`; published selectors exclude
   them, and no page, link, static parameter, or sitemap entry exists for them.
3. Added shared `CitablePageShell`, `CitableProofPanel`, and
   `CitableJobTemplate` components using the existing Nebula typography,
   spacing, border, panel, and restrained emerald primitives.
4. Replaced the monolithic overview with an answer-first hub. Removed runtime
   GitHub calls, workflow badges, copied release history, stale count literals,
   and the unsupported named-vendor capability matrix.
5. Added the quick start in the approved install → audit → inspect → decide →
   verify order. Every CLI command is version-pinned from the synchronized
   package projection and exists in the published Citable 1.14.0 documentation.
6. Added the five distinct evidence jobs:
   - technical retrieval;
   - claim and evidence governance;
   - answer extractability;
   - entity and narrative consistency;
   - release and deployment verification.
7. Every job starts with a direct answer and includes observations, evidence
   artifacts, limits, next action, and bounded related routes.
8. Package proof derives from the deterministic release projection. Workflow
   and deployment state remain `unknown`; customer cases and benchmark outcomes
   remain `not_published`.
9. Supporting pages use the existing Article and Breadcrumb schema helpers.
   Tests parse rendered JSON-LD, including the overview's stable
   `https://nebulacomponents.shop/resources/citable#software` identifier.
10. Sitemap entries, overview navigation, static job parameters, and canonical
    metadata derive from the registry.
11. Projection tests no longer pin historical release version or count values.

## Projection synchronization

During implementation, `check:citable-projection` detected that npm had advanced
from Citable 1.13.1 to 1.14.0. With parent approval, `npm run sync:citable`
updated exactly:

- `data/citable-release.json`
- `public/llms.txt`
- `public/llms-full.txt`

The byte-exact controlled assets under `public/resources/citable/` were not
modified. Their SHA-256 hashes were identical before and after synchronization.

## Verification

- Full Jest:
  - 26 suites passed.
  - 225 tests passed.
- Focused Citable Jest:
  - 2 suites passed.
  - 21 tests passed.
- `npm run check:citable-projection`
  - Passed: Citable projection current at v1.14.0.
- `npm run check:evidence-atoms`
  - Passed: 1 published, 0 omitted.
- `npm run typecheck`
  - Passed.
- `npm run lint`
  - Passed.
- `npm run build`
  - Passed: 120 static pages generated, including the overview, quick start,
    and five job parameters; no compare or release-history page was generated.
- `npx playwright test e2e/citable-information-architecture.spec.ts --project=desktop --project=mobile`
  - Passed: 18 tests across desktop and mobile.
- `git diff --check`
  - Passed.
- Required TSX corruption, control-character, warning-token, commercial-drift,
  runtime-GitHub, stale-count, and vendor-name scans returned no matches.

## Independent review

The read-only reviewer first blocked on hard-coded release-license facts. That
gap was remediated through `citableLicenseFacts`, and rendered schema assertions
were added for the reviewer's minor coverage observation.

Final verdict: **APPROVE**, with no Critical, Important, or Minor findings.

## Scope

This combined commit contains Tasks 4 and 5 plus the three generated Citable
1.14.0 projection updates required to make the existing projection gate current.
Task 6 still owns comparison and release-history pages. No production deploy,
public proof record, customer outcome, benchmark result, workflow receipt, or
deployment receipt was created.
