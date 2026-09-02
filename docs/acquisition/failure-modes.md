# Acquisition Learning System: Operational Failure Modes & Mitigation Matrix

**Phase:** Phase 2 (Architecture, Measurement Model, State Machine, and Decision Semantics)  
**Date:** September 2, 2026  
**Status:** Approved Specification  
**Authority:** Technical Architecture & Governance  

---

## 1. Executive Summary

This document establishes the operational failure response protocols for the Acquisition Learning System. Every potential failure mode is mapped to explicit detection mechanisms, impact assessments, fail-open/fail-closed policies, recovery steps, and audit evidence trails.

---

## 2. Operational Failure Matrix

### 2.1 External API & Service Failures

#### 1. Google Search Console API Unavailable / 503 Outage
- **Detection:** HTTP status != 200 or `googleapiclient.errors.HttpError` thrown during snapshot ingestion.
- **Impact:** GSC daily/weekly search visibility metrics cannot be refreshed.
- **Fail-Safe Behavior:** **Fail-Closed on Ingestion.** Abort the current ingestion run without creating a corrupted `acquisition_measurements` record. Do not overwrite existing baseline data.
- **Recovery:** Exponential backoff with jitter (up to 3 retries over 2 hours). If still failing, alert operator via health log.
- **Audit Evidence:** Error payload and stack trace logged to `logs/acquisition_ingest_errors.log`.

#### 2. GA4 Data API Unavailable / Quota Exhaustion
- **Detection:** Response contains `RESOURCE_EXHAUSTED` or `property_quota.tokens_per_day.remaining == 0`.
- **Impact:** Organic traffic and landing page session metrics cannot be retrieved.
- **Fail-Safe Behavior:** **Fail-Closed on Ingestion.** Create an `acquisition_anomalies` record with status `OPEN` and severity `HIGH`.
- **Recovery:** Pause GA4 ingestion until the next daily quota reset window (00:00 PST / 08:00 UTC). Serve reporting views from the most recent finalized PostgreSQL snapshot.
- **Audit Evidence:** Log quota exhaustion event in `acquisition_source_runs`.

#### 3. PostHog Ingestion Unavailable / Blocked by Ad-Blockers
- **Detection:** Client-side network error on `/ingest/` or server-side flush timeout.
- **Impact:** PostHog real-time dashboards miss client events.
- **Fail-Safe Behavior:** **Fail-Open on Application Traffic; Resilient Ledger.** Customer-facing page loads and audit runs never block or fail due to PostHog. Authoritative funnel events remain safely recorded in PostgreSQL `analytics_event_ledger`.
- **Recovery:** Internal PostgreSQL ledger serves all conversion queries. No data loss occurs for business events.
- **Audit Evidence:** `analytics_event_ledger` row presence verified against PostHog event volume.

#### 4. PostgreSQL Platform Database (`nebula_platform`) Connection Failure
- **Detection:** `pg.Pool` connection timeout or ECONNREFUSED on port 5433.
- **Impact:** Ingestion worker cannot persist snapshots; customer portal cannot write ledger events.
- **Fail-Safe Behavior:** **Fail-Closed with SRE Alert.** Critical system incident.
- **Recovery:** Systemd restarts PostgreSQL service (`systemctl restart postgresql@16-main`).
- **Audit Evidence:** Logged in `journalctl -u postgresql@16-main.service` and `ledgers/sre-incidents.jsonl`.

---

### 2.2 Temporal, Timezone & Data Revision Failures

#### 5. Search Console 3-Day Ingestion Lag Violation
- **Detection:** Ingestion requested with `effective_period_end > (NOW() - INTERVAL '3 days')`.
- **Impact:** Ingesting unfinalized GSC data results in artificial impression drops ($> 50\%$) and incorrect regression alerts.
- **Fail-Safe Behavior:** **Fail-Closed on Validation.** The normalizer rejects requests where the end date violates the 3-day lag rule, raising `UnfinalizedDateWindowError`.
- **Recovery:** Automatically adjust `effective_period_end` to `NOW() - INTERVAL '3 days'`.
- **Audit Evidence:** Logged in `acquisition_measurements.source_finalization_status = 'PROVISIONAL'`.

#### 6. Google Search Analytics Retroactive Data Revisions
- **Detection:** Historical re-fetch for date $T-14$ yields a $> 5\%$ delta compared to previously stored snapshot.
- **Impact:** Slight divergence between initial snapshot and revised Google historical records.
- **Fail-Safe Behavior:** **Versioned Historical Snapshotting.** Never overwrite existing measurement rows. Ingest a new `measurement_version` referencing the same period, marked as `HISTORICAL_RECONCILIATION`.
- **Recovery:** Maintain both initial and reconciled snapshots with explicit lineage.
- **Audit Evidence:** Record revision delta in `acquisition_anomalies`.

