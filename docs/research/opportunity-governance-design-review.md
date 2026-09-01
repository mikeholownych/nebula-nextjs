# Opportunity Governance — Design Review

**Date:** 2026-09-01  
**Baseline:** `docs/research/opportunity-governance-current-state.md`  
**ADR:** `docs/adr/adr-003-opportunity-governance.md`

This document is the design review. It does not implement code. Implementation (tests, CI changes) follows in a separate phase.

---

## 1. Exact Reuse Mapping

For each of the eleven existing governance controls, the design responsibility it already satisfies, and what changes (if anything).

### `public-facts.ts` + `public-facts.test.ts`

**Already satisfies:** Typed fail-closed source of truth for the active commercial offer. Prevents any offer fact (price, delivery method, implementation owner, re-audit terms) from being exposed to users without explicit structural validation.

**Change:** None. This control governs the commercial layer, not the pre-commercial layer. The new system feeds into it when an opportunity reaches COMMERCIALIZED status and a claim is registered.

**Invariant after design:** No commercial offer fact reaches a public surface unless `getActiveFixPack` returns it from a structurally valid `publicFacts` object. The opportunity governance system ensures that only COMMERCIALIZED opportunities can have facts in this file.

---

### `CLAIM_REGISTER.md`

**Already satisfies:** Active claim inventory with evidence provenance and exclusion log. Documents removed claims with reasons.

**Change (minor extension):** Added `Observatory` column with values `none | pending | published | adverse_disclosed`. Added CI enforcement note for expiry dates. No existing row modified.

**Invariant after design:** Every active commercial claim has a documented evidence link, an expiry decision, and an Observatory status. Adverse results that affect commercially claimed capabilities must appear in the exclusion log with reason code.

---

### `datasets.ts` + `dataset-registry.test.ts`

**Already satisfies:** Prevents denominator drift between published cohort surfaces. Frozen editions are pinned; live aggregates are unpinned. Press-kit figures must agree with the registry.

**Change:** None. Observatory quantitative claims must cite a `DatasetRecord` — this is stated in `observatory-boundary.md` as a disclosure obligation, but the file itself requires no change.

**Invariant after design:** No Observatory quantity claim is published without a corresponding `DatasetRecord` with scope, window, and provenance.

---

### `site-surface-integrity.test.ts`

**Already satisfies:** CI-enforced bans on em-dashes, retired design tokens, stale causal phrases, structural homepage regressions, and the `/billing` link.

**Change:** None now. The claim-expiry test (G7 closure) will be a separate test file.

**Invariant after design:** Surface integrity remains enforced per existing rules. The opportunity governance system adds the claim-expiry check as a separate test.

---

### `subtractive-differentiation.md`

**Already satisfies:** An explicit Refuse list (capabilities Nebula will not build based on competitor research), an Own-now list, and a Develop-later list. Frozen pending its gate condition.

**Change:** None. The commercialization gate at `commercialization-gates.md` (criterion C7) explicitly references this document. Gate assessments must check against the Refuse list. When the gate condition passes, any Develop-later items that have not been explicitly moved to Own-now or Refuse require a separate ADR before gate assessment proceeds.

**Invariant after design:** An item on the Refuse list receives a C7 FAIL at the gate, which terminates the opportunity at REJECTED. The commercialization gate cannot be passed while the Refuse list prohibits the capability.

---

### `finding-defensibility-architecture.md`

**Already satisfies:** Per-capability classification of FACT vs HYPOTHESIS vs PARTIALLY_IMPLEMENTED vs ABSENT. Explicit statement that competitive claims are HYPOTHESIS until independently verified.

**Change:** None. This document feeds into evidence entries in `evidence.yaml` via its FACT classifications. Anything it classifies as HYPOTHESIS or ABSENT is not evidence for a commercialization gate PASS.

**Invariant after design:** A HYPOTHESIS finding in `finding-defensibility-architecture.md` cannot be cited as evidence for C1 (real phenomenon) or C3 (addressability) PASS. Only FACT classifications are eligible evidence.

---

### `.citable/` evidence package format

