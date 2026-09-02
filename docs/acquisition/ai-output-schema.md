# Acquisition AI Output Schema Specification

This document defines the canonical JSON schema for Phase 7 AI interpretation outputs (Schema Version `1.0.0`).

---

## 1. Top-Level Schema Envelope

Every AI interpretation run produces a structured JSON document conforming to the following structure:

```json
{
  "$schema": "https://nebulacomponents.com/schemas/acquisition-ai-interpretation-v1.json",
  "version": "1.0.0",
  "observations": [
    {
      "statement": "string",
      "epistemic_class": "OBSERVATION",
      "supporting_evidence_ids": ["string"],
      "confidence": "HIGH"
    }
  ],
  "inferences": [
    {
      "statement": "string",
      "epistemic_class": "INFERENCE",
      "supporting_evidence_ids": ["string"],
      "confidence": "HIGH|MEDIUM|LOW"
    }
  ],
  "hypotheses": [
    {
      "hypothesis_id": "string",
      "target": "string",
      "hypothesis": "string",
      "supporting_evidence_ids": ["string"],
      "alternative_explanations": ["string"],
      "expected_if_true": "string",
      "expected_if_false": "string",
      "required_evidence": "string",
      "suggested_test": "string"
    }
  ],
  "alternative_explanations": [
    "string"
  ],
  "investigation_suggestions": [
    "string"
  ],
  "uncertainties": [
    "string"
  ],
  "contradictions": [
    "string"
  ],
  "challenges": [
    {
      "challenge_type": "POSSIBLE_RULE_GAP|POSSIBLE_DATA_GAP|POSSIBLE_CLASSIFICATION_GAP|POSSIBLE_QUERY_ALIGNMENT_GAP",
      "target_type": "SITEWIDE|COHORT|PAGE|QUERY",
      "target_id": "string",
      "deterministic_decision": "string",
      "challenge_reason": "string",
      "supporting_evidence_ids": ["string"],
      "proposed_review": "string"
    }
  ],
  "required_evidence": [
    "string"
  ]
}
```

---

## 2. Validation Status Lifecycle

Analysis runs persist in PostgreSQL table `ai_analysis_runs` with one of five terminal statuses:

- `PENDING`: Analysis is currently packaging evidence or awaiting model completion.
- `SUCCESS`: Output passed schema validation, manifest citation checks, and contradiction detection.
- `INVALID_OUTPUT`: Output violated schema rules (missing top-level keys, ungrounded invented IDs).
- `CONTRADICTED`: Output made factual assertions directly contradicted by deterministic evidence.
- `FAILED`: Model provider error, network timeout, or unrecoverable system exception.
