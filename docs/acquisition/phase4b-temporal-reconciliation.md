# Phase 4B: Acquisition Learning System: Temporal Reconciliation & Audit Report

**Phase:** Phase 4B (Temporal Integrity, Window Semantics, Baseline Comparability, and Trend Revalidation)  
**Date:** September 2, 2026  
**Status:** Approved & Verified  
**Canonical Current Measurement:** `meas_20260830_canonical_w28`  
**Canonical Previous Comparator:** `meas_20260802_canonical_w28`  
**Database:** `nebula_platform` (PostgreSQL 16 on port 5433)  

---

## 1. Executive Summary

During acceptance review of Phase 4, a temporal defect was identified: an observation window covering 26 finalized source dates (2026-08-05 to 2026-08-30) was labeled as a 28-day window (`meas_20260830_w28`) and compared against an overlapping August historical baseline (`meas_20260902_baseline_v2`), falsely deriving an `IMPROVING` longitudinal trend.

Phase 4B establishes strict mathematical window arithmetic, explicit duration semantics, deterministic period overlap detection, comparison typology gates, half-open position bucket intervals, and distinct state initialization semantics.

---

## 2. Root Cause of the 26-Day Window Defect

### 2.1 Arithmetic Cause
When requesting 28 days on execution date $T = \text{2026-09-02}$:
- The legacy date calculation set `start_date = today - timedelta(days=28)` (2026-08-05) and `end_date = today - timedelta(days=3)` (2026-08-30).
- The resulting range spanned $2026\text{-}08\text{-}30 - 2026\text{-}08\text{-}05 + 1 = 26$ inclusive calendar days.
- The model populated `window_days: 28` from requested days rather than effective days, passing the 28-day evidence eligibility gate.

### 2.2 Corrective Invariant
The engine now derives the window endpoint from the latest finalized date ($T - 3$) and computes the start date backwards:
$$\text{effective\_period\_end} = T - 3 = \text{2026-08-30}$$
$$\text{effective\_period\_start} = \text{effective\_period\_end} - (\text{days} - 1) = \text{2026-08-30} - 27 = \text{2026-08-03}$$
$$\text{effective\_window\_days} = (2026\text{-}08\text{-}30 - 2026\text{-}08\text{-}03) + 1 = 28\text{ finalized source dates}$$

---

## 3. Preserving Historical Evidence & Anomaly Tracking

In accordance with the immutable data doctrine, defective measurement `meas_20260830_w28` was not mutated or deleted from PostgreSQL. Instead, it is tracked in `acquisition_anomalies`:

```sql
INSERT INTO acquisition_anomalies (
    id, anomaly_type, description, source_system, severity, status,
    affected_metrics, affected_period_start, affected_period_end, mitigation_notes
) VALUES (
    'anom_20260902_meas_20260830_w28_window_defect',
    'MISALIGNED_WINDOW_DURATION',
    'Measurement meas_20260830_w28 spans 26 finalized source days (2026-08-05 to 2026-08-30) due to lag subtraction defect. Invalid for canonical 28-day longitudinal comparisons. Superseded by meas_20260830_canonical_w28.',
    'acquisition_pipeline',
    'HIGH',
    'ACCEPTED_LIMITATION',
    ARRAY['window_days', 'effective_period_start', 'effective_period_end'],
    '2026-08-05',
    '2026-08-30',
    'Preserved as immutable historical fact. Superseded by meas_20260830_canonical_w28.'
);
```

---

## 4. Reconciliation of Historical Metric Divergences

### 4.1 429 vs 1,063 / 1,072 Impressions
- **Cause:** Google Search Console applies privacy anonymization on rare search queries, omitting long-tail queries from dimensioned `(query, page)` rows while including them in dimensionless sitewide totals.
- The legacy September baseline script computed `total_impressions: 429` by summing dimensioned rows.
- True GSC dimensionless aggregate query across all searches returned 1,072 impressions for the canonical 28-day finalized window.
- **Classification:** `METHODOLOGY_DIFFERENCE` + `SOURCE_REVISION`.

