# 293-Audit Research Asset Contract

**Status:** `OPEN_VALIDATION`
**Date:** 2026-09-06
**Owner:** Nebula Components

## Purpose

Define the evidence boundary for any public research asset that refers to the historical “293 audits” figure. This contract does not authorize a new benchmark route, new public rates, outreach, or publication by itself.

## Reconciliation decision

The authoritative `DatasetRecord` registry currently defines the frozen Q3 2026 report as:

- Dataset ID: `state-of-landing-page-performance-q3-2026`
- Sample size: `131`
- Scope: completed audits collected through August 2026, with Above Fold and Ad Signals pending rendered verification
- Collection window: through August 2026
- Source path: `/research/landing-page-performance-q3-2026`

Older press and learning-centre material refers to `293` audits. No authoritative `DatasetRecord` currently supports a frozen `293` denominator. Therefore a public asset must **not publish** the `293` figure as a denominator until the source records, scope, collection window, provenance, and publication authorization are reconciled and reviewed.

The discrepancy is recorded as an evidence blocker, not silently resolved by changing the existing Q3 page or by treating the older number as current.

## Required dataset record

Every quantitative statement must map to a `DatasetRecord` with all of the following:

1. Dataset ID and name.
2. Sample size or an explicit `null` for a live aggregate.
3. Scope.
4. Collection window.
5. As-of date.
6. Provenance and source path.
7. Relationship to other datasets.
8. Signal definition and denominator for every rate.
9. Whether the evidence is measured, user-provided, or unavailable.

A value without a source path, provenance, scope, collection window, or sample size is not publishable.

## What the asset may say now

The asset may describe the `131`-audit frozen Q3 report using the wording and rates already reconciled to `STATE_Q3_2026_REPORT`. It may state that the rates are descriptive recorded findings from page audits. It must state that the sample does not establish conversion lift, revenue improvement, ROAS, or customer outcomes.

The asset may identify the `293` figure as an **unreconciled historical reference** in an internal evidence note. It must not present `293` as the current public denominator, use it to calculate a rate, or use it in a headline, title tag, structured data, press pitch, or outreach copy.

## Non-causality boundary

A page-condition observation or a FAIL-to-PASS re-audit result is not conversion proof. The research asset must not claim or imply conversion lift, revenue, ROAS, customer outcome, superiority, or guaranteed improvement. Those claims require attributable primary evidence and an appropriate controlled measurement window.

The 293-audit dataset is descriptive evidence only. It cannot produce a customer case study, before/after success story, payment claim, or causal intervention claim.

## Illustrative walkthrough

An optional section named **Illustrative walkthrough** may show the shape of an audit finding without inventing a founder, URL, percentage, payment, intervention result, or re-audit outcome. It must be labeled illustrative and use neutral placeholders such as “a public landing page” and “one observed condition.”

The walkthrough may demonstrate:

- observed condition;
- evidence reference;
- bounded recommended change;
- implementation location; and
- the criterion that a future same-condition re-audit would measure.

It must not state that the change improved conversion, produced revenue, caused a payment, or passed a re-audit. No invented customer outcome or payment may appear.

## Publication gate

Publication remains blocked until all of the following are true:

- the denominator discrepancy is reconciled against primary records;
- the selected `DatasetRecord` is authoritative and publication-authorized;
- every rate has a numerator, denominator, date window, signal definition, and source path;
- claim lint and governance tests pass;
- the route and sitemap decision is reviewed; and
- a separate release authorization exists for any production change.

Until then, the existing frozen research route remains unchanged and no new benchmark route is created from this contract.
