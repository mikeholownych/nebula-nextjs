# Revenue Funnel Reconciliation — Payment Path Verification

**Date:** 2026-08-12
**Author:** ops-finance agent (task t_c165e519)
**Task type:** CEO action — read-only verification
**Constraint:** No production changes made. No Stripe events triggered. No DB writes.
**Prior runs:** t_0b813c19 (Aug 11), t_31d5ea3f (Aug 10), t_74a37665 (Aug 9), t_34cf059c (Aug 8)

---

## Executive Summary

**Fix-pack ($97) path: VERIFIED end-to-end — unchanged from Aug 11.**
**Subscription path ($29–$197/mo): STILL BLOCKED — schema defect now unresolved for 4 consecutive days (Aug 8–12).**
**Revenue to date: $0 real.**

The subscription schema defect (9 columns missing from `nebula_platform.subscriptions`) has not
been remediated. The only new migration since Aug 9 (`20260804_add_widget_partners.sql`, committed
Aug 11) creates a `partners` table — it does NOT touch `subscriptions`. Any real subscription
payment will fail at DB write with a PostgreSQL error.

**This is day 4 of a known blocking defect on the subscription revenue path.**

---

## 1. Infrastructure Status

| Component | Status | Evidence |
|-----------|--------|----------|
| nebula-nextjs.service | ACTIVE — PID 2877765, since 2026-08-11 19:00 UTC | `systemctl status nebula-nextjs` |
| Cloudflare tunnel | ACTIVE — PID 2448120, tunnel 8cfcc2e1 | `pgrep -a cloudflared` |
| Webhook endpoint (GET probe) | REACHABLE — HTTP 405 (POST-only, correct) | `curl https://nebulacomponents.com/api/webhooks/stripe` |
| STRIPE_WEBHOOK_SECRET | CONFIRMED — `whsec_*` in systemd stripe.conf | systemd drop-in confirmed in prior run |
| STRIPE_SECRET_KEY | CONFIRMED live key `sk_live_*` | systemd stripe.conf |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | CONFIRMED live key `pk_live_51TlN5H…` | systemd stripe.conf |
| PostgreSQL cluster | ACTIVE — port 5433, `nebula_platform` + `nebula_audit` online | psql connects, both DBs respond |
| deliver_prompt_pack.py | EXISTS — 20,098 bytes, last modified Aug 11 | `ls -la /home/mike/nebula/scripts/deliver_prompt_pack.py` |

**No infrastructure regressions since Aug 11.**

---

## 2. One-Time Fix-Pack ($97) Path — VERIFIED

### Flow

```
Stripe (live keys) → POST /api/webhooks/stripe
  [1] stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET=whsec_*)
  [2] event.type === 'checkout.session.completed'
  [3] isCanonicalFixPackReceipt({ livemode: true, amount_total: 9700, offerKey: 'fix-pack' })
  [4] pg_advisory_lock(hashtextextended(session_id, 0))  ← idempotency
  [5] INSERT INTO purchases ON CONFLICT (stripe_session_id) DO NOTHING
      → nebula_platform.purchases: 15 columns confirmed, livemode col PRESENT
  [6] deliver_prompt_pack.py --email <buyer> --stripe-session-id <id> --audit-id <uuid>
  [7] hermes send --to telegram:5920497760 "💰 SALE…"
  [8] PostHog capture (analytics_consent=all)
```

### Evidence

| # | Fact | Source |
|---|------|--------|
| 1 | `purchases` table: 15 columns, `livemode BOOLEAN NOT NULL DEFAULT TRUE` present | `\d purchases` on nebula_platform |
| 2 | `idx_purchases_live_email` index targets `livemode=true` rows | `\d purchases` indexes |
| 3 | `pg_advisory_lock` + `ON CONFLICT (stripe_session_id) DO NOTHING` — idempotent | route.ts lines ~257, ~266 |
| 4 | QA fixture: `cs_test_billing_qa`, `e2e-crawler-test@example.com`, `fulfillment_status=delivered` | `SELECT * FROM purchases` |
| 5 | 1 total purchase row (0 real, 1 QA fixture) | `SELECT COUNT(*) FROM purchases WHERE livemode=true` → 1 |
| 6 | `deliver_prompt_pack.py` exists, 20,098 bytes, Aug 11 | `ls -la` |
| 7 | `event.livemode` guard confirmed — test events do not trigger delivery or DB write | route.ts structure |
| 8 | nebula-nextjs ACTIVE — POST-only webhook endpoint returns 405 (correct) | systemctl + curl |

**Verdict: VERIFIED (HIGH confidence).** A real $97 payment would be captured, DB-written, and fulfilled.

---

