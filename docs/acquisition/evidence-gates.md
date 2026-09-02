# Acquisition Evidence Sufficiency Gates & Trigger Rules

## 1. Overview & Epistemic Authority

Evidence sufficiency gates protect the acquisition learning system against premature intervention, false positive optimization signals, and confounding churn.

A recommendation is never emitted simply because an analytical metric is numerically non-zero. Each recommendation class requires strict satisfaction of qualitative and quantitative evidence thresholds.

---

## 2. Universal Evidence Eligibility Gates

Before evaluating specific domain heuristics, every measurement target must pass four universal eligibility checks:

1. **Pipeline Completeness Gate**:
   - Status must be `COMPLETE` and finalization status must be `FINAL`.
   - If status is `BLOCKED`, `PARTIAL`, or `INSUFFICIENT`, the engine halts domain evaluation and emits `INVESTIGATE` with reason `DATA_SOURCE_BLOCKED`.

2. **Active Experiment Holdout Protection Gate**:
   - The target URL or cohort must not be assigned to an active running experiment (`approval_status IN ('HOLDOUT', 'RUNNING')`).
   - If an active holdout exists, the engine emits `OBSERVE` with reason `ACTIVE_EXPERIMENT` and confidence `HIGH`. Modification is strictly prohibited.

3. **Active Suppression Gate**:
   - The target must not have an active suppression rule (`now() < suppressed_until`).
   - Rejections by human reviewers automatically enforce a 90-day suppression window.

4. **Minimum Observation Horizon Gate**:
   - Candidate generation requires at least 28 days of finalized, contiguous observation.
   - Initial search presence establishment requires 28 days of passive baseline stability before structural changes may be proposed.

---

## 3. Specific Recommendation Trigger Gates

### 1. `OBSERVE` (Passive Baseline Observation)
- **Gate 1 (Newly Established Presence):** Previous window impressions = 0 and current window impressions > 0.
  - Reason: `INSUFFICIENT_OBSERVATION`
  - Confidence: `MEDIUM`
- **Gate 2 (Low Ranking Exposure):** Page average position > 20.0 and clicks = 0.
  - Reason: `LOW_RANKING_EXPOSURE`
  - Confidence: `HIGH`
  - Rationale: Clicks are naturally zero on search results pages 3 and beyond. This is standard distribution behavior, not evidence of snippet copy failure.

### 2. `NO_CHANGE` (Protect Valid Trajectory)
- **Gate 1 (Positive Momentum):** Impressions delta is positive and material ($\ge 10\%$), while average position is improving or stable.
  - Reason: `POSITIVE_TRAJECTORY`
  - Confidence: `HIGH`
  - Rationale: Changing copy or structure on a page gaining natural search momentum creates unforced ranking volatility and destroys attribution cleanly.

### 3. `REVIEW_SERP_PRESENTATION` (Snippet & Title Optimization)
- **Gate 1 (Valid Ranking Exposure):** Average position $\le 20.0$ (Page 1 or 2).
- **Gate 2 (Exposure Volume):** Impressions $\ge 100$ in the 28-day window.
- **Gate 3 (Underperforming CTR):** Click-through rate $< 1.0\%$.
- Reason: `CTR_UNDERPERFORMANCE_WITH_VALID_EXPOSURE`
- Confidence: `HIGH`
- Rationale: Only when searchers actually see the snippet in top positions can low CTR be legitimately diagnosed as a copy or hook deficiency.

### 4. `REVIEW_CONTENT_ALIGNMENT` (Editorial & Depth Optimization)
- **Gate 1 (Persistent Exposure):** Cohort or page impressions $\ge 100$.
- **Gate 2 (Ranking Stagnation):** Average position stalled between 21.0 and 50.0 across $\ge 28$ days without progression into Top 20.
- Reason: `PERSISTENT_RANKING_STALL`
- Confidence: `MEDIUM`
- Rationale: Search engines recognize relevance but rank authority stalls due to missing proof, weak schema, or insufficient editorial depth.

### 5. `REVIEW_CANNIBALIZATION` (Query Disambiguation)
- **Gate 1 (Multi-Page Competing Presence):** Distinct internal pages $\ge 2$ receiving impressions for the exact same query text.
- **Gate 2 (Material Presence):** Total query impressions $\ge 50$.
- Reason: `MULTI_PAGE_QUERY_COMPETITION`
- Confidence: `HIGH`
- Rationale: Multiple URLs competing for identical intent split ranking equity and dilute canonical topical authority.

### 6. `REVIEW_QUERY_ALIGNMENT` (Search Intent Mismatch)
- **Gate 1 (Intent Variance):** Dominant query category (e.g. informational) conflicts with registered target page purpose (e.g. commercial comparison).
- **Gate 2 (Exposure Threshold):** Query impressions $\ge 50$.
- Reason: `QUERY_INTENT_MISMATCH`
- Confidence: `MEDIUM`

### 7. `REVIEW_TECHNICAL_INDEXABILITY` (Crawl & Rendering Remediation)
- **Gate 1 (Indexation Disruption):** Sudden drop in visible pages ($> 20\%$) with no corresponding content deletion.
- **Gate 2 (Known Rendering Defect):** Server error anomalies (5xx) or bot blocking detected in crawl telemetry.
- Reason: `TECHNICAL_INDEXING_DEFECT`
- Confidence: `HIGH`

### 8. `INVESTIGATE` (Pipeline & Anomaly Triage)
- **Gate 1 (Data Broken):** `data_completeness_status == 'BLOCKED'` or missing mandatory upstream source files.
- **Gate 2 (Extreme Outlier):** Unexplained metric variance (> 500%) across adjacent windows with unverified bot traffic.
- Reason: `DATA_INTEGRITY_ANOMALY`
- Confidence: `HIGH`
