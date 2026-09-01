# Opportunity Governance — Design Remediation

**Date:** 2026-09-01  
**Based on:** `docs/research/opportunity-governance-adversarial-review.md` (commit a79f3a76b)  
**Remediates:** Design defects identified as P0 corrections before implementation  
**This commit does not implement CI enforcement (I1/I2/I3). Design corrections only.**

---

## Summary

All four P0 corrections (R1-R4) applied. C4 price-anchor defect corrected. C3 evidentiary boundary made explicit. Control classification table added to system entry point.

---

## R1 — Observatory Authoring Gate (P0)

**Problem:** `observatory-boundary.md` claimed `citable-proof-integrity.test.ts` enforces the Observatory authoring gate. That test does not check `observatory_status`. The field did not exist in the codebase. The claim was false.

**Disposition:**

1. `docs/governance/observatory-boundary.md` — replaced the false enforcement claim with accurate text:
   - `citable-proof-integrity.test.ts` enforces case-study governance only; it does **not** enforce `observatory_status`.
   - The Observatory authoring gate is explicitly classified as PENDING IMPLEMENTATION (I2) until the CI test is written.
   - `observatory_status` field is now fully defined with its two valid values (`not_applicable`, `publishing_authorized`) and the conditions required before `publishing_authorized` may be set.

2. `customer-portal/.citable/evidence.yaml` — `observatory_status` field added to schema documentation and to all four existing entries (default `not_applicable`).

**Verification:** No document now claims `observatory_status` is CI-enforced. The field exists in the schema. All existing entries default to `not_applicable`.

---

## R2 — New Commercial Offer Bypass (P0)

**Problem:** A structurally valid new offer key could be added to `public-facts.ts` without a prior PASS gate record. The prose connection between gate records and offer keys was not enforced.

**Disposition:**

`docs/governance/opportunity-governance.md` — new section "New Commercial Offer Gate Invariant" added, defining:

- What constitutes a new commercial offer vs a restructured existing offer.
- Grandfathered offers: `fix-pack` (established 2026-07-24, pre-governance).
- Required gate record fields for any new non-grandfathered offer key.
- What a missing, invalid, or stale gate reference means and how to remediate it.
- How retroactive gate records are treated (acceptable only if evidence predates the offer's public availability).
- Rename/restructure distinction.
- CI enforcement explicitly marked PENDING IMPLEMENTATION (I3).

**Verification:** The invariant "NO NEW COMMERCIAL OFFER MAY ENTER `public-facts.ts` WITHOUT A PRIOR AUTHORIZED PASS COMMERCIALIZATION GATE RECORD" is now stated explicitly. The design provides a deterministic future CI linkage: gate records in `commercialization-gates.md` use `opportunity_id`; `public-facts.ts` entries should cite the matching `opportunity_id` in a comment.

---

## R3 — C5 Independence Definition (P0)

**Problem:** The C5 independence definition was too narrow, allowing:
- Three contacts from the same economic entity to satisfy "three customers" (A3).
- Customers responding to Nebula-authored prompts to count as independent (A9).
- "Two sessions" to be satisfied by two conversations with the same customer (A1).
- "Behavioral or strong stated evidence" to allow purely stated preference to satisfy the demand criterion (C5 ambiguity).

**Disposition:**

1. `docs/governance/opportunity-governance.md` Layer 2 — rewritten minimum threshold section. Now defines:
   - "Three customers" = three distinct economic buyers, not three contacts.
   - Demand provenance table (SPONTANEOUS / PROMPTED / DERIVED / UNKNOWN).
   - Only SPONTANEOUS counts toward the independence threshold.
   - UNKNOWN fails closed.
   - PROMPTED and DERIVED evidence is not worthless; may support investigation and pain characterization, but not counted toward independence.
   - OSS adoption metrics explicitly excluded as commercial demand evidence.
   - "Distinct sessions" means sessions with distinct customers present.

2. `docs/governance/commercialization-gates.md` C5 — rewritten to be consistent with the Layer 2 definition:
   - "Distinct economic buyers" instead of "independent customers."
   - Provenance table reproduced.
   - PASS requires SPONTANEOUS provenance (behavioral evidence required unless stated intent is well-documented and explicitly not prompted).
   - FAIL now explicitly covers PROMPTED/DERIVED signals and same-economic-entity contacts.
   - INDETERMINATE now requires UNKNOWN provenance to fail closed.

3. `docs/research/customer-demand-signals.jsonl` — schema updated:
   - New field `demand_provenance` with four values (SPONTANEOUS / PROMPTED / DERIVED / UNKNOWN).
   - `independent_customer_count` documentation clarified: "count of distinct economic buyers, not contacts."
   - Rules updated: PROMPTED, DERIVED, and UNKNOWN do not count toward threshold.
   - OSS adoption metrics explicitly excluded in rule 4.

**Verification:** Three contacts from one company now explicitly cannot satisfy C5. Customers responding to Nebula-authored prompts are explicitly classified as PROMPTED. UNKNOWN provenance fails closed.

---

## R4 — Aspirational Document Authority (P0)

**Problem:** `.legacy/` is gitignored; the archive note and copies were not committed. The SUPERSEDED banners were written to the submodule working tree but cannot be committed from the parent. A future operator cloning without the submodule would see no supersession notice for `system_setup/GOVERNANCE_POLICIES.md` and `system_setup/PROVENANCE_SYSTEM.md`.

**Disposition:**

1. `AGENTS.md` — new "Governance Authority Note" section appended. States explicitly:
   - `system_setup/GOVERNANCE_POLICIES.md` and `system_setup/PROVENANCE_SYSTEM.md` are aspirational, never-operationalized artifacts.
   - They are NOT authoritative Nebula operational governance.
   - Lists the authoritative governance files tracked in this repository.

2. `CLAUDE.md` — one line added to "What NOT to Do" section identifying both files as non-authoritative and pointing to the authoritative locations.

Both changes are tracked in the parent repository, visible without submodule checkout, and minimal.

**Submodule note:** `system_setup` is a degenerate submodule (tracked as a commit pointer with no `.gitmodules`). SUPERSEDED banners were written to its working tree during the design phase but cannot be committed from the parent. The parent-repository notices in `AGENTS.md` and `CLAUDE.md` are the sufficient and committed resolution. Do not modify the submodule.

**Verification:** Any operator reading `AGENTS.md` or `CLAUDE.md` (standard first-read files) will see the non-authority statement before encountering the `system_setup/` documents.

---

## C4 — Customer ROI Potential (Price Anchor Defect)

**Problem:** C4 PASS definition said "at a price point Nebula can charge" — allowing Nebula to choose a convenient hypothetical price and then declare customer economics support that price. This lets Nebula's pricing preferences satisfy its own ROI gate.

**Disposition:**

`docs/governance/commercialization-gates.md` C4 — corrected:

- C4 is now explicitly separated from C6 ("C4 evaluates the customer's economics independently. C6 evaluates Nebula's ability to sustainably deliver and capture value. These must not be collapsed.").
- Added explicit "What Nebula cannot do to satisfy C4" list: cannot choose a hypothetical low price; cannot reverse-engineer from margin targets; cannot substitute Nebula's modeled revenue projection.
- Added "Acceptable evidence forms" list: customer-named willingness to pay, customer-accepted proposed price, observable current spend on alternatives, measurable economic value with defensible customer-side capture assumption, validated purchasing behavior.
- PASS threshold rewritten: now requires "at a price the customer has named, accepted, or demonstrated willingness to pay for comparable value" — not Nebula-set.
- INDETERMINATE threshold updated: "willingness to pay has not been demonstrated."

**Verification:** C4 and C6 remain distinct. C4 cannot PASS solely because Nebula selects a convenient hypothetical price.

---

## C3 — Addressability (Evidentiary Boundary Clarification)

**Problem:** The adversarial review identified that C3 PASS required only a written description of an intervention. There was no explicit statement of what C3 PASS does and does not establish, leading to risk of over-interpretation.

**Disposition:**

`docs/governance/commercialization-gates.md` C3 — added explicit boundary:

> "What C3 PASS establishes at investigation stage: A credible, addressable intervention hypothesis exists. Nothing more."

Added explicit list of what C3 PASS does NOT establish: implementation feasibility, production readiness, repeatability, scalability, delivery economics, customer outcome.

C3 requirements are NOT strengthened. No prototype or feasibility test is required at investigation stage. This is a clarification only.

---

## Control Classification

`docs/governance/opportunity-governance.md` — new "Control Classification" section added classifying every material governance control as:

- MACHINE-ENFORCED
- PROCESS-ENFORCED
- DOCUMENTARY / DELIBERATIVE
- PENDING IMPLEMENTATION

No control is misrepresented as machine-enforced. All three pending CI tests (I1/I2/I3) are explicitly labeled PENDING IMPLEMENTATION.

---

## Files Changed

| File | Change |
|---|---|
| `docs/governance/opportunity-governance.md` | R3 independence definition; R2 new offer gate invariant; control classification table |
| `docs/governance/commercialization-gates.md` | C3 boundary clarification; C4 price-anchor correction; C5 independence rewrite |
| `docs/governance/observatory-boundary.md` | R1 false enforcement claim removed; `observatory_status` field defined; enforcement marked PENDING |
| `customer-portal/.citable/evidence.yaml` | R1: `observatory_status` field added to schema docs and all four entries |
| `docs/research/customer-demand-signals.jsonl` | R3: `demand_provenance` field added; independence rules clarified; OSS exclusion added |
| `AGENTS.md` | R4: Governance Authority Note appended |
| `CLAUDE.md` | R4: One-line supersession notice added to "What NOT to Do" |

---

## Verification of Twelve Required Conditions

| # | Condition | Status |
|---|---|---|
| 1 | No document falsely claims `observatory_status` is currently CI-enforced | PASS — enforcement explicitly labeled PENDING IMPLEMENTATION (I2) |
| 2 | `observatory_status` now has a defined representation | PASS — defined in `evidence.yaml` schema and `observatory-boundary.md` |
| 3 | New commercial offers explicitly require a prior PASS gate record | PASS — documented in `opportunity-governance.md` New Commercial Offer Gate Invariant section |
| 4 | Design provides a deterministic future CI linkage between offer and gate | PASS — `opportunity_id` cross-reference path defined; CI test I3 specified |
| 5 | C5 independence means distinct economic buyers | PASS — "three distinct economic buyers" explicit; same-entity contacts excluded |
| 6 | Prompted cohorts cannot masquerade as independent spontaneous demand | PASS — PROMPTED provenance class defined; explicitly excluded from C5 threshold |
| 7 | UNKNOWN provenance fails closed where independence is required | PASS — stated in provenance table and C5 INDETERMINATE definition |
| 8 | C4 cannot PASS merely because Nebula selects a convenient hypothetical price | PASS — "What Nebula cannot do to satisfy C4" list is explicit |
| 9 | C4 and C6 remain distinct | PASS — "Separation from C6" note added to C4; both criteria untouched in C6 |
| 10 | C3's evidentiary meaning is explicitly bounded | PASS — "What C3 PASS does NOT establish" list added |
| 11 | AGENTS.md and CLAUDE.md establish parent repository governance authority | PASS — supersession notices committed to both files |
| 12 | Documentary controls are not represented as machine enforcement | PASS — control classification table distinguishes all four classes |

---

## Tests Run

Existing Jest tests verified against modified files:

- `customer-portal/__tests__/citable-proof-integrity.test.ts` — no changes to behavior expected; test does not reference `observatory_status`.
- `customer-portal/__tests__/citable-information-architecture.test.ts` — no changes to behavior expected.
- `customer-portal/__tests__/evidence-atoms.test.ts` — no changes to behavior expected.

Python tests not run for this pass (documentation-only changes; no Python files modified).

---

## Remaining Implementation Work

The following CI enforcement items remain PENDING IMPLEMENTATION:

| ID | What | File to create/extend |
|---|---|---|
| I1 | Claim-expiry CI test — fail if any active claim has past-dated expiry | `customer-portal/__tests__/claim-expiry.test.ts` |
| I2 | Observatory authoring gate — fail if Observatory content references evidence entry without `observatory_status: publishing_authorized` | Extension to `citable-proof-integrity.test.ts` or new `observatory-authoring-gate.test.ts` |
| I3 | New offer gate cross-reference — fail if new offer key in `public-facts.ts` lacks matching PASS gate record | New test + `commercialization-gates.md` machine-parseable gate decisions |

None of I1/I2/I3 are implemented in this commit.

---

## Subtractive-Differentiation Gate

The subtractive-differentiation gate condition ("500 stamped production audits AND 14 days after 2026-08-31 22:00 UTC") is NOT evaluated, modified, or acted upon in this commit.

Production audit count: 766 as of 2026-09-01 (analytics_event_ledger, non-synthetic, environment=production). Gate evaluation and any reopening of frozen items require a separate explicit decision by Mike (founder). This commit does not trigger, authorize, or imply that evaluation.

---

*Design corrections complete. No production code changed. Implementation phase follows separately.*
