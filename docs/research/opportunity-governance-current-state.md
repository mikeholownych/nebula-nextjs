# Opportunity Governance - Current State Inventory

**Date:** 2026-09-01
**Scope:** Read-only discovery pass. No code modified. No production systems touched.
**Purpose:** Inventory what exists before designing the governance system that separates Citable, Nebula customer signals, convergence, and controlled commercialization.

---

## 1. Executive Assessment

The repository contains substantially more governance infrastructure than a comparable solo-founder product at this stage. The foundations worth reusing are real. The gaps are real too, and they are specific.

**What already works as governance:**

- A claim registry with evidence provenance, expiry dates, and an exclusion log documenting what was removed and why.
- A typed `public-facts.ts` module enforced by tests that fails closed if any required fact is missing or structurally invalid.
- A dataset registry that distinguishes frozen editions from live aggregates, preventing silent denominator drift.
- A `site-surface-integrity.test.ts` suite that fails CI on em-dashes, retired design tokens, stale causal phrases, and structural homepage regressions.
- A `subtractive-differentiation.md` doctrine with an explicit gate condition and freeze status.
- Citable's own evidence package format (`runs/<run-id>/`) with a stated retention policy, immutability contract, and tamper-evident checksums.
- An AEO harness with a machine-readable `prompt-evaluation-contract.json`, fail-closed empty-capture semantics, and acceptance gates that require human approval before any candidate is deployable.
- An append-only `aidlc-docs/audit.md` interaction log.
- An architecture risk register (`architecture-risk-register.md`) with ID, component, evidence, failure mode, impact, likelihood, and severity per defect.

**What does not exist yet:**

- A machine-readable register of research signals by source (Citable observation vs customer behavior vs external intelligence) with explicit convergence status.
- A commercialization gate — a formal record that separates "Citable can do this technically" from "Nebula has validated customer demand" from "Nebula has decided to commercialize."
- An evidence-state vocabulary for research findings (analogous to the claim statuses in `prompt-evaluation-contract.json`): `observed`, `replicated`, `hypothesis`, `invalidated`, `insufficient_data`.
- A customer signal log distinct from the lead pipeline — a place that records demand observations (patterns in audit reasons, support intent patterns, feature requests) without conflating them with lead state.
- A formal Observatory disclosure boundary document — the present `subtractive-differentiation.md` is close but scoped to competitive behavior, not to the Observatory's public evidence claims.
- Convergence tracking: no record links a Citable environmental observation to a Nebula customer signal.

---

## 2. Existing Relevant Architecture

### 2.1 Citable (open-source tool layer)

**Location:** `.citable/` at repo root and `customer-portal/.citable/`
**Format:** YAML registries (`claims.yaml`, `evidence.yaml`, `experiments.yaml`, `entities.yaml`, `pages.yaml`, `queries.yaml`, `crawlers.yaml`, `competitors.yaml`, `interventions.yaml`, `metrics.yaml`, `objectives.yaml`)

The root-level `.citable/` is largely empty (no entries in `claims.yaml` or `entities.yaml`).
The `customer-portal/.citable/` is active and has real entries.

**Evidence package format** (`runs/<run-id>/`): immutable once committed, with manifest, findings, report, headers, robots/sitemap observations, checksums, and human-readable report. The `EVIDENCE_RECORDS.md` states the retention policy explicitly: never edit a completed run in place; new run when target/detector/date changes; preserve failed runs.

**`sync-citable-projection.yml`** CI workflow: runs daily at 06:17, syncs the public projection of the Citable package into `data/citable-release.json` and `public/llms.txt`, opens a PR on drift, and verifies the `citable-projection.test.ts` passes. This is automated evidence-state tracking for the Citable public surface.

### 2.2 Claim and Evidence Registries (Nebula product claims)

**Location:** `customer-portal/docs/governance/CLAIM_REGISTER.md`
**Format:** Markdown table with: Claim | Evidence | Source | Date | Approval | Expiry | Used In

Contains an **exclusion log** documenting what was removed, the reason, and when. The $147 entry is notable: it documents a real incident where a stale claim enabled a live price discrepancy that went unreviewed for weeks.

**Enforcement:** `customer-portal/app/lib/public-facts.ts` is the typed runtime source of truth for offer facts. `public-facts.test.ts` exhaustively tests it: each required field must be present and structurally valid; each mutation that would produce an invalid or expired offer must cause `getActiveFixPack` to return null.

