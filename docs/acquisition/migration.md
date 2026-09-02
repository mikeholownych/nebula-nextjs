# Acquisition Learning System: Historical Migration & Baseline Reconciliation

**Phase:** Phase 3 (Canonical Data Layer, Database Implementation, Historical Migration, and Integrity Controls)  
**Date:** September 2, 2026  
**Status:** Executed & Verified  
**Migration Revision:** `0009_acquisition_data_layer` (Alembic)  
**Database:** `nebula_platform` (PostgreSQL 16 on port 5433)  

---

## 1. Executive Summary

This document details the migration of the historical September 2026 acquisition baseline into the canonical PostgreSQL database (`nebula_platform`). It establishes a durable, immutable historical baseline while resolving past calculation discrepancies and formalizing the `/checkout` attribution anomaly.

---

## 2. Migration Execution & Applied Revisions

- **Alembic Migration:** `migrations/versions/0009_acquisition_data_layer.py`
- **Down Revision:** `0008_subscription_welcome`
- **Execution Script:** `scripts/migrate_acquisition_baseline.py`
- **Proof Renderer:** `scripts/render_acquisition_baseline.py`

### 2.1 Applied Database Objects
1. `measurement_versions` (1 version registered: `2.0.0`)
2. `decision_rule_sets` (1 version registered: `2.0.0`)
3. `page_registry` (70 canonical routes registered)
4. `page_cohort_assignments` (70 declarative assignments registered)
5. `acquisition_measurements` (1 master measurement: `meas_20260902_baseline_v2`)
6. `acquisition_source_runs` (2 source runs: GSC and GA4)
7. `page_measurements` (8 top page snapshots seeded)
8. `acquisition_anomalies` (1 anomaly: `anom_20260902_checkout_attribution`)

---

## 3. Historical Baseline Reconciliation

| Historical Metric | Imported Value | Metric Classification | Mapping & Reconciliation Notes |
| :--- | :--- | :--- | :--- |
| `gsc_total_impressions` | 429 | `EXACT_MATCH` | Matches GSC aggregate query totals. |
| `gsc_total_clicks` | 0 | `EXACT_MATCH` | Matches GSC aggregate query totals. |
| `gsc_aggregate_position` | 65.6 | `EXACT_MATCH` | Sourced from GSC dimensionless aggregate query across all queries including anonymized searches. (Baseline v1). |
| `dimensioned_impression_weighted_position` | 64.3 | `EXACT_MATCH` | Sourced from impressions-weighted sum over returned visible dimensioned rows. (Baseline v2). |
| `unique_visible_pages` | 41 | `EXACT_MATCH` | Count of unique published URLs with $\ge 1$ impression. |
| `ga4_organic_sessions` | 16 | `EXACT_MATCH` | Total GA4 organic search sessions in observation period. |
| `ga4_search_entry_sessions` | 12 | `SEMANTICALLY_MAPPED` | Sessions that landed on indexable homepage `/`. |
| `ga4_downstream_checkout_sessions` | 4 | `SEMANTICALLY_MAPPED` | Sessions that began on `/checkout`, mapped to `KNOWN_ATTRIBUTION_BEHAVIOR`. |
| Internal Conversions (`audit_started`, `purchases`) | 0 | `EXACT_MATCH` | Sourced from `analytics_event_ledger`. |

---

## 4. `/checkout` Attribution Migration Representation

The `/checkout` GA4 finding from Phase 1 is formalized as an immutable anomaly record:

- **Anomaly ID:** `anom_20260902_checkout_attribution`
- **Anomaly Type:** `CHECKOUT_ATTRIBUTION_RESET`
- **Severity:** `MEDIUM`
- **Status:** `KNOWN_ATTRIBUTION_BEHAVIOR`
- **Formal Statement:**
  > `/checkout` is not receiving measurable organic search-entry traffic according to GSC and is configured as a non-indexable downstream conversion surface. GA4 nonetheless attributes 4 sessions beginning there to organic acquisition due to downstream session/attribution behavior. The exact mechanism of each historical session has not been individually reconstructed.

---

## 5. Idempotency & Repeatability

The migration script `scripts/migrate_acquisition_baseline.py` enforces strict idempotency:
- Checks for the existence of `meas_20260902_baseline_v2` prior to insertion.
- Uses `ON CONFLICT (version_code) DO NOTHING` for versions and rule sets.
- Uses `ON CONFLICT (route_path) DO UPDATE` for the page registry.
- Re-running the script produces `already_migrated: True` with 0 duplicate records created.

---

## 6. Rollback & Recovery Procedures

If a migration rollback is required:

```bash
# Downgrade schema using Alembic
uv run alembic downgrade 0008_subscription_welcome
```

This safely drops all acquisition tables, triggers, and foreign keys without impacting user, membership, or billing data.
