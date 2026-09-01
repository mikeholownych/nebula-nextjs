# Opportunity Governance

**Status:** Active  
**Established:** 2026-09-01  
**Authority:** Mike Holownych (founder)  
**Supersedes:** `system_setup/GOVERNANCE_POLICIES.md`, `system_setup/PROVENANCE_SYSTEM.md` (archived)  
**ADR:** `docs/adr/adr-003-opportunity-governance.md`

---

## Purpose

This document defines how Nebula Components separates three independent concern layers:

1. **Citable** — open-source observability and discoverability tool. No commercialization hypothesis required.
2. **Nebula customer signals** — independent observations of customer demand, separated from lead PII.
3. **Nebula Components** — the commercial product. Commercialization requires explicit multi-dimensional evidence.

The system prevents technical capability from implying commercial authorization, prevents a single customer request from being treated as validated demand, and preserves historical decisions as auditable records.

---

## Principles

1. Citable may evolve without commercial justification.
2. Citable observations do not imply Nebula product claims.
3. Repeated customer demand is a separate, independently maintained signal source.
4. A single customer request is not commercial evidence.
5. Either signal source may independently trigger investigation.
6. Convergence is optional. It increases confidence when independent provenance is preserved; it does not itself authorize commercialization.
7. Commercialization requires explicit PASS evidence on all seven criteria defined in `commercialization-gates.md`.
8. Missing evidence is INDETERMINATE or INSUFFICIENT, not PASS.
9. Technical capability alone cannot authorize commercialization.
10. Public claims must not exceed their evidence state.
11. Observatory accountability is limited to capabilities Nebula actually commercializes.
12. Historical decisions are auditable through git and ADRs.
13. NONCOMMERCIAL, DORMANT, REJECTED, and INSUFFICIENT_EVIDENCE are valid and complete outcomes.
14. The system must be light enough that a competent operator does not rationally bypass it.

---

## The Three Layers

### Layer 1: Citable (open-source)

**Scope:** Any SEO, AEO, GEO, or adjacent retrieval/citation domain.  
**Authorization model:** None required. Citable explores freely.  
**Evidence home:** `customer-portal/.citable/evidence.yaml` (Citable evidence entries have `signal_source: citable`).  
**What Citable evidence does NOT authorize:**
- Adding a commercial Nebula Component.
- Changing public claims on any Nebula surface.
- Advancing a commercial opportunity.

Citable capabilities that Nebula has not decided to commercialize must not appear on the Observatory without an explicit authoring decision and the `observatory_status` field set to `published`.

### Layer 2: Customer demand signals

**Scope:** Observable patterns from audit reasons, support classification, ICP surveys, interviews, and exit behavior — not individual lead actions.  
**Storage:** `docs/research/customer-demand-signals.jsonl` — append-only, PII-free, git-versioned.  
**What customer signals do NOT authorize:**
- A Nebula Component without a corresponding commercialization gate decision.
- A public claim without a corresponding evidence entry in `CLAIM_REGISTER.md`.

**Minimum threshold for a signal to be a "demand pattern":**

Three or more independent customers expressing the same underlying job/problem across at least two distinct observation sessions. "Three customers" means three distinct economic buyers — not three contacts, users, departments, or accounts that resolve to the same controlling entity.

**Independence requires all of the following:**

1. Each customer is a distinct economic buyer capable of an independent purchase decision.
2. Multiple contacts, users, divisions, or subsidiaries of the same company, group, or controlling entity do not satisfy independence regardless of organizational separation.
3. The customer described the problem without Nebula prompting the description. Customers who responded to a Nebula-authored inquiry — survey, post, event presentation, direct outreach, or any other request for their experience on the specific problem under investigation — are a **prompted cohort** and are not independent for this threshold.
4. "Distinct observation sessions" means sessions with distinct customers present, not two separate contacts with the same customer.

**Demand provenance classes:**

| Class | Meaning | Counts toward C5 independence? |
|---|---|---|
| SPONTANEOUS | Customer described the problem without Nebula prompting | Yes |
| PROMPTED | Customer responded to a Nebula-authored inquiry about the specific problem | No — counts as supporting evidence only (pain characterization, hypothesis refinement) |
| DERIVED | Signal originated from Nebula's own framing, content, or audit output | No |
| UNKNOWN | Provenance of the signal cannot be verified | No — fails closed |

PROMPTED and DERIVED evidence is not worthless. It may support qualitative investigation, pain characterization, and hypothesis refinement. It must not be counted toward the independence threshold for C5.

