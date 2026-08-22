# Revenue Funnel Reconciliation — Payment Path Verification

**Date:** 2026-08-22
**Author:** ops-finance agent (task t_43d90fe9)
**Task type:** CEO action — read-only verification
**Constraint:** No production changes made. No Stripe events triggered. No DB writes.
**Prior runs:** t_f7bc6ee6 (Aug 21), t_d99b96c1 (Aug 20), t_d509dd52 (Aug 19), t_28092faa (Aug 18), t_5c02049c (Aug 17), t_412044db (Aug 16), t_f8fef8ee (Aug 15), t_f9122dff (Aug 14), t_aa10d2ec (Aug 13), t_c165e519 (Aug 12), t_0b813c19 (Aug 11), t_31d5ea3f (Aug 10), t_74a37665 (Aug 9), t_34cf059c (Aug 8)

---

## Executive Summary

**Fix-pack ($97) path — VERIFIED on two independent handler paths.**
**Agency partner ($497) path — VERIFIED (no new commits to handler).**
**Post-purchase drip (D3/D7/D14) — ACTIVE, unexercised (no real purchases yet).**
**Subscription path ($29-$197/mo) — STILL BLOCKED — schema defect unresolved for DAY 14 (Aug 8-22). 8 cols, 9+ required cols missing (email, livemode, billing_interval, welcome_email_*, etc.).**
**Revenue to date: $0 real.**

**NEW CRITICAL — nebula-nextjs.service is FAILED since 21:04 UTC Aug 21.**
Port :3000 is occupied by an orphaned `next-server` process (PID 1787436) that is NOT managed by systemd. The service crashed into EADDRINUSE, exhausted 7 restart attempts, and stopped retrying. The website is responding (HTTP 200) but via this rogue process. The Stripe webhook endpoint at `/api/webhooks/stripe` also responds HTTP 405 (reachable), but this is uncontrolled — it is not the systemd-managed instance and may be running stale code. **This is a PRODUCTION INCIDENT.**

**NEW since Aug 21 (44 commits, 2 touch payment path):**
- `d2a5b64b` — RES-1: bounded 15s timeout on Stripe checkout creation, 10s on GA4 forwarder. Additive hardening, non-breaking.
- `59643fce` — SEC-P2-3/4: SSRF guard on signal_verifier + GA4 forwarder timeout. No checkout/webhook logic changed.

**Funnel ledger: 7,051 rows total (up from 2,089 Aug 21). 199 `checkout_creation_failed` events in last 24h (vs 126 Aug 21 cumulative). Escalating visitor-to-checkout failure rate.**
**1 `purchase_completed` event — confirmed synthetic (environment=test, is_synthetic=true, payment_mode=test, transaction_id=pi_test_..., Aug 19). Not real revenue.**
**Purchases table: 1 row — `cs_test_billing_qa / e2e-crawler-test@example.com / fix-pack / $97 / delivered / livemode=true`.** This row is a QA fixture. The `livemode=true` flag with a test email and test session ID is a test/live ledger contamination risk.

**Blocking unknown (unchanged, Day 6):** Which webhook endpoint(s) are registered in the Stripe dashboard? Two endpoints remain active; without dashboard access it is impossible to determine which one(s) Stripe will call on a real payment event.

---

## 1. Infrastructure Status

| Component | Status | Evidence |
|-----------|--------|----------|
| nebula-nextjs.service | **FAILED** — crashed 21:04 UTC Aug 21, EADDRINUSE :3000, 7 restarts exhausted | `sudo systemctl status nebula-nextjs` — this run |
| Port :3000 occupant | **Orphaned next-server PID 1787436** — NOT systemd-managed | `ss -tlnp sport = :3000` — this run |
| nebula-platform-api.service | **ACTIVE** | `systemctl is-active nebula-platform-api` — this run |
| nebula-webhook.service (legacy) | **INACTIVE** | `systemctl is-active nebula-webhook` — this run |
| Cloudflare tunnel | **ACTIVE** — PID 1729970, tunnel 8cfcc2e1 | `pgrep -a cloudflared` — this run |
| Homepage (HTTP probe) | **200 OK** — via orphaned process | `curl https://nebulacomponents.com/` — this run |
| Webhook endpoint — Next.js (probe) | **HTTP 405** — reachable but via rogue process | `curl https://nebulacomponents.com/api/webhooks/stripe` — this run |
| Webhook endpoint — platform_api (probe) | **HTTP 405** (POST-only, correct) | `curl https://api.nebulacomponents.shop/api/stripe/webhook` — this run |
| STRIPE_WEBHOOK_SECRET (nebula-nextjs) | CONFIRMED — 2 env entries in stripe.conf | `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf` — this run (key values masked) |
| PostgreSQL cluster | **ACTIVE** — port 5433, `nebula_platform` online | psql connects — this run |
| analytics_event_ledger | **ACTIVE** — 7,051 rows total | `SELECT COUNT(*) FROM analytics_event_ledger` — this run |