**Already satisfies:** Immutable evidence runs in `runs/<run-id>/` with checksums. Retention policy stated. Failed runs must be preserved. Never edit completed runs.

**Change:** `customer-portal/.citable/evidence.yaml` entries now include three optional fields: `signal_source`, `demand_state`, `nebula_commercial_consideration`. Existing entries are extended with defaults; their content is unchanged. No run packages are modified.

**Invariant after design:** A Citable evidence entry with `signal_source: citable` and `nebula_commercial_consideration: none` explicitly does not imply Nebula is considering commercialization. The field defaults force an explicit state assignment whenever a Citable entry is referenced in a gate assessment.

---

### AEO harness `prompt-evaluation-contract.json`

**Already satisfies:** Machine-readable acceptance gates for AEO candidates. Fail-closed empty-capture handling. No candidate deployable without factual diff and human approval.

**Change:** None. The vocabulary (`supported`, `partially_supported`, `omitted`, `unsupported`, `contradicted`) is for AI-engine response quality. The opportunity governance vocabulary (`PASS`, `FAIL`, `INDETERMINATE`, `INCOMPARABLE`) is for commercialization criteria. They are parallel, not duplicative. `observatory-boundary.md` states that epistemic labels for Observatory content must use the correct tier.

**Invariant after design:** AEO harness governance remains unchanged. Observatory content about Citable's AEO capabilities must pass AEO acceptance gates before publication — that gate remains the operative control.

---

### `architecture-risk-register.md`

**Already satisfies:** Per-defect records with ID, component, evidence, failure mode, impact, likelihood, severity, recommendation. Best-structured governance artifact in the repository.

**Change:** None. The gate record format in `commercialization-gates.md` deliberately uses a similar structure (opportunity_id, determinations, outcome, rationale, evidence links). No new risk register is created.

**Invariant after design:** Architectural risks remain in `architecture-risk-register.md`. Commercial opportunity gate decisions remain in `commercialization-gates.md`. Different concerns, same formatting discipline.

---

### `schema/sop-005-outcome-measurement.md`

**Already satisfies:** The evidence standard for claiming improvement: statistical thresholds, confounder documentation, customer confirmation, case-study eligibility criteria.

**Change:** None. `sop-005` is the operative standard for any Observatory claim of before/after improvement. `observatory-boundary.md` references it explicitly. Two new SOPs (`sop-006` and `sop-007`) may follow in the implementation phase; they are not in scope for this design.

**Invariant after design:** Before/after comparison claims on the Observatory require SOP-005-level evidence. This is stated in `observatory-boundary.md`. The test in `citable-proof-integrity.test.ts` enforces it for case studies.

---

### `analytics-registry` + `analytics-governance.test.ts`

**Already satisfies:** Canonical event allowlist with privacy classification and prohibited properties. Rejects unknown events, prohibited fields, and invalid failure reasons.

**Change:** None. The analytics registry governs operational funnel telemetry. Customer demand signals are a separate layer (`docs/research/customer-demand-signals.jsonl`) that must not be conflated with funnel events.

**Invariant after design:** The analytics registry governs what is measured in the funnel. The demand signal log records what patterns are observed across customers. The two never mix.

---

## 2. Gap Closure Mapping

### G1: No separation between Citable observations and Nebula product claims

**Closed by:**  
- `customer-portal/.citable/evidence.yaml` extended with `signal_source` and `nebula_commercial_consideration` fields.
- `docs/governance/opportunity-governance.md` Section "The Three Layers" defines the separation.
- `docs/adr/adr-003-opportunity-governance.md` records the separation decision.

**Residual risk:** A Citable entry with `signal_source: citable` could still be cited in a gate assessment as if it implied commercial demand. The gate format requires explicit evidence IDs; a Citable-only evidence ID satisfies C3 (addressability) but not C5 (demand). The criteria design prevents conflation.

---

### G2: No customer demand signal log

**Closed by:**  
- `docs/research/customer-demand-signals.jsonl` — append-only, PII-free, with schema documentation and minimum independence threshold.
- Schema comment explicitly prohibits treating a single-session observation as "pattern" demand.
- Independence rules prevent customers reached through the same Nebula framing from being counted as independent.

