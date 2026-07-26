# Paid-Traffic Leak Prioritizer

## Purpose

Turn supported findings from the first four workflows into a bounded fix order.

## Inputs

- Mismatch map
- Evidence inventory
- Viewport failure report
- Friction sequence

## Evidence boundary

Prioritization reflects observed severity, reach within the journey, reproducibility, and confidence. It does not estimate lost revenue or guaranteed upside.

## Procedure

1. Reject any finding without a source workflow, selector, observation, and confidence.
2. Group duplicate findings that describe the same rendered defect.
3. Rate whether the defect blocks comprehension, trust inspection, action, or verification.
4. Prefer reproducible high-confidence blockers over speculative cosmetic issues.
5. Record dependencies that require one fix before another can be tested.
6. Produce a short ordered queue with the evidence reason for each position.

## Output contract

A ranked fix map containing finding ID, source workflow, observed defect, confidence, journey impact, dependency, recommended first change, and verification method.

## Evidence record

Store each row using [`evidence-record.schema.json`](../evidence-record.schema.json): `workflow_id`, `page_url`, `observed_at`, `selector`, `observation`, `interpretation`, `confidence`, and `status`.

## Fail-closed conditions

Do not invent revenue loss, conversion lift, traffic exposure, or urgency. Exclude unsupported findings rather than assigning them a low rank.

## Verification checklist

- Every ranked item traces to source evidence.
- Duplicates are consolidated.
- Revenue and outcome estimates are absent.
- Each item has a verification method.
