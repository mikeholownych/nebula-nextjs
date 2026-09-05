# Task 5 review remediation report

## Status

All three Important findings are remediated. The workflow remains local-only, supervised, immutable, and fail closed. No production publish, deployment, push, payment, lead, credential, analytics, or external service action occurred.

## Findings resolved

1. `_readiness_contract.validate` now requires the exact top-level readiness schema, the complete 14-item requirement declaration, empty structured findings, draft binding, exact 64-character lowercase draft hash, valid timestamp, PASS status, validated=true, full_readiness=true, complete PASS validator output, and a valid HMAC over the complete report. A locally signed report with `readiness={}` is rejected with `MISSING_VALIDATOR_OUTPUTS`.
2. `_validation` preserves every provenance record long enough to reject malformed non-object records explicitly. Strings, null, arrays, and unknown typed records are blocked in review. `create_draft` blocks non-object source records before allocation or mutation. Unknown typed objects return `SOURCE_ERROR_UNKNOWN_SOURCE_TYPE`.
3. Sidecar `article.canonical_url` is compared with draft frontmatter `canonical_url`; mismatch returns `CANONICAL_MISMATCH` before review or publication.

## Evidence

- RED: `./.venv/bin/pytest -q tests/test_task5_remaining_findings.py -q` returned 2 passed, 4 failed. Failures reproduced empty readiness acceptance, malformed record handling, create crash/filter behavior, and canonical mismatch acceptance.
- Focused GREEN: `./.venv/bin/pytest -q tests/test_task5_remaining_findings.py tests/test_content_pipeline_workflow.py tests/test_content_pipeline_validation.py` returned `53 passed`.
- Full Python suite: `./.venv/bin/pytest -q` returned `928 passed, 3 warnings`.
- Python syntax: `./.venv/bin/python -m py_compile scripts/content_pipeline/_readiness_contract.py scripts/content_pipeline/_validation.py scripts/content_pipeline/create_draft.py scripts/content_pipeline/review_draft.py scripts/content_pipeline/publish_article.py` returned `PY_COMPILE=0`.
- `npm ci --include=dev` returned exit 0. npm reported 23 audit vulnerabilities and deprecated-package/install-script warnings; no lockfile change was made.
- `npm run check:blog-content` returned exit 0, with 47 validation tests passed.
- `npm run typecheck` returned exit 0.
- `npm run lint` returned exit 0.
- `npm run build` returned exit 0. The prebuild Jest gate returned 38 passed.
- `npm test -- --runInBand` returned `102 suites passed, 840 tests passed, 8 skipped`.
- `npm run test:e2e` returned `54 passed`.
- `git diff --check` returned exit 0.

## Lifecycle

The existing real-fixture lifecycle test passed as part of the focused and full suites:

`create v001 -> review actual v001 -> apply edit -> v002 -> review actual v002 -> exact human approval -> dry-run -> controlled local publish receipt`

The dry-run target remained absent. Controlled publish wrote only the explicit temporary local target and receipt. Invalid source, malformed draft, missing approval, stale hash, unbound/incomplete readiness, tampered parent, unsafe slug, unknown typed record, and canonical mismatch cases remained blocked.

## Review package

`.superpowers/sdd/task-5-review-package/`

## Concerns

- `npm ci` reported 23 vulnerabilities, including 9 high, and package deprecation warnings. This remediation did not alter dependency versions or broaden scope.
- The full Python suite emitted 3 existing runtime/deprecation warnings. No test failures occurred.
- Unrelated dirty paths were preserved and not staged.
