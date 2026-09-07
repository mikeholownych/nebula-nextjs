# Case-Study Evidence Contract

**Status:** Dormant until a real paying customer exists
**Version:** 1.0.0
**Date:** 2026-09-06

## Purpose

This contract defines the minimum evidence required before Nebula can publish a customer case study. It is an intake contract, not a case study and not permission to publish.

## Required evidence chain

A record must contain:

1. An independently verifiable payment receipt for the One-Leak Repair Sprint.
2. A pre-intervention audit ID, timestamp, condition ID, determination, and source.
3. The exact intervention artifact and the date it was applied.
4. A post-intervention same-condition re-audit with the same condition ID and `same_scope: true`.
5. An outcome source classification for each claimed business outcome.
6. Explicit customer consent, including scope and timestamp when publication is approved.
7. Publication status and an immutable record identifier.

The record schema is `case-study-record.schema.json`.

## Separate evidence classes

### Measured

Measured evidence is produced by Nebula's audit or payment systems. A FAIL-to-PASS change is a measured condition change. It is not conversion proof, revenue proof, or proof that the intervention caused a business result.

### Customer-reported

A customer-reported business outcome must be labeled `customer_reported`, include a source reference, and remain distinct from Nebula-measured condition evidence. It must not be rewritten as independently verified revenue or conversion data.

### Payment

Payment is an independently verified purchase signal. A payment proves that a purchase occurred. It does not prove that a page condition caused the purchase or that a repair produced later revenue.

## Quantitative claim rule

A percentage is invalid unless it includes a numerator, denominator, date window, and source reference. The denominator must describe the relevant population. “Conversion lift” is not an allowed outcome kind in this intake schema without a separately approved controlled-measurement contract.

## Prohibited shortcuts

The following are rejected:

- a record without a payment receipt;
- an audit result without a condition ID;
- a re-audit that does not use the same condition scope;
- a percentage without numerator, denominator, window, and source;
- a FAIL-to-PASS result presented as conversion proof;
- a customer-reported claim presented as measured system evidence;
- a customer identity or logo without explicit consent;
- a fabricated founder, intervention, payment, percentage, or business outcome;
- publication while consent or evidence review is incomplete.

## Publication gate

No case study may be published until all required evidence is provenance-complete, consent is granted for the requested publication scope, and the claim register and governance review approve the final wording. Until a real paying customer exists, this contract remains dormant and produces no public case study.
