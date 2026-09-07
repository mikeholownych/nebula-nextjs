# Revenue Funnel Reconciliation — 2026-09-07

**Run date:** 2026-09-07
**Prior verification:** 2026-09-06 00:33 (t_6c44cc48)
**Scope:** Read-only end-to-end payment capture and ledger reconciliation

---

## Verdict: VERIFIED — both payment paths intact, no regressions

---

## 1. New Commits Since Last Verification

6 commits since 2026-09-06 00:33:

| Commit | Summary | Touches payment path? |
|--------|---------|----------------------|
| 651a63f | fix: restore audit hero two-column layout | No — UI layout only |
| 34b61a2 | fix: restore readable audit sample columns | No — UI layout only |
| 4be9e98 | feat: strengthen repair decision proof | No — ResultsClient, RepairEvidencePanel UI |
| 9349b29 | feat: add feedback capture to audit results | No — ResultsClient, ResultsFeedback UI |
| 4a62207 | fix: retry transient OpenSERP failures | No — scripts/openserp_rank_tracker.py |
| dce1ae6 | feat: ship evidence-safe audit and monitoring safeguards | No — pricing page, audit UI, analytics-registry, mcp server card |

**0 of 6 commits touch webhook/checkout/fulfillment/outbox logic. No regressions.**

---

## 2. Stripe Key Mode

- `STRIPE_SECRET_KEY` in `.env`: confirmed `sk_live...` prefix (live mode)
- `STRIPE_WEBHOOK_SECRET`: present and non-empty (verified in .env line 14)
- `OPINLY_WEBHOOK_SIGNING_SECRET`: present and non-empty (line 21)

**Evidence:** `/home/mike/nebula/.env` — live key confirmed, no test-mode key in non-example env files.

---

## 3. Webhook Route — Signature Verification

File: `customer-portal/app/api/webhooks/stripe/route.ts`

- Route reads raw body text and `stripe-signature` header before any other processing.
- Calls `stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)` — returns 400 on any failure.
- No bypass path found.

**Test/live separation gates (verified in code):**
- `isCanonicalFixPackReceipt()` (public-facts.ts line 335): explicitly requires `receipt.livemode === true`
- `sendSaleAlert()`: only fires when `event.livemode === true` (route.ts lines 131, 222, 335)
- `provisionAgencyPartner()`: only fires when `event.livemode` is true (route.ts line 93)
- `funnel-ledger` `recordFunnelEvent`: stamps `environment: isLive ? 'production' : 'test'` and `isSynthetic: !isLive` (route.ts lines 312–314)
- Fulfillment kit dispatch (`enqueueKitSend`): only reached after `isCanonicalFixPackReceipt` passes, which hard-requires `livemode === true`
- Test confirming non-fulfillment on test-mode: `stripe-webhook-fulfillment-gate.test.ts` — "does not fulfill or alert for test-mode ($97-equivalent) events"

---

## 4. Fix-Pack ($97) Path — End-to-End

**Checkout creation** (`/api/checkout/route.ts`):
1. Reads `STRIPE_SECRET_KEY` (live) — fails 503 if missing
2. Fetches `getActiveFixPack()` from public-facts — enforces canonical price/offerKey
3. Validates `auditId` UUID + audit unlock cookie
4. Verifies `audit.status === 'completed'` via platform API before allowing checkout
5. Creates Stripe Checkout Session in `payment` mode (one-time), injects `offer_key`, `audit_id`, `url` into metadata
6. Returns only `checkout.stripe.com` URLs (validated by `isStripeCheckoutUrl`)

**Webhook fulfillment** (`/api/webhooks/stripe/route.ts`):
1. Signature verified → `checkout.session.completed` event
2. `isCanonicalFixPackReceipt`: livemode=true + payment_status=paid + amount=9700 cents + currency=usd + offer_key match
3. `pg_advisory_lock` on session ID — prevents concurrent double-fulfillment
4. `INSERT ... ON CONFLICT DO NOTHING` into `purchases` table — idempotent
5. Status transition: `pending` → `processing` — only one worker can claim
6. `enqueueKitSend` → platform API outbox (`/api/outbox/enqueue`) with kit_send channel
7. On failure: `restoreFailedFulfillment` resets to `failed` for Stripe retry
8. On success: `fulfillment_status = 'delivered'` (set by outbox processor)
9. CRM notified via `/api/crm/purchase-completed`
10. Funnel ledger records `purchase_completed` with `environment: 'production'`
11. Opinly receives authoritative revenue signal (dedup by session ID)
12. GA4 Measurement Protocol purchase event fired server-side

**Database schema** (`db/schema_purchases.sql` + migration `20260803`):
- `purchases` table: UNIQUE constraint on `stripe_session_id` — duplicate events silently ignored
- `livemode BOOLEAN NOT NULL DEFAULT TRUE` column present
- Index on `(lower(customer_email), created_at DESC) WHERE livemode = TRUE` — live purchases only in queries

---

## 5. Agency-Partner ($497) Path — End-to-End

**Checkout:** Same `/api/checkout` route with `offer_key=agency_partner` and `mode: payment` (one-time)

