# Subagent-driven development progress

## Workspace

- Branch: `feat/teardown-claims`
- Source plan: `/home/mike/nebula/docs/superpowers/plans/2026-08-22-teardown-claims.md`
- Spec: `/home/mike/nebula/docs/superpowers/specs/2026-08-22-teardown-claims-design.md`
- Previous ledger content (enterprise-refactor on feat/enterprise-refactor) superseded; that work lives in its own branch/worktree.

## Global constraints

- Production doctrine: live service; nothing ships half-built; verify with real output.
- Platform API DSN postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433 (never nebula_platform).
- Restart via sudo systemctl restart nebula-platform-api.service / nebula-nextjs.service; homepage must stay 200; journalctl err-clean after restarts.
- Tests: uv run --project /home/mike/nebula python -m pytest <file> -v
- NO em-dashes anywhere shipped. Accent #c7ff2f only. warning class forbidden. Homepage frozen. Client Workspace nav link always exists.
- Secrets in $HOME/.hermes/.env; never stage/log/echo. Push only nebula-origin.
- aidlc-docs/audit.md append-only via >>.

## Task ledger

| Task | Status | Commits | Notes |
|---|---|---|---|

## Minor findings (deferred to final review)

| 0. CONTEXT.md domain glossary | complete | 1de9bc0ab..330605664 | review clean; minor: report prose line-count off, stale stat quote in report |
| 1. domains.py normalization + freemail | complete | 330605664..61f0574dd | review clean, 6/6 pass re-verified; minor: TDD failing-first attested not provable (single commit) |
| 2. migrations + TeardownDB | complete | 61f0574dd..10a2d127b | review clean after jsonb codec fix 10a2d127b; minors: revoked-guard ordering, ClaimConflict(None) race cosmetic; TASK3 NOTE: pass datetime objects for audited_at in seed |

## Controller rulings

- 2026-08-22: data.ts holds 37 canonical teardowns (all live, HTTP 200), not 28+9-dead as spec first assumed. Mike ruling: migrate all 37, drop nothing, strict parity. Spec + plan amended.
- Task 2 lessons passed forward: audited_at needs datetime objects; jsonb codec registered in TeardownDB pool init.

## Task ledger (continued)

| 3. seed pipeline | dispatched round 1 -> BLOCKED on count; re-dispatch with corrected expectation |
| 3. seed pipeline (37 entries) | complete | 10a2d127b..957a2bacc | review clean; minors: stale 28 in brief Demoable, malformed brief psql (report used valid check) |
| 4. teardown read endpoints | complete | 957a2bacc..66187aadd | review clean; minors: report overclaimed byte-identical main.py unstaged state (gsc reorder reverted by controller), audited_at:null contract note for Task 5 |
| 5. portal read switch (ISR) | complete | 66187aadd..bd4f1713c | review clean after cold-start fix; IMPORTANT-deferred: card-display.ts is transitional parity device - MUST be deleted once list payload enriches (Tasks 10/11) else drift-fuel; minors: parity script lacks artifact whitelist, bearer via argv, new-slug fallback copy |
| 6. email-at-domain claim path | complete | bd4f1713c..5c2034043 | review clean after CRITICAL fix 5c2034043 (verify = public token-capability route, single-use covered); minors: raw exception text in 500 detail, 409-at-request vs verify doc note |
| 7. DNS TXT claim path | complete | 5c2034043..e545fa623 | review clean after reservation fix e545fa623; minors: create_claim-then-delete ordering, containment TXT match (128-bit token moot); ENV NOTE: INTERNAL_API_SECRET not in unit file nor ~/.hermes/.env, sourced undocumented |
| 8. GSC claim path | complete | e545fa623..071b9adf3 | review clean; minors: sync db.query in async (house pattern), duck-typed user id; portal /api/teardowns 405 deferred to Task 14 proxy (systemic) |
| 9. rate limiting | complete | 071b9adf3..da0047276 | review clean; fixed latent Task 6 incident (client_id scope txn:tclaim); PROCESS RULE: future live email proofs must use QA slug + sinkhole domain, never third-party; minors: INCR/EXPIRE non-atomic (accepted), XFF spoofing ops note |
| 10. response filter + owner/founder routes | complete | da0047276..07ceabf30 | review clean; PENDING MIKE RULING: _LINK_RE double-counts URLs -> 2 full links already auto-hide (spec said >3); fix shape known, decide before real traffic; minors: report wording understates threshold, notify scheduling guard |
| 10b. link-count ruling fix | complete | da0047276..e34f25c57 | Mike ruled count-URL-once; implemented + re-reviewed clean (35/35); deviation from dictated regex verified correct |
| 11. render public response | complete | e34f25c57..8299cff7e | review clean; minors: auto_hidden/removed suppression runtime test deferred to Task 16 (statically guaranteed) |
| 12. by-domain attach | complete | 8299cff7e..e3154ed98 | review clean after CRITICAL proxy-bearer fix e3154ed98; open minor: card link claims[0].slug with >1 claim; HANDOFF: prod runs third-stream uncommitted hunks (WorkspaceClient/audit_api/audit_db) needing land-or-discard; Task 16 must prove signed-in workspace E2E |
| 13. fix_implementations write path | complete | e3154ed98..700e340d4 | review clean; minors: NULL-score ValueError->500 (suggest 409 later), avg_score_improvement is 10x units for future UI; Task 16 must regression-test live mark route + backfill after restart |
| 14. claim flow UI | complete | 700e340d4..68883f7a3 | review clean; minors: turnstile hardening follow-up; Task 16 gates: real emailed-link round trip (QA row), signed-in workspace E2E, live mark-implemented route, filtered-response case |
| 15. legacy sources doc-only | complete | 68883f7a3..31498a1ed | re-scoped per Mike ruling (data.ts stays for homepage/sitemap/llms/case-studies); inventory documents dual-source + reseed rule |
| 16. production deploy + DoD | complete | 31498a1ed..2527e4e1c (+proxy fix commit) | ALL GATES PASSED with evidence in aidlc-docs/audit.md; prod fix committed post-run: authz header-case collision (lowercase wins merge); ops: NEBULA_INTERNAL_RECIPIENTS drop-in for founder notify; DNS mechanism proven on mikeholownych.com (token lacks gofaultline zone); minors: takedown ISR lag <=300s, no takedown UI proxy |

