# Founder Constraint Discovery Cycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create and run Nebula's first evidence-controlled founder research cycle so 10–15 real growth decisions can produce a provisional constraint taxonomy, diagnostic-failure taxonomy, and next-research decision without broadening the live landing-page offer.

**Architecture:** Keep the research system local and file-based. A small standard-library Python module validates de-identified private JSON case records and renders aggregate Markdown; version-controlled operational documents define recruitment, consent, interviewing, coding, and decision gates. Raw notes and case records stay under an ignored private directory, while only templates, code, tests, and an aggregate findings memo are committed.

**Tech Stack:** Python 3 standard library, pytest, JSON, Markdown, Git

## Global Constraints

- The current product remains bounded to observable landing-page conditions, high-confidence page-level findings, one approved repair, production verification, and same-scope re-audit.
- Nebula must not claim that a landing page is always the active growth constraint.
- The current ICP is a recruitment channel, not a validated assumption.
- The first round reconstructs real past decisions and does not pitch a whole-system product.
- Interview-derived taxonomies remain provisional.
- A new diagnostic domain requires a recurring diagnostic failure across multiple founders.
- Private contact details, raw recordings, transcripts, and participant-level records must not be committed.
- Only de-identified aggregate findings may enter the repository unless a participant separately authorizes another use.
- Do not add an audit-flow questionnaire or a new diagnostic domain in this plan.
- The audit research bridge, longitudinal cases, and ICP re-evaluation begin only after the first-cycle findings memo passes its evidence gates.

---

## File Structure

The implementation creates one bounded research package:

- `constraint_research.py` — validates de-identified case records and renders aggregate summaries; it never reads contact data.
- `tests/test_constraint_research.py` — covers record validation, privacy boundaries, aggregation, and Markdown rendering.
- `operations/constraint-research/README.md` — operating sequence, private-data rules, cohort acceptance criteria, and stop conditions.
- `operations/constraint-research/INTERVIEW_PROTOCOL.md` — consent script and non-leading critical-decision interview.
- `operations/constraint-research/CASE_RECORD_TEMPLATE.json` — canonical de-identified record shape copied once per participant.
- `operations/constraint-research/CODEBOOK.md` — two-pass emergent coding method and code promotion rules.
- `operations/constraint-research/FINDINGS_TEMPLATE.md` — required aggregate findings and decision-gate structure.
- `operations/constraint-research/private/` — ignored local working directory for participant records and raw notes; never committed.
- `docs/research/founder-constraint-cycle-01.md` — final aggregate evidence memo created only after 10–15 valid cases exist.
- `.gitignore` — excludes the private research directory.

The audit-flow snapshot and longitudinal-case tooling are intentionally excluded. Their fields depend on the provisional taxonomy produced by this cycle.

---

### Task 1: De-identified Case Record Contract

**Files:**
- Create: `constraint_research.py`
- Create: `tests/test_constraint_research.py`
- Create: `operations/constraint-research/CASE_RECORD_TEMPLATE.json`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `validate_case(record: dict) -> None`
- Produces: `load_cases(directory: Path) -> list[dict]`
- Produces: canonical JSON fields consumed by Tasks 3–5
- Privacy boundary: rejects direct-contact fields and reads only `*.json` records from the ignored private directory

- [ ] **Step 1: Write the failing validation tests**

Create `tests/test_constraint_research.py`:

```python
import json
from pathlib import Path

import pytest

from constraint_research import CaseValidationError, load_cases, validate_case


def valid_case() -> dict:
    return {
        "schema_version": 1,
        "case_id": "fc-001",
        "interviewed_at": "2026-08-01T12:00:00Z",
        "consent": {
            "research_notes": True,
            "anonymous_aggregate": True,
            "recording": False,
        },
        "recruitment_source": "existing-audit-user",
        "business_context": {
            "stage": "early-revenue",
            "growth_motion": "paid-acquisition",
        },
        "decision": {
            "underperforming_outcome": "trial starts",
            "observed_performance": "Paid clicks increased while trial starts stayed flat.",
            "suspected_constraint": "landing-page message",
            "alternatives_considered": ["ad targeting", "offer"],
            "evidence_used": ["ad click-through rate", "trial-start count"],
            "evidence_available_not_used": ["visitor recordings"],
            "action_taken": "rewrote the hero",
            "why_this_action_won": "It was the fastest element to change.",
            "time_committed": "2 days",
            "money_committed": "USD 0 internal time only",
            "measured_result": "No material change after 14 days.",
            "diagnosis_changed": True,
            "revised_diagnosis": "offer",
            "revision_trigger": "Sales calls repeatedly raised pricing confusion.",
            "confidence_before": 4,
            "confidence_after": 2,
        },
        "coding": {
            "constraint_codes": [],
            "failure_mode_codes": [],
            "evidence_gap_codes": [],
            "coder_notes": "",
        },
        "source_references": ["private-note:fc-001"],
    }


def test_validate_case_accepts_complete_deidentified_record():
    validate_case(valid_case())


@pytest.mark.parametrize("forbidden", ["name", "email", "phone", "company_name"])
def test_validate_case_rejects_direct_identifiers_anywhere(forbidden):
    record = valid_case()
    record["business_context"][forbidden] = "private"

    with pytest.raises(CaseValidationError, match="direct identifier"):
        validate_case(record)


def test_validate_case_requires_real_decision_evidence():
    record = valid_case()
    record["decision"]["evidence_used"] = []

    with pytest.raises(CaseValidationError, match="evidence_used"):
        validate_case(record)


def test_validate_case_restricts_confidence_to_five_point_scale():
    record = valid_case()
    record["decision"]["confidence_before"] = 6

    with pytest.raises(CaseValidationError, match="confidence_before"):
        validate_case(record)


def test_load_cases_rejects_duplicate_case_ids(tmp_path: Path):
    record = valid_case()
    (tmp_path / "one.json").write_text(json.dumps(record), encoding="utf-8")
    (tmp_path / "two.json").write_text(json.dumps(record), encoding="utf-8")

    with pytest.raises(CaseValidationError, match="duplicate case_id"):
        load_cases(tmp_path)
```

