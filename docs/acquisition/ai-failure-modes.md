# Acquisition AI Failure Modes and Safeguards

This document catalogs known failure modes in probabilistic interpretation and specifies the fail-closed defenses implemented in Phase 7.

---

## 1. Catalog of Failure Modes

| ID | Failure Mode | Mechanism | System Safeguard |
|:---|:---|:---|:---|
| **AI-FAIL-01** | Invented Evidence ID | Model cites an ID not present in manifest. | Strict set-intersection check against `manifest`. Fails closed with `INVALID_OUTPUT`. |
| **AI-FAIL-02** | Metric Contradiction | Model claims ranking gain/loss on unobserved baseline. | Regex and semantic validation against deterministic trend. Fails with `CONTRADICTED`. |
| **AI-FAIL-03** | Low-Volume SERP Diagnosis | Model diagnoses bad CTR on position $> 20.0$. | Gate check against position thresholds. Fails with `CONTRADICTED`. |
| **AI-FAIL-04** | Causal Overclaim on Confounded Trial | Model claims an intervention succeeded despite confounded holdout. | Verification of cited experiment status. Fails with `CONTRADICTED`. |
| **AI-FAIL-05** | Unauthorized Action Imperative | Model issues command to mutate production copy or deploy tags. | Rejection of execution directives. Fails with `CONTRADICTED`. |
| **AI-FAIL-06** | Prompt Injection via Query/Snippet | Malicious query string attempts instruction override. | Strict `<EVIDENCE_PAYLOAD>` JSON serialization and system prompt boundary. |
| **AI-FAIL-07** | Premature 84-Day Trend Assertion | Model asserts strategic trend before 3 windows exist. | Boundary check against deterministic availability. Fails with `CONTRADICTED`. |
| **AI-FAIL-08** | Provider API Outage / Timeout | Model endpoint unreachable or latency exceeds timeout. | Unidirectional dependency: pipeline proceeds unaffected. Run recorded as `FAILED`. |
| **AI-FAIL-09** | Missing Alternative Explanation | Model asserts single hypothesis without exploring alternatives. | Schema validation enforces non-empty `alternative_explanations`. |

---

## 2. Audit Trail Preservation

When an analysis fails validation or triggers a contradiction alert:
1. The raw output is preserved in `ai_analysis_results` with the error description in `ai_analysis_runs.error_message`.
2. The run status is set to `INVALID_OUTPUT` or `CONTRADICTED`.
3. The invalid result is never surfaced in customer-facing reports or decision reviews.
