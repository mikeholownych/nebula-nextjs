# Nebula Competitive Review Gaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the evidence-safe product, proof, offer, and qualified-acquisition gaps identified in the competitive review without promoting unverified conversion or revenue theories to facts.

**Architecture:** Use narrow vertical slices across the existing Next.js customer portal, FastAPI audit platform, local audit data, and evidence-governance files. Preserve the current diagnostic contract: Nebula reports observable page conditions, supplies bounded remediation, and uses same-condition re-audit to verify condition change. Acquisition assets use source, cohort, and campaign identifiers so visibility can be separated from qualified visits, audits, and attributable payments.

**Tech Stack:** Next.js App Router, React/TypeScript, FastAPI, PostgreSQL, Python standard-library data scripts, Jest, pytest, Playwright, existing analytics ledger, existing MCP/WebMCP surfaces.

## Global Constraints

- This is a live production service. If any development effort is not 100% ready for production use, you are not done. Keep iterating until it is. Every failure is a permanent hit on our credibility.
- Do not weaken tests, assertions, evidence gates, or claim linting.
- Do not change the frozen homepage arc without explicit approval. Prefer `/pricing`, `/repair-sprint`, `/audit`, results, research, or new owned assets.
- No em dashes in shipped copy or fixtures.
- Canonical domain is `https://nebulacomponents.com`; do not introduce `.shop` links.
- The canonical offer remains the `$97 One-Leak Repair Sprint`, with exact copy, code, or configuration for one condition and a same-scope re-audit within 30 days.
- Do not claim conversion lift, revenue improvement, ROAS, superiority, customer outcomes, or guarantees without attributable primary evidence.
- The 293-audit dataset is descriptive evidence only. It cannot produce customer case studies or causal claims.
- “Illustrative” examples must be labeled as illustrative and must not use fabricated founder names, interventions, re-audit results, percentages, or payment outcomes.
- Do not treat search impressions, AI mentions, backlinks, directory listings, audit starts, or replies as payment evidence.
- Do not send outreach, publish externally, spend money, or deploy production changes unless the execution task explicitly grants that authority.
- Preserve the existing Learning Centre architecture.
- Every customer-portal change requires typecheck, lint, build, relevant tests, and live verification of `/`, `/audit`, and the changed route before completion.
- Existing dirty work is unrelated unless a task names it. Do not stage or overwrite unrelated files.

## Current State Matrix

| Recommendation | Current state | Classification | Plan disposition |
|---|---|---|---|
| Free audit copy rewrites | Findings already carry `fix`; results page shows a locked preview and “Exact artifact” only when `isExactArtifact` passes | Partial | Improve the free output with one bounded, finding-specific rewrite preview where the artifact is safe; preserve the paid boundary |
| Three quantified case studies | `293` aggregate dataset and research page exist; no attributable paid-client intervention plus re-audit outcome is evidenced | Blocked as proposed | Do not create case studies. Build an evidence-safe observational asset and a case-study intake contract for future customers |
| “How we differ” section | Comparison routes, pricing, repair sprint, `/ai-info`, and evidence-boundary language exist; no single concise cross-surface section is verified | Partial | Add a reusable differentiation block on pricing and repair-sprint surfaces, not the frozen homepage |
| Competitor monitoring | `scripts/cron_competitor_audit.py`, `competitor_tracking`, API plans, and tests exist | Substantially implemented, live feasibility unverified | Run verification against the running API and database; fix only concrete failures |
| Annotated screenshot evidence | Static mockups and UX audit evidence exist; no finding-specific evidence capture pipeline is verified | Partial | Build a deterministic screenshot annotation artifact from existing measured evidence; no invented PASS/FAIL markers |
| MCP audit workflow | `mcp_server.py`, FastMCP, HTTP mode, WebMCP, discovery documents, API key UI, and tests exist | Substantially implemented, endpoint verification required | Verify canonical HTTP endpoint, tools, auth, and stale domain references; document actual contract |
| Variant 2 + 3 offer card | Pricing and Repair Sprint already state outcome, scope, `$97`, 48 hours, and 30-day re-audit; bonuses are present but not organized as a tested synthesis | Partial | Create a controlled offer-card variant on `/pricing` or `/repair-sprint`; do not alter homepage without approval |
| Five paid-traffic pages versus competitors | Comparison pages and public teardown data exist; no verified paid-traffic sample or controlled side-by-side study exists | Missing and evidence-dependent | Define a study protocol first; use publicly inspectable pages unless paid-traffic provenance is independently supplied |
| Public benchmark library | Q3 2026 research page and frozen 293-audit rates exist; `/benchmarks` is not established as a governed public asset | Partial and gate-bound | Build the data contract and route behind governance checks; no new rates until the observatory gate permits expansion |
| Agency/partner program | Agency positioning, white-label/report references, and agency roadmap material exist; no validated partner funnel is verified | Partial | Specify a bounded partner pilot and attribution contract; do not launch broad program yet |
| Signal expansion | Nine signals already include above-fold and ad-signal coverage; aggregate findings exist | Deferred by governance | Do not add or rename signals until the 500 stamped audit and 14-day observatory gate is satisfied |
| Five paying customers | Revenue remains `$0`; the threshold is not met | Open validation target | Use as a decision gate, not as a feature task or fabricated proof source |

