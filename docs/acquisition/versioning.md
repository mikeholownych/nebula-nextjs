# Acquisition Learning System: Versioning Architecture & Decision-Rule Registry

**Phase:** Phase 3 (Canonical Data Layer, Database Implementation, Historical Migration, and Integrity Controls)  
**Date:** September 2, 2026  
**Status:** Approved & Implemented Specification  
**Authority:** Technical Architecture & Governance  

---

## 1. Executive Summary

This document formalizes the versioning architecture for the Acquisition Learning System. It implements the required Phase 2 refinements:
1. Moving decision thresholds from application binary constants into an immutable, database-backed **Versioned Decision-Rule Registry** (`decision_rule_sets`).
2. Defining minimum thresholds (e.g. 100 impressions, 28-day window) strictly as **Evidence Eligibility Gates**, rather than mathematical proof of statistical power.

---

## 2. Versioned Decision-Rule Registry (`decision_rule_sets`)

Rather than hardcoding optimization rules, holdout durations, and action thresholds in application code, all decision logic is stored in versioned, immutable database records.

```sql
CREATE TABLE IF NOT EXISTS decision_rule_sets (
    id TEXT PRIMARY KEY,
    version_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    min_holdout_days INTEGER NOT NULL DEFAULT 28,
    min_impression_gate INTEGER NOT NULL DEFAULT 100,
    definition_json JSONB NOT NULL,
    definition_hash VARCHAR(64) NOT NULL UNIQUE,
    effective_from TIMESTAMPTZ NOT NULL,
    effective_until TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_by VARCHAR(100) NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.1 Governance Properties of Rule Sets
- **Immutable Historical Versions:** Modifying a threshold (e.g. changing `min_holdout_days` from 28 to 35) requires creating a new version (`ruleset_2_1_0`). Existing evaluations reference their original `version_code`.
- **Deterministic Hashing:** The `definition_hash` is computed as the SHA-256 of the canonical JSON structure.
- **Reproducibility:** Any historical recommendation can be re-evaluated against the exact rules in effect at that date.

---

## 3. Evidence Eligibility Gates vs Statistical Power

### 3.1 Conceptual Clarification

| Concept | Formal Definition & Operational Meaning | Application in Acquisition Engine |
| :--- | :--- | :--- |
| **Evidence Eligibility Gate** | A mandatory heuristic prerequisite (e.g. $\ge 28\text{ days}$ holdout, $\ge 100\text{ impressions}$) required before an entity is eligible to be evaluated for automated recommendations or change proposals. | Prevents reacting to immediate post-deploy indexing turbulence or extreme low-volume noise. |
| **Statistical Power** | The mathematical probability ($1 - \beta$) of detecting a true effect of a given magnitude at a specified significance level ($\alpha = 0.05$), given sample variance and sample size. | Evaluated dynamically based on observed baseline variance and delta magnitudes. |

Passing an evidence eligibility gate means data is *eligible for consideration*, not that the observed delta is guaranteed to be statistically significant.

---

## 4. Measurement Definition Versioning (`measurement_versions`)

Every acquisition measurement links directly to an immutable record in `measurement_versions`:

```json
{
  "version_code": "2.0.0",
  "metric_definition_version": "2.0.0",
  "cohort_definition_version": "2.0.0",
  "page_classification_version": "2.0.0",
  "attribution_model_version": "last_non_direct_v1",
  "bot_filtering_version": "1.0.0",
  "internal_traffic_filter_version": "1.0.0",
  "measurement_code_commit": "8e59bf3d0d6f8e13e83f8e84a1e12e9eefc60360",
  "definition_hash": "b2f6..."
}
```

When calculation methods, cohort mappings, or filter algorithms change:
1. A new version record is inserted with `status = 'ACTIVE'`.
2. Prior version records are set to `status = 'SUPERSEDED'`.
3. All historical measurements remain bound to their original version hash.
