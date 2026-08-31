# Finding Defensibility Architecture

Status: internal. T0 marketing freeze remains. This document does not authorize homepage, CTA, or visual changes.

Date: 2026-08-31
Engine stamp in production: `ENGINE_VERSION = "2.1.0"` (`deliver_audit.py`)
HEAD at review: inspect `git rev-parse HEAD` at implementation time.

Competitive claims about Roast.page, RoastMyPage, and NinjaPromo in this file are **HYPOTHESIS** from the brief unless marked FACT. They were not independently re-verified in this review.

---

## 1. Executive verdict

Nebula already has more diagnostic defensibility than a typical AI roast tool:

FACT: findings carry bounded HTML evidence (`measured`, `required`, `delta`, `selector`, `confidence`, `timestamp`) via `audit_evidence.py`.
FACT: audits stamp `engine_version`.
FACT: durable `findings` plus append-only `finding_events` reconcile detect / redetect / resolve / regress per domain and signal.
FACT: page-intent gating can suppress irrelevant signals (`signal_intent_map.py`).
FACT: Citable exists as an open-source verification layer, separate from marketing copy.
FACT: Repair Sprint fulfillment sets `reaudit_due_at` 30 days out.
FACT: editorial standards exist as a public accuracy contract.

Where it does **not** yet win the "prove it" question:

FACT: determinations are still mostly binary (`passed` bool / score) with no first-class `INDETERMINATE` or `NOT_APPLICABLE`.
FACT: `issue` and `fix` collapse interpretation and remediation.
FACT: missing HTML still enriches findings with `confidence: unavailable` **without changing the original score/issue**.
FACT: `monitored_pages` was dropped 2026-08-21. Score-delta monitoring is archived, not live.
FACT: there is no challenge/adjudication record.
FACT: there is no versioned condition ID registry (`PRIMARY_CTA_INITIAL_VIEWPORT_V3`). `signals.canon.json` is a 9-name list.
FACT: composite/overall scores still exist (`score_inprocess` returns `score` and `composite`).

Differentiation today is **evidence-bearing HTML diagnostics + intent gating + finding event history**.
Differentiation that would compound is **fail-closed observation integrity, explicit epistemic layers, versioned conditions, linked verification, and machine-readable case files**.

Do not compete on check count. Do not ship another score. Do not change T0 marketing.

---

## 2. Current-state matrix

