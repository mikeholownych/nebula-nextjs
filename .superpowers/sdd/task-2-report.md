# Task 2 verification report

## Status

Implemented and committed locally. No deployment, publication, push, production modification, payment, lead, or credential actions were performed.

## Commit

- Branch: `feat/project-scoped-google-integrations`
- Commit: `c8c2a9c1aba54b683e9cf79bd6c828df869a201e`
- Message: `feat(content): add provenance and publish-readiness gates`

## Exact files changed by the commit

- `scripts/content_pipeline/validate_claims.py`
- `scripts/content_pipeline/score_opportunities.py`
- `scripts/content_pipeline/publish_readiness.py`
- `tests/test_content_pipeline_validation.py`
- `customer-portal/package.json`
- `docs/content-to-pipeline-operational-guide.md`

The pre-existing unrelated dirty worktree files were not staged or modified by this task.

## Behavior verified

- Fabricated or unproven testimonials return `FABRICATED_TESTIMONIAL` and a nonzero CLI exit.
- Numeric claims require a matching verified `primary` source reference. Unsupported numeric claims return `UNSUPPORTED_NUMERIC_CLAIM` and a nonzero CLI exit.
- Primary-source provenance is accepted and produces `SUPPORTED` claim results.
- Fewer than 100 impressions produce `OBSERVE`.
- One competitor win produces `OBSERVE`.
- Two competitor wins with position 11 to 20 produce `REVIEW_CONTENT_ALIGNMENT`.
- Fewer than 28 days produces `28_DAY_PREREQUISITE` and blocks readiness.
- JSON and Markdown reports use atomic temporary-file replacement with fsync. Analytics data is not written.
- Reports expose `status`, `blocked_reasons`, `claim_results`, `timing_gate`, `canonical_url`, and `source_refs`.
- No Opinly imports were added.

## Commands and outputs

### Required failing test first

Command:

```text
python -m pytest tests/test_content_pipeline_validation.py -q
```

Output:

```text
/home/mike/.hermes/hermes-agent/venv/bin/python: No module named pytest
```

Exit: `1`.

The available project interpreter was then used before implementation. The test collection failed because the planned modules did not yet exist:

```text
/home/mike/nebula/.venv/bin/python -m pytest tests/test_content_pipeline_validation.py -q
```

Output ended with:

```text
collected 0 items / 1 error
ModuleNotFoundError: No module named 'validate_claims'
```

Exit: `1`.

### Focused tests after implementation

Command:

```text
/home/mike/nebula/.venv/bin/python -m pytest tests/test_content_pipeline_validation.py -q
```

Output:

```text
collected 9 items

tests/test_content_pipeline_validation.py .........                      [100%]

9 passed in 0.38s
```

Exit: `0`.

### Python compilation

Command:

```text
python -m py_compile scripts/content_pipeline/validate_claims.py scripts/content_pipeline/score_opportunities.py scripts/content_pipeline/publish_readiness.py
```

Output: none.

Exit: `0`.

### Valid fixture command

Command used temporary JSON fixtures and ran:

```text
python scripts/content_pipeline/publish_readiness.py --article "$TMP/article.json" --sources "$TMP/sources.json" --opportunity "$TMP/opportunity.json" --output "$TMP/valid.json"
```

Output:

```json
{
  "blocked_reasons": [],
  "canonical_url": "https://nebulacomponents.com/blog/x",
  "claim_results": [{"claim": "100 impressions", "status": "SUPPORTED"}],
  "recommendation": "REVIEW_CONTENT_ALIGNMENT",
  "status": "PASS",
  "timing_gate": "PASS"
}
```

Exit: `0`. Both `valid.json` and `valid.md` existed after the command.

### Invalid fixture command

Command used a temporary fabricated testimonial fixture and ran:

```text
python scripts/content_pipeline/validate_claims.py --article "$TMP/invalid-article.json" --claims "$TMP/sources.json"
```

Output:

```json
{
  "blocked_reasons": ["FABRICATED_TESTIMONIAL"],
  "claim_results": [{"claim": "Made up.", "reason": "FABRICATED_TESTIMONIAL", "status": "BLOCKED"}],
  "status": "BLOCKED"
}
```

Exit: `1`.

### Package smoke command

Command:

```text
(cd customer-portal && npm run check:blog-content)
```

Output: all three CLI help screens printed successfully.

Exit: `0`.

### Diff hygiene

Command:

```text
git diff --check
```

Output: none.

Exit: `0`.

## Concerns

- The package script is a help/smoke check because article and source fixture paths are intentionally caller-provided. Full behavior is covered by the focused Python tests and fixture commands above.
- The worktree still contains unrelated pre-existing dirty files listed before implementation. They were preserved and excluded from the commit.

## Final Task 2 review closure

- Commit: `4a9e0b13385d84c65cd1685fe44c50d5a8294fa3` (`fix(content): close remaining task 2 review gates`)
- Focused tests: `.venv/bin/python -m pytest tests/test_content_pipeline_validation.py -q` -> `23 passed in 0.87s`, exit `0`.
- Package content validation: `(cd customer-portal && npm run check:content-pipeline)` -> `23 passed in 0.87s`, exit `0`.
- Python compilation: `.venv/bin/python -m py_compile scripts/content_pipeline/*.py` -> no output, exit `0`.
- Typecheck: `(cd customer-portal && npm run typecheck)` -> no output, exit `0`.
- Lint: `(cd customer-portal && npm run lint)` -> no output, exit `0`.
- Diff hygiene and em dash scan: `git diff --check` plus changed-file scan -> no output, exit `0`.
- Valid fixture probe: `publish_readiness.py ...` -> `VALID_EXIT=0 JSON=yes MD=yes`.
- Invalid fixture probe: `validate_claims.py ...` with unsourced general claim -> `INVALID_EXIT=1`.
- Mid-publish injected failure test: rollback preserved the original JSON and Markdown bytes.

## Concerns

- The JSON and Markdown pair still requires two filesystem renames because the public interface is two paths. Both files are fully staged and fsynced before replacement; any replacement failure atomically restores each prior file through temporary files and fsyncs the directory.
- Unrelated pre-existing worktree changes remain untouched and are excluded from the commit.
- No deployment, production publication, external service, analytics mutation, credential, payment, lead, or push action was performed.

## Final control tightening commit

- Commit: `50efced24d503608ad4f45478c744e900786dea7` (`fix(content): require explicit clean 28-day controls`)
- Re-ran focused tests, package content validation, Python compilation, typecheck, lint, and `git diff --check` after this commit. Outputs: `23 passed`, compilation no output, typecheck no output, lint no output, diff check no output. All exits `0`.
- 28-day readiness now requires explicit `active_holdout: false` and `suppressed: false`, in addition to complete lineage and the existing evidence-based cannibalization gate.
- The valid fixture demonstrates the required pass report and repeated-competitor alignment recommendation, while the invalid fixture demonstrates the required nonzero block path. No live or external data was accessed.

## Task 2 review remediation verification

- Commit: `35994129e` (`fix(content): close task 2 provenance gates`)
- Focused test command: `.venv/bin/python -m pytest tests/test_content_pipeline_validation.py -q`
- Focused test output: `collected 16 items`, `16 passed in 1.26s`, exit `0`.
- Compilation command: `.venv/bin/python -m py_compile scripts/content_pipeline/*.py`; no output, exit `0`.
- Diff hygiene command: `git diff --check`; no output, exit `0`.
- Valid fixture result: `VALID 0 PASS True True`, proving readiness exit `0` and both JSON and Markdown reports exist.
- Invalid fixture result: `INVALID 1 ['REVIEW_CANNIBALIZATION', 'UNSUPPORTED_NUMERIC_CLAIM']`.
- The pre-implementation review tests were run first and failed with 7 failures and 9 passes, including missing cannibalization, source validation, low exposure, readiness prerequisites, and report-pair API behavior.
- No Opinly imports, deployment, publication, push, production modification, payment, lead, or credential actions were performed.

## Remaining concerns