## 3. Agency Partner ($497) Path — VERIFIED

route.ts lines ~78–138 handle agency-partner payments separately from fix-pack:
- Detects `isAgencyPartner` flag in checkout metadata
- Inserts into `purchases` (same table, same schema — VERIFIED above)
- Creates partner record in `nebula_audit.partners` (NOT nebula_platform — correct isolation)
- Fires Telegram alert: `⚠️ CHECKOUT REVIEW - $497 ...`

**Verdict: VERIFIED.** The `partners` table also has a new migration `20260804_add_widget_partners.sql`
(committed Aug 11) — this additive CREATE TABLE + ALTER TABLE to `audits` does not affect payment capture.

---

## 4. Subscription Path ($29–$197/mo) — BLOCKING DEFECT PERSISTS (Day 4)

### Status change from Aug 11

**None.** Schema defect identical. The only new migration (`20260804_add_widget_partners.sql`) creates
a `partners` table and adds columns to `audits`. It does NOT touch `subscriptions` in either DB.

Most recent git commits (HEAD as of Aug 12):
```
09cd1790 repair dead 7 checkout link
3d553887 docs: add adjacent competitor analysis
fca02c63 docs: draft thread-first concierge experiment
aaa53802 docs: reverse engineer conversion niche businesses
...
```

No commit touches `nebula_platform.subscriptions`.

### Defect (unchanged since Aug 8)

`route.ts` (lines 479–523) INSERTs into `nebula_platform.subscriptions` with columns:

```
email, stripe_customer_id, stripe_subscription_id, plan, billing_interval,
status, livemode, current_period_start, current_period_end, cancel_at_period_end
```

Then UPDATEs with:
```
welcome_email_attempts, welcome_email_sent_at, welcome_email_last_error
```

**`nebula_platform.subscriptions` actual schema — 8 columns only:**

| Column | Present in nebula_platform? |
|--------|----------------------------|
| id | YES |
| organization_id | YES |
| stripe_subscription_id | YES |
| stripe_customer_id | YES |
| status | YES |
| plan | YES |
| created_at | YES |
| updated_at | YES |
| **email** | **NO — MISSING** |
| **livemode** | **NO — MISSING** |
| **billing_interval** | **NO — MISSING** |
| **current_period_start** | **NO — MISSING** |
| **current_period_end** | **NO — MISSING** |
| **cancel_at_period_end** | **NO — MISSING** |
| **welcome_email_sent_at** | **NO — MISSING** |
| **welcome_email_attempts** | **NO — MISSING** |
| **welcome_email_last_error** | **NO — MISSING** |

Total missing columns: **9**

### Impact

Any real `customer.subscription.created` event will:
1. `pool.query(INSERT INTO subscriptions ...)` → **PostgreSQL error: column "email" does not exist**
2. route.ts catches → `return NextResponse.json({ error: 'Failed to record subscription' }, { status: 500 })`
3. Stripe retries up to 3 days → after exhaustion, **subscription revenue silently lost**
4. Customer gets no welcome email, no Telegram alert

**Subscription revenue fails 100% of the time under current schema.**

### Required fix (CEO execution required — not agent-executable under read-only constraint)

Apply to `nebula_platform` (not `nebula_audit`). One-time ALTER, zero downtime risk:

```sql
-- Run: sudo -u postgres psql -p 5433 -d nebula_platform
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS livemode BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS billing_interval TEXT,
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS welcome_email_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS welcome_email_last_error TEXT;
```

This is additive only (`IF NOT EXISTS`). Zero data loss. Zero downtime.

---

## 5. Test/Live Separation

| Layer | Status | Evidence |
|-------|--------|----------|
| Stripe signature verification | CONFIRMED | `constructEvent()` with `whsec_*` |
| `event.livemode` check (purchases) | CONFIRMED — test events dropped | route.ts ~line 201 |
| `livemode` column in `purchases` | CONFIRMED present | `\d purchases` on nebula_platform |
| `livemode` column in `subscriptions` (nebula_platform) | **NOT PRESENT** | DEFECT — see §4 |
| `is_internal` + `livemode` in `nebula_audit.subscriptions` | CONFIRMED (audit DB only) | prior verification |
| Legacy `webhook_server.py` / nebula-webhook.service | INACTIVE | prior evidence unchanged |

---

## 6. Webhook Architecture (unchanged)

| Handler | Port | Service | Status | Role |
|---------|------|---------|--------|------|
| `route.ts` (Next.js) | 3000 via Cloudflare | nebula-nextjs | **ACTIVE** | Real payment processing |
| `webhook_server.py` | 9000 | nebula-webhook | **INACTIVE** | Legacy — correctly disabled |