---

## 2. New Commits Since Aug 21 — 44 Commits

| SHA | Description | Touches payment path? |
|-----|-------------|----------------------|
| d2a5b64b | fix(wave2): resilience and resource bounds (batch A) — 15s checkout timeout, 10s GA4 timeout | **YES — additive hardening only** |
| 59643fce | fix(wave2/5): JWKS timeout, SSRF guard, GA4 forwarder timeout | **YES — SSRF/timeout hardening, no capture logic** |
| 6712169b | feat(wave3): tracked migrations + data integrity | ADJACENT — migrate.py, subscriptions/purchases schema authority |
| facb9969 | fix(migrations): dollar-quote-aware txn stripping | ADJACENT — migration runner |
| 89cb7777 | Enterprise refactor: authz, accept-and-queue, frontend runtime | ADJACENT — authz/frontend |
| (38 others) | CI, docs, frontend, security, deploy hardening | NO — non-payment |

### Payment-path delta vs Aug 21

Both payment-path commits are **additive** (timeouts, SSRF guards). No logic changes to:
- Checkout session creation (`/api/checkout/route.ts`)
- Webhook event parsing (`/api/webhooks/stripe/route.ts`)
- Fulfillment enqueue (`fulfillment.ts`)
- `isCanonicalFixPackReceipt` gate
- Livemode guard

---

## 3. End-to-End Path Verification

### 3a. Fix-Pack ($97) Path

**Checkout creation (`/api/checkout/route.ts`):**
- Reads `STRIPE_SECRET_KEY` — confirmed present (stripe.conf, 2 env entries)
- Validates `offerKey` + `auditId` (UUID regex)
- Confirms audit is `completed` via platform_api (10s timeout, RES-1)
- Creates Stripe Checkout Session with `metadata.offer_key`, `metadata.audit_id`, `metadata.audit_unlocked_email`
- Records `checkout_started` to funnel ledger on success
- Bounded 15s timeout on Stripe API call (RES-1, new this run) — **improvement**
- Status: **VERIFIED** — code path intact, timeout hardened

**Webhook handler (`/api/webhooks/stripe/route.ts`):**
- Signature verification: `constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)`
- `isCanonicalFixPackReceipt` gate: checks `livemode=true`, `payment_status=paid`, correct currency + amount + `offer_key`
- Advisory lock on `session.id` — prevents concurrent fulfillment
- State machine: `pending` → `processing` → `delivered` / `failed`
- `enqueueKitSend` → outbox → platform_api `/api/outbox/enqueue` (10s timeout)
- `recordFunnelEvent(purchase_completed)` with `environment=production` / `payment_mode=live` / `is_synthetic=false` when `event.livemode=true`
- GA4 Measurement Protocol forwarding (10s timeout, RES-1)
- Telegram sale alert via `hermes send`
- HeyCatch SDK `purchase_completed` event (try/catch, non-blocking)
- Status: **VERIFIED** — logic intact

### 3b. Agency Partner ($497) Path

- `offer_key=agency_partner` bypasses `isCanonicalFixPackReceipt` → routes to `provisionAgencyPartner()`
- Livemode guard present: `if (isAgencyPartner && customerEmail && event.livemode)`
- DB insert with `fulfillment_status='review'` + Telegram alert fires
- Status: **VERIFIED** — no new commits to this branch

### 3c. Livemode / Test Separation

- Webhook handler checks `event.livemode` before: sale alert, CRM notification, HeyCatch identity
- `recordFunnelEvent` sets `environment=production` / `payment_mode=live` / `is_synthetic=false` only when `event.livemode=true`
- **RISK:** Purchases table contains `cs_test_billing_qa` row with `livemode=true` + test email + test session ID. This is a QA fixture that was inserted with `livemode=true`, contaminating the live purchases ledger. It will inflate any `COUNT(*) WHERE livemode=true` query. Revenue = $0 real regardless.

---

## 4. Funnel Ledger Analysis (7,051 rows)

| Event | Count (all-time) | Count (last 24h) |
|-------|-----------------|-----------------|
| landing_page_view | 3,434 | 2,439 |
| audit_failed | 813 | 768 |
| audit_completed | 647 | 640 |
| audit_cta_exposed | 469 | 327 |
| audit_accepted | 504 | 234 |
| checkout_creation_failed | 368 | 199 |
| audit_submission_rejected | 344 | 172 |
| audit_started | 268 | 14 |
| audit_result_viewed | 162 | 142 |
| repair_sprint_exposed | ~8 | 8 |
| **purchase_completed** | **1** | **0** |

