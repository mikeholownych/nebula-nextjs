# Revenue Funnel Reconciliation — Payment Path Verification

**Date:** 2026-08-26
**Author:** ops-finance agent (task t_43a52615)
**Task type:** CEO action — read-only verification
**Constraint:** No production changes made. No Stripe events triggered. No DB writes.
**Prior runs:** t_223ebe35 (Aug 25), t_52ba6317 (Aug 24), t_14e05764 (Aug 23), t_43d90fe9 (Aug 22), t_f7bc6ee6 (Aug 21), t_d99b96c1 (Aug 20), t_d509dd52 (Aug 19), t_28092faa (Aug 18), t_5c02049c (Aug 17), t_412044db (Aug 16), t_f8fef8ee (Aug 15), t_f9122dff (Aug 14), t_aa10d2ec (Aug 13)

---

## Executive Summary

**Fix-pack ($97) path — VERIFIED. Service ACTIVE since Aug 25 14:16:42 UTC (now 9h+ uptime). STRIPE live keys confirmed loaded.**
**Agency partner ($497) path — VERIFIED (no new commits to handler since Aug 25).**
**Subscription path ($29-$497/mo) — VERIFIED (migration 0008 live; welcome email retry hardened as of Aug 25).**
**Revenue to date: $0 real. purchases table has 1 test-mode delivered row only.**

**NEW since Aug 25 22:08 UTC: 0 new commits. No code changes to assess.**

**INCIDENT (standing, Day 10):** outbox_messages table — 34 failed rows (30 audit_result + 4 email), all against `.invalid` test-mode recipients. Not a live delivery failure. No blocking impact.

**Blocking unknown (Day 10, unchanged):** Stripe dashboard webhook registration not inspectable read-only. Cannot confirm which endpoint(s) Stripe will call on a real payment without Stripe dashboard access.

---

## 1. Infrastructure Status

| Component | Status | Evidence |
|-----------|--------|----------|
| nebula-nextjs.service | **ACTIVE** — since Aug 25 14:16:42 UTC, PID 873965 (npm run start) | `systemctl status nebula-nextjs` — this run |
| nebula-platform-api.service | **ACTIVE** | `systemctl is-active nebula-platform-api` — this run |
| STRIPE_SECRET_KEY in PID 873965 | **CONFIRMED present (sk_live prefix)** | `sudo strings /proc/873965/environ` — this run |
| STRIPE_WEBHOOK_SECRET in PID 873965 | **CONFIRMED present (whsec_ prefix)** | `sudo strings /proc/873965/environ` — this run |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in PID | **CONFIRMED present (pk_live prefix)** | `sudo strings /proc/873965/environ` — this run |
| Cloudflare tunnel | **ACTIVE** — PID 816981, tunnel 8cfcc2e1 | `pgrep -a cloudflared` — this run |
| Homepage (HTTP probe) | **200 OK** | `curl -s https://nebulacomponents.com/` — this run |
| Webhook endpoint — Next.js (probe) | **HTTP 400** (expected: no sig header) | `curl -X POST https://nebulacomponents.com/api/webhooks/stripe` — this run |
| Webhook endpoint — platform_api (probe) | **HTTP 400** (expected: no sig header) | `curl -X POST https://api.nebulacomponents.shop/api/stripe/webhook` — this run |
| PostgreSQL — nebula_platform | **ACTIVE** — port 5433 | `psql` — this run |
| PostgreSQL — nebula_audit | **ACTIVE** — outbox_messages EXISTS | `SELECT EXISTS(...)` — this run |
| purchases (live rows) | **0 live** / 1 test-mode (delivered) | `SELECT livemode, fulfillment_status, COUNT(*)...` — this run |
| subscriptions (live rows) | **0 live** / 1 test-mode (active) | `SELECT livemode, status, COUNT(*)...` — this run |
| outbox_messages (nebula_audit) | **48 rows** — 30 failed audit_result, 4 failed email, 13 sent checkout_abandonment, 1 sent email | `SELECT channel, status, COUNT(*)` — this run |
| analytics_event_ledger | **9,563 rows** (was 9,557 Aug 25) | `SELECT COUNT(*) FROM analytics_event_ledger` — this run |
| Migration 0008 (welcome_email_* cols) | **CONFIRMED in live DB** | `\d subscriptions` — this run |

---

## 2. Commit Delta Since Aug 25 22:08 UTC

**0 new commits.**

Last commits remain:
- `adc603904` — fix: clean workspace redirect links (Aug 25 14:52 UTC)
- `86e70723b` — feat: ship agency workspace tenant routing (Aug 25 14:49 UTC)