- [ ] **Step 2: Run the tests and confirm the module is missing**

Run:

```bash
pytest -q tests/test_constraint_research.py
```

Expected: collection fails with `ModuleNotFoundError: No module named 'constraint_research'`.

- [ ] **Step 3: Implement the record validator and loader**

Create `constraint_research.py`:

```python
"""Validation and aggregate reporting for Nebula founder-constraint research."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


CASE_ID = re.compile(r"^fc-\d{3}$")
ISO_UTC = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")
FORBIDDEN_KEYS = {
    "name",
    "email",
    "phone",
    "company",
    "company_name",
    "linkedin",
    "recording_url",
    "transcript",
    "raw_notes",
}
REQUIRED_DECISION_STRINGS = {
    "underperforming_outcome",
    "observed_performance",
    "suspected_constraint",
    "action_taken",
    "why_this_action_won",
    "time_committed",
    "money_committed",
    "measured_result",
}
REQUIRED_DECISION_LISTS = {
    "alternatives_considered",
    "evidence_used",
    "evidence_available_not_used",
}
REQUIRED_CODE_LISTS = {
    "constraint_codes",
    "failure_mode_codes",
    "evidence_gap_codes",
}


class CaseValidationError(ValueError):
    """Raised when a research case violates the evidence or privacy contract."""


def _walk_keys(value: Any):
    if isinstance(value, dict):
        for key, child in value.items():
            yield key
            yield from _walk_keys(child)
    elif isinstance(value, list):
        for child in value:
            yield from _walk_keys(child)


def _require_nonempty_string(container: dict, key: str, path: str) -> None:
    if not isinstance(container.get(key), str) or not container[key].strip():
        raise CaseValidationError(f"{path}.{key} must be a non-empty string")


def _require_string_list(container: dict, key: str, path: str) -> None:
    value = container.get(key)
    if not isinstance(value, list) or not value or not all(
        isinstance(item, str) and item.strip() for item in value
    ):
        raise CaseValidationError(f"{path}.{key} must be a non-empty string list")


def validate_case(record: dict) -> None:
    if not isinstance(record, dict):
        raise CaseValidationError("case record must be a JSON object")

    forbidden = sorted(set(_walk_keys(record)) & FORBIDDEN_KEYS)
    if forbidden:
        raise CaseValidationError(
            f"direct identifier fields are prohibited: {', '.join(forbidden)}"
        )

    if record.get("schema_version") != 1:
        raise CaseValidationError("schema_version must equal 1")
    if not CASE_ID.fullmatch(str(record.get("case_id", ""))):
        raise CaseValidationError("case_id must match fc-NNN")
    if not ISO_UTC.fullmatch(str(record.get("interviewed_at", ""))):
        raise CaseValidationError("interviewed_at must be UTC YYYY-MM-DDTHH:MM:SSZ")

    consent = record.get("consent")
    if not isinstance(consent, dict):
        raise CaseValidationError("consent must be an object")
    for key in ("research_notes", "anonymous_aggregate", "recording"):
        if not isinstance(consent.get(key), bool):
            raise CaseValidationError(f"consent.{key} must be boolean")
    if not consent["research_notes"] or not consent["anonymous_aggregate"]:
        raise CaseValidationError(
            "research_notes and anonymous_aggregate consent must both be true"
        )

    _require_nonempty_string(record, "recruitment_source", "record")

    context = record.get("business_context")
    if not isinstance(context, dict):
        raise CaseValidationError("business_context must be an object")
    for key in ("stage", "growth_motion"):
        _require_nonempty_string(context, key, "business_context")

    decision = record.get("decision")
    if not isinstance(decision, dict):
        raise CaseValidationError("decision must be an object")
    for key in REQUIRED_DECISION_STRINGS:
        _require_nonempty_string(decision, key, "decision")
    for key in REQUIRED_DECISION_LISTS:
        _require_string_list(decision, key, "decision")
    if not isinstance(decision.get("diagnosis_changed"), bool):
        raise CaseValidationError("decision.diagnosis_changed must be boolean")
    for key in ("revised_diagnosis", "revision_trigger"):
        value = decision.get(key)
        if value is not None and not isinstance(value, str):
            raise CaseValidationError(f"decision.{key} must be a string or null")
    if decision["diagnosis_changed"] and not all(
        isinstance(decision.get(key), str) and decision[key].strip()
        for key in ("revised_diagnosis", "revision_trigger")
    ):
        raise CaseValidationError(
            "changed diagnoses require revised_diagnosis and revision_trigger"
        )
    for key in ("confidence_before", "confidence_after"):
        if decision.get(key) not in {1, 2, 3, 4, 5}:
            raise CaseValidationError(f"decision.{key} must be an integer from 1 to 5")

    coding = record.get("coding")
    if not isinstance(coding, dict):
        raise CaseValidationError("coding must be an object")
    for key in REQUIRED_CODE_LISTS:
        value = coding.get(key)
        if not isinstance(value, list) or not all(
            isinstance(item, str) and item.strip() for item in value
        ):
            raise CaseValidationError(f"coding.{key} must be a string list")
    if not isinstance(coding.get("coder_notes"), str):
        raise CaseValidationError("coding.coder_notes must be a string")

    _require_string_list(record, "source_references", "record")


def load_cases(directory: Path) -> list[dict]:
    records = []
    seen = set()
    for path in sorted(directory.glob("*.json")):
        record = json.loads(path.read_text(encoding="utf-8"))
        validate_case(record)
        case_id = record["case_id"]
        if case_id in seen:
            raise CaseValidationError(f"duplicate case_id: {case_id}")
        seen.add(case_id)
        records.append(record)
    return records
```

