# Paid Traffic Leak Report

## Status

Approved design for an internal operator workflow. This phase does not add a public route or change the production audit funnel.

## Objective

Test whether a campaign-aware, evidence-backed report creates attributable $97 implementation purchases from qualified paid-traffic prospects.

## Scope

The operator supplies:

- Landing-page URL
- Ad, campaign, or traffic-source copy
- Primary conversion goal
- Internal prospect identifier

The workflow produces an immutable JSON report artifact for operator delivery.

## Workflow

```text
URL + campaign copy
→ existing audit engine
→ message-match diagnosis
→ one prioritized leak
→ exact replacement copy
→ experiment brief
→ immutable JSON report
→ operator delivery
→ existing $97 checkout handoff
```

## Report contract

Each report includes:

- `report_id`
- `created_at`
- `prospect_id`
- `landing_page_url`
- `campaign_copy`
- `conversion_goal`
- `audit_id`, when an existing audit is attached
- `message_match_finding`
- `evidence[]`
- `priority_leak`
- `confidence`
- `replacement_headline`
- `replacement_subheadline`
- `replacement_cta`
- `implementation_notes`
- `experiment_brief`
- canonical `$97` checkout URL

Reports are immutable. A revised diagnosis creates a new report rather than overwriting an existing artifact.

Prospect email addresses, API keys, tokens, and other secrets are not stored in report artifacts. Use an internal prospect ID or redacted identifier.

## Evidence rules

- Every finding cites observable page or campaign evidence.
- One primary leak is selected per report.
- Confidence is explicit.
- No conversion lift, revenue loss, or customer result is invented.
- Any dollar scenario must expose its inputs and be labeled as a scenario, not proof.
- If traffic is insufficient for a valid A/B test, the report recommends a qualitative or concierge test instead.
- The report explains the recommended change, what remains constant, the primary metric, stop rule, and rollback condition.

## Side-effect boundary

Report creation is local and does not send email, publish content, modify a prospect, change production code, or initiate a checkout. Operator delivery and any commercial follow-up remain separate actions.

## Storage

Artifacts are stored under:

```text
ops/paid-traffic-leak-reports/<report-id>.json
```

The implementation must reject duplicate report IDs and must fail closed on missing required fields, invalid URLs, unsupported checkout URLs, or ungrounded findings.

## Validation plan

Prepare ten reports for qualified paid-traffic prospects. Track:

- Reports created
- Reports delivered
- Replies
- Checkout starts
- Completed $97 purchases

Only an attributable completed $97 purchase validates the commercial hypothesis. Replies, opens, clicks, and report completion are diagnostic signals only.

## Explicit non-goals

- No public self-serve route
- No new dashboard
- No generic AI score
- No heatmap or A/B-testing clone
- No autonomous outbound sending
- No fabricated benchmarks or uplift claims
- No new pricing tier
- No replacement of the existing audit engine

## Acceptance criteria for implementation

1. An operator can create a valid report from campaign copy and an existing or supplied audit finding.
2. The report is written as immutable JSON with deterministic validation.
3. Required evidence and the one-leak constraint are enforced.
4. Secrets and raw prospect email addresses are rejected from artifacts.
5. The canonical $97 checkout URL is used.
6. Tests cover valid creation, missing evidence, invalid URL, duplicate ID, secret/PII rejection, and insufficient-traffic experiment guidance.
7. A local sample report can be created and independently read back after implementation.
