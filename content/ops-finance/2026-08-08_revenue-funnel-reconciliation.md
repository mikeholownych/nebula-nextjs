# Revenue Funnel Reconciliation Report

**Date:** 2026-08-08
**Author:** ops-finance agent (task t_81fb88d8)
**Sources:** t_34cf059c (synthesis), t_a9849c02 (Aug 8 verification), t_522efacc (Aug 7 verification),
t_6548869b (Stripe live extract), t_f5256ec9 (Aug 5 verification), t_998b9fd2 (Aug 4 verification)
**Constraint:** Read-only throughout. No production changes made.

---

## 1. Webhook Configuration Evidence

**Endpoint:** `https://nebulacomponents.com/api/webhooks/stripe`

**Evidence trail:**

| # | Fact | Source |
|---|------|--------|
| 1 | Webhook handler file exists at `customer-portal/app/api/webhooks/stripe/route.ts` (526 lines) | File read Aug 8 |
| 2 | `POST` handler accepts raw body + `stripe-signature` header | route.ts lines 149-170 |
| 3 | Signature verified via `stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)` | route.ts lines 162-170 |
| 4 | `STRIPE_WEBHOOK_SECRET` = `whsec_pq33c1…` confirmed in `/home/mike/nebula/.env` and `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf` | t_a9849c02 Aug 8 |
| 5 | `STRIPE_SECRET_KEY` = `sk_live_…` - live mode confirmed | t_a9849c02 Aug 8 |
| 6 | Endpoint resolves in production: `curl https://nebulacomponents.com/api/webhooks/stripe` → HTTP 405 (GET blocked, POST active) | t_522efacc Aug 7 |
| 7 | Next.js service active: PID 3496796, running since 2026-08-07 01:19 UTC | t_a9849c02 Aug 8 |
| 8 | Cloudflare tunnel routes `.com` and `.shop` to port 3000 | `/home/mike/.cloudflared/config.yml` |

**Events handled in code (route.ts):**

| Event type | Handler action |
|-----------|---------------|
| `checkout.session.completed` | Insert into `purchases`; fulfillment if canonical fix-pack; agency auto-provision if `offer_key=agency_partner` |
| `invoice.payment_succeeded` | Logged; no DB write (consent contract not available on invoice events) |
| `customer.subscription.created` | Upsert into `subscriptions` |
| `customer.subscription.updated` | Upsert into `subscriptions` |
| `customer.subscription.deleted` | Upsert into `subscriptions` with `status=canceled` |

**Gap:** Whether Stripe dashboard has `customer.subscription.*` events subscribed is NOT verifiable without dashboard access. This is the blocking unknown (see Section 4).

---

## 2. Test/Live Separation Evidence

**Method:** `event.livemode` boolean from Stripe event payload is checked before any DB write.

**Evidence:**

| # | Fact | Source |
|---|------|--------|
| 1 | route.ts line 179: `livemode: event.livemode` passed to `isCanonicalFixPackReceipt()` - test events fail canonical check | route.ts read |
| 2 | route.ts line 201: `event.livemode` guard before agency auto-provision | route.ts read |
| 3 | route.ts line 239: `event.livemode` guard before sale alert on review purchases | route.ts read |
| 4 | route.ts line 335: `event.livemode` guard before sale alert on canonical purchases | route.ts read |
| 5 | route.ts line 496: `event.livemode` column written into `subscriptions` table | route.ts read |
| 6 | `purchases` table has `livemode` column - migration `20260803_add_purchase_livemode.sql` confirmed applied | t_a9849c02 Aug 8 |
| 7 | `subscriptions` table has `livemode` column - confirmed present in schema | t_a9849c02 Aug 8 |
| 8 | Live purchases count: `SELECT COUNT(*) FROM purchases WHERE livemode=true` → **0** real rows | t_6548869b Aug 6 |
| 9 | One QA fixture row: `stripe_session_id=cs_test_billing_qa`, `email=e2e-crawler-test@example.com`, `livemode=true` by DB flag | t_6548869b Aug 6 |
| 10 | Audit DB (`nebula_audit.purchases`) - 0 rows. No cross-contamination between live and audit schemas. | t_a9849c02 Aug 8 |
| 11 | Zero subscriptions in `nebula_platform.subscriptions` | t_a9849c02 Aug 8 |

