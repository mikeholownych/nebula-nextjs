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

**Minimum threshold for a signal to be "repeated":** Three or more independent customers expressing the same underlying job/problem across at least two distinct observation sessions. A single interview session with multiple participants does not satisfy independence.

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

## What This System Does NOT Govern

- Day-to-day Citable CLI development and detector releases.
- Architectural decisions about the Nebula platform (governed by `docs/architecture/` ADRs).
- Production claim changes to existing commercialized offers (governed by `CLAIM_REGISTER.md` and `public-facts.ts`).
- Individual lead handling and support responses.
- Pricing changes (governed by `public-facts.ts` + `CLAIM_REGISTER.md`).

---

*This document is the authoritative entry point for the opportunity governance system. It does not replace the claim register, public-facts.ts, or subtractive-differentiation.md; it governs the pre-commercial layer that feeds into them.*