## Phase 0: Evidence and workspace safety

### Task 0: Establish the implementation baseline

**Blocks:** none (can start immediately)
**Demoable:** A written baseline identifies exact current routes, contracts, test commands, and blockers before code changes.

**Files:**
- Read: `AGENTS.md`
- Read: `CLAUDE.md`
- Read: `customer-portal/CONTEXT.md`
- Read: `customer-portal/config/claims-manifest.yaml`
- Read: `docs/governance/observatory-boundary.md`
- Create: `docs/superpowers/plans/2026-09-06-competitor-review-baseline.md`

**Steps:**

- [ ] Record the current repository HEAD and dirty-tree paths without staging them.
- [ ] Record current production revision from `https://nebulacomponents.com/api/build-info`.
- [ ] Record the live status of `/`, `/audit`, `/pricing`, `/repair-sprint`, `/ai-info`, `/research/landing-page-performance-q3-2026`, and `/mcp` or the canonical MCP endpoint if available.
- [ ] Record whether `mcp_server.py` is running, its transport, and its advertised canonical URL.
- [ ] Record current test commands from `customer-portal/package.json`, root `pytest` configuration, and the existing competitor/MCP tests.
- [ ] Mark every metric in the baseline as Measured, User-provided, or Unavailable. Do not estimate missing backlink, traffic, or payment metrics.
- [ ] Run `git diff --check` and save the exit code in the baseline.

## Phase 1: Free output and offer clarity

### Task 1: Add evidence-safe immediate value to free audit output

**Blocks:** Task 0
**Demoable:** A free audit result shows one concise, finding-specific recognition and one safe change preview, while generic or non-exact fixes remain paid-gated.
**Status:** Implemented locally. Exact artifacts now produce a bounded observed-condition/change preview with an explicit no-conversion-impact boundary; generic fixes remain paid-gated and missing fixes produce no preview. Focused tests and full portal verification passed. Production deployment remains pending explicit release authorization.

**Files:**
- Modify: `customer-portal/app/audit/[id]/results/ResultsClient.tsx`
- Inspect and modify only if required: the shared Finding type source used by `ResultsClient.tsx`
- Test: `customer-portal/__tests__/audit-free-output-value.test.tsx` or the nearest existing results-page test file

**Interfaces:**
- Consumes: `Finding.issue`, `Finding.fix`, `Finding.evidence`, `Finding.determination`, `Finding.key`, and `isExactArtifact`.
- Produces: A pure rendering decision that distinguishes `safe_preview`, `paid_artifact`, and `no_preview` without changing the audit API contract.

**Steps:**

