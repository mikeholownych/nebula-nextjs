# ADR-003: Opportunity Governance — Separation of Citable, Customer Signals, and Commercialization

**Date:** 2026-09-01  
**Status:** ACCEPTED  
**Decision:** Introduce a file-based, git-versioned opportunity governance layer that separates Citable observations, customer demand signals, and Nebula commercialization decisions.  
**Authority:** Mike Holownych (founder)

---

## Context

Nebula operates across three concern layers that must remain independent:

1. **Citable** — an open-source discoverability tool that can observe environmental conditions across SEO, AEO, GEO, and adjacent domains without requiring commercial justification.

2. **Nebula customer signals** — independent observations of customer demand patterns, separated from CRM lead data and PII.

3. **Nebula Components** — the commercial product, which must only expand when explicit evidence supports each of seven defined criteria.

As of 2026-09-01, the repository has strong controls for existing commercial claims (`public-facts.ts`, `CLAIM_REGISTER.md`, `datasets.ts`, `subtractive-differentiation.md`) but no explicit governance layer for the pre-commercial space. Specifically:

- No record separates "Citable observes this" from "Nebula is considering commercializing this."
- No customer demand signal log exists that is independent of the lead pipeline and free of PII.
- No convergence record exists for linking Citable observations to customer signals.
- No commercialization gate defines what evidence must exist before a capability can advance.
- No Observatory boundary document states what Nebula discloses vs what it does not.
- No ADR mechanism exists for product-governance decisions.
- Claim registry expiry is not CI-enforced.

The risk is that technical capability, founder enthusiasm, or a single customer request substitutes for evidence — and that Nebula expands its commercial surface without validated demand or sustainable economics.

---

## Decision

Introduce the following file-based, git-versioned additions to the existing governance infrastructure. All decisions are file-based. No new database is introduced.

### New files

1. **`docs/governance/opportunity-governance.md`** — system entry point, principles, lifecycle states, authorization table.

2. **`docs/governance/commercialization-gates.md`** — the seven criteria (C1-C7), gate determination vocabulary (PASS/FAIL/INDETERMINATE/INCOMPARABLE), gate record format, and the authoritative gate decision log.

3. **`docs/governance/observatory-boundary.md`** — what the Observatory covers, disclosure obligations, adverse-result handling, and authoring gate.

4. **`docs/research/customer-demand-signals.jsonl`** — append-only PII-free log of demand pattern observations.

5. **`docs/research/convergence-records.yaml`** — records linking Citable signals to customer demand signals with independence provenance.

### Extensions to existing files

6. **`customer-portal/.citable/evidence.yaml`** — each entry gets three optional fields: `signal_source`, `demand_state`, `nebula_commercial_consideration`. Existing entries without these fields default to `signal_source: citable`, `demand_state: not_assessed`, `nebula_commercial_consideration: none`. No existing entries are modified.

7. **`customer-portal/docs/governance/CLAIM_REGISTER.md`** — one additional column: `Observatory`. Values: `none | pending | published | adverse_disclosed`. This column is added to all table headers; existing rows default to `none`.

### CI enforcement

8. A new test in `customer-portal/__tests__/` (implementation phase) that parses `CLAIM_REGISTER.md` and fails if any active claim has an expiry date in the past.

### Archival

9. `system_setup/GOVERNANCE_POLICIES.md` and `system_setup/PROVENANCE_SYSTEM.md` — archived to `.legacy/` with a rationale note. They describe consulting-style frameworks that no operational control references. Leaving them in place creates confusion between aspirational policy and enforced practice.

---

## Consequences

**Positive:**

- The boundary between Citable observation and Nebula commercialization is explicit and auditable.
- A single customer request cannot advance an opportunity past SIGNAL_OBSERVED without documented independent evidence.
- Expired claims fail CI rather than silently persisting.
- The Observatory's disclosure obligations are written down and reviewable.
- Future decisions to commercialize or reject an opportunity are recorded in `commercialization-gates.md` with evidence linkages.

**Negative / tradeoffs:**

- Authoring a commercialization gate record requires discipline and takes time.
- The system can become compliance theater if gate records are written without genuine evidence assessment. This is mitigated by requiring evidence IDs that must exist in the evidence register and by git history making the sequence of events auditable.
- Convergence records require two independent sources to exist before they can be written; if both originate from Nebula-framed research, independence cannot be claimed.

**Non-consequences (explicitly not in scope):**

- This ADR does not govern architectural decisions (covered by `adr-001`, `adr-002`).
- This ADR does not change how existing commercialized offers are governed (`public-facts.ts`, `CLAIM_REGISTER.md` govern those).
- This ADR does not introduce automated scoring, a workflow service, a new database, or a state machine beyond the file-based lifecycle defined in `opportunity-governance.md`.

---

## When a New Product-Governance ADR Is Required

A product-governance ADR is mandatory for any of the following:

1. Advancing an opportunity to COMPONENT_CANDIDATE (gate PASS).
2. Advancing an opportunity to REJECTED (after meaningful evidence was gathered).
3. Reopening a DORMANT opportunity that was previously REJECTED.
4. Materially changing the commercialization gate criteria (C1-C7).
5. Authorizing Observatory publication of a new Component.
6. Materially changing the evidence rules for active commercial claims.
7. Changing the minimum independent-customer threshold for C5 demand.

A product-governance ADR is NOT required for:

- Recording a new customer demand signal.
- Recording a new Citable evidence entry.
- Advancing an opportunity from SIGNAL_OBSERVED to UNDER_INVESTIGATION.
- Expiring an old claim in the register.

---

## Evidence the Decision Baseline

Current state as of 2026-09-01:

- One paying customer (purchase confirmed via Stripe, fulfillment delivered).
- 131 audits in the Q3 2026 dataset (frozen, `state-of-landing-page-performance-q3-2026`).
- $0 revenue outside the single purchase.
- No active commercialization candidates beyond the existing One-Leak Repair Sprint.
- No demand signals meeting the C5 threshold for any expansion.

This ADR is written at the correct moment: before any expansion pressure exists, so the system is established without exception pressure.

---

## Revision Triggers

This ADR should be revisited if:

- The number of commercialized Components grows beyond three.
- The organization adds a second operator with independent product authority.
- Evidence methods change materially (e.g., automated customer signal capture).
- The minimum evidence thresholds prove systematically wrong (too strict or too permissive) based on outcomes.

---

*This is a product-governance ADR. It does not affect production code. It does not require a migration. It takes effect on commit.*
