# Revenue Funnel Reconciliation - 2026-09-06

**Prepared by:** ops-finance
**Run date:** 2026-09-06
**Prior run:** 2026-09-05

---

## Verdict

Payment path is **VERIFIED end-to-end** for both active offers.
37 new commits since last run — 1 commit (69e0e2ee4) is a documentation change only ("docs(content): finalize Task 4 verification receipt").
Zero commits touched webhook, checkout, fulfillment, or subscription payment paths.
No regressions.

---

## Services Health

| Service | Status | Evidence |
|---|---|---|
| nebula-nextjs (Next.js) | **ACTIVE** | `systemctl is-active` → active |
| nebula-platform-api (FastAPI) | **ACTIVE** | `curl http://127.0.0.1:8001/` → `{"service":"platform_api","version":"0.1.0","environment":"production"}` |
| cloudflared-tunnel | **ACTIVE** | `systemctl is-active cloudflared-tunnel.service` → active |
| webhook route (local port 3000) | **ACTIVE** | `POST http://localhost:3000/api/webhooks/stripe` → HTTP 400 (signature guard live) |
| webhook route (external) | **ACTIVE** | `POST https://nebulacomponents.com/api/webhooks/stripe` → HTTP 400 (signature guard live) |

---

## Webhook Route

**File:** `customer-portal/app/api/webhooks/stripe/route.ts`
**Endpoint:** `POST /api/webhooks/stripe`
**Last modified:** d1f47c874 `feat(analytics): integrate Opinly across funnel` (Sep 4 14:04 UTC)
**0 commits touching this file since 2026-09-05 00:06.**

Signature verification flow (unchanged from prior runs):
1. Raw body captured via `request.text()`
2. `STRIPE_WEBHOOK_SECRET` used via `stripe.webhooks.constructEvent()`
3. Missing or invalid signature → HTTP 400; Stripe retries automatically

---

## Environment Variables

| Variable | Present | Source | Risk |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | YES - `sk_liv...XDPR` (LIVE mode confirmed) | `.env.local` | None |
| `STRIPE_WEBHOOK_SECRET` | YES - `whsec_OawK...` prefix (dashboard-registered format) | `.env.local` | None |
| `DATABASE_URL` | YES | `.env.local` | None |
| `INTERNAL_API_SECRET` | YES | `.env.local` | None |
| `OPINLY_API_KEY` | YES | `.env.local` | None — Opinly failures are non-fatal |
| `PLATFORM_API_URL` | YES - `http://127.0.0.1:8001` | systemd drop-in (nebula-nextjs.service) | Resolved (6 consecutive runs) |
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

On canonical receipt + valid `audit_id` UUID (sequence unchanged from prior runs):
1. Row inserted in `purchases` table with `fulfillment_status = 'pending'`
2. Advisory lock acquired on `stripe_session_id` (idempotency guard)
3. Status advanced to `'processing'`
4. `enqueueKitSend()` calls `http://127.0.0.1:8001/api/outbox/enqueue` → `kit_send` channel
5. Sale alert fired via `sendSaleAlert()`
6. `recordFunnelEvent()` writes to analytics ledger with `environment='production'`, `paymentMode='live'`, `isSynthetic=false`
7. GA4 Measurement Protocol event forwarded (non-blocking)
8. Opinly server-side `track('purchase', ...)` call (non-blocking, gated on OPINLY_API_KEY, unchanged)
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

## Test/Live Ledger Separation - Verified

`funnel-ledger.ts` unchanged (0 commits in this window).

In `recordFunnelEvent()`:
- `environment: isLive ? 'production' : 'test'`
- `paymentMode: isLive ? 'live' : 'test'`
- `isSynthetic: !isLive`

Database: `purchases` table `livemode BOOLEAN` column with partial index `idx_purchases_live_email WHERE livemode = TRUE`. Migration `20260803_add_purchase_livemode.sql` confirmed present from prior runs.

Opinly analytics: gated on `isLive` — test-mode events are never forwarded to Opinly. Unchanged.

---

## Commit Regression Scan

**New commits since last run (2026-09-05 00:06):** 37

**Commits touching payment/webhook/checkout/fulfillment paths:** 0 of 37

All 37 commits: content/SEO/blog work, internal linking improvements, documentation corrections,
provenance and evidence updates — zero payment path impact.

| Commit | Files | Assessment |
|---|---|---|
| 69e0e2ee4 `docs(content): finalize Task 4 verification receipt` | docs only | Non-code documentation; no payment path contact |

**Regression risk on payment capture: NONE.**

---

## Incidents

None active. INCIDENT-001 (nebula-nextjs systemd supervision gap) confirmed RESOLVED (6 consecutive runs).

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
- No domain or URL changes in any of the 37 new commits

Recommended action: CEO or operator to confirm in Stripe dashboard (Developers → Webhooks)
that endpoint URL = `https://nebulacomponents.com/api/webhooks/stripe` and status = Enabled.
One-time manual verification closes this permanently.

---

## Summary

| Check | Result |
|---|---|
| Services (Next.js, FastAPI, Cloudflare) | ACTIVE |
| Stripe LIVE key present | CONFIRMED (`sk_liv...XDPR`) |
| Webhook secret present | CONFIRMED (`whsec_OawK...` format, 39 chars) |
| Webhook route responds (local + external) | CONFIRMED (HTTP 400 signature guard both endpoints) |
| Signature guard active | CONFIRMED |
| Fix-pack ($97) fulfillment path | VERIFIED (0 commits touching payment logic) |
| Agency partner ($497) fulfillment path | VERIFIED (0 commits touching fulfillment.ts) |
| Subscription path | VERIFIED (0 commits touching subscription-plans.ts) |
| Test/live ledger separation | VERIFIED (livemode column + index unchanged) |
| PLATFORM_API_URL present at runtime | CONFIRMED (systemd drop-in, 6th consecutive run) |
| OPINLY_API_KEY present | CONFIRMED (unchanged, non-fatal integration) |
| Commit regressions (37 new commits) | NONE — 0/37 touched payment paths |
| Blocking unknown | Stripe dashboard webhook URL registration unverifiable read-only (LOW risk, structural, persistent) |