- [ ] **Step 4: Add the canonical case template**

Create `operations/constraint-research/CASE_RECORD_TEMPLATE.json`:

```json
{
  "schema_version": 1,
  "case_id": "fc-000",
  "interviewed_at": "2026-08-01T12:00:00Z",
  "consent": {
    "research_notes": true,
    "anonymous_aggregate": true,
    "recording": false
  },
  "recruitment_source": "existing-audit-user",
  "business_context": {
    "stage": "early-revenue",
    "growth_motion": "paid-acquisition"
  },
  "decision": {
    "underperforming_outcome": "trial starts",
    "observed_performance": "Paid clicks increased while trial starts stayed flat.",
    "suspected_constraint": "landing-page message",
    "alternatives_considered": [
      "ad targeting",
      "offer"
    ],
    "evidence_used": [
      "ad click-through rate",
      "trial-start count"
    ],
    "evidence_available_not_used": [
      "visitor recordings"
    ],
    "action_taken": "rewrote the hero",
    "why_this_action_won": "It was the fastest element to change.",
    "time_committed": "2 days",
    "money_committed": "USD 0 internal time only",
    "measured_result": "No material change after 14 days.",
    "diagnosis_changed": true,
    "revised_diagnosis": "offer",
    "revision_trigger": "Sales calls repeatedly raised pricing confusion.",
    "confidence_before": 4,
    "confidence_after": 2
  },
  "coding": {
    "constraint_codes": [],
    "failure_mode_codes": [],
    "evidence_gap_codes": [],
    "coder_notes": ""
  },
  "source_references": [
    "private-note:fc-000"
  ]
}
```

The values are a complete synthetic example. Operators copy the file and replace every example value with participant evidence; `fc-000` is reserved and must never be counted as a participant case.

- [ ] **Step 5: Ignore all private research data**

Append to `.gitignore`:

```gitignore

# Founder constraint research — private participant data
operations/constraint-research/private/
```

Run:

```bash
mkdir -p operations/constraint-research/private
cp operations/constraint-research/CASE_RECORD_TEMPLATE.json operations/constraint-research/private/fc-001.json
git check-ignore operations/constraint-research/private/fc-001.json
```

Expected: prints `operations/constraint-research/private/fc-001.json`.

Delete the copied synthetic private file after the check:

```bash
rm operations/constraint-research/private/fc-001.json
```

- [ ] **Step 6: Run the focused tests**

Run:

```bash
pytest -q tests/test_constraint_research.py
```

Expected: `8 passed`.

- [ ] **Step 7: Commit the record contract**

```bash
git add .gitignore constraint_research.py tests/test_constraint_research.py operations/constraint-research/CASE_RECORD_TEMPLATE.json
git commit -m "feat: add founder constraint research record contract"
```

---

### Task 2: Interview and Research Operations Kit

**Files:**
- Create: `operations/constraint-research/README.md`
- Create: `operations/constraint-research/INTERVIEW_PROTOCOL.md`
- Modify: `tests/test_constraint_research.py`

**Interfaces:**
- Consumes: the case shape enforced by `validate_case`
- Produces: a repeatable 10–15 participant research procedure
- Produces: consent language and the seven approved decision-reconstruction questions

- [ ] **Step 1: Write failing tests for the operating documents**

