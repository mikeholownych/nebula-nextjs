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