### 2.3 Dataset Registry

**Location:** `customer-portal/app/lib/datasets.ts`
**Format:** TypeScript `DatasetRecord[]` with `kind: 'frozen-study' | 'live-aggregate'`, `sampleSize: number | null`, `collectionWindow`, `asOf`, `relationship`

Enforced by `dataset-registry.test.ts`: all IDs declared, every record has scope/window/provenance/sourcePath, frozen editions are pinned, live aggregate is unpinned, and the press-kit record agrees with the registry.

### 2.4 Product Doctrine Documents

**`docs/product/subtractive-differentiation.md`** (bound 2026-08-31)
- Explicit `Refuse` list (what not to build from competitor research).
- `Own now` list.
- `Develop later` list.
- A named gate condition: "500 stamped production audits AND 14 days after 2026-08-31 22:00 UTC."
- "Adopt-nothing from a competitor review is a successful outcome."
- Frozen until the gate is passed.

**`docs/product/finding-defensibility-architecture.md`** (2026-08-31)
- Per-capability state: FACT vs HYPOTHESIS, PARTIALLY_IMPLEMENTED vs ABSENT.
- Explicit competitive claim classification.
- "Do not compete on check count. Do not ship another score. Do not change T0 marketing."

### 2.5 AEO / Observability Harness

**Location:** `aeo_harness/`
**Key files:** `prompt-evaluation-contract.json`, `reference_claims.json`, `citation_schema.json`, `aeo_eval.py`, `semantic_judge.py`, `citation_metrics.py`

The harness has:
- Dev corpus (working set, used to author candidates) and holdout corpus (frozen, never used to author).
- Fail-closed empty-capture handling (`status: no_data`, never `zero visibility`).
- Machine-readable acceptance gates: no candidate is deployable without factual diff, rendered QA, and human approval.
- Weekly capture runs producing `reports/ai_visibility/captures.jsonl`.

The `prompt-evaluation-contract.json` defines evidence state for AI-engine responses: `supported`, `partially_supported`, `omitted`, `unsupported`, `contradicted`.

### 2.6 Analytics Event Registry

**Location:** `customer-portal/config/analytics-registry.json`, `customer-portal/app/lib/analytics-registry.ts`
**Format:** 18 canonical events with `stage`, `source_of_truth`, `privacy_classification`, required/optional properties, and prohibited property set.

Enforced by `analytics-governance.test.ts`: registry loads, all core funnel events present, unknown events rejected, prohibited properties blocked, invalid failure reasons rejected.

### 2.7 SOPs and Canonical Schema

**Location:** `schema/`
- `canonical.sql` defines a prospect lifecycle state machine with 11 ordered states (`audience` through `case_study_eligible`), a `consent_status` enum, and an `outcomes` table with a `conclusion` enum.
- `sop-005-outcome-measurement.md` defines the evidence standard for claiming improvement: specific statistical threshold, confounder documentation, customer confirmation before publication, separate consent for case-study use, `case_study_eligible` criteria.

### 2.8 Architecture Decision Records

**Location:** `docs/architecture/`
- `adr-001-identity-provider-revised.md`
- `adr-002-redis-sessions-rate-limiting.md`
Two ADRs; both are implementation decisions, not product-governance decisions.

### 2.9 Risk Register

**Location:** `customer-portal/docs/architecture/architecture-risk-register.md`
35 entries (R01-R35) with: ID, Component, Finding, Evidence, Failure Mode, Impact, Likelihood, Severity, Recommendation. This is the best-structured governance artifact in the repository. The format and discipline here should be the model for the new opportunity-risk register.

### 2.10 Customer Research Artifacts

**`cookiy_research/report_offer_perception.md`:** N=3 qualitative interviews from July 2026. Evidence class: primary qualitative. Findings are structured per objective with frequency and confidence assessments. Evidence is quoted. Observed vs hypothetical distinction is explicit. Limitations noted ("insufficient to generalize").

**`docs/icp-survey-aug2026.md`:** Draft ICP survey emails targeting actual audit completers. Status: draft intent, no recorded responses.

**`docs/research/customer-review-analysis.md`:** Exists (not fully read — path confirmed). Competitor reviews from public platforms.

**`aidlc-docs/audit.md`:** Append-only interaction log. Documents decisions, inputs, and actions in chronological order. Carries operational and strategic context.

