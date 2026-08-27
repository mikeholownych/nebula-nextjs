# Revenue Funnel Reconciliation — Payment Path Verification

**Date:** 2026-08-27
**Author:** ops-finance agent (task t_9f2d285a)
**Task type:** CEO action — read-only verification
**Constraint:** No production changes made. No Stripe events triggered. No DB writes.
**Prior runs:** t_43a52615 (Aug 26), t_223ebe35 (Aug 25), t_52ba6317 (Aug 24), t_14e05764 (Aug 23), t_43d90fe9 (Aug 22), t_f7bc6ee6 (Aug 21), t_d99b96c1 (Aug 20), t_d509dd52 (Aug 19), t_28092faa (Aug 18), t_5c02049c (Aug 17), t_412044db (Aug 16), t_f8fef8ee (Aug 15), t_f9122dff (Aug 14), t_aa10d2ec (Aug 13)

---

## Executive Summary

**Fix-pack ($97) path — VERIFIED. Service ACTIVE since Aug 26 18:35:42 UTC. STRIPE live keys confirmed loaded.**
**Agency partner ($497) path — VERIFIED (no new commits to handler).**
**Subscription path ($29-$497/mo) — VERIFIED. One material change: success_url updated to `app.nebulacomponents.com/billing` — confirmed live and auth-gated correctly (HTTP 307 → /login).**
**Revenue to date: $0 real. purchases table: 0 live rows (1 test-mode only).**

**NEW since Aug 26 00:03 UTC: 21 new commits — 1 touches subscription checkout path (success_url update). No regressions.**

**INCIDENT (standing, Day 11):** outbox_messages — 40 failed rows (36 audit_result + 4 email), all against `.invalid` test-mode recipients. Not a live delivery failure.

**Blocking unknown (Day 11, unchanged):** Stripe dashboard webhook registration not inspectable read-only.

---

## 1. Infrastructure Status

| Component | Status | Evidence |
|-----------|--------|----------|
| nebula-nextjs.service | **ACTIVE** — since Aug 26 18:35:42 UTC, PID 1902047 (npm run start) | `systemctl status nebula-nextjs` — this run |
| nebula-platform-api.service | **ACTIVE** | `systemctl is-active nebula-platform-api` — this run |
| STRIPE_SECRET_KEY in PID 1902047 | **CONFIRMED present (sk_live prefix)** | `sudo strings /proc/1902047/environ` — this run |
| STRIPE_WEBHOOK_SECRET in PID 1902047 | **CONFIRMED present (whsec_ prefix)** | `sudo strings /proc/1902047/environ` — this run |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in PID | **CONFIRMED present (pk_live prefix)** | `sudo strings /proc/1902047/environ` — this run |
| Cloudflare tunnel | **ACTIVE** — PID 816981, tunnel 8cfcc2e1 | `pgrep -a cloudflared` — this run |
| Homepage (HTTP probe) | **200 OK** | `curl -s https://nebulacomponents.com/` — this run |
| Webhook endpoint — Next.js (probe) | **HTTP 400** (expected: no sig header) | `curl -X POST https://nebulacomponents.com/api/webhooks/stripe` — this run |
| Webhook endpoint — platform_api (probe) | **HTTP 400** (expected: no sig header) | `curl -X POST https://api.nebulacomponents.shop/api/stripe/webhook` — this run |
| Subscription success_url target | **HTTP 307** → /login?returnTo=%2Fbilling (correct, auth-gated) | `curl -I https://app.nebulacomponents.com/billing` — this run |
| PostgreSQL — nebula_platform | **ACTIVE** — port 5433 | `psql -p 5433 -U postgres` — this run |
| PostgreSQL — nebula_audit | **ACTIVE** — outbox_messages EXISTS | `psql -p 5433 -U postgres -d nebula_audit` — this run |
| purchases (live rows) | **0 live** / 1 test-mode (delivered) | `SELECT livemode, fulfillment_status, COUNT(*) FROM purchases GROUP BY 1,2` — this run |
| subscriptions (live rows) | **0 live** / 1 test-mode (active) | `SELECT livemode, status, COUNT(*) FROM subscriptions GROUP BY 1,2` — this run |
| outbox_messages (nebula_audit) | **54 rows** — 36 failed audit_result, 4 failed email, 13 sent checkout_abandonment, 1 sent email | `SELECT channel, status, COUNT(*) FROM outbox_messages GROUP BY 1,2` — this run |
| analytics_event_ledger | **10,019 rows** (was 9,563 Aug 26, +456) | `SELECT COUNT(*) FROM analytics_event_ledger` — this run |
| Migration 0008 (welcome_email_* cols) | **CONFIRMED in live DB** | `SELECT column_name FROM information_schema.columns WHERE table_name='subscriptions' AND column_name LIKE 'welcome_email%'` — this run |

