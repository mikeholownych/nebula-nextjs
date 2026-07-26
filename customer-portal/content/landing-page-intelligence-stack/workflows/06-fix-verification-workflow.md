# Fix Verification Workflow

## Purpose

Determine whether a specific observed defect changed under comparable conditions.

## Inputs

- Before evidence record
- Changed public page
- Same viewport, browser path, and interaction sequence

## Evidence boundary

A changed observation proves only that the inspected condition changed. It does not prove conversion impact without separate outcome data and a suitable method.

## Procedure

1. Confirm the before record includes URL, time, selector, observation, and test conditions.
2. Load the changed page using the same viewport and interaction path.
3. Repeat the original observation before exploring unrelated changes.
4. Record the after selector, raw observation, and any unavoidable test differences.
5. Classify the defect as resolved, unchanged, regressed, moved, or not testable.
6. Attach comparable before and after evidence without rewriting the original record.

## Output contract

A before-and-after evidence packet containing both records, shared conditions, differences, disposition, limitations, and confidence.

## Evidence record

Store each row using [`evidence-record.schema.json`](../evidence-record.schema.json): `workflow_id`, `page_url`, `observed_at`, `selector`, `observation`, `interpretation`, `confidence`, and `status`.

## Fail-closed conditions

Do not claim improvement when conditions are not comparable. Do not infer business outcomes from a corrected page element.

## Verification checklist

- Before evidence remains unchanged.
- Test conditions are comparable or limitations are explicit.
- Disposition follows the observed difference.
- No business-outcome claim is introduced.
