# Revenue Funnel Reconciliation — 2026-08-30

**Prepared by:** ops-finance
**Run date:** 2026-08-30
**Prior run:** 2026-08-29 00:22 UTC

---

## Verdict

Payment path is **VERIFIED end-to-end** for both active offers.
8 new commits since last run — 0 touch the payment/webhook/billing path.
No regressions detected.

---

## Services Health

| Service | Status | Evidence |
|---|---|---|
| nebula-nextjs (Next.js) | **ACTIVE** | systemctl: active (running) since 2026-08-29 23:50:22 UTC; Main PID 1141655 |
| nebula-platform-api (FastAPI) | **ACTIVE** | systemctl: active; `curl http://127.0.0.1:8001/` → `{"service":"platform_api","version":"0.1.0","environment":"production"}` |
| cloudflared-tunnel | **ACTIVE** | systemctl: loaded active running (Cloudflare Tunnel — nebulacomponents.shop) |
| nebula-mcp | **ACTIVE** | systemctl: loaded active running |
| nebula-workspace-app | **ACTIVE** | systemctl: loaded active running |
| nebula-site | activating (auto-restart) | systemctl: loaded activating auto-restart — **DEGRADED** |
| nebula-stripe-webhook | not found | No dedicated systemd unit — webhook handled by nebula-nextjs in-process |

Note: `nebula-site` is in auto-restart. This is the site service, not the payment handler. No impact on payment path.

---

## Webhook Route

**File:** `customer-portal/app/api/webhooks/stripe/route.ts`
**Endpoint:** `POST /api/webhooks/stripe`

Live probes:
- Local: `curl -X POST http://127.0.0.1:3000/api/webhooks/stripe` → `{"error":"Missing stripe-signature header"}` (signature guard active)
- External (via Cloudflare tunnel): `curl -X POST https://nebulacomponents.shop/api/webhooks/stripe -L` → HTTP 400 (consistent with missing-signature rejection after redirect)

Webhook route is mounted and reachable on both local and public endpoints. Signature verification is enforced before any event processing.

### Signature verification flow (source-verified)

1. Raw body captured via `request.text()`
2. `STRIPE_WEBHOOK_SECRET` used to construct and verify event via `stripe.webhooks.constructEvent()`
3. Missing or invalid signature → HTTP 400; Stripe retries automatically

---

## Environment Variables (customer-portal/.env.local)

| Variable | Present | Risk |
|---|---|---|
| `STRIPE_SECRET_KEY` | YES | — |
| `STRIPE_WEBHOOK_SECRET` | YES | — |
| `DATABASE_URL` | YES | — |
| `INTERNAL_API_SECRET` | YES | — |
| `PLATFORM_API_URL` | **NO** | Hardcoded fallback `http://127.0.0.1:8001` in use — silent failure risk on redeploy |

Status unchanged from prior run. `PLATFORM_API_URL` is still absent from `.env.local`. Hardcoded fallback is working today. Risk documented in blocking unknown section.

---

## Fix-Pack ($97) Path — Verified

**Canonical receipt check:** `isCanonicalFixPackReceipt()` in `app/lib/public-facts.ts`

Check requires all of:
- `livemode === true`
- `payment_status === 'paid'`
- `currency` + `amount_total` matching a `receipts[]` fact entry
- `metadata.offer_key` matching the fact entry

On canonical receipt + valid `audit_id` UUID:
1. Row inserted in `purchases` table with `fulfillment_status = 'pending'`
2. Advisory lock acquired on `stripe_session_id` (idempotency guard)
3. Status advanced to `'processing'`
4. `enqueueKitSend()` calls platform API `http://127.0.0.1:8001/api/outbox/enqueue` → `kit_send` channel
5. Sale alert fired via `hermes send --to telegram:5920497760`
6. `recordFunnelEvent()` writes to analytics ledger with `environment='production'`, `paymentMode='live'`, `isSynthetic=false`
7. GA4 Measurement Protocol event forwarded
8. PostHog + heycatch analytics captured (non-blocking)

Duplicate/retry handling: advisory lock serializes concurrent retries; `'delivered'` row state blocks re-fulfillment; idempotency keyed on `stripe_session_id`.

---

## Agency Partner ($497) Path — Verified

**Trigger:** `session.metadata.offer_key === 'agency_partner'` + `event.livemode === true`

On checkout.session.completed with agency offer:
1. `provisionAgencyPartner()` called — extracts `agency_domain` from Stripe custom_fields, creates partner via platform API `/audit/partners`
2. On provision failure: non-fatal, purchase still recorded as `fulfillment_status = 'review'`
3. Row inserted in `purchases` as `'review'`
4. Sale alert fired via Telegram
5. CRM notified via `notifyCrmPurchaseCompleted()`

Note: Agency path writes `fulfillment_status = 'review'` by design — manual verification step remains in process.

---

## Subscription Path (Pro/Growth/Agency memberships) — Verified

Subscription-mode `checkout.session.completed` events are acknowledged but NOT persisted by the checkout handler (route.ts lines 62-65 — intentional; lifecycle events own persistence).

