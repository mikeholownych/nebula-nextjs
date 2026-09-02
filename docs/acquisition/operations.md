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

# 5. Render ACQUISITION_BASELINE.md from PostgreSQL
uv run python scripts/acquisition_cli.py render-baseline

# 6. Render Weekly Observation Report
uv run python scripts/acquisition_cli.py render-weekly meas_20260902_baseline_v2
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

### 4.2 Check Source Execution Latency & Quotas
```sql
SELECT measurement_id, source_system, source_property, response_status,
       status, records_received, execution_duration_ms, requested_at
FROM acquisition_source_runs
ORDER BY requested_at DESC
LIMIT 10;
```

### 4.3 Check Recent Search Visibility State Transitions
```sql
SELECT pr.canonical_url, ast.dimension, ast.from_state, ast.to_state,
       ast.transition_type, ast.transition_reason, ast.occurred_at
FROM acquisition_state_transitions ast
JOIN page_registry pr ON ast.page_id = pr.id
ORDER BY ast.occurred_at DESC
LIMIT 20;
```
