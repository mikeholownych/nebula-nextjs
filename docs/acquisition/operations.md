# Acquisition Learning System: Operational Guide, Telemetry & Scheduler Setup

**Phase:** Phase 4 (Automated Ingestion, Route Synchronization, Rolling Windows, State Evaluation, and Trend Computation)  
**Date:** September 2, 2026  
**Status:** Approved & Implemented  
**Execution Script:** `scripts/acquisition_cli.py` / `scripts/update_acquisition_baseline.py`  
**Database:** `nebula_platform` (PostgreSQL 16 on port 5433)  

---

## 1. Executive Summary

This document specifies the operational interface, CLI tooling, cron scheduling, and observability queries for the Acquisition Learning System.

---

## 2. CLI Command Reference

All acquisition commands are executed via `/home/mike/.local/bin/uv run --project /home/mike/nebula python scripts/acquisition_cli.py <command>`:

```bash
# 1. Execute live acquisition measurement (28-day finalized window)
uv run python scripts/acquisition_cli.py run --days 28

# 2. Execute dry-run (validates APIs, normalizes, prints results without DB mutation)
uv run python scripts/acquisition_cli.py run --dry-run

# 3. Synchronize canonical route registry from Next.js sitemap
uv run python scripts/acquisition_cli.py sync-routes

# 4. Validate external and internal source connectivity (GSC, GA4, PostgreSQL)
uv run python scripts/acquisition_cli.py validate-sources

# 7. Controlled Experiment Lifecycle (Phase 5)
uv run python scripts/acquisition_cli.py exp-create --exp-id exp_20260902_sample --change-id chg_20260902_001 --hypothesis "Test hypothesis" --metric gsc_total_impressions --direction INCREASE --pre-meas-id meas_20260830_canonical_w28
uv run python scripts/acquisition_cli.py exp-approve --exp-id exp_20260902_sample --approved-by "mike"
uv run python scripts/acquisition_cli.py exp-activate --exp-id exp_20260902_sample --holdout-days 28
uv run python scripts/acquisition_cli.py exp-eval --exp-id exp_20260902_sample --post-meas-id meas_20260930_canonical_w28

# 8. Deterministic Recommendations & Decision Reviews (Phase 6)
uv run python scripts/acquisition_cli.py recommendations-generate --measurement-id meas_20260830_canonical_w28
uv run python scripts/acquisition_cli.py recommendations-list
uv run python scripts/acquisition_cli.py recommendations-review --rec-id <REC_ID> --action ACCEPT --reviewed-by "mike" --notes "Approved for experiment"
uv run python scripts/acquisition_cli.py recommendation-create-experiment-draft --rec-id <REC_ID> --change-id <CHG_ID>
uv run python scripts/acquisition_cli.py decision-review-weekly --measurement-id meas_20260830_canonical_w28
uv run python scripts/acquisition_cli.py decision-review-28d --measurement-id meas_20260830_canonical_w28
uv run python scripts/acquisition_cli.py decision-review-84d --measurement-id meas_20260830_canonical_w28
```

---

## 3. Automated Scheduling Setup (Cron + Flock)

Automated weekly ingestion runs via standard cron with file-locking (`flock`) to prevent overlapping executions:

```cron
# /etc/cron.d/nebula-acquisition or user crontab
# Runs weekly on Sunday at 04:00 UTC (after GSC 3-day data lag finalizes)
0 4 * * 0 /usr/bin/flock -n /tmp/acquisition_ingest.lock /home/mike/.local/bin/uv run --project /home/mike/nebula python /home/mike/nebula/scripts/update_acquisition_baseline.py >> /home/mike/nebula/logs/acquisition_cron.log 2>&1
```

---

## 4. Operational Telemetry Queries

### 4.1 Check Latest Ingestion Status & Completeness
```sql
SELECT id, generated_at, requested_period_start, requested_period_end,
       effective_period_start, effective_period_end, gsc_total_impressions,
       gsc_aggregate_position, ga4_organic_sessions, data_completeness_status,
       source_finalization_status
FROM acquisition_measurements
ORDER BY generated_at DESC
LIMIT 5;
```

### 4.2 Check Active Recommendations & Lifecycle
```sql
SELECT id, target_type, target_cohort, target_page_id, recommendation_class,
       evidence_status, reason_code, confidence, lifecycle_status, created_at
FROM acquisition_recommendations
ORDER BY created_at DESC
LIMIT 20;
```

### 4.3 Check Active Experiment Holdouts & Approvals
```sql
SELECT id, change_id, approval_status, target_metric, expected_direction,
       holdout_period_days, approved_by, activated_at
FROM acquisition_experiments
ORDER BY created_at DESC
LIMIT 10;
```
