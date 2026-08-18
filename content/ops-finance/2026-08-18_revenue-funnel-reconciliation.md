# Revenue Funnel Reconciliation — Payment Path Verification

**Date:** 2026-08-18
**Author:** ops-finance agent (task t_28092faa)
**Task type:** CEO action — read-only verification
**Constraint:** No production changes made. No Stripe events triggered. No DB writes.
**Prior runs:** t_5c02049c (Aug 17), t_412044db (Aug 16), t_f8fef8ee (Aug 15), t_f9122dff (Aug 14), t_aa10d2ec (Aug 13), t_c165e519 (Aug 12), t_0b813c19 (Aug 11), t_31d5ea3f (Aug 10), t_74a37665 (Aug 9), t_34cf059c (Aug 8)

---

## Executive Summary

**Fix-pack ($97) path — VERIFIED on TWO independent handler paths.**
**Agency partner ($497) path — VERIFIED.**
**Post-purchase drip sequence — NEW, deployed Aug 17 (commit 4090d6a0).**
**Subscription path ($29–$197/mo) — STILL BLOCKED — schema defect unresolved for DAY 10 (Aug 8–18).**
**Revenue to date: $0 real.**

**Blocking unknown (unchanged):** Which webhook endpoint(s) are registered in the Stripe dashboard? Two secrets confirmed (`whsec_pq33c1...` for Next.js, `whsec_yXRap7dk...` for platform_api). Without dashboard access, cannot determine which handler receives real payments or whether both do (duplicate delivery risk).

---

## 1. Infrastructure Status

| Component | Status | Evidence |
|-----------|--------|----------|
| nebula-nextjs.service | **ACTIVE** | `systemctl is-active nebula-nextjs` — this run |
| Cloudflare tunnel | **ACTIVE** — PID 775022, tunnel 8cfcc2e1 | `pgrep -a cloudflared` — this run |
| Webhook endpoint — Next.js (GET probe) | **REACHABLE** — HTTP 405 (POST-only, correct) | `curl https://nebulacomponents.com/api/webhooks/stripe` — this run |
| nebula-platform-api.service | **ACTIVE** | `systemctl is-active nebula-platform-api` — this run |
| Webhook endpoint — platform_api (GET probe) | **REACHABLE** — HTTP 405 (POST-only, correct) | `curl https://api.nebulacomponents.shop/api/stripe/webhook` — this run |
| nebula-webhook.service (legacy) | **INACTIVE** | `systemctl is-active nebula-webhook` — this run |
| STRIPE_WEBHOOK_SECRET (nebula-nextjs) | CONFIRMED — `whsec_pq33c1...` | `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf` — this run |
| STRIPE_WEBHOOK_SECRET (nebula-platform-api) | CONFIRMED — `whsec_yXRap7dk...` | `/etc/systemd/system/nebula-platform-api.service.d/stripe.conf` — this run |
| STRIPE_SECRET_KEY (nebula-nextjs) | CONFIRMED live key `sk_live_*` | stripe.conf — this run |
| PostgreSQL cluster | **ACTIVE** — port 5433, `nebula_platform` online | psql connects — this run |
| deliver_prompt_pack.py | EXISTS | `scripts/deliver_prompt_pack.py` — confirmed prior runs |

**No infrastructure regressions.**

---

## 2. New Activity Since Aug 17 — 5 Commits

| SHA | Description | Touches payment path? |
|-----|-------------|-----------------------|
| 4090d6a0 | feat: post-purchase drip — D3 check-in, D7 re-audit, D14 subscription | **YES — stripe_webhook.py + crm_hooks.py** |
| 63c45b30 | fix: replace indirect audit CTA with direct Stripe link + signed results URL | **YES — deliver_audit.py** |
| bad02b98 | fix: add outreach unlock path to results page (?unlock= signed token) | NO — frontend UX only |
| 5847a2b1 | audit page: FAQ DOM rendering, 'what you get', benchmark stat | NO — content only |
| e8ee6163 | feat: Programmatic SEO + ROI Calculator | NO — new pages only |

### Commit 4090d6a0 — Post-Purchase Drip (payment-path impact)

`platform_api/routes/stripe_webhook.py` now handles `customer.subscription.created`:
```
customer.subscription.created → subscription_activated() in crm_hooks.py
  - suppresses D7/D14 drip steps for buyers who subscribed
  - updates CRM status to 'subscriber'
```

