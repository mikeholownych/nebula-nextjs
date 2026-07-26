# Ad-to-Page Message-Match Checker

Workflow ID: `message-match-checker`

## Purpose

Compare the promise in an ad with the rendered landing-page headline, hero copy, and primary action.

## Inputs

- Ad headline and body text
- Final landing-page URL
- Rendered H1, hero copy, and primary CTA

## Evidence boundary

Assess only visible wording and destination behavior. Do not infer campaign intent, audience fit, or performance from copy alone.

## Procedure

1. Record the ad text verbatim and its source.
2. Load the final landing URL in a rendered browser.
3. Record the visible H1, supporting hero copy, and primary CTA with selectors.
4. Compare the named problem, promised outcome, specificity, and requested action.
5. Mark each dimension aligned, partially aligned, contradicted, or not testable.
6. Capture the shortest evidence excerpt that supports each classification.

## Output contract

A mismatch map containing the ad statement, page statement, selector, classification, interpretation, and confidence.

## Evidence record

Store each row using [`evidence-record.schema.json`](../evidence-record.schema.json): `workflow_id`, `page_url`, `observed_at`, `selector`, `observation`, `interpretation`, `confidence`, and `status`.

## Fail-closed conditions

If the ad copy is absent or unverifiable, set status to `not_testable`. Do not reconstruct it from tracking parameters or page copy.

## Verification checklist

- Ad and page text are recorded separately.
- Every page observation has a selector.
- Interpretations do not claim conversion impact.
- Missing ad evidence is labeled `not_testable`.
