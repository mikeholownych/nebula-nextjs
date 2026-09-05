# Task 5 review resolution report

## Status

Implemented and locally verified the supervised create, review, edit, approval, and publish workflow. No production deployment, external content service, analytics write, article mutation, credential, payment, or network side effect was performed.

## Review findings resolved

- `review_draft.py` now uses shared validation that invokes claim/provenance, source, canonical, timing/readiness validation paths and emits structured named failures.
- Publication rejects malformed drafts, malformed approval/readiness records, missing readiness hashes, stale hashes, non-PASS readiness, and missing explicit human approval.
- Publication requires an exact nonempty readiness draft hash. `full_readiness: false` is rejected.
- `--opportunity` now validates through the existing opportunity/brief validation path before writing a local brief.
- Slugs are restricted to safe lowercase hyphenated identifiers. Traversal is rejected.
- Draft revisions are immutable and allocate after the highest numeric revision, including when gaps or unrelated version files exist.
- Edit revisions preserve provenance and article validation context.
- Publication is restricted away from production/customer-portal paths and writes only to the explicitly selected local root. It writes an article copy and publication receipt only after approval and readiness gates pass.
- Recommendation, approval, and execution remain separate states.

## Tests and checks

- RED verification: five new review tests failed before implementation, with four expected failures covering version gaps, traversal, provenance, and malformed publication. The fifth existing-compatible receipt test passed before implementation.
- Focused workflow suite: **11 passed**.
- Full relevant Python content suites: **63 passed**.
- Full repository `.venv` pytest suite: **913 passed, 3 existing warnings**.
- Content CI: `npm run check:blog-content`, **38 passed**.
- Customer portal typecheck: `npm run typecheck`, **passed**.
- Customer portal lint: `npm run lint`, **passed**.
- Customer portal build: `npm run build`, **passed**. Build precheck: **38 tests passed**.
- Python compilation: five modified pipeline modules, **passed**.
- `git diff --check`: **passed**.
- Lifecycle test: create `v001`, review PASS, edit to immutable `v002`, create exact-hash full-readiness approval, publish to a temporary local root, verify article and receipt, **passed**.
- Dry-run test verified no publication root creation or draft mutation.

## Files changed

- `scripts/content_pipeline/_validation.py`
- `scripts/content_pipeline/create_draft.py`
- `scripts/content_pipeline/review_draft.py`
- `scripts/content_pipeline/apply_edits.py`
- `scripts/content_pipeline/publish_article.py`
- `tests/test_content_pipeline_workflow.py`
- `task-5-report.md`

## Concerns

- `ruff` is not installed in the repository environment, so the requested Ruff check could not run. The command returned `/usr/bin/bash: ruff: command not found`.
- Full pytest emitted three pre-existing warnings from the real PostgreSQL locking tests and one Starlette deprecation warning. No test failures occurred.
