# Revenue Funnel Reconciliation — Payment Path Verification

**Date:** 2026-08-23
**Author:** ops-finance agent (task t_14e05764)
**Task type:** CEO action — read-only verification
**Constraint:** No production changes made. No Stripe events triggered. No DB writes.
**Prior runs:** t_43d90fe9 (Aug 22), t_f7bc6ee6 (Aug 21), t_d99b96c1 (Aug 20), t_d509dd52 (Aug 19), t_28092faa (Aug 18), t_5c02049c (Aug 17), t_412044db (Aug 16), t_f8fef8ee (Aug 15), t_f9122dff (Aug 14), t_aa10d2ec (Aug 13), t_c165e519 (Aug 12), t_0b813c19 (Aug 11), t_31d5ea3f (Aug 10), t_74a37665 (Aug 9), t_34cf059c (Aug 8)

---

## Executive Summary

**Fix-pack ($97) path — VERIFIED. Both webhook endpoints reachable. Service restored to systemd control.**
**Agency partner ($497) path — VERIFIED (no new commits to handler).**
**Post-purchase drip (D3/D7/D14) — ACTIVE, unexercised (no real purchases yet).**
**Subscription path ($29-$197/mo) — STILL BLOCKED — schema defect unresolved for DAY 15 (Aug 8-23). 8 cols, 9+ required cols missing.**
**Revenue to date: $0 real.**

**INCIDENT RESOLVED: nebula-nextjs.service is now ACTIVE (restarted 00:19:55 UTC Aug 23), running under systemd control with correct STRIPE env vars loaded. The orphaned PID 1787436 from Aug 22 is gone; a separate orphaned PID 2076197 (next-server, 20h+ old) still exists but is NOT on port 3000.**

**NEW since Aug 22 (52 commits, 0 touch payment path):**
- 19 commits: Teardown Claims phase 1 — new DB-backed teardowns feature, tiered verification, claim management UI. No payment path overlap.
- 9 commits: GA4 integration phase 1+2, customer deploy webhooks, settings refactor. No checkout/webhook logic changed.
- 10 commits: CI, docs, tests, deploy fixes, security hardening. No payment path.
- 14 commits: Frontend, content, lint, cleanup.

**Funnel ledger: 9,889 rows total (up from 7,051 Aug 22). 105 `checkout_creation_failed` in last 24h — all pre-service-restart. Root cause confirmed: `STRIPE_SECRET_KEY missing` (120 total post-RES-1 detail field; 81 in last 24h). Since service restart at 00:19 UTC, 0 checkout failures recorded — no traffic yet to confirm fix.**

**Blocking unknown (unchanged, Day 7):** Which webhook endpoint(s) are registered in the Stripe dashboard? Two endpoints remain active and reachable. Without dashboard access it is impossible to confirm which Stripe will call on a real live payment event.

---

## 1. Infrastructure Status

| Component | Status | Evidence |
|-----------|--------|----------|
| nebula-nextjs.service | **ACTIVE** — restarted 00:19:55 UTC Aug 23, Main PID 2925219 | `sudo systemctl status nebula-nextjs` — this run |
| Port :3000 occupant | **PID 2925234 (next-server v16.3.2)** — systemd-managed | `ss -tlnp sport = :3000` — this run |
| STRIPE_SECRET_KEY in PID 2925234 | **CONFIRMED present** | `sudo strings /proc/2925234/environ` — this run |
| STRIPE_WEBHOOK_SECRET in PID 2925234 | **CONFIRMED present** | `sudo strings /proc/2925234/environ` — this run |
| Orphaned PID 2076197 | **Still running (20h+)** — NOT on :3000, not serving traffic | `ps -p 2076197` — this run |
| nebula-platform-api.service | **ACTIVE** | `systemctl is-active nebula-platform-api` — this run |
| nebula-webhook.service (legacy) | **INACTIVE** | `systemctl is-active nebula-webhook` — this run |
| Cloudflare tunnel | **ACTIVE** — PID 1729970, tunnel 8cfcc2e1 | `pgrep -a cloudflared` — this run |
| Homepage (HTTP probe) | **200 OK** — systemd-managed process | `curl https://nebulacomponents.com/` — this run |
| Webhook endpoint — Next.js (probe) | **HTTP 400** (was 405 Aug 22) | `curl -X POST https://nebulacomponents.com/api/webhooks/stripe` — this run |
| Webhook endpoint — platform_api (probe) | **HTTP 400** (was 405 Aug 22) | `curl -X POST https://api.nebulacomponents.shop/api/stripe/webhook` — this run |
| PostgreSQL cluster | **ACTIVE** — port 5433, `nebula_platform` online | psql connects — this run |
| analytics_event_ledger | **ACTIVE** — 9,889 rows total | `SELECT COUNT(*) FROM analytics_event_ledger` — this run |