### 4.2 65.6 vs 44.4 Macro Position
- **Cause:** 65.6 in the September baseline was captured in early September with unfinalized tail dates. 44.4 represents the fully finalized dimensionless aggregate position for the canonical window `2026-08-03` to `2026-08-30`.
- **Classification:** `METHODOLOGY_DIFFERENCE` + `WINDOW_DIFFERENCE`.

---

## 5. Comparison Typology & Overlap Detection

The trend engine enforces explicit comparison typology:

| Comparison Class | Overlap | Longitudinal Trend Eligibility | Description |
| :--- | :--- | :--- | :--- |
| `ADJACENT_PERIOD` | **0 Days (0.0%)** | **ELIGIBLE** | Immediately preceding adjacent window (e.g. Jul 6 to Aug 2 vs Aug 3 to Aug 30). |
| `OVERLAPPING_PERIOD` | $> 0$ Days | **BLOCKED** | Rolling windows with shared dates. Classified as `INSUFFICIENT_EVIDENCE`. |
| `SAME_PERIOD_REMEASUREMENT` | 100% Match | **BLOCKED** | Re-measurement of identical historical dates. |
| `METHODOLOGY_RECONCILIATION` | $> 0$ Days / Diff Version | **BLOCKED** | Comparison across differing metric models. |
| `BASELINE_ANCHORED` | Variable | **RESTRICTED** | Anchor comparisons permitted for displacement, blocked for period trends. |
| `NON_COMPARABLE` | Incompatible | **BLOCKED** | Missing or corrupted records. |

---

## 6. State Initialization vs Genuine Transitions

- **Defect in Phase 4:** Pages observed for the first time in `meas_20260830_w28` were evaluated with `from_state = 'UNSEEN'`, generating 33 false `PROGRESSION` records.
- **Phase 4B Correction:** The state engine evaluates newly discovered pages with `transition_type = 'INITIAL'`, recording `from_state = 'INITIAL'` and `to_state = curr_search_state`.
- `UNSEEN` is strictly preserved for pages that were actively registered and tracked in the previous measurement with 0 recorded impressions.

---

## 7. Position Bucket Half-Open Interval Semantics

Position bucket boundaries are formally defined as half-open intervals $[min, max)$:

- `POS_1_10`: $[1.0, 11.0)$ ($1.0 \le \text{position} < 11.0$)
- `POS_11_20`: $[11.0, 21.0)$ ($11.0 \le \text{position} < 21.0$)
- `POS_21_30`: $[21.0, 31.0)$ ($21.0 \le \text{position} < 31.0$)
- `POS_31_50`: $[31.0, 51.0)$ ($31.0 \le \text{position} < 51.0$)
- `POS_51_PLUS`: $[51.0, \infty)$ ($\text{position} \ge 51.0$)

---

## 8. Canonical Measurements & Revalidated Trend

### 8.1 Corrected Canonical Measurements
1. **Current Measurement (`meas_20260830_canonical_w28`):**
   - Window: 2026-08-03 to 2026-08-30 (28 finalized source days)
   - Impressions: 1,072 | Clicks: 3 | Macro Position: 44.4 | Weighted Position: 64.3
   - Pages: 41 | Queries: 90 | Organic Sessions: 16 | Audit Starts: 261
2. **Previous Comparator (`meas_20260802_canonical_w28`):**
   - Window: 2026-07-06 to 2026-08-02 (28 finalized source days)
   - Impressions: 0 | Clicks: 0 | Macro Position: 0.0
   - Unindexed pre-launch period.

### 8.2 Revalidated Comparison Vector & Trend
- **Comparison Class:** `ADJACENT_PERIOD`
- **Overlap:** 0 days (0.0%)
- **Eligible for Longitudinal Trend:** `True`
- **Sitewide Trend Classification:** `VOLATILE`
- **Reason:** Position went from 0.0 to 44.4 as newly indexed search presence established across 41 canonical routes.
- **State Records:** 41 `Initial State Observations`, 0 false progressions.