**OSS adoption metrics are not demand evidence.** GitHub stars, forks, issues, downloads, and contributor enthusiasm for Citable or any open-source project do not constitute customer demand for a commercial product. A customer is a person or organization that would exchange money for the capability.

A single interview session with multiple participants from different organizations may satisfy "multiple customers" if provenance is SPONTANEOUS and the session was not convened in response to a Nebula inquiry. Apply conservative judgment; if in doubt, classify as PROMPTED.

### Layer 3: Convergence

A convergence record (`docs/research/convergence-records.yaml`) explicitly states which Citable signal IDs and customer demand signal IDs point at the same problem domain, whether their provenance is independent, and what the current confidence level is. Convergence increases confidence but is NOT an authorization gate. The commercialization gate must still be passed.

---

## Opportunity Lifecycle

```
UNOBSERVED
    |
    | (Citable observation OR customer signal recorded)
    v
SIGNAL_OBSERVED
    |
    | (Additional observations, convergence assessment)
    v
UNDER_INVESTIGATION   <-- investigation can begin here
    |
    | (Demand validation, economics assessment)
    v
VALIDATION_ACTIVE     <-- bounded validation experiment can begin here
    |
    | (Gate assessment per commercialization-gates.md)
    v
GATE_ASSESSMENT
    |
    +--[any FAIL or INDETERMINATE on required criteria]---> INSUFFICIENT_EVIDENCE
    |                                                             |
    |                                                             | (criteria expire or strategic fit lost)
    |                                                             v
    |                                                           DORMANT (can be reopened)
    |
    +--[FAIL on strategic coherence or economics]------------> REJECTED
    |                                                             (ADR required)
    |
    +--[PASS on all seven criteria]--------------------------> COMPONENT_CANDIDATE
                                                                  |
                                                                  | (explicit founder authorization)
                                                                  v
                                                              COMMERCIALIZED
                                                                  |
                                                                  | (Observatory authoring)
                                                                  v
                                                              OBSERVATORY_PUBLISHED
```

**Terminal states that require an ADR:** REJECTED, COMMERCIALIZED, OBSERVATORY_PUBLISHED, reopening of DORMANT after prior REJECTED determination.

---

## Roles and Authorization

| Action | Required role |
|---|---|
| Recording a signal | Any operator |
| Recording a convergence observation | Any operator |
| Advancing to UNDER_INVESTIGATION | Any operator |
| Authorizing VALIDATION_ACTIVE | Mike (founder) |
| Completing a gate assessment | Mike (founder) |
| Authorizing COMPONENT_CANDIDATE | Mike (founder) + ADR |
| Authorizing COMMERCIALIZED | Mike (founder) + ADR |
| Publishing to Observatory | Mike (founder) + ADR |
| Reopening DORMANT after REJECTED | Mike (founder) + ADR |

---

## File Index

| File | Role | Mutability |
|---|---|---|
| `customer-portal/.citable/evidence.yaml` | Evidence register for commercial claims (with `signal_source` extension) | Append new entries; never edit completed entries |
| `docs/research/customer-demand-signals.jsonl` | PII-free customer demand pattern log | Append-only |
| `docs/research/convergence-records.yaml` | Convergence record between Citable and customer signals | Append new entries; never edit committed records |
| `docs/governance/commercialization-gates.md` | Gate criteria, determinations, and per-opportunity decisions | Extend with new opportunity entries |
| `docs/governance/observatory-boundary.md` | Observatory scope and disclosure obligations | Living document, changes require ADR if policy changes |
| `docs/adr/adr-003-opportunity-governance.md` | Decision record for this system | Immutable after acceptance |
| `customer-portal/docs/governance/CLAIM_REGISTER.md` | Active commercial claims with expiry and Observatory column | Extend; never delete history |
| `docs/product/subtractive-differentiation.md` | What not to build; explicitly frozen list | Governed by its own gate condition |

---

## New Commercial Offer Gate Invariant

**NO NEW COMMERCIAL OFFER MAY ENTER `public-facts.ts` WITHOUT A PRIOR AUTHORIZED PASS COMMERCIALIZATION GATE RECORD.**

### What constitutes a new commercial offer

A new commercial offer is any addition to `public-facts.ts` that:
- Introduces a new offer `key` not present in a prior committed version of that file, or
- Changes the commercial terms (price, delivery method, implementation owner, or re-audit terms) of an existing offer in a way that materially changes the value proposition.

### Grandfathered offers

The following offer keys existed before this governance system was established and are grandfathered. They do not require a retrospective gate record, but any future material change to their commercial terms does:

- `fix-pack` (the $97 One-Leak Repair Sprint, established 2026-07-24)

### Required gate reference