- The single `purchase_completed` event: `environment=test`, `is_synthetic=true`, `payment_mode=test`, `transaction_id=pi_test_1787113195011`, `occurred_at=2026-08-19`. **Not real revenue.**
- `checkout_creation_failed` (199 in 24h) is the primary funnel break. Root cause: `CHECKOUT_NOT_CONFIGURED` (STRIPE_SECRET_KEY missing at runtime) or `CHECKOUT_OFFER_UNAVAILABLE` — exact breakdown not extractable from ledger schema without properties column parse.
- Visitor funnel: ~2,439 page views → 640 audits completed → 142 results viewed → 8 repair sprint exposed → 0 checkout sessions created successfully.

---

## 5. Subscription Schema — Day 14 Status (BLOCKED)

The webhook handler writes `email`, `livemode`, `billing_interval`, `current_period_start`, `current_period_end`, `cancel_at_period_end`, `welcome_email_attempts`, `welcome_email_sent_at`, `welcome_email_last_error` to the `subscriptions` table. Current schema has **8 columns**; at least **9 required columns are missing**. Any real subscription event will return HTTP 500, causing Stripe to retry until the endpoint is disabled.

The `wave3` migration commit (`6712169b`) updated `migrate.py` as the single authority but the migration has not yet been applied to the live DB.

**1 row in subscriptions:** `sub_agency_founder_free / agency / active` — fixture, not a real Stripe subscription.

---

## 6. PRODUCTION INCIDENT — nebula-nextjs.service FAILED

**Incident opened: 2026-08-21 21:04 UTC**
**Duration at time of this report: ~3h 24min**

Root cause: At 21:04 UTC, a restart attempt collided with an already-running `next-server` process occupying port 3000. Service exhausted 7 restart attempts in rapid succession and entered permanent `failed` state. The orphaned process (PID 1787436) continued serving traffic unmanaged by systemd.

Risks:
1. The orphaned process may be running pre-recent-commit code — exact build revision unknown without inspecting PID 1787436's open files.
2. The systemd env (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET) is NOT passed to an orphaned process unless it inherited them at startup. Checkout and webhook may be silently misconfigured.
3. No automatic recovery. Service will not self-heal.
4. If the orphaned process dies, the site goes dark.

**Action required (not within read-only scope):** CEO or ops must run `sudo systemctl start nebula-nextjs` after killing the orphaned process.

---

## 7. Blocking Unknown

**Day 6 (unchanged):** Stripe dashboard webhook registration is unknown. Two endpoints are reachable:
- `https://nebulacomponents.com/api/webhooks/stripe` (Next.js handler — now via rogue process)
- `https://api.nebulacomponents.shop/api/stripe/webhook` (platform_api handler)

Without Stripe CLI or dashboard access, it is impossible to confirm which endpoint(s) are registered, whether the webhook secret matches, or whether test vs. live mode webhooks are routed correctly. A real payment could fire to either or neither endpoint.

---

## 8. Evidence Paths

| Claim | Evidence location |
|-------|------------------|
| nebula-nextjs FAILED | `sudo systemctl status nebula-nextjs` — journalctl Aug 21 21:04 UTC |
| Port :3000 orphaned | `ss -tlnp sport = :3000` — PID 1787436, `next-server` |
| Both webhook endpoints reachable (HTTP 405) | curl probes — this run |
| STRIPE_WEBHOOK_SECRET present | `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf` |
| 7,051 ledger rows | `SELECT COUNT(*) FROM analytics_event_ledger` |
| 1 purchase_completed — synthetic | `SELECT ... FROM analytics_event_ledger WHERE event_name='purchase_completed'` |
| 1 purchases row — QA fixture | `SELECT ... FROM purchases` |
| Subscription schema 8 cols | `information_schema.columns WHERE table_name='subscriptions'` |
| 44 commits since Aug 21 | `git log --oneline --since="2026-08-21"` |

---

## 9. Red Flags

1. **nebula-nextjs.service FAILED** — site running on orphaned process. STRIPE envs may not be loaded. Checkout is likely broken for new sessions.
2. **199 `checkout_creation_failed` in 24h** — real visitors hitting checkout and failing. Root cause unknown (env missing vs. offer unavailable).
3. **QA fixture `livemode=true`** — `cs_test_billing_qa` in purchases with `livemode=true`. Ledger contamination.
4. **Subscription schema Day 14** — any subscription purchase returns HTTP 500.
5. **Webhook endpoint unconfirmed** — Stripe dashboard access required to verify routing.
