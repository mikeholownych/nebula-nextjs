# Acquisition Query Intelligence and Semantic Alignment

This document outlines the methodology for semantic query interpretation, intent matching, privacy disclosure handling, and cannibalization analysis in Phase 7.

---

## 1. GSC Query Privacy & Censoring Disclosure

Google Search Console systematically censors query terms that do not meet privacy thresholds or are performed by very few users (anonymized queries).

**Mandatory Invariant:**
Every query intelligence analysis must explicitly surface:

$$\text{query\_sample\_is\_incomplete} \equiv \text{True}$$

The AI interpretation layer is strictly prohibited from claiming that observed query rows represent the complete population of searches conducted by users. The system describes them as:
> "Observable query rows returned by Google Search Console, which represent a sample of total search impressions."

---

## 2. Intended vs Observed Positioning

Phase 6 established declarative records in `query_intent_registry`:

| Field | Purpose |
|:---|:---|
| `primary_topic` | The declared core topic for the landing page. |
| `secondary_topics` | Supporting themes and adjacent concepts. |
| `target_query_patterns` | Target keyword stems and search phrases. |
| `intended_intent` | `COMMERCIAL`, `INFORMATIONAL`, `COMPARISON`, `NAVIGATIONAL`. |

The AI layer compares observed GSC search phrases against these declarations to classify alignment:

- `ALIGNED`: Observed search terms directly match the primary topic or target patterns.
- `PARTIALLY_ALIGNED`: Search terms match secondary themes but diverge from primary targeting.
- `POSSIBLE_MISMATCH`: Search terms reflect unrelated intent (e.g. support or billing questions landing on commercial pages).
- `INSUFFICIENT_EVIDENCE`: Total query impressions are insufficient to diagnose alignment.

---

## 3. Emerging Adjacent Demand Identification

When query clusters reveal consistent search presence on relevant terms not covered by existing landing pages, the AI layer may formulate an `EmergingAdjacentDemand` hypothesis:

- `candidate_adjacent_intent`: The conceptual demand theme identified in telemetry.
- `supporting_queries`: List of observed GSC query rows.
- `why_distinct`: Explanation of why existing pages do not satisfy this intent.
- `additional_evidence_required`: Minimum volume criteria before a new page is considered.

This remains purely an informational hypothesis and does not trigger autonomous page generation.

---

## 4. Multi-Page Query Cannibalization Analysis

When a query term triggers impressions across multiple distinct URLs:
- If impressions $\ge 50$, the deterministic system flags `POTENTIAL_CANNIBALIZATION`.
- The AI layer analyzes page intent declarations to evaluate:
  - `POSSIBLE_INTENT_OVERLAP`: Pages compete directly for the same query without differentiated positioning.
  - `POSSIBLE_COMPLEMENTARY_INTENT`: Pages serve distinct stages of the customer journey (e.g. high-level guide vs detailed comparison).
  - `INSUFFICIENT_EVIDENCE`: Query volume is too low to prove cannibalization.