### 2.11 Test Suite Enforcing Doctrine

**Tests that currently enforce product/evidence governance:**
| Test file | What it enforces |
|---|---|
| `site-surface-integrity.test.ts` | Em-dashes banned; homepage compressed to diagnostic sequence; stale causal phrases banned; retired teal banned; `/billing` link banned |
| `one-leak-repair-sprint-offer.test.ts` | Offer type, price, evidence boundary wording, forbidden legacy language |
| `public-facts.test.ts` | All offer fact fields; fail-closed on any invalid or expired field |
| `dataset-registry.test.ts` | All datasets declared; frozen pinned; live unpinned; press-kit agreement |
| `homepage-evidence-consistency.test.ts` | No hard-coded score; proof boundary language present |
| `citable-proof-integrity.test.ts` | Claim compilation from registries; case studies require governed claims with valid evidence |
| `evidence-atoms.test.ts` | Retired claims fail closed; undeclared surface slots return null |
| `analytics-governance.test.ts` | Canonical registry; event allowlist; prohibited properties |
| `citable-information-architecture.test.ts` | Published Citable route map; no planned routes published |

---

## 3. Existing Governance Mechanisms

### 3.1 Active

| Mechanism | Location | Enforcement | Gap |
|---|---|---|---|
| Claim registry | `docs/governance/CLAIM_REGISTER.md` | Manual + test | No machine-readable expiry check in CI |
| Offer fact source of truth | `app/lib/public-facts.ts` | CI test | Only covers commercial offer, not research claims |
| Dataset registry | `app/lib/datasets.ts` | CI test | No link from dataset to Citable run that produced it |
| Subtractive differentiation doctrine | `docs/product/subtractive-differentiation.md` | Human (no CI check) | Gate condition not machine-readable |
| Citable evidence packages | `.citable/runs/` | Retention policy, manual | No CI check that a claim's evidence package still exists and is not stale |
| AEO acceptance gates | `aeo_harness/prompt-evaluation-contract.json` | Human + script | No automated regression on weekly captures against acceptance gates |
| Append-only audit log | `aidlc-docs/audit.md` | Convention (no write_file rule) | Not enforced by test; relies on agent discipline |
| Content rules | `AGENTS.md`, `CLAUDE.md` | Agent prompt | No automated check for em-dash in Python/MD files outside customer-portal |
| Risk register | `architecture-risk-register.md` | Manual | No CI check that known P0s move to resolved |

### 3.2 Absent

- No machine-readable register of Citable environmental observations distinct from Nebula product claims.
- No customer demand signal log (separate from the lead pipeline).
- No convergence record.
- No commercialization gate document.
- No Observatory boundary document stating what Nebula will and will not disclose.
- No `opportunity_id` or `demand_signal_id` namespace.

---

## 4. Existing Evidence and Provenance Mechanisms

| Mechanism | Format | Status |
|---|---|---|
| Citable evidence packages | `runs/<run-id>/` immutable YAML/JSON + checksums | Active, has entries |
| `evidence.yaml` registry | Typed per-evidence records with `verification_status`, `access_status`, `methodology`, `measurement_period` | Active (customer-portal), sparse (root) |
| Dataset registry | Typed TS with `kind`, `sampleSize`, `collectionWindow`, `asOf`, `relationship` | Active, tested |
| `scoring_provenance` JSON on audits | Per-audit engine version, rule version, finding provenance | Live in platform API |
| `finding_events` table | Append-only: `detect`/`redetect`/`resolve`/`regressed` per domain+signal | Live |
| `audit.log` (aidlc-docs) | Append-only markdown | Active, not tested |
| Performance baseline | `docs/architecture/performance-baseline.md` | Single measurement, not recurring |
| Cookiy interview transcripts | `cookiy_research/` | N=3, one session |
| AEO captures | `reports/ai_visibility/captures.jsonl` | Weekly, live |
| A/B test plan | `AB_TEST_PLAN.md` | Planned, no recorded results |

**Notable provenance gap:** The `scoring_provenance` field and `engine_version` stamp exist per audit, but the `finding-defensibility-architecture.md` explicitly flags the absence of a **versioned condition registry** (a stable ID like `PRIMARY_CTA_INITIAL_VIEWPORT_V3`). There is a 9-name list in `signals.canon.json` but no version-linked condition definitions. A rule change is currently indistinguishable from a page change in the `finding_events` log.

