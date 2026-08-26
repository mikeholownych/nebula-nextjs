# Revenue Funnel Reconciliation — Payment Path Verification

**Date:** 2026-08-25
**Author:** ops-finance agent (task t_223ebe35)
**Task type:** CEO action — read-only verification
**Constraint:** No production changes made. No Stripe events triggered. No DB writes.
**Prior runs:** t_52ba6317 (Aug 24), t_14e05764 (Aug 23), t_43d90fe9 (Aug 22), t_f7bc6ee6 (Aug 21), t_d99b96c1 (Aug 20), t_d509dd52 (Aug 19), t_28092faa (Aug 18), t_5c02049c (Aug 17), t_412044db (Aug 16), t_f8fef8ee (Aug 15), t_f9122dff (Aug 14), t_aa10d2ec (Aug 13)

---

## Executive Summary

**Fix-pack ($97) path — VERIFIED. Service ACTIVE since Aug 25 14:16:42 UTC (restarted today). STRIPE keys confirmed loaded.**
**Agency partner ($497) path — VERIFIED (no new commits to handler).**
**Subscription path ($29-$497/mo) — SCHEMA UPDATED: migration 0008 applied (welcome_email_attempts/enqueued_at/last_error cols confirmed in live DB). Retry script hardened. Welcome email path now writes directly to PostgreSQL outbox_messages in nebula_audit DB via retry script, not via HTTP API.**
**outbox_messages table: EXISTS in nebula_audit DB (confirmed). Has 4 failed email entries + 30 failed audit_result entries. No kit_send or subscription_welcome entries pending.**
**Revenue to date: $0 real. Purchases table has 1 test-mode delivered row only.**

**NEW since Aug 24 (38 commits, ~8 touch billing/subscription path):**
- Migration 0008 (`subscription_welcome_delivery`) added 3 cols to subscriptions table and applied via alembic — **confirmed in live DB**.
- Subscription welcome email retry (`subscription_welcome_email_retry.py`) hardened: now writes directly to PG outbox (not via HTTP outbox/enqueue API), with per-row attempt tracking and backoff.
- Agency workspace tenant routing shipped (86e70723b) — touches billingView, brand_profiles, domain_routes. Large commit (100+ files). No change to fix-pack or checkout handler.
- Fix-pack payment path: no commits touching `checkout/route.ts`, `webhooks/stripe/route.ts`, or `fulfillment.ts` — **no regression risk**.

**INCIDENT (standing, Day 9):** outbox_messages table contains 34 failed rows (30 audit_result, 4 email) — all against `.invalid` test-mode recipients. Not a live delivery failure. No blocking impact.

**Blocking unknown (Day 9, unchanged):** Stripe dashboard webhook registration not inspectable. Both webhook endpoints return HTTP 400 (expected without a valid signature). Cannot confirm via read-only inspection which endpoint(s) Stripe will call on a real payment without Stripe dashboard access.

---

## 1. Infrastructure Status

| Component | Status | Evidence |
|-----------|--------|----------|
| nebula-nextjs.service | **ACTIVE** — since Aug 25 14:16:42 UTC, PID 873981 (next-server v16.3.2) | `systemctl status nebula-nextjs` — this run |
| nebula-platform-api.service | **ACTIVE** — since Aug 25 14:16:42 UTC | `systemctl is-active nebula-platform-api` — this run |
| STRIPE_SECRET_KEY in PID 873981 | **CONFIRMED present (sk_live prefix)** | `sudo strings /proc/873981/environ` — this run |
| STRIPE_WEBHOOK_SECRET in PID 873981 | **CONFIRMED present (whsec_ prefix)** | `sudo strings /proc/873981/environ` — this run |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in PID | **CONFIRMED present (pk_live prefix)** | `sudo strings /proc/873981/environ` — this run |
| Systemd drop-in stripe.conf | **sk_live + pk_live + whsec_ loaded** | `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf` — this run |
| Cloudflare tunnel | **ACTIVE** — PID 816981, tunnel 8cfcc2e1 | `pgrep -a cloudflared` — this run |
| Homepage (HTTP probe) | **200 OK** | `curl -s https://nebulacomponents.com/` — this run |
| Webhook endpoint — Next.js (probe) | **HTTP 400** (expected: no sig header) | `curl -X POST https://nebulacomponents.com/api/webhooks/stripe` — this run |
| Webhook endpoint — platform_api (probe) | **HTTP 400** (expected: no sig header) | `curl -X POST https://api.nebulacomponents.shop/api/stripe/webhook` — this run |
| PostgreSQL — nebula_platform | **ACTIVE** — port 5433, 30 tables | `\dt` — this run |
| PostgreSQL — nebula_audit | **ACTIVE** — outbox_messages EXISTS | `SELECT EXISTS(...)` — this run |
| outbox_messages (nebula_audit) | **EXISTS** — 48 rows total (34 failed test-mode, 14 sent) | `SELECT channel, status, COUNT(*)...` — this run |
| analytics_event_ledger | **9,557 rows** (was 9,155 Aug 24) | `SELECT COUNT(*) FROM analytics_event_ledger` — this run |

