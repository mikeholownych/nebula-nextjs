# Acquisition Experiment Operations & CLI Manual

**Phase:** Phase 5 (Experiment Operations)  
**Status:** Operational  

---

## 1. End-to-End Experiment Lifecycle

```text
1. OBSERVATION        -> Review baseline / weekly reports (scripts/acquisition_cli.py run)
2. PROPOSAL           -> Draft change & hypothesis
3. CHANGE REGISTER    -> scripts/acquisition_cli.py change-register
4. EXP CREATE         -> scripts/acquisition_cli.py exp-create (Immutable Hypothesis)
5. APPROVAL           -> scripts/acquisition_cli.py exp-approve (Human / Authorized Review)
6. DEPLOYMENT         -> Production code rollout + scripts/acquisition_cli.py exp-activate
7. HOLDOUT            -> Protected observation window (28+ days)
8. ELIGIBILITY CHECK  -> scripts/acquisition_cli.py exp-check
9. EVALUATION         -> scripts/acquisition_cli.py exp-eval
10. AUDIT REPORT      -> scripts/acquisition_cli.py exp-report
```

---

## 2. Command Reference

### 2.1 Experiment Creation & Approval
```bash
# 1. Create an experiment tied to a change and baseline measurement
uv run python scripts/acquisition_cli.py exp-create \
  --exp-id exp_20260902_teardowns_internal_links \
  --change-id chg_20260902_teardowns_links \
  --hypothesis "Contextual links to /teardowns will increase teardown cohort search impressions by >= 20%." \
  --metric gsc_total_impressions \
  --direction INCREASE \
  --pre-meas-id meas_20260830_canonical_w28 \
  --magnitude 200.0 \
  --holdout-days 28

# 2. Approve the experiment
uv run python scripts/acquisition_cli.py exp-approve \
  --exp-id exp_20260902_teardowns_internal_links \
  --approved-by mike_principal

# 3. Activate holdout upon production deployment
uv run python scripts/acquisition_cli.py exp-activate \
  --exp-id exp_20260902_teardowns_internal_links \
  --holdout-days 28
```

### 2.2 Eligibility & Evaluation
```bash
# Check eligibility status
uv run python scripts/acquisition_cli.py exp-check \
  --exp-id exp_20260902_teardowns_internal_links \
  --post-meas-id meas_20260927_canonical_w28

# Evaluate experiment (Dry Run)
uv run python scripts/acquisition_cli.py exp-eval \
  --exp-id exp_20260902_teardowns_internal_links \
  --post-meas-id meas_20260927_canonical_w28 \
  --dry-run

# Evaluate experiment (Persist in DB)
uv run python scripts/acquisition_cli.py exp-eval \
  --exp-id exp_20260902_teardowns_internal_links \
  --post-meas-id meas_20260927_canonical_w28

# Generate markdown report
uv run python scripts/acquisition_cli.py exp-report \
  --exp-id exp_20260902_teardowns_internal_links \
  --output-path docs/acquisition/experiments/exp_20260902_teardowns_internal_links.md
```