---

## 2. Commit Delta Since Aug 26 00:03 UTC

**21 new commits.** Payment-path files touched: **1 (subscription success_url — non-regression).**

Notable commits with relevance to payment/billing:

| Commit | Summary | Impact |
|--------|---------|--------|
| `bd3b092d0` | fix(portal): cutover link consistency — subscription success_url updated from `nebulacomponents.com/workspace?upgraded=pro` to `app.nebulacomponents.com/billing?upgraded=pro` | **Low risk.** success_url is post-payment UX only; does not affect capture, fulfillment, or webhook. Target confirmed live (HTTP 307 → auth login). |
| `c624ae101` | feat: support approval gate, lifecycle-gated nurture, worker-state audit progress | Support automation + nurture engine changes; no webhook/checkout code touched. |
| `37fe52a4c` | feat(deploy): auto-rollback on failed health gate or probe | Deploy tooling; no payment path. |
| `c3b570145` | fix(migrations): declare correct target db per file | DB migration target declarations fixed; no payment logic changed. |

All other 17 commits: docs, analytics, SEO, CI, Lighthouse, customer success scripts. No payment-path regressions.

---

## 3. Fix-Pack ($97) Path — End-to-End Trace (unchanged since Aug 25)

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

## 5. Subscription Path ($29-$497/mo) — End-to-End Trace

**One change this cycle: success_url updated in `/api/subscribe/route.ts`.**

```
Customer selects Pro/Growth/Agency plan → session.mode='subscription' checkout
  → POST /api/subscribe { plan, interval }
  → requireWorkspaceUser() — auth-gated
  → Stripe checkout session created (success_url: https://app.nebulacomponents.com/billing?upgraded=<plan>)
  → Customer completes payment on Stripe
  → checkout.session.completed: SKIPPED (subscription guard in webhook returns early)
  → customer.subscription.created event:
      - planFromStripePrice(priceId) looks up plan in subscription-plans.ts
      - getStripeClient().customers.retrieve() resolves email
      - provisionOrgForEmail() creates organization row
      - INSERT INTO subscriptions (org, stripe_sub_id, plan, status, livemode, ...)
      - sendSubscriptionWelcome(email, plan) → POST /api/outbox/enqueue
      - sendSaleAlert fires (livemode guard)
  → Post-payment redirect: https://app.nebulacomponents.com/billing?upgraded=<plan>
      - Confirmed live: HTTP 307 → /login?returnTo=%2Fbilling
      - Auth-gated correctly; no broken destination
```

Migration 0008 cols (`welcome_email_attempts`, `welcome_email_enqueued_at`, `welcome_email_last_error`) confirmed present in live DB — this run.

---

## 6. Database State

| Table | Live rows | Test rows | Delta vs Aug 26 | Notes |
|-------|-----------|-----------|-----------------|-------|
| purchases | 0 | 1 (delivered) | 0 | No real revenue captured |
| subscriptions | 0 | 1 (active) | 0 | Test-mode only |
| outbox_messages | 0 pending kit_send | 40 failed (test addr) | +6 failed | All failures are `.invalid` addresses |
| analytics_event_ledger | 10,019 total | — | +456 | Active analytics pipeline |