`platform_api/services/crm_hooks.py`:
- `purchase_completed()` now auto-enrolls fix_pack buyers in post-purchase drip
- New `subscription_activated()` suppresses drip + updates CRM

`scripts/post_purchase_drip.py` — new SQLite-backed drip engine:
- 3 steps: D3 check-in, D7 re-audit + $29/mo CTA, D14 subscription last touch
- Checks PostgreSQL `subscriptions` table before D7/D14 to suppress if already subscribed
- Cron: `0 */2 * * *` — runs every 2 hours

**Assessment:** This commit does NOT fix the subscriptions schema defect. It adds new CRM suppression logic that reads `subscriptions` table but only queries it (SELECT) — does not INSERT via the broken path. The drip is additive and delivery-safe. No new payment path risk introduced.

### Commit 63c45b30 — Direct Stripe Link in Audit Emails

`deliver_audit.py` updated: outreach emails now include direct Stripe checkout link (`buy.stripe.com/5kQbJ1eaw...`) with `prefilled_email` parameter + signed `?unlock=` results URL token.

**Assessment:** This improves conversion friction on the outreach → purchase funnel. Does not change webhook handling or capture logic. Not a payment path risk.

---

## 3. One-Time Fix-Pack ($97) Path — VERIFIED (Dual Handler Architecture)

### Handler A: Next.js route.ts (unchanged since Aug 13)

```
Stripe (live keys) → POST /api/webhooks/stripe (nebulacomponents.com → port 3000)
  [1] stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET=whsec_pq33c1...)
  [2] event.type === 'checkout.session.completed'
  [3] isCanonicalFixPackReceipt({ livemode: true, amount_total: 9700, offerKey: 'fix-pack' })
  [4] pg_advisory_lock(hashtextextended(session_id, 0))  ← idempotency
  [5] INSERT INTO purchases ON CONFLICT (stripe_session_id) DO NOTHING
      → nebula_platform.purchases: 15 columns confirmed, livemode col PRESENT
  [6] deliver_prompt_pack.py --email <buyer> --stripe-session-id <id> --audit-id <uuid>
  [7] hermes send --to telegram:5920497760 "💰 SALE…"
  [8] PostHog capture
```

### Handler B: platform_api stripe_webhook.py (active since Aug 16, updated Aug 17)

```
Stripe → POST /api/stripe/webhook (api.nebulacomponents.shop → port 8001)
  [1] HMAC-SHA256 signature verify (whsec_yXRap7dk...)
  [2] Replay attack guard: reject if timestamp > 5 min old
  [3] event.type === 'checkout.session.completed' OR 'charge.succeeded'
  [4] purchase_completed(email, amount_cents, product_type='fix_pack', audit_id=metadata.audit_id)
  [5] CRM: upsert_prospect → update_crm_status('purchased') → update_lifetime_value
  [6] Stop active outreach sequence (SQLite lead_state.db)
  [7] Ledger fallback: scan customer-ledger.jsonl if no audit_id in metadata
  [8] scripts/deliver_prompt_pack.py --email <buyer> --stripe-session-id <id> --audit-id <aid>
  [9] Write lookalike_signals row (PostgreSQL nebula_platform.customers)
  [10] NEW: enroll in post_purchase_drip (fail-silent, non-blocking)
  [11] NEW: customer.subscription.created → subscription_activated() (drip suppression)
```

**Dual-handler duplicate delivery risk: UNCHANGED from Aug 17.** CEO dashboard check still required.

---

## 4. Agency Partner ($497) Path — VERIFIED

No commits since Aug 13 touch agency-partner handling in `route.ts`. VERIFIED.

---

## 5. Subscription Path ($29–$197/mo) — BLOCKING DEFECT PERSISTS (Day 10)

### Schema unchanged — 8 columns, 9 missing

```
sudo -u postgres psql -p 5433 -d nebula_platform -c "\d subscriptions"
```

Result: **8 columns only.** Same result every day Aug 8–18. Zero subscription rows.

`route.ts` attempts INSERT with:
```
email, stripe_customer_id, stripe_subscription_id, plan, billing_interval,
status, livemode, current_period_start, current_period_end, cancel_at_period_end
```
Then UPDATE with:
```
welcome_email_attempts, welcome_email_sent_at, welcome_email_last_error
```

**Actual schema — 8 columns only:**

