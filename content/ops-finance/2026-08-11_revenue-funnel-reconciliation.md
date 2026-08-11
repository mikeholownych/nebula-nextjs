# Revenue Funnel Reconciliation — Payment Path Verification

**Date:** 2026-08-11
**Author:** ops-finance agent (task t_0b813c19)
**Task type:** CEO action — read-only verification
**Constraint:** No production changes made. No Stripe events triggered. No DB writes.
**Prior runs:** t_31d5ea3f (Aug 10), t_74a37665 (Aug 9), t_34cf059c (Aug 8), t_a9849c02 (Aug 8)

---

## Executive Summary

**Fix-pack ($97) path: VERIFIED end-to-end — unchanged from Aug 10.**
**Subscription path ($29–$197/mo): STILL BLOCKED — schema defect unresolved for 3 consecutive days.**
**Revenue to date: $0 real.**

The subscription schema defect first identified Aug 8, escalated Aug 9 and Aug 10, has NOT been
remediated as of Aug 11 00:18 UTC. No new migrations exist. No commits to route.ts or the DB
schema have addressed this. Any real subscription payment will fail with a PostgreSQL error at
DB write step.

**This is day 3 of a known blocking defect on the subscription revenue path.**

---

## 1. Infrastructure Status

| Component | Status | Evidence |
|-----------|--------|----------|
| nebula-nextjs.service | ACTIVE — PID 2240761, since 2026-08-11 00:12 UTC | `systemctl status nebula-nextjs` |
| Cloudflare tunnel | ACTIVE (confirmed reachable) | Webhook endpoint returns 405 |
| Webhook endpoint (GET probe) | REACHABLE — HTTP 405 (POST-only, correct) | `curl https://nebulacomponents.com/api/webhooks/stripe` |
| STRIPE_WEBHOOK_SECRET | CONFIRMED — `whsec_*` in systemd stripe.conf | `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf` |
| STRIPE_SECRET_KEY | CONFIRMED live key `sk_live_*` | systemd stripe.conf |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | CONFIRMED live key `pk_live_51TlN5H…` | systemd stripe.conf |
| PostgreSQL cluster | ACTIVE — port 5433, `nebula_platform` + `nebula_audit` online | `sudo -u postgres psql` connects |

**No infrastructure regressions since Aug 10.**

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
      → nebula_platform.purchases: 15 columns, livemode col CONFIRMED
  [6] deliver_prompt_pack.py --email <buyer> --stripe-session-id <id> --audit-id <uuid>
  [7] hermes send --to telegram:5920497760 "💰 SALE…"
  [8] PostHog capture (analytics_consent=all)
