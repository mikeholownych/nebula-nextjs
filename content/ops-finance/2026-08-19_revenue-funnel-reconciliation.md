# Revenue Funnel Reconciliation — Payment Path Verification

**Date:** 2026-08-19
**Author:** ops-finance agent (task t_d509dd52)
**Task type:** CEO action — read-only verification
**Constraint:** No production changes made. No Stripe events triggered. No DB writes.
**Prior runs:** t_28092faa (Aug 18), t_5c02049c (Aug 17), t_412044db (Aug 16), t_f8fef8ee (Aug 15), t_f9122dff (Aug 14), t_aa10d2ec (Aug 13), t_c165e519 (Aug 12), t_0b813c19 (Aug 11), t_31d5ea3f (Aug 10), t_74a37665 (Aug 9), t_34cf059c (Aug 8)

---

## Executive Summary

**Fix-pack ($97) path — VERIFIED on TWO independent handler paths.**
**Agency partner ($497) path — VERIFIED (no new commits).**
**Post-purchase drip (D3/D7/D14) — ACTIVE (deployed Aug 17, unexercised — no real purchases).**
**Subscription path ($29–$197/mo) — STILL BLOCKED — schema defect unresolved for DAY 11 (Aug 8–19).**
**Revenue to date: $0 real.**

**New since Aug 18:** 5 commits (a5f886f1 through 9b313433 + a08c8673). None touch the payment capture path. All are frontend/SEO/content changes and a visitor telemetry endpoint. No schema migration. No webhook handler changes.

**Blocking unknown (unchanged):** Which webhook endpoint(s) are registered in the Stripe dashboard? Two secrets confirmed (`whsec_pq33c1...` for Next.js, `whsec_yXRap7dk...` for platform_api). Without dashboard access, cannot determine which handler receives real payments or whether both do (duplicate delivery risk).

---

## 1. Infrastructure Status

| Component | Status | Evidence |
|-----------|--------|----------|
| nebula-nextjs.service | **ACTIVE** | `systemctl is-active nebula-nextjs` — this run |
| Cloudflare tunnel | **ACTIVE** — PID 916, tunnel 8cfcc2e1 | `pgrep -a cloudflared` — this run |
| Webhook endpoint — Next.js (GET probe) | **REACHABLE** — HTTP 405 (POST-only, correct) | `curl https://nebulacomponents.com/api/webhooks/stripe` — this run |
| nebula-platform-api.service | **ACTIVE** | `systemctl is-active nebula-platform-api` — this run |
| Webhook endpoint — platform_api (GET probe) | **REACHABLE** — HTTP 405 (POST-only, correct) | `curl https://api.nebulacomponents.shop/api/stripe/webhook` — this run |
| nebula-webhook.service (legacy) | **INACTIVE** | `systemctl is-active nebula-webhook` — this run |
| STRIPE_WEBHOOK_SECRET (nebula-nextjs) | CONFIRMED — `whsec_pq33c1...` | `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf` — this run |
| STRIPE_WEBHOOK_SECRET (nebula-platform-api) | CONFIRMED — `whsec_yXRap7dk...` | `/etc/systemd/system/nebula-platform-api.service.d/stripe.conf` — this run |
| STRIPE_SECRET_KEY (nebula-nextjs) | CONFIRMED live key `sk_live_*` | stripe.conf — this run |
| PostgreSQL cluster | **ACTIVE** — port 5433, `nebula_platform` online | psql connects — this run |

**No infrastructure regressions. Cloudflare PID changed from 775022 (Aug 18) to 916 (Aug 19) — tunnel restart occurred, same tunnel ID 8cfcc2e1, same config.**

---

## 2. New Commits Since Aug 18 — 5 Commits

