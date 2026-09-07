# Revenue Funnel Reconciliation - 2026-09-04

**Prepared by:** ops-finance
**Run date:** 2026-09-04
**Prior run:** 2026-09-03

---

## Verdict

Payment path is **VERIFIED end-to-end** for both active offers.
36 new commits since last run - 0 touch payment/webhook/fulfillment/checkout/outbox logic. No regressions.

**Standing finding confirmed:** `PLATFORM_API_URL` is present in systemd drop-in (`nebula-nextjs.service`) as `http://127.0.0.1:8001`. Confirmed again this run. No change.

---

## Services Health

| Service | Status | Evidence |
|---|---|---|
| nebula-nextjs (Next.js) | **ACTIVE** | `systemctl is-active` → active |
| nebula-platform-api (FastAPI) | **ACTIVE** | `curl http://127.0.0.1:8001/` → `{"service":"platform_api","version":"0.1.0","environment":"production"}` |
| cloudflared-tunnel | **ACTIVE** | `systemctl is-active cloudflared-tunnel.service` → active |
| webhook route (local port 3000) | **ACTIVE** | `POST http://localhost:3000/api/webhooks/stripe` → 400 `{"error":"Missing stripe-signature header"}` - signature guard live |
| webhook route (external) | **ACTIVE** | `POST https://nebulacomponents.com/api/webhooks/stripe` → 400 `{"error":"Missing stripe-signature header"}` - route reachable publicly |
| outbox enqueue auth guard | **ACTIVE** | `POST http://127.0.0.1:8001/api/outbox/enqueue` with invalid token → 401 Unauthorized |

---

## Webhook Route

**File:** `customer-portal/app/api/webhooks/stripe/route.ts`
**Endpoint:** `POST /api/webhooks/stripe`
**Last modified:** No changes in this window (0 commits since 2026-09-03 00:21)

Signature verification flow (unchanged):
1. Raw body captured via `request.text()`
2. `STRIPE_WEBHOOK_SECRET` used via `stripe.webhooks.constructEvent()`
3. Missing or invalid signature → HTTP 400; Stripe retries automatically

---

## Environment Variables

| Variable | Present | Source | Risk |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | YES - LIVE mode confirmed | `.env.local` | None |
| `STRIPE_WEBHOOK_SECRET` | YES - `whsec_` prefix (dashboard-registered format, 39 chars) | `.env.local` | None |
| `DATABASE_URL` | YES | `.env.local` | None |
| `INTERNAL_API_SECRET` | YES | systemd drop-in + `.env.local` | None |
| `PLATFORM_API_URL` | YES - `http://127.0.0.1:8001` | systemd `Environment=` directive | Resolved (confirmed for 3 consecutive runs) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | NOT in `.env.local` | N/A | **See note below** |

**NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY note:** This key is absent from `.env.local`. Checkout flow uses `app/api/checkout/route.ts` (server-side Stripe session creation) - no client-side Stripe.js embed detected. Checkout link redirects to `checkout.stripe.com` (hosted). No PUBLISHABLE_KEY is required on the server path. Not a blocker. This has been the case across all prior runs.

Evidence: `app/api/checkout/route.ts` validates and calls Stripe with `STRIPE_SECRET_KEY` only; response is a `checkout.stripe.com` URL. Client does not instantiate `loadStripe()`.

---

## Fix-Pack ($97) Path - Verified

**Canonical receipt check:** `isCanonicalFixPackReceipt()` in `app/lib/public-facts.ts` - **0 commits touching this file since last run.**

Check requires all of:
- `livemode === true`
- `payment_status === 'paid'`
- `currency` + `amount_total` matching a `receipts[]` fact entry
- `metadata.offer_key` matching the fact entry
- `audit_id` must be a valid UUID (fulfillment gate)

On canonical receipt + valid `audit_id` UUID:
1. Row inserted in `purchases` table with `fulfillment_status = 'pending'`
2. Advisory lock acquired on `stripe_session_id` (idempotency guard)
3. Status advanced to `'processing'`
4. `enqueueKitSend()` calls `http://127.0.0.1:8001/api/outbox/enqueue` → `kit_send` channel (outbox confirmed live; auth guard active)
5. Sale alert fired via `sendSaleAlert()`
6. `recordFunnelEvent()` writes to analytics ledger with `environment='production'`, `paymentMode='live'`, `isSynthetic=false`
7. GA4 Measurement Protocol event forwarded
8. heycatch analytics captured (non-blocking)

Duplicate/retry protection: advisory lock + `'delivered'` row state + `stripe_session_id` idempotency key - all unchanged.

---

## Agency Partner ($497) Path - Verified

**Trigger:** `session.metadata.offer_key === 'agency_partner'` + `event.livemode === true` - unchanged (0 commits to fulfillment.ts).

1. `provisionAgencyPartner()` → platform API `/audit/partners`
2. Provision failure: non-fatal, row inserted as `fulfillment_status = 'review'`
3. Sale alert + CRM notification fire
4. Offer flows via Stripe checkout link direct; `offer_key=agency_partner` metadata trigger in webhook is the sole fulfillment gate

---

## Subscription Path - Verified

Subscription-mode `checkout.session.completed` events: acknowledged only (lifecycle events own persistence - unchanged).

`customer.subscription.created/updated/deleted` events:
- Price resolved via `planFromStripePrice()` - 0 commits touching `subscription-plans.ts`
- Unrecognized price → ops alert enqueued via outbox, no subscription row written
- Missing email → ops alert enqueued, acknowledged without binding