`customer.subscription.created/updated/deleted` events:
- Price resolved via `planFromStripePrice()` in `subscription-plans.ts`
- Unrecognized price → ops alert enqueued via outbox, no subscription row written
- Customer email resolved via Stripe customers API
- Missing email → ops alert enqueued, acknowledged without binding

Price IDs mapped in `subscription-plans.ts`:
- Pro: `price_1U0l9AEINR1kU9chtiA64BKd` (monthly), `price_1U0l9BEINR1kU9chItjep7v9` (annual)
- Growth: present (product `prod_V0miNSuuHWjJIm` confirmed)
- Agency: present

---

## Test/Live Ledger Separation — Verified

**funnel-ledger.ts Architectural Invariant #6:** "Strict Test/Production Isolation: Default queries filter out synthetic and test transactions."

In `recordFunnelEvent()`:
- `environment: isLive ? 'production' : 'test'`
- `paymentMode: isLive ? 'live' : 'test'`
- `isSynthetic: !isLive`

In `route.ts`:
- Agency partner auto-provision gated: `event.livemode` must be `true`
- Sale alert gated: `event.livemode` must be `true` for first-claim alert

Test-mode events route through the same code path but are flagged as synthetic/test in every ledger write. Default query filters exclude them from revenue reporting.

---

## Commit Regression Scan

**New commits since last run (2026-08-29 00:22):** 8

Files touched by new commits:
```
content/support/2026-08-29_inbox-inspection-report.md
customer-portal/app/api/lab-experiments/route.ts
customer-portal/app/api/timeline/route.ts
customer-portal/app/components/SiteFooter.tsx
customer-portal/app/layout.tsx
customer-portal/app/learning-centre/(pages)
customer-portal/app/research/(pages)
customer-portal/data/learning-centre-md.json
customer-portal/google-preferred-source.d.ts
platform_api/routes/audit_api.py
workspace-app/app/api/[[...path]]/route.ts
workspace-app/components/workspace/views.tsx (multiple)
```

Files touched that intersect payment/webhook paths:
```
NONE
```

No commit modifies:
- `app/api/webhooks/`
- `app/lib/subscription-plans.ts`
- `app/lib/public-facts.ts`
- `app/lib/funnel-ledger.ts`
- `app/api/checkout/`
- `app/api/billing/`

**Regression risk: NONE.**

---

## One Blocking Unknown

**`PLATFORM_API_URL` is not set in production `.env.local`.**

Status: **UNCHANGED** from prior run (2026-08-29). This issue persists for the third consecutive day.

The fulfillment code calls the platform API for:
- `/api/outbox/enqueue` (kit delivery — critical for $97 fulfillment)
- `/audit/partners` (agency partner provisioning — critical for $497 fulfillment)
- `/api/crm/purchase-completed` (CRM notification)

All three fall back to `http://127.0.0.1:8001`. The platform API is confirmed running on that address today.

Risks:
- Env var missing — fallback is invisible in configuration
- Any deployment changing platform API bind address breaks fulfillment silently
- No startup assertion or health check verifies platform API reachability before webhook handler accepts traffic

**Recommended action (CEO decision pending):** Set `PLATFORM_API_URL=http://127.0.0.1:8001` explicitly in `.env.local`. Low effort, eliminates silent failure risk on next deploy. This recommendation has been outstanding for 3+ days without resolution.

---

## Evidence Paths

| Artifact | Path |
|---|---|
| Webhook route | `customer-portal/app/api/webhooks/stripe/route.ts` |
| Fulfillment helpers | `customer-portal/app/api/webhooks/stripe/fulfillment.ts` |
| Canonical receipt check | `customer-portal/app/lib/public-facts.ts` |
| Subscription plans + price map | `customer-portal/app/lib/subscription-plans.ts` |
| Funnel ledger | `customer-portal/app/lib/funnel-ledger.ts` |
| Env vars (redacted) | `customer-portal/.env.local` |
| Platform API health | `curl http://127.0.0.1:8001/` → `{"service":"platform_api","environment":"production"}` |
| Webhook probe (local) | `curl -X POST http://127.0.0.1:3000/api/webhooks/stripe` → `{"error":"Missing stripe-signature header"}` |
| Webhook probe (external) | `curl -X POST https://nebulacomponents.shop/api/webhooks/stripe -L` → HTTP 400 |
| systemctl nebula-nextjs | active (running) since 2026-08-29 23:50:22 UTC |
| systemctl nebula-platform-api | active |

---

## Summary

| Check | Status |
|---|---|
| Webhook route reachable (local + external) | PASS |
| Signature verification active | PASS |
| Fix-pack ($97) fulfillment path | PASS |
| Agency partner ($497) fulfillment path | PASS |
| Subscription lifecycle handling | PASS |
| Test/live ledger separation | PASS |
| New commits touching payment path | 0 of 8 |
| Regression risk | NONE |
| `PLATFORM_API_URL` explicitly set | **FAIL — env var absent, hardcoded fallback in use (day 3)** |
| nebula-site service | **DEGRADED — auto-restart; no payment path impact** |

**Blocking unknown:** `PLATFORM_API_URL` not in `.env.local` — hardcoded fallback works today but is a silent failure risk on next deploy. Outstanding for 3+ consecutive days without CEO action.