Capability | State | Evidence | Gap | Risk
---|---|---|---|---
1 Observation integrity | PARTIALLY_IMPLEMENTED | `deliver_audit.fetch_page` / `scrape_page`; `audit_evidence` timestamp + selector + confidence; `screenshot_service.capture_audit_screenshot`; SSRF guards | No first-class observation object (viewport, font/DOM readiness, consent wall, personalization, occlusion) | Capture failure can still ride on a scored finding
2 Indeterminate state | PARTIALLY_IMPLEMENTED | `confidence` in {high, contextual, unavailable}; `evidence_class` observed/inferred | No PASS/FAIL/REVIEW/INDETERMINATE/NOT_APPLICABLE enum. `signal_verifier` returns `passed: bool` | False FAIL on bot walls and empty HTML
3 Epistemic layers | PARTIALLY_IMPLEMENTED | evidence.measured vs required vs delta; separate `issue`/`fix` | Layers mixed in copy; no `not_established` | Customers read remediation as conversion proof
4 Finding provenance | PARTIALLY_IMPLEMENTED | `ENGINE_VERSION`; `audits.engine_version`; `scoring_provenance` JSON; email footer traces disputes to version | No condition registry version, capture hash, runtime/viewport stamp on each determination | Historical replay ambiguous after rule change
5 Challengeable findings | ABSENT | Copy only: "score disputes can be traced to this version" (`deliver_audit.py`) | No append-only challenge table or API | Overrides would be silent if added ad hoc
6 Before/after verification | PARTIALLY_IMPLEMENTED | `findings_sync` auto-resolve and `regressed`; `purchases.reaudit_due_at`; `audit_db` before/after audit IDs | Not same-condition verification. Easy to narrate as conversion lift | False "verified improvement"
7 Longitudinal history | PARTIALLY_IMPLEMENTED | `finding_events` append-only; last_seen / first_seen | No rule-version on events; domain-keyed not case-file-keyed | Rule change looks like page change
8 Regression detection | PARTIALLY_IMPLEMENTED | `regressed` event type in sync | `monitored_pages` dropped in `20260821140000_wave3_data_integrity.sql` | Recurring revenue story without live monitor
9 Context-aware applicability | PARTIALLY_IMPLEMENTED | `page_intent.py`, `signal_intent_map.py`, findings_sync suppress | Suppression not `NOT_APPLICABLE` with reason; `unknown` fires all signals; conservative include | Informational pages still get conversion FAILs when intent is unknown
10 Recommendation provenance | PARTIALLY_IMPLEMENTED | `evidence_class`; `app/lib/ai-recommendations.ts` | No DETERMINISTIC / HEURISTIC / GENERATED labels | AI copy masquerades as observation
11 Cohort intelligence | PARTIALLY_IMPLEMENTED | Public Q3 2026 293-audit rates on frozen homepage; `tests/test_benchmark_rollups.py` | No inspectable cohort SQL contract in the finding model; causality temptation | Marketing freeze protects current numbers; engine must not invent new causal copy
12 Machine-readable case files | PARTIALLY_IMPLEMENTED | `audits.findings` JSON; workspace findings API; Nebula MCP `run_audit` | No versioned case-file schema | Webpage becomes accidental canonical model
13 Pre-deployment diagnostics | ABSENT as product | Citable CLI is a separate verification tool | No PR/staging advisory API | CI blocking would be premature

---

## 3. Competitive differentiation matrix

Opportunity | Competitor weakness (HYPOTHESIS) | Nebula now | Customer value | Copy difficulty | Compounds | Cost | Recommendation
---|---|---|---|---|---|---|---
Observation integrity | Capture failures become confident roasts | Partial evidence confidence | Trust when pages are hard to fetch | High if observation object is real | Yes | Medium | P0 library, P1 wire fail-closed
Indeterminate | Binary roast | Unavailable confidence only | Honest "we could not tell" | Medium | Yes | Low | P0 enum, P1 persist
Epistemic split | Observation = advice | Mixed issue/fix | Stops false causality | High | Yes | Medium | P1 on API, not marketing
Versioned conditions | No rule IDs | 9 named signals + engine 2.1.0 | Replay after rule change | High | Yes | Medium | P0 registry file
Challenges | No dispute path | None | Agency/legal defensibility | High | Yes | High | P2
Linked re-audit | Point-in-time PDF | Event reconcile + 30-day due | Prove the condition changed | Medium | Yes | Medium | P1
Condition history | Score over time | Signal events | "What changed when" | Medium | Yes | Medium | P2 after versions
Monitoring | Email score drops | Table dropped | Recurring value | Medium | Yes | High | P2 after verification semantics
Applicability | Generic templates | Intent map exists | Fewer junk FAILs | Medium | Yes | Low | P1 emit NOT_APPLICABLE instead of drop
Recommendation provenance | AI rewrite as fact | Observed/inferred only | Clear advice class | Medium | Yes | Low | P1
Cohorts | Fake benchmarks | Frozen 293-audit rates | Descriptive only | High (data) | Yes | High | DEFER public expansion
Case-file schema | HTML reports | JSON blobs | Agents/CI | Medium | Yes | Medium | P0 schema, P1 API
CI diagnostics | None | Citable exists | Shift left | Medium | Later | High | DEFER enforcement

---

## 4. Target diagnostic model

Canonical lifecycle (do not collapse):

