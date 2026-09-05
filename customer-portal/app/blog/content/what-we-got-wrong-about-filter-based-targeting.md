---
slug: what-we-got-wrong-about-filter-based-targeting
status: published
content_lane: feature
post_type: assumption-report
author_id: mike-holownych
category: Product learning
purpose: trust
commercial_role: assisted-conversion
evidence_level: clearly_labelled_internal_note
source_refs:
  - nebula-audit-method
published_at: 2026-09-04
updated_at: 2026-09-04
reviewed_by: mike-holownych
---

# What did we get wrong about filter-based targeting?

Filter-based targeting was too blunt for the questions we wanted to answer. This is a clearly labelled internal product note, not a customer case study. The correction was to preserve the underlying evidence while making the page condition and decision context visible, so a reader can inspect why a recommendation appears.

## What assumption did we change?

We assumed a set of filters could stand in for the underlying page evidence. That shortcut made the output easier to sort but harder to trust. The useful unit is the observable condition, not the label attached to it.

## What changed in the product direction?

We are treating filters as navigation into evidence, not as an opaque score. A reader should be able to move from a question to the observed page detail, then decide what to do. This keeps the product aligned with [how Nebula audits](/how-nebula-audits).

## What remains unproven?

This note does not claim a measured lift, customer result, or completed experiment. The next validation step is to compare whether evidence-first explanations improve task completion for real users, with a defined sample and observation window.

## What sources and related reading should you inspect?

- [How Nebula audits](/how-nebula-audits)
- [Nebula about page](/about)

## What questions does this FAQ answer?

### Is this a customer case study?

No. It is an internal product note and makes no customer performance claim.

### Does a filter disappear entirely?

No. Filters remain useful for navigation, but the evidence and reasoning must remain visible.