## Final review fix wave (2026-08-23, feat/teardown-claims, unpushed)

| item | status | commit | evidence |
|---|---|---|---|
| 1. bridge: land audit_db get_fix_effectiveness + get_user_fix_history from worktree hunks | complete | 8e2cd7f35 | HEAD self-consistency proven (routes grep 3 hits; defs in HEAD audit_db; standalone ast.parse OK); only these two methods staged, mark_email_sent/track_email_open hunks left in worktree |
| 1b. fix asyncpg IndeterminateDatatypeError ($1 unused in finding_key branch) - found during live verify, every /fix-effectiveness?finding_key= call was 503ing | complete | bbb1f7308 | live: /audit/fix-effectiveness?finding_key=missing_cta 503 -> 200 zeroed payload after restart |
| 2. client IP forwarding (proxy cf-connecting-ip w/ xff fallback; upstream prefers it) | complete | 65f03b34f | redis rl:tclaimdns:142.113.189.52 count=2 after 2 dns-start POSTs; no *:local keys anywhere in rl:* scan |
| 3. PII scrub on public teardown detail (claimed_by_email, verification_method) | complete | 2de4d593a | live curl /api/teardowns/basecamp -> clean |
| 4+5. sanitize send-failure detail to generic message + server-side log; takedown sticky (409 when response_status=removed, both branches) | complete | 72e945da3 | pytest 48/48 incl response_filter suite; freemail probe 400 path alive |
| 6. workspace claimed-card link uses mapped claim.slug | complete | 47afe4e08 | block confirmed committed at HEAD before edit; staged via reconstructed HEAD+fix file so no third-stream hunks leaked (first attempt swept a goProject line, reset and redone clean) |

Verification: pytest 48 passed; next build exit 0; both units restarted active; homepage//audit//teardowns/basecamp//teardowns 200 (/workspace 307 = auth redirect); journalctl -p err 5min both units empty. No emails sent (IP proof done via dns-start path). Third-stream worktree changes preserved untouched.
| FINAL whole-branch review | complete | 00bdbb264..bbb1f7308 fix wave | initial NOT-READY (C1 inherited-from-main missing methods, I1 global rate buckets, I2 PII on public detail, raw 500 detail); all resolved + incident fix bbb1f7308 (fix-effectiveness 503); RE-REVIEW: READY; queued follow-up: 409-stickiness unit test |
