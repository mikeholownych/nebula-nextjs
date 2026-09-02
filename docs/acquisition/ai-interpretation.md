# Acquisition AI Interpretation and Epistemic Authority Model

This document establishes the architectural boundary, epistemic constraints, and operational protocol for AI-assisted interpretation within the Acquisition Learning System (Phase 7).

---

## 1. The Authoritative System Boundary

The deterministic acquisition engine is the sole authoritative source of truth for:
- Measurements and data quality scores
- Source validation and time boundary finalization
- Metric calculations (macro and dimensioned position, CTR, organic sessions)
- Page identity and cohort assignments
- Deterministic state transitions and trend classifications
- Evidence eligibility gates and minimum observation windows
- Deterministic recommendation classifications (`OBSERVE`, `INVESTIGATE`, `REVIEW_*`)
- Controlled experiment eligibility and causal outcome evaluations

**The Authority Chain:**

$$\text{Measurement} \longrightarrow \text{Deterministic Decision} \longrightarrow \text{AI-Assisted Interpretation} \longrightarrow \text{Human Review} \longrightarrow \text{Optional Controlled Experiment}$$

**Prohibited Chain:**

$$\text{Raw Telemetry} \not\longrightarrow \text{LLM Opinion} \not\longrightarrow \text{Direct Production Mutation}$$

The AI interpretation layer introduces **probabilistic reasoning only**. It assists human operators by proposing bounded hypotheses, identifying query patterns, and synthesizing longitudinal experiment history. It possesses zero direct write or mutation authority over website code, routes, metadata, canonical tags, sitemaps, recommendation statuses, experiment approvals, or deployments.

---

## 2. Epistemic Statement Classes

Every material assertion emitted by the AI interpretation layer must be classified into one of six schema-enforced epistemic classes:

| Epistemic Class | Definition | Grounding Requirement |
|:---|:---|:---|
| `OBSERVATION` | A direct restatement of a deterministic measurement fact. | Must cite a valid `measurement_id`, `page_measurement_id`, or `query_measurement_id`. |
| `INFERENCE` | A logical derivation from observed telemetry within deterministic constraints. | Must cite the underlying evidence IDs supporting the deduction. |
| `HYPOTHESIS` | A falsifiable proposition explaining an observed pattern. | Must specify target, expected observation if true/false, alternative explanations, and required evidence. |
| `ALTERNATIVE_EXPLANATION` | A competing or confounding hypothesis explaining the same observation. | Required for all substantive hypotheses to prevent premature convergence. |
| `INVESTIGATION_SUGGESTION` | A recommendation for non-invasive information gathering (e.g. inspect query cluster, review intent registry). | Distinct from an interventional change. |
| `UNCERTAINTY` | An explicit statement of missing data, unobserved baselines, or statistical variance. | Required when sample size is below eligibility thresholds. |

The AI layer is strictly prohibited from asserting independent `FACT` statements.

---

## 3. Analysis Types and Scopes

The system supports seven bounded analysis scopes:

1. `SITE_SUMMARY`: Macro search presence, sitewide funnel conversion, and longitudinal baseline stability.
2. `COHORT_INTERPRETATION`: Cohort-level search impressions, ranking distribution, and keyword coverage.
3. `PAGE_INTERPRETATION`: Page-level ranking, CTR, organic sessions, and SERP presentation.
4. `QUERY_ALIGNMENT`: Comparison of observed GSC search queries against declared positioning in `query_intent_registry`.
5. `CANNIBALIZATION_REVIEW`: Multi-page query competition on high-volume search terms.
6. `EXPERIMENT_HISTORY_SYNTHESIS`: Longitudinal aggregation of controlled experiment outcomes.
7. `HYPOTHESIS_GENERATION`: Formulation of testable hypotheses for human review.

Each analysis type executes against an isolated evidence package and versioned prompt template.