- The existing unrelated dirty worktree files remain untouched and were not staged.
- Package wiring remains the existing help smoke check. The focused tests and temporary valid and invalid fixture probes exercise the behavior without production side effects.

## Task 2 review closure, source ingestion and report parity

- Commit: `fe6e782b82b7128788a147bbda52587fa33abddc` (`fix(content): close remaining task 2 review gates`).
- Changed files: `scripts/content_pipeline/score_opportunities.py`, `scripts/content_pipeline/publish_readiness.py`, `tests/test_content_pipeline_validation.py`, `customer-portal/package.json`.
- Focused regression command: `.venv/bin/python -m pytest tests/test_content_pipeline_validation.py -q` -> `27 passed in 1.41s`, exit `0`.
- Customer portal package check: `PATH="$PWD/.venv/bin:$PATH" npm --prefix customer-portal run check:content-pipeline` -> `27 passed in 1.34s`, exit `0`.
- Compatibility alias check: `PATH="$PWD/.venv/bin:$PATH" npm --prefix customer-portal run check:blog-content` -> `27 passed in 1.42s`, exit `0`.
- Python compilation: `.venv/bin/python -m py_compile scripts/content_pipeline/*.py` -> no output, exit `0`.
- Package JSON validation: `node -e "JSON.parse(require('fs').readFileSync('customer-portal/package.json')); console.log('package.json valid')"` -> `package.json valid`, exit `0`.
- Typecheck: `npm --prefix customer-portal run typecheck` -> no output, exit `0`.
- Lint: `npm --prefix customer-portal run lint` -> no output, exit `0`.
- Diff hygiene: `git diff --check` -> no output, exit `0`.
- Banned import scan: `search_files` for `Opinly|opinly` in changed pipeline and test paths -> `total_count: 0`.
- Valid scorer fixture: exit `0`; recommendation `REVIEW_CONTENT_ALIGNMENT`; reasons `["REPEATED_COMPETITOR_EVIDENCE"]`.
- Invalid scorer fixture: exit `1`; recommendation `BLOCKED`; reasons `SOURCE_ERROR_KEYWORD_REGISTRY`, `SOURCE_ERROR_KEYWORD_REGISTRY_SCHEMA`, `SOURCE_ERROR_AUDIT_FINDINGS`, `SOURCE_ERROR_AUDIT_FINDINGS_SCHEMA`, `SOURCE_ERROR_FIRST_PARTY_EXPORTS`, `SOURCE_ERROR_FIRST_PARTY_EXPORTS_SCHEMA`, `SOURCE_ERROR_COMPETITOR_SERP_REPORTS`, `SOURCE_ERROR_COMPETITOR_SERP_REPORTS_SCHEMA`.
- Regression coverage now verifies non-empty malformed source containers fail closed on IDs, HTTP(S) URLs, explicit provenance, verified status, evidence objects, and required query fields; explicit verified 28-day `indexable` and `unresolved_cannibalization`; JSON and Markdown field parity with claim and provenance detail; unsourced claims; typed provenance; evidence-based intent overlap; clicks-aware `LOW_EXPOSURE`; repeated competitor evidence; and rollback-safe pair publication.
- Pair publication now uses a durable prepared/committed transaction journal, fsynced report files and directory, and recovery of an interrupted prepared transaction before the next publication.
- No deployment, production modification, publication, push, analytics mutation, payment, lead, credential, or external service action was performed.

## Remaining concerns

- Unrelated pre-existing dirty worktree changes remain untouched and were excluded from commit `fe6e782b82b7128788a147bbda52587fa33abddc`.
- No live production verification was performed because the task explicitly prohibited deployment and production side effects.

## Package validation environment remediation

### Initial clean failure

Command:

```text
env -i HOME=/home/mike PATH=/home/mike/.local/bin:/usr/bin:/bin /home/mike/.local/bin/npm --prefix customer-portal run ci
```

Output:

```text
npm notice run nebula-customer-portal@2.0.0 ci
npm notice run npm run typecheck && npm run lint && npm run check:content && npm run check:content-pipeline && npm run check:brand && npm run check:analytics-governance && npm run check:signal-canon && npm run check:claims && npm run check:opportunity-governance && npm run check:evidence-atoms && npm run check:public-proof && npm run check:citable-projection && npm run check:intelligence-stack && npm run build && npm run test && npm run test:e2e
npm notice run nebula-customer-portal@2.0.0 typecheck
npm notice run tsc --noEmit
npm notice run nebula-customer-portal@2.0.0 lint
npm notice run eslint .
npm notice run nebula-customer-portal@2.0.0 check:content
npm notice run node scripts/check-banned-strings.mjs
Content guard passed: scanned stories and generated Storybook shell output
npm notice run nebula-customer-portal@2.0.0 check:content-pipeline
npm notice run python -m pytest ../tests/test_content_pipeline_validation.py -q
sh: 1: python: not found
```

Exit: `127`.

### Remediation

- `customer-portal/package.json` now invokes `node scripts/run-content-pipeline-validation.mjs` for `check:content-pipeline`.
- The runner directly executes `/home/mike/nebula/.venv/bin/python -m pytest /home/mike/nebula/tests/test_content_pipeline_validation.py -q`, so it does not require a `python` or `pytest` command on `PATH`.
- `customer-portal/docs/content-pipeline-validation.md` documents the root `pyproject.toml` dev environment and `uv sync --dev` setup.
- If `.venv/bin/python` is absent, the runner exits nonzero with an actionable fail-closed message. It never falls back to a help-only check.

### Verification commands and outputs

Focused Task 2 tests:

```text
.venv/bin/python -m pytest tests/test_content_pipeline_validation.py -q
```

Output: `27 passed in 1.31s`; exit `0`.

Clean package validator, using the same package check reached by `npm run ci`:

```text
env -i HOME=/home/mike PATH=/home/mike/.local/bin:/usr/bin:/bin /home/mike/.local/bin/npm --prefix customer-portal run check:content-pipeline
```

Output: `27 passed in 2.20s`; exit `0`. The output shows `node scripts/run-content-pipeline-validation.mjs` and the real pytest collection.

Absent interpreter fail-closed smoke:

```text
PATH=/home/mike/.local/bin:/usr/bin:/bin /home/mike/.local/bin/node customer-portal/scripts/run-content-pipeline-validation.mjs
```

Output: `Content pipeline validation requires /home/mike/nebula/.venv/bin/python. Create the repository environment with \`uv sync --dev\`, then rerun npm run ci.`; runner exit `1`; wrapper command exit `0` after asserting that exit.

Python compilation:

```text
.venv/bin/python -m py_compile scripts/content_pipeline/*.py
```

Output: none; exit `0`.

Package JSON validation:

```text
node -e "JSON.parse(require('fs').readFileSync('customer-portal/package.json')); console.log('package.json valid')"
```

Output: `package.json valid`; exit `0`.

Typecheck and lint:

```text
npm --prefix customer-portal run typecheck
npm --prefix customer-portal run lint
```

Output: no errors; both exit `0`.

CI script resolution smoke:

```text
node -e "const p=require('./customer-portal/package.json'); if (p.scripts.ci.includes('check:content-pipeline') && p.scripts['check:content-pipeline']==='node scripts/run-content-pipeline-validation.mjs') console.log('ci invokes real validator'); else process.exit(1)"
```

Output: `ci invokes real validator`; exit `0`.

Diff checks:

```text
git diff --check
```

Output: none; exit `0`.

Forbidden-content scan found no `Opinly`, `opinly`, or em dash in the task diff.

### Concerns

- This remediation assumes the repository `.venv` is provisioned. Missing provisioning now fails closed with setup instructions rather than silently skipping validation.
- No package-lock update was needed because no npm dependency changed. No external service, deployment, production, payment, lead, credential, or publication action was performed.
- Pre-existing unrelated dirty worktree changes were preserved and excluded from the commit.

### Commit

Commit SHA: `29a2de56a08adc6f4f375c3c5b61ee168cf819f2` (implementation commit).
