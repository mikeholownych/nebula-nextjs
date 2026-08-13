# Paid Traffic Leak Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an internal, immutable Paid Traffic Leak Report artifact that turns campaign-aware audit evidence into one prioritized leak, exact replacement copy, and a measurable experiment brief without sending or publishing anything.

**Architecture:** Add a focused Python module that validates report input, normalizes and hashes the canonical report payload, rejects secrets and raw email addresses, validates the canonical $97 checkout URL, and writes immutable JSON artifacts under `ops/paid-traffic-leak-reports/`. Keep it independent from the public portal and reuse existing audit evidence fields as supplied input rather than changing the audit engine.

**Tech Stack:** Python 3, standard library (`dataclasses`, `datetime`, `hashlib`, `json`, `re`, `urllib.parse`, `pathlib`), pytest/unittest-style repository tests.

## Global Constraints

- This phase is internal only. Do not add a public route, send email, publish content, modify prospects, or initiate checkout.
- The canonical offer is `$97`; use the existing Stripe checkout URL `https://buy.stripe.com/9B63cvc2o7YMcid2Nk43S0j`.
- Report artifacts must not contain API keys, tokens, passwords, connection strings, or raw prospect email addresses.
- Every primary leak must include observable evidence and explicit confidence.
- Each report has exactly one primary leak.
- Dollar scenarios are labeled scenarios and expose inputs; no revenue or conversion result may be presented as proven.
- Reports are immutable. Duplicate report IDs fail closed.
- Completed attributable $97 purchases are the only commercial success criterion.

---

### Task 1: Create the report contract and validation tests

**Blocks:** none (can start immediately)
**Demoable:** Focused tests fail because the report module does not yet exist.

**Files:**
- Create: `tests/test_paid_traffic_leak_report.py`
- Create: `paid_traffic_leak_report.py` in Task 2

**Interfaces:**
- Tests define the public functions `build_report(payload) -> dict` and `write_report(payload, root=Path) -> Path`.

- [ ] **Step 1: Write the failing tests**

Add tests covering these behaviors:

```python
from pathlib import Path
import pytest
from paid_traffic_leak_report import ReportValidationError, build_report, write_report

BASE = {
    "report_id": "ptr-001",
    "created_at": "2026-08-13T12:00:00Z",
    "prospect_id": "lead-001",
    "landing_page_url": "https://example.com/landing",
    "campaign_copy": "Stop wasting paid traffic on a page that does not convert.",
    "conversion_goal": "demo request",
    "audit_id": "audit-001",
    "message_match_finding": "The ad promises a conversion diagnosis, but the page opens with a generic agency headline.",
    "evidence": [{"source": "campaign_copy", "observed": "conversion diagnosis"}, {"source": "page:h1", "observed": "Full-service growth partner"}],
    "priority_leak": "The first viewport does not repeat the paid-traffic problem the visitor clicked to solve.",
    "confidence": "high",
    "replacement_headline": "Find the landing-page leak wasting your paid traffic",
    "replacement_subheadline": "See the specific mismatch and the first fix before you spend more on clicks.",
    "replacement_cta": "Show me the leak",
    "implementation_notes": ["Replace the current hero headline", "Place the diagnosis CTA above the fold"],
    "experiment_brief": {"hypothesis": "Repeating the paid-traffic problem in the hero will increase qualified audit starts.", "primary_metric": "completed audit starts", "traffic_note": "Traffic volume is insufficient for a valid A/B test; run a concierge comparison first.", "stop_rule": "Stop after 10 qualified prospects or one attributable purchase.", "rollback_rule": "Restore the current hero if the revised message creates a qualified-prospect complaint."},
}

def test_build_report_returns_hash_and_canonical_checkout():
    report = build_report(BASE)
    assert report["checkout_url"] == "https://buy.stripe.com/9B63cvc2o7YMcid2Nk43S0j"
    assert len(report["content_hash"]) == 64
    assert report["evidence"] == BASE["evidence"]

def test_build_report_rejects_missing_evidence():
    payload = {**BASE, "evidence": []}
    with pytest.raises(ReportValidationError, match="evidence"):
        build_report(payload)

def test_build_report_rejects_multiple_primary_leaks():
    payload = {**BASE, "priority_leak": ["first leak", "second leak"]}
    with pytest.raises(ReportValidationError, match="one primary leak"):
        build_report(payload)

def test_build_report_rejects_invalid_landing_url():
    payload = {**BASE, "landing_page_url": "not-a-url"}
    with pytest.raises(ReportValidationError, match="landing_page_url"):
        build_report(payload)

def test_build_report_rejects_raw_email_and_secret_material():
    for field, value in [("campaign_copy", "Contact mike@example.com"), ("implementation_notes", ["token=secret-value"]), ("message_match_finding", "sk_live_123456789")]:
        payload = {**BASE, field: value}
        with pytest.raises(ReportValidationError, match="sensitive"):
            build_report(payload)

def test_write_report_rejects_duplicate_report_id(tmp_path):
    write_report(BASE, root=tmp_path)
    with pytest.raises(ReportValidationError, match="already exists"):
        write_report(BASE, root=tmp_path)

def test_report_keeps_insufficient_traffic_guidance():
    report = build_report(BASE)
    assert "insufficient" in report["experiment_brief"]["traffic_note"].lower()
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pytest -q tests/test_paid_traffic_leak_report.py
```

Expected: collection failure because `paid_traffic_leak_report.py` does not exist.