**Residual risk:** Entries could be written with optimistic `independent_customer_count` values. Git history makes the sequence observable; the schema comment states "if in doubt, record the lower bound."

---

### G3: No convergence record

**Closed by:**  
- `docs/research/convergence-records.yaml` — links Citable signal IDs and demand signal IDs with explicit `independence_verified` flag.
- `relationship` field distinguishes co-directional, corroborating, and unverified-independence cases.
- A convergence record is explicitly NOT an authorization gate. It is observational.

**Residual risk:** An operator could record a convergence with `independence_verified: true` when independence is uncertain. The `independence_rationale` field makes the reasoning visible in git history.

---

### G4: No commercialization gate

**Closed by:**  
- `docs/governance/commercialization-gates.md` — seven criteria (C1-C7) with per-criterion determination vocabulary and minimum thresholds.
- Gate record format in the same file requires evidence IDs and explicit determinations.
- INDETERMINATE and INCOMPARABLE are explicit stopping states; they are not silent PASS.
- Gate decisions are immutable once written (new record supersedes prior one by reference).

**Residual risk:** The gate could be passed without genuine evidence if the assessor writes optimistic determinations. Git authorship and the requirement for evidence_id references make this traceable. ADR-003 states that gate-passing requires an ADR, which forces an additional commit and rationale.

---

### G5: No Observatory boundary document

**Closed by:**  
- `docs/governance/observatory-boundary.md` — defines covered capabilities, disclosure obligations, adverse-result handling, and authoring gate.
- States that Citable capability does not imply Observatory publication.
- States that adverse/inconclusive results must appear in the exclusion log.
- Boundary violation patterns enumerated.

**Residual risk:** The authoring gate requires `observatory_status: publishing_authorized` in `evidence.yaml`, which is not yet CI-enforced. The implementation phase must add this check.

---

### G6: No ADR for product-governance decisions

**Closed by:**  
- `docs/adr/adr-003-opportunity-governance.md` — the system's own ADR, establishing the governance separation.
- ADR-003 defines when a future product-governance ADR is mandatory (seven trigger conditions).
- ADRs live in `docs/adr/` using the same format as the existing architecture ADRs.

**Residual risk:** The ADR requirement is stated in the document but not CI-enforced. An operator could advance an opportunity to COMMERCIALIZED without writing an ADR. Enforcement is through the gate record format which includes `adr_ref: null` — a null value for a PASS outcome is a visible violation.

---

### G7: Claim registry expiry is not CI-enforced

**Closed by (design, not yet implemented):**  
- `CLAIM_REGISTER.md` now includes an explicit CI enforcement note on the expiry rule.
- Implementation phase: a test in `customer-portal/__tests__/claim-expiry.test.ts` that parses `CLAIM_REGISTER.md`, extracts rows where Expiry is a date (not `-`), and fails if any active claim's expiry date is in the past.

**Residual risk:** The test is not yet written. Until it is, the gap is partially closed (the document says CI should enforce it) but not fully closed (CI does not yet enforce it). This is the only gap that requires a production-code change.

---

## 3. Files Created

| File | Purpose |
|---|---|
| `docs/governance/opportunity-governance.md` | System entry point; principles, lifecycle, roles |
| `docs/governance/commercialization-gates.md` | Seven criteria, gate determinations, gate record format |
| `docs/governance/observatory-boundary.md` | Disclosure obligations; what Observatory covers and doesn't |
| `docs/adr/adr-003-opportunity-governance.md` | Product-governance decision record |
| `docs/research/customer-demand-signals.jsonl` | Append-only PII-free demand pattern log |
| `docs/research/convergence-records.yaml` | Convergence record between Citable and demand signals |
| `.legacy/GOVERNANCE_POLICIES_PROVENANCE_SYSTEM_ARCHIVE_NOTE.md` | Archive rationale for superseded system_setup docs |
| `.legacy/system_setup_GOVERNANCE_POLICIES_aspirational.md` | Archived copy |
| `.legacy/system_setup_PROVENANCE_SYSTEM_aspirational.md` | Archived copy |

---

## 4. Files Extended

