# Acquisition Longitudinal Learning Store and Experiment Synthesis

This document defines the learning store architecture, evidence state transitions, and cross-cohort boundary rules for Phase 7.

---

## 1. Learning Store Structure

The PostgreSQL table `acquisition_learning_store` aggregates empirical evidence across historical controlled experiments:

```sql
CREATE TABLE acquisition_learning_store (
    id TEXT PRIMARY KEY,
    scope_type VARCHAR(50) NOT NULL,            -- COHORT, SITEWIDE, PAGE_TYPE
    scope_id VARCHAR(100) NOT NULL,             -- e.g. problem_intent, commercial_comparison
    intervention_type VARCHAR(100) NOT NULL,    -- INTERNAL_LINKING, CONTENT, CTA, etc.
    pattern_statement TEXT NOT NULL,
    evidence_state VARCHAR(50) NOT NULL,
    supporting_experiment_ids TEXT[] NOT NULL,
    contradicting_experiment_ids TEXT[] NOT NULL,
    confounded_experiment_ids TEXT[] NOT NULL,
    environment VARCHAR(50) NOT NULL,
    first_observed_at TIMESTAMPTZ NOT NULL,
    last_updated_at TIMESTAMPTZ NOT NULL,
    metadata JSONB NOT NULL
);
```

---

## 2. Deterministic Evidence State Transitions

Learning states are promoted strictly via quantitative counts of clean, non-confounded experiments:

```
[0 Clean Experiments] ─────────► INSUFFICIENT_EVIDENCE
                                        │
                                        ▼ (1 clean trial)
                                ONE_OBSERVATION
                                        │
           ┌────────────────────────────┴────────────────────────────┐
           ▼ (>= 2 trials, mixed)                                     ▼ (>= 2 trials, 0 regressed)
CONFLICTING_EVIDENCE                                           REPEATED_SIGNAL
                                                                     │
                                                                     ▼ (>= 3 trials, multi-cohort)
                                                               SUPPORTED_PATTERN
```

### Transition Gates:
- `INSUFFICIENT_EVIDENCE`: No clean evaluations exist.
- `ONE_OBSERVATION`: Exactly 1 clean trial evaluated (`SUPPORTED` or `NOT_SUPPORTED`).
- `CONFLICTING_EVIDENCE`: At least 1 supported trial and at least 1 unsupported/regressed trial.
- `REPEATED_SIGNAL`: At least 2 clean trials with `SUPPORTED` outcome and 0 regressions.
- `SUPPORTED_PATTERN`: At least 3 clean trials with `SUPPORTED` outcome replicated across multiple cohorts.

---

## 3. Negative Evidence as First-Class Truth

Trials resulting in `REGRESSED` or `NOT_SUPPORTED` outcomes are recorded with equal priority to successful interventions. The learning store preserves the historical record of what failed, preventing operators from repeating ineffective modifications without explicit new hypotheses.

---

## 4. Confounded Experiment Quarantine

Experiments marked `CONFOUNDED` (due to overlapping deployments or structural shifts during holdout) are preserved with full provenance but quarantined:
- They contribute zero weight to `SUPPORTED_PATTERN` promotion.
- They cannot be cited as causal proof for any interventional claim.

---

## 5. Cross-Cohort Transfer Guard

Learnings established in one cohort (e.g. `problem_intent`) do not automatically transfer to distinct intent categories (e.g. `commercial_comparison` or `category`). The system requires cohort-specific empirical validation.
