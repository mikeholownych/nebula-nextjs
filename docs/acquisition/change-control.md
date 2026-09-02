# Acquisition Change Control & Production Provenance

**Phase:** Phase 5 (Controlled Experiments & Change Provenance)  
**Status:** Authoritative  
**Canonical Storage:** `acquisition_changes` table in PostgreSQL `nebula_platform`  
**Generated Human Artifact:** `CHANGE_LOG.md`  

---

## 1. Core Doctrine

Every material production intervention affecting SEO, route structure, metadata, internal linking, content, or conversion architecture must be canonically registered prior to or upon deployment. 

Unregistered production modifications destroy attribution and invalidate ongoing experiments.

---

## 2. Canonical Change Schema

Records in `acquisition_changes` capture the full lifecycle of an intervention:

- `id`: Text identifier formatted as `chg_YYYYMMDD_HHMMSS` or descriptive slug.
- `change_type`: Vocabulary class (`CONTENT`, `TITLE_META`, `INTERNAL_LINKING`, `STRUCTURED_DATA`, `ROUTE`, `CANONICAL`, `INDEXABILITY`, `NAVIGATION`, `CTA`, `LAYOUT`, `TEARDOWN_CONTENT`, `CASE_STUDY_CONTENT`, `TECHNICAL_SEO`, `EXPERIMENTAL`, `OTHER`).
- `summary`: Concise description of what changed.
- `affected_page_ids`: UUID array linking registered pages in `page_registry`.
- `affected_cohorts`: Cohort names affected (e.g. `teardown_index`, `commercial_comparison`).
- `deployed_commit`: Exact git commit SHA deployed to production.
- `deployed_at`: UTC timestamp of effective production rollout.
- `expected_impact`: Expected direction (`positive`, `neutral`, `investigative`, `defensive`).
- `actor_type`: Actor class (`HUMAN`, `TERMINAL_AGENT`, `AUTOMATION`, `SYSTEM`).
- `execution_status`: Lifecycle status (`PLANNED`, `DEPLOYED`, `ROLLED_BACK`, `CANCELLED`).
- `min_observation_days`: Minimum holdout duration (default: 28 days).
- `evaluation_due_date`: Calendar date when holdout completes.
- `rollback_change_id`: Foreign key link to superseding rollback change if rolled back.
- `rollback_reason`: Text description of why rollback occurred.
- `rollback_at`: UTC timestamp of rollback execution.

---

## 3. Emergency Interventions & Rollback Protocol

Operational stability outranks experimental purity. If a production outage, broken checkout, legal requirement, or security vulnerability occurs during an active experiment:

1. Deploy the remediation immediately.
2. Register the intervention using `rollback_change` or `register_change` with `execution_status = 'DEPLOYED'`.
3. The confounding engine detects the overlapping intervention and marks active affected experiments as `CONFOUNDED`, preserving an accurate evidentiary audit trail without obstructing production operations.

---

## 4. CLI Operations

```bash
# Register a deployed change
uv run python scripts/acquisition_cli.py change-register \
  --change-id chg_20260902_teardowns_links \
  --change-type INTERNAL_LINKING \
  --summary "Added contextual cross-links across /teardowns cohort" \
  --cohorts teardown_index,individual_teardown \
  --commit 040be76a1 \
  --expected positive \
  --actor-type HUMAN

# List registered changes
uv run python scripts/acquisition_cli.py change-list --limit 20

# Rollback a change
uv run python scripts/acquisition_cli.py change-rollback \
  --change-id chg_20260902_teardowns_links \
  --commit abc1234 \
  --reason "Detected negative interaction on mobile viewport"
```