| File | Change |
|---|---|
| `customer-portal/.citable/evidence.yaml` | Added `signal_source`, `demand_state`, `nebula_commercial_consideration` to all entries with documented defaults |
| `customer-portal/docs/governance/CLAIM_REGISTER.md` | Added `Observatory` column to active claim tables; added CI enforcement note; added Observatory column semantics |
| `system_setup/GOVERNANCE_POLICIES.md` | Added SUPERSEDED banner at top |
| `system_setup/PROVENANCE_SYSTEM.md` | Added SUPERSEDED banner at top |

---

## 5. Files That Must Remain Untouched

| File | Why |
|---|---|
| `customer-portal/app/lib/public-facts.ts` | Governs commercial offer facts; no change required |
| `customer-portal/app/lib/datasets.ts` | Dataset registry; referenced by observatory-boundary but not changed |
| `docs/product/subtractive-differentiation.md` | Governs its own gate condition; referenced by C7 but not changed |
| `docs/product/finding-defensibility-architecture.md` | Per-capability FACT/HYPOTHESIS classification; referenced but not changed |
| `aeo_harness/prompt-evaluation-contract.json` | AEO governance; separate domain |
| `customer-portal/config/analytics-registry.json` | Funnel event governance; separate domain |
| `schema/sop-005-outcome-measurement.md` | Outcome measurement standard; referenced but not changed |
| All `.citable/runs/` packages | Immutable evidence packages; never edit |
| `docs/architecture/architecture-risk-register.md` | Architectural risks; separate domain |

---

## 6. CI Changes Required (Implementation Phase)

**Not implemented yet. Design only.**

### 6a. Claim expiry enforcement

**File:** `customer-portal/__tests__/claim-expiry.test.ts`  
**Approach:** Parse `CLAIM_REGISTER.md`, extract rows where the `Expiry` column contains a date pattern (`YYYY-MM-DD`), compare against `new Date()`, and fail if any active claim's expiry is in the past.  
**Edge case:** Claims with `-` in the Expiry column have no scheduled expiry and must pass silently.  
**Edge case:** Claims in the Excluded Claims section must not trigger the check (they are already removed).

### 6b. Observatory authoring gate

**File:** Extension to `customer-portal/__tests__/citable-proof-integrity.test.ts` or a new `observatory-authoring-gate.test.ts`  
**Approach:** Any evidence entry referenced by a live Observatory page must have `observatory_status: publishing_authorized` in `evidence.yaml`. This is not yet in the schema but must be added in the implementation phase.

### 6c. CI workflow placement

Both tests belong in the existing `ci.yml` Jest suite. They run on every push to main. No new workflow file is needed.

---

## 7. Privacy Implications

**`docs/research/customer-demand-signals.jsonl`**

This file must never contain personal data. The schema enforces this by:
- Having no `email`, `name`, or `company` fields.
- Using `independent_customer_count` (a number) instead of a customer list.
- The `pii_free_notes` field name signals the prohibition.

Risk: An operator writes a note containing "John Smith from Acme said…". Mitigation: the field name is explicit; schema comment warns against it. A future CI linter could scan for email patterns in the file.

**`docs/research/convergence-records.yaml`**

No customer identity in this file. References are to signal IDs, not individuals.

**`customer-portal/.citable/evidence.yaml`**

The three new fields contain no personal data. Governance metadata only.

---

## 8. Failure Modes

| Mode | Description | Mitigation |
|---|---|---|
| Governance theater | Gate records are written with optimistic determinations to satisfy process rather than evidence | Evidence IDs must exist and be traceable; git authorship makes the assessor visible |
| Independence inflation | Customer demand signals recorded as "independent" when customers shared a common framing prompt | Schema independence rules; `independence_verified` flag; git history shows sequence |
| Single-request escalation | One customer request is recorded, evidence_id added, gate written as INDETERMINATE, opportunity advances to VALIDATION_ACTIVE on founder enthusiasm | Gate format requires explicit determination per criterion; INDETERMINATE on C5 blocks gate pass |
| Stale claim silent persistence | A claim with a future expiry date is written today and never reviewed when it expires | Claim-expiry CI test catches this; until that test is implemented, the risk remains partially open |
| Observatory scope creep | A Citable capability gets added to the Observatory without going through the gate | Observatory authoring gate check (implementation phase) catches this; `observatory-boundary.md` makes the violation visible |
| Convergence as authorization | A convergence record is cited as sufficient evidence to pass the gate | Convergence records explicitly state they do not authorize commercialization; gate format requires per-criterion evidence, not a convergence record |
| System abandonment | The system is added but never used because it requires more effort than the decision it governs | The gate format is intentionally minimal: one YAML block, linked evidence IDs, one-line rationale per criterion. Lightweight enough to write in 15 minutes. |

