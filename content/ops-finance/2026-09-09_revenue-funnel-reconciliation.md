# Revenue Funnel Reconciliation — 2026-09-09

**Run date:** 2026-09-09
**Prior verification:** 2026-09-08 00:04 (t_b2891323)
**Scope:** Read-only end-to-end payment capture and ledger reconciliation

---

## Verdict: VERIFIED — both payment paths intact, no regressions

---

## 1. New Commits Since Last Verification

8 commits since 2026-09-08 00:04.

Commits categorised by topic:

| Category | Count | Examples |
|----------|-------|---------|
| Learning-centre content (FAQ blocks) | 1 | b185b6815 — learning-centre ArticleFaq, 33 files |
| Test fix (blog-loader cwd leak) | 1 | 2fc71dae2 |
| Results page features/fixes | 3 | dd8cceb1f MRR plans, b54da6c13 GA4 fix, 3bc3d0e52 layout |
| Citable projection sync | 2 | 178182168, b70b1a544 |
| Results layout fix | 1 | f366de9dd |

**Payment-path files scanned** (webhook route, checkout route, public-facts.ts, subscription-plans.ts, fulfillment.ts, db/schema_purchases.sql, outbox):

0 of 8 commits touch any of those paths. No regressions.

---

## 2. Stripe Key Mode

- `STRIPE_SECRET_KEY` in `.env`: confirmed `sk_live...` prefix (live mode) — grep returned count 1
- `STRIPE_WEBHOOK_SECRET`: present and non-empty (count 1)
- `OPINLY_WEBHOOK_SIGNING_SECRET`: present and non-empty (count 1)

**Evidence:** `/home/mike/nebula/.env`

---

## 3. Webhook Route — Signature Verification

File: `customer-portal/app/api/webhooks/stripe/route.ts`

Unchanged since last verified run. Key controls confirmed in prior evidence (no touching commits):

- Raw body read before any parsing; `stripe.webhooks.constructEvent()` with secret — 400 on failure
- `isCanonicalFixPackReceipt()`: hard-requires `livemode === true`
- All fulfillment branches gated on `event.livemode === true`
- `funnel-ledger` stamps `environment: 'production'` / `isSynthetic: true` on test events
- Test suite: `stripe-webhook-fulfillment-gate.test.ts` — non-fulfillment on test-mode events confirmed

---

## 4. Fix-Pack ($97) Path — End-to-End

**Unchanged** — no commits to checkout route, webhook route, or fulfillment helpers.

Path summary (from verified code):
1. `/api/checkout`: live key, `getActiveFixPack()`, UUID + cookie + audit-status validation, Stripe session in `payment` mode, `isStripeCheckoutUrl` guard on return URL
2. Webhook: signature → `isCanonicalFixPackReceipt` (livemode + paid + 9700 cents + currency + offer_key) → advisory lock → idempotent `purchases` insert → kit enqueue → CRM → funnel ledger → Opinly → GA4

---

## 5. Agency-Partner ($497) Path — End-to-End

**Unchanged** — no commits to relevant files.

Path summary (from verified code):
1. Same `/api/checkout` with `offer_key=agency_partner`
2. Webhook: separate branch after `isCanonicalFixPackReceipt` returns false → `provisionAgencyPartner()` gated on `customerEmail && event.livemode` → platform API partner endpoint → Telegram alert → `purchases` insert (`fulfillment_status='review'`) → CRM

---

## 6. Subscription Path

**Unchanged.** `event.livemode === true` gate on all subscription inserts and welcome email. Known price IDs unchanged in `subscription-plans.ts`.

---

## 7. Platform API Health

```
GET http://127.0.0.1:8001/
{"service":"platform_api","version":"0.1.0","environment":"production","request_id":"2a438fe9-1f3b-474c-9a82-9609e1f5a03c"}

GET http://127.0.0.1:8001/api/outbox/enqueue
HTTP 405 (route live, method guard active — confirms endpoint exists)
```

Platform API online. Outbox enqueue endpoint live.

---

## 8. SRE Backstop

`sre_responder.py` unchanged. Runs every 15 min via cron. Revenue keyword detection and Telegram paging active. Test/internal emails excluded.

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
| Prior reconciliation (2026-09-08) | `/home/mike/nebula/content/ops-finance/2026-09-08_revenue-funnel-reconciliation.md` |

---

## 10. One Blocking Unknown

**Platform API uptime is unmonitored by an external prober.**

The kit dispatch path (`enqueueKitSend`) posts synchronously to `http://127.0.0.1:8001/api/outbox/enqueue`. If the platform API is down when a webhook fires:
- Fulfillment throws; `restoreFailedFulfillment` marks the row as `failed`
- Stripe retries for up to 3 days — eventual delivery likely if API recovers within that window
- BUT: no external health-check or pager alert confirms platform API availability before a real sale

The SRE cron (every 15 min) provides indirect detection but does not probe the outbox endpoint specifically. A silent API crash between cron runs would cause failed kit delivery with no immediate alert.

This unknown is **unchanged from all prior verification runs** (first surfaced Sep 3). It remains the sole unresolved gap.

**Recommendation (unchanged):** Add a dedicated `/api/outbox/enqueue` health probe to the SRE cron or an uptime monitor (UptimeRobot, Better Uptime) so platform API downtime pages before a customer's kit silently retries into expiry.

---

## Summary

Both payment paths (fix-pack $97, agency-partner $497) are **end-to-end verified**:
- Stripe live key active, webhook secret present, signature verification enforced
- Test/live separation hard-gated throughout
- DB schema idempotent, livemode column present and indexed
- 0 of 8 new commits regress any payment/fulfillment logic
- Platform API online and outbox endpoint confirmed live at time of verification

One blocking unknown: no external uptime monitor on platform API — synchronous dependency for kit dispatch.
