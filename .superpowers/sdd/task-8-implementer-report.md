# Task 8 implementer report

## Scope

Added a governed public-proof authoring registry and deterministic compiler for
case studies and benchmarks. The current repository intentionally publishes no
case or benchmark outcomes.

## TDD evidence

- The first integrity run failed because the generated projection and compiler
  did not exist and `public-facts.ts` still contained a manually authored empty
  case registry.
- The rejection matrix failed until the compiler omitted missing or unsupported
  claims/evidence, expired reviews, missing methodology/windows/artifacts/
  disclosure/permission, invalid type/slug declarations, and malformed or
  future dates with stable diagnostics.
- The validity-window regression failed until compiled records projected the
  earliest governed expiry and runtime accessors rechecked it against the
  current UTC date.
- The route-cache regression failed first against module-level proof caching,
  then against ISR staleness. Case, Citable, and sitemap proof surfaces now
  render dynamically so an expired record cannot be served from a stale
  prerender.

## Implementation

- `data/public-proof-surfaces.json` is the only authoring registry and starts
  empty.
- `scripts/compile-public-proof.mjs` cross-checks the governed claim and
  evidence registries and emits sorted `cases`, `benchmarks`, and omission
  diagnostics.
- Normal compilation and `--check` evaluate expiry against the actual current
  UTC date. Tests may supply `--at`; the authoring `asOf` remains provenance,
  must not be in the future, and no volatile evaluation timestamp is emitted.
- `public-facts.ts` imports only `data/public-proof.generated.json` for public
  cases and benchmarks. Manually injected `caseStudies.entries` data is ignored.
- Case index/detail/static parameters, sitemap entries, and Citable proof status
  derive through generated-projection accessors.
- Proof-bearing routes and the sitemap use `dynamic = 'force-dynamic'` so the
  current-clock expiry gate executes for every request.
- The Citable proof panel shows the honest unpublished state without rendering
  a numeric zero outcome. No benchmark route was added.
- `compile:public-proof` and `check:public-proof` are present in package scripts;
  the drift check runs in both package CI and the root GitHub workflow.

## Verification

- `CI=1 npm test -- --runInBand` — 30/30 suites, 287/287 tests passed.
- `npm run check:public-proof` — current; 0 cases, 0 benchmarks, 0 omissions.
- `npm run check:evidence-atoms` — current; 1 published, 0 omitted.
- `npm run check:citable-projection` — current at v1.14.0.
- `npm run check:intelligence-stack` — current.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm run build` — passed; 116 static pages, with case/Citable/sitemap proof
  surfaces rendered dynamically and absent from the prerender manifest.
- `npm run test:e2e -- e2e/citable-information-architecture.spec.ts` — 26/26
  desktop/mobile tests passed, including the empty case index and unknown case
  404.
- `git diff --check` — passed.

## Independent review

`/root/implement_public_proof/review_public_proof` returned **APPROVED** with no
Critical, Important, or Minor findings after two review-driven clock-safety
fixes:

1. replaced bounded ISR with request-time dynamic proof rendering;
2. rejected future measurement completion, publication, and modification dates.

## Boundaries

- No evidence, case, benchmark, or numeric outcome was fabricated.
- No controlled asset under `customer-portal/public/resources/citable/` changed.
- No production deployment was performed.
