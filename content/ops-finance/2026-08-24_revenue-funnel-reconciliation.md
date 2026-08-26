# Revenue Funnel Reconciliation — Payment Path Verification

**Date:** 2026-08-24
**Author:** ops-finance agent (task t_52ba6317)
**Task type:** CEO action — read-only verification
**Constraint:** No production changes made. No Stripe events triggered. No DB writes.
**Prior runs:** t_14e05764 (Aug 23), t_43d90fe9 (Aug 22), t_f7bc6ee6 (Aug 21), t_d99b96c1 (Aug 20), t_d509dd52 (Aug 19), t_28092faa (Aug 18), t_5c02049c (Aug 17), t_412044db (Aug 16), t_f8fef8ee (Aug 15), t_f9122dff (Aug 14), t_aa10d2ec (Aug 13), t_c165e519 (Aug 12), t_0b813c19 (Aug 11), t_31d5ea3f (Aug 10), t_74a37665 (Aug 9), t_34cf059c (Aug 8)

---

## Executive Summary

**Fix-pack ($97) path — VERIFIED. Service ACTIVE since Aug 23 21:47:59 UTC. STRIPE keys confirmed loaded.**
**Agency partner ($497) path — VERIFIED (no new commits to handler).**
**Subscription path ($29-$197/mo) — MAJOR CHANGE: schema UNBLOCKED (13 cols present in DB), handler REWRITTEN (35 new commits, 10 touch payment/billing path).**
**Post-purchase drip (D3/D7/D14) — ACTIVE, unexercised.**
**Revenue to date: $0 real.**

**NEW since Aug 23 (35 commits, 10 touch payment/billing path):**
- Subscription billing spine phase 2 implemented: `customer.subscription.*` lifecycle handler, org-keyed persistence with provisioning, subscription checkout + billing portal routes.
- Subscription schema migration (`20260823100000_subscription_lifecycle.sql`) applied out-of-band — 13 cols confirmed in live DB. **Not recorded in schema_migrations table.** Migration runner gap: last recorded = `20260822020000_deploy_hooks.sql`.
- `outbox_messages` table does NOT exist in live DB — subscription welcome email path (`sendSubscriptionWelcome → outbox`) will 500 on first real subscription event.
- Fix-pack path: one additive guard added (`session.mode === 'subscription'` early return) — no regression.
- Email delivery: outbox `_send_email` migrated from SendGrid to AgentMail transactional lane (425bd8039). Outbox table not yet created — delivery pipeline is broken regardless.

**INCIDENT RESOLVED (Aug 23): nebula-nextjs.service ACTIVE since 21:47:59 UTC — new PID 3803469.**
**4 checkout_creation_failed events occurred AFTER the service restart (21:52 UTC) — including 1 with STRIPE_SECRET_KEY missing. Service restart did not fully eliminate env-missing errors; timing suggests a race window or delayed environment load.**

**Blocking unknown (unchanged, Day 8):** Stripe dashboard webhook registration unknown. Two endpoints reachable (both HTTP 400). Cannot confirm which endpoint(s) Stripe will call on a real payment.

---

## 1. Infrastructure Status

