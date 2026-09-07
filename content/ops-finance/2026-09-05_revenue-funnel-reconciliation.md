# Revenue Funnel Reconciliation - 2026-09-05

**Prepared by:** ops-finance
**Run date:** 2026-09-05
**Prior run:** 2026-09-04

---

## Verdict

Payment path is **VERIFIED end-to-end** for both active offers.
45 new commits since last run — 1 commit (d1f47c874) touched webhook/checkout/payment paths.
Change is **analytics-additive only**; payment capture and fulfillment logic is unchanged.
No regressions.

**New in this run:** Opinly analytics integration added server-side revenue signal to webhook
handler and anonId passthrough to checkout session metadata. Both changes are non-blocking
and failure-safe (Opinly errors are caught, logged, and never interrupt fulfillment).

---

## Services Health

| Service | Status | Evidence |
|---|---|---|
| nebula-nextjs (Next.js) | **ACTIVE** | `systemctl is-active` → active |
| nebula-platform-api (FastAPI) | **ACTIVE** | `curl http://127.0.0.1:8001/` → `{"service":"platform_api","version":"0.1.0","environment":"production"}` |
| cloudflared-tunnel | **ACTIVE** | `systemctl is-active cloudflared-tunnel.service` → active |
| webhook route (local port 3000) | **ACTIVE** | `POST http://localhost:3000/api/webhooks/stripe` → 400 `{"error":"Missing stripe-signature header"}` - signature guard live |
| webhook route (external) | **ACTIVE** | `POST https://nebulacomponents.com/api/webhooks/stripe` → 400 `{"error":"Missing stripe-signature header"}` - route reachable publicly |

---

## Webhook Route

**File:** `customer-portal/app/api/webhooks/stripe/route.ts`
**Endpoint:** `POST /api/webhooks/stripe`
**Last modified:** d1f47c874 `feat(analytics): integrate Opinly across funnel` (Sep 4 14:04 UTC)

Signature verification flow (unchanged):
1. Raw body captured via `request.text()`
2. `STRIPE_WEBHOOK_SECRET` used via `stripe.webhooks.constructEvent()`
3. Missing or invalid signature → HTTP 400; Stripe retries automatically

Changes introduced in d1f47c874 to this file:
- Added `import { getOpinlyClient } from '@/app/lib/opinly'`
- Added Opinly server-side `track('purchase', ...)` call after successful purchase_completed path
- Call is **strictly additive**: gated on `isLive && process.env.OPINLY_API_KEY`
- Wrapped in try/catch; Opinly failures log to console and DO NOT interrupt webhook response
- No changes to fulfillment gate logic, idempotency, or database writes

**Regression assessment: NONE.** `fulfillment.ts` was NOT touched (empty diff confirmed).

---

## Environment Variables

| Variable | Present | Source | Risk |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | YES - `sk_live_51Tl...` (LIVE mode confirmed) | `.env.local` | None |
| `STRIPE_WEBHOOK_SECRET` | YES - `whsec_OawK...` prefix (dashboard-registered format) | `.env.local` | None |
| `DATABASE_URL` | YES | `.env.local` | None |
| `INTERNAL_API_SECRET` | YES | `.env.local` | None |
| `OPINLY_API_KEY` | YES | `.env.local` | None — Opinly failures are non-fatal |
| `PLATFORM_API_URL` | YES - `http://127.0.0.1:8001` | systemd drop-in | Resolved (5 consecutive runs) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | NOT in `.env.local` | N/A | Not required (server-side hosted checkout) |

---

## Fix-Pack ($97) Path - Verified

**Canonical receipt check:** `isCanonicalFixPackReceipt()` in `app/lib/public-facts.ts`
**Status:** 0 commits touching this file in this window. Unchanged.

Check requires all of:
- `livemode === true`
- `payment_status === 'paid'`
- `currency` + `amount_total` matching a `receipts[]` fact entry
- `metadata.offer_key` matching the fact entry
- `audit_id` must be a valid UUID (fulfillment gate)

On canonical receipt + valid `audit_id` UUID (sequence unchanged):
1. Row inserted in `purchases` table with `fulfillment_status = 'pending'`
2. Advisory lock acquired on `stripe_session_id` (idempotency guard)
3. Status advanced to `'processing'`
4. `enqueueKitSend()` calls `http://127.0.0.1:8001/api/outbox/enqueue` → `kit_send` channel
5. Sale alert fired via `sendSaleAlert()`
6. `recordFunnelEvent()` writes to analytics ledger with `environment='production'`, `paymentMode='live'`, `isSynthetic=false`
7. GA4 Measurement Protocol event forwarded (non-blocking)
8. **NEW:** Opinly server-side `track('purchase', ...)` call (non-blocking, gated on OPINLY_API_KEY)
9. heycatch analytics captured (non-blocking)

Duplicate/retry protection: advisory lock + `'delivered'` row state + `stripe_session_id` idempotency key — all unchanged.

---

## Agency Partner ($497) Path - Verified

**Trigger:** `session.metadata.offer_key === 'agency_partner'` + `event.livemode === true`
0 commits touching fulfillment.ts — logic unchanged.

1. `provisionAgencyPartner()` → platform API `/audit/partners`
2. Provision failure: non-fatal; row inserted as `fulfillment_status = 'review'`
3. Sale alert + CRM notification fire
4. Offer flows via Stripe checkout link direct; `offer_key=agency_partner` metadata is the sole fulfillment gate

---

## Subscription Path - Verified

Subscription-mode `checkout.session.completed` events: acknowledged only (lifecycle events own persistence — unchanged).