No payment-path files touched. No regression risk to assess.

---

## 3. Fix-Pack ($97) Path — End-to-End Trace (unchanged)

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

**Test/live separation: CONFIRMED.** `livemode` field from Stripe event is checked at two points:
1. `isCanonicalFixPackReceipt` requires `livemode === true`
2. `recordPurchaseAnalytics` and `sendSaleAlert` both check `event.livemode`
3. `purchases.livemode` column stores the boolean — DB index `idx_purchases_live_email` filters on `WHERE livemode = true`

---

## 4. Agency Partner ($497) Path — End-to-End Trace (unchanged)

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

---

## 5. Subscription Path ($29-$497/mo) — End-to-End Trace (unchanged, migration confirmed)

```
Customer selects Pro/Growth/Agency plan → session.mode='subscription' checkout
  → checkout.session.completed: SKIPPED (subscription guard in webhook returns early)
  → customer.subscription.created event:
      - planFromStripePrice(priceId) looks up plan in subscription-plans.ts
      - getStripeClient().customers.retrieve() resolves email
      - provisionOrgForEmail() creates organization row
      - INSERT INTO subscriptions (org, stripe_sub_id, plan, status, livemode, ...)
      - sendSubscriptionWelcome(email, plan) → POST /api/outbox/enqueue
      - sendSaleAlert fires (livemode guard)
  → subscription_welcome_email_retry.py (cron/manual):
      - Queries subscriptions WHERE welcome_email_enqueued_at IS NULL AND attempts < 5
      - Writes directly to PG outbox_messages table in nebula_audit DB
```

Migration 0008 cols (`welcome_email_attempts`, `welcome_email_enqueued_at`, `welcome_email_last_error`) confirmed present in live DB — this run.

---

## 6. Database State

| Table | Live rows | Test rows | Notes |
|-------|-----------|-----------|-------|
| purchases | 0 | 1 (delivered) | No real revenue captured |
| subscriptions | 0 | 1 (active) | Test-mode only |
| outbox_messages | 0 pending kit_send | 34 failed (test addr) | All failures are `.invalid` addresses |
| analytics_event_ledger | 9,563 total | — | +6 rows since Aug 25 |

---

## 7. Open Issues / Risks

### RISK-1 (Blocking Unknown, Day 10): Stripe webhook registration unknown

Both endpoints return HTTP 400 without a signature header (correct behavior). Stripe dashboard access required to confirm which URL(s) are registered and whether they point to the canonical Next.js endpoint (`/api/webhooks/stripe`) vs the legacy platform_api endpoint (`/api/stripe/webhook`).

- **Impact if misconfigured:** Real payment received but no kit delivered, no purchase row written.
- **Mitigation present:** Dual-endpoint architecture. Next.js route is the canonical fulfillment writer. Platform-api route is a CRM-only projection.
- **Action needed:** CEO to confirm in Stripe dashboard → Settings → Webhooks.

### RISK-2 (Monitoring, standing): outbox_messages 34 failed rows

All against `.invalid` test addresses. Not blocking live delivery. Evidence: recipient column = `qa-task8-teaser-...@example.invalid`. Not a production issue.

### RISK-3 (Schema, standing): Two migration systems running in parallel

Alembic tracks `0001–0008` via `alembic_version` table. Custom runner tracks `20260822020000_*` via `schema_migrations` table. No new migrations today. Gap documented, not resolved.

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
| Migration 0008 applied (welcome_email_* cols) | `SELECT column_name FROM information_schema.columns WHERE table_name='subscriptions'` — this run | 3 rows confirmed |
| 0 real purchases | `SELECT livemode, fulfillment_status, COUNT(*) FROM purchases GROUP BY 1,2` — this run | 1 row: livemode=f |
| analytics_event_ledger count | `SELECT COUNT(*) FROM analytics_event_ledger` — this run | 9,563 rows |

---

## 9. Verdict

**A real $97 payment WOULD be captured and reconciled end-to-end IF the Stripe webhook is registered to the correct URL.**

The code path is sound (no changes since Aug 25):
- Signature verification: fail-closed
- Test/live separation: enforced at receipt validation
- DB persistence: advisory-locked, idempotent on retry
- Fulfillment: outbox-queued, independently idempotent by session_id
- Sale alert: Telegram via hermes send
- CRM projection: purchase_completed updates status + LTV
- Analytics: funnel ledger + GA4 + PostHog all gated on livemode

**The one blocking unknown that cannot be resolved read-only: Stripe webhook URL registration (Day 10 — same as prior 9 runs).**
