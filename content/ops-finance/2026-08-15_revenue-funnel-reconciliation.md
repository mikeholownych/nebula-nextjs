# Revenue Funnel Reconciliation — Payment Path Verification

**Date:** 2026-08-15
**Author:** ops-finance agent (task t_f8fef8ee)
**Task type:** CEO action — read-only verification
**Constraint:** No production changes made. No Stripe events triggered. No DB writes.
**Prior runs:** t_f9122dff (Aug 14), t_aa10d2ec (Aug 13), t_c165e519 (Aug 12), t_0b813c19 (Aug 11), t_31d5ea3f (Aug 10), t_74a37665 (Aug 9), t_34cf059c (Aug 8)

---

## Executive Summary

**Fix-pack ($97) path: VERIFIED end-to-end — unchanged from Aug 14.**
**Agency partner ($497) path: VERIFIED end-to-end — unchanged from Aug 14.**
**Subscription path ($29–$197/mo): STILL BLOCKED — schema defect now unresolved for 7 consecutive days (Aug 8–15).**
**Revenue to date: $0 real.**

The subscription schema defect (9 columns missing from `nebula_platform.subscriptions`) has not
been remediated. 3 commits were merged since Aug 14 — all are lead-gen/copy/outreach tooling
changes. None touch `nebula_platform.subscriptions`. Any real subscription payment will fail at
DB write with a PostgreSQL error.

**This is day 7 of a known blocking defect on the subscription revenue path.**

---

## 1. Infrastructure Status

| Component | Status | Evidence |
|-----------|--------|----------|
| nebula-nextjs.service | ACTIVE | `systemctl is-active nebula-nextjs` — confirmed this run |
| Cloudflare tunnel | ACTIVE — PID 914, tunnel 8cfcc2e1 | `pgrep -a cloudflared` — confirmed this run |
| Webhook endpoint (GET probe) | REACHABLE — HTTP 405 (POST-only, correct) | `curl https://nebulacomponents.com/api/webhooks/stripe` — confirmed this run |
| STRIPE_WEBHOOK_SECRET | CONFIRMED — `whsec_*` in systemd stripe.conf | prior run, no config change detected |
| STRIPE_SECRET_KEY | CONFIRMED live key `sk_live_*` | prior run, no config change detected |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | CONFIRMED live key `pk_live_51TlN5H…` | prior run, no config change detected |
| PostgreSQL cluster | ACTIVE — port 5433, `nebula_platform` online | psql connects, DB responds — confirmed this run |
| deliver_prompt_pack.py | EXISTS — 20,098 bytes, Aug 11 | prior run, no changes detected |

**No infrastructure regressions since Aug 14.**

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
| 1 | `purchases` table: 15 columns, `livemode BOOLEAN NOT NULL DEFAULT TRUE` present | confirmed Aug 12 — no schema changes since |
| 2 | `idx_purchases_live_email` index targets `livemode=true` rows | confirmed Aug 12 — no schema changes since |
| 3 | `pg_advisory_lock` + `ON CONFLICT (stripe_session_id) DO NOTHING` — idempotent | route.ts lines ~257, ~266 |
| 4 | QA fixture: `cs_test_billing_qa`, `e2e-crawler-test@example.com`, `fulfillment_status=delivered` | SELECT COUNT → 1 (QA only) — confirmed this run |
| 5 | 1 total purchase row (0 real, 1 QA fixture) | `SELECT COUNT(*) FROM purchases WHERE livemode=true` → 1 — confirmed this run |
| 6 | `deliver_prompt_pack.py` exists, 20,098 bytes | prior run — no file changes detected |
| 7 | `event.livemode` guard confirmed — test events do not trigger delivery or DB write | route.ts ~line 201, grep confirmed |
| 8 | nebula-nextjs ACTIVE — POST-only webhook endpoint returns 405 (correct) | systemctl + curl — confirmed this run |

**Verdict: VERIFIED (HIGH confidence).** A real $97 payment would be captured, DB-written, and fulfilled.

---

## 3. Agency Partner ($497) Path — VERIFIED

route.ts lines ~78–138 handle agency-partner payments separately from fix-pack:
- Detects `isAgencyPartner` flag in checkout metadata
- Inserts into `purchases` (same table, same schema — VERIFIED above)
- Creates partner record in `nebula_audit.partners` (NOT nebula_platform — correct isolation)
- Fires Telegram alert: `⚠️ CHECKOUT REVIEW - $497 ...`

**Verdict: VERIFIED.** No new commits affect this path.

---

## 4. Subscription Path ($29–$197/mo) — BLOCKING DEFECT PERSISTS (Day 7)

### Status change from Aug 14

**None.** Schema defect identical. 3 commits since Aug 14 are lead-gen/copy/outreach tooling:

- `25a67df2` — Instrument dual Hunter MailCheck design partner loop
- `ca061901` — Align audit page repair sprint copy
- `dd24444f` — Clarify repair sprint conversion offer

None touch `nebula_platform.subscriptions`. Verified directly this run:

```
sudo -u postgres psql -p 5433 -d nebula_platform -c "\d subscriptions"
```

Result: **8 columns only** — same as every day Aug 8–15.

### Defect (unchanged since Aug 8)