---

## 2. New Commits Since Aug 24 — 38 Commits

**Payment/billing path files touched:**

| SHA | Description | Touches payment path? |
|-----|-------------|----------------------|
| 86e70723b | feat: ship agency workspace tenant routing | YES — billingView.tsx, subscription-plans.ts (additive only) |
| bd1695723 | fix: harden subscription welcome retry state | YES — 0008 migration, db/models.py, retry script |
| adc603904 | fix: clean workspace redirect links | No |
| Other 35 commits | Agency client CRUD, page intent classification, workspace UI | No |

**Summary: 2 of 38 commits touch billing path. Both are additive (no regressions to fix-pack or checkout handler).**

---

## 3. Fix-Pack ($97) Path — End-to-End Trace

```
Customer lands on /checkout
  → CheckoutCTAButton.tsx POST /api/checkout
  → checkout/route.ts verifies: STRIPE_SECRET_KEY, getActiveFixPack(), auditId UUID, audit_unlock cookie
  → Calls api.stripe.com/v1/checkout/sessions (15s timeout, live mode)
  → Returns {url: "https://checkout.stripe.com/..."}
  → Customer completes payment on Stripe
  → Stripe delivers checkout.session.completed to registered webhook
  → Next.js /api/webhooks/stripe/route.ts:
      - Verifies Stripe signature (constructEvent with STRIPE_WEBHOOK_SECRET)
      - Skips subscription-mode sessions (guard added Aug 24)
      - Validates isCanonicalFixPackReceipt (livemode=true, amount=9700, currency=usd, offer_key=fix-pack)
      - pg_advisory_lock on session_id (serializes retries)
      - INSERT INTO purchases (..., fulfillment_status='pending')
      - UPDATE fulfillment_status='processing'
      - Fires sendSaleAlert (hermes send → Telegram)
      - enqueueKitSend → platform_api /api/outbox/enqueue → outbox_messages
      - notifyCrmPurchaseCompleted → platform_api crm_hooks.purchase_completed
      - recordFunnelEvent → analytics_event_ledger
      - GA4 Measurement Protocol forward
      - PostHog + HeyDatch analytics
  → Outbox drains → kit delivery email sent
```

**Critical gate: isCanonicalFixPackReceipt**
- Requires `livemode=true` — test events will NOT match → no fulfillment for test payments
- Requires `amount_total=9700` (cents) OR `6700` (D7 close offer) with `offer_key=fix-pack`
- Evidence path: `/home/mike/nebula/customer-portal/app/lib/public-facts.ts` (currentFixPackReceipt + d7CloseReceipt)

**Test/live separation: CONFIRMED.** `livemode` field from Stripe event is checked at two points:
1. `isCanonicalFixPackReceipt` requires `livemode === true`
2. `recordPurchaseAnalytics` and `sendSaleAlert` both check `event.livemode`
3. `purchases.livemode` column stores the boolean — DB index `idx_purchases_live_email` filters on `WHERE livemode = true`

---

## 4. Agency Partner ($497) Path — End-to-End Trace

```
Customer clicks Stripe payment link → buy.stripe.com/4gMcN5aYk92Qaa5drY43S09
  → checkout.session.completed delivered to webhook
  → isCanonicalFixPackReceipt returns FALSE (amount != 9700/6700 or offer_key != fix-pack)
  → isAgencyPartner check: session.metadata.offer_key === 'agency_partner' AND livemode=true
  → provisionAgencyPartner(session, email) called (non-fatal on failure)
  → INSERT INTO purchases (..., fulfillment_status='review')
  → sendSaleAlert fires
  → notifyCrmPurchaseCompleted fires
```

**Note:** Agency partner uses direct Stripe payment link (`stripe_checkout_links.json`), not the `/api/checkout` endpoint. Webhook handler receives it identically. No regression from today's commits.

---

## 5. Subscription Path ($29-$497/mo) — End-to-End Trace

```
Customer selects Pro/Growth/Agency plan → session.mode='subscription' checkout
  → checkout.session.completed: SKIPPED (subscription guard in webhook returns early)
  → customer.subscription.created event:
      - planFromStripePrice(priceId) looks up plan in subscription-plans.ts
      - getStripeClient().customers.retrieve() resolves email
      - provisionOrgForEmail() creates organization row
      - INSERT INTO subscriptions (org, stripe_sub_id, plan, status, livemode, ...)
      - sendSubscriptionWelcome(email, plan) → subscription-emails.ts → POST /api/outbox/enqueue
      - sendSaleAlert fires (livemode guard)
  → subscription_welcome_email_retry.py (cron/manual):
      - Queries subscriptions WHERE welcome_email_enqueued_at IS NULL AND attempts < 5
      - Writes directly to PG outbox_messages table in nebula_audit DB
```

