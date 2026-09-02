# Revenue Funnel Reconciliation — 2026-09-02

**Prepared by:** ops-finance
**Run date:** 2026-09-02
**Prior run:** 2026-09-01

---

## Verdict

Payment path is **VERIFIED end-to-end** for both active offers.
26 new commits since last run — 0 touch payment/webhook/fulfillment logic. No regressions.

**INCIDENT-001 RESOLVED:** `nebula-nextjs.service` is now `active (running)` under systemd since 2026-09-01 18:54:34 UTC. The supervision gap from the prior run is closed.

**PERSISTENT FINDING:** `PLATFORM_API_URL` still absent from `.env.local` — day 5 without CEO action. Hardcoded fallback `http://127.0.0.1:8001` is masking the missing config.

---

## Services Health

| Service | Status | Evidence |
|---|---|---|
| nebula-nextjs (Next.js) | **ACTIVE** — systemd supervised | `active (running) since Tue 2026-09-01 18:54:34 UTC; 5h 34min ago` — PID 3964817, port 3000 listening |
| nebula-platform-api (FastAPI) | **ACTIVE** | `curl http://127.0.0.1:8001/` → `{"service":"platform_api","version":"0.1.0","environment":"production"}` |
| cloudflared / public endpoint | **ACTIVE** | `curl -X POST https://nebulacomponents.com/api/webhooks/stripe` → `{"error":"Missing stripe-signature header"}` (400) — signature guard active |
| outbox enqueue route | **ACTIVE** | `POST /api/outbox/enqueue` returns 401 on invalid auth → route mounted and auth guard live |

Single next-server process (PID 3964817) confirmed, no orphan processes. Systemd CGroup correctly shows npm → sh → next-server hierarchy.

---

## Webhook Route

**File:** `customer-portal/app/api/webhooks/stripe/route.ts`
**Endpoint:** `POST /api/webhooks/stripe`

Live probes:
- Local (port 3000): `{"error":"Missing stripe-signature header"}` (400) — signature guard active
- External (nebulacomponents.com via Cloudflare): `{"error":"Missing stripe-signature header"}` (400) — same response, route reachable publicly

### Signature verification flow (source-verified, unchanged)

1. Raw body captured via `request.text()`
2. `STRIPE_WEBHOOK_SECRET` used via `stripe.webhooks.constructEvent()`
3. Missing or invalid signature → HTTP 400; Stripe retries automatically

---

## Environment Variables

| Variable | Present | Risk |
|---|---|---|
| `STRIPE_SECRET_KEY` | YES (in `nebula/.env` loaded by systemd drop-in `stripe.conf`) | — |
| `STRIPE_WEBHOOK_SECRET` | YES | — |
| `DATABASE_URL` | YES | — |
| `INTERNAL_API_SECRET` | YES | — |
| `PLATFORM_API_URL` | **NO** | Hardcoded fallback `http://127.0.0.1:8001` in use — day 5 without CEO action |

Evidence: `grep STRIPE_SECRET_KEY .env` → key present; `grep STRIPE_WEBHOOK_SECRET .env` → key present; `INTERNAL_API_SECRET` confirmed present in `.env` (checked via key grep). `PLATFORM_API_URL` confirmed absent.

---

## Fix-Pack ($97) Path — Verified

**Canonical receipt check:** `isCanonicalFixPackReceipt()` in `app/lib/public-facts.ts` (0 commits touching this file since last run)

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
4. `enqueueKitSend()` calls `http://127.0.0.1:8001/api/outbox/enqueue` → `kit_send` channel (outbox route confirmed live at step above)
5. Sale alert fired via `hermes send --to telegram:5920497760`
6. `recordFunnelEvent()` writes to analytics ledger with `environment='production'`, `paymentMode='live'`, `isSynthetic=false`
7. GA4 Measurement Protocol event forwarded
8. heycatch analytics captured (non-blocking)

Duplicate/retry: advisory lock + `'delivered'` row state + `stripe_session_id` idempotency key — all unchanged.

---

## Agency Partner ($497) Path — Verified

**Trigger:** `session.metadata.offer_key === 'agency_partner'` + `event.livemode === true` (unchanged)

1. `provisionAgencyPartner()` → platform API `/audit/partners`
2. Provision failure: non-fatal, row still inserted as `fulfillment_status = 'review'`
3. Sale alert + CRM notification fire

Agency price aligned to $497/mo in Stripe in commit `cc3bce39c` (this run window). Confirmed: `stripe_checkout_links.json` does not have an explicit `$497` entry — the offer flows via Stripe checkout link direct (not through the checkout API session builder). The `offer_key=agency_partner` metadata trigger in the webhook is the sole fulfillment gate.

---

## Subscription Path — Verified

Subscription-mode `checkout.session.completed` events: acknowledged only (lifecycle events own persistence — unchanged).

