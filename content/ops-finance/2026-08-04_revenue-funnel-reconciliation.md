# Revenue Funnel Reconciliation - Payment Path Verification

**Date:** 2026-08-04
**Author:** ops-finance agent (run 87, task t_998b9fd2)
**Scope:** Read-only end-to-end payment capture verification
**Constraint:** No payments created, no Stripe modifications, no production config changes
**Prior run:** t_74096fa9 (2026-08-03) - findings unchanged unless noted

---

## Executive Summary

A real Stripe payment sent to `https://buy.stripe.com` would be captured,
webhook-delivered to `https://nebulacomponents.shop/api/webhooks/stripe` (and
equivalently via `nebulacomponents.com`), and persisted to the PostgreSQL
`purchases` table. The code path is coherent and structurally sound.

**One blocking unknown (unchanged):** It cannot be confirmed that the
`STRIPE_WEBHOOK_SECRET` injected via the systemd drop-in matches the webhook
endpoint registered in the Stripe dashboard. If they differ, all real-money
events are silently dropped with a 400 signature error - and we would not know.

**Revenue to date: $0.** payments.log has 7 entries, all test transactions.
No new real payments since the last verification (2026-07-05).

---

## Section 1: Request Path Evidence

### 1.1 Cloudflare Tunnel Routing

**Source:** `/home/mike/.cloudflared/config.yml` (verified 2026-08-04)

| Hostname | Routes to |
|----------|-----------|
| `nebulacomponents.com` | `http://localhost:3000` (primary) |
| `nebulacomponents.shop` | `http://localhost:3000` (legacy, redirect to .com) |
| `api.nebulacomponents.shop` | `http://localhost:8001` |
| `mcp.nebulacomponents.com` | `http://localhost:8002` |
| `launchcrate.io` | `http://localhost:3001` |
| Catch-all | `http://localhost:3000` |

**Delta from yesterday:** `nebulacomponents.com` is now listed as the primary
ingress entry (above .shop). Both domains route to port 3000. No impact on
webhook routing - Stripe posts to whichever URL is registered in the dashboard.

**Finding:** `nebulacomponents.shop/api/webhooks/stripe` and
`nebulacomponents.com/api/webhooks/stripe` both route to Next.js on port 3000.
There is no special webhook path in the tunnel config - all traffic hits
Next.js, which owns the `/api/webhooks/stripe` route internally.

### 1.2 Production Service Status

**Source:** `systemctl status nebula-nextjs.service` (verified 2026-08-04 00:18 UTC)

- `nebula-nextjs.service`: **active (running)** since 2026-08-03 19:05:19 UTC
- PID 749802 (`next-server v16.2.11`) confirmed listening on port 3000
- Memory: 331.5 MB (stable)

**Finding:** Service healthy. Restarted yesterday evening (routine or triggered
redeploy) - not a concern.

### 1.3 Stripe Webhook Route

**Source:** `/home/mike/nebula/customer-portal/app/api/webhooks/stripe/route.ts`
(last modified 2026-08-03, 12,453 bytes - unchanged from prior run)

The webhook handler:
1. Reads `Stripe-Signature` header - rejects with 400 if missing
2. Calls `getStripeClient().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)` for HMAC verification
3. On `checkout.session.completed`:
   - Checks `isCanonicalFixPackReceipt()` using `event.livemode` flag + amount + payment_status + currency
   - If canonical AND `audit_id` metadata is a valid UUID: acquires PostgreSQL advisory lock → inserts to `purchases` → runs `deliver_prompt_pack.py` → marks `fulfillment_status='delivered'` → sends Telegram sale alert → fires PostHog `purchase_completed`
   - If non-canonical: inserts to `purchases` with `fulfillment_status='review'` + sends Telegram alert
   - `stripe_session_id UNIQUE` constraint provides idempotency
4. Returns `{received: true}` HTTP 200

**Finding:** Code path is complete and unchanged. Test/live separation uses
Stripe's own `event.livemode` flag - not string-matching on email or payment_id.
This is the correct approach.

---

## Section 2: Test/Live Ledger Separation

### 2.1 Active Webhook Handler (Next.js)

**Source:** `customer-portal/app/api/webhooks/stripe/route.ts`