- [ ] Write failing tests for three fixtures: an exact copy artifact, a generic recommendation, and a finding with no fix.
- [ ] Assert that an exact copy artifact renders a bounded preview in the free result, includes the observed condition, and does not claim conversion impact.
- [ ] Assert that a generic recommendation renders the existing paid boundary and never labels it “Exact artifact.”
- [ ] Assert that the result includes one next action tied to the finding, not a generic 12-point checklist.
- [ ] Implement the smallest pure helper needed to classify the preview. Do not move artifact validation into the client if it already exists server-side.
- [ ] Use the existing visitor-voice pattern: recognition, structural cause, cost as page experience or uncertainty, then exact change. Do not use “this will increase conversions.”
- [ ] Run the focused Jest test, TypeScript, changed-file ESLint, and the results-page teardown tests.
- [ ] Verify the rendered free result and locked result in a local production build before any deployment decision.

### Task 2: Make differentiation explicit on existing commercial surfaces

**Blocks:** Task 0
**Demoable:** Pricing and Repair Sprint pages each contain one concise, consistent “How Nebula differs” section with four factual items.
**Status:** Implemented locally; focused and regression verification passed. Production deployment remains pending explicit release authorization.

**Files:**
- Modify: `customer-portal/app/pricing/page.tsx`
- Modify: `customer-portal/app/repair-sprint/page.tsx`
- Create or modify: `customer-portal/app/components/DifferentiationBlock.tsx`
- Test: `customer-portal/__tests__/differentiation-block.test.tsx`

**Interfaces:**
- Consumes: canonical facts from `customer-portal/app/lib/public-facts.ts`, `REPAIR_SPRINT_OFFER`, and `REPAIR_GUARANTEE`.
- Produces: A reusable server-rendered `DifferentiationBlock` with four factual items: evidence-grade observation, no lift claims, same-condition re-audit, and bounded `$97` repair scope.

**Steps:**

- [ ] Write failing tests that assert the block uses the canonical `$97`, 30-day re-audit, and bounded-condition wording.
- [ ] Assert that banned claims such as “guaranteed conversion,” “increase revenue,” and “best” are absent.
- [ ] Implement the shared block using existing design tokens and no new visual system.
- [ ] Add it to `/pricing` and `/repair-sprint`, not the frozen homepage.
- [ ] Run claim lint, TypeScript, ESLint, focused tests, and production build.
- [ ] Verify the live rendered pages after an authorized deployment, including `/`, `/audit`, `/pricing`, and `/repair-sprint`.

### Task 3: Reframe the `$97` offer card as an experiment

**Blocks:** Task 2
**Demoable:** A distinct offer-card variant leads with the job outcome, names included deliverables, and records exposure and click metrics without introducing scarcity theater.
**Status:** Implemented locally; full portal gates and focused analytics/offer tests passed. Production deployment remains pending explicit release authorization.

**Files:**
- Modify: `customer-portal/app/pricing/page.tsx` or the existing offer-card component used by that route
- Inspect: `customer-portal/config/analytics-registry.json`
- Modify only if absent: the analytics registry and typed event helper
- Test: `customer-portal/__tests__/offer-card-variant.test.tsx`

**Interfaces:**
- Consumes: `REPAIR_SPRINT_OFFER`, canonical price, delivery window, and re-audit contract.
- Produces: Variant identifier and analytics properties for `repair_sprint_exposed` and `repair_sprint_clicked`.

**Steps:**

- [ ] Write failing tests for the exact card copy: “Know exactly which one thing to fix and how to fix it,” exact artifact, 30-day re-audit, and no conversion promise.
- [ ] Implement the card with explicit “Included” items rather than vague bonus language.
- [ ] Add a stable variant key, source, placement, and audit ID to the event payload.
- [ ] Do not add countdowns, slot limits, expiry theater, or fabricated urgency.
- [ ] Run focused tests, analytics contract tests, claim lint, TypeScript, and ESLint.
- [ ] Define the experiment window and payment success metric before enabling the variant. A click is diagnostic; a Stripe payment is the success signal.

## Phase 2: Proof assets without fabricated outcomes

### Task 4: Build an evidence-safe 293-audit research asset

**Blocks:** Task 0
**Demoable:** A public research asset explains the frozen 293-audit dataset, denominator, methodology, limitations, and descriptive findings without calling them case studies.
**Status:** Evidence contract created and tested. Publication is blocked pending reconciliation of the historical `293` reference against the authoritative `131` DatasetRecord; no route or rate was changed.