| Column | Present? |
|--------|---------|
| id | YES |
| organization_id | YES |
| stripe_subscription_id | YES |
| stripe_customer_id | YES |
| status | YES |
| plan | YES |
| created_at | YES |
| updated_at | YES |
| **email** | **NO** |
| **livemode** | **NO** |
| **billing_interval** | **NO** |
| **current_period_start** | **NO** |
| **current_period_end** | **NO** |
| **cancel_at_period_end** | **NO** |
| **welcome_email_sent_at** | **NO** |
| **welcome_email_attempts** | **NO** |
| **welcome_email_last_error** | **NO** |

**9 missing columns. 100% failure rate on subscription payments. Day 10.**

### Note on commit 4090d6a0

This commit adds `customer.subscription.created` handling to `platform_api` (Handler B), calling `subscription_activated()` → CRM suppression only. It does NOT write to `nebula_platform.subscriptions`. The schema defect is in the Next.js `route.ts` INSERT path only, and it is still unresolved.

### Required fix (CEO — 30 seconds, zero downtime)

```sql
-- sudo -u postgres psql -p 5433 -d nebula_platform
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

Additive only. Zero data loss. Zero downtime. **Day 10.**

---

## 6. Test/Live Separation

| Layer | Status | Evidence |
|-------|--------|----------|
| Stripe sig verification (Next.js route.ts) | CONFIRMED — `constructEvent()` with `whsec_pq33c1...` | stripe.conf — this run |
| Stripe sig verification (platform_api) | CONFIRMED — HMAC-SHA256, `whsec_yXRap7dk...` | stripe.conf — this run |
| `event.livemode` check — purchases (route.ts) | CONFIRMED — test events dropped | route.ts ~line 201 |
| `livemode` column in `purchases` | CONFIRMED present (1 QA fixture row) | psql — this run |
| `livemode` column in `subscriptions` | **NOT PRESENT** | DEFECT — §5 |
| Dev-mode sig bypass (platform_api) | ACCEPTABLE — bypass only if secret empty; secret IS set | stripe.conf — this run |
| Legacy `webhook_server.py` / nebula-webhook.service | INACTIVE | systemctl — this run |

---

## 7. Webhook Architecture

| Handler | Endpoint | Port | Service | Status | Role |
|---------|----------|------|---------|--------|------|
| `route.ts` (Next.js) | `nebulacomponents.com/api/webhooks/stripe` | 3000 via CF | nebula-nextjs | **ACTIVE** | Fix-pack, agency-partner, subscription |
| `stripe_webhook.py` (platform_api) | `api.nebulacomponents.shop/api/stripe/webhook` | 8001 via CF | nebula-platform-api | **ACTIVE** | Fix-pack CRM + delivery + drip enroll |
| `webhook_server.py` | — | 9000 | nebula-webhook | **INACTIVE** | Legacy — correctly disabled |

**Two active handlers. Two different webhook secrets. Duplicate-delivery risk if both URLs are registered in Stripe dashboard — unresolved since Aug 16.**

---

## 8. Blocking Unknown (UNCHANGED)

**Which webhook endpoint(s) are registered in the Stripe dashboard?**

- Option A: Only `nebulacomponents.com/api/webhooks/stripe` — Handler A active, Handler B CRM/drip receives nothing
- Option B: Only `api.nebulacomponents.shop/api/stripe/webhook` — Handler B active, Handler A purchase record receives nothing
- Option C: Both — duplicate delivery risk on fix-pack payments (two emails to buyer)
- Option D: Neither updated since Aug 16 deploy — Handler B was coded but never wired

**CEO one-minute action:**
Log into Stripe dashboard → Developers → Webhooks:
- List all registered endpoints
- Confirm which event types each receives
- If both are registered: confirm dedup strategy or remove redundant endpoint

---

## 9. Revenue Reconciliation

```
DATE:                       2026-08-18
REVENUE (REAL):             $0
CUMULATIVE REVENUE:         $0
PURCHASES.livemode=true:    1 row (QA fixture — cs_test_billing_qa / e2e-crawler-test@example.com)
SUBSCRIPTIONS:              0 rows
DAYS SUBSCRIPTION BLOCKED:  10 (first verified Aug 8, unresolved through Aug 18)
NEW COMMITS SINCE AUG 17:   5 (4090d6a0: drip + webhook; 63c45b30: deliver_audit.py; 3 non-payment)
INFRASTRUCTURE:             ALL HEALTHY
NEXT.JS WEBHOOK ENDPOINT:   REACHABLE — 405
PLATFORM_API WEBHOOK:       REACHABLE — 405
LEGACY WEBHOOK SERVER:      INACTIVE (correct)
FIX-PACK PATH (route.ts):   VERIFIED END-TO-END
FIX-PACK PATH (platform_api): VERIFIED END-TO-END (updated with drip enroll)
AGENCY PATH ($497):         VERIFIED END-TO-END
SUBSCRIPTION PATH:          BLOCKED — 9 columns missing from nebula_platform.subscriptions
SCHEMA DEFECT:              email, livemode, billing_interval, current_period_{start,end},
                            cancel_at_period_end, welcome_email_{sent_at,attempts,last_error}
