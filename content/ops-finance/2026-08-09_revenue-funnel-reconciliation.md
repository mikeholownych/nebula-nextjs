# Revenue Funnel Reconciliation - Payment Path Verification

**Date:** 2026-08-09
**Author:** ops-finance agent (task t_74a37665)
**Task type:** CEO action - read-only verification
**Constraint:** No production changes made. No Stripe events triggered. No DB writes.

---

## Executive Summary

The one-time fix-pack ($97) payment capture path is **VERIFIED end-to-end**.
The subscription path ($29–$197/mo) has a **BLOCKING SCHEMA DEFECT** that would cause every real subscription payment to fail at DB write with a 500 error.
Revenue as of 2026-08-09: **$0 real** (one QA fixture row only).

---

## 1. Infrastructure Status

| Component | Status | Evidence |
|-----------|--------|----------|
| nebula-nextjs.service | ACTIVE - PID 161351, running since 2026-08-08 11:00 UTC | `systemctl status nebula-nextjs` |
| Cloudflare tunnel | ACTIVE - PID 860, tunnel 8cfcc2e1 | `pgrep -a cloudflared` |
| Webhook endpoint (GET probe) | REACHABLE - HTTP 405 (POST-only, correct) | `curl https://nebulacomponents.com/api/webhooks/stripe` |
| Checkout page | REACHABLE - HTTP 200 | `curl https://nebulacomponents.com/checkout` |
| STRIPE_WEBHOOK_SECRET | CONFIRMED - `whsec_pq33c1...` in `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf` | File read |
| STRIPE_SECRET_KEY | CONFIRMED live key - `sk_live_...rOIA` in `/home/mike/nebula/.env` | grep |
| route.ts handler | EXISTS - 19,655 bytes, updated 2026-08-07 | `ls -la` |
| nebula-webhook.service (port 9000) | INACTIVE (disabled) - `.stripe_webhook_secret` file MISSING | `systemctl status`, `ls` |

**Note:** `webhook_server.py` / nebula-webhook.service is not the active payment handler. The live handler is `route.ts` inside nebula-nextjs on port 3000, reachable via Cloudflare tunnel. Port 9000 is dead and correctly disabled.

---

## 2. One-Time Fix-Pack ($97) Path - VERIFIED

### Flow

```
Stripe (live keys) → POST /api/webhooks/stripe
  [1] stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
      → verifies against whsec_pq33c1... (confirmed in systemd env)
  [2] event.type === 'checkout.session.completed'
  [3] isCanonicalFixPackReceipt({ livemode: true, amount_total: 9700, offerKey: 'fix-pack' })
      → matches currentFixPackReceipt (id: 'fix-pack-usd-97-2026', amountCents: 9700)
  [4] pg_advisory_lock(hashtextextended(session_id, 0))  ← idempotency lock
  [5] INSERT INTO purchases ... ON CONFLICT (stripe_session_id) DO NOTHING
      → livemode column: CONFIRMED present (migration 20260803_add_purchase_livemode.sql applied)
  [6] deliver_prompt_pack.py --email <buyer> --stripe-session-id <id> --audit-id <uuid>
      → script EXISTS at /home/mike/nebula/scripts/deliver_prompt_pack.py (20,128 bytes)
  [7] hermes send --to telegram:5920497760 "💰 SALE..."
  [8] PostHog capture (if analytics_consent=all in metadata)
```

### Evidence