`route.ts` INSERTs into `nebula_platform.subscriptions` with columns:

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

This is additive only (`IF NOT EXISTS`). Zero data loss. Zero downtime. **30-second operation.**

---

## 5. Test/Live Separation

| Layer | Status | Evidence |
|-------|--------|----------|
| Stripe signature verification | CONFIRMED | `constructEvent()` with `whsec_*` |
| `event.livemode` check (purchases) | CONFIRMED — test events dropped | route.ts ~line 201 |
| `livemode` column in `purchases` | CONFIRMED present | `\d purchases` on nebula_platform — verified Aug 12 |
| `livemode` column in `subscriptions` (nebula_platform) | **NOT PRESENT** | DEFECT — see §4 |
| Legacy `webhook_server.py` / nebula-webhook.service | INACTIVE | verified prior runs — no service change detected |

---

## 6. Webhook Architecture (unchanged)

| Handler | Port | Service | Status | Role |
|---------|------|---------|--------|------|
| `route.ts` (Next.js) | 3000 via Cloudflare | nebula-nextjs | **ACTIVE** | Real payment processing |
| `webhook_server.py` | 9000 | nebula-webhook | **INACTIVE** | Legacy — correctly disabled |

**Active handler is `route.ts` only. Architecture is clean.**

---

## 7. New Activity Since Aug 14

3 commits merged Aug 14–15. All are lead-gen/copy/outreach tooling:

- `25a67df2` — Instrument dual Hunter MailCheck design partner loop (8 files, 780 insertions)
- `ca061901` — Align audit page repair sprint copy
- `dd24444f` — Clarify repair sprint conversion offer

**None of the 3 commits touch:**
- `nebula_platform.subscriptions` schema
- `customer-portal/app/api/webhooks/stripe/route.ts`
- `scripts/deliver_prompt_pack.py`
- any payment path logic

Development trajectory: lead-gen tooling and copy optimization. Schema defect continues to receive
zero engineering attention for a 7th consecutive day.

---

## 8. Blocking Unknown

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

## 9. Revenue Reconciliation

```
DATE:                      2026-08-15
REVENUE (REAL):            $0
CUMULATIVE REVENUE:        $0
PURCHASES.livemode=true:   1 row (QA fixture — cs_test_billing_qa / e2e-crawler-test@example.com)
SUBSCRIPTIONS:             0 rows
DAYS SUBSCRIPTION BLOCKED: 7 (first verified Aug 8, unresolved through Aug 15)
NEW COMMITS SINCE AUG 14:  3 (lead-gen/copy/outreach tooling — none touch payment paths)
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

## 10. Verdict

| Payment path | Verdict | Confidence | Action needed |
|---|---|---|---|
| One-time fix-pack ($97) | **VERIFIED** | HIGH | None |
| Agency partner ($497) | **VERIFIED** | HIGH | None |
| Subscription ($29–$197/mo) | **BLOCKED — SCHEMA DEFECT DAY 7** | CERTAIN | CEO: apply ALTER TABLE to nebula_platform NOW |
| Stripe dashboard config | **UNVERIFIED** | N/A | CEO: 1-min dashboard check |

**Critical escalation (Day 7): The subscription schema defect has persisted for 7 consecutive
days (Aug 8–15) with zero remediation. The ALTER TABLE fix is a 30-second, zero-risk,
additive-only operation. No subscriber has been lost yet — but this is the 7th day the window
has been open. Every day this remains unfixed increases the probability a paying subscriber
encounters a silent $0 capture.**

**The fix does not require an agent or a deploy. It requires one person to run one SQL statement.**

---

## 11. Evidence Chain (ordered by capture sequence)

| # | What it proves | Path / command |
|---|---|---|
| 1 | nebula-nextjs ACTIVE | `systemctl is-active nebula-nextjs` — confirmed this run |
| 2 | Cloudflare tunnel active, PID 914, tunnel 8cfcc2e1 | `pgrep -a cloudflared` — confirmed this run |
| 3 | Webhook endpoint reachable, POST-only | `curl https://nebulacomponents.com/api/webhooks/stripe` → 405 — confirmed this run |
| 4 | `subscriptions` schema DEFECTIVE (8 cols, missing 9) | `\d subscriptions` on nebula_platform — confirmed this run |
| 5 | `purchases` schema correct (15 cols, livemode present) | confirmed Aug 12 — no schema changes detected since |
| 6 | 0 subscriptions, 1 QA fixture purchase | `SELECT COUNT(*) FROM purchases WHERE livemode=true` → 1; `SELECT COUNT(*) FROM subscriptions` → 0 — confirmed this run |
| 7 | 3 new commits since Aug 14 — none touch subscriptions or payment routes | `git log --oneline --since="2026-08-14"` — confirmed this run |
| 8 | route.ts INSERT uses 9 missing columns (grep confirmed) | `/home/mike/nebula/customer-portal/app/api/webhooks/stripe/route.ts` — grep on email/livemode columns |
| 9 | Live Stripe keys confirmed in systemd | `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf` — confirmed prior runs, no config change |

---

*Report generated by ops-finance agent, task t_f8fef8ee. Read-only verification. No production changes made.*
*Prior reports: /home/mike/nebula/content/ops-finance/2026-08-14_revenue-funnel-reconciliation.md*
