# Acquisition Learning System: Two-Dimensional State Evaluation & Transition Engine

**Phase:** Phase 4 (Automated Ingestion, Route Synchronization, Rolling Windows, State Evaluation, and Trend Computation)  
**Date:** September 2, 2026  
**Status:** Approved & Implemented  
**Execution Script:** `scripts/acquisition/state_engine.py`  
**Database:** `nebula_platform` (PostgreSQL 16 on port 5433)  

---

## 1. Executive Summary

This document specifies the operational state evaluation engine. The engine independently evaluates each canonical page along two orthogonal dimensions: **Search Visibility** and **Product Journey**, persisting verified movements to `acquisition_state_transitions`.

---

## 2. Dimensional State Definitions

### 2.1 Search Visibility Dimension
- `UNSEEN`: Page has 0 recorded impressions in the window.
- `SERP_IMPRESSION`: Page generated $\ge 1$ impression.
- `POS_51_PLUS`: Best rank $\ge 50.5$.
- `TOP_50`: Best rank in $[30.5, 50.4]$.
- `TOP_30`: Best rank in $[20.5, 30.4]$.
- `TOP_20`: Best rank in $[10.5, 20.4]$.
- `TOP_10`: Best rank in $[1.0, 10.4]$.
- `SERP_CLICKED`: Page generated $\ge 1$ search click.

### 2.2 Product Journey Dimension
- `NO_QUALIFIED_SESSION`: 0 sessions recorded.
- `LANDING_VIEWED`: $\ge 1$ landing page view.
- `ENGAGED_CTA`: $\ge 1$ audit CTA click.
- `AUDIT_SUBMITTED`: $\ge 1$ audit URL submitted.
- `AUDIT_STARTED`: $\ge 1$ audit started in engine.
- `AUDIT_COMPLETED`: $\ge 1$ audit completed with grade.
- `RESULT_VIEWED`: $\ge 1$ result viewed.
- `REPAIR_EXPOSED`: $\ge 1$ repair pack offer exposed.
- `CHECKOUT_STARTED`: $\ge 1$ checkout initiated.
- `PURCHASE_COMPLETED`: $\ge 1$ verified payment.

---

## 3. Transition Persistence & Audit Invariants

Every state movement is evaluated against the prior finalized baseline and written to `acquisition_state_transitions`:
- **`PROGRESSION`:** Upward movement in tier (e.g. `TOP_50` to `TOP_30`).
- **`REGRESSION`:** Downward movement in tier (e.g. `TOP_10` to `TOP_20`).
- **`INITIAL`:** First baseline observation.
- **`MAINTAINED`:** Tier preserved.
- **Resilience Invariant:** A transient data drop in unfinalized data does **not** trigger a regression record.