When a new offer key is added to `public-facts.ts`, the corresponding gate record in `docs/governance/commercialization-gates.md` must have:
- `gate_outcome: PASS`
- `adr_ref:` pointing to a committed ADR
- `opportunity_id:` that matches a field in the `public-facts.ts` entry's associated documentation

The `public-facts.ts` file itself should include a comment citing the `opportunity_id` for each non-grandfathered offer key.

### Missing, invalid, or stale gate references

If a new offer key appears in `public-facts.ts` without a matching PASS gate record:
- The state is a governance violation, not a CI error (until I3 is implemented).
- The violation must be corrected by either removing the offer key or writing a retroactive gate record with honest assessor attestation and git-attributable authorship.
- A retroactive gate record is acceptable only if the evidence on which it is based predates the offer's public availability.

### Renamed or restructured offers

Renaming an existing offer key is not a new offer provided the commercial terms are unchanged and the git history makes the lineage clear. A comment in `public-facts.ts` should cite the prior key and the reason for the rename.

### CI enforcement status

**MACHINE-ENFORCED (I3):** `npm run check:opportunity-governance` compares current commercial offer identity with the parent Git revision and requires a corresponding authorized PASS gate record. A new or materially changed offer without that record fails closed.
---

## Control Classification

Each governance control in this system is classified by how it actually enforces behavior:

| Control | Classification | Basis |
|---|---|---|
| `public-facts.ts` + `public-facts.test.ts` | MACHINE-ENFORCED | CI fails if offer facts are structurally invalid or expired |
| `CLAIM_REGISTER.md` + claim-expiry test | MACHINE-ENFORCED | `check-opportunity-governance.mjs` fails expired/overdue governed claims, malformed metadata, evidence regressions, and unsupported published Observatory claims |
| Gate criteria C1-C7 requiring non-circular evidence | PROCESS-ENFORCED | Gate format enforces structural completeness; evidence quality is assessor-attested |
| Observatory authoring gate (`observatory_status` field) | MACHINE-ENFORCED | `check-opportunity-governance.mjs` resolves Observatory evidence references and requires authorized, valid evidence |
| New offer gate invariant (R2) | MACHINE-ENFORCED | `check-opportunity-governance.mjs` compares offer identity to the parent Git revision and validates the gate record |
| `subtractive-differentiation.md` Refuse list check (C7) | PROCESS-ENFORCED | No CI gate; assessor must consult the document |
| Independence and provenance rules (C5) | PROCESS-ENFORCED | Schema captures provenance class; no automated verification |
| Adverse result disclosure obligation | PROCESS-ENFORCED | Policy stated; no automated detection of missing adverse disclosures |
| Convergence independence verification | DOCUMENTARY / DELIBERATIVE | `independence_verified` is self-attested; git history is the audit trail |
| Gate record immutability | DOCUMENTARY / DELIBERATIVE | Convention; git diff detects violations but no CI enforcement |
| Customer demand signal log (append-only) | DOCUMENTARY / DELIBERATIVE | Convention; no CI enforcement of append-only semantics |
| ADR requirement for PASS/REJECTED/COMMERCIALIZED | PROCESS-ENFORCED | Gate record format includes `adr_ref` field; I3 validates `adr_ref` only for offer authorization, but does not enforce every ADR workflow outcome |

**MACHINE-ENFORCED:** A currently running executable test or CI check prevents the prohibited state.  
**PROCESS-ENFORCED:** The rule is documented and operationally required; a competent operator applying the rule correctly will comply; no automated gate prevents bypass.  
**DOCUMENTARY / DELIBERATIVE:** The artifact creates a record and establishes a convention; it does not prevent incorrect behavior, but it makes incorrect behavior visible and attributable.  
**PENDING IMPLEMENTATION:** The enforcement mechanism is designed and specified; it is not yet operational.

Documentary and deliberative controls are not automatically inadequate. At current scale, deliberative governance is appropriate where deterministic enforcement is not yet justified. The classification exists so operators know which controls they are relying on human judgment for.

---



- Day-to-day Citable CLI development and detector releases.
- Architectural decisions about the Nebula platform (governed by `docs/architecture/` ADRs).
- Production claim changes to existing commercialized offers (governed by `CLAIM_REGISTER.md` and `public-facts.ts`).
- Individual lead handling and support responses.
- Pricing changes (governed by `public-facts.ts` + `CLAIM_REGISTER.md`).

---

*This document is the authoritative entry point for the opportunity governance system. It does not replace the claim register, public-facts.ts, or subtractive-differentiation.md; it governs the pre-commercial layer that feeds into them.*