**Files:**
- Inspect: `customer-portal/app/research/landing-page-performance-q3-2026/page.tsx`
- Inspect: `docs/seo/press-pitch-q3-research-ready.md`
- Inspect: `docs/governance/observatory-boundary.md`
- Create: `docs/superpowers/specs/2026-09-06-293-audit-research-asset.md`
- Create or modify: `customer-portal/app/benchmarks/page.tsx` only after the governance gate is satisfied
- Test: `customer-portal/__tests__/benchmark-research-asset.test.tsx`

**Interfaces:**
- Consumes: frozen aggregate records and their provenance references.
- Produces: Descriptive tables or charts with denominator, observation window, signal definitions, and explicit non-causality disclosure.

**Steps:**

- [ ] Reconcile every proposed number against the authoritative dataset and record the query or source file.
- [ ] Reject the proposed “founder fixed headline → re-audit PASS → 23% lift” example because no attributable primary record currently proves it.
- [ ] Add an optional clearly labeled “illustrative walkthrough” only if it uses no invented percentage, named founder, payment, or re-audit outcome.
- [ ] Keep current frozen public rates unchanged until the observatory gate permits expansion.
- [ ] Add tests that reject missing denominators, unsupported outcome fields, and unlabeled illustrative content.
- [ ] Verify the live research route, sitemap inclusion if applicable, JSON-LD, and claim lint after authorized deployment.

### Task 5: Create an evidence capture and annotation artifact

**Blocks:** Task 1, Task 4
**Demoable:** A deterministic artifact can display a captured page region with annotations derived from measured selectors and thresholds, or fails closed when the evidence is insufficient.
**Status:** Standard-library SVG renderer and evidence contract implemented. PASS, FAIL, stale, missing-capture, missing-selector, and insufficient-determination tests pass; one local artifact generated from existing UX evidence.

**Files:**
- Inspect: `audit_evidence.py`
- Inspect: `customer-portal/app/audit/[id]/results/ResultsClient.tsx`
- Inspect: `customer-portal/app/components/AuditResultMockup.tsx`
- Create: `scripts/render_finding_annotation.py`
- Create: `tests/test_finding_annotation.py`
- Create: `docs/superpowers/specs/2026-09-06-finding-annotation-contract.md`

**Interfaces:**
- Consumes: finding condition ID, selector, measured value, threshold, determination, and a verified capture artifact.
- Produces: PNG or SVG annotation with source audit ID, capture timestamp, condition ID, and `PUBLIC AUDIT / NOT A CUSTOMER` when used publicly.

**Steps:**

- [ ] Define the input schema and fail-closed cases: missing selector, missing capture, `INDETERMINATE`, `NOT_APPLICABLE`, or stale evidence.
- [ ] Write tests for PASS, FAIL, and insufficient-evidence fixtures.
- [ ] Implement annotation with standard-library or already-installed tooling only. Do not add a new image stack without a dependency review.
- [ ] Ensure annotations never infer a failure from visual appearance alone.
- [ ] Generate one local artifact from a real captured finding and record its source receipt.
- [ ] Do not publish customer-like screenshots until the source is either public teardown material or an approved customer artifact.

### Task 6: Add a future customer case-study intake contract

**Blocks:** Task 4
**Demoable:** A paid customer can produce a provenance-complete case-study record, but no case study is published without the required evidence.
**Status:** Dormant schema and policy contract implemented. Tests pass for valid, incomplete, unsupported-percentage, and conversion-proof records; no customer case study was created.

**Files:**
- Create: `docs/outcomes/case-study-evidence-contract.md`
- Create: `docs/outcomes/case-study-record.schema.json`
- Create: `tests/test_case_study_evidence_contract.py`
- Inspect: `ledgers/repair_verification.json`
- Inspect: `docs/governance/observatory-boundary.md`

**Interfaces:**
- Consumes: payment receipt, pre-intervention audit, exact intervention artifact, post-intervention same-condition re-audit, optional customer-reported business metric, and explicit consent.
- Produces: A record that distinguishes measured condition change, customer-reported outcome, and independently verified payment data.

**Steps:**

