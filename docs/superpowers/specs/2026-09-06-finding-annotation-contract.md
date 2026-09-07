# Finding Annotation Contract

**Version:** 1.0.0
**Status:** Local evidence artifact only
**Date:** 2026-09-06

## Purpose

Define a deterministic annotation artifact for a measured Nebula finding. The renderer displays supplied evidence. It does not infer PASS or FAIL from visual appearance, and it does not create customer proof.

## Input contract

Each annotation requires:

- `audit_id`
- `condition_id`
- `selector`
- `determination`, restricted to `PASS` or `FAIL`
- `measured`
- `required`
- `delta`
- `threshold`
- ISO-8601 `timestamp`
- a non-empty verified capture file

The selector, measured value, threshold, and determination must come from the source evidence package. The capture must correspond to the same source receipt and condition.

## Fail-closed rules

No output is created when:

- the capture is missing or empty;
- the selector is absent or `N/A`;
- the determination is `INDETERMINATE` or `NOT_APPLICABLE`;
- any required evidence field is missing;
- the timestamp is invalid, future-dated, or older than 30 days at render time.

No visual inspection may upgrade unavailable evidence to PASS or downgrade it to FAIL.

## Output contract

The renderer produces a standalone SVG containing:

- the supplied capture embedded as data;
- audit ID;
- condition ID;
- copied determination;
- selector;
- measured, required, delta, and threshold text;
- capture timestamp; and
- `PUBLIC AUDIT / NOT A CUSTOMER`.

The artifact is observational evidence. It must not contain conversion lift, revenue, ROAS, payment, testimonial, or customer-identity claims.

## Source receipt

A local validation artifact was generated from existing public UX-audit evidence:

- Capture: `customer-portal/ux-audit-evidence/s6-kit-cta.png`
- Receipt: `customer-portal/ux-audit-evidence/UX-AUDIT-REPORT.md`, Stage S6
- Generated artifact: `/tmp/nebula-finding-annotation-s6.svg`
- Label: `PUBLIC AUDIT / NOT A CUSTOMER`

The source receipt records that the S6 capture showed the `$97 One-Leak Repair Sprint` CTA and 30-day re-audit term in the unlocked remediation section. This does not establish a customer outcome or conversion result.

## Publication boundary

The renderer and this local artifact do not authorize publication. Public use requires a reviewed source package, current freshness, canonical URL mapping, claim lint, and explicit release authorization. Customer-like screenshots require either public teardown provenance or an approved customer artifact with consent.