---

## 9. Bypass Vectors

An operator could bypass this system by:

1. **Committing product changes that imply commercialization without a gate record.** Mitigation: CI tests (`public-facts.test.ts`, `one-leak-repair-sprint-offer.test.ts`) would fail if an offer changes without corresponding `public-facts.ts` changes. The gate record is the upstream control; CI is the downstream enforcement.

2. **Writing a gate record after the commercialization decision, not before.** Mitigation: Git history makes the sequence observable. The ADR requirement creates a separate commit that establishes the decision date.

3. **Treating INDETERMINATE as "good enough" and proceeding.** Mitigation: The gate format is explicit that any INDETERMINATE on a required criterion blocks the gate. The gate outcome field must be set to `INSUFFICIENT_EVIDENCE`, not `PASS`.

4. **Using the convergence record as authorization.** Mitigation: `convergence-records.yaml` has a schema comment explicitly stating it does not authorize commercialization. The gate record requires per-criterion determinations with independent evidence IDs.

5. **Writing demand signals with inflated customer counts.** Mitigation: Schema comment states "if in doubt, record the lower bound." Git authorship is visible. A future reviewer can ask "how was this count verified?"

---

## 10. Controls Preventing Enthusiasm Substituting for Evidence

The design principle is: enthusiasm can trigger investigation, but cannot produce PASS determinations.

Specifically:
- **Founder intuition** is listed in `commercialization-gates.md` as explicitly NOT a gate. It is not evidence for any criterion.
- **A single customer request** satisfies C5 with `independent_customer_count: 1`, `demand_state: observed`. The minimum for `demand_state: pattern` is three independent customers. The gate cannot PASS with `demand_state: observed` on C5.
- **Citable capability** satisfies C3 (addressability) partially but does not satisfy C1, C2, C4, C5, C6, or C7.
- **Competitor existence** is in the Refuse list check (C7) but not affirmative evidence for C1-C6.
- **Industry trends** are external research that might inform C1 evidence but cannot satisfy C1 alone.

The seven criteria cannot all be satisfied without evidence from sources independent of Nebula's own product framing.

---

## 11. What Is Intentionally NOT Being Built

The following were considered and explicitly excluded:

- **A new database table** for governance. File-based git-versioned records are sufficient and more auditable.
- **An opportunity scoring system.** Numerical scores invite gaming. PASS/FAIL/INDETERMINATE/INCOMPARABLE with documented rationale is more honest.
- **A workflow service or state machine.** The lifecycle states are documented conventions, not enforced transitions. The system is small enough that enforcement through ADRs and CI tests is sufficient.
- **A second evidence package format.** `.citable/evidence.yaml` is extended, not replaced.
- **A separate claims database.** `CLAIM_REGISTER.md` + `public-facts.ts` govern commercial claims.
- **An automated demand signal aggregator.** Automation that writes demand signals without human interpretation would contaminate the log with unverified counts. Human authorship is required.
- **A roadmap surface.** The opportunity governance system exists to gate commercialization, not to communicate intent. Opportunities at UNDER_INVESTIGATION or DORMANT do not appear publicly.
- **SOPs 006 and 007.** The design recommends them but they are not in scope for this phase. `sop-005-outcome-measurement.md` covers the downstream outcome measurement; the upstream demand validation can follow the same format when the first real opportunity is assessed.
- **Integration with the lead pipeline or analytics ledger.** Customer demand signals are research artifacts, not operational data.

---

*Design complete. No production code implemented. Implementation phase follows.*
