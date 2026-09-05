# Task 5 readiness integrity verification report

## Status

PASS. Publication no longer trusts a signature alone. It validates the complete schema, recomputes review output from the referenced draft, and compares canonicalized validator output before any local write. No production publish, deployment, push, payment, lead, credential, analytics, or external service action occurred.

## Integrity controls

- Strict top-level schema, producer marker, draft path, lowercase SHA-256 draft hash, ISO timestamp, PASS status, validated=true, full_readiness=true, all 14 requirements, and empty structured findings are required.
- Claim results, claim reasons, source references, provenance, and opportunity are nonempty and schema-validated.
- Recommendation values are limited to OBSERVE, REVIEW_CONTENT_ALIGNMENT, and BLOCKED. EXECUTE is rejected. Explicit approval remains separate from RECOMMEND and EXECUTE.
- Readiness canonical URL must match draft frontmatter.
- Publication recomputes the review for the exact draft and compares every report field except volatile generated_at and workflow_signature. A re-signed altered report is blocked.
- Draft creation records a verified claim bound to the first validated source so valid lifecycle reports contain complete claim output.

## Exact evidence

- RED: `./.venv/bin/pytest -q tests/test_task5_remaining_findings.py::test_signed_readiness_rejects_forged_nonempty_outputs_and_execute tests/test_task5_remaining_findings.py::test_signed_readiness_rejects_altered_validator_output_even_when_resigned` first failed 2 tests because EXECUTE, canonical mismatch, and altered output were accepted. Exit code 1.
- RED fresh customer-portal typecheck: after clearing `tsconfig.tsbuildinfo`, `npm run typecheck -- --pretty false` reproduced TS2688 errors for `aria-query`, `chai`, `d3-array`, `d3-color`, `d3-ease`, `d3-interpolate`, `d3-path`, `d3-scale`, `d3-shape`, `d3-time`, `d3-timer`, `deep-eql`, `doctrine`, `esrecurse`, `html-minifier-terser`, `istanbul-lib-coverage`, `istanbul-lib-report`, `istanbul-reports`, `jest`, `jsdom`, `json-schema`, `mdx`, `pdfkit`, `pg`, `resolve`, `semver`, `stack-utils`, `tough-cookie`, `trusted-types`, `use-sync-external-store`, `yargs`, `yargs-parser`, and `yauzl`, alongside missing-module errors. The failure was caused by TypeScript's unrestricted automatic ambient `@types` discovery across the customer portal and ancestor `node_modules` trees, made non-reproducible by stale/incomplete install state. Declared customer-portal dependencies and the lockfile were present; no `typeRoots` override or weakened check was required.
- Fix: `customer-portal/tsconfig.json` now explicitly limits automatic ambient types to the declared Node runtime types with `compilerOptions.types: ["node"]`. Referenced framework and test declarations remain resolved explicitly by their source files. This preserves strict checking and prevents unrelated ancestor `@types` packages from becoming implicit inputs.
- GREEN focused: `./.venv/bin/pytest -q tests/test_task5_remaining_findings.py tests/test_content_pipeline_workflow.py tests/test_content_pipeline_validation.py` collected and returned `56 passed`. Exit code 0.
- Fresh install and typecheck: after a clean `npm ci --include=dev` (exit code 0), clearing `tsconfig.tsbuildinfo`, `npm run typecheck -- --pretty false` returned exit code 0 with no diagnostics.
- Direct re-signed publication probe: `test_publish_recomputes_validator_output_after_a_report_is_resigned` returned 1 passed and `VALIDATOR_OUTPUT_NOT_AUTHENTICATED`. Exit code 0.
- Full Python suite: `./.venv/bin/pytest -q` returned `931 passed, 3 warnings`. Exit code 0.
- Syntax and whitespace: `./.venv/bin/python -m py_compile scripts/content_pipeline/_readiness_contract.py scripts/content_pipeline/_validation.py scripts/content_pipeline/create_draft.py scripts/content_pipeline/review_draft.py scripts/content_pipeline/publish_article.py` and `git diff --check` returned exit code 0.
- `npm ci` returned exit code 0. npm reported 23 vulnerabilities, including 9 high, plus deprecation and blocked install-script warnings. No lockfile change was made.
- `npm run check:blog-content` returned 47 passed, exit code 0.
- `npm run typecheck` returned exit code 0.
- `npm run lint` returned exit code 0.
- `npm run build` returned exit code 0. Its prebuild Jest gate returned 38 passed.
- `npm test -- --runInBand` returned 102 suites passed, 840 tests passed, 8 skipped. Exit code 0.
- `npm run test:e2e` returned 54 passed. Exit code 0.

## Lifecycle output

The genuine fixture lifecycle returned exit code 0:

`create v001 -> review actual v001 -> edit immutable v002 -> review actual v002 -> exact approval -> dry-run DRY_RUN with no target mutation -> controlled local PUBLISHED receipt for v002`

The receipt draft hash matched v002. Invalid source records, malformed drafts, missing approval, invalid timestamp, stale hash, incomplete readiness, canonical mismatch, EXECUTE recommendation, altered or re-signed validator output, tampered parent, unsafe slug, and missing or extra requirements and findings remain blocked by focused tests and probes.

## Review package

`.superpowers/sdd/task-5-review-package/`

## Concerns

- npm audit reports 23 vulnerabilities, including 9 high, and existing dependency warnings. Dependency remediation is outside Task 5.
- Full Python tests retain 3 existing runtime/deprecation warnings.
- One intermediate `npm ci` attempt hit `ENOTEMPTY` while another pre-existing repository `npm run ci` process was concurrently mutating `node_modules`; after that process exited, a clean `npm ci --include=dev` completed with exit code 0 and the clean typecheck passed. No dependency or lockfile change was needed.
- Unrelated dirty paths were preserved and not staged.
