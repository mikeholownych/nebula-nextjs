# Acquisition Provenance Isolation and Environment Boundaries

This document defines the strict provenance boundaries and environment isolation guarantees implemented across the Acquisition Learning System in Phase 6B.

---

## 1. Core Problem and Defect Remediation

During Phase 6 testing, automated unit and integration tests created test fixture records (`test_exp_*`, `test_chg_*`) in PostgreSQL with status `HOLDOUT`. Because the recommendation engine queried active experiments without filtering by execution environment, those test fixtures contaminated production recommendation generation, causing production cohorts (`commercial_comparison`, `product_core`) to receive `OBSERVE / ACTIVE_EXPERIMENT` holds.

Phase 6B remedies this state contamination defect comprehensively by:
1. Adding explicit `environment` and `evidence_origin` columns across all acquisition tables.
2. Restricting production recommendation generation and decision reviews strictly to `environment = 'PRODUCTION'`.
3. Isolating test execution fixtures to `environment = 'TEST'` and `evidence_origin = 'TEST'`.
4. Cleansing all historical test and synthetic records without deleting audit history.
5. Guaranteeing that synthetic or simulated changes cannot block or alter live production decisions.

---

## 2. Environment and Evidence-Origin Taxonomies

### Allowed Environments
The system recognizes exactly five mutually exclusive execution environments:

| Environment | Purpose | Production Authority |
|:---|:---|:---|
| `PRODUCTION` | Live production operations and verified canonical customer metrics. | Authoritative |
| `TEST` | Automated test suites (pytest), CI pipelines, and unit fixtures. | Non-authoritative |
| `SIMULATION` | Counterfactual policy evaluation, threshold sensitivity testing. | Non-authoritative |
| `REPLAY` | Historical rerun of recommendation algorithms across past periods. | Non-authoritative |
| `SYNTHETIC` | Generated datasets for stress testing and scale verification. | Non-authoritative |

### Allowed Evidence Origins
Every fact, change, and recommendation explicitly identifies its evidentiary origin:
- `PRODUCTION`: Captured directly from verified live infrastructure (GSC API, GA4 API, local PostgreSQL ledger).
- `SYNTHETIC`: Generated deterministically by mathematical models or test harnesses.
- `REPLAY`: Derived from prior finalized snapshots during algorithmic replay.
- `SIMULATION`: Simulated under synthetic conditions.
- `TEST`: Generated during test suite execution.

---

## 3. Database Schema and Constraints

Alembic migration `0012_acq_provenance_isolation.py` enforces environment isolation at the database level:

```sql
-- acquisition_changes
ALTER TABLE acquisition_changes 
  ADD COLUMN environment VARCHAR(50) NOT NULL DEFAULT 'PRODUCTION',
  ADD COLUMN evidence_origin VARCHAR(50) NOT NULL DEFAULT 'PRODUCTION';
ALTER TABLE acquisition_changes
  ADD CONSTRAINT ck_acq_changes_environment CHECK (environment IN ('PRODUCTION', 'TEST', 'SIMULATION', 'REPLAY', 'SYNTHETIC')),
  ADD CONSTRAINT ck_acq_changes_evidence_origin CHECK (evidence_origin IN ('PRODUCTION', 'SYNTHETIC', 'REPLAY', 'SIMULATION', 'TEST'));

-- acquisition_experiments
ALTER TABLE acquisition_experiments 
  ADD COLUMN environment VARCHAR(50) NOT NULL DEFAULT 'PRODUCTION',
  ADD COLUMN evidence_origin VARCHAR(50) NOT NULL DEFAULT 'PRODUCTION';
ALTER TABLE acquisition_experiments
  ADD CONSTRAINT ck_acq_experiments_environment CHECK (environment IN ('PRODUCTION', 'TEST', 'SIMULATION', 'REPLAY', 'SYNTHETIC')),
  ADD CONSTRAINT ck_acq_experiments_evidence_origin CHECK (evidence_origin IN ('PRODUCTION', 'SYNTHETIC', 'REPLAY', 'SIMULATION', 'TEST'));

-- acquisition_recommendations
ALTER TABLE acquisition_recommendations 
  ADD COLUMN environment VARCHAR(50) NOT NULL DEFAULT 'PRODUCTION',
  ADD COLUMN evidence_origin VARCHAR(50) NOT NULL DEFAULT 'PRODUCTION',
  ADD COLUMN generation_mode VARCHAR(50) NOT NULL DEFAULT 'PRODUCTION',
  ADD COLUMN measurement_code_commit VARCHAR(100);
```

---

## 4. Query Boundary Enforcement

### Active Experiment Holdout Guard
When checking for active holdouts, the engine enforces strict environment matching:

```python
cur.execute(
    """
    SELECT ae.id, ae.change_id, ae.approval_status, ae.do_not_change_until,
           ac.affected_page_ids, ac.affected_cohorts
    FROM acquisition_experiments ae
    JOIN acquisition_changes ac ON ae.change_id = ac.id
    WHERE ae.environment = %s
      AND ae.approval_status IN ('HOLDOUT', 'RUNNING')
      AND (ae.do_not_change_until IS NULL OR ae.do_not_change_until > now());
    """,
    (environment,),
)
```

In `PRODUCTION` mode, only experiments with `environment = 'PRODUCTION'` can protect pages or cohorts. Test experiments tagged with `environment = 'TEST'` have zero effect on production queries.

### Recommendation Retrieval Guard
All recommendation listing and inspection endpoints require explicit environment parameters (defaulting to `PRODUCTION`).

---

## 5. Report Header Provenance Requirements

Every decision review report generated by the system (Weekly, 28-day, 84-day) must include the following metadata block in its header:

```markdown
**Measurement ID:** `meas_20260830_canonical_w28`  
**Measurement Version:** `2.0.0`  
**Decision Rule Set ID:** `ruleset_2_0_0`  
**Environment:** `PRODUCTION` | **Generation Mode:** `PRODUCTION`  
**Generated At:** 2026-09-02 13:57:24 UTC  
**Code Commit:** `b86a35af263c9b2095b7e23cf8c1765e63020722`  
```

This guarantees complete traceability from report to database record, decision ruleset, and git codebase version.