- [ ] Define required fields for payment, audit IDs, condition IDs, intervention, re-audit, outcome source, consent, and publication status.
- [ ] Define `customer_reported` separately from `measured` and require source attribution for each.
- [ ] Reject a record that contains a percentage without numerator, denominator, date window, and source.
- [ ] Reject a record that treats FAIL to PASS as conversion proof.
- [ ] Add fixtures for valid, incomplete, and fabricated-outcome records.
- [ ] Keep the contract dormant until a real paying customer exists.

## Phase 3: Verify existing technical capabilities

### Task 7: Verify and harden competitor monitoring

**Blocks:** Task 0
**Demoable:** A real scheduled competitor audit run can be dry-run or executed against explicitly authorized records, with database receipt, failure handling, and no stale-domain leakage.
**Status:** Infrastructure verification completed: project test suite passed (`5` tests), live `competitor_tracking` table has the expected eight columns and three rows, Alembic is at head `0014_project_integrations`, platform API is active, `/audit/run` returns structured validation errors, and the scheduler source preserves prior scores on failed runs with a batch limit of 50. Added and verified an explicit `--dry-run` mode that lists stale candidates without POSTing audits or updating the database; a live dry run found no stale candidates and row counts/scores were unchanged before and after. User cron invoked the job on Sep 5 and Sep 6 at 03:47, but no `/var/log/nebula/cron_competitor.log` receipt exists, likely because the user cron redirects to a root-owned log path. No real competitor refresh was executed, and crontab changes require explicit authorization.

**Files:**
- Inspect: `scripts/cron_competitor_audit.py`
- Inspect: `scripts/cron_competitor_audit.py` tests and `tests/test_competitor_analytics.py`
- Inspect: `docs/superpowers/plans/2026-08-24-paid-analytics.md`
- Modify only for verified defects: `scripts/cron_competitor_audit.py`, API route, or migration

**Interfaces:**
- Consumes: `competitor_tracking` rows and `/audit/run` responses.
- Produces: `last_score`, `last_audited_at`, error receipt, and idempotent scheduled-run log.

**Steps:**

- [ ] Verify the database table, columns, migration state, and service connectivity without printing credentials.
- [ ] Verify the `/audit/run` response schema against the current running platform API.
- [ ] Run the existing test suite before changing code.
- [ ] Add tests for HTTP failure, incomplete audit, successful score conversion, duplicate scheduling, and stale URL rejection.
- [ ] Confirm that failed runs do not overwrite a valid prior score.
- [ ] Confirm that the cron cannot audit more than the configured batch limit.
- [ ] Only run against real competitor records after explicit authorization. Return database rows and logs as verification evidence.

### Task 8: Verify and align the MCP server contract

**Blocks:** Task 0
**Demoable:** A remote or stdio MCP client can discover the audit tool, submit a valid public URL, receive a typed result, and receive a typed failure for invalid input.
**Status:** Live streamable-HTTP initialize, tools/list, required context schemas, and invalid-input tool invocation verified at `https://mcp.nebulacomponents.com/mcp`. Live server is `Nebula Audit Engine 1.29.0` with five tools and no required authentication. The checked-in server card was stale at `1.28.1`; it now matches the verified five-tool contract locally. No valid audit submission was made, and production deployment remains pending explicit release authorization.

**Files:**
- Inspect: `mcp_server.py`
- Inspect: `customer-portal/components/WebMCP.tsx`
- Inspect: `customer-portal/public/llms.txt`
- Inspect: `.well-known/mcp/server-card.json` or its current source
- Inspect: `deploy/systemd/` MCP service definition
- Test: existing MCP tests plus `tests/test_mcp_contract.py`

**Interfaces:**
- Consumes: valid HTTP or HTTPS public URL and configured API authentication where required.
- Produces: audit ID, status, URL, typed findings, and explicit error code. It must use `nebulacomponents.com` everywhere.

**Steps:**

