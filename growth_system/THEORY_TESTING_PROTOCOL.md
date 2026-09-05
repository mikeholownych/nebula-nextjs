# Theory testing protocol

Status: pre-data. These are theories, not validated ICP or offer claims.

## Purpose

Generate enough intentionally selected traffic to distinguish among targeting, problem, trust, message, offer, and payment explanations. Do not recycle the existing unresponsive cohort and do not scale a theory as fact.

## Theory-to-test chain

Every contact must answer five separate questions:

1. **Selection:** What observable evidence caused us to include this contact?
2. **Diagnosis:** What condition did Nebula observe on the public page?
3. **Recognition:** Did the owner engage after the condition was shown in plain language?
4. **Buying signal:** Did the owner accept an audit, request a repair, start checkout, or pay?
5. **Revenue proof:** Is a payment attributable to this theory, contact, and source?

Do not collapse these into one `HOT_LEAD` label.

## Active theory registry

The machine-readable registry is `growth_system/theory_testing_registry.json`. It contains four deliberately competing theories:

- `T1-public-page-diagnosis`: a specific page observation creates engagement even without self-diagnosed pain.
- `T2-wasted-spend`: protecting paid clicks is more compelling than generic conversion language.
- `T3-recent-launch`: launch timing creates urgency without explicit conversion-pain language.
- `T4-agency-champion`: repeated page responsibility creates a stronger buyer than an individual founder.

These are competing explanations, not segments to declare as the ICP.

## Traffic design

Bring qualified traffic to each theory using the theory's selection evidence. Every exposure gets a stable attribution key:

`theory_id + contact_id + source_id`

Use one message change per theory. Keep offer, CTA, and measurement constant unless the theory explicitly tests the offer job. Never combine a new audience, new message, new offer, and new channel in one result.

The first exposure is diagnostic. Do not treat it as a conversion win because someone visited, replied, completed an audit, or started checkout.

## Minimum record

For every contact, preserve:

- theory and source IDs
- source URL and exact selection evidence
- observed page URL and observed condition
- message variant and delivery receipt
- reply classification
- audit and checkout events
- payment ID and paid state
- disqualification reason

Missing selection evidence invalidates the exposure for ICP conclusions. Missing delivery receipt invalidates reply conclusions. Missing payment attribution invalidates revenue conclusions.

## Decision rules

- `untested`: no defined exposure yet.
- `running`: exposure is active inside its window.
- `sale_signal`: at least one payment is joined to the full attribution key, then manually reviewed.
- `no_purchases`: the defined sample/window closed with zero attributable purchases.
- `reject`: unsafe, irrelevant, unauditable, or impossible to attribute. Low confidence alone is not rejection.

Diagnostic outcomes guide the next test:

- No delivery: fix route or suppress the observation.
- Delivery but no qualified replies: challenge selection, message, or perceived relevance.
- Qualified replies but no audit acceptance: challenge diagnosis clarity or trust.
- Audits but no checkout: challenge offer handoff and perceived value.
- Checkouts but no payment: challenge price, trust, friction, or payment path.

## Stop and review

Close or revise a theory after 20 eligible contacts with no qualified reply, or at the end of a 14-day window. A reply does not establish a winner. A purchase is a sale signal, not automatic promotion. Inspect customer quality, attribution, margin, fulfillment, and refund risk first.

## Operating boundary

This registry authorizes measurement design only. It does not authorize email sends, public posts, paid spend, production changes, or automatic promotion. Those actions require their existing gates and receipts.

## Source of truth

Use `scripts/try_log.py` for the append-only commercial record. Link each try to a theory ID and attribution key in its hypothesis/change fields until the ledger schema is extended. Use `experiment_control.py` only for its verified purchase evaluator; its fixed A/B/C hook experiment is not a substitute for this theory registry.