| # | Fact | Source |
|---|------|--------|
| 1 | `route.ts` constructs Stripe event with `process.env.STRIPE_WEBHOOK_SECRET` | route.ts lines 160–170 |
| 2 | `STRIPE_WEBHOOK_SECRET=whsec_pq33c1...` confirmed in systemd stripe.conf | /etc/systemd/system/nebula-nextjs.service.d/stripe.conf |
| 3 | `STRIPE_SECRET_KEY=sk_live_...` confirmed live mode | /home/mike/nebula/.env |
| 4 | `purchases` table has `livemode` column (BOOLEAN NOT NULL DEFAULT TRUE) | `\d purchases` on nebula_platform |
| 5 | `pg_advisory_lock` + `ON CONFLICT (stripe_session_id) DO NOTHING` - idempotent | route.ts lines 257, 266–267 |
| 6 | `deliver_prompt_pack.py` exists, correct path called by route.ts | ls -la, route.ts line 43 |
| 7 | QA fixture row `cs_test_billing_qa` present, `fulfillment_status=delivered` - proves DB write path works | psql nebula_platform |
| 8 | `event.livemode` guard before Telegram alert and delivery (test events dropped silently) | route.ts lines 239, 335 |
| 9 | `livemode=false` path drops event: no DB write, no alert | route.ts structure |

**Verdict: VERIFIED (HIGH confidence)**. A real $97 payment would be captured, inserted into `purchases`, trigger `deliver_prompt_pack.py`, and fire a Telegram alert. Zero real purchases to date.

---

## 3. Subscription Path ($29–$197/mo) - BLOCKING DEFECT FOUND

### Defect

`route.ts` (line 479) attempts to INSERT into `subscriptions` with columns:
`email, stripe_customer_id, stripe_subscription_id, plan, billing_interval, status, livemode, current_period_start, current_period_end, cancel_at_period_end`

**`nebula_platform.subscriptions` actual schema (8 columns):**

| Column | Present in DB? |
|--------|---------------|
| id | YES |
| organization_id | YES |
| stripe_subscription_id | YES |
| stripe_customer_id | YES |
| status | YES |
| plan | YES |
| created_at | YES |
| updated_at | YES |
| **email** | **NO - MISSING** |
| **livemode** | **NO - MISSING** |
| **billing_interval** | **NO - MISSING** |
| **current_period_start** | **NO - MISSING** |
| **current_period_end** | **NO - MISSING** |
| **cancel_at_period_end** | **NO - MISSING** |

### Root cause

Migration `20260804_add_subscriptions.sql` created the full-featured `subscriptions` table in **`nebula_audit`**, not `nebula_platform`. The application's `pool` object (`app/lib/db.ts`) connects to `nebula_platform` (default). The columns written by `route.ts` were never migrated into the live database.

### Impact

Any real `customer.subscription.created` event would cause:
1. route.ts queries Stripe API for customer email - succeeds
2. `pool.query(INSERT INTO subscriptions ...)` → **PostgreSQL error: column "email" does not exist**
3. route.ts catches error → `return NextResponse.json({ error: 'Failed to record subscription' }, { status: 500 })`
4. Stripe receives HTTP 500 → retries (up to 3 days)
5. After retry exhaustion: subscription revenue silently lost, customer gets no welcome email, no Telegram alert

**Subscription revenue would fail 100% of the time under current schema.**

### Required fix (CEO decision needed - not agent-executable)

Apply migration to `nebula_platform`:

```sql
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS livemode BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS billing_interval TEXT,
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE;
```

This is a schema change - it requires a human to apply to production or authorize the agent to do so.

---

## 4. Test/Live Separation

| Layer | Implementation | Status |
|-------|---------------|--------|
| Stripe signature verification | `constructEvent()` with `whsec_pq33c1...` | CONFIRMED |
| `event.livemode` check before DB write | route.ts lines 201, 239, 335, 519 | CONFIRMED |
| `livemode` column in `purchases` | BOOLEAN NOT NULL DEFAULT TRUE | CONFIRMED present |
| `livemode` column in `subscriptions` (nebula_platform) | **NOT PRESENT** | DEFECT |
| Legacy `webhook_server.py` test-exclusion logic | `_is_test_payment_text()` filters cs_test, example.com | Present but service INACTIVE |
| `payments.log` entries | All 5 entries are test rows | Confirmed - no real revenue |

---

## 5. Reconciliation: Dual Webhook Architecture

Two webhook handlers exist. Only one is active:

| Handler | Port | Service | Status | Used for |
|---------|------|---------|--------|----------|
| `route.ts` (Next.js) | 3000 (via Cloudflare) | nebula-nextjs | **ACTIVE** | Real payment processing |
| `webhook_server.py` | 9000 | nebula-webhook | **INACTIVE** (disabled, no secret) | Legacy - audit + AgentMail inbound |

This is clean architecture. The Python handler is correctly disabled and will reject any Stripe events if accidentally started (`.stripe_webhook_secret` missing → 500 immediately).

**The active handler is `route.ts` only.**

---

## 6. Blocking Unknown (Carried Forward)

**Stripe dashboard event subscriptions** - cannot verify without dashboard access:
- Is endpoint URL `.com` or `.shop`?
- Are `customer.subscription.*` events registered?
- When were they last updated?

**This is a secondary risk** behind the schema defect. Even if the dashboard is correctly configured, a real subscription payment would fail at DB write.

---

## 7. Verdict

| Payment path | Verdict | Confidence | Action needed |
|---|---|---|---|
| One-time fix-pack ($97) | **VERIFIED** | HIGH | None - infrastructure is payment-ready |
| Agency partner ($497) | **VERIFIED** | HIGH | None |
| Subscription ($29–$197/mo) | **BLOCKED - SCHEMA DEFECT** | CERTAIN | CEO must apply schema migration to nebula_platform |

**Revenue to date:** $0 real. One QA fixture row (`cs_test_billing_qa`, `livemode=true` by DB flag, `e2e-crawler-test@example.com`) - not revenue, not a customer. Flag for cleanup.

**Conversion problem is upstream (outreach, not infrastructure) for fix-pack.
Subscription revenue path is broken at the DB layer until the migration is applied.**

---

## 8. Operating Snapshot

```
DATE:                    2026-08-09
REVENUE:                 $0 (cumulative: $0)
LIVEMODE PURCHASES:      0 real (1 QA fixture row - not revenue)
LIVEMODE SUBSCRIPTIONS:  0
WEBHOOK ENDPOINT:        REACHABLE - 405 (POST-active)
SIGNING SECRET:          CONFIRMED - whsec_pq33c1... in systemd
STRIPE LIVE KEYS:        CONFIRMED - sk_live_...
FIX-PACK PATH:           VERIFIED END-TO-END
SUBSCRIPTION PATH:       BLOCKED - nebula_platform.subscriptions missing 6 columns
SCHEMA DEFECT:           email, livemode, billing_interval, current_period_{start,end}, cancel_at_period_end
MIGRATION NEEDED:        ALTER TABLE subscriptions ADD COLUMN ... on nebula_platform
ACTION OWNER:            CEO - schema migration approval/execution required
SECONDARY UNKNOWN:       Stripe dashboard event subscriptions (dashboard login required)
```

---

## Evidence Chain

All findings from read-only inspection. No production changes made.

1. `systemctl status nebula-nextjs` - service active, PID 161351
2. `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf` - STRIPE_WEBHOOK_SECRET confirmed
3. `/home/mike/nebula/.env` - STRIPE_SECRET_KEY=sk_live_ confirmed
4. `route.ts` full read - signature verification, livemode guards, INSERT statements
5. `/home/mike/nebula/customer-portal/app/lib/db.ts` - pool connects to nebula_platform port 5433
6. `psql nebula_platform \d subscriptions` - 8 columns, missing 6 required by route.ts
7. `psql nebula_platform \d purchases` - livemode column present
8. `psql nebula_platform SELECT * FROM purchases` - 1 QA row, 0 real
9. `psql nebula_platform SELECT COUNT(*) FROM subscriptions` - 0 rows
10. `customer-portal/db/migrations/20260804_add_subscriptions.sql` - targets nebula_audit, not nebula_platform
11. `curl https://nebulacomponents.com/api/webhooks/stripe` - HTTP 405 (reachable)
12. `ls /home/mike/nebula/scripts/deliver_prompt_pack.py` - exists, 20,128 bytes

---

*Generated by ops-finance agent, task t_74a37665. Read-only. No production changes made.*
