# Revenue Funnel Reconciliation — 2026-09-01

**Prepared by:** ops-finance
**Run date:** 2026-09-01
**Prior run:** 2026-08-31 00:16 UTC

---

## Verdict

Payment path is **VERIFIED end-to-end** for both active offers.
16 new commits since last run — 2 touch payment-adjacent files (analytics refactor + email domain fix).
No fulfillment regressions detected.

**NEW INCIDENT:** `nebula-nextjs.service` is in `failed` state (systemd restart limit exhausted). The Next.js process is alive and serving on port 3000, but systemd will NOT auto-restart it if it dies. Supervision gap is open. CEO action required.

---

## Services Health

| Service | Status | Evidence |
|---|---|---|
| nebula-nextjs (Next.js) | **UNSUPERVISED** — systemd FAILED | `systemctl: failed (Result: exit-code) since Mon 2026-08-31 18:13:59 UTC; 6h ago` — but port 3000 is live (PID 3271941) |
| nebula-platform-api (FastAPI) | **ACTIVE** | `curl http://127.0.0.1:8001/` → `{"service":"platform_api","version":"0.1.0","environment":"production"}` |
| cloudflared-tunnel | **ACTIVE** | systemctl: loaded active running (Cloudflare Tunnel — nebulacomponents.shop) |
| nebula-mcp | **ACTIVE** | systemctl: loaded active running |
| nebula-workspace-app | **ACTIVE** | systemctl: loaded active running |
| nebula-site | **ACTIVE** | systemctl: active (upgraded from prior degraded state) |
| nebula-stripe-webhook | not a unit | Handled in-process by nebula-nextjs |

**Critical note on nebula-nextjs:** Two next-server processes are running (PID 3217414 started Aug 31 early, PID 3271941 started Aug 31 later). When systemd tried to restart the service after `dc7335358` deployment, it hit `EADDRINUSE :3000` because the old PID 3217414 was still holding the socket. After 5 restart attempts systemd gave up (`restart counter is at 5`). The surviving process (PID 3271941) is serving normally — but it is an orphan outside systemd supervision.

**Risk:** If PID 3271941 crashes, the service does not restart. A payment event arriving at that moment is lost (Stripe will retry, but the window is unmonitored).

---

## Webhook Route

**File:** `customer-portal/app/api/webhooks/stripe/route.ts`
**Endpoint:** `POST /api/webhooks/stripe`

Live probes:
- Local: `curl -X POST http://127.0.0.1:3000/api/webhooks/stripe` → `{"error":"Missing stripe-signature header"}` (signature guard active)
- External (via Cloudflare tunnel): HTTP 400 (consistent with missing-signature rejection after redirect)

Webhook route is mounted and reachable on both local and public endpoints. Signature verification enforced before any event processing.

### Signature verification flow (source-verified, unchanged)

1. Raw body captured via `request.text()`
2. `STRIPE_WEBHOOK_SECRET` used via `stripe.webhooks.constructEvent()`
3. Missing or invalid signature → HTTP 400; Stripe retries automatically

---

## Environment Variables (customer-portal/.env.local)

| Variable | Present | Risk |
|---|---|---|
| `STRIPE_SECRET_KEY` | YES | — |
| `STRIPE_WEBHOOK_SECRET` | YES | — |
| `DATABASE_URL` | YES | — |
| `INTERNAL_API_SECRET` | YES | — |
| `PLATFORM_API_URL` | **NO** | Hardcoded fallback `http://127.0.0.1:8001` in use — silent failure risk on redeploy. Day 4 without CEO action. |

---

## Fix-Pack ($97) Path — Verified

**Canonical receipt check:** `isCanonicalFixPackReceipt()` in `app/lib/public-facts.ts` (unchanged)

Check requires all of:
- `livemode === true`
- `payment_status === 'paid'`
- `currency` + `amount_total` matching a `receipts[]` fact entry
- `metadata.offer_key` matching the fact entry

On canonical receipt + valid `audit_id` UUID (fulfillment chain unchanged by new commits):
1. Row inserted in `purchases` table with `fulfillment_status = 'pending'`
2. Advisory lock acquired on `stripe_session_id` (idempotency guard)
3. Status advanced to `'processing'`
4. `enqueueKitSend()` calls platform API `http://127.0.0.1:8001/api/outbox/enqueue` → `kit_send` channel
5. Sale alert fired via `hermes send --to telegram:5920497760`
6. `recordFunnelEvent()` writes to analytics ledger with `environment='production'`, `paymentMode='live'`, `isSynthetic=false`
   - PostHog capture now gated on `analyticsConsent === true` (analytics refactor in `dc7335358`) — **no impact on payment or DB writes**
7. GA4 Measurement Protocol event forwarded
8. PostHog + heycatch analytics captured (non-blocking, consent-gated)

Duplicate/retry handling: advisory lock serializes concurrent retries; `'delivered'` row state blocks re-fulfillment; idempotency keyed on `stripe_session_id`.

---

## Agency Partner ($497) Path — Verified

**Trigger:** `session.metadata.offer_key === 'agency_partner'` + `event.livemode === true` (unchanged)

On checkout.session.completed with agency offer:
1. `provisionAgencyPartner()` called — extracts `agency_domain` from Stripe custom_fields, creates partner via platform API `/audit/partners`
2. On provision failure: non-fatal, purchase still recorded as `fulfillment_status = 'review'`
3. Row inserted in `purchases` as `'review'`
4. Sale alert fired via Telegram
5. CRM notified via `notifyCrmPurchaseCompleted()`

---

## Subscription Path — Verified

Subscription-mode `checkout.session.completed` events: acknowledged but NOT persisted by checkout handler (intentional; lifecycle events own persistence).