- [ ] **Step 3: Commit the failing contract tests**

```bash
git add tests/test_paid_traffic_leak_report.py
git commit -m "test: define paid traffic leak report contract"
```

---

### Task 2: Implement deterministic validation and immutable artifact writing

**Blocks:** Task 1
**Demoable:** The focused contract suite passes and a report is written as JSON with a stable hash.

**Files:**
- Create: `paid_traffic_leak_report.py`
- Test: `tests/test_paid_traffic_leak_report.py`

**Interfaces:**
- `class ReportValidationError(ValueError)`
- `build_report(payload: Mapping[str, Any]) -> dict`
- `write_report(payload: Mapping[str, Any], root: Path = REPORT_ROOT) -> Path`

- [ ] **Step 1: Implement the minimal module**

Implement:

```python
REPORT_ROOT = Path("ops/paid-traffic-leak-reports")
CHECKOUT_URL = "https://buy.stripe.com/9B63cvc2o7YMcid2Nk43S0j"
REQUIRED_FIELDS = (...)
SENSITIVE_PATTERNS = (...)
```

`build_report` must:

1. Copy only the allowed report fields.
2. Require all required fields.
3. Require an HTTPS landing-page URL with a hostname.
4. Require a non-empty evidence list.
5. Require `priority_leak` to be a non-empty string, not a list.
6. Require confidence in `{"high", "medium", "low"}`.
7. Require a mapping experiment brief with hypothesis, primary metric, traffic note, stop rule, and rollback rule.
8. Recursively scan string values for email addresses, API-key/token/password patterns, connection strings, and Stripe secret keys. Reject matches with `ReportValidationError("sensitive material ...")`.
9. Add the canonical checkout URL.
10. Normalize JSON with sorted keys and compact separators, excluding `content_hash`, then calculate SHA-256 and add `content_hash`.

`write_report` must create the report directory, write with exclusive creation (`open(..., "x")`), and raise `ReportValidationError("report ID already exists")` if the path already exists. It must write a trailing newline and return the absolute artifact path.

- [ ] **Step 2: Run the focused tests**

Run:

```bash
pytest -q tests/test_paid_traffic_leak_report.py
```

Expected: all focused tests pass.

- [ ] **Step 3: Commit the implementation**

```bash
git add paid_traffic_leak_report.py tests/test_paid_traffic_leak_report.py
git commit -m "feat: add immutable paid traffic leak reports"
```

---

### Task 3: Add a safe local operator entrypoint and sample artifact

**Blocks:** Task 2
**Demoable:** An operator can create a local report from a JSON input file without any network or outbound side effect.

**Files:**
- Modify: `paid_traffic_leak_report.py`
- Create: `scripts/create_paid_traffic_leak_report.py`
- Create: `ops/paid-traffic-leak-reports/.gitkeep`
- Test: `tests/test_paid_traffic_leak_report.py`

**Interfaces:**
- CLI: `python scripts/create_paid_traffic_leak_report.py input.json --root <path>`
- CLI prints only the artifact path and content hash.

- [ ] **Step 1: Add a failing CLI test**

Add a test that runs the script with a temporary JSON payload and asserts exit code 0, the returned artifact exists, and stdout contains `content_hash` but does not contain any email or secret input. Add a second test asserting invalid payload exits non-zero and creates no artifact.

- [ ] **Step 2: Run the CLI tests to verify they fail**

```bash
pytest -q tests/test_paid_traffic_leak_report.py -k cli
```

Expected: failure because the CLI script does not exist.

- [ ] **Step 3: Implement the CLI**

Use `argparse`, `json.loads`, `build_report`, and `write_report`. Do not perform HTTP requests, email sends, checkout creation, database writes, or subprocesses. On validation failure, print a concise error to stderr and exit 2.

- [ ] **Step 4: Run focused tests**

```bash
pytest -q tests/test_paid_traffic_leak_report.py
```

Expected: all tests pass.

- [ ] **Step 5: Commit the operator entrypoint**

```bash
git add paid_traffic_leak_report.py scripts/create_paid_traffic_leak_report.py ops/paid-traffic-leak-reports/.gitkeep tests/test_paid_traffic_leak_report.py
git commit -m "feat: add local paid traffic leak report operator flow"
```

---

### Task 4: Run regression verification and inspect side effects

**Blocks:** Task 3
**Demoable:** The new workflow passes its focused and relevant regression tests, and a sample artifact can be independently read back.

**Files:**
- No production file changes expected.

- [ ] **Step 1: Run focused and handoff regression tests**

```bash
pytest -q tests/test_paid_traffic_leak_report.py tests/test_audit_handoff_flow.py
```

Expected: zero failures.

- [ ] **Step 2: Compile the new Python files**

```bash
python3 -m py_compile paid_traffic_leak_report.py scripts/create_paid_traffic_leak_report.py
```

Expected: exit code 0.

- [ ] **Step 3: Create and read back a sample artifact**

Run the CLI against a temporary copy of the contract payload and a temporary root. Verify:

```text
artifact exists
content_hash is 64 hex characters
checkout_url is canonical $97 URL
no email address appears in artifact
no secret-like material appears in artifact
```

- [ ] **Step 4: Inspect git and repository side effects**

```bash
git diff --check
git status --short --untracked-files=all
```

Confirm only intended files are changed and no lead ledgers, credentials, token files, or production databases were mutated.

- [ ] **Step 5: Commit verification notes if needed**

Only commit generated sample artifacts if explicitly required. Do not commit prospect data.
