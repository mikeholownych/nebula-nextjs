# Acquisition Recommendation Engine Specification

## 1. Core Principles & Governance

The Acquisition Recommendation Engine is a deterministic, rule-based inference system designed to surface evidence-grounded hypotheses for human review.

### Mandatory Epistemic Invariants

1. **`RECOMMEND != APPROVE != EXECUTE`**:
   - A recommendation is strictly a candidate hypothesis generated from pre-registered decision rules.
   - A recommendation confers zero authority to alter production code, content, routing, or metadata.
   - Execution requires explicit human review, transition to Phase 5 experiment drafting, formal approval, and holdout enforcement.

2. **Deterministic Reproducibility**:
   - Recommendation generation is a pure deterministic function of canonical measurement facts, pre-registered metric semantics, and active suppression rules.
   - No AI interpretation, non-deterministic heuristic, or arbitrary scoring is permitted.
   - Re-running the engine against identical evidence produces identical recommendation IDs (`rec_{meas_id}_{target_type}_{hash}`).

3. **Primacy of the Status Quo (`NO_CHANGE` Default)**:
   - Intervention carries substantial epistemic risk: unforced copy churn disrupts ongoing search indexing, introduces confounding variables, and invalidates longitudinal holdouts.
   - When evidence is insufficient, uncertain, or positive, the system deterministically defaults to `NO_CHANGE` or `OBSERVE`.

---

## 2. Recommendation Taxonomy

The engine supports 13 canonical recommendation classes:

| Recommendation Class | Primary Target | Objective | Trigger Condition |
|:---|:---|:---|:---|
| `NO_CHANGE` | Sitewide, Cohort, Page | Protect momentum and holdout validity | Positive trajectory, active experiment, or stable performance |
| `OBSERVE` | Sitewide, Cohort, Page | Maintain passive measurement | Newly established presence, unconfirmed baseline, low rank |
| `INVESTIGATE` | System, Source, Metric | Resolve measurement anomaly | Ingestion pipeline failure, blocked status, extreme variance |
| `REVIEW_SERP_PRESENTATION` | Page | Optimize snippet and title hook | Top 10/20 ranking with high impressions and sub-1% CTR |
| `REVIEW_CONTENT_ALIGNMENT` | Cohort, Page | Deepen proof and editorial substance | Persistent impressions with page 2 to 5 ranking stall |
| `REVIEW_QUERY_ALIGNMENT` | Page, Query | Align page content with search intent | Query intent mismatch against registered page purpose |
| `REVIEW_INTERNAL_LINKING` | Cohort, Page | Strengthen indexing connectivity | High-potential page with low relative visibility |
| `REVIEW_TECHNICAL_INDEXABILITY`| Page, Cohort | Fix crawl or rendering barriers | Crawl defects, indexation drop, or render anomalies |
| `REVIEW_CANNIBALIZATION` | Query, Multiple Pages | Disambiguate competing pages | Same query intent split across multiple pages |
| `CONSOLIDATE` | Cohort, Multiple Pages | Merge overlapping thin pages | Multiple underperforming pages with identical intent |
| `RETIRE` | Page | Decommission obsolete content | Persistent zero engagement across multiple 84d cycles |
| `EXPAND_ADJACENCY` | Cohort | Extend proven topic coverage | Cohort with proven top-3 rankings and conversion pull |
| `RUN_CONTROLLED_EXPERIMENT` | Cohort, Page | Formally validate strategic hypothesis| High-confidence opportunity with clean pre-change baseline |

---

## 3. Multi-Gate Evaluation Architecture

The engine evaluates measurement evidence through an ordered sequence of strict validation gates:

```text
CANONICAL MEASUREMENT RECORD
       │
       ▼
[ GATE 1: PIPELINE COMPLETENESS ] ──(BLOCKED / INCOMPLETE)──> EMIT 'INVESTIGATE' (BLOCKED)
       │ (COMPLETE / FINAL)
       ▼
[ GATE 2: ACTIVE HOLDOUT CHECK  ] ──(IN ACTIVE HOLDOUT)───> EMIT 'OBSERVE' (ACTIVE_EXPERIMENT)
       │ (UNLOCKED TARGET)
       ▼
[ GATE 3: SUPPRESSION CHECK     ] ──(ACTIVE SUPPRESSION)──> SUPPRESS CANDIDATE
       │ (NOT SUPPRESSED)
       ▼
[ GATE 4: EVIDENCE SUFFICIENCY  ] ──(IMPRESSIONS < 100)───> EMIT 'OBSERVE' (INSUFFICIENT)
       │ (IMPRESSIONS >= 100)
       ▼
[ GATE 5: SERP EXPOSURE GATE    ] ──(POS > 20 & CLICKS 0)─> EMIT 'OBSERVE' (LOW_EXPOSURE)
       │ (POS <= 20 & CTR < 1%)
       ▼
[ GATE 6: DOMAIN SPECIFIC RULES ] ──> EMIT SPECIFIC RECOMMENDATION ('REVIEW_SERP_PRESENTATION', etc.)
```

## 5. Timing and Action Gates

Timing is part of the recommendation, not an operator preference. The engine must separate urgent operational investigation from slower search decisions.

### Immediate operational gate

Run daily or on alert. Any checkout failure, webhook failure, unlock drop to zero, 5xx spike, or source-ingestion failure emits `INVESTIGATE`. It must not emit a content or competitor action.

### Weekly observation gate

Weekly reviews use the last completed window and respect the GSC finalization lag. A competitor advantage observed once is `OBSERVE`. A competitor advantage must appear in at least two completed snapshots before it can emit a content-alignment review.

### 28-day approval gate

A production SEO change requires a complete 28-day comparison, complete source lineage, no active holdout, no suppression, no unresolved cannibalization, and either at least 100 impressions or a verified indexability defect. The change remains a recommendation until a human review accepts it and creates a controlled experiment draft.

### 84-day lifecycle gate

Retire or consolidate only after three completed 28-day cycles. Expand only when ranking strength and commercial pull are both observed. Rankings, impressions, clicks, replies, and audits remain diagnostic; an attributable purchase is the commercial success signal.

### Canonical action matrix

| Evidence | Timing | Result |
|---|---|---|
| Operational failure | Immediate | `INVESTIGATE` |
| <100 impressions | Weekly | `OBSERVE` |
| Position >20 with zero clicks | Weekly | `OBSERVE` |
| Position 11-20 with sufficient impressions | 28-day | `REVIEW_CONTENT_ALIGNMENT` |
| Position 1-10, CTR <1%, >=100 impressions | 28-day | `REVIEW_SERP_PRESENTATION` |
| Competitor wins once | Weekly | `OBSERVE` |
| Competitor wins twice | 28-day | `REVIEW_CONTENT_ALIGNMENT` or `REVIEW_QUERY_ALIGNMENT` |
| Overlapping Nebula intent | Before any new page | `REVIEW_CANNIBALIZATION` |
| Persistent weak page after 84 days | 84-day | `CONSOLIDATE` or `RETIRE` |

`RECOMMEND != APPROVE != EXECUTE` remains mandatory. A timing gate can delay an action; it cannot authorize a production mutation.

---

## 6. Current Nebula Context & Baseline Behavior

Under current Nebula production facts (Measurement `meas_20260830_canonical_w28`):
- Sitewide Search Presence: Newly established (0 to 1,072 impressions, average position 44.4).
- Cohorts: All cohorts are in initial indexing observation or active experiment holdout.
- Pages: Average ranking positions are > 20 with expected low click rates.
- Result: 100% of generated candidates correctly evaluate as `OBSERVE` (45/45 targets).
- Zero false `REVIEW_SERP_PRESENTATION` or copy rewrite recommendations are generated.