Append to `tests/test_constraint_research.py`:

```python
def test_interview_protocol_preserves_approved_research_boundary():
    text = Path(
        "operations/constraint-research/INTERVIEW_PROTOCOL.md"
    ).read_text(encoding="utf-8")

    required_prompts = [
        "What outcome was underperforming?",
        "What evidence did you examine?",
        "Which other possible constraints did you consider?",
        "What did you decide to change?",
        "Why did that explanation win?",
        "What happened after the change?",
        "What evidence would cause you to revise the diagnosis?",
    ]
    for prompt in required_prompts:
        assert prompt in text
    assert "Do not pitch" in text
    assert "anonymous aggregate" in text


def test_runbook_uses_current_icp_as_channel_not_assumption():
    text = Path("operations/constraint-research/README.md").read_text(
        encoding="utf-8"
    )

    assert "10–15 valid cases" in text
    assert "recruitment channel, not a validated assumption" in text
    assert "Do not add questions to the live audit flow" in text
    assert "Stop the cycle" in text
```

- [ ] **Step 2: Run the focused tests and confirm both documents are missing**

Run:

```bash
pytest -q tests/test_constraint_research.py -k "protocol or runbook"
```

Expected: two failures with `FileNotFoundError`.

- [ ] **Step 3: Create the interview protocol**

Create `operations/constraint-research/INTERVIEW_PROTOCOL.md`:

```markdown
# Founder Constraint Interview Protocol

## Purpose

Reconstruct one real decision a founder made after a growth outcome
underperformed. Learn how the founder selected an intervention, which evidence
affected the decision, and what later changed the diagnosis.

## Research boundary

- Do not pitch a whole-system Nebula product.
- Do not tell the participant that the landing page was or was not the constraint.
- Do not introduce a constraint taxonomy before the participant describes the case.
- Do not treat hypothetical willingness to pay as product validation.
- Ask about one completed or sufficiently observed decision, not general advice.

## Consent script

“I’m researching how founders decide what to fix when growth underperforms. I’d
like to take notes and use de-identified patterns in an anonymous aggregate
analysis. I will not publish your name, company, contact details, raw transcript,
or individual case. You can skip any question or stop at any time. May I take
research notes and include de-identified patterns in the anonymous aggregate?”

Record `research_notes` and `anonymous_aggregate` as `true` only after an
affirmative response. Ask separately before recording audio. A recording refusal
does not exclude the participant.

## Screening

Ask the participant to identify a decision that meets every condition:

1. A growth outcome visibly underperformed.
2. The founder considered or selected something to change.
3. Enough time passed to observe at least a proximal result.
4. The founder can describe evidence available at the time.

If no decision meets all four conditions, thank the participant and do not create
a case record.

## Decision reconstruction

Use these prompts in order. Ask neutral follow-ups such as “What made that
important?” and “What did you see?” without supplying an explanation.

1. What outcome was underperforming?
2. What evidence did you examine?
3. Which other possible constraints did you consider?
4. What did you decide to change?
5. Why did that explanation win?
6. What happened after the change?
7. What evidence would cause you to revise the diagnosis?

Then capture:

- business stage and growth motion;
- time and money committed;
- evidence that was available but not used;
- confidence before the action on a 1–5 scale;
- confidence after observing the result on a 1–5 scale; and
- the trigger and revised diagnosis when the diagnosis changed.

## Closing

Ask: “Is there anything about how you chose what to fix that I did not ask?”

Do not introduce a product concept. If the participant independently asks whether
Nebula will offer broader diagnosis, answer: “We are researching the problem.
Nebula currently diagnoses and repairs bounded landing-page conditions.”

## After the interview

1. Store raw notes or recordings only under
   `operations/constraint-research/private/`.
2. Copy `CASE_RECORD_TEMPLATE.json` into the private directory.
3. Replace every synthetic value with de-identified participant evidence.
4. Keep uncertainty in `coder_notes`; do not resolve it by guessing.
5. Validate the record before coding.
```

- [ ] **Step 4: Create the operating runbook**

Create `operations/constraint-research/README.md`:

```markdown
# Founder Constraint Discovery Cycle

## Outcome

Produce 10–15 valid cases that explain how founders chose what to fix after a
real growth outcome underperformed. Use the current ICP as a recruitment channel,
not a validated assumption.

## Recruitment

Recruit from both:

- existing audit users; and
- founder conversations outside the audit funnel.

Record the source in `recruitment_source`. Seek variation in business stage and
growth motion, but do not claim a representative market sample.

## Operating sequence

1. Read `INTERVIEW_PROTOCOL.md`.
2. Obtain note and anonymous aggregate consent.
3. Reconstruct one qualifying decision.
4. Create one de-identified JSON case in `private/`.
5. Validate all private records.
6. After the first five valid cases, perform open coding without changing the
   interview prompts.
7. At 10 valid cases, inspect saturation and recruitment balance.
8. Continue to 15 only when a new case adds a constraint, failure mode, or
   materially different decision path.
9. Produce the aggregate findings memo.

## Validation commands

Validate every case:

```bash
python constraint_research.py validate operations/constraint-research/private
```

Render a local aggregate draft:

```bash
python constraint_research.py summarize operations/constraint-research/private \
  --output operations/constraint-research/private/summary.md