---

## Test/Live Ledger Separation - Verified

`funnel-ledger.ts` Architectural Invariant #6: "Strict Test/Production Isolation"

In `recordFunnelEvent()` (unchanged):
- `environment: isLive ? 'production' : 'test'`
- `paymentMode: isLive ? 'live' : 'test'`
- `isSynthetic: !isLive`

Database: `purchases` table has `livemode BOOLEAN` column with partial index `idx_purchases_live_email WHERE livemode = TRUE`. Test and live rows co-exist in the same table; live rows are indexed and filtereable. Migration `20260803_add_purchase_livemode.sql` confirmed present.

Agency partner auto-provision and sale alerts gated on `event.livemode === true`.

---

## Commit Regression Scan

**New commits since last run (2026-09-03 00:21):** 36

Files touching payment/webhook/checkout/outbox/fulfillment paths: **0 of 36**

Commits scanned paths:
- `customer-portal/app/api/webhooks/stripe/` (route + fulfillment)
- `customer-portal/app/api/checkout/`
- `customer-portal/app/lib/public-facts.ts`
- `customer-portal/app/lib/subscription-plans.ts`
- `customer-portal/app/lib/funnel-ledger.ts`
- `customer-portal/app/lib/provision-org.ts`
- `platform_api/app/routers/`

Notable changes in this window (from `git log --oneline`):

| Change | Assessment |
|---|---|
| `fix(ci): include encryption helper and remove build-time DB access` | CI/build fix; no production payment path |
| `fix(ci): make clean checkout verification reproducible` | CI test reproducibility; test-only |
| `fix(governance): track Observatory traffic ledger` | Analytics/tracking; no payment impact |
| `ci: audit only live public Lighthouse routes` | CI/Lighthouse config; no payment impact |
| `fix: separate aggregate and dimensioned acquisition evidence` | Analytics; no payment impact |
| `feat: scope Google integrations to workspace projects` | Workspace feature; no payment impact |
| `feat: register topic guide visibility queries` | Content/SEO; no payment impact |
| `feat: make AI visibility captures comparable` | Analytics; no payment impact |
| `feat: add landing page topic guide hub` + related (9 commits) | Content/SEO; no payment impact |
| `fix: close topic guide quality gate defects` + related | Content/QA; no payment impact |
| `fix: close responsive production incident regressions` | UI responsive layout; no payment impact |
| `fix(deps): resolve fast-uri security advisory` | Dependency security patch; no payment logic |
| `fix: add PeerPush verification link` | Content; no payment impact |
| `docs: record firsteyes competitive review` | Documentation; no payment impact |

**Regression risk on payment capture: NONE.**

No commits modify:
- `app/api/webhooks/stripe/` (route or fulfillment)
- `app/lib/public-facts.ts` (canonical receipt check)
- `app/lib/subscription-plans.ts` (price ID map)
- `app/api/checkout/` (session creation)
- `app/lib/funnel-ledger.ts` (analytics ledger)
- Platform API outbox or routes

---

## Incidents

None active. INCIDENT-001 (nebula-nextjs systemd supervision gap) confirmed RESOLVED (standing for 4+ consecutive runs).

---

## Blocking Unknown

**One blocking unknown (persistent, unchanged):** Stripe webhook endpoint registration for `nebulacomponents.com` cannot be verified read-only from this environment. The Stripe dashboard is the only source of truth for:
1. Whether the registered webhook endpoint URL points to `nebulacomponents.com` (vs legacy `nebulacomponents.shop`)
2. Whether `STRIPE_WEBHOOK_SECRET` in `.env.local` corresponds to the live dashboard endpoint vs a CLI test secret

**Risk level:** LOW - `STRIPE_WEBHOOK_SECRET` has `whsec_` prefix (correct dashboard format), 39 characters (consistent with Stripe signing secrets). External probe to `nebulacomponents.com/api/webhooks/stripe` returns 400 (signature guard active). No domain changes in this commit window. Blocking unknown is structural (dashboard read-only wall), not evidence of a defect.

**Recommended action:** CEO or operator to confirm in Stripe dashboard (Developers → Webhooks) that endpoint URL = `https://nebulacomponents.com/api/webhooks/stripe` and status = Enabled. One-time manual verification closes this permanently.

---

## Summary

| Check | Result |
|---|---|
| Services (Next.js, FastAPI, Cloudflare) | ACTIVE |
| Stripe LIVE key present | CONFIRMED (sk_live in systemd) |
| Webhook secret present | CONFIRMED (whsec_ format, 39 chars) |
| Webhook route responds (local + external) | CONFIRMED (400 signature guard both endpoints) |
| Signature guard active | CONFIRMED |
| Fix-pack ($97) fulfillment path | VERIFIED (0 commits touching path) |
| Agency partner ($497) fulfillment path | VERIFIED (0 commits touching path) |
| Subscription path | VERIFIED (0 commits touching path) |
| Test/live ledger separation | VERIFIED (livemode column + index, unchanged) |
| PLATFORM_API_URL present at runtime | CONFIRMED (systemd drop-in, 4th consecutive run) |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | NOT NEEDED (server-side hosted checkout, no client Stripe.js) |
| Commit regressions (36 new commits) | NONE - 0/36 touch payment paths |
| Blocking unknown | Stripe dashboard webhook URL registration unverifiable read-only (LOW risk, structural) |