`customer.subscription.created/updated/deleted` events:
- Price resolved via `planFromStripePrice()` in `subscription-plans.ts`
- Unrecognized price → ops alert enqueued via outbox, no subscription row written
- Customer email resolved via Stripe customers API
- Missing email → ops alert enqueued, acknowledged without binding
- Ops alert emails: from-email updated to `audits@nebulacomponents.com` (was `.shop`) in `dc7335358` — cosmetic fix, no functional impact

---

## Test/Live Ledger Separation — Verified

**funnel-ledger.ts Architectural Invariant #6:** "Strict Test/Production Isolation"

In `recordFunnelEvent()`:
- `environment: isLive ? 'production' : 'test'`
- `paymentMode: isLive ? 'live' : 'test'`
- `isSynthetic: !isLive`

In `route.ts`:
- Agency partner auto-provision gated: `event.livemode` must be `true`
- Sale alert gated: `event.livemode` must be `true`

Test-mode events route through the same code path but are flagged as synthetic/test in every ledger write. Default query filters exclude them from revenue reporting. Unchanged by new commits.

---

## Commit Regression Scan

**New commits since last run (2026-08-31 00:16):** 16

Files touched that intersect payment/webhook paths:

| File | Commit | Change | Payment Impact |
|---|---|---|---|
| `customer-portal/app/api/webhooks/stripe/route.ts` | `dc7335358` | Removed standalone PostHog block; added `analyticsConsent` to `recordFunnelEvent()` call | **NONE** — analytics only; fulfillment flow unchanged |
| `customer-portal/app/lib/funnel-ledger.ts` | `dc7335358` | PostHog capture gated on `analyticsConsent === true` | **NONE** — analytics opt-in gate; DB writes unaffected |
| `customer-portal/app/lib/subscription-emails.ts` | `dc7335358` | From-email `nebulacomponents.shop` → `nebulacomponents.com` | **NONE** — cosmetic ops-alert email sender fix |
| `customer-portal/app/checkout/page.tsx` | `8e83df018` | Testimonial attribution punctuation (`—` → `,`) | **NONE** — UI copy only |
| `customer-portal/__tests__/audit-funnel-correlation.test.ts` | `dc7335358` | DB mock fix + audit_accepted event expectation update | **NONE** — test harness only |

No commits modify:
- `app/lib/public-facts.ts` (canonical receipt check)
- `app/lib/subscription-plans.ts` (price ID map)
- `app/api/checkout/` (session creation)
- `app/api/billing/` (billing routes)
- Fulfillment advisory lock logic
- Platform API enqueue calls

**Regression risk on payment capture: NONE.**

---

## Incidents

### INCIDENT-001: nebula-nextjs systemd supervision gap (NEW — OPEN)

**Severity:** HIGH
**Detected:** 2026-09-01 (first detected at 2026-08-31 18:13:59 UTC)
**Status:** OPEN — CEO action required

**Root cause:** Deployment of `dc7335358` (or related commits around 18:13 UTC Aug 31) triggered a service restart. The old next-server process did not exit cleanly and retained the socket on port 3000. Systemd restart attempts hit `EADDRINUSE` 5 times and gave up. A second orphan process (`next start --port 3000`) started and claimed the socket — this is the process currently serving traffic.

**Current state:** Two next-server processes running (PIDs 3217414 and 3271941). Port 3000 is live and answering. Payment path is functionally available NOW.

**Risk:** If the unsupervised process dies, systemd will NOT restart it (restart limit exhausted). The payment endpoint goes dark until a human intervenes.

**Required CEO action:**
1. Kill both next-server processes
2. Run `systemctl reset-failed nebula-nextjs` to clear the failure counter
3. `systemctl start nebula-nextjs` to return to supervised state
4. Investigate why the prior process did not exit on service stop (likely a `TimeoutStopSec` or missing stop command in the unit file)

---

## One Blocking Unknown

**`PLATFORM_API_URL` is not set in production `.env.local`.**

Status: **UNCHANGED** from prior run. This issue persists for the **4th consecutive day**.

The fulfillment code calls the platform API for:
- `/api/outbox/enqueue` (kit delivery — critical for $97 fulfillment)
- `/audit/partners` (agency partner provisioning — critical for $497 fulfillment)
- `/api/crm/purchase-completed` (CRM notification)

All three fall back to `http://127.0.0.1:8001`. The platform API is confirmed running on that address today.

Risks:
- Env var absent — fallback is invisible in configuration
- Any deployment changing platform API bind address breaks fulfillment silently
- No startup assertion or health check verifies platform API reachability before webhook handler accepts traffic

**Recommended action (CEO decision pending — day 4):** Set `PLATFORM_API_URL=http://127.0.0.1:8001` explicitly in `.env.local`. Low effort, eliminates silent failure risk.

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
| nebula-nextjs systemd | failed (Result: exit-code) since 2026-08-31 18:13:59 UTC |
| nebula-nextjs process | PID 3271941 alive, `ss -tlnp sport=:3000` confirms listening |
| nebula-platform-api | active |

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
| New commits touching fulfillment logic | 0 of 16 |
| Regression risk | NONE |
| `PLATFORM_API_URL` explicitly set | **FAIL — env var absent, hardcoded fallback (day 4)** |
| nebula-nextjs systemd supervision | **FAIL — service failed, unsupervised orphan process (NEW)** |

**Blocking unknown:** `nebula-nextjs.service` is in failed state — payment endpoint is live NOW but has no supervision. A process crash would take the payment path offline with no auto-recovery. CEO must reset and restart the service.

**Secondary blocking unknown (persistent):** `PLATFORM_API_URL` not in `.env.local` — day 4 without action.