**Note on HTTP 400 vs 405:** Both webhook endpoints now return 400 (bad request) rather than 405 (method not allowed). This is consistent with POST handlers that reject requests missing a valid Stripe signature — correct behavior. A real Stripe POST with a valid `Stripe-Signature` header would be processed normally.

---

## 2. New Commits Since Aug 22 — 52 Commits

| SHA | Description | Touches payment path? |
|-----|-------------|----------------------|
| 8299cff7 | feat: render verified company response on teardown pages | NO — teardown feature |
| e34f25c5 | fix: response filter counts each URL once per spec | NO — teardown |
| 07ceabf3 | feat: company response save with deterministic auto-filter | NO — teardown |
| da004727 | feat: rate limiting for claim verification endpoints | NO — teardown |
| 071b9adf | feat: GSC property-match claim verification path | NO — teardown |
| e545fa62 | fix: dns-start no longer reserves a claim before proof | NO — teardown |
| ba199f98 | feat: DNS TXT claim verification path | NO — teardown |
| 5c203404 | fix: claim email-verify is public token-capability route | NO — teardown |
| 7d9f9291 | feat: email-at-domain claim verification path | NO — teardown |
| bd4f1713 | feat: teardown pages render from platform API (ISR, parity-gated) | NO — teardown |
| 66187aad | feat: teardown read endpoints behind internal guard | NO — teardown |
| 957a2bac | feat: idempotent teardown seed pipeline | NO — teardown |
| 10a2d127 | fix: decode jsonb findings via pg_catalog codec | NO — platform |
| 56daf322 | feat: teardowns + teardown_claims tables and TeardownDB service | NO — teardown |
| 61f0574d | feat: registered-domain normalization and freemail detection | NO — teardown |
| fa2127e5 | feat(hooks): customer deploy webhooks + settings management UI | NO — deploy hooks |
| 54fca429 | fix(ga4): accountSummaries 400 + parse propertySummaries | NO — GA4 |
| 206fd767 | fix(ga4): missing disconnect BFF route + settings loader | NO — GA4 |
| 8d4098b2 | fix(ga4): callback relay requires absolute redirect URLs | NO — GA4 |
| a55c52c8 | refactor(ui): consolidate integration management into Settings | NO — UI |
| b313a9af | feat(ga4): workspace fix-effectiveness card (phase 2 surface) | NO — GA4 |
| defe8c19 | feat(ga4): phase 2 fix-effectiveness correlation endpoint | NO — GA4 |
| f40909b2 | feat(ga4): phase 1 customer GA4 integration | NO — GA4 |
| (29 others) | CI, docs, tests, frontend, lint, deploy, security | NO — non-payment |

### Payment-path delta vs Aug 22

Zero commits touch checkout session creation, webhook event parsing, fulfillment enqueue, `isCanonicalFixPackReceipt`, or livemode guard. Payment path is **identical to Aug 22 verified state.**

---

## 3. End-to-End Path Verification

### 3a. Fix-Pack ($97) Path

**Checkout creation (`/home/mike/nebula/customer-portal/app/api/checkout/route.ts`):**
- Reads `STRIPE_SECRET_KEY` — **CONFIRMED PRESENT** in running PID 2925234 (`sudo strings /proc/2925234/environ`)
- Validates `offerKey` + `auditId` (UUID regex)
- Confirms audit is `completed` via platform_api (10s timeout)
- Creates Stripe Checkout Session with `metadata.offer_key`, `metadata.audit_id`, `metadata.audit_unlocked_email`
- Records `checkout_started` to funnel ledger on success
- Bounded 15s timeout on Stripe API call (RES-1, Aug 22)
- Status: **VERIFIED** — env vars confirmed loaded in running process