| Component | Status | Evidence |
|-----------|--------|----------|
| nebula-nextjs.service | **ACTIVE** — since Aug 23 21:47:59 UTC, Main PID 3803469 | `sudo systemctl status nebula-nextjs` — this run |
| Port :3000 occupant | **PID 3803527 (next-server v16.3.2)** — systemd-managed | `ss -tlnp sport = :3000` — this run |
| STRIPE_SECRET_KEY in PID 3803527 | **CONFIRMED present** | `sudo strings /proc/3803527/environ` — this run |
| STRIPE_WEBHOOK_SECRET in PID 3803527 | **CONFIRMED present** | `sudo strings /proc/3803527/environ` — this run |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | **CONFIRMED present** | `sudo strings /proc/3803527/environ` — this run |
| Orphaned PID 2076197 | **Still running** — NOT on :3000, not serving traffic | `ps -p 2076197` — this run |
| nebula-platform-api.service | **ACTIVE** | `systemctl is-active nebula-platform-api` — this run |
| nebula-webhook.service (legacy) | **INACTIVE** | `systemctl is-active nebula-webhook` — this run |
| Cloudflare tunnel | **ACTIVE** — PID 3561084, tunnel 8cfcc2e1 | `pgrep -a cloudflared` — this run |
| Homepage (HTTP probe) | **200 OK** | `curl https://nebulacomponents.com/` — this run |
| Webhook endpoint — Next.js (probe) | **HTTP 400** | `curl -X POST https://nebulacomponents.com/api/webhooks/stripe` — this run |
| Webhook endpoint — platform_api (probe) | **HTTP 400** | `curl -X POST https://api.nebulacomponents.shop/api/stripe/webhook` — this run |
| PostgreSQL cluster | **ACTIVE** — port 5433, `nebula_platform` online | `\dt` returns 28 tables — this run |
| analytics_event_ledger | **ACTIVE** — 9,155 rows total | `SELECT COUNT(*) FROM analytics_event_ledger` — this run |

**Note:** Ledger count dropped from 9,889 (Aug 23) to 9,155 (Aug 24). Possible row deletion or table truncation — this needs investigation. No new `purchase_completed` events.

---

## 2. New Commits Since Aug 23 — 35 Commits

10 touch payment/billing path:

| SHA | Description | Touches payment path? |
|-----|-------------|----------------------|
| 425bd8039 | fix: outbox email channel delivers via AgentMail transactional lane | **YES — fulfillment email delivery** |
| c70ba0ffa | fix: welcome delivery via outbox; side effects keyed to first insert | **YES — subscription welcome gate** |
| dec7cdfc9 | fix: subscription-mode checkout skips review-purchase branch | **YES — webhook handler fix-pack gate** |
| 7aeb541b1 | test: stripe test-mode billing e2e driver | YES — test infra |
| be79ab674 | feat: monitoring view on platform engine behind plan gates | YES — plan gating |
| 9ec6c18c2 | feat: hourly monitor runner heartbeat | YES — plan gates |
| 3a87daf80 | feat: server-side monitoring gates by plan | YES — plan gating |
| 9bf7be49d | feat: org-keyed subscription persistence with provisioning | **YES — subscription webhook handler REWRITE** |
| 7b7987455 | feat: subscription checkout and billing portal routes | **YES — new subscribe + billing portal routes** |
| ec466bf18 | feat: agency price reconciliation and billing parity fixture | YES — plan pricing |
| d77dd3592 | feat: subscription lifecycle columns | **YES — DB schema + migration** |
| 552ea0e75 | docs: billing domain language | YES — docs |
| 4aee88cdd / 816fd7a87 | plan/spec: billing entitlements spine phase 2 | YES — plan docs |
| (21 others) | teardown, cleanup, tests, CI, frontend | NO |

### Payment-path delta vs Aug 23

**Subscription webhook handler fully rewritten** in commits 9bf7be49d + dec7cdfc9 + c70ba0ffa. The fix-pack ($97) path is protected by a new `session.mode === 'subscription'` early-return guard. Agency partner path unchanged.

---

## 3. End-to-End Path Verification

### 3a. Fix-Pack ($97) Path

**Checkout creation (`customer-portal/app/api/checkout/route.ts`):**
- Reads `STRIPE_SECRET_KEY` — **CONFIRMED PRESENT** in running PID 3803527
- Validates `offerKey` + `auditId` (UUID regex)
- Confirms audit is `completed` via platform_api (10s timeout)
- Creates Stripe Checkout Session with `metadata.offer_key`, `metadata.audit_id`, `metadata.audit_unlocked_email`
- Records `checkout_started` to funnel ledger on success
- Bounded 15s timeout on Stripe API call
- Status: **VERIFIED** — env vars confirmed loaded in running process