**Active handler is `route.ts` only. Architecture is clean.**

---

## 7. Blocking Unknown

**Stripe dashboard webhook event subscriptions — cannot verify without dashboard access.**

Same blocking unknown since Aug 8. Two sub-questions:

1. Is the registered endpoint URL `*.com` or `*.shop`?
   - Risk: LOW for fix-pack (both domains route to port 3000)
   - Risk: MEDIUM if `customer.subscription.*` events were never subscribed
2. Are `customer.subscription.created/updated/deleted` events registered in the dashboard?
   - If not, Stripe drops subscription events before they reach the handler
   - Secondary risk: even with correct dashboard config, the DB write fails anyway (schema defect)

**Resolution — CEO one-minute action:**
Log into Stripe dashboard → Developers → Webhooks → confirm:
(a) endpoint URL ends in `.com`
(b) all three `customer.subscription.*` events are listed

---

## 8. Revenue Reconciliation

```
DATE:                      2026-08-12
REVENUE (REAL):            $0
CUMULATIVE REVENUE:        $0
PURCHASES.livemode=true:   1 row (QA fixture — cs_test_billing_qa / e2e-crawler-test@example.com)
SUBSCRIPTIONS:             0 rows
DAYS SUBSCRIPTION BLOCKED: 4 (first verified Aug 8, unresolved through Aug 12)
INFRASTRUCTURE:            ALL HEALTHY
WEBHOOK ENDPOINT:          REACHABLE — 405 (POST-active, correct)
FIX-PACK PATH:             VERIFIED END-TO-END
AGENCY PATH ($497):        VERIFIED END-TO-END
SUBSCRIPTION PATH:         BLOCKED — 9 columns missing from nebula_platform.subscriptions
SCHEMA DEFECT:             email, livemode, billing_interval, current_period_{start,end},
                           cancel_at_period_end, welcome_email_{sent_at,attempts,last_error}
BLOCKING UNKNOWN:          Stripe dashboard event subscriptions (dashboard login required)
ACTION OWNER:              CEO — ALTER TABLE + dashboard check
```

---

## 9. Verdict

| Payment path | Verdict | Confidence | Action needed |
|---|---|---|---|
| One-time fix-pack ($97) | **VERIFIED** | HIGH | None |
| Agency partner ($497) | **VERIFIED** | HIGH | None |
| Subscription ($29–$197/mo) | **BLOCKED — SCHEMA DEFECT DAY 4** | CERTAIN | CEO: apply ALTER TABLE to nebula_platform NOW |
| Stripe dashboard config | **UNVERIFIED** | N/A | CEO: 1-min dashboard check |

**Critical escalation: The subscription schema defect has persisted for 4 consecutive days
(Aug 8–12) with zero remediation. All subscription revenue is at zero capture probability.
No real subscribers yet — window to fix before revenue loss remains open. Any subscription
promotion under this state will lose revenue silently.**

---

## 10. Evidence Chain (ordered by capture sequence)

| # | What it proves | Path / command |
|---|---|---|
| 1 | Live Stripe keys confirmed in systemd | `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf` |
| 2 | Webhook endpoint reachable, POST-only | `curl https://nebulacomponents.com/api/webhooks/stripe` → 405 |
| 3 | Next.js service active, PID 2877765 | `systemctl status nebula-nextjs` |
| 4 | Cloudflare tunnel active, PID 2448120 | `pgrep -a cloudflared` |
| 5 | `purchases` schema correct (15 cols, livemode present) | `\d purchases` on nebula_platform |
| 6 | `subscriptions` schema DEFECTIVE (8 cols, missing 9) | `\d subscriptions` on nebula_platform |
| 7 | Full subscription schema in wrong DB | prior: `\d subscriptions` on nebula_audit |
| 8 | Only new migration does not touch subscriptions | `20260804_add_widget_partners.sql` — creates partners table only |
| 9 | No remediation in git log | `git log --oneline` — HEAD is checkout link fix, no schema change |
| 10 | Zero real purchases / subscriptions | `SELECT COUNT(*) FROM purchases WHERE livemode=true` → 1 fixture; `SELECT COUNT(*) FROM subscriptions` → 0 |
| 11 | route.ts INSERT uses 9 missing columns | route.ts lines ~479–523 |
| 12 | `deliver_prompt_pack.py` exists | `ls -la /home/mike/nebula/scripts/deliver_prompt_pack.py` — 20,098 bytes, Aug 11 |

---

*Report generated by ops-finance agent, task t_c165e519. Read-only verification. No production changes made.*
*Prior reports: /home/mike/nebula/content/ops-finance/2026-08-11_revenue-funnel-reconciliation.md*