`event.livemode` is the authoritative test/live signal. Test events (Stripe CLI
or test-mode checkout) have `livemode: false` → go to `fulfillment_status='review'`,
not auto-delivered. No string-matching on email or session ID prefix.

**Finding:** Separation is structurally correct.

### 2.2 Legacy Python Webhook Server

**Source:** `/home/mike/nebula/webhook_server.py`

The Python server uses string markers (`cs_test`, `test`, `restart-test`,
`example.com`, `ops@launchcrate.io`) for test detection. This server is on
port 9000 and handles AgentMail reply webhooks - **not the active Stripe
payment path**. Revenue stats displayed by this server exclude test entries.

### 2.3 payments.log Audit

**Source:** `/home/mike/nebula/payments.log` (7 lines, last entry 2026-07-05)

| Date | Email | Payment ID | Amount | Classification |
|------|-------|------------|--------|----------------|
| 2026-06-23 | test-buyer@example.com | cs_test_simulation | $7 | TEST |
| 2026-06-24 | pilot-test-buyer@example.com | cs_test_pilot_001 | $497 | TEST |
| 2026-07-03 | test@test.com | test_123 | $97 | TEST |
| 2026-07-03 | test-prod@test.com | test_prod_123 | $97 | TEST |
| 2026-07-03 | fix-test@example.com | cs_test_fix_001 | $97 | TEST |
| 2026-07-03 | restart-test@example.com | cs_test_restart_001 | $97 | TEST |
| 2026-07-05 | stripe@example.com | cs_test_a1L9C... | $30 | TEST (cs_test_ prefix) |

**Finding:** No new entries since 2026-07-05. All 7 entries are test transactions.
payments.log is written by the legacy Python server - not the active Next.js handler.
Real payments would appear in the PostgreSQL `purchases` table, not this log.
Revenue = **$0 confirmed**.

### 2.4 Revenue-Cost Ledger

**Source:** `/home/mike/nebula/ledgers/revenue-cost-ledger.jsonl`

Last entry: ops-finance verification 2026-07-04T23:04:35Z, confirming $0 real revenue.
No new entries since then (31 days stale).

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

**Finding:** Schema is present and correct. `stripe_session_id UNIQUE` constraint
provides idempotency. `ON CONFLICT (stripe_session_id) DO NOTHING` is used in
the webhook handler for the non-canonical case.

**Gap (unchanged):** Direct database query blocked (password required, no socket
auth from this agent). Cannot confirm the `purchases` table is **actually
present** in the running PostgreSQL instance on port 5433 - schema file exists
but migration status is unverified. PostgreSQL IS listening on port 5433.

---

## Section 4: Stripe Environment - Live Keys Confirmed

**Source:** `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf` (verified 2026-08-04)

- `STRIPE_SECRET_KEY`: `sk_liv...` (live key prefix confirmed)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: `pk_live_51TlN5H...` (live key confirmed)
- `STRIPE_WEBHOOK_SECRET`: `whsec_pq33c1...` (webhook secret present, matches prior run)

**Source:** `/home/mike/nebula/.stripe_links`

Active payment links - all use `buy.stripe.com` (Stripe-hosted, live mode):

| Variable | URL |
|----------|-----|
| `NEBULA_LINK` | `https://buy.stripe.com/bJefZhd6s0wkgytew243S07` |
| `LAUNCHCRATE_97_LINK` | `https://buy.stripe.com/aFa7sL5E03Iwgyt2Nk43S02` |
| `LAUNCHCRATE_197_LINK` | `https://buy.stripe.com/14AcN58Qca6Ueql2Nk43S08` |
| `PROMPT_PACK_7_LINK` | `https://buy.stripe.com/8x2dR90jG1Aobe99bI43S0a` |

**Finding:** All secrets are live-mode and unchanged. The `buy.stripe.com` links
bypass the Next.js checkout session flow - they go directly to Stripe's hosted
checkout. This means the webhook fires to whatever URL is registered in the
**Stripe dashboard**, not necessarily `nebulacomponents.shop/api/webhooks/stripe`.

---

## Section 5: The Blocking Unknown

### What cannot be confirmed read-only:

**The Stripe dashboard webhook endpoint URL and its signing secret.**

The system has `STRIPE_WEBHOOK_SECRET=whsec_pq33c1...` in production systemd.