- [ ] Identify the canonical HTTP endpoint and confirm whether it is actually reachable in the current deployment.
- [ ] Compare the server card, `llms.txt`, WebMCP registration, API route, and service configuration for endpoint drift.
- [ ] Write failing contract tests for discovery, valid submission, invalid URL, authentication failure, and timeout.
- [ ] Fix only verified contract drift. Do not advertise a capability that the running service does not provide.
- [ ] Verify with a real MCP client or protocol-level request, then inspect service logs for errors.
- [ ] Confirm that the MCP workflow does not claim it applied a customer change when it only returned a proposed artifact.

## Phase 4: Qualified acquisition assets and measurement

### Task 9: Define the five-page comparative study protocol

**Blocks:** Task 4, Task 8
**Demoable:** A study specification can be executed without falsely labeling public pages as paid-traffic pages.
**Status:** Draft protocol and JSON schema implemented. Tests pass for five-page cardinality, provenance enum, unknown-versus-paid labeling, and unsupported comparative claims. No pages audited and no study published.

**Files:**
- Create: `docs/research/2026-09-06-five-page-comparative-study.md`
- Create: `docs/research/five-page-comparative-study.schema.json`
- Create: `tests/test_five_page_comparative_study.py`
- Inspect: `customer-portal/app/compare/comparisons.ts`
- Inspect: `customer-portal/app/teardowns/[slug]/data.ts`

**Interfaces:**
- Consumes: five explicitly sourced URLs, competitor selection rationale, same audit version, capture timestamps, and evidence packages.
- Produces: side-by-side observed conditions, engine limitations, exact source references, and a publication decision.

**Steps:**

- [ ] Define `traffic_provenance` as `verified_paid`, `publicly_inspectable`, or `unknown`.
- [ ] Reject the label `paid-traffic page` when traffic provenance is unknown.
- [ ] Use the same Nebula engine version and audit conditions for every page.
- [ ] Record competitor output only from publicly accessible primary sources or clearly label it as unavailable.
- [ ] Prohibit comparative claims such as “better conversion” unless an attributable experiment exists.
- [ ] Publish only after review confirms every finding is source-backed.

### Task 10: Build a directory and backlink measurement lane

**Blocks:** Task 0, Task 4
**Demoable:** Every directory or editorial placement has a target URL, source identifier, status, referral measurement, and qualified-traffic outcome field.
**Status:** Placement schema and register contract implemented. Tests pass for status/canonical validation, Softrankings exclusion, UTM/outcome fields, and three-placement review gating. No external placement was submitted or contacted.

**Files:**
- Modify: `docs/research/backlink-acquisition-register-2026-09-06.md`
- Create: `docs/research/backlink-placement.schema.json`
- Create: `tests/test_backlink_placement_schema.py`
- Inspect: `seo/link_opportunities.jsonl`
- Inspect: `customer-portal/app/sitemap.ts`

**Interfaces:**
- Consumes: validated target, canonical Nebula URL, placement URL, acquisition method, and source tag.
- Produces: placement record with referral sessions, qualified sessions, audit starts, and payments.

**Steps:**

- [ ] Exclude Softrankings permanently from the active queue, retaining only its existing exclusion note.
- [ ] Add a `candidate`, `contacted`, `accepted`, `live_verified`, `rejected`, and `excluded` status enum.
- [ ] Require direct verification of every live placement URL and canonical destination.
- [ ] Add UTM and referrer mapping without overwriting canonical URL semantics.
- [ ] Define a three-placement review window and a qualified-session threshold before expanding a lane.
- [ ] Keep external submissions and outreach as separately authorized actions. Research alone does not create a backlink.

## Phase 5: Agency pilot and deferred engine work

### Task 11: Specify a bounded agency partner pilot

**Blocks:** Task 4, Task 6, Task 10
**Demoable:** A partner pilot has a defined user, deliverable, price, attribution path, consent boundary, and stop rule without launching a broad agency program.
**Status:** Bounded one-package protocol implemented and tested. It uses existing verified capabilities, requires consent and attribution, and stops after three qualified partner conversations or the fixed pilot window. No pilot launched.

**Files:**
- Inspect: `customer-portal/PRODUCT.md`
- Inspect: `docs/superpowers/plans/2026-09-06-nebula-agency-os.md`
- Inspect: `customer-portal/app/repair-sprint/page.tsx`
- Create: `docs/research/2026-09-06-agency-pilot-protocol.md`
- Create: `tests/test_agency_pilot_protocol.py`

