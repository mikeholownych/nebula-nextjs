# Five-Page Comparative Study Protocol

**Status:** Draft protocol, not a published study
**Date:** 2026-09-06

## Purpose

Define a reproducible side-by-side comparison of five public landing pages without falsely labeling public pages as paid-traffic pages or claiming conversion superiority.

## Required record

The machine-readable record is `five-page-comparative-study.schema.json`. It requires exactly five pages, each with:

- an HTTPS URL from a primary public source;
- selection rationale;
- capture timestamp;
- an evidence-package reference; and
- `traffic_provenance` set to exactly one of `verified_paid`, `publicly_inspectable`, or `unknown`.

`publicly_inspectable` means the page can be inspected. It does not establish that the page receives paid traffic. `unknown` must remain unknown. An unknown page cannot be labeled a paid-traffic page.

## Same-condition comparison

All five pages must use the same Nebula engine version, audit configuration, viewport set, and capture procedure. The study must record the engine version and audit conditions before collection begins. A changed engine version creates a new study, not a mixed comparison.

Each observed condition must include its source URL, capture timestamp, selector or evidence reference, measured value, required standard, and determination. Public competitor output is limited to what is directly observable from the primary source. Missing or blocked evidence is recorded as unavailable, not inferred.

## Claims boundary

The study may compare observed page conditions, evidence coverage, and documented limitations. It must not claim “better conversion,” superior revenue, superior ROAS, or customer outcomes unless an attributable controlled experiment and primary outcome evidence exist. A public page comparison is not a paid-traffic study and is not conversion proof.

The title, metadata, structured data, and publication copy must preserve the selected traffic provenance. Unknown provenance cannot be upgraded through inference, competitor positioning, or a screenshot.

## Publication gate

Publication requires review of all five evidence packages, confirmation that every finding is source-backed, confirmation that the same engine conditions were used, and an explicit publication decision. Until then, the record remains `draft` with `blocked_pending_review`.

No external pages will be audited or contacted by this protocol without separate authorization. The protocol itself produces no outreach, paid spend, backlink, or public claim.
