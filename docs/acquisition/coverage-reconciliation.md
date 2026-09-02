# Canonical Page Recommendation Coverage Reconciliation

This document establishes the formal coverage model and invariant guarantees for page-level acquisition evaluation in Phase 6B.

---

## 1. The Coverage Invariant

Every canonical landing page registered in `page_registry` must have an unambiguous, deterministic disposition in every observation window.

The fundamental coverage invariant is:

$$\text{Total Canonical Pages} = \text{Page Recommendation Targets} + \text{Excluded Pages} + \text{Blocked Pages}$$

$$\text{Unaccounted Pages} \equiv 0$$

If any page is neither evaluated into a recommendation target nor accounted for under a valid exclusion code, the reconciliation algorithm raises an error and fails closed.

---

## 2. Page Coverage Taxonomy

The system partitions all registered pages into four exhaustive categories:

| Category | Disposition Code | Criteria |
|:---|:---|:---|
| **Evaluated Page Target** | `PAGE_RECOMMENDATION_GENERATED` | Page was returned by GSC with impressions $> 0$ in the observation window and received a deterministic page-level recommendation. |
| **Cohort Level / Zero Presence** | `EXCLUDED_ZERO_SEARCH_PRESENCE` | Page is indexable and active but received 0 search impressions in the window. Aggregated and evaluated at the cohort level. |
| **Non-Indexable / Retired** | `EXCLUDED_NON_INDEXABLE` | Page has `is_indexable = false`, `is_active = false`, or `retired_at IS NOT NULL`. |
| **Blocked / Pipeline Anomaly** | `BLOCKED` | Page was excluded due to data corruption or pipeline failure. |

---

## 3. Canonical 28-Day Window Reconciliation (`meas_20260830_canonical_w28`)

The authoritative reconciliation for the August 2026 observation period:

| Metric | Count | Percentage |
|:---|:---|:---|
| **Total Canonical Pages in Registry** | **95** | 100.0% |
| **Visible Pages (Impressions > 0)** | **41** | 43.2% |
| **Page Recommendation Targets Evaluated** | **41** | 43.2% |
| **Excluded Pages (Handled at Cohort Level)** | **54** | 56.8% |
| **Non-Indexable / Retired Exclusions** | **0** | 0.0% |
| **Blocked Pages** | **0** | 0.0% |
| **Unaccounted Pages** | **0** | **0.0% (VALID)** |

---

## 4. Total Recommendation Count Breakdown

In the canonical 28-day window `meas_20260830_canonical_w28`:

- **Sitewide Recommendations:** 1 (`OBSERVE / INSUFFICIENT_OBSERVATION` due to newly established search presence)
- **Cohort Recommendations:** 9 (1 per canonical cohort: `problem_intent`, `commercial_comparison`, `product_core`, `resources`, `teardown_index`, `vertical_use_case`, `case_study`, `category`, `individual_teardown`)
- **Page Recommendations:** 41 (1 per visible landing page with impressions $> 0$)
- **Query Recommendations:** 0 (no multi-page queries met the threshold of $\ge 50$ impressions)

$$\text{Total Recommendations} = 1 + 9 + 41 + 0 = 51$$

---

## 5. Verification Commands

Operators can verify the coverage invariant at any time using the CLI:

```bash
uv run python scripts/acquisition_cli.py reconcile-coverage --measurement-id meas_20260830_canonical_w28
```

Expected Output:
```text
=== Reconciling Canonical Page Coverage for `meas_20260830_canonical_w28` ===
Total Canonical Pages: 95
Visible Pages (Impressions > 0): 41
Eligible Pages: 41
Page Recommendation Targets: 41
Excluded Pages: 54
Blocked Pages: 0
Unaccounted Pages: 0
Coverage Invariant Status: VALID (unaccounted == 0)
```