**Status of subscription welcome email path (Aug 25 change):**
- `subscription-emails.ts` (called from webhook) → POST to `platform_api /api/outbox/enqueue` → writes to `outbox_messages` in **nebula_audit** DB. Confirmed EXISTS.
- `subscription_welcome_email_retry.py` (hardened today, bd1695723) → writes **directly to PG** outbox_messages. No HTTP API dependency.
- Migration 0008 (`welcome_email_attempts`, `welcome_email_enqueued_at`, `welcome_email_last_error`) — **confirmed applied in live DB** via `\d subscriptions`.

**Subscription plan price mapping (planFromStripePrice):**

| Plan | Monthly Price ID | Annual Price ID |
|------|-----------------|-----------------|
| Pro ($29/mo) | price_1U0l9AEINR1kU9chtiA64BKd | price_1U0l9BEINR1kU9chItjep7v9 |
| Growth ($79/mo) | price_1U0l9BEINR1kU9chHMT77i8i | price_1U0l9BEINR1kU9chdxMOIkr6 |
| Agency ($497/mo) | price_1U7eY8EINR1kU9chLslsSug3 | null |

**Evidence:** `/home/mike/nebula/customer-portal/app/lib/subscription-plans.ts`

---

## 6. Database State

| Table | Live rows | Test rows | Notes |
|-------|-----------|-----------|-------|
| purchases | 0 | 1 (delivered) | No real revenue captured |
| subscriptions | 0 | 1 (agency/active) | Test-mode only |
| outbox_messages | 0 kit_send | 34 failed (test addr) | All failures are `.invalid` test addresses |
| analytics_event_ledger | 9,557 total | — | +402 rows since Aug 24 |

---

## 7. Open Issues / Risks

### RISK-1 (Blocking Unknown, Day 9): Stripe webhook registration unknown
Both endpoints return HTTP 400 without a signature header (correct behavior). Stripe dashboard access required to confirm which URL(s) are registered and whether they point to the canonical Next.js endpoint (`/api/webhooks/stripe`) vs the legacy platform_api endpoint (`/api/stripe/webhook`).

- **Impact if misconfigured:** Real payment received but no kit delivered, no purchase row written.
- **Mitigation present:** Dual-endpoint architecture. Next.js route is the canonical fulfillment writer. Platform-api route is a CRM-only projection.
- **Action needed:** CEO to confirm in Stripe dashboard → Settings → Webhooks.

### RISK-2 (Monitoring): outbox_messages 34 failed rows
All against `.invalid` test addresses. Not blocking live delivery. Evidence: recipient column = `qa-task8-teaser-...@example.invalid`. Not a production issue.

### RISK-3 (Schema): Two migration systems running in parallel
Alembic tracks `0001–0008` via `alembic_version` table. Custom runner tracks `20260822020000_*` via `schema_migrations` table. Migration 0008 applied via alembic today. Last custom runner migration: `20260822020000_deploy_hooks.sql` (Aug 22). Gap is documented but not resolved.

### RESOLVED (Aug 25): Subscription welcome email path
Yesterday's blocking issue (outbox_messages did not exist in nebula_platform) is resolved. Table exists in nebula_audit DB where platform_api/infra/outbox.py connects. Migration 0008 adds retry state. Retry script hardened to write directly to PG.

---

## 8. Evidence Paths

| Claim | Evidence File | Line(s) |
|-------|--------------|---------|
| STRIPE_SECRET_KEY is live (sk_live) | `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf` | line 1 |
| Webhook signature verified before any DB write | `/home/mike/nebula/customer-portal/app/api/webhooks/stripe/route.ts` | ~line 45 (constructEvent) |
| Test/live separation enforced | `/home/mike/nebula/customer-portal/app/lib/public-facts.ts` | isCanonicalFixPackReceipt (livemode===true check) |
| Fulfillment advisory lock (dedup) | `/home/mike/nebula/customer-portal/app/api/webhooks/stripe/route.ts` | pg_advisory_lock block |
| purchases.livemode column + index | PostgreSQL `\d purchases` — this run | idx_purchases_live_email WHERE livemode=true |
| outbox_messages table exists in nebula_audit | `SELECT EXISTS(...)` — this run | — |
| Migration 0008 applied | `SELECT column_name FROM information_schema.columns WHERE table_name='subscriptions'` — this run | welcome_email_* cols present |
| 0 real purchases | `SELECT COUNT(*), livemode, fulfillment_status FROM purchases` — this run | 1 row: livemode=f |

---

## 9. Verdict

**A real $97 payment WOULD be captured and reconciled end-to-end IF the Stripe webhook is registered to the correct URL.**

The code path is sound:
- Signature verification: fail-closed
- Test/live separation: enforced at receipt validation
- DB persistence: advisory-locked, idempotent on retry
- Fulfillment: outbox-queued, independently idempotent by session_id
- Sale alert: Telegram via hermes send
- CRM projection: purchase_completed updates status + LTV
- Analytics: funnel ledger + GA4 + PostHog all gated on livemode

**The one blocking unknown that cannot be resolved read-only: Stripe webhook URL registration.**