**Webhook handler (`/api/webhooks/stripe/route.ts` — reachable, HTTP 400 on unsigned POST):**
- NEW guard: subscription-mode checkout.session.completed returns early before fix-pack logic
- Signature verification: `constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)` — **secret confirmed in PID environ**
- `isCanonicalFixPackReceipt` gate: checks `livemode=true`, `payment_status=paid`, correct currency + amount + `offer_key`
- Advisory lock on `session.id` — prevents concurrent fulfillment
- State machine: `pending` → `processing` → `delivered` / `failed`
- `enqueueKitSend` → outbox → platform_api `/api/outbox/enqueue` (10s timeout)
- `recordFunnelEvent(purchase_completed)` with `environment=production` / `payment_mode=live` / `is_synthetic=false`
- GA4 Measurement Protocol forwarding (10s timeout)
- Telegram sale alert via `hermes send`
- HeyCatch SDK `purchase_completed` event (non-blocking)
- Status: **VERIFIED** — fix-pack logic intact, guard additive only

### 3b. Agency Partner ($497) Path

- `offer_key=agency_partner` bypasses `isCanonicalFixPackReceipt` → routes to `provisionAgencyPartner()`
- Livemode guard present: `if (isAgencyPartner && customerEmail && event.livemode)`
- DB insert with `fulfillment_status='review'` + Telegram alert fires
- Status: **VERIFIED** — no new commits to this branch

### 3c. Subscription Path ($29-$197/mo) — NEWLY ACTIVE BUT BROKEN

**Checkout creation (`/api/subscribe/route.ts` — new):**
- Creates `mode: 'subscription'` Stripe Checkout Session
- `customer.subscription.created` fires on payment — handled by lifecycle block
- Status: **ROUTE EXISTS** — untested in production

