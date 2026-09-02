# Acquisition Learning System: Route Synchronization & Cohort Assignment

**Phase:** Phase 4 (Automated Ingestion, Route Synchronization, Rolling Windows, State Evaluation, and Trend Computation)  
**Date:** September 2, 2026  
**Status:** Approved & Implemented  
**Execution Script:** `scripts/acquisition/route_sync.py`  
**Database:** `nebula_platform` (PostgreSQL 16 on port 5433)  

---

## 1. Executive Summary

This document specifies the synchronization mechanism that maintains 1:1 alignment between published Next.js routes (`customer-portal/app/sitemap.ts`), the canonical database page registry (`page_registry`), and versioned cohort assignments (`page_cohort_assignments`).

---

## 2. Route Discovery & Normalization

1. **Canonical Domain Enforcement:**  
   Every discovered route is prefixed with the canonical root `https://nebulacomponents.com`. No alternate domains or trailing slashes (except the homepage root `/`) are permitted.
2. **Stable Identity Preservation:**  
   When routes are updated in sitemaps (e.g. priority changes), the page record retains its permanent UUID in `page_registry`.
3. **Soft-Retirement Policy:**  
   If a route is removed from the sitemap, it is never deleted from `page_registry`. Instead, it is marked `is_active = FALSE` with `retired_at = NOW()`, preserving all historical measurements.

---

## 3. Declarative Cohort Resolution & Defect Mitigation

### 3.1 Elimination of Substring Shadowing Bug
In legacy scripts, substring evaluation checked `vertical` before `teardown`, causing teardown URLs (like `/teardowns` or `/teardowns/airtable`) to be incorrectly classified under `vertical_use_case`.

The new synchronizer enforces explicit precedence:
```python
if clean_path.startswith("/teardowns/"):
    return "individual_teardown"
if clean_path == "/teardowns":
    return "teardown_index"
if clean_path.startswith("/vs/") or clean_path.startswith("/compare/"):
    return "commercial_comparison"
if clean_path.startswith("/signals/"):
    return "category"
if clean_path.startswith("/lead-generation-") or clean_path.startswith("/saas-"):
    return "vertical_use_case"
```

### 3.2 Canonical Cohort Inventory

| Cohort Name | Description & Example Routes | Sitemaps Count |
| :--- | :--- | :--- |
| `product_core` | Core commercial surfaces (`/`, `/pricing`, `/audit`). | 3 |
| `category` | High-level signal hubs & broad tools (`/signals`, `/best-landing-page-audit-tools`). | 20 |
| `problem_intent` | Searcher pain queries (`/why-is-my-landing-page-not-converting`). | 8 |
| `vertical_use_case` | Industry specific audits (`/lead-generation-landing-page-audit`, `/saas-...`). | 6 |
| `commercial_comparison` | Direct tool comparisons (`/vs/screaming-frog`, `/compare/unbounce`). | 11 |
| `teardown_index` | Hub page for diagnostic teardowns (`/teardowns`). | 1 |
| `individual_teardown` | In-depth teardown studies (`/teardowns/airtable`, `/teardowns/linear`). | 5 |
| `case_study` | Customer diagnostic results (`/case-studies`). | 1 |
| `resources` | Learning centre, glossary, and playbooks (`/learning-centre`, `/playbooks/...`). | 10 |
| `utility_legal` | Legal and company pages (`/about`, `/privacy-policy`, `/terms`). | 5 |
| `checkout` | Conversion utility surface (`/checkout`). | 1 |
| `other` | Unclassified or newly discovered routes. | Dynamic |