---

## 5. Existing Product and Claim Controls

**Controls that currently prevent unsupported public claims:**

1. `public-facts.ts` + `public-facts.test.ts`: typed, tested, fail-closed. Best control in the repo.
2. `CLAIM_REGISTER.md`: human-maintained exclusion log. Effective but not CI-enforced.
3. `site-surface-integrity.test.ts`: bans specific stale phrases and structural regressions from source code.
4. `subtractive-differentiation.md` with explicit `Refuse` list: prevents capability creep triggered by competitor research.
5. `finding-defensibility-architecture.md`: classifies claims as FACT, HYPOTHESIS, or PARTIALLY_IMPLEMENTED with evidence citations.
6. `evidence-atoms.ts` + tests: claim-to-surface binding fails closed when a claim is not registered for a given route+slot.
7. AEO harness acceptance gates: require human approval before any candidate content can be deployed.
8. `SOP-005` outcome measurement: defines `improvement_confirmed` vs `improvement_suggested` vs `insufficient_data` with explicit statistical thresholds.

**Controls that do not yet exist:**

1. No control preventing a Citable capability from being described as a Nebula commercial capability without a separate demand validation step.
2. No control preventing a single customer request from being treated as a validated demand signal.
3. No control tying a research observation to a specific evidence state before it can inform a roadmap decision.
4. No control that requires the Observatory to disclose adverse or inconclusive results for commercially claimed capabilities.

---

## 6. Gaps

### G1: No separation between Citable observations and Nebula product claims

The `.citable/` registries and the `customer-portal/docs/governance/CLAIM_REGISTER.md` are both present but not linked. There is no machine-readable record of which Citable runs informed which Nebula claims, or which Citable capabilities are being watched but have not entered commercial consideration.

### G2: No customer demand signal log

The lead pipeline (`lead_state.db`, `analytics_event_ledger`) tracks individual lead actions. The `cookiy_research/` directory has one set of N=3 interviews. The `docs/icp-survey-aug2026.md` has draft survey emails with no recorded responses. There is no persistent structured log of demand patterns: themes from support inbox, audit reason field analysis, feature request frequency, and the like.

### G3: No convergence record

There is no document or record that explicitly states "Citable observed X; Nebula customer signals show Y; these are independent signals on the same problem; confidence level: Z." Convergence currently lives in founder memory.

### G4: No commercialization gate

There is no formal document or test that requires evidence of demand, evidence of addressable intervention, evidence of Nebula economics, and evidence of strategic coherence before a capability transitions from "technically possible" to "under commercial consideration." The `subtractive-differentiation.md` doctrine is the closest equivalent but it operates as a competitive filter, not a commercialization gate.

### G5: No Observatory boundary document

The Observatory is referenced in the governance context but has no governing document. The claim registry and evidence registry partially cover this, but the disclosure obligation — "adverse, inconclusive, INCOMPARABLE, and NOT ESTABLISHED results must not be hidden" — is not written down anywhere in machine-enforceable or auditable form.

### G6: No ADR for product-governance decisions

The two existing ADRs (`adr-001`, `adr-002`) are architectural. There are no ADRs for product-governance decisions: no recorded decision of why the current commercialization perimeter is what it is, when it was set, and what evidence would change it.

### G7: No evidence-state vocabulary for research findings

The AEO harness has a vocabulary for AI-engine response quality (`supported`, `partially_supported`, `omitted`, `unsupported`, `contradicted`). The offer registry has a status field. But there is no equivalent for research-phase observations: `observed`, `replicated`, `hypothesis`, `insufficient_data`, `invalidated`.

### G8: Claim registry expiry is not CI-enforced

Claims have expiry dates in the markdown table, but nothing in CI checks whether an expired claim is still present on a live page.

---

## 7. Duplication Risks

The governance system being proposed could duplicate or conflict with the following existing mechanisms if designed without care:

| Proposed concept | Existing mechanism | Risk |
|---|---|---|
| Signal/observation registry | `.citable/evidence.yaml` | Duplicate evidence provenance. Resolve by extending `evidence.yaml` with a `signal_source: citable | customer | external` field rather than creating a new file. |
| Claim evidence state | `CLAIM_REGISTER.md` status field | Partial overlap. The claim register tracks commercial claims; the proposed registry would track pre-commercial signals. Keep them separate but link by ID. |
| Commercialization gate | `subtractive-differentiation.md` Refuse/Own/Develop categories | Overlap with "Develop later" category. The gate should reference the doctrine rather than replace it. |
| Customer demand log | `cookiy_research/`, `docs/research/` | Additive, not duplicative. The research dir already exists and is the right home. |
| Observatory boundary | `evidence-atoms.ts` fail-closed pattern | That pattern is per-slot/per-route, not a governing document. Not a duplication risk. |
| ADR for governance decisions | `docs/architecture/adr-001`, `adr-002` | Same ADR format can be extended. Create `adr-003-opportunity-governance.md` not a new format. |
| Evidence state vocabulary | `prompt-evaluation-contract.json` claim statuses | Different domain (AI engine quality vs research signal quality). Not a duplication risk if named distinctly. |

The largest duplication risk is creating a parallel evidence system alongside `.citable/`. The resolution is to make `.citable/evidence.yaml` the single evidence register and add `signal_source` + `demand_state` fields to it.

---

## 8. Integration Constraints

### 8.1 The analytics ledger is not a demand signal log

`analytics_event_ledger` in PostgreSQL captures funnel events per session. It cannot be the customer demand log because:
- Events are anonymous by design for pre-unlock sessions.
- It records what users did, not what problem they arrived with.
- `audit_reason` is captured in individual audit records, not aggregated.
- Adding structured demand observations to the ledger would mix operational telemetry with research evidence.

### 8.2 The lead pipeline is not a demand signal log

`lead_state.db` + `lead_store.py` track individual lead stages. They must not be the canonical signal log because:
- Lead data contains PII.
- Lead stage reflects pipeline state, not pattern evidence.
- The 90-day retention policy on lead data would delete demand evidence.

### 8.3 The git history is the authoritative audit trail for file-based governance

