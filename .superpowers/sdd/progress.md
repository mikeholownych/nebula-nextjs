# SDD progress - Phase 3: Paid Analytics Surfaces

## Workspace
- Branch: feat/paid-analytics (from main @ eece6105d)
- Plan: docs/superpowers/plans/2026-08-24-paid-analytics.md
- Spec: docs/superpowers/specs/2026-08-24-paid-analytics-design.md
- Phase 2 shipped @ d6cc5d2b6 lineage, pushed 425bd8039.

## Global constraints
- LIVE prod + Stripe. Secrets never echoed/logged/staged.
- Packaging locked: Free teaser-only funnel (1 lifetime/3 URLs), Pro 2 rivals/percentile/3runs x10URLs, Growth 5/segment/10x25, Agency 10/unlimited/100. Legacy free score-compare grandfathered.
- Entitlements changes update fixture + dataclass + TS config together (parity tests).
- Fail rules: free reads open, premium closed, status=error -> free.
- nebula_audit for analytics tables; never mix DSNs.
- Tests: uv pytest / jest / tsc. Restarts + journalctl clean; homepage 200 invariant.
- No em-dashes; accent #c7ff2f; no warning class; homepage frozen; canonical drift surfaces untouched.
- Push only nebula-origin with Mike go.

## Task ledger
| Task | Status | Commits | Notes |
|---|---|---|---|

## Minor findings (deferred to final review)

| 0. analytics glossary | complete | eece6105d..1ec35b697 | review clean; controller ruling: 'competitor slot' = one unit of the competitorSlots entitlement; Task 3 brief uses exact term |
| 1. analytics schema | complete | 1ec35b697..4ee9b1dcf | review clean |
| 2. entitlements growth | complete | 4ee9b1dcf..fb1bb85cc | review clean; TEASER_FUNNEL_URLS=3 constant produced for T6 |
| 3. competitors v2 | complete | fb1bb85cc..f16d5addf | review PASS after grandfather fix f16d5addf; nits: URL trailing-slash slot variants, re-add not idempotent at cap |
| 4. benchmark rollups | complete | f16d5addf..0d2c47388 | review clean; corpus honestly 271 (plan's >500 expectation wrong, controller ruled); /me live-paid-session check deferred to T8 E2E |
| 5. programs | complete | 0d2c47388..8192c008f | review APPROVED after cap fix 8192c008f; CONDITION: refresh_completion self-loading path mutates asyncpg Records -> TypeError (unreachable via HTTP today); fix before standalone consumption |
| 6. funnel orchestrator | complete | 8192c008f..76f6bf160 | review PASS; live demo 163->3 teaser run scorecard complete; triage: api_keys.scopes latent bug (pre-existing, fix before API keys ship), discover_urls SSRF guards should reuse audit pipeline's, free 403-before-409 semantics doc note |
| 7. frontend surfaces | complete | 76f6bf160..678c2ef40758 | review PASS; content-rule fix 678c2ef40758 (signal-fail misuse removed); nits: indentation drift, dup polling setup; Mike signed-in smoke recommended before phase close |
| 8. E2E validation | complete | no new commits | all 7 steps PASS; pre-existing audit_cohort.score_bucket schema drift noted (not Phase 3) |
| 9. monitor rewire | complete | already shipped in Phase 2 (be59ab674, Aug 23); monitors-engine live, monitors/ deleted, monitoringView rewired; no new commit needed |
Task 1: complete (commits 81c77a633..83ddca9b, review clean)
Task 2: complete (commits 83ddca9b..f1a211c9, review clean; minor report commit-label note)
Task 3: complete (commits f1a211c9..4ef2e934, review clean)
Task 4: complete (commits 4ef2e934..76282b71, review clean)

## Local Two-Lane Blog Pipeline (2026-09-04)

| Task | Status | Commits | Notes |
|---|---|---|---|
| 1 | complete | 440cf4609..582ad2c23 | final review approved; cwd-independent loader and runtime frontmatter validation verified |
| 2 | complete | c8c2a9c1..66c976019 | final review approved; real clean-environment CI validator verified |
| 3 | implemented, review pending | 2d4277de.. | local blog routes and fixtures implemented; independent review dispatched |
| 3 | remediation implemented, re-review pending | 72c656c97..de57a179 | URL safety, dateline, author metadata, headings, and regression coverage fixed |
| 3 | remediation 2 implemented, re-review pending | de57a179..01a83fee | hardened URL and slug handling; expanded both-lane schema and route coverage |
| 3 | complete, review approved | 72c656c97..01a83fee | final review passed; no Critical or Important findings |
| 4 | implemented, review pending | e31cad7cf | report-only local evidence collection and brief/review pipeline implemented; missing competitor SERP fails closed |
| 4 | remediation implemented, re-review pending | e31cad7cf..fd7a03ad | strict source schemas, evidence-driven scoring, provenance separation, path safety, controlled CLI errors |

## Execution handoff guardrail
- A task may be reported as started only when a live worker ID or committed implementation exists.
- Every worker completion immediately requires either one consolidated fix dispatch for blocking findings or a review-package plus independent review dispatch.
- A task remains pending until the review verdict is written here. No next task starts while Important findings remain.
- If no worker is live, the controller must dispatch the next required action in the same turn, not merely report intent.
| 4 | remediation 2 implemented, re-review pending | fd7a03acd..10dabf65 | strict per-source schemas, primary-external separation, evidence-driven scoring, fail-closed workflow |
| 4 | remediation 3 implemented, re-review pending | 10dabf654..69e0e2ee | strict source-authentic schemas, independent provenance classes, computed scoring, fail-closed metrics and roots |
| 4 | remediation 4 implemented, re-review pending | 69e0e2ee..077088ba | source-authentic schemas, strict provenance, validator reuse, internally derived scoring |
| 4 | remediation 5 implemented, re-review pending | 077088bac..9a36ebbe | source authenticity, strict declared-type validation, and evidence-derived scoring hardened |
| 4 | remediation 6 implemented, re-review pending | 9a36ebb10..02f681e3 | canonical path/content binding and seven-source fabricated-payload rejection |
| 4 | remediation 7 implemented, re-review pending | 02f681e3..3f0ae70b | exact canonical directory and filename validation across all source adapters |
| 4 | complete, review approved | 02f681e3..3f0ae70b | final review passed; exact canonical path boundaries verified; no Critical or Important findings |
| 5 | implemented, review pending | 3f0ae70bd.. | create/review/edit/approval/publish-dry-run workflow implemented and verified |
| 5 | remediation implemented, review pending | dcaf43545..9de38bb9 | full validator wiring, approval binding, immutable revisions, path and collision safety |
| 5 | remediation 2 implemented, re-review pending | 9de38bb99..14fd84dd | full validator invocation, strict readiness, atomic edits, collision-safe revisions |
| 5 | remediation 3 implemented, review pending | 14fd84dd..efdf23f4 | full readiness enforcement, complete source-shape validation, genuine review-bound lifecycle |
| 5 | complete, review package ready | 92fc608ca | strict signed readiness, explicit unknown/untyped source blocking, positive v001-to-v002 lifecycle, dry-run and local receipt verified; review package excludes ad420c055, daac736e4, and corroboration commits |