```

## Acceptance criteria

- 10–15 valid cases.
- At least three cases recruited outside the audit funnel.
- Every case reconstructs a real observed decision.
- Every case records evidence used and evidence available but ignored.
- Every case records pre/post confidence.
- Direct identifiers and raw transcripts remain uncommitted.
- The findings memo distinguishes observations, interpretations, and unknowns.

## Stop conditions

Stop the cycle and correct the process when:

- consent is missing or ambiguous;
- an interviewer starts teaching or pitching during discovery;
- cases describe opinions rather than real decisions;
- raw participant material appears in Git;
- fewer than three cases come from outside the audit funnel; or
- a provisional code is presented as a validated market fact.

Do not add questions to the live audit flow during this cycle. Do not expand the
public Nebula product promise.
```

- [ ] **Step 5: Run the full focused test file**

Run:

```bash
pytest -q tests/test_constraint_research.py
```

Expected: `10 passed`.

- [ ] **Step 6: Commit the research operations kit**

```bash
git add operations/constraint-research/README.md operations/constraint-research/INTERVIEW_PROTOCOL.md tests/test_constraint_research.py
git commit -m "docs: add founder constraint interview operations"
```

---

### Task 3: Emergent Coding and Aggregate Synthesis

**Files:**
- Create: `operations/constraint-research/CODEBOOK.md`
- Create: `operations/constraint-research/FINDINGS_TEMPLATE.md`
- Modify: `constraint_research.py`
- Modify: `tests/test_constraint_research.py`

**Interfaces:**
- Consumes: valid case records from `load_cases`
- Produces: `summarize_cases(records: list[dict]) -> dict`
- Produces: `render_summary(summary: dict) -> str`
- Produces: CLI commands `validate` and `summarize`
- Produces: an aggregate-only Markdown draft with no participant narratives or source references

- [ ] **Step 1: Write failing aggregation and privacy tests**

Append to `tests/test_constraint_research.py`:

```python
from constraint_research import render_summary, summarize_cases


def test_summary_counts_codes_and_recruitment_without_case_narratives():
    first = valid_case()
    first["coding"]["constraint_codes"] = ["offer"]
    first["coding"]["failure_mode_codes"] = ["ease-of-change"]
    first["coding"]["evidence_gap_codes"] = ["missing-stage-visibility"]
    second = valid_case()
    second["case_id"] = "fc-002"
    second["recruitment_source"] = "founder-interview"
    second["decision"]["diagnosis_changed"] = False
    second["decision"]["revised_diagnosis"] = None
    second["decision"]["revision_trigger"] = None
    second["coding"]["constraint_codes"] = ["acquisition"]
    second["coding"]["failure_mode_codes"] = ["channel-default"]
    second["coding"]["evidence_gap_codes"] = ["missing-stage-visibility"]

    summary = summarize_cases([first, second])

    assert summary["case_count"] == 2
    assert summary["diagnosis_changed_count"] == 1
    assert summary["recruitment_sources"] == {
        "existing-audit-user": 1,
        "founder-interview": 1,
    }
    assert summary["evidence_gap_codes"]["missing-stage-visibility"] == 2
    assert "source_references" not in json.dumps(summary)
    assert first["decision"]["observed_performance"] not in json.dumps(summary)


def test_render_summary_labels_taxonomies_provisional():
    record = valid_case()
    record["coding"]["constraint_codes"] = ["offer"]
    record["coding"]["failure_mode_codes"] = ["ease-of-change"]
    record["coding"]["evidence_gap_codes"] = ["missing-stage-visibility"]

    markdown = render_summary(summarize_cases([record]))

    assert "# Founder Constraint Research — Aggregate Draft" in markdown
    assert "Provisional constraint codes" in markdown
    assert "Provisional diagnostic-failure codes" in markdown
    assert "Do not publish: fewer than 10 valid cases." in markdown
    assert "private-note:fc-001" not in markdown
```

- [ ] **Step 2: Run the two new tests and confirm imports fail**

Run:

```bash
pytest -q tests/test_constraint_research.py -k "summary or render"
```

Expected: collection fails because `summarize_cases` and `render_summary` are not defined.

- [ ] **Step 3: Add aggregation, rendering, and CLI behavior**

Append to `constraint_research.py`:

```python
from argparse import ArgumentParser
from collections import Counter


def summarize_cases(records: list[dict]) -> dict:
    for record in records:
        validate_case(record)

    recruitment = Counter(record["recruitment_source"] for record in records)
    constraints = Counter()
    failure_modes = Counter()
    evidence_gaps = Counter()
    for record in records:
        coding = record["coding"]
        constraints.update(set(coding["constraint_codes"]))
        failure_modes.update(set(coding["failure_mode_codes"]))
        evidence_gaps.update(set(coding["evidence_gap_codes"]))

    return {
        "case_count": len(records),
        "diagnosis_changed_count": sum(
            record["decision"]["diagnosis_changed"] for record in records
        ),
        "recruitment_sources": dict(sorted(recruitment.items())),
        "constraint_codes": dict(sorted(constraints.items())),
        "failure_mode_codes": dict(sorted(failure_modes.items())),
        "evidence_gap_codes": dict(sorted(evidence_gaps.items())),
    }


def _render_counts(counts: dict[str, int]) -> str:
    if not counts:
        return "- No codes assigned."
    return "\n".join(f"- `{name}`: {count}" for name, count in counts.items())


def render_summary(summary: dict) -> str:
    case_count = summary["case_count"]
    changed = summary["diagnosis_changed_count"]
    publication_gate = (
        "Eligible for aggregate review; all evidence gates still require manual review."
        if case_count >= 10
        else "Do not publish: fewer than 10 valid cases."
    )
    return f"""# Founder Constraint Research — Aggregate Draft

## Evidence status

- Valid cases: {case_count}
- Diagnoses revised after action: {changed}
- Publication gate: {publication_gate}

## Recruitment sources

{_render_counts(summary["recruitment_sources"])}

## Provisional constraint codes

{_render_counts(summary["constraint_codes"])}

## Provisional diagnostic-failure codes

{_render_counts(summary["failure_mode_codes"])}

## Provisional evidence-gap codes

{_render_counts(summary["evidence_gap_codes"])}

This aggregate is descriptive. It does not establish prevalence, causation,
market representativeness, or willingness to pay.
"""


def main(argv: list[str] | None = None) -> int:
    parser = ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    validate_parser = subparsers.add_parser("validate")
    validate_parser.add_argument("directory", type=Path)

    summarize_parser = subparsers.add_parser("summarize")
    summarize_parser.add_argument("directory", type=Path)
    summarize_parser.add_argument("--output", type=Path, required=True)

    args = parser.parse_args(argv)
    records = load_cases(args.directory)
    if args.command == "validate":
        print(f"Validated {len(records)} founder constraint case(s).")
        return 0

    output = render_summary(summarize_cases(records))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(output, encoding="utf-8")
    print(f"Wrote aggregate summary for {len(records)} case(s) to {args.output}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 4: Create the emergent coding method**

Create `operations/constraint-research/CODEBOOK.md`:

```markdown
# Constraint Research Codebook

## Principle

Codes describe evidence in this cohort. They are not a universal growth model.
Do not begin with a fixed list of funnel stages or failure modes.

## Pass 1: Open coding

After five valid interviews:

1. Read each de-identified case without comparing it to Nebula's offer.
2. Add short, concrete codes for the suspected constraint, diagnostic failure,
   and missing evidence.
3. Preserve participant language when it is concise.
4. Put alternative interpretations in `coder_notes`.
5. Do not change the interview prompts during the cohort.

## Pass 2: Consolidation

After ten valid interviews:

1. Merge synonyms only when their operational meaning is the same.
2. Keep distinct codes when they imply different evidence or interventions.
3. Record a one-sentence inclusion rule and exclusion rule for every recurring
   code in the findings memo.
4. Report the number of cases carrying each code.
5. Mark a code `recurring` only at three or more cases.
6. Mark a code `candidate-only` when it appears in one or two cases.

## Evidence hierarchy

- **Observation:** What the founder saw, did, spent, or measured.
- **Interpretation:** Why the founder or researcher thinks it happened.
- **Unknown:** What the available evidence cannot distinguish.

Never promote an interpretation to an observation. Never infer causation from a
before/after account.

## Coding unit

The coding unit is one reconstructed decision. A participant discussing two
unrelated decisions requires two interviews and two case records.

## Saturation rule

At ten valid cases, add interviews until either:

- two consecutive cases add no new constraint, failure-mode, or decision-path
  code; or
- the cohort reaches fifteen valid cases.
```

- [ ] **Step 5: Create the findings memo template**

Create `operations/constraint-research/FINDINGS_TEMPLATE.md`:

```markdown
# Founder Constraint Discovery — Cycle 01

## Evidence status

- Interview dates:
- Valid cases:
- Recruitment-source counts:
- Excluded conversations and reasons:
- Saturation result:

## What founders did

Aggregate the decision paths. Separate observations, interpretations, and
unknowns.

## Provisional constraint taxonomy

For each recurring code, include its count, inclusion rule, exclusion rule, and
one de-identified paraphrase. Do not include traceable participant details.

## Provisional diagnostic-failure taxonomy

For each recurring code, include its count, inclusion rule, exclusion rule,
evidence pattern, and plausible alternative interpretation.

## Evidence-use patterns

Describe evidence used, evidence available but ignored, and the conditions that
caused founders to revise a diagnosis.

## Landing-page finding

State whether landing pages in this cohort were diagnosed with evidence, blamed
without discriminating evidence, or both. Do not generalize beyond the cohort.

## Existing-audience comparison