1. OBSERVATION: URL, fetch, HTML/render, viewport, redirects, errors.
2. OBSERVATION_INTEGRITY: `usable` | `degraded` | `unusable` with reason codes.
3. APPLICABILITY: page class + confidence. If not applicable: `NOT_APPLICABLE` + reason. Stop.
4. CONDITION: versioned ID from registry.
5. DETERMINATION: PASS | FAIL | REVIEW | INDETERMINATE | NOT_APPLICABLE.
6. EVIDENCE: pointers to observation + hashes. Never rewrite.
7. INTERPRETATION: optional, labelled interpretation.
8. NOT_ESTABLISHED: required whenever determination is FAIL or REVIEW. Default text: Nebula has not established conversion or revenue effect.
9. REMEDIATION: typed provenance (deterministic | heuristic | generated_candidate).
10. VERIFICATION: later observation of the **same condition ID** under a compatible registry. FAIL to PASS is a verified **condition** change only.

INDETERMINATE when integrity is unusable. Never FAIL.

---

## 5. Target data model

New entities (additive). Do not rewrite `audits.findings`.

### determinations
`PASS | FAIL | REVIEW | INDETERMINATE | NOT_APPLICABLE`

### observation_integrity
`usable | degraded | unusable`

Reason codes (closed set): `fetch_failed`, `empty_html`, `consent_wall`, `bot_challenge`, `auth_wall`, `timeout`, `ssrf_blocked`, `redirect_loop`, `unsupported_runtime`, `unknown`.

### conditions.registry.json
Maps current keys to versioned IDs without changing scoring:

- `cta` -> `PRIMARY_CTA_CLARITY_V1`
- `above_fold` -> `PRIMARY_CTA_INITIAL_VIEWPORT_V1` (name is aspirational; current check is HTML-proxy labelled unrendered)
- `message_match` / headline -> `HEADLINE_MESSAGE_MATCH_V1`
- `social_proof` -> `TRUST_PROOF_PROXIMITY_V1`
- `load_speed` -> `LOAD_SPEED_V1`
- `mobile` -> `MOBILE_VIEWPORT_V1`
- `ad_signals` -> `AD_TRACKING_V1`
- `seo_foundations` -> `SEO_FOUNDATIONS_V1`
- `ai_readiness` -> `AI_READINESS_V1`

Registry has `registry_version`, `engine_compat`.

### case_file (API, not webpage)
`schema_version`, `case_file_id`, `audit_id`, `target_url`, `canonical_url`, `observed_at`, `engine_version`, `registry_version`, `page_intent`, `intent_confidence`, `observation_integrity`, `determinations[]`.

Each determination: `condition_id`, `condition_version`, `determination`, `observed`, `interpretation`, `not_established`, `remediation`, `remediation_class`, `evidence`, `observation_ids`.

### finding_challenges (future)
Append-only: original_determination, challenger, evidence, reevaluation, outcome `sustained | overridden | indeterminate`.

Do not add hashes until a consumer verifies them. First real hash: SHA-256 of observation HTML slice used for a determination, when capture is persisted.

---

## 6. Migration plan

1. Keep writing current `findings` JSON exactly as today.
2. Add additive columns later: `determination`, `condition_id`, `observation_integrity` nullable.
3. Backfill: `confidence == unavailable` -> INDETERMINATE; intent-suppressed -> NOT_APPLICABLE (do not invent historical FAILs).
4. Historical `passed=false` with missing HTML stays as stored. Do not rewrite.
5. Composite scores remain for compatibility until a separate decision retires them. They are **not** the defensibility metric.
6. Marketing T0 numbers stay frozen. No new public rates from this work.

---

## 7. Failure-mode analysis