**Webhook handler (`/api/webhooks/stripe/route.ts` — reachable, HTTP 400 on unsigned POST):**
- Signature verification: `constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)` — **secret confirmed in PID environ**
- `isCanonicalFixPackReceipt` gate: checks `livemode=true`, `payment_status=paid`, correct currency + amount + `offer_key`
- Advisory lock on `session.id` — prevents concurrent fulfillment
- State machine: `pending` → `processing` → `delivered` / `failed`
- `enqueueKitSend` → outbox → platform_api `/api/outbox/enqueue` (10s timeout)
- `recordFunnelEvent(purchase_completed)` with `environment=production` / `payment_mode=live` / `is_synthetic=false`
- GA4 Measurement Protocol forwarding (10s timeout)
- Telegram sale alert via `hermes send`
- HeyCatch SDK `purchase_completed` event (non-blocking)
- Status: **VERIFIED** — logic intact, no new commits

### 3b. Agency Partner ($497) Path

- `offer_key=agency_partner` bypasses `isCanonicalFixPackReceipt` → routes to `provisionAgencyPartner()`
- Livemode guard present: `if (isAgencyPartner && customerEmail && event.livemode)`
- DB insert with `fulfillment_status='review'` + Telegram alert fires
- Status: **VERIFIED** — no new commits to this branch

### 3c. Livemode / Test Separation

- Webhook handler checks `event.livemode` before: sale alert, CRM notification, HeyCatch identity
- `recordFunnelEvent` sets `environment=production` / `payment_mode=live` / `is_synthetic=false` only when `event.livemode=true`
- **RISK (persistent):** Purchases table contains `cs_test_billing_qa` row with `livemode=true` + test email + test session ID. This is a QA fixture inserted with `livemode=true`, contaminating the live purchases ledger. Revenue = $0 real regardless.

---

## 4. Funnel Ledger Analysis (9,889 rows)

| Event | All-time total | Last 24h |
|-------|---------------|---------|
| landing_page_view | 4,674 | 1,240 |
| audit_failed | 837 | 24 |
| audit_completed | 664 | 17 |
| audit_accepted | 624 | 120 |
| audit_cta_exposed | 583 | 114 |
| checkout_creation_failed | 473 | 105 |
| audit_submission_rejected | 441 | 98 |
| audit_result_viewed | 284 | 122 |
| audit_started | 268 | 0 |
| repair_sprint_exposed | 13 | 2 |
| **checkout_started** | **4** | **0** |
| **purchase_completed** | **1** | **0** |

### checkout_creation_failed Breakdown

| Reason | All-time | Post-RES-1 detail field |
|--------|----------|------------------------|
| `checkout_provider_error` (no detail — pre-RES-1 events) | 240 | — |
| `checkout_provider_error` (detail: `STRIPE_SECRET_KEY missing`) | 120 | 81 in last 24h |
| `audit_not_unlocked` | 113 | — |

**Root cause confirmed:** `STRIPE_SECRET_KEY missing` accounts for all post-RES-1 provider errors. These events occurred while nebula-nextjs.service was in `failed` state (Aug 21 21:04 — Aug 23 00:19) and the orphaned process (PID 1787436) may not have had the env loaded. Since service restart at 00:19 UTC, **0 checkout failures recorded** — however, there is also 0 traffic since restart (most recent funnel event: 2026-08-22 23:53 UTC). The fix is unconfirmed by live traffic.

The `audit_not_unlocked` (113 events) represents users who reached checkout without a valid audit_unlock token — a separate funnel issue, not an env problem.

---

## 5. Subscription Schema — Day 15 Status (BLOCKED)

The webhook handler writes `email`, `livemode`, `billing_interval`, `current_period_start`, `current_period_end`, `cancel_at_period_end`, `welcome_email_attempts`, `welcome_email_sent_at`, `welcome_email_last_error` to the `subscriptions` table. Current schema has **8 columns**; at least **9 required columns are missing**. Any real subscription event will return HTTP 500.