Compare audit-sourced and non-audit-sourced cases descriptively. Do not claim
representativeness or statistical significance.

## Next diagnostic-domain gate

For each adjacent candidate, assess:

1. recurrence across multiple founders;
2. Nebula's ability to observe the relevant system;
3. Nebula's ability to perform or recommend a bounded intervention; and
4. Nebula's ability to verify the result.

Conclude `advance one candidate`, `collect more evidence`, or `do not expand`.

## Audit research bridge decision

List only questions supported by recurring evidence. State whether a separate
design for a lightweight audit snapshot is warranted.

## Longitudinal-case decision

Identify 3–5 suitable case types without naming participants. Define the
observable decision, intervention, measurement window, and consent needed.

## ICP day-2 inputs

Compare observed segments by constraint recurrence, urgency, observability,
intervention ability, outcome verifiability, and evidence of willingness to pay.
Do not declare a new ICP in this memo.

## Limitations

Include recruitment bias, recall bias, small sample size, self-reported outcomes,
missing telemetry, and unresolved alternative explanations.
```

- [ ] **Step 6: Run all focused tests**

Run:

```bash
pytest -q tests/test_constraint_research.py
```

Expected: `12 passed`.

- [ ] **Step 7: Exercise the CLI with synthetic records outside the repository**

Run:

```bash
research_tmp="$(mktemp -d)"
cp operations/constraint-research/CASE_RECORD_TEMPLATE.json "$research_tmp/fc-001.json"
python -c 'from pathlib import Path; p=Path("'"$research_tmp"'/fc-001.json"); s=p.read_text(); p.write_text(s.replace("\"fc-000\"", "\"fc-001\""))'
python constraint_research.py validate "$research_tmp"
python constraint_research.py summarize "$research_tmp" --output "$research_tmp/summary.md"
rg -n "Valid cases: 1|Do not publish: fewer than 10 valid cases" "$research_tmp/summary.md"
```

Expected:

```text
Validated 1 founder constraint case(s).
Wrote aggregate summary for 1 case(s) ...
- Valid cases: 1
- Publication gate: Do not publish: fewer than 10 valid cases.
```

- [ ] **Step 8: Commit the synthesis system**

```bash
git add constraint_research.py tests/test_constraint_research.py operations/constraint-research/CODEBOOK.md operations/constraint-research/FINDINGS_TEMPLATE.md
git commit -m "feat: add founder constraint research synthesis"
```

---

### Task 4: Run the First Interview Cohort

**Files:**
- Create locally, never commit: `operations/constraint-research/private/fc-001.json` through `fc-015.json`
- Create locally, never commit: `operations/constraint-research/private/notes/`
- Modify after each coding pass: private case records only

**Interfaces:**
- Consumes: `INTERVIEW_PROTOCOL.md`, `CASE_RECORD_TEMPLATE.json`, and `CODEBOOK.md`
- Produces: 10–15 valid, de-identified cases
- Produces: an aggregate local draft for Task 5
- External dependency: consenting founders must participate; this task pauses rather than fabricating cases when participants are unavailable

- [ ] **Step 1: Confirm the privacy boundary before recruitment**

Run:

```bash
mkdir -p operations/constraint-research/private/notes
git check-ignore operations/constraint-research/private
git status --short
```

Expected: `git check-ignore` prints the private path and `git status` shows no private research files.

- [ ] **Step 2: Recruit the initial balanced set**

Invite founders until at least ten qualifying interviews are scheduled. Use both
existing audit users and founders outside the audit funnel. Do not promise a
future product, payment, diagnosis, or landing-page result. Track contact details
outside the repository; store only the recruitment-source label in each case.

Acceptance condition: at least three completed valid cases must have
`recruitment_source` other than `existing-audit-user`.

- [ ] **Step 3: Conduct and validate each interview**

For each consenting participant:

1. Follow `INTERVIEW_PROTOCOL.md`.
2. Save raw notes under `private/notes/`.
3. Copy the case template to the next `fc-NNN.json`.
4. Replace every synthetic example with de-identified evidence.
5. Run the validator immediately:

```bash
python constraint_research.py validate operations/constraint-research/private
```

Expected after interview N: `Validated N founder constraint case(s).`

If validation fails, correct the record from the notes. Do not invent missing
evidence; exclude the conversation when the decision cannot meet the record
contract.

- [ ] **Step 4: Perform open coding after five valid cases**

Apply `CODEBOOK.md` Pass 1 to `fc-001` through `fc-005`. Keep all codes
provisional and do not alter the interview questions.

Run:

```bash
python constraint_research.py summarize operations/constraint-research/private \
  --output operations/constraint-research/private/summary-after-05.md
```

Expected: the output reports five valid cases and retains the
`Do not publish` gate.

- [ ] **Step 5: Evaluate saturation and recruitment balance at ten cases**

Run:

```bash
python constraint_research.py validate operations/constraint-research/private
python constraint_research.py summarize operations/constraint-research/private \
  --output operations/constraint-research/private/summary-after-10.md
