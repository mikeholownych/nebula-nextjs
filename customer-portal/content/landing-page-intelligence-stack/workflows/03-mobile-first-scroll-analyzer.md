# Mobile First-Scroll Analyzer

## Purpose

Inspect what a visitor can actually see and act on in the first rendered mobile viewport.

## Inputs

- Landing page rendered at 375 by 812 CSS pixels
- Visible text and controls
- First interactive element
- Screenshot or browser observation record

## Evidence boundary

Evaluate rendered geometry only. Source order does not prove viewport visibility, overlap, or interaction behavior.

## Procedure

1. Load the page at 375 by 812 CSS pixels with normal browser zoom.
2. Record the viewport dimensions and observation time.
3. Capture the visible H1, supporting copy, proof, CTA, and obstruction boundaries.
4. Identify clipped text, horizontal overflow, navigation overlap, and blocked controls.
5. Record the first interactive element and whether its label and destination are inspectable.
6. Repeat after a clean reload before assigning confidence.

## Output contract

A viewport failure report containing viewport, selector, bounding evidence, obstruction type, reproduction steps, and confidence.

## Evidence record

Store each row using [`evidence-record.schema.json`](../evidence-record.schema.json): `workflow_id`, `page_url`, `observed_at`, `selector`, `observation`, `interpretation`, `confidence`, and `status`.

## Fail-closed conditions

Do not infer below-fold visibility from HTML order. If rendered geometry cannot be captured, mark the check `not_testable`.

## Verification checklist

- Viewport dimensions are recorded.
- Findings come from rendered geometry.
- Reload reproduction is documented.
- No claim is based only on source order.