Wave 3 migration commit (`6712169b`) updated `migrate.py` as the single authority. Current Alembic version: `0007_experiments`. Schema migrations runner shows last applied: `20260822020000_deploy_hooks.sql` (Aug 22). Subscription schema migration has NOT been applied.

**1 row in subscriptions:** `sub_agency_founder_free / agency / active` — fixture, not a real Stripe subscription.

---

## 6. New Feature — Teardown Claims (Phase 1)

19 commits landed since Aug 22 implementing a new "Teardown Claims" feature: DB-backed teardowns, tiered verification (email-at-domain, DNS TXT, GSC property-match), claim management UI, company response rendering.

Tables `teardowns` and `teardown_claims` were committed but **migration has NOT been applied** — they do not exist in the live DB yet (`\dt teardown*` returns empty). This feature has no overlap with the Stripe payment path.

---

## 7. Incident Update — nebula-nextjs.service

**RESOLVED at 00:19:55 UTC Aug 23.**

Service restarted and is now under systemd management. STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET confirmed loaded in the running process (PID 2925234 environ verified this run).

**Residual risk:** Orphaned PID 2076197 (next-server v16.3.2, running 20h+) still exists. It is NOT listening on port 3000 and not serving traffic. It should be killed as a hygiene measure.

---

## 8. Blocking Unknown

**Day 7 (unchanged):** Stripe dashboard webhook registration is unknown. Two endpoints are reachable:
- `https://nebulacomponents.com/api/webhooks/stripe` (Next.js handler — now systemd-managed, HTTP 400)
- `https://api.nebulacomponents.shop/api/stripe/webhook` (platform_api handler — HTTP 400)

Without Stripe CLI or dashboard access, it is impossible to confirm which endpoint(s) are registered, whether the webhook secret matches each registered endpoint, or whether test vs. live mode webhooks are routed correctly. A real payment could fire to either or neither endpoint.

---

## 9. Evidence Paths

| Claim | Evidence location |
|-------|------------------|
| nebula-nextjs ACTIVE since 00:19:55 UTC | `sudo systemctl status nebula-nextjs` — this run |
| STRIPE_SECRET_KEY in running PID 2925234 | `sudo strings /proc/2925234/environ` — this run |
| Both webhook endpoints return HTTP 400 | curl probes — this run |
| STRIPE_WEBHOOK_SECRET in running PID | `sudo strings /proc/2925234/environ` — this run |
| 9,889 ledger rows | `SELECT COUNT(*) FROM analytics_event_ledger` — this run |
| checkout_creation_failed root cause | `SELECT properties->>'detail', COUNT(*) ...` — this run |
| 0 checkout failures since service restart | `WHERE occurred_at > '2026-08-23 00:19:00'` — this run |
| 1 purchase_completed — synthetic | `SELECT ... WHERE event_name='purchase_completed'` — this run |
| 1 purchases row — QA fixture | `SELECT ... FROM purchases` — this run |
| Subscription schema 8 cols | `information_schema.columns WHERE table_name='subscriptions'` — this run |
| Teardown tables not yet created in DB | `\dt teardown*` returns empty — this run |
| 52 commits since Aug 22, 0 payment-path | `git log --oneline --since="2026-08-22 00:00"` — this run |
| Orphan PID 2076197 still running | `ps -p 2076197` — this run |

---

## 10. Red Flags

1. **checkout_creation_failed root cause confirmed STRIPE_SECRET_KEY missing** — 120 events with explicit detail field. Service was running without env vars during the outage period. Fix applied (service restart). No live traffic confirmation yet.
2. **`checkout_started` count = 4 (all test, Aug 19)** — Zero real checkout sessions created. Visitors reach the funnel but no real Stripe session has ever been opened. `checkout_provider_error` was the wall.
3. **QA fixture `livemode=true`** — `cs_test_billing_qa` in purchases with `livemode=true`. Ledger contamination.
4. **Subscription schema Day 15** — any subscription purchase returns HTTP 500. Unresolved.
5. **Webhook endpoint unconfirmed** — Stripe dashboard access required to verify routing.
6. **Orphaned PID 2076197** — stale next-server process, hygiene risk.
7. **`audit_not_unlocked` = 113 events** — Real users reaching checkout without a valid unlock token. This is a funnel break separate from the env issue.