```

Manually verify:

- at least ten valid cases exist;
- at least three came from outside the audit funnel;
- every case records one real decision and its observed result;
- every case distinguishes evidence used from evidence not used; and
- no committed or staged file contains participant-level data.

Run the privacy check:

```bash
git status --short
git diff --cached --name-only
```

Expected: neither output lists `operations/constraint-research/private/`.

- [ ] **Step 6: Continue only when the saturation rule requires it**

If either of the last two cases added a new constraint, failure mode, or
materially different decision path, continue interviewing up to 15 cases. Stop
earlier when two consecutive cases add no such code. Never exceed 15 within this
cycle.

- [ ] **Step 7: Consolidate codes**

Apply `CODEBOOK.md` Pass 2 across all valid cases. Record recurring codes only
when they appear in at least three cases. Preserve one- and two-case codes as
`candidate-only`.

Render the final local aggregate:

```bash
python constraint_research.py summarize operations/constraint-research/private \
  --output operations/constraint-research/private/final-aggregate.md
```

Expected: valid case count is between 10 and 15 and the publication gate reads
`Eligible for aggregate review`.

Do not commit participant records, raw notes, or the local aggregate.

---

### Task 5: Publish the Aggregate Findings and Open the Next Decision Gate

**Files:**
- Create: `docs/research/founder-constraint-cycle-01.md`
- Reference: `operations/constraint-research/FINDINGS_TEMPLATE.md`
- Reference: `operations/constraint-research/private/final-aggregate.md`
- Reference: `docs/superpowers/specs/2026-07-29-expanded-nebula-hypothesis-design.md`

**Interfaces:**
- Consumes: 10–15 validated and consolidated private cases
- Produces: a de-identified, aggregate findings memo
- Produces: one of three explicit decisions: `advance one candidate`, `collect more evidence`, or `do not expand`
- Produces: input for separate future designs covering the audit snapshot, longitudinal cases, and ICP re-evaluation

- [ ] **Step 1: Copy the findings structure**

```bash
mkdir -p docs/research
cp operations/constraint-research/FINDINGS_TEMPLATE.md docs/research/founder-constraint-cycle-01.md
```

- [ ] **Step 2: Replace every instruction with aggregate evidence**

Complete every section using the validated case counts and de-identified
paraphrases. For every recurring code, include:

- case count;
- inclusion rule;
- exclusion rule;
- whether the pattern appeared in audit-sourced cases, non-audit cases, or both;
- a plausible alternative explanation; and
- the observation/interpretation/unknown boundary.

The memo must not contain participant names, companies, emails, URLs, verbatim
transcripts, raw source references, or claims of prevalence beyond this cohort.

- [ ] **Step 3: Apply the four-part next-domain gate**

For each adjacent diagnostic candidate, explicitly score:

```text
Recurring across multiple founders: yes | no
Observable by Nebula: yes | no | unknown
Bounded intervention available: yes | no | unknown
Result verifiable: yes | no | unknown
```

Only a candidate with four `yes` answers may receive `advance one candidate`.
Any `unknown` requires `collect more evidence`. A `no` requires `do not expand`
for that candidate.

- [ ] **Step 4: Apply the audit-bridge and ICP boundaries**

The memo may recommend a separate audit-snapshot design only when proposed
questions map to recurring evidence. It may list inputs for ICP re-evaluation,
but must not change the ICP or live audit in this task.

- [ ] **Step 5: Scan for privacy leaks, unsupported certainty, and placeholders**

Run:

```bash
rg -n -i 'TBD|TODO|PLACEHOLDER|@|https?://|participant [0-9]|fc-[0-9]{3}|private-note|validated market|proves that|always the constraint' docs/research/founder-constraint-cycle-01.md
```

Expected: no matches. If a necessary public source URL is deliberately added,
review it manually and narrow this check to participant-data patterns before
continuing.

- [ ] **Step 6: Verify the complete research package**

Run:

```bash
pytest -q tests/test_constraint_research.py
python constraint_research.py validate operations/constraint-research/private
git check-ignore operations/constraint-research/private
git diff --check
```

Expected:

- `12 passed`;
- between 10 and 15 cases validated;
- the private directory is ignored; and
- `git diff --check` produces no output.

- [ ] **Step 7: Commit only the aggregate memo**

```bash
git add docs/research/founder-constraint-cycle-01.md
git diff --cached --name-only
git commit -m "docs: publish founder constraint discovery findings"
```

Expected staged file before commit:

```text
docs/research/founder-constraint-cycle-01.md
```

- [ ] **Step 8: Choose the next design cycle**

Use the memo's explicit gate result:

- `advance one candidate` → brainstorm a separate bounded diagnostic-domain design;
- `collect more evidence` → plan the specified longitudinal or structured research;
- `do not expand` → retain the landing-page wedge and document why expansion failed the gate.

If recurring interview evidence supports an audit research bridge, create a
separate design for the lightweight snapshot before touching the live audit
flow. Treat ICP re-evaluation as its own day-2 strategy exercise using the memo's
segment evidence.