**Interfaces:**
- Consumes: agency partner identity, client audit consent, audit receipt, repair artifact, and referral source.
- Produces: bounded pilot records and a decision based on qualified client opportunities or attributable payments.

**Steps:**

- [ ] Define one pilot package and one referral path. Do not create recurring pricing from theory alone.
- [ ] Require client consent before processing or publishing client audit data.
- [ ] Keep white-label claims limited to capabilities verified in the running product.
- [ ] Define stop criteria after three qualified partner conversations or a fixed pilot window with no attributable opportunity.
- [ ] Do not publish partner logos, testimonials, or performance outcomes without permission and source evidence.

### Task 12: Gate signal expansion and the five-customer transition

**Blocks:** Task 4, Task 6, Task 9, Task 11
**Demoable:** A governance record states exactly when signal expansion and ICP expansion may proceed, with current status showing the gate is not yet met.

**Files:**
- Inspect: `customer-portal/config/signals.ts`
- Inspect: `docs/governance/observatory-boundary.md`
- Inspect: `customer-portal/docs/governance/CLAIM_REGISTER.md`
- Create: `docs/research/2026-09-06-commercialization-gate-status.md`
- Create: `tests/test_commercialization_gate_status.py`

**Interfaces:**
- Consumes: stamped production audit count, elapsed observation period, attributable payment count, case-study evidence, and customer consent.
- Produces: one of `GATED`, `READY_FOR_REVIEW`, or `OPEN_VALIDATION` with explicit missing evidence.

**Steps:**

- [ ] Record the current state as `OPEN_VALIDATION`: revenue `$0`, five-customer threshold unmet, and no attributable paid-client case studies.
- [ ] Record the existing 500 stamped audit and 14-day observatory requirement without treating it as already satisfied.
- [ ] Prohibit signal expansion until the observatory gate is actually met and reviewed.
- [ ] Prohibit expansion from founders to agencies or pre-launch teams until the five-paying-customer decision gate is met or explicitly revised.
- [ ] Test that the gate status cannot be `READY_FOR_REVIEW` when payment count is zero.

## Verification and release contract

For every implementation task that changes the customer portal:

```bash
cd /home/mike/nebula/customer-portal
npm run typecheck
npm run lint
npm run build
```

Run the focused test command for the task plus the existing teardown and claim-governance suites. Before any production claim:

```bash
curl -fsS -o /dev/null -w '%{http_code}\n' https://nebulacomponents.com/
curl -fsS -o /dev/null -w '%{http_code}\n' https://nebulacomponents.com/audit
curl -fsS -o /dev/null -w '%{http_code}\n' https://nebulacomponents.com/<changed-route>
```

Then verify:

- Rendered HTML contains the intended copy or metadata.
- `nebula-nextjs.service` and `nebula-platform-api.service` are active.
- No new relevant error-priority journal entries exist after the change.
- Production revision matches the authorized build receipt.
- Cloudflare cache is purged when a cached public surface changed.
- No unrelated dirty files were staged.

## Recommended execution order

1. Task 0 baseline.
2. Tasks 1 and 2 in parallel, then Task 3.
3. Task 4 before any public benchmark or proof expansion.
4. Tasks 5 and 6 after the evidence contract is accepted.
5. Tasks 7 and 8 as independent capability verification slices.
6. Tasks 9 and 10 for qualified acquisition and backlink measurement.
7. Task 11 for a bounded agency pilot.
8. Task 12 as the final governance gate.

## Explicitly rejected actions from the review

- Do not publish three fabricated or “illustrative” quantified customer case studies using `23%` or any other invented lift.
- Do not add a new above-fold signal or change the scoring model before the observatory gate.
- Do not create a new cheap scan SKU, generic CRO heuristic layer, or broad SEO platform to imitate adjacent competitors.
- Do not call public pages “paid-traffic pages” without paid-traffic provenance.
- Do not count the Softrankings listing as an actionable backlink.
- Do not treat a successful audit, reply, click, backlink, AI mention, or checkout attempt as a sale.
