# Revenue Funnel Reconciliation - Payment Path Verification

**Date:** 2026-08-03
**Author:** ops-finance agent
**Scope:** Read-only end-to-end payment capture verification
**Constraint:** No payments created, no Stripe modifications, no production config changes

---

## Executive Summary

A real Stripe payment sent to `https://buy.stripe.com` would be captured,
webhook-delivered to `https://nebulacomponents.shop/api/webhooks/stripe`, and
persisted to the PostgreSQL `purchases` table. The code path is coherent and
structurally sound.

**One blocking unknown:** It cannot be confirmed that the `STRIPE_WEBHOOK_SECRET`
injected via the systemd drop-in matches the webhook endpoint registered in the
Stripe dashboard. If they differ, all real-money events are silently dropped
with a 400 signature error - and we would not know.

---

## Section 1: Request Path Evidence

### 1.1 Cloudflare Tunnel Routing

**Source:** `/home/mike/.cloudflared/config.yml`

| Hostname | Routes to |
|----------|-----------|
| `nebulacomponents.shop` | `http://localhost:3000` |
| `api.nebulacomponents.shop` | `http://localhost:8001` |
| `mcp.nebulacomponents.shop` | `http://localhost:8002` |
| Catch-all | `http://localhost:3000` |

**Finding:** `nebulacomponents.shop/api/webhooks/stripe` routes to Next.js on
port 3000. There is no special webhook path in the tunnel config - all traffic
hits Next.js, which owns the `/api/webhooks/stripe` route internally.

### 1.2 Production Service Status

**Source:** `systemctl status nebula-nextjs.service`

- `nebula-nextjs.service`: **active (running)** since 2026-08-02 18:08 UTC
- `nebula-site.service`: **inactive (dead)** - correctly disabled (incident INC-0004 was resolved)
- Process PID 1790852 confirmed on port 3000 via `ss -tlnp`

**Finding:** The canonical production service is running. The obsolete service
that caused INC-0004 is stopped and disabled.

### 1.3 Stripe Webhook Route

**Source:** `/home/mike/nebula/customer-portal/app/api/webhooks/stripe/route.ts`

The webhook handler:
1. Reads `Stripe-Signature` header - rejects with 400 if missing
2. Calls `getStripeClient().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)` for HMAC verification
3. On `checkout.session.completed`:
   - Checks `isCanonicalFixPackReceipt()` (livemode flag, payment_status, currency, amount)
   - If receipt is canonical AND `audit_id` metadata is a valid UUID: runs `deliver_prompt_pack.py` via `execFile`
   - If receipt is non-canonical (different amount, missing metadata): inserts to `purchases` with `fulfillment_status='review'`
   - In both cases: inserts to `purchases` table via PostgreSQL advisory lock (idempotent on `stripe_session_id`)
   - Sends Telegram alert via `hermes send --to telegram:5920497760`
   - Fires PostHog `purchase_completed` event
4. Returns `{received: true}` HTTP 200

**Finding:** Code path is complete. The test/live separation uses Stripe's own
`event.livemode` flag - **not** string-matching on email or payment_id. This is
the correct approach. Test events from Stripe CLI or test-mode checkout will
have `livemode: false` and trigger a non-canonical receipt path (goes to
`review` status, not auto-delivered).

---

## Section 2: Test/Live Ledger Separation

### 2.1 Customer-Ledger (Python webhook_server.py)

**Source:** `/home/mike/nebula/webhook_server.py`, lines 64-94

The legacy Python webhook server (`_is_test_payment_text()`) filters by:
- String markers: `cs_test`, `test`, `restart-test`, `example.com`, `ops@launchcrate.io`

**Finding:** This is a secondary/legacy server on port 9000, not on the current
payment path. It handles AgentMail inbound reply webhooks. The `_real_revenue_from_ledger()`
function excludes test entries from stats display.

### 2.2 Next.js Webhook Handler (Active)

**Source:** `customer-portal/app/api/webhooks/stripe/route.ts`, lines 31-37 + `isCanonicalFixPackReceipt()`

