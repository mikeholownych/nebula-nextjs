# Production Regression Gaps & Root Cause Analysis

This report examines why certain regressions bypassed branch-level tests and details the engineering controls implemented to prevent recurrence.

---

## Analysis of Bypassed Defects

### Gap 1: Test Runner Directory Traversal Hangs
- **Why it was missed**: Local branch testing previously relied on targeted test invocations (`pytest tests/test_specific.py`), avoiding full-suite runs where unpruned `rglob("*")` traversed `.venv` (over 100,000 files).
- **Remediation**: Implemented strict `os.walk` directory pruning in all repository sweep tests (`test_offer_integrity.py`, `test_outbound_single_authority.py`, `test_repository_hygiene.py`). Added pre-commit CI gates executing `uv run pytest` across the complete suite.

### Gap 2: Mock Drift on Asynchronous Background Runner
- **Why it was missed**: When the synchronous `subprocess.run` audit execution was refactored into the asynchronous `platform_api.services.audit_runner` queue, existing unit tests still mocked `subprocess.run`. Because the mock returned success, the test passed even though the production path was no longer being exercised.
- **Remediation**: Replaced artificial subprocess mocks with integration tests asserting against `platform_api.services.audit_engine.score_job` and `finalize_completed_audit`.

### Gap 3: Static Date Decay in Assertion Logic
- **Why it was missed**: Tests written on August 12, 2026, hardcoded `2026-08-12` within a 14-day freshness window. Once 14 days elapsed, the test began failing without any code changes.
- **Remediation**: Enforced dynamic relative timestamps (`datetime.now(timezone.utc) - timedelta(days=N)`) across all time-sensitive assertion tests.

---

## Preventative Quality Gates

1. **`npm run ci`**: Combines 12 deterministic stages (typecheck, lint, 9 governance checks, Turbopack build, Jest, Playwright E2E).
2. **`uv run pytest`**: Enforces 100% passing rate across all 474 backend and script tests.
3. **`check:analytics-governance` & `check:brand`**: Validates event schema and brand projection consistency prior to build.