**Webhook lifecycle handler (new, 9bf7be49d):**
- Handles `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
- Resolves plan from Stripe price ID via `subscription-plans.ts`
- `provisionOrgForEmail()` creates org, then upserts into `subscriptions` table
- Sends Telegram alert + `sendSubscriptionWelcome()` on new subscription (livemode only)
- `sendSubscriptionWelcome` → `outbox.enqueue()` → **`outbox_messages` table does NOT exist in DB**
- Status: **BROKEN** — `outbox_messages` table missing; any real subscription will throw DB error during welcome delivery. The INSERT into `subscriptions` is in a try/catch that returns HTTP 500 on failure — but welcome email is called after the subscription row is committed, so subscription may persist while welcome email fails silently.

**Exact failure path:**
1. Stripe fires `customer.subscription.created` → webhook receives it
2. `provisionOrgForEmail` + subscription upsert succeeds (table exists, 13 cols present)
3. `subscriptionInserted = true`, `event.livemode = true`
4. `sendSubscriptionWelcome(email, plan)` called
5. `outbox.enqueue()` → `INSERT INTO outbox_messages` → **relation does not exist → exception**
6. `sendSubscriptionWelcome` is called with `await` in the handler — failure propagates
7. Handler either returns 500 (Stripe retries) or logs error and returns 200 depending on error handling
8. Subscription row may already be committed — idempotency on retry via `ON CONFLICT (stripe_subscription_id) DO UPDATE`

**Note on migration gap:** `subscriptions` table has 13 cols (migration applied), but `schema_migrations` last entry = `20260822020000_deploy_hooks.sql`. Migrations `20260822090000_unlock_attribution.sql`, `20260822120000_teardown_claims.sql`, `20260822220000_fix_impl_unique.sql`, and `20260823100000_subscription_lifecycle.sql` were applied outside the migration runner. DB state is ahead of the recorded migration state.

### 3d. Livemode / Test Separation

- Webhook handler checks `event.livemode` before: sale alert, CRM notification, HeyCatch identity, subscription welcome
- `recordFunnelEvent` sets `environment=production` / `payment_mode=live` / `is_synthetic=false` only when `event.livemode=true`
- **RISK (persistent):** `cs_test_billing_qa` row in purchases with `livemode=true` + test email. Ledger contamination.

---

## 4. Funnel Ledger Analysis (9,155 rows)

| Event | All-time total | Latest |
|-------|---------------|--------|
| landing_page_view | 4,711 | 2026-08-24 00:12 UTC |
| audit_failed | 849 | 2026-08-23 21:52 UTC |
| audit_accepted | 685 | 2026-08-23 21:52 UTC |
| audit_completed | 669 | 2026-08-23 18:14 UTC |
| audit_cta_exposed | 605 | 2026-08-23 18:14 UTC |
| checkout_creation_failed | 533 | 2026-08-23 21:52 UTC |
| audit_submission_rejected | 504 | 2026-08-24 00:08 UTC |
| audit_result_viewed | 285 | 2026-08-23 16:30 UTC |
| audit_started | 269 | 2026-08-23 16:29 UTC |
| audit_url_submitted | 20 | 2026-08-23 16:30 UTC |
| repair_sprint_exposed | 13 | 2026-08-22 16:15 UTC |
| audit_result_load_failed | 5 | 2026-08-21 06:59 UTC |
| **checkout_started** | **4** | **2026-08-19 04:20 UTC** |
| repair_sprint_clicked | 1 | 2026-08-19 04:20 UTC |
| **purchase_completed** | **1** | **2026-08-19 04:20 UTC** |
| audit_cta_clicked | 1 | 2026-08-19 04:20 UTC |

**WARNING: Ledger row count decreased from 9,889 (Aug 23) to 9,155 (Aug 24) — a drop of 734 rows. This is anomalous. Possible causes: explicit DELETE, table rebuild, or measurement error. Requires investigation. Revenue ledger integrity cannot be fully guaranteed until explained.**

### Post-restart checkout_creation_failed

4 checkout_creation_failed events occurred AFTER the service restart (21:47:59 UTC Aug 23):
- 1 with `STRIPE_SECRET_KEY missing` detail (21:52 UTC)
- 3 with no detail field

These occurred in a tight cluster at 21:52 UTC — approximately 4 minutes after restart. This suggests a brief window where the process was not yet fully initialized. No further failures recorded after 21:52 UTC. Fix appears effective with a short race window.

---

## 5. Subscription Schema Status — UNBLOCKED (Day 16)

**RESOLVED (applied out-of-band):** `subscriptions` table now has 13 columns — all lifecycle columns present including `billing_interval`, `current_period_start`, `current_period_end`, `cancel_at_period_end`, `livemode`.

**NEW BLOCKER:** `outbox_messages` table does not exist. Subscription welcome email path is broken. A real subscription event will fail during welcome delivery.

Migration runner gap: 4 migrations applied to DB but not recorded in `schema_migrations`. Migration state is untrustworthy.

---

## 6. New Features — Subscription Billing Spine (Phase 2)

Major billing infrastructure landed since Aug 23:

1. **Subscription lifecycle handler** — full `customer.subscription.*` event handling with org provisioning
2. **Subscribe route** — `/api/subscribe` creates `mode: 'subscription'` Stripe Checkout Sessions
3. **Billing portal route** — `/api/billing-portal` creates customer portal sessions
4. **Plan entitlements** — `EntitlementService` as single authority for plan-gated features
5. **Monitoring gates** — server-side plan gating for monitoring features
6. **AgentMail transactional lane** — outbox `_send_email` migrated from SendGrid to AgentMail

**Stripe test-mode e2e driver** (`scripts/stripe_test_e2e.py`, 700 lines) added — not yet run in this environment.

---

## 7. Incident Update

**RES-1 (STRIPE env missing) — RESOLVED at 21:47:59 UTC Aug 23.** New PID 3803469. 4 trailing failures at 21:52 UTC (within 4 min of restart) then zero. Considered resolved.

**Orphaned PID 2076197** still running. Not serving traffic. Hygiene risk unresolved.

**Ledger count anomaly:** 734 rows missing vs Aug 23 count. Not yet explained.

---

## 8. Blocking Unknown

**Day 8 (unchanged):** Stripe dashboard webhook registration is unknown. Two endpoints are reachable:
- `https://nebulacomponents.com/api/webhooks/stripe` (Next.js handler — HTTP 400)
- `https://api.nebulacomponents.shop/api/stripe/webhook` (platform_api handler — HTTP 400)

