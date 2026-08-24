# SDD progress - Phase 2: Billing & Entitlements Spine

## Workspace
- Branch: feat/billing-entitlements (from main @ 4aee88cdd)
- Plan: docs/superpowers/plans/2026-08-23-billing-entitlements.md
- Spec: docs/superpowers/specs/2026-08-23-billing-entitlements-design.md
- Phase 1 ledger archived in git history of this file; phase 1 shipped @ 828b10bf4, pushed.

## Global constraints
- LIVE Stripe keys in play; never echo/log/stage secrets; redact in reports.
- Locked packaging incl Agency $497/mo flat (deactivate $199/$1990).
- Portal webhook = ONLY subscription writer; platform webhook CRM-only.
- Fail rules: free reads fail open; premium mutations fail closed; unknown price -> no write + ops alert.
- DSNs: nebula_platform vs nebula_audit never mixed. Tests: uv pytest / jest / tsc --noEmit.
- Restarts + journalctl clean after each; homepage 200 invariant.
- No em-dashes; accent #c7ff2f; no warning class; homepage frozen; $97/48 hours/7 signals untouched.
- Push only nebula-origin with Mike go.

## Pending inputs
- STRIPE_TEST_SECRET_KEY needed at Task 10.

## Task ledger
| Task | Status | Commits | Notes |
|---|---|---|---|

## Minor findings (deferred to final review)

| 0. billing glossary | complete | 4aee88cdd..552ea0e75 | review clean |
| 1. subscriptions lifecycle migration | complete | 552ea0e75..d77dd3592 | review clean; note: model String(20) vs DB text for billing_interval (inert, brief-verbatim) |
| 2. agency price + parity fixture | complete | d77dd3592..ec466bf18 | review clean; new price price_1U7eY8EINR1kU9chLslsSug3 live $497/mo; legacy pair deactivated |
| 3. EntitlementService | complete | ec466bf18..09cabbaa5 | review clean; session_scope + acquisition try/except deviations required; NOTE for T7: gate premium on ent.plan!=free AND status!='error' |
| 4. consumers switch | complete | 99456c7fb..e77ab313d | review PASS + fix round e77ab313d (3 stale pricing assertions -> $497; containment test repointed to untracked .legacy/html-site w/ graceful skip); jest 723/723 |
| 5. subscribe + portal routes | complete | e77ab313d..7b7987455 | review clean; union-return auth helper adjudicated; MembershipGrid reuse; test contract update legitimate; live checkout validation deferred to T10/T11 |
| 6. webhook rewrite | complete | 7b7987455..9bf7be49d | review HIGH PASS; follow-ups: welcome-email dedup on created-redelivery; confirm .shop from_email on new alert copy; provisioning race benign |
| 7. monitor gates | complete | 9bf7be49d..3a87daf80 | review PASS; controller confirmed founder seed chain live (implementer concern unfounded); TOCTOU naming note is brief-level |
| 8. runner heartbeat | complete | 3a87daf80..9ec6c18c2 | review PASS; hourly cron live, first run processed 1 due monitor with real alert |
| 9. monitors rewire + retire | complete | 9ec6c18c2..be59ab674 | review PASS w/ notes; backlog: SSRF guard dropped from create proxy (upstream-only), DELETE ignores res.ok, dead email prop, gradeFor invented thresholds in dead UI; HAZARD: third-party concurrent prod restarts/rebuilds confirmed twice today - deploy mutex needed |
| 10. test-mode E2E | complete | be59ab674..7aeb541b1 | review PASS 10/10 steps incl dup no-op/cancel-grace/lapse-close/baseline restored; CRITICAL for T11: customer-portal/.env.local whsec != running-process value (matches root .env) - must align stripe vars in .env.local BEFORE final restart or webhooks silently break |
| 11. prod DoD | complete | 7aeb541b1..d6cc5d2b6 (+env.local align uncommitted-ignored) | S0 landmine defused (whsec aligned, identity-preserving restart proven); S2 regression green incl founder agency via spine; S3 live-validation PENDING MIKE |
| FINAL P2 review | complete | d6cc5d2b6..425bd8039 | initial NOT-READY (C1 past_due leak, I1 dead email endpoint, I2 mode pollution, I3 drift snapshot); fix wave 5de40158c/dec7cdfc9/c70ba0ffa + outbox AgentMail repoint 425bd8039 after revoked SendGrid key discovered (401) | VERDICT: READY |
| Ops note | - | - | SENDGRID_API_KEY provisioned then superseded by AgentMail repoint; drop-in sendgrid.conf now unused (harmless) |
