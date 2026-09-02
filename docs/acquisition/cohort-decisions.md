# Acquisition Cohort Decision Models & Concentration Governance

## 1. Role of Cohort-Level Evaluation

In programmatic and content-driven acquisition, individual pages often suffer from high statistical variance and low per-page volume. Evaluating pages grouped by route cohort provides structural insight into topical authority and indexing behavior.

Nebula registers 9 canonical page cohorts:
- `product_core`
- `commercial_comparison`
- `problem_intent`
- `individual_teardown`
- `vertical_use_case`
- `category`
- `case_study`
- `resources`
- `teardown_index`

---

## 2. Cohort Decision Heuristics

### 1. Active Experiment Protection
- If any page within a cohort is assigned to a running controlled experiment, the entire cohort candidate evaluates as `OBSERVE` with reason `ACTIVE_EXPERIMENT`.
- Protects holdouts from confounding cross-page adjustments.

### 2. Zero-Presence Cohorts
- If cohort total impressions = 0 across the 28-day window:
  - Recommendation: `OBSERVE`
  - Reason: `INSUFFICIENT_OBSERVATION`
  - Confidence: `LOW`
  - Action: Maintain technical sitemap inclusion; avoid structural churn.

### 3. Persistent Stagnation on Search Pages 2 to 5
- If cohort impressions $\ge 100$ and average position is stalled between 21.0 and 50.0 without progression:
  - Recommendation: `REVIEW_CONTENT_ALIGNMENT`
  - Reason: `PERSISTENT_RANKING_STALL`
  - Confidence: `MEDIUM`
  - Action: Evaluate content depth, structured proof, and internal linking hierarchy across the cohort.

---

## 3. Concentration Risk Governance

When a cohort exhibits strong impression growth, the system measures Gini concentration across cohort members:

- **Concentrated Growth (Single-Page Driver):**
  If top page accounts for $> 80\%$ of cohort search impressions:
  - Decision: Flag concentration risk in decision reviews.
  - Action: Do not generalize single-page success to unrelated sibling pages. Ensure internal links distribute equity to high-intent sibling teardowns.

- **Distributed Growth (Cohort-Wide Authority):**
  If impressions are distributed across $> 50\%$ of cohort URLs:
  - Decision: Validate cohort-level expansion candidate (`EXPAND_ADJACENCY`).