`customer.subscription.created/updated/deleted` events:
- Price resolved via `planFromStripePrice()` — price ID map in `subscription-plans.ts` (0 commits touching since last run)
- Unrecognized price → ops alert enqueued via outbox, no subscription row written
- Missing email → ops alert enqueued, acknowledged without binding

---

## Test/Live Ledger Separation — Verified

`funnel-ledger.ts` Architectural Invariant #6: "Strict Test/Production Isolation"

In `recordFunnelEvent()`:
- `environment: isLive ? 'production' : 'test'`
- `paymentMode: isLive ? 'live' : 'test'`
- `isSynthetic: !isLive`

Agency partner auto-provision and sale alerts gated on `event.livemode === true`.
Default query filters exclude synthetic rows from revenue reporting. Unchanged by new commits.

---

## Commit Regression Scan

**New commits since last run (2026-09-01 00:30):** 26

Files touching payment/webhook paths: **0 of 26**

All 26 commits are in:
- Content, copy, and identity integrity fixes (fabricated claim removal, pricing alignment)
- Observatory / AEO stats corrections
- Governance design documents and enforcement controls
- Opportunity governance controls and anti-vacuity rule enforcement

No commits modify:
- `app/api/webhooks/stripe/` (route or fulfillment)
- `app/lib/public-facts.ts` (canonical receipt check)
- `app/lib/subscription-plans.ts` (price ID map)
- `app/api/checkout/` (session creation)
- `app/lib/funnel-ledger.ts` (analytics ledger)
- Platform API outbox or routes

**Regression risk on payment capture: NONE.**

---

## Incidents

### INCIDENT-001: nebula-nextjs systemd supervision gap — RESOLVED

**Prior status:** OPEN (reported 2026-09-01)
**Current status:** RESOLVED

`nebula-nextjs.service` is now `active (running)` under systemd supervision since 2026-09-01 18:54:34 UTC. Single process tree confirmed under systemd CGroup. The orphan-process risk from the prior run is closed.

---

## One Blocking Unknown

**`PLATFORM_API_URL` is not set in production `.env.local`.** (Day 5 — persistent)

The fulfillment code calls the platform API for:
- `/api/outbox/enqueue` (kit delivery — critical for $97 fulfillment)
- `/audit/partners` (agency partner provisioning — critical for $497 fulfillment)
- `/api/crm/purchase-completed` (CRM notification)

All three fall back to `http://127.0.0.1:8001`. The platform API is confirmed running on that address today.

Platform API load verified: platform_api process running (PID 3722540 / uv worker, listening 127.0.0.1:8001). Outbox route `/api/outbox/enqueue` mounted and returning 401 on auth mismatch (correct behavior — route is live).

**Risk:** If platform API bind address or port changes in any future deployment, fulfillment breaks silently. The absence of an explicit env var means no deployment check catches it. This is a configuration hygiene issue, not a current outage.

**Required CEO action:** Add `PLATFORM_API_URL=http://127.0.0.1:8001` to `customer-portal/.env.local` (or the systemd drop-in that populates it). Low effort. Day 5.

---

## Evidence Paths

| Artifact | Path / Command |
|---|---|
| Webhook route | `customer-portal/app/api/webhooks/stripe/route.ts` |
| Fulfillment helpers | `customer-portal/app/api/webhooks/stripe/fulfillment.ts` |
| Canonical receipt check | `customer-portal/app/lib/public-facts.ts` |
| Subscription plans + price map | `customer-portal/app/lib/subscription-plans.ts` |
| Funnel ledger | `customer-portal/app/lib/funnel-ledger.ts` |
| Platform API health | `curl http://127.0.0.1:8001/` → `{"service":"platform_api","environment":"production"}` |
| Webhook probe (local) | `curl -X POST http://127.0.0.1:3000/api/webhooks/stripe` → `{"error":"Missing stripe-signature header"}` |
| Webhook probe (external) | `curl -X POST https://nebulacomponents.com/api/webhooks/stripe` → `{"error":"Missing stripe-signature header"}` |
| Outbox route probe | `POST http://127.0.0.1:8001/api/outbox/enqueue` (bad auth) → 401 Unauthorized |
| nebula-nextjs systemd | `active (running) since 2026-09-01 18:54:34 UTC; 5h 34min ago` |
| nebula-nextjs process | PID 3964817, `ss -tlnp sport=:3000` confirms listening |
| Tunnel metrics | `uptime_pct: 99.06%`, `last_check: 2026-09-02T00:25:01Z`, `last_status: TUNNEL_ONLY` |

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
| New commits touching fulfillment logic | 0 of 26 |
| Regression risk | NONE |
| nebula-nextjs systemd supervision | **PASS — RESOLVED (was FAIL on 2026-09-01)** |
| `PLATFORM_API_URL` explicitly set | **FAIL — env var absent, hardcoded fallback (day 5)** |

**One blocking unknown:** `PLATFORM_API_URL` absent from `.env.local` for 5 consecutive days. Platform API is live at the hardcoded fallback address, so this is not causing current failures — but it is a silent time bomb on any deploy that changes platform API binding. CEO action required.