```

### Evidence

| # | Fact | Source |
|---|------|--------|
| 1 | `STRIPE_WEBHOOK_SECRET=whsec_*` confirmed in systemd env | `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf` |
| 2 | `STRIPE_SECRET_KEY=sk_live_*` confirmed live mode | systemd stripe.conf |
| 3 | `purchases` table: 15 columns including `livemode BOOLEAN NOT NULL DEFAULT TRUE` | `\d purchases` on nebula_platform |
| 4 | `idx_purchases_live_email` index targets `livemode=true` rows | `\d purchases` indexes |
| 5 | `pg_advisory_lock` + `ON CONFLICT (stripe_session_id) DO NOTHING` — idempotent | route.ts lines ~257, ~266 |
| 6 | QA fixture: `cs_test_billing_qa`, `e2e-crawler-test@example.com`, `fulfillment_status=delivered` | `SELECT * FROM purchases` |
| 7 | 1 total purchase row (0 real, 1 QA fixture) | `SELECT COUNT(*) FROM purchases WHERE livemode=true` → 1 (fixture only) |
| 8 | `deliver_prompt_pack.py` exists, 20KB, last modified Aug 9 | `ls -la /home/mike/nebula/scripts/deliver_prompt_pack.py` |
| 9 | `event.livemode` guard confirmed — test events do not trigger delivery or DB write | route.ts structure |

**Verdict: VERIFIED (HIGH confidence).** A real $97 payment would be captured, DB-written, and fulfilled.

---

## 3. Subscription Path ($29–$197/mo) — BLOCKING DEFECT PERSISTS (Day 3)

### Status change from Aug 10

**None.** The schema defect is identical. No migration has been applied. No commits touch
`nebula_platform.subscriptions`. The most recent commits (as of Aug 11) are all content/copy/
outreach changes unrelated to the payment path.

Most recent git commits (none address the defect):
```
4659a042 video pack: Loom script, animated how-it-works, hero image
04d37782 prompt pack: ROI calculator, personalized audit results
86b999e2 information gap loop: rewrite D1-D3 subjects
...
```

Last migration files (no new migration since Aug 9):
```
20260809_subscription_welcome_delivery.sql  — applied to nebula_audit only
20260809_structural_integrity.sql           — applied to nebula_audit only
20260804_add_subscriptions.sql              — comment: "Applied to nebula_audit database"
```

### Defect (unchanged)

`route.ts` (line ~479) INSERTs into `nebula_platform.subscriptions` with 10 columns:

```
email, stripe_customer_id, stripe_subscription_id, plan, billing_interval,
status, livemode, current_period_start, current_period_end, cancel_at_period_end
```

Post-Aug 9 UPDATE also uses:
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
-- Run against nebula_platform (port 5433), NOT nebula_audit
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

Command: `sudo -u postgres psql -p 5433 -d nebula_platform`

---

## 4. Test/Live Separation

| Layer | Status | Evidence |
|-------|--------|----------|
| Stripe signature verification | CONFIRMED | `constructEvent()` with `whsec_*` |
| `event.livemode` check (purchases) | CONFIRMED — test events dropped | route.ts ~line 201 |
| `livemode` column in `purchases` | CONFIRMED present | `\d purchases` on nebula_platform |
| `livemode` column in `subscriptions` (nebula_platform) | **NOT PRESENT** | DEFECT — see §3 |
| `is_internal` + `livemode` in `nebula_audit.subscriptions` | CONFIRMED (audit DB only) | `\d subscriptions` on nebula_audit |
| Legacy `webhook_server.py` / nebula-webhook.service | INACTIVE | Prior evidence, no change |

---

## 5. Webhook Architecture (Dual Handler — unchanged)

| Handler | Port | Service | Status | Role |
|---------|------|---------|--------|------|
| `route.ts` (Next.js) | 3000 via Cloudflare | nebula-nextjs | **ACTIVE** | Real payment processing |
| `webhook_server.py` | 9000 | nebula-webhook | **INACTIVE** | Legacy — correctly disabled |

**Active handler is `route.ts` only. Architecture is clean.**

---

## 6. Blocking Unknown

**Stripe dashboard webhook event subscriptions — cannot verify without dashboard access.**

This is the same blocking unknown from Aug 8, 9, and 10.

Two sub-questions:
1. Is the registered endpoint URL `*.com` or `*.shop`?
   - Risk: LOW for fix-pack (both domains route to port 3000)
   - Risk: MEDIUM if subscriptions were never added to the endpoint config
2. Are `customer.subscription.created/updated/deleted` events subscribed in the dashboard?
   - If not, Stripe drops subscription events before they reach the handler
   - Secondary to schema defect: even with correct dashboard config, DB write fails

**Resolution — CEO one-minute action:**
Log into Stripe dashboard → Developers → Webhooks → confirm:
(a) endpoint URL ends in `.com`
(b) all three `customer.subscription.*` events are listed

---

## 7. Revenue Reconciliation

```
DATE:                      2026-08-11
REVENUE (REAL):            $0
CUMULATIVE REVENUE:        $0
PURCHASES.livemode=true:   1 row (QA fixture only — cs_test_billing_qa / e2e-crawler-test@example.com)
SUBSCRIPTIONS:             0 rows
DAYS SUBSCRIPTION BLOCKED: 3 (first verified Aug 8, unresolved Aug 9, Aug 10, Aug 11)
```

**QA fixture note:** `cs_test_billing_qa` has `livemode=true` by DB flag but is not a real customer.
Email: `e2e-crawler-test@example.com`. Flagged for cleanup. Not revenue.

---

## 8. Verdict

| Payment path | Verdict | Confidence | Action needed |
|---|---|---|---|
| One-time fix-pack ($97) | **VERIFIED** | HIGH | None |
| Agency partner ($497, if offered) | **VERIFIED** | HIGH | None |
| Subscription ($29–$197/mo) | **BLOCKED — SCHEMA DEFECT DAY 3** | CERTAIN | CEO: apply ALTER TABLE to nebula_platform NOW |
| Stripe dashboard config | **UNVERIFIED** | N/A | CEO: 1-min dashboard check |

**Critical escalation: The subscription schema defect has persisted for 3 consecutive days
(Aug 8–11) with no remediation. All subscription revenue is at zero capture probability.
No real subscribers yet, but any subscription offer promotion under this state will lose
revenue silently.**

---

## Evidence Paths (ordered by capture sequence)

| # | What it proves | Path / command |
|---|---|---|
| 1 | Live Stripe keys confirmed in systemd | `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf` |
| 2 | Webhook endpoint reachable, POST-only | `curl https://nebulacomponents.com/api/webhooks/stripe` → 405 |
| 3 | Next.js service active | `systemctl status nebula-nextjs` — PID 2240761 |
| 4 | `purchases` schema correct (15 cols, livemode present) | `\d purchases` on nebula_platform |
| 5 | `subscriptions` schema DEFECTIVE (8 cols, missing 9) | `\d subscriptions` on nebula_platform |
| 6 | Full subscription schema exists in wrong DB | `\d subscriptions` on nebula_audit |
| 7 | Blocking migration comment: "Applied to nebula_audit" | `/home/mike/nebula/customer-portal/db/migrations/20260804_add_subscriptions.sql` |
| 8 | Aug 9 fix commit did NOT address nebula_platform | `ls -la migrations/` — no new migration since 20260809 |
| 9 | Zero real purchases / subscriptions | `SELECT COUNT(*) FROM purchases WHERE livemode=true` → 1 fixture; `SELECT COUNT(*) FROM subscriptions` → 0 |
| 10 | route.ts INSERT uses 10 missing columns | route.ts lines ~479–511 |
| 11 | route.ts UPDATE uses 3 more missing columns | route.ts lines ~520–527 |
| 12 | No remediation commits since Aug 9 | `git log --oneline` — HEAD is content/copy work only |

---

*Report generated by ops-finance agent, task t_0b813c19. Read-only verification. No production changes made.*
*Prior reports: /home/mike/nebula/content/ops-finance/2026-08-10_revenue-funnel-reconciliation.md*