#### 7. Timezone Boundary Desynchronization
- **Detection:** Measurement requested without explicit `source_native_timezone` metadata.
- **Impact:** GSC Pacific Time dates misaligned by 7-8 hours against UTC, shifting weekend impressions to weekdays.
- **Fail-Safe Behavior:** **Enforce Strict UTC/PT Conversion.** The ingestion engine mandates explicit Pacific calendar date conversion prior to calling the GSC API.
- **Recovery:** Normalize all stored timestamps and date ranges to UTC while recording `source_native_timezone = 'America/Los_Angeles'`.
- **Audit Evidence:** Fields `source_native_period_start` and `canonical_timezone` recorded on every measurement.

---

### 2.3 Data Integrity, Attribution & Metric Drift Failures

#### 8. `/checkout` Organic Landing Attribution Anomaly
- **Detection:** GA4 reporting indicates organic sessions with `landingPage == '/checkout'`.
- **Impact:** Distorts acquisition top-of-funnel conversion rates if treated as search landing traffic.
- **Fail-Safe Behavior:** **Categorize as `KNOWN_ATTRIBUTION_BEHAVIOR`.** The classifier separates `organic_search_entry_session` from `downstream_organic_attributed_session`.
- **Recovery:** `/checkout` sessions are recorded under `ga4_downstream_checkout_sessions` and excluded from `unique_visible_pages` search-entry models.
- **Audit Evidence:** Logged in `acquisition_anomalies` as status `KNOWN_ATTRIBUTION_BEHAVIOR`.

#### 9. Query Anonymization Discrepancy
- **Detection:** $\sum \text{query\_measurements.impressions} < \text{acquisition\_measurements.gsc_total_impressions}$.
- **Impact:** Potential confusion if an operator expects the sum of query rows to equal site totals.
- **Fail-Safe Behavior:** **Explicit Metric Partitioning.** Store `gsc_aggregate_position` (dimensionless site total) separately from `dimensioned_impression_weighted_position` (row sum).
- **Recovery:** Both metrics are explicitly exposed in database columns and generated reports.
- **Audit Evidence:** `is_anonymized_subset = TRUE` flagged on query measurement sets.

#### 10. Cohort Classification Shadowing / Overlap
- **Detection:** Route matches multiple cohort criteria (e.g. `/teardowns` matching `vertical` and `teardown`).
- **Impact:** Misallocated impressions and distorted cohort aggregation.
- **Fail-Safe Behavior:** **Declarative Registry Precedence.** Substring heuristics are eliminated. Route membership is determined strictly by foreign key lookup in `page_cohort_assignments`.
- **Recovery:** If an unmapped route is detected, it is assigned to `cohort_name = 'other'` and flagged for operator review.
- **Audit Evidence:** Unmapped route logged in `acquisition_anomalies` with severity `LOW`.

#### 11. Route Rename / 404 Orphaned Page
- **Detection:** A URL in `page_registry` returns HTTP 404 during automated sitemap health checks (`check-sitemap-routes.mjs`).
- **Impact:** Loss of accumulated ranking equity, broken user experience, crawl error flags in GSC.
- **Fail-Safe Behavior:** **Mark Retired with 301 Redirect Requirement.** Page record is set to `is_active = FALSE` and `retired_at = NOW()`.
- **Recovery:** Deploy 301 redirect in Next.js `next.config.mjs` and update `sitemap.ts`.
- **Audit Evidence:** State transition logged in `acquisition_state_transitions` with `to_state = 'RETIRED'`.

#### 12. Bot & Synthetic Traffic Contamination
- **Detection:** Sudden spike in landing page views without corresponding GSC impressions, originating from datacenter IP ranges or headless user-agents.
- **Impact:** Artificially inflates landing page session counts and depresses conversion rates.
- **Fail-Safe Behavior:** **Strict Synthetic Header & Consent Gating.** Internal tests require `is_synthetic = TRUE` in payload. Bot traffic without JavaScript execution does not trigger `AnalyticsRuntime.tsx` or ledger recording.
- **Recovery:** Automated queries in `funnel-ledger.ts` filter on `is_synthetic = FALSE AND environment = 'production'`.
- **Audit Evidence:** Filtered counts verified via `queryDataQualitySLOs()`.

#### 13. Overlapping Interventions on Same Page
- **Detection:** Operator attempts to register an experiment on a page with an active, unfinalized experiment in `acquisition_experiments` (`approval_status IN ('APPROVED', 'RUNNING')`).
- **Impact:** Confounding variables make causal evaluation impossible.
- **Fail-Safe Behavior:** **Fail-Closed on Experiment Registration.** Database unique constraint and application validation block duplicate active experiments on the same `page_id`.
- **Recovery:** Operator must wait for the active holdout window to complete or formally mark the prior experiment as `CANCELLED`.
- **Audit Evidence:** Rejection logged with `reason = 'ACTIVE_EXPERIMENT_LOCK'`.