`customer.subscription.created/updated/deleted` events:
- Price resolved via `planFromStripePrice()` — 0 commits touching `subscription-plans.ts`
- Unrecognized price → ops alert enqueued via outbox, no subscription row written
- Missing email → ops alert enqueued, acknowledged without binding

---

## Checkout Route Change Analysis (d1f47c874)

**File:** `customer-portal/app/api/checkout/route.ts`

Changes:
- Added optional `anonId` field accepted in request body (validated: string, 1-200 chars)
- `opinlyAnonId` extracted and passed as `metadata[opinly_anon_id]` to Stripe session
- Request schema now allows 2 OR 3 keys (`offerKey`, `auditId`, optional `anonId`)

Assessment:
- Checkout session creation logic is unchanged (STRIPE_SECRET_KEY, line items, URLs)
- `anonId` is optional and adds only an analytics metadata field to the Stripe session
- Fulfillment gate (`canFulfill`) and `isCanonicalFixPackReceipt()` are unaffected
- Stripe session validation URL check (`isStripeCheckoutUrl`) unchanged
- **No regression on payment capture path**

---

## Test/Live Ledger Separation - Verified

`funnel-ledger.ts` unchanged (0 commits in this window).

In `recordFunnelEvent()`:
- `environment: isLive ? 'production' : 'test'`
- `paymentMode: isLive ? 'live' : 'test'`
- `isSynthetic: !isLive`

Database: `purchases` table `livemode BOOLEAN` column with partial index `idx_purchases_live_email WHERE livemode = TRUE`. Migration `20260803_add_purchase_livemode.sql` confirmed present from prior runs.

Opinly analytics: gated on `isLive` — test-mode events are never forwarded to Opinly.

---

## Commit Regression Scan

**New commits since last run (2026-09-04 00:32):** 45

**Commits touching payment/webhook/checkout/fulfillment paths:** 1 of 45

| Commit | Files | Assessment |
|---|---|---|
| d1f47c874 `feat(analytics): integrate Opinly across funnel` | `checkout/route.ts`, `webhooks/stripe/route.ts`, `thank-you/PurchaseTracker.tsx` | Analytics-additive only. Opinly errors non-fatal. fulfillment.ts UNMODIFIED. See detail above. |

All other 44 commits: content/SEO, blog rendering, CI fixes, package validation, provenance gates, citable information architecture, acquisition evidence — no payment path impact.

**Regression risk on payment capture: NONE.**

---

## Opinly Integration Assessment

Opinly is a content/analytics platform. In d1f47c874:

1. **Server-side revenue tracking** (webhook): `getOpinlyClient().track('purchase', ...)` — additive,
   non-blocking, gated on `isLive && OPINLY_API_KEY`. Does not affect DB writes or fulfillment state.
2. **Checkout anonId passthrough**: browser-side Opinly anonymous ID forwarded to Stripe metadata.
   Allows Opinly to correlate purchase events with anonymous user sessions. No payment logic change.
3. **New `/api/opinly` route**: content cache invalidation webhook (Opinly CMS → Next.js revalidate).
   Completely separate from Stripe payment path.
4. **`PurchaseTracker.tsx`** (client-side thank-you page): `window.opinly?.track('purchase', ...)`
   — best-effort client analytics after successful redirect. Non-blocking.
5. **`OPINLY_API_KEY` is present** in `.env.local` — confirmed.

No new environment variable is required to be added before a payment can be captured.

---

## Incidents

None active. INCIDENT-001 (nebula-nextjs systemd supervision gap) confirmed RESOLVED (5 consecutive runs).

---

## Blocking Unknown

**One blocking unknown (persistent, structural):** Stripe webhook endpoint registration for
`nebulacomponents.com` cannot be verified read-only from this environment.

The Stripe dashboard is the only source of truth for:
1. Whether the registered webhook endpoint URL = `https://nebulacomponents.com/api/webhooks/stripe`
2. Whether `STRIPE_WEBHOOK_SECRET` corresponds to the live dashboard endpoint vs a CLI test secret

**Risk level: LOW.**
- `STRIPE_WEBHOOK_SECRET` = `whsec_OawK...` prefix (correct dashboard format, ~39 chars)
- External probe to `nebulacomponents.com/api/webhooks/stripe` returns 400 (signature guard active)
- No domain or URL changes in this commit window

Recommended action: CEO or operator to confirm in Stripe dashboard (Developers → Webhooks)
that endpoint URL = `https://nebulacomponents.com/api/webhooks/stripe` and status = Enabled.
One-time manual verification closes this permanently.

---

## Summary

| Check | Result |
|---|---|
| Services (Next.js, FastAPI, Cloudflare) | ACTIVE |
| Stripe LIVE key present | CONFIRMED (`sk_live_51Tl...`) |
| Webhook secret present | CONFIRMED (`whsec_OawK...` format) |
| Webhook route responds (local + external) | CONFIRMED (400 signature guard both endpoints) |
| Signature guard active | CONFIRMED |
| Fix-pack ($97) fulfillment path | VERIFIED (fulfillment.ts unmodified; Opinly additive-only change) |
| Agency partner ($497) fulfillment path | VERIFIED (fulfillment.ts unmodified) |
| Subscription path | VERIFIED (0 commits touching subscription-plans.ts) |
| Test/live ledger separation | VERIFIED (livemode column + index, Opinly gated on isLive) |
| PLATFORM_API_URL present at runtime | CONFIRMED (systemd drop-in, 5th consecutive run) |
| OPINLY_API_KEY present | CONFIRMED — new requirement, satisfied |
| Opinly integration regression risk | NONE — analytics-additive, all failures non-fatal |
| Commit regressions (45 new commits) | NONE — 1/45 touched payment paths; additive analytics only |
| Blocking unknown | Stripe dashboard webhook URL registration unverifiable read-only (LOW risk, structural) |
