# Subagent-driven development progress

## Workspace

- Branch: `feat/enterprise-refactor`
- Worktree: `/home/mike/nebula/.worktrees/enterprise-refactor`
- Source plan: `/home/mike/nebula/.worktrees/enterprise-refactor/customer-portal/docs/architecture/enterprise-refactor-plan.md`

## Global constraints

- Preserve canonical event registry, append-only ledger, journey_id, nebula_platform as ledger/auth store, eligible-denominator semantics, /api/build-info no-store, CI claim/evidence gates.
- Do not introduce microservices, Kubernetes, Kafka, extra Redis caches, or a second analytics truth.
- Do not rotate live Stripe/JWT secrets from an agent (ops runbook only).
- Do not restart production systemd units or mutate production data.
- Each phase must leave the app deployable.
- Never implement on `main`.

## Task ledger

| Task | Status | Commits | Notes |
|---|---|---|---|
| 0. Baseline and protect | complete | 389068bd..81e015d9 | review clean; minor: baseline docs still describe old CI gates |
| 1. Correctness and failure semantics | complete | 81e015d9..a0ddb088 | review clean after fix a0ddb088; minor: v1/fixes?url= tenant check fail-open (dead), loopback GET /audit/{id} unauth |
| 2. Architectural boundaries | complete | a0ddb088..f044eb15 | review clean after f044eb15 |
| 3. Persistence and audit runtime | complete | f044eb15..7349e2e4 | accept+queue, SKIP LOCKED workers cap=2, outbox kit enqueue; apply migration before deploy |
| 4. Backend performance | complete | 7349e2e4..465a72bc | no PageSpeed on score path; benchmarks LIMIT 500/90d; screenshot semaphore 1; PostHog flush not awaited |
| 5. Frontend runtime | complete | 465a72bc..9622e18d | review clean after RB2B fix 9622e18d |
| 6. Operational hardening | complete | 9622e18d..4fb713e2 | review clean after log + readyz pool fixes |
| 7. Load / failure validation | complete | 4fb713e2..6ee793f0 | review clean; mocked burst=10 cap=2 |
| 8. Cleanup | complete | 6ee793f0..6149a289 | SiteNav deleted; Stripe fulfillment extracted in-process; R31/R32 HTML deferred |

## Minor findings (deferred to final review)

- Phase 0: baseline docs still describe old CI gates
- Phase 1: v1/fixes?url= tenant check fail-open (dead); loopback GET /audit/{id} unauth
- Phase 5: hero `type="url"` vs `https://` prefixer; FunnelChrome third-party source strings still in root client module; WorkspaceClient dashboard/audits/projects share `views.tsx` chunk; `frontend-runtime` RB2B test regex is looser than claimed; LHCI/homepage JS budget not measured (brief forbade origin hits)
- Phase 5 ⚠️ resolved by controller: first-HTML findings need a live unlocked audit (not a spec gap); FastAPI loopback GET /audit/{id} unauth is a Phase 1 leftover, not a Phase 5 miss
- Phase 6: request_id not in analytics-registry allowed_properties; AUDIT_DATABASE_URL validator still says DATABASE_URL; markdown rewrite does not forward X-Request-ID to origin; BEGIN/SET LOCAL not JS-bounded on dead socket; readyz tests accept rolledBack || discarded; hung-connect late-release untested; nested GH workflows may be ignored by GitHub; Playwright e2e first GH run may fail on missing env
- Phase 7: concurrent drain one-winner is mock SKIP LOCKED; already-sent kit test mocks drain; sweeper skip-completed is SQL substring; readyz hang test relies on --forceExit
- Phase 8: 418 `public/case-studies/*.html` still statically served (no 301/410); ResultsClient copy/share/checkout not a clean cut (YAGNI)