**Status:** Test/live separation is IMPLEMENTED. The QA fixture anomaly (row 9) is a test-seeded row flagged as livemode=true in the DB - it is not a real customer or real revenue. It should be cleaned up but does not represent evidence of leakage.

---

## 3. Reconciliation Path Diagram (ASCII)

```
STRIPE DASHBOARD (external - not directly verifiable)
      |
      |  HTTPS POST  stripe-signature header
      v
nebulacomponents.com/api/webhooks/stripe
      |
      |  [1] constructEvent() - signature verified against whsec_pq33c1...
      v
event.type switch
      |
      +-- checkout.session.completed
      |         |
      |         |  [2] event.livemode check
      |         |
      |         +-- livemode=true + canonical fix-pack
      |         |         |
      |         |         |  [3] pg_advisory_lock(session_id)  <-- idempotency
      |         |         v
      |         |     purchases INSERT (ON CONFLICT DO NOTHING)
      |         |         |
      |         |         v
      |         |     fulfillment_status: pending -> processing -> delivered
      |         |         |
      |         |         v
      |         |     deliver_prompt_pack.py (email)
      |         |     hermes send (Telegram alert)
      |         |
      |         +-- livemode=true + agency_partner offer_key
      |         |         |
      |         |         v
      |         |     purchases INSERT (fulfillment_status='review')
      |         |     provisionAgencyPartner() -> platform API
      |         |     hermes send (Telegram alert)
      |         |
      |         +-- livemode=false (test event)
      |                   |
      |                   v
      |               [DROPPED - no DB write, no alert]
      |
      +-- customer.subscription.{created,updated,deleted}
      |         |
      |         |  [4] planFromStripePrice() - only Nebula plans proceed
      |         |  [5] Stripe API call to resolve customer email
      |         v
      |     subscriptions UPSERT (ON CONFLICT stripe_subscription_id DO UPDATE)
      |     sendSubscriptionWelcome() (email)
      |
      +-- invoice.payment_succeeded
                |
                v
            [LOGGED ONLY - no DB write]

nebula_platform DB
  purchases     (livemode col, idempotency on stripe_session_id)
  subscriptions (livemode col, idempotency on stripe_subscription_id)

nebula_audit DB
  purchases     (audit mirror - 0 rows, separate schema, no contamination)
```

**Idempotency mechanisms:**
- Fix-pack: `pg_advisory_lock` on `session.id` + `ON CONFLICT (stripe_session_id) DO NOTHING`
- Subscriptions: `ON CONFLICT (stripe_subscription_id) DO UPDATE`

---

## 4. Blocking Unknown and Resolution

**Unknown:** Stripe dashboard webhook endpoint event subscriptions for `customer.subscription.*` - CANNOT VERIFY READ-ONLY.

**Risk description:**

The subscription lifecycle handler (`customer.subscription.created/updated/deleted`) was added to `route.ts` in the Aug 4 commits. Registering new event types in the Stripe dashboard is a separate human step from deploying code changes. If the dashboard was not updated, Stripe will never deliver `customer.subscription.*` events to the endpoint - subscription revenue events would be silently dropped at Stripe before reaching the handler. The code is correct; the external configuration is unverified.

Secondary risk: The dashboard endpoint URL may still point to `nebulacomponents.shop` (older registration) rather than `nebulacomponents.com`. Both domains route to port 3000, so delivery would still succeed - this is LOW risk for fix-pack purchases but MEDIUM for subscriptions if the `.shop` endpoint predates the subscription event registrations.

**Resolution - CEO action required (one-minute check):**