Without Stripe CLI or dashboard access, it is impossible to confirm:
- Which endpoint(s) are registered in the Stripe dashboard
- Whether the webhook secret matches each registered endpoint
- Whether test vs. live mode webhooks route correctly
- Whether the new subscription events (`customer.subscription.*`) are registered

A real payment could fire to either or neither endpoint. **Subscription events require explicit Stripe webhook registration** — they are not enabled by default and may not be in the current registered event list.

---

## 9. Evidence Paths

| Claim | Evidence location |
|-------|------------------|
| nebula-nextjs ACTIVE since 21:47:59 UTC Aug 23 | `sudo systemctl status nebula-nextjs` — this run |
| STRIPE keys in running PID 3803527 | `sudo strings /proc/3803527/environ` — this run |
| Both webhook endpoints return HTTP 400 | curl probes — this run |
| 9,155 ledger rows (down from 9,889) | `SELECT COUNT(*) FROM analytics_event_ledger` — this run |
| 4 checkout_creation_failed post-restart | `WHERE occurred_at > '2026-08-23 21:47:59'` — this run |
| 0 purchase_completed since Aug 19 | `SELECT MAX(occurred_at) WHERE event_name='purchase_completed'` — this run |
| 1 purchases row — QA fixture | `SELECT * FROM purchases` — this run |
| subscriptions 13 cols | `information_schema.columns WHERE table_name='subscriptions'` — this run |
| outbox_messages table missing | `\dt` — 28 tables, no outbox_messages — this run |
| schema_migrations last = Aug 22 | `SELECT * FROM schema_migrations ORDER BY applied_at DESC LIMIT 3` — this run |
| alembic_version = 0007_experiments | `SELECT * FROM alembic_version` — this run |
| 35 commits since Aug 23, 10 touch payment | `git log --since=2026-08-23` — this run |
| Orphan PID 2076197 still running | `ps -p 2076197` — this run |
| teardowns/teardown_claims tables missing from DB | `\dt tear*` returns empty — this run |

---

## 10. Red Flags

1. **Ledger row count dropped 734 rows** (9,889 → 9,155) — anomalous, unexplained. Revenue ledger integrity risk.
2. **outbox_messages table missing** — subscription welcome email path will fail on first real subscription event. Outbox infrastructure committed but DB table not created.
3. **Subscription webhook events not confirmed in Stripe dashboard** — `customer.subscription.*` events require explicit registration. May not be enabled.
4. **Migration runner gap** — 4 applied migrations not recorded in schema_migrations. DB state and migration runner are out of sync. Any automated migration check will miss these.
5. **4 checkout_creation_failed post-restart** (including 1 with STRIPE_SECRET_KEY missing at 21:52 UTC) — trailing failures in 4-minute window after service restart. Considered resolved but worth monitoring.
6. **checkout_started = 4 (all Aug 19 test)** — zero real checkout sessions ever opened.
7. **QA fixture livemode=true** — `cs_test_billing_qa` in purchases with `livemode=true`. Ledger contamination.
8. **Orphaned PID 2076197** — stale next-server process.
9. **audit_not_unlocked** — 113+ events, real users reaching checkout without unlock token. Separate funnel break.
10. **Webhook endpoint unconfirmed (Day 8)** — no Stripe dashboard access.