Mode | Required behavior
---|---
Fetch/empty HTML | INDETERMINATE, not FAIL
Consent/bot wall | INDETERMINATE + reason
Personalization / A/B | REVIEW or INDETERMINATE; do not average variants
Rule version change | New determinations; old rows keep old condition_id
Stale audit vs newer finding | Already skipped in `findings_sync` (`skipped_stale`)
Contradictory evidence | REVIEW, not averaged PASS
Customer challenge | Append event; never delete original
Partial outage | Fail closed to INDETERMINATE
Score used as proof | Forbidden in verification copy
DOM noise | Condition must define stability window before MONITOR alerts

---

## 8. Security / privacy / governance

- Customer HTML and screenshots are evidence, not a public research corpus.
- Cohort stats need a written reuse basis. "We stored it" is not consent.
- Challenges may contain competitor URLs and PII. Tenant isolate. Retention policy required before API.
- Public teardowns remain independent public pages, not customer data.
- APIs that export case files are authenticated. No new public dump.
- Training on customer audits: forbidden until explicit authorization exists.

---

## 9. Implementation roadmap

### P0 (this change set, no live scoring change)
- Document this architecture.
- Ship `platform_api/services/epistemic.py` + condition registry JSON + unit tests.
- Map unavailable evidence -> INDETERMINATE in the library only.

### P1 (engine, still no marketing)
- Persist observation_integrity on new audits only.
- Emit NOT_APPLICABLE instead of dropping gated signals.
- Add `not_established` on FAIL/REVIEW in API payloads (workspace/API, not homepage).
- Link Repair Sprint re-audit to original `audit_id` + condition IDs.

### P2
- Challenge table + workspace action.
- Condition timelines in workspace (not marketing).
- Recreate monitoring on **condition** changes, not composite score. Do not revive archived score watchdog as-is.

### DEFER
- Public cohort expansion.
- CI blocking.
- Cryptographic ledgers.
- More checks for parity.
- Sticky CTA / homepage experiments.

---

## 10. Test strategy

Required as capabilities land:

- Deterministic unit: unavailable HTML -> INDETERMINATE
- Golden HTML fixtures per condition ID
- Rendered vs source-proxy labels (already in `test_audit_evidence.py` for above-fold)
- Historical replay: engine 2.1.0 fixture vs new registry
- Intent gate: FAQ -> CTA NOT_APPLICABLE
- findings_sync stale skip
- Challenge append-only (when built)
- Schema compatibility: extra fields ignored by old clients

Do not delete existing evidence tests.

---

## 11. Documentation requirements

Internal:
- This file is the contract.
- Condition registry file is the ID source of truth.

Public (later, not T0):
- Methodology page may eventually describe INDETERMINATE. Not now.
- Editorial standards already separate fact / citation / opinion.

Workspace:
- Must show determination + evidence + not_established. Must not look like the marketing page.

---

## 12. Rejected ideas

Idea | Why killed
---|---
More checks to beat roast tools | Coverage without integrity is anti-differentiation
New 0-100 defensibility score | False precision; composite already a liability
Wire INDETERMINATE into live scoring this freeze window | Changes customer audit outcomes mid-T0; library first
Revive score-delta email monitors | Alerts on the wrong object; table was dropped for a reason
CI fail-the-build on CRO heuristics | Unstable, context-sensitive, hostile
Public cohort API from all audits | Privacy/reuse unauthorized
Hash theater on every row | No verifier
Challenge UI on the marketing site | Contaminates T0; belongs in workspace
Generic "AI CRO copilot" copy | Collapses layers; forbidden by thesis
---

## Adversarial kills (kept)

Observation integrity: **keep**. Without it every other feature lies.

Challenges: **keep delayed**. High value for agencies, high abuse surface.

Cohorts: **keep delayed**. Network effect is real; causality leakage is the failure mode.

CI: **kill as P0/P1**. Advisory only until conditions are fail-closed.

---

## Sequencing vs the brief

Keep Phase 1 integrity before monitoring. Do not restore monitors first. Repository evidence: monitoring table was removed; finding_events already give a cheaper longitudinal spine once condition IDs exist.