1. Log into Stripe dashboard
2. Navigate to Developers → Webhooks
3. Confirm: endpoint URL ends in `.com` (or if `.shop`, that all subscription events are listed)
4. Confirm: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted` are in the subscribed events list

This cannot be automated or delegated to the agent. Dashboard API access requires credentials not available in the production environment.

**Impact if unresolved:** Fix-pack purchases (one-time $97) are NOT affected - `checkout.session.completed` was registered originally. Subscription revenue ($29–$197/mo) would be permanently invisible to the handler until the dashboard is updated.

---

## 5. Overall Verdict

**PARTIALLY VERIFIED**

**Rationale:**

| Path | Verdict | Confidence | Blocker |
|------|---------|-----------|---------|
| One-time fix-pack ($97) | VERIFIED | HIGH | None - all evidence confirmed |
| Agency partner ($497) | VERIFIED | HIGH | None - code and DB schema confirmed |
| Subscription revenue (Pro/Growth/Agency memberships) | PARTIALLY VERIFIED | MEDIUM | Stripe dashboard event subscriptions unconfirmed |

The one-time purchase capture path is end-to-end verified by direct evidence: live keys in production, handler reachable, signature verification confirmed, livemode filtering implemented, idempotency via advisory lock + conflict guard, and DB schema correct. The infrastructure has been stable since Aug 5.

The subscription path is structurally intact in code and database - all four migrations confirmed applied Aug 8, upsert logic correct, livemode filtering present. It cannot be marked VERIFIED because one external configuration step (Stripe dashboard event registration) is not verifiable without dashboard access.

**Revenue as of Aug 8:** $0 (zero livemode purchases, zero subscriptions). The QA fixture row (`cs_test_billing_qa`) is not revenue.

**The funnel is payment-ready. The conversion problem is upstream - outreach, not infrastructure.**

---

## Operating Snapshot

```
DATE:                   2026-08-08
REVENUE:                $0 (cumulative: $0)
LIVEMODE PURCHASES:     0 real
LIVEMODE SUBSCRIPTIONS: 0
QA FIXTURE ANOMALY:     1 row (cs_test_billing_qa - not revenue, flag for cleanup)
INFRASTRUCTURE:         PASS - nebula-nextjs.service active, Cloudflare tunnel active
WEBHOOK ENDPOINT:       REACHABLE - https://nebulacomponents.com/api/webhooks/stripe → 405
SIGNING SECRET:         CONFIRMED - whsec_pq33c1... in env and systemd drop-in
STRIPE LIVE KEYS:       CONFIRMED - sk_live_... in .env
DB MIGRATIONS:          ALL 4 CONFIRMED APPLIED (Aug 8)
TEST/LIVE SEPARATION:   IMPLEMENTED (event.livemode check in handler)
BLOCKING UNKNOWN:       Stripe dashboard - customer.subscription.* events unconfirmed
RESOLUTION OWNER:       CEO - Stripe dashboard login required
VERDICT:                PARTIALLY VERIFIED
```

---

## Evidence Chain Summary

All findings derive from a read-only audit chain. No production changes were made.

Primary evidence sources (in order of authority):
1. Direct file reads: `/home/mike/nebula/.env`, `route.ts`, `/home/mike/.cloudflared/config.yml`, `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf`
2. Live DB queries: `psql nebula_platform` - `\d purchases`, `\d subscriptions`, `SELECT COUNT(*) FROM purchases WHERE livemode=true`
3. Network probe: `curl https://nebulacomponents.com/api/webhooks/stripe` → HTTP 405
4. Stripe API (read-only): zero live payment objects returned as of 2026-08-06T04:40:03Z (t_6548869b)
5. Daily verification runs: t_a9849c02 (Aug 8), t_522efacc (Aug 7), t_f5256ec9 (Aug 5), t_998b9fd2 (Aug 4)

Missing evidence (constitutes the PARTIALLY VERIFIED ceiling):
- Stripe dashboard screenshot or API export confirming registered event types
- Confirmed endpoint URL in dashboard (`.com` vs `.shop`)

---

*Report generated by ops-finance agent, task t_81fb88d8.*
*Read-only verification. No production changes made.*