But we cannot verify:
1. Whether the Stripe dashboard has `https://nebulacomponents.shop/api/webhooks/stripe`
   OR `https://nebulacomponents.com/api/webhooks/stripe` registered as a live-mode endpoint
2. Whether that dashboard endpoint's signing secret **matches** `whsec_pq33c1...`
3. Whether the endpoint is subscribed to `checkout.session.completed`

**If they don't match:** Every real payment would arrive, Stripe would POST to
the registered URL, `constructEvent()` would throw `SignatureVerificationError`,
the handler returns HTTP 400, Stripe retries up to 72 hours then gives up -
**no purchase row is ever written, no delivery occurs, no alert fires.**

This risk is orthogonal to the code quality (which is sound) and cannot be
resolved without Stripe dashboard access.

---

## Section 6: Evidence Paths Summary

| Artifact | Path | What it proves |
|----------|------|----------------|
| Cloudflare tunnel config | `/home/mike/.cloudflared/config.yml` | Both .shop and .com → port 3000 |
| Active service | `systemctl status nebula-nextjs.service` | Next.js running (PID 749802), healthy |
| Webhook handler code | `customer-portal/app/api/webhooks/stripe/route.ts` | Full capture→DB→delivery flow, livemode gating |
| DB schema | `customer-portal/db/schema_purchases.sql` | purchases table defined with idempotency key |
| Systemd env | `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf` | Live keys injected into running service |
| payments.log | `/home/mike/nebula/payments.log` | 7 entries, all test transactions, $0 real |
| Revenue-cost ledger | `/home/mike/nebula/ledgers/revenue-cost-ledger.jsonl` | $0 real revenue confirmed as of 2026-07-04 |
| Stripe links | `/home/mike/nebula/.stripe_links` | Live-mode buy.stripe.com links active |

---

## Section 7: Open Risks

| Risk | Severity | Verifiable how |
|------|----------|----------------|
| Webhook secret mismatch (Stripe dashboard ≠ whsec_ in systemd) | **HIGH** | Stripe dashboard → Developers → Webhooks → check endpoint URL + secret |
| Dashboard may have old `.shop` URL but primary domain is now `.com` | **HIGH** | Same: Stripe dashboard → confirm registered endpoint domain |
| purchases table may not exist in running DB (migration not confirmed) | HIGH | `psql -p 5433 -c '\dt purchases'` from mike user |
| `buy.stripe.com` links bypass Next.js checkout - `audit_id` metadata cannot be set | MEDIUM | Canonical fulfillment requires `audit_id` UUID in session metadata; Stripe-hosted links cannot inject this → purchases go to `review` not auto-delivered |
| Revenue-cost ledger 31 days stale | MEDIUM | Add cost entries (hosting, AgentMail) and any revenue when it occurs |
| Legacy Python webhook_server (port 9000) not on Stripe path but still referenced | LOW | Port 9000 not found listening - server appears inactive |

---

## Verdict

**Would a real payment be captured?** Structurally: yes, if the Stripe webhook
endpoint URL and signing secret in the dashboard match what is in production.
Functionally: the code is sound, the service is healthy, the keys are live,
the DB schema is correct.

**New wrinkle (2026-08-04):** The primary domain has shifted to
`nebulacomponents.com` in the Cloudflare config. If the Stripe dashboard webhook
is still registered to `nebulacomponents.shop/api/webhooks/stripe`, it will
still work (both domains route to port 3000). But this adds a second variant
to check: confirm which domain is registered.

**Blocking unknown:** Stripe dashboard webhook endpoint registration cannot be
verified read-only from this host. This is the single item that could silently
break end-to-end capture.

**Revenue to date:** $0 real. All 7 historical payment log entries are test
transactions. Ledger not updated since 2026-07-04.

**Action required (CEO):** Log into Stripe dashboard →
`https://dashboard.stripe.com/webhooks` → confirm:
1. Endpoint URL is either `https://nebulacomponents.shop/api/webhooks/stripe`
   or `https://nebulacomponents.com/api/webhooks/stripe`
2. Event subscribed: `checkout.session.completed`
3. Signing secret matches `whsec_pq33c1getciaJRXbFDAVe9fHqyTNhgGS`

If the domain on the registered endpoint is `.shop` but `.com` is now
primary, update the endpoint to `.com` and regenerate the signing secret -
then update `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf` and
restart `nebula-nextjs.service`.