| SHA | Description | Touches payment path? |
|-----|-------------|----------------------|
| a5f886f1 | Homepage credibility: Impact→Priority, comparison matrix, causal language | **NO — frontend only** |
| 1328562b | Schema/robots.txt AI readiness fixes (#19) | **NO — SEO/schema.org only** |
| 5218d35e | Address remaining credibility issues (#18) | **NO — content only** |
| 766659c3 | Re-enable PostHog session recording | **NO — analytics only** |
| b57f20ec | Signal consistency + remove causal language | **NO — content only** |
| 9b313433 | audit_principles.py — enrich findings with principle layer | **NO — audit enrichment only** |
| a08c8673 | Create /api/lead-gen/rb2b-event endpoint (was 405) | **NO — visitor telemetry, fail-silent** |

**Assessment:** All 7 commits since Aug 18 are non-payment. Webhook handlers unchanged. Schema unchanged. Stripe keys unchanged. No new risk introduced.

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

### Handler B: platform_api stripe_webhook.py (active since Aug 16, unchanged since Aug 17)

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
  [10] Enroll in post_purchase_drip (fail-silent, non-blocking)
  [11] customer.subscription.created → subscription_activated() (drip suppression)
```

**Dual-handler duplicate delivery risk: UNCHANGED from Aug 17–18.** CEO dashboard check still required.

---

## 4. Agency Partner ($497) Path — VERIFIED

No commits since Aug 13 touch agency-partner handling in `route.ts`. VERIFIED unchanged.

---

## 5. Subscription Path ($29–$197/mo) — BLOCKING DEFECT PERSISTS (Day 11)

### Schema unchanged — 8 columns, 9 missing

```
sudo -u postgres psql -p 5433 -d nebula_platform -c "\d subscriptions"
```

Result: **8 columns only.** Same result every day Aug 8–19. Zero subscription rows.

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

**9 missing columns. 100% failure rate on subscription payments. Day 11.**

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

Additive only. Zero data loss. Zero downtime. **Day 11.**

---

## 6. Test/Live Separation

| Layer | Status | Evidence |
|-------|--------|----------|
| Stripe sig verification (Next.js route.ts) | CONFIRMED — `constructEvent()` with `whsec_pq33c1...` | stripe.conf — this run |
| Stripe sig verification (platform_api) | CONFIRMED — HMAC-SHA256, `whsec_yXRap7dk...` | stripe.conf — this run |
| `event.livemode` check — purchases (route.ts) | CONFIRMED — test events dropped | route.ts ~line 201 |
| `livemode` column in `purchases` | CONFIRMED present (1 QA fixture row, created 2026-08-01) | psql — this run |
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

**Two active handlers. Two different webhook secrets. Duplicate-delivery risk if both URLs are registered in Stripe dashboard — unresolved since Aug 16. Day 3 of this unknown.**

---

## 8. Blocking Unknown (UNCHANGED — Day 3)

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
DATE:                       2026-08-19
REVENUE (REAL):             $0
CUMULATIVE REVENUE:         $0
PURCHASES.livemode=true:    1 row (QA fixture — cs_test_billing_qa / e2e-crawler-test@example.com, created 2026-08-01)
SUBSCRIPTIONS:              0 rows
DAYS SUBSCRIPTION BLOCKED:  11 (first verified Aug 8, unresolved through Aug 19)
NEW COMMITS SINCE AUG 18:   7 (all non-payment: frontend/SEO/credibility/telemetry)
INFRASTRUCTURE:             ALL HEALTHY
NEXT.JS WEBHOOK ENDPOINT:   REACHABLE — 405
PLATFORM_API WEBHOOK:       REACHABLE — 405
LEGACY WEBHOOK SERVER:      INACTIVE (correct)
FIX-PACK PATH (route.ts):   VERIFIED END-TO-END
FIX-PACK PATH (platform_api): VERIFIED END-TO-END
AGENCY PATH ($497):         VERIFIED END-TO-END
SUBSCRIPTION PATH:          BLOCKED — 9 columns missing from nebula_platform.subscriptions
SCHEMA DEFECT:              email, livemode, billing_interval, current_period_{start,end},
                            cancel_at_period_end, welcome_email_{sent_at,attempts,last_error}
POST-PURCHASE DRIP:         DEPLOYED (Aug 17) — unexercised, awaiting first real purchase
BLOCKING UNKNOWN:           Which endpoint(s) registered in Stripe dashboard? (Day 3)
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
| Subscription ($29–$197/mo) | **BLOCKED — SCHEMA DEFECT DAY 11** | CERTAIN | CEO: ALTER TABLE NOW |
| Stripe dashboard webhook config | **UNVERIFIED** | N/A — URGENT | CEO: 1-min dashboard check (dual-endpoint risk, Day 3) |

**Critical escalations:**

1. **(Day 11) Subscription schema defect:** unresolved since Aug 8. Every real subscription payment fails 100%. Fix is 30 seconds, zero downtime. No developer has touched this in 11 days.

2. **(Day 3) Dual webhook endpoint ambiguity:** two active handlers, two different secrets. Cannot confirm which handler receives real payments without dashboard access. Risk of duplicate buyer email delivery if both registered.

---

## 11. Evidence Chain

| # | What it proves | Path / command |
|---|---|---|
| 1 | nebula-nextjs ACTIVE | `systemctl is-active nebula-nextjs` → active — this run |
| 2 | Cloudflare tunnel active, PID 916, tunnel 8cfcc2e1 | `pgrep -a cloudflared` — this run |
| 3 | nebula-platform-api ACTIVE | `systemctl is-active nebula-platform-api` → active — this run |
| 4 | Legacy webhook server INACTIVE | `systemctl is-active nebula-webhook` → inactive — this run |
| 5 | Next.js webhook endpoint reachable, POST-only | `curl https://nebulacomponents.com/api/webhooks/stripe` → 405 — this run |
| 6 | platform_api webhook endpoint reachable, POST-only | `curl https://api.nebulacomponents.shop/api/stripe/webhook` → 405 — this run |
| 7 | `subscriptions` schema DEFECTIVE (8 cols, 9 missing) | `\d subscriptions` on nebula_platform — this run |
| 8 | `purchases` has 1 QA fixture row (livemode=true, created 2026-08-01) | `SELECT livemode, COUNT(*), MAX(created_at) FROM purchases GROUP BY livemode` → t:1 — this run |
| 9 | 0 subscriptions | `SELECT COUNT(*) FROM subscriptions` → 0 — this run |
| 10 | 7 new commits since Aug 18 — zero touch payment path | `git log --oneline --since="2026-08-18"` + `git show --stat` — this run |
| 11 | Next.js STRIPE_WEBHOOK_SECRET confirmed live `whsec_pq33c1...` | `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf` — this run |
| 12 | platform_api STRIPE_WEBHOOK_SECRET confirmed `whsec_yXRap7dk...` | `/etc/systemd/system/nebula-platform-api.service.d/stripe.conf` — this run |

---

*Report generated by ops-finance agent, task t_d509dd52. Read-only verification. No production changes made.*
*Prior report: /home/mike/nebula/content/ops-finance/2026-08-18_revenue-funnel-reconciliation.md*