For file-based documents, git commit history provides the append-only audit trail. Any document intended as immutable evidence must be committed in its own commit with a clear message (per `AGENTS.md`'s Delegation Contract: "Archive logs are append-only"). This is sufficient for governance documents that change rarely.

### 8.4 CI runs on push to main; daily CI runs on `sync-citable-projection.yml`

New tests that enforce governance rules will run on every push. The sync workflow is a separate trigger. Any claim-expiry check should run on push (not just daily) to avoid shipping an expired claim.

### 8.5 The `system_setup/` governance documents are aspirational, not operational

`system_setup/GOVERNANCE_POLICIES.md` and `system_setup/PROVENANCE_SYSTEM.md` appear to have been generated as consulting-style frameworks rather than implemented policy. They describe processes (source attribution format, provenance repository structure) that the actual codebase does not follow. Do not extend these documents. They should be archived to `.legacy/` or explicitly superseded.

---

## 9. Recommended Reuse Points

In order of leverage:

### 9.1 Extend `.citable/evidence.yaml` as the unified signal register

Add three fields to each evidence entry:
- `signal_source: citable | customer_behavior | external_research | customer_interview`
- `demand_state: not_assessed | observed | pattern | insufficient | invalidated`
- `nebula_commercial_consideration: none | watching | under_review | declined | admitted`

This avoids creating a parallel register. The existing evidence schema already handles `verification_status`, `access_status`, `methodology`, and `measurement_period`.

### 9.2 Extend `CLAIM_REGISTER.md` with an Observatory disclosure column

Add a column: `Disclosure obligation: none | disclose_adverse | disclosed_adverse`. Adverse, inconclusive, and NOT ESTABLISHED results for capabilities Nebula commercially presents require `disclose_adverse` status and an entry in the exclusion log section when they exist.

### 9.3 Use the risk register format for the opportunity-risk register

`customer-portal/docs/architecture/architecture-risk-register.md` has the right columns (ID, Component, Finding, Evidence, Failure Mode, Impact, Likelihood, Severity, Recommendation). A `docs/research/opportunity-risk-register.md` using the same format would require no new conventions.

### 9.4 Create `adr-003-opportunity-governance.md`

One ADR documenting: the decision to separate Citable from Nebula commercialization, the criteria for each gate, the date the separation was established, and what evidence would trigger a revision. This captures the founder intent in a version-controlled, attributable record.

### 9.5 Use `schema/sop-005-outcome-measurement.md` as the template for demand validation SOPs

SOP-005 has the right discipline: trigger conditions, required inputs, validation rules, procedure, case-eligibility criteria, decision points. The same format should be used for `sop-006-demand-signal-admission.md` and `sop-007-commercialization-gate.md`.

### 9.6 Add a CI test for claim expiry

Extend the existing test suite with a test that reads `CLAIM_REGISTER.md` (or a machine-readable version of it) and fails if any active claim has an expiry date in the past. This closes the gap between the human-maintained register and the CI gate.

### 9.7 Customer signal log in `docs/research/`

`docs/research/` already contains research documents. Add `docs/research/customer-demand-signals.jsonl` as an append-only log of pattern observations from support, audit reasons, ICP survey responses, and interview themes. Each entry: `{"date": ..., "source_type": "support_classification|audit_reason_pattern|interview|survey", "description": ..., "n": ..., "evidence_id": ...}`. Simple. File-based. Git-versioned.

---

## 10. Open Questions

These cannot be answered from repository evidence alone:

**Q1:** Does Mike consider the current `.citable/` skill (the Hermes skill at `.claude/skills/citable/`) and the open-source Citable package to be the same thing, or is there a distinction between Citable as a tool and Citable as an observation methodology?

**Q2:** The `customer-portal/.citable/experiments.yaml` has zero entries. Is the experiment-tracking capability intentionally unused, or has it never been configured? If it has been used informally, where do those records live?

**Q3:** The AEO harness has weekly captures running. What is the decision threshold for acting on a capture result? Is there a written policy for when a capture finding triggers a Nebula content change vs a Citable development task vs neither?

**Q4:** The `system_setup/` documents appear to be consulting-framework outputs from an earlier session. Should they be archived or explicitly superseded? Leaving them in place creates confusion about what is operational policy vs aspirational template.

**Q5:** The `docs/product/subtractive-differentiation.md` states a gate condition ("500 stamped production audits AND 14 days after 2026-08-31 22:00 UTC"). Who verifies when that gate is passed, and what is the procedure for reopening the frozen decisions?

---

## 11. Recommendation on Mechanism

**File-based and git-versioned is the right choice. Do not introduce new application persistence for this layer.**

Rationale:

1. The strongest governance controls in the repo (`public-facts.ts`, `datasets.ts`, `CLAIM_REGISTER.md`, `subtractive-differentiation.md`) are all file-based and git-versioned. They work because they are auditable, commitable with context, and tied to code changes.

2. Application persistence (PostgreSQL, Redis) already has a defined role: operational data, customer data, and funnel telemetry. Adding governance documents to the application DB would mix policy with operational state, require schema migrations to change a policy, and lose the natural audit trail that git provides.

3. The AEO harness outputs to JSONL files committed in `reports/`. The Citable evidence packages are committed in `.citable/runs/`. The pattern is already established: evidence artifacts are files in git.

4. The audience for this governance system is a future competent operator reading the repo. They will look at files, not query a database.

**Minimal system that makes governance enforceable:**

1. Three new or extended files:
   - `docs/governance/opportunity-register.yaml` — machine-readable signal register (extends `.citable/evidence.yaml` semantics, not a separate database)
   - `docs/governance/commercialization-gate.md` — decision record for each capability's gate status
   - `docs/research/customer-demand-signals.jsonl` — append-only demand pattern log

2. One new ADR:
   - `docs/architecture/adr-003-opportunity-governance.md`

3. Two new SOPs (in `schema/`):
   - `sop-006-demand-signal-admission.md`
   - `sop-007-commercialization-gate.md`

4. One new CI test:
   - Claim expiry check against `CLAIM_REGISTER.md`

5. Minor extensions to existing files (no new files required):
   - `customer-portal/.citable/evidence.yaml`: add `signal_source` and `demand_state` fields
   - `customer-portal/docs/governance/CLAIM_REGISTER.md`: add Observatory disclosure column
   - `docs/architecture/adr-003-opportunity-governance.md`: one ADR for the separation decision

**Do not:**
- Create a new database table for governance.
- Create a parallel evidence system alongside `.citable/`.
- Extend the analytics ledger with research observations.
- Extend the lead pipeline with demand evidence.
- Operationalize the `system_setup/` documents — archive them instead.

Total: five new or extended files, one CI test, one ADR. All file-based, all git-versioned. Auditable without a running application.

---

*Discovery complete. No code modified. No production systems touched.*