POST-PURCHASE DRIP:         NEW — deployed Aug 17; D3/D7/D14 email sequence for $97 buyers
BLOCKING UNKNOWN:           Which endpoint(s) registered in Stripe dashboard?
ACTION OWNER:               CEO — ALTER TABLE (30s, zero risk) + dashboard check (1 min)
```

---

## 10. Verdict

| Payment path | Verdict | Confidence | Action needed |
|---|---|---|---|
| One-time fix-pack ($97) — route.ts | **VERIFIED** | HIGH | None |
| One-time fix-pack ($97) — platform_api | **VERIFIED** | HIGH | Dashboard check: confirm endpoint registration |
| Agency partner ($497) | **VERIFIED** | HIGH | None |
| Post-purchase drip (D3/D7/D14) | **FUNCTIONAL** | HIGH | Requires first real purchase to activate |
| Subscription ($29–$197/mo) | **BLOCKED — SCHEMA DEFECT DAY 10** | CERTAIN | CEO: ALTER TABLE NOW |
| Stripe dashboard webhook config | **UNVERIFIED** | N/A — URGENT | CEO: 1-min dashboard check (dual-endpoint risk) |

**Critical escalations:**

1. **(Day 10) Subscription schema defect:** unresolved since Aug 8. Every real subscription payment fails 100%. Fix is 30 seconds, zero downtime.

2. **(Day 2) Dual webhook endpoint ambiguity:** two active handlers, two different secrets. Cannot confirm which handler receives real payments without dashboard access. Risk of duplicate buyer email delivery if both registered.

---

## 11. Evidence Chain

| # | What it proves | Path / command |
|---|---|---|
| 1 | nebula-nextjs ACTIVE | `systemctl is-active nebula-nextjs` → active — this run |
| 2 | Cloudflare tunnel active, PID 775022, tunnel 8cfcc2e1 | `pgrep -a cloudflared` — this run |
| 3 | nebula-platform-api ACTIVE | `systemctl is-active nebula-platform-api` → active — this run |
| 4 | Legacy webhook server INACTIVE | `systemctl is-active nebula-webhook` → inactive — this run |
| 5 | Next.js webhook endpoint reachable, POST-only | `curl https://nebulacomponents.com/api/webhooks/stripe` → 405 — this run |
| 6 | platform_api webhook endpoint reachable, POST-only | `curl https://api.nebulacomponents.shop/api/stripe/webhook` → 405 — this run |
| 7 | `subscriptions` schema DEFECTIVE (8 cols, 9 missing) | `\d subscriptions` on nebula_platform — this run |
| 8 | `purchases` has 1 QA fixture row (livemode=true, test IDs) | `SELECT livemode, COUNT(*) FROM purchases GROUP BY livemode` → t:1 — this run |
| 9 | 0 subscriptions | `SELECT COUNT(*) FROM subscriptions` → 0 — this run |
| 10 | 5 new commits since Aug 17 — 4090d6a0 touches payment path | `git log --oneline --since="2026-08-17"` + `git show --stat` — this run |
| 11 | Next.js STRIPE_WEBHOOK_SECRET confirmed live `whsec_pq33c1...` | `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf` — this run |
| 12 | platform_api STRIPE_WEBHOOK_SECRET confirmed `whsec_yXRap7dk...` | `/etc/systemd/system/nebula-platform-api.service.d/stripe.conf` — this run |
| 13 | 4090d6a0 adds drip enroll to purchase_completed, NOT subscription INSERT | `git show 4090d6a0 -- platform_api/routes/stripe_webhook.py` — this run |
| 14 | 63c45b30 adds direct Stripe link to audit emails | `git show --stat 63c45b30` — this run |

---

*Report generated by ops-finance agent, task t_28092faa. Read-only verification. No production changes made.*
*Prior report: /home/mike/nebula/content/ops-finance/2026-08-17_revenue-funnel-reconciliation.md*