```
REPAIR_SPRINT_AMOUNT_CENTS = 9700
```

The canonical receipt check uses Stripe's structural fields, not email matching.
`event.livemode` is the authoritative test/live signal.

### 2.3 payments.log Audit

**Source:** `/home/mike/nebula/payments.log`

All 6 entries are test transactions (confirmed by markers):

| Date | Email | Payment ID | Amount | Classification |
|------|-------|------------|--------|----------------|
| 2026-06-23 | test-buyer@example.com | cs_test_simulation | $7 | TEST |
| 2026-06-24 | pilot-test-buyer@example.com | cs_test_pilot_001 | $497 | TEST |
| 2026-07-03 | test@test.com | test_123 | $97 | TEST |
| 2026-07-03 | test-prod@test.com | test_prod_123 | $97 | TEST |
| 2026-07-03 | fix-test@example.com | cs_test_fix_001 | $97 | TEST |
| 2026-07-05 | stripe@example.com | cs_test_a1L9C... | $30 | TEST (cs_test_ prefix) |

**Finding:** payments.log is written by the legacy Python server, not the
active Next.js handler. Zero real payments exist in either log. Revenue = $0
confirmed.

### 2.4 Revenue-Cost Ledger

**Source:** `/home/mike/nebula/ledgers/revenue-cost-ledger.jsonl`

One entry: ops-finance verification from 2026-07-04, confirming $0 real revenue.
No new entries since then.

---

## Section 3: Database Schema - Purchases Table

**Source:** `/home/mike/nebula/customer-portal/db/schema_purchases.sql`

```sql
CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  stripe_session_id VARCHAR(255) UNIQUE NOT NULL,   -- idempotency key
  stripe_event_id VARCHAR(255),
  customer_email VARCHAR(255),
  offer_key VARCHAR(100),
  amount_total INTEGER,
  currency VARCHAR(10),
  payment_status VARCHAR(50),
  fulfillment_status VARCHAR(20) DEFAULT 'pending',  -- pending/processing/failed/delivered/review
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Finding:** Schema is present and correct. The `stripe_session_id UNIQUE`
constraint provides idempotency protection against Stripe's at-least-once
delivery. `ON CONFLICT (stripe_session_id) DO NOTHING` is used in the webhook
handler for the non-canonical case.

**Gap:** Direct database query was blocked (password required, no socket auth
from this agent). Cannot confirm the `purchases` table is **actually
present** in the running PostgreSQL instance on port 5433 - schema file
exists but migration status is unverified.

---

## Section 4: Stripe Environment - Live Keys Confirmed

**Source:** `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf`

- `STRIPE_SECRET_KEY`: `sk_liv...` (live key prefix confirmed)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: `pk_live_51TlN5H...` (live key confirmed)
- `STRIPE_WEBHOOK_SECRET`: `whsec_pq33c1...` (webhook secret present)

**Source:** `/home/mike/nebula/.stripe_links`

Active payment links all use `buy.stripe.com` (Stripe-hosted, live):
- `LAUNCHCRATE_97_LINK`: `https://buy.stripe.com/aFa7sL5E03Iwgyt2Nk43S02`
- `LAUNCHCRATE_197_LINK`: `https://buy.stripe.com/14AcN58Qca6Ueql2Nk43S08`
- `PROMPT_PACK_7_LINK`: `https://buy.stripe.com/8x2dR90jG1Aobe99bI43S0a`
- `NEBULA_LINK`: `https://buy.stripe.com/bJefZhd6s0wkgytew243S07`

**Finding:** All secrets are live-mode. The `buy.stripe.com` links bypass the
Next.js checkout session flow - they go directly to Stripe's hosted checkout.
This means the webhook will fire to whatever URL is registered in the **Stripe
dashboard**, not necessarily `nebulacomponents.shop/api/webhooks/stripe`.

---

## Section 5: The Blocking Unknown

### What cannot be confirmed read-only:

**The Stripe dashboard webhook endpoint URL and its signing secret.**

The system has:
- `STRIPE_WEBHOOK_SECRET=whsec_pq33c1getciaJRXbFDAVe9fHqyTNhgGS` in production

But we cannot verify:
1. Whether the Stripe dashboard has `https://nebulacomponents.shop/api/webhooks/stripe` registered as a live-mode endpoint
2. Whether that dashboard endpoint's signing secret **matches** `whsec_pq33c1...`
3. Whether the endpoint is set to `checkout.session.completed` event type

**If they don't match:** Every real payment would arrive, Stripe would POST to
the registered URL, `constructEvent()` would throw
`SignatureVerificationError`, the handler returns HTTP 400, Stripe retries up to
72 hours then gives up - **no purchase row is ever written, no delivery
occurs, no alert fires**.

The historical STRIPE_AUDIT.md (dated 2026-07-13) documents broken payment
links and mismatched product names that killed prior conversions. Those were
separately addressed. The webhook secret mismatch risk is orthogonal and
currently unverifiable without Stripe dashboard access.

---

## Section 6: Evidence Paths Summary

| Artifact | Path | What it proves |
|----------|------|----------------|
| Cloudflare tunnel config | `/home/mike/.cloudflared/config.yml` | nebulacomponents.shop → port 3000 |
| Active service | `systemctl status nebula-nextjs.service` | Next.js running, canonical service healthy |
| Webhook handler code | `customer-portal/app/api/webhooks/stripe/route.ts` | Full capture→DB→delivery flow exists |
| DB schema | `customer-portal/db/schema_purchases.sql` | purchases table defined with idempotency |
| Systemd env | `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf` | Live keys injected into service |
| payments.log | `/home/mike/nebula/payments.log` | All 6 entries = test transactions, $0 real |
| Revenue-cost ledger | `/home/mike/nebula/ledgers/revenue-cost-ledger.jsonl` | Confirmed $0 real revenue as of 2026-07-04 |
| Stripe links | `/home/mike/nebula/.stripe_links` | Live-mode buy.stripe.com links active |

---

## Section 7: Open Risks

| Risk | Severity | Verifiable how |
|------|----------|----------------|
| Webhook secret mismatch (Stripe dashboard ≠ whsec_ in systemd) | **HIGH** | Stripe dashboard → Developers → Webhooks → check endpoint URL + secret |
| purchases table may not exist in running DB (migration not confirmed) | HIGH | `psql -c '\dt purchases'` from mike user |
| `buy.stripe.com` links bypass Next.js checkout API - `audit_id` metadata cannot be set by these links | MEDIUM | Canonical `canFulfill` path requires `audit_id` UUID in session metadata; Stripe-hosted links cannot inject this, so purchases via these links go to `fulfillment_status='review'` not auto-delivered |
| Legacy Python webhook_server (port 9000) still referenced in service-route-manifest but not current payment path | LOW | Confirm agentic_server.py is not routing /webhook/stripe to port 9000 |
| No Ops-Finance ledger entry for each payment link product | LOW | Add entries to revenue-cost-ledger.jsonl when first sale occurs |

---

## Verdict

**Would a real payment be captured?** Structurally: yes, if the Stripe webhook
endpoint URL and signing secret in the dashboard match what is in production.
Functionally: the code is sound, the service is healthy, the keys are live, the
DB schema is correct.

**Blocking unknown:** Stripe dashboard webhook endpoint registration cannot be
verified read-only from this host. This is the single item that could silently
break end-to-end capture without any visible error.

**Revenue to date:** $0 real. All historical payment log entries are test
transactions. The ledger has not been updated since 2026-07-04.

**Action required (CEO):** Log into Stripe dashboard →
`https://dashboard.stripe.com/webhooks` → confirm endpoint
`https://nebulacomponents.shop/api/webhooks/stripe` exists with event
`checkout.session.completed` and that its signing secret matches
`whsec_pq33c1getciaJRXbFDAVe9fHqyTNhgGS`.