---

## 7. Open Issues / Risks

### RISK-1 (Blocking Unknown, Day 11): Stripe webhook registration unknown

Both endpoints return HTTP 400 without a signature header (correct behavior). Stripe dashboard access required to confirm which URL(s) are registered and whether they point to the canonical Next.js endpoint (`/api/webhooks/stripe`) vs the legacy platform_api endpoint (`/api/stripe/webhook`).

- **Impact if misconfigured:** Real payment received but no kit delivered, no purchase row written.
- **Mitigation present:** Dual-endpoint architecture. Next.js route is the canonical fulfillment writer. Platform-api route is a CRM-only projection.
- **Action needed (Day 11):** CEO to confirm in Stripe dashboard → Settings → Webhooks → confirm URL and that it matches `https://nebulacomponents.com/api/webhooks/stripe`.

### RISK-2 (Monitoring, standing): outbox_messages 40 failed rows

All against `.invalid` test addresses. Not blocking live delivery. Evidence: recipient column = `qa-task8-teaser-...@example.invalid`. Not a production issue.

### RISK-3 (Schema, standing): Two migration systems running in parallel

Alembic tracks `0001–0008` via `alembic_version` table. Custom runner tracks `20260822020000_*` via `schema_migrations` table. Gap documented, not resolved.

---

## 8. Evidence Paths

| Claim | Evidence | Source |
|-------|----------|--------|
| STRIPE_SECRET_KEY is live (sk_live) | `sudo strings /proc/1902047/environ` — sk_live_5... prefix confirmed | This run |
| STRIPE_WEBHOOK_SECRET present | `sudo strings /proc/1902047/environ` — whsec_ prefix confirmed | This run |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY present | `sudo strings /proc/1902047/environ` — pk_live_ prefix confirmed | This run |
| Webhook signature verified before any DB write | `/home/mike/nebula/customer-portal/app/api/webhooks/stripe/route.ts` — constructEvent call | Static code |
| Test/live separation enforced | `/home/mike/nebula/customer-portal/app/lib/public-facts.ts` — isCanonicalFixPackReceipt livemode===true | Static code |
| Fulfillment advisory lock (dedup) | `/home/mike/nebula/customer-portal/app/api/webhooks/stripe/route.ts` — pg_advisory_lock block | Static code |
| purchases: 0 live rows | `SELECT livemode, fulfillment_status, COUNT(*) FROM purchases GROUP BY 1,2` — 1 row: livemode=f, delivered | This run |
| subscriptions: 0 live rows | `SELECT livemode, status, COUNT(*) FROM subscriptions GROUP BY 1,2` — 1 row: livemode=f, active | This run |
| analytics_event_ledger count | `SELECT COUNT(*) FROM analytics_event_ledger` — 10,019 rows | This run |
| Migration 0008 present | `SELECT column_name FROM information_schema.columns WHERE table_name='subscriptions' AND column_name LIKE 'welcome_email%'` — 3 cols | This run |
| Subscription success_url target live | `curl -I https://app.nebulacomponents.com/billing` — HTTP 307 → /login?returnTo=%2Fbilling | This run |

---

## 9. Verdict

**A real $97 payment WOULD be captured and reconciled end-to-end IF the Stripe webhook is registered to the correct URL.**

The code path is sound (no regressions in 21 new commits):
- Signature verification: fail-closed
- Test/live separation: enforced at receipt validation
- DB persistence: advisory-locked, idempotent on retry
- Fulfillment: outbox-queued, independently idempotent by session_id
- Sale alert: Telegram via hermes send
- CRM projection: purchase_completed updates status + LTV
- Analytics: funnel ledger + GA4 + PostHog all gated on livemode

**Subscription path change (success_url):** additive UX improvement — post-checkout destination updated to `app.nebulacomponents.com/billing`. Target confirmed live and auth-gated. No regression.

**The one blocking unknown that cannot be resolved read-only: Stripe webhook URL registration (Day 11 — unchanged across all prior runs).**
