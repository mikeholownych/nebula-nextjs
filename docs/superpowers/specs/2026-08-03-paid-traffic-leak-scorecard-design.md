# Paid-Traffic Leak Scorecard - Design Specification

**Date:** 2026-08-03
**Status:** Approved concept; awaiting written-spec review
**Owner:** Nebula Components

## Objective

Build a narrow lead magnet for Nebula's actual ICP: founders actively spending on paid traffic while landing-page conversion is weak or unproven.

The lead magnet must convert qualified attention into a completed free Nebula audit without attracting a broad audience interested only in generic AI-GTM education.

## Product

**Name:** Paid-Traffic Leak Scorecard
**Route:** `/paid-traffic-leak-scorecard`
**Primary CTA:** `Run the free evidence-backed audit`

The scorecard is a seven-question self-assessment. It is not a measured audit and must never present a self-reported score as an observed conversion score, benchmark, or business outcome.

## User flow

1. User lands on the scorecard from content, search, or a direct share.
2. User answers seven questions about paid traffic and landing-page conversion conditions.
3. Results appear immediately without an email gate.
4. Results show a transparent risk-signal count and the next action.
5. User can start the existing free URL audit.
6. The audit CTA carries source attribution: `source=paid-traffic-leak-scorecard`.
7. The existing audit flow remains the source of measured findings and lead capture.

## Questions

The questions map the AI-GTM roadmap's foundation and engineering principles to Nebula's conversion problem:

1. Is the page receiving active paid traffic?
2. Does the landing-page headline match the ad promise?
3. Is the value proposition clear above the fold?
4. Is the primary CTA obvious and specific?
5. Is credible proof visible before the decision point?
6. Does the mobile experience preserve the conversion path?
7. Is there a defined conversion event being measured?

Each question has a clear pass/risk explanation. Copy must avoid implying that a negative answer proves the page is the only cause of poor performance.

## Scoring

Each answer contributes zero or one risk signal. The score is presented as a self-assessment count, not a conversion score.

- **0–1 risk signals:** The page may be structurally sound; validate with measured evidence before changing spend.
- **2–3 risk signals:** Inspect the page before increasing traffic or budget.
- **4+ risk signals:** Run the full audit before buying more traffic.

The result view must display the questions that created risk and one practical next action per risk.

## Visual direction

- Dark Nebula surface consistent with the workspace redesign.
- Compact, high-contrast progress indicator.
- One question per screen or a short sequential card flow; no long wall of form fields.
- Thin borders, restrained radius, teal accent, neutral surfaces.
- Results use plain labels and explicit boundaries; no fake charts, trends, or outcome claims.
- Mobile-first layout.

## Data and attribution

The scorecard itself can run client-side because it contains no sensitive user data and is a self-assessment.

Instrumentation should record:

- `scorecard_started`
- `scorecard_completed` with risk-band only, not raw personal data
- `scorecard_audit_cta_clicked`
- Existing audit-start event with the source query parameter

Do not create a second lead database. The existing audit flow remains the canonical lead and audit record.

## SEO and answerability

Add route metadata with a direct description of the scorecard's purpose and boundary.

Add a small visible FAQ covering:

- What does the scorecard measure?
- Is this the same as a Nebula audit?
- Does a high risk count prove the page is the problem?
- What happens when I run the free audit?

FAQ structured data may mirror the visible FAQ only. It is semantic annotation, not a rich-result or AI-visibility guarantee.

## Testing

Add focused tests for:

- score boundaries at 0, 1, 2, 3, and 4+;
- every question having a result explanation and next action;
- the self-assessment boundary copy being present;
- source attribution surviving the audit CTA;
- no fabricated benchmark, conversion, or revenue claims.

Run typecheck, focused tests, production build, and browser verification of the live route and audit CTA.

## Success criteria

The implementation is complete only when:

1. The page renders in production.
2. A user can complete the scorecard and receive results without a dead end.
3. The audit CTA opens the existing audit flow with source attribution.
4. Browser verification confirms the visible boundary copy and CTA behavior.
5. Instrumentation events are emitted without introducing a second lead store.
6. No unsupported business outcome or benchmark claims are present.

## Explicit non-goals

- No generic AI-GTM ebook or broad agent-training audience.
- No email gate before the user receives value.
- No fabricated conversion score or audit result.
- No new CRM, payment, or fulfillment flow.
- No automated outbound triggered solely by scorecard completion.
