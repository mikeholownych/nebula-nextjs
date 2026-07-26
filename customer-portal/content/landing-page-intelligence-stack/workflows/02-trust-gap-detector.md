# Trust-Gap Detector

## Purpose

Inventory visible proof and identify claims whose support is absent, unclear, stale, or difficult to inspect.

## Inputs

- Rendered landing page
- Visible testimonials, case references, logos, credentials, guarantees, and outcome claims
- Destinations linked from proof elements

## Evidence boundary

Presence is observable; truth is not automatically proven. Never infer a customer identity, endorsement, relationship, or result.

## Procedure

1. List each material claim visible before and after the primary CTA.
2. Record nearby proof elements and stable selectors.
3. Open public evidence destinations without signing in or bypassing access controls.
4. Classify support as direct, contextual, absent, contradictory, or not testable.
5. Record missing source, date, method, or limitation information as separate gaps.
6. Keep visual prominence separate from evidentiary strength.

## Output contract

An evidence inventory containing claim text, proof text, source destination, selector, support class, missing context, and confidence.

## Evidence record

Store each row using [`evidence-record.schema.json`](../evidence-record.schema.json): `workflow_id`, `page_url`, `observed_at`, `selector`, `observation`, `interpretation`, `confidence`, and `status`.

## Fail-closed conditions

Do not treat a logo as an endorsement, a testimonial as verified identity, or an outcome number as causal proof without an inspectable record.

## Verification checklist

- Every claim and proof element is quoted exactly.
- Broken or inaccessible sources are recorded.
- Identity and outcome inferences are absent.
- Unknown facts remain `not_testable`.
