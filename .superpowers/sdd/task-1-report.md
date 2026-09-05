# Task 1 verification report

## Outcome

Task 1 establishes the local article contract, filesystem loader, content directories,
empty provenance ledger files, README, and focused contract tests. No production service,
route, deployment, publishing workflow, payment, lead store, or Opinly runtime integration
was changed.

## Exact files changed by commit

- `customer-portal/app/lib/blog/types.ts`
- `customer-portal/app/lib/blog/loader.ts`
- `customer-portal/__tests__/blog-loader.test.ts`
- `content/README.md`
- `content/briefs/.gitkeep`
- `content/drafts/.gitkeep`
- `content/published/.gitkeep`
- `content/archived/.gitkeep`
- `content-ledger/opportunities.jsonl`
- `content-ledger/claims.jsonl`
- `content-ledger/approvals.jsonl`
- `content-ledger/publication-events.jsonl`

Unrelated pre-existing work was not staged or committed.

## Implemented interfaces

- `BlogArticle` combines strict frontmatter fields with rendered Markdown or MDX body and source path.
- `loadArticle(slug)` performs deterministic slug lookup, rejects unsafe slugs, and returns only `approved` or `published` articles.
- `listArticles(filter?)` scans the canonical local content directories, sorts by slug, supports lane and status filters, and excludes non-public statuses.
- `validateSourceRefs(article, sourceIndex)` reports every missing source reference.
- Strict allowlists cover all design-approved statuses, acquisition post types, feature post types, and the two content lanes.

## TDD and test evidence

Initial focused run before implementation failed as expected because the loader module did not exist:

```text
FAIL __tests__/blog-loader.test.ts
Cannot find module '../app/lib/blog/loader'
Test Suites: 1 failed, 1 total
Tests:       0 total
```

Focused command after implementation:

```text
cd customer-portal && npm test -- --runInBand __tests__/blog-loader.test.ts
```

Output:

```text
Test Suites: 1 passed, 1 total
Tests: 15 passed, 15 total
Snapshots:   0 total
Time:        2.029 s
Ran all test suites matching __tests__/blog-loader.test.ts.
```

Full test command:

```text
cd customer-portal && npm test -- --runInBand
```

Output:

```text
Test Suites: 100 passed, 100 total
Tests:       8 skipped, 821 passed, 829 total
Snapshots:   0 total
Time:        82.446 s
Ran all test suites.
```

Additional checks:

```text
$ npm run typecheck
npm notice run nebula-customer-portal@2.0.0 typecheck
npm notice run tsc --noEmit
```

Exit code: 0.

```text
$ npm run lint -- --no-warn-ignored
npm notice run nebula-customer-portal@2.0.0 lint
npm notice run eslint . --no-warn-ignored
```

Exit code: 0.

```text
$ git diff --check
```

Exit code: 0. No output.

- Task 1 shipped content em dash scan: no em dashes found

## Commit

Original Task 1 commit:

`440cf4609d8b88d2ceef312699ab5dd7b98170b0`

Commit message: `feat(blog): add local article contract and loader`

Review fix commit:

`e93f3d8dc28b9dc95a05317188059e0cb6e06f4f`

Commit message: `fix(blog): validate optional article fields`

## Review fixes

- Added runtime validation for `primary_query`, `supporting_queries`, `published_at`, `updated_at`, and `reviewed_by`.
- Added real temporary content files during tests for approved acquisition, published feature, and drafted articles, with cleanup after the filesystem tests.
- Added coverage for successful `loadArticle`, lane and status filters, draft exclusion, and invalid lane and post-type combinations.
- Process working-directory sensitivity was left unchanged because removing it safely would require selecting an app-root convention not specified by the task.

## Concerns and scope boundaries

- The loader is intentionally public-safe and excludes every status other than `approved` and `published`; later pipeline tasks can add separate editorial tooling without weakening this boundary.
- The four ledger files are empty append-only seeds. Ledger schemas and atomic writes belong to later tasks.
- Live HTTP verification was not run because this task adds no route and the task explicitly forbids deployment or production side effects.
- Existing Opinly dependencies remain untouched for migration compatibility, but the new loader imports none of them.

## CWD-sensitivity remediation

The loader now reads `NEBULA_CONTENT_ROOT` on each filesystem operation and falls back to a content directory resolved from the loader module URL, not `process.cwd()`. Article source paths are also relative to the selected content root. Focused filesystem tests use a temporary content root and change the working directory to the system temporary directory, so real repository content is not mutated.

### Exact command output

Failing regression test before the loader change:

```text
npm notice run nebula-customer-portal@2.0.0 test
npm notice run NODE_ENV=test NODE_OPTIONS=--experimental-vm-modules jest --runInBand __tests__/blog-loader.test.ts
FAIL __tests__/blog-loader.test.ts
  ● local blog article contract › filesystem discovery › loads and discovers articles outside the customer-portal working directory

    Expected: ObjectContaining {"slug": "landing-page-not-converting"}
    Received: null

  ● local blog article contract › filesystem discovery › loads a public article from a real content file

    Expected: ObjectContaining {"slug": "landing-page-not-converting", "status": "approved"}
    Received: null

  ● local blog article contract › filesystem discovery › filters real articles by lane and public status while excluding drafts

    Received: Array []

Test Suites: 1 failed, 1 total
Tests:       3 failed, 13 passed, 16 total
Snapshots:   0 total
Time:        2.547 s
Ran all test suites matching __tests__/blog-loader.test.ts.
```

Focused blog test after the change:

```text
npm notice run nebula-customer-portal@2.0.0 test
npm notice run NODE_ENV=test NODE_OPTIONS=--experimental-vm-modules jest --runInBand __tests__/blog-loader.test.ts
Test Suites: 1 passed, 1 total
Tests:       16 passed, 16 total
Snapshots:   0 total
Time:        3.357 s
Ran all test suites matching __tests__/blog-loader.test.ts.
```

Typecheck:

```text
npm notice run nebula-customer-portal@2.0.0 typecheck
npm notice run tsc --noEmit
```

Exit code: 0.

Lint:

```text
npm notice run nebula-customer-portal@2.0.0 lint
npm notice run eslint . --no-warn-ignored
```

Exit code: 0.

Diff checks:

```text
git diff --check && git status --short
M .superpowers/sdd/progress.md
M .superpowers/sdd/task-5-report.md
M customer-portal/next-env.d.ts
M growth_system/weekly_runs.jsonl
M ledgers/bounce_ledger.jsonl
M ledgers/epistemic_observatory.json
M ledgers/repair_verification.json
M seo-reports/ai-traffic-ledger.json
?? aeo_harness/output/citations.json
?? content/ops-finance/2026-09-02_acquisition-weekly-update.md
?? content/ops-finance/2026-09-03_revenue-funnel-reconciliation.md
?? content/ops-finance/2026-09-04_revenue-funnel-reconciliation.md
?? content/support/2026-09-03_inbox-inspection-report.md
?? content/support/2026-09-04_inbox-inspection-report.md
?? reports/funnel_health/
```

`git diff --check` produced no errors. The diff contained no Opinly references.

### Changed files

- `customer-portal/app/lib/blog/loader.ts`
- `customer-portal/__tests__/blog-loader.test.ts`
- This report file

### Commit

Implementation commit: `3f4ce447459d70de50ecb7796bcd65cfb2af6460`

### Concerns

- The environment override is resolved with `path.resolve`, so relative override values remain relative to the process working directory. Deployments should provide an absolute `NEBULA_CONTENT_ROOT` when using the override.
- No production service, route, deployment, publishing workflow, payment, lead store, or Opinly runtime integration was changed.