**Webhook fulfillment:**
1. `isCanonicalFixPackReceipt` returns false for agency_partner (different offer_key / amount)
2. Falls into "review" branch: checks `session.metadata?.offer_key === 'agency_partner'`
3. Requires `customerEmail && event.livemode` before calling `provisionAgencyPartner()`
4. `provisionAgencyPartner`: validates `agency_domain` custom field, derives `partner_id`, POSTs to `platform API /audit/partners`, sends Telegram alert with embed code
5. Inserted into `purchases` with `fulfillment_status = 'review'` — idempotent on conflict
6. Sale alert fires on livemode insertion
7. CRM notified

---

## 6. Subscription Path — Lifecycle Events

- `customer.subscription.created/updated/deleted` handled in route.ts lines 426–628
- `planFromStripePrice()` maps known price IDs; unknown price → outbox alert + no DB write (no silent drop)
- Subscription rows gated on `event.livemode === true` before insert (line 569)
- Welcome email (`sendSubscriptionWelcome`) fires only on first livemode subscription creation (line 583)

**Known price IDs (verified in subscription-plans.ts):**
- Pro: monthly `price_1U0l9AEINR1kU9chtiA64BKd` / annual `price_1U0l9BEINR1kU9chItjep7v9`
- Growth: monthly `price_1U0l9BEINR1kU9chHMT77i8i` / annual `price_1U0l9BEINR1kU9chdxMOIkr6`
- Agency: monthly `price_1U7eY8EINR1kU9chLslsSug3` / annual null

---

## 7. Platform API Health

```
GET http://127.0.0.1:8001/
{"service":"platform_api","version":"0.1.0","environment":"production"}
```

Platform API is running at 127.0.0.1:8001. Outbox enqueue endpoint exists (returns 405 on GET, confirming route is live). This is the sole conduit for kit dispatch; its availability at time of any real payment is the critical dependency.

---

## 8. SRE Backstop

`sre_responder.py` runs every 15 min via cron.
- Monitors `sre_state.json` and `pipeline_health.json` for revenue events
- Sends Telegram alert on purchase/payment keywords in escalation items
- Provides fallback revenue detection if `sendSaleAlert` (hermes send) fails

Test/internal emails excluded from auto-escalation: `mike.holownych@aisyndicate.io`, `mike.holownych@gmail.com`, and others listed in `TEST_EMAILS_LC`.

---

## 9. Evidence Paths

| Artifact | Path |
|----------|------|
| Webhook route | `/home/mike/nebula/customer-portal/app/api/webhooks/stripe/route.ts` |
| Fulfillment helpers | `/home/mike/nebula/customer-portal/app/api/webhooks/stripe/fulfillment.ts` |
| Checkout route | `/home/mike/nebula/customer-portal/app/api/checkout/route.ts` |
| public-facts (canonical receipt) | `/home/mike/nebula/customer-portal/app/lib/public-facts.ts` lines 327–345 |
| Subscription plans + price IDs | `/home/mike/nebula/customer-portal/app/lib/subscription-plans.ts` |
| DB schema | `/home/mike/nebula/customer-portal/db/schema_purchases.sql` |
| livemode migration | `/home/mike/nebula/customer-portal/db/migrations/20260803_add_purchase_livemode.sql` |
| Test — fulfillment gate | `/home/mike/nebula/customer-portal/__tests__/stripe-webhook-fulfillment-gate.test.ts` |
| Test — subscription webhook | `/home/mike/nebula/customer-portal/__tests__/stripe-subscription-webhook.test.ts` |
| SRE backstop | `/home/mike/nebula/sre_responder.py` |

---

## 10. One Blocking Unknown

**Platform API uptime is unmonitored by an external prober.**

The kit dispatch path (`enqueueKitSend`) posts synchronously to `http://127.0.0.1:8001/api/outbox/enqueue`. If the platform API is down when a webhook fires:
- The fulfillment throws, `restoreFailedFulfillment` marks the row as `failed`
- Stripe will retry (up to 3 days), so eventual delivery is likely if the API recovers within that window
- BUT: there is no external health-check or pager alert confirming platform API availability before a real sale event

**The webhook route cannot succeed without the platform API being up.** The SRE cron (every 15 min) indirectly detects some failures but does not specifically probe the outbox endpoint. A silent platform API crash between cron runs would cause failed kit delivery with no immediate alert.

**Recommendation:** Add a dedicated `/api/outbox/enqueue` health probe to the SRE cron or an uptime monitor (e.g., UptimeRobot) so platform API downtime pages before a customer's kit is silently retried into expiry.

---

## Summary

Both payment paths (fix-pack $97, agency-partner $497) are **end-to-end verified**:
- Stripe live key active, webhook secret present, signature verification enforced
- Test/live separation hard-gated in `isCanonicalFixPackReceipt` and all fulfillment branches
- DB schema idempotent (UNIQUE on session ID), livemode column present and indexed
- 0 of 6 new commits regress any payment/fulfillment logic
- Platform API online at time of verification

One blocking unknown: no external uptime monitor on platform API — synchronous dependency for kit dispatch.
