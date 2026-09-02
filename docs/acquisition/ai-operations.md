# Acquisition AI Operations and Human Decision Workflow

This document details the operational commands, human review protocols, and caching policies for Phase 7 AI interpretation.

---

## 1. Operational CLI Commands

Operators interact with the AI interpretation engine via `scripts/acquisition_cli.py`:

```bash
# 1. Execute an AI analysis run
uv run python scripts/acquisition_cli.py ai-analysis-run \
  --measurement-id meas_20260830_canonical_w28 \
  --analysis-type SITE_SUMMARY

# 2. Execute a cohort-level analysis
uv run python scripts/acquisition_cli.py ai-analysis-run \
  --measurement-id meas_20260830_canonical_w28 \
  --analysis-type COHORT_INTERPRETATION \
  --target-type COHORT \
  --target-id problem_intent

# 3. Inspect AI analysis runs
uv run python scripts/acquisition_cli.py ai-analysis-inspect \
  --measurement-id meas_20260830_canonical_w28

# 4. Record a human decision review
uv run python scripts/acquisition_cli.py ai-analysis-review \
  --run-id airun_site_summary_meas_20260830_canonical_w28_... \
  --status ACCEPTED_AS_ANALYSIS \
  --reviewed-by "mike" \
  --notes "Valid baseline interpretation."

# 5. Generate markdown AI appendices
uv run python scripts/acquisition_cli.py ai-analysis-weekly --measurement-id meas_20260830_canonical_w28 --output-path docs/acquisition/observations/2026-09-02_weekly_decision_review_ai_appendix.md
uv run python scripts/acquisition_cli.py ai-analysis-28d --measurement-id meas_20260830_canonical_w28 --output-path docs/acquisition/observations/2026-09-02_28d_decision_review_ai_appendix.md
uv run python scripts/acquisition_cli.py ai-analysis-84d --measurement-id meas_20260830_canonical_w28 --output-path docs/acquisition/observations/2026-09-02_84d_strategic_review_ai_appendix.md

# 6. Synchronize longitudinal learning store
uv run python scripts/acquisition_cli.py ai-learning-sync
uv run python scripts/acquisition_cli.py ai-learning-list
```

---

## 2. Human Review Protocol

Every AI analysis is initially persisted with `review_status = 'UNREVIEWED'`. Operators review findings and apply one of three dispositions:
- `ACCEPTED_AS_ANALYSIS`: Reviewer confirms the probabilistic reasoning is sound and well-grounded.
- `REJECTED`: Reviewer identifies flawed logic, weak alternative explanations, or invalid assumptions.
- `NEEDS_MORE_EVIDENCE`: Finding is plausible but requires subsequent observation windows.

Human review status is stored in `ai_analysis_results` along with reviewer identity, timestamp, and review notes.

---

## 3. Failure Isolation Guarantee

The Acquisition Learning System enforces strict unidirectional failure isolation:

$$\text{Pipeline / Recommendations / Experiments} \centernot\longleftarrow \text{AI Interpretation Failure}$$

If the AI provider is down, times out, or produces invalid output:
- Daily ingestion succeeds unaffected.
- 28-day window computation succeeds unaffected.
- Deterministic recommendations are generated and persisted unaffected.
- The AI appendix records a `FAILED` or `INVALID_OUTPUT` log for audit.
