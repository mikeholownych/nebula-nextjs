# CTA and Form-Friction Analyzer

Workflow ID: `cta-form-friction-analyzer`

## Purpose

Map the visible actions and form requirements a visitor encounters before completing the intended step.

## Inputs

- Rendered CTA labels and destinations
- Visible form fields, requirements, helper text, and validation states
- Public navigation behavior

## Evidence boundary

Inspect public behavior without submitting forms, creating accounts, sending messages, or creating leads.

## Procedure

1. List visible CTAs in encounter order with labels and selectors.
2. Record each CTA destination or interaction result without completing a conversion.
3. Inventory visible form fields, required markers, helper text, and consent language.
4. Trigger only non-submitting client-side validation when safe and reversible.
5. Record ambiguous labels, destination surprises, blocked controls, and error clarity separately.
6. Separate observed steps from judgments about effort or intent.

## Output contract

A friction sequence containing ordered actions, labels, destinations, required inputs, visible errors, observations, interpretations, and confidence.

## Evidence record

Store each row using [`evidence-record.schema.json`](../evidence-record.schema.json): `workflow_id`, `page_url`, `observed_at`, `selector`, `observation`, `interpretation`, `confidence`, and `status`.

## Fail-closed conditions

Do not submit forms, create leads, infer abandonment, or claim that a field reduces conversion.

## Verification checklist

- CTA order matches the rendered journey.
- Destinations are recorded without conversion.
- No personal data is entered.
- Observed friction is separated from interpretation.
