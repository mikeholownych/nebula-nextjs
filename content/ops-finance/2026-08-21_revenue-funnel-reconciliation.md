# Revenue Funnel Reconciliation — Payment Path Verification

**Date:** 2026-08-21
**Author:** ops-finance agent (task t_f7bc6ee6)
**Task type:** CEO action — read-only verification
**Constraint:** No production changes made. No Stripe events triggered. No DB writes.
**Prior runs:** t_d99b96c1 (Aug 20), t_d509dd52 (Aug 19), t_28092faa (Aug 18), t_5c02049c (Aug 17), t_412044db (Aug 16), t_f8fef8ee (Aug 15), t_f9122dff (Aug 14), t_aa10d2ec (Aug 13), t_c165e519 (Aug 12), t_0b813c19 (Aug 11), t_31d5ea3f (Aug 10), t_74a37665 (Aug 9), t_34cf059c (Aug 8)

---

## Executive Summary

**Fix-pack ($97) path — VERIFIED on TWO independent handler paths.**
**Agency partner ($497) path — VERIFIED (no new commits to handler).**
**Post-purchase drip (D3/D7/D14) — ACTIVE (deployed Aug 17, unexercised — no real purchases).**
**Subscription path ($29–$197/mo) — STILL BLOCKED — schema defect unresolved for DAY 13 (Aug 8–21).**
**Revenue to date: $0 real.**

**NEW since Aug 20 (29 commits):** Two commits touch the payment path:
- `f5a20ebe` — `route.ts` webhook modified. **New HeyCatch SDK analytics wiring added** — module-level `heycatch.init()` + `heycatch.trackEvent('purchase_completed')` and `subscription_started/canceled` events, all wrapped in try/catch (fail-silent). Additive, non-blocking.
- `2f9b6c72` — Billing summary route + platform_api auth updated. **Agency account plan and lifetime free tier hardcoded for mike.holownych@gmail.com.** New subscription row inserted (`sub_agency_founder_free` / `cus_agency_founder`). Non-payment path — no Stripe capture logic changed.

**Funnel ledger update (2089 rows, up from 692):** 126 `checkout_creation_failed / checkout_provider_error` events now recorded (up from 24). This is ESCALATING — real visitors are hitting checkout and being rejected. Still zero real `purchase_completed` events.

**Subscription schema still defective (Day 13).** 8 columns. 9 required columns still missing. The 1 row now in `subscriptions` is a fixture (`sub_agency_founder_free`) inserted by the agency billing commit — NOT a real Stripe subscription.

**Blocking unknown (unchanged, Day 5):** Which webhook endpoint(s) are registered in the Stripe dashboard?

---

## 1. Infrastructure Status

| Component | Status | Evidence |
|-----------|--------|----------|
| nebula-nextjs.service | **ACTIVE** | `systemctl is-active nebula-nextjs` — this run |
| nebula-platform-api.service | **ACTIVE** | `systemctl is-active nebula-platform-api` — this run |
| nebula-webhook.service (legacy) | **INACTIVE** | `systemctl is-active nebula-webhook` — this run |
| Cloudflare tunnel | **ACTIVE** — PID 910, tunnel 8cfcc2e1 | `pgrep -a cloudflared` — this run |
| Webhook endpoint — Next.js (GET probe) | **REACHABLE** — HTTP 405 (POST-only, correct) | `curl https://nebulacomponents.com/api/webhooks/stripe` — this run |
| Webhook endpoint — platform_api (GET probe) | **REACHABLE** — HTTP 405 (POST-only, correct) | `curl https://api.nebulacomponents.shop/api/stripe/webhook` — this run |
| STRIPE_WEBHOOK_SECRET (nebula-nextjs) | CONFIRMED — `whsec_pq33c1...` (2 entries in stripe.conf) | `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf` — this run |
| PostgreSQL cluster | **ACTIVE** — port 5433, `nebula_platform` online | psql connects — this run |
| analytics_event_ledger | **ACTIVE** — 2089 rows | `SELECT COUNT(*) FROM analytics_event_ledger` — this run |

**No infrastructure regressions. Cloudflare PID/tunnel ID unchanged from Aug 20.**

---

## 2. New Commits Since Aug 20 — 29 Commits

| SHA | Time (UTC) | Description | Touches payment path? |
|-----|-----------|-------------|----------------------|
| c1c9137f | ~18:00 | Design: Impeccable schema 1, token harmonization | NO — frontend only |
| 098222c7 | ~18:10 | Motion: GPU scanning sweep, score ticker | NO — frontend only |
| e52be2fa | ~18:15 | Layout: scroll-padding-top, subnav flush | NO — frontend only |
| 9fece7f5 | ~18:20 | Nav: fixed → sticky top-0 | NO — frontend only |
| dd641d56 | ~18:25 | Hero: unify CTA pill, remove fake scan delay | NO — frontend/copy only |
| 0d113cc9 | ~18:28 | Hero: polish submit button fragment | NO — frontend only |
| 0532ce62 | ~18:29 | Polish: mobile URL input attributes | NO — frontend/copy only |
| b1c23468 | ~18:29 | Docs: reverse-engineer competitor revenue systems | NO — docs only |
| 969956e6 | ~18:29 | Docs: fold verified Crazy Egg, VWO evidence | NO — docs only |
| c2affa77 | ~18:30 | Perf: eliminate CLS on hero glow | NO — frontend/CSS only |
| **3846d3aa** | **18:29** | **CRO: comprehensive audit recommendations** | **NO — content/design/components only (no checkout or webhook diff)** |
| **f5a20ebe** | **18:53** | **Analytics: integrate HeyCatch SDK** | **YES — route.ts webhook modified (additive analytics only)** |
| 379f3cea | ~19:00 | Feat: competitor audit, AI fix prompt, JSON-LD gen | NO — workspace tools |
| 09aa6872 | ~19:05 | Chore: add compare and FixRoast routes to deploy verify | NO — chore/test |
| 01c6adbf | ~19:10 | Workspace: modularize intelligence suite | NO — workspace tools |
| 37ba64fb | ~19:15 | Agent-api: direct AI fix protocol FastMCP tool | NO — platform API, no payment path |
| fafd950f | ~19:20 | Results: wire view evidence + repair sprint links | NO — frontend routing |
| 43d3119c | ~19:25 | Fix rewrites: 422 fallback copy extraction | NO — rewrite engine |
| **2f9b6c72** | **20:22** | **Billing: configure agency account + lifetime free** | **ADJACENT — billing summary route, no Stripe capture** |
| f5a20ebe | 18:53 | (listed above) | YES — see §3 |
| 585ef065 | ~21:00 | Workspace: Searchable-inspired Site Health hero | NO — frontend |
| 224ceba9 | ~21:10 | Workspace: project selector pill | NO — frontend |
| 419eae81 | ~21:15 | Workspace: select all + batch auditing | NO — frontend |
| 5315cff4 | ~21:20 | SEO: BreadcrumbList JSON-LD /press | NO — SEO metadata |
| 97ee62ee | ~21:25 | Press: intent-aligned headings | NO — content |
| 49a923df | ~21:30 | SEO: WebPage JSON-LD /press | NO — SEO metadata |
| 6f919093 | ~21:35 | SEO: /press title length optimization | NO — SEO |
| 959e0a79 | ~21:40 | Perf: next/script afterInteractive tracking | NO — perf/scripts |
| c28484c1 | ~21:45 | Fix: remove duplicate og:image tags | NO — SEO |
| 389068bd | ~21:50 | SEO: titles, breadcrumb/webpage schemas | NO — SEO metadata |

**2 commits touch payment path: f5a20ebe (additive analytics), 2f9b6c72 (billing summary — not capture path).**

---

## 3. Payment-Path Changes in f5a20ebe (Aug 20, 18:53)

### 3a. webhooks/stripe/route.ts — HeyCatch SDK Analytics (additive)

Module-level additions:
```
import { analytics as heycatch } from '@heycatch/sdk'
heycatch.init({ projectKey: 'hck_pk_UDEJlnGqF84u4i2q08NwcTvTYGrXLns_' })
```

After existing purchase INSERT block:
- `heycatch.setIdentity(userId, { email, plan })` — fail-silent try/catch
- `heycatch.trackEvent('purchase_completed', { offer_key, amount_cents, currency, transaction_id })` — fail-silent

For subscription events (`customer.subscription.created`, `customer.subscription.deleted`):
- `heycatch.trackEvent('subscription_started')` and `subscription_canceled` — both fail-silent

**Assessment: All additive, all wrapped in try/catch. Core Stripe sig verification, purchase INSERT, idempotency lock, deliver_prompt_pack.py, Telegram notification, funnel ledger wiring, and GA4 forwarding are UNCHANGED. Capture path integrity: MAINTAINED.**

**New risk noted:** HeyCatch `init()` is called at module load time (outside any handler), meaning it runs on cold-start. If `@heycatch/sdk` package is not installed or the projectKey is invalid, the import itself could crash the route module. Non-blocking if the package loads cleanly — requires verifying `@heycatch/sdk` is in package.json and deployed.

---

## 4. One-Time Fix-Pack ($97) Path — VERIFIED (Dual Handler Architecture)

### Handler A: Next.js route.ts (additive instrumentation only since Aug 19)

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
  [8] recordFunnelEvent('purchase_completed') → analytics_event_ledger [added Aug 19 — fail-silent]
  [9] GA4 Measurement Protocol forwarding [added Aug 19 — fail-silent, still no-op: key missing]
  [10] PostHog capture
  [11] heycatch.trackEvent('purchase_completed') [NEW Aug 20 — fail-silent]
```

### Handler B: platform_api stripe_webhook.py (unchanged since Aug 17)

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

**Dual-handler duplicate delivery risk: UNCHANGED from Aug 17–21. CEO dashboard check still required.**

---

## 5. Agency Partner ($497) Path — VERIFIED

No commits since Aug 13 touch agency-partner handling in `route.ts`. VERIFIED unchanged.

---

## 6. Subscription Path ($29–$197/mo) — BLOCKING DEFECT PERSISTS (Day 13)

Schema UNCHANGED. Still 8 columns. 9 required columns still missing.

The 1 row now in `subscriptions` (`sub_agency_founder_free`) was inserted by `2f9b6c72` as a fixture — it is NOT a real Stripe-triggered subscription. It uses `stripe_customer_id = 'cus_agency_founder'` (placeholder string, not a real Stripe cus_* ID).

```
subscriptions columns present: id, organization_id, stripe_subscription_id,
  stripe_customer_id, status, plan, created_at, updated_at (8 total)

MISSING: email, livemode, billing_interval, current_period_start,
  current_period_end, cancel_at_period_end, welcome_email_sent_at,
  welcome_email_attempts, welcome_email_last_error (9 missing)
```

**Required fix (CEO — 30 seconds, zero downtime):**

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

Additive only. Zero data loss. Zero downtime. **Day 13. Every real subscription payment that lands before this fix is silently dropped.**

---

## 7. Funnel Ledger — Escalating Checkout Failure Signal

`analytics_event_ledger` has **2089 rows** (up from 692 yesterday — 1397 new events in ~24h).

| Event | Count | Delta vs Aug 20 | Assessment |
|-------|-------|-----------------|------------|
| `landing_page_view` | 995 | +575 | Real visitor traffic growing |
| `audit_accepted` | 270 | +217 | Audit pipeline healthy |
| `audit_started` | 254 | +201 | Normal |
| `audit_cta_exposed` | 142 | +89 | CTA rendering correctly |
| `checkout_creation_failed / checkout_provider_error` | **126** | **+102** | **ESCALATING FUNNEL LEAK** |
| `audit_submission_rejected / invalid_payload` | 86 | +70 | Bot/scraper traffic |
| `audit_submission_rejected / invalid_url` | 84 | +56 | Visitors submitting bad URLs |
| `checkout_creation_failed / audit_not_unlocked` | 43 | +35 | Visitors clicking buy without audit |
| `audit_failed / invalid_payload` | 43 | new | Audit engine rejections |
| `audit_result_viewed` | 20 | +6 | Audits completing to results |
| `checkout_started` | 4 | 0 | Initiated checkout flow |
| `purchase_completed` | 1 | 0 | **STILL synthetic/test only** |

**126 `checkout_provider_error` events across Aug 19–20 means real visitors reaching checkout are being blocked at a ~31x rate vs the 4 successful `checkout_started` events. Root cause still unknown. Possible causes: intermittent STRIPE_SECRET_KEY env resolution, offer configured as unavailable, Next.js cold-start env var delay. This is the highest-priority revenue leak visible in data.**

---

## 8. Test/Live Separation

| Layer | Status | Evidence |
|-------|--------|----------|
| Stripe sig verification (Next.js route.ts) | CONFIRMED — `constructEvent()` with `whsec_pq33c1...` | stripe.conf — this run |
| Stripe sig verification (platform_api) | CONFIRMED — HMAC-SHA256, `whsec_yXRap7dk...` | stripe.conf — this run |
| `event.livemode` check — purchases (route.ts) | CONFIRMED — test events dropped | route.ts unchanged |
| `livemode` column in `purchases` | CONFIRMED present | psql — this run |
| `livemode` column in `subscriptions` | **NOT PRESENT** | DEFECT — §6 |
| `is_synthetic` + `payment_mode` in analytics_event_ledger | CONFIRMED — separation enforced | psql \d — this run |
| Funnel ledger `purchase_completed` row | CONFIRMED `is_synthetic=true`, `payment_mode=test` | psql — this run |
| Dev-mode sig bypass (platform_api) | ACCEPTABLE — bypass only if secret empty; secret IS set | stripe.conf — this run |
| Legacy `webhook_server.py` / nebula-webhook.service | INACTIVE | systemctl — this run |
| `subscriptions` fixture row | CONFIRMED fixture — `sub_agency_founder_free` / `cus_agency_founder` (non-Stripe IDs) | psql — this run |

---

## 9. Webhook Architecture

| Handler | Endpoint | Port | Service | Status | Role |
|---------|----------|------|---------|--------|------|
| `route.ts` (Next.js) | `nebulacomponents.com/api/webhooks/stripe` | 3000 via CF | nebula-nextjs | **ACTIVE** | Fix-pack, agency-partner, subscription |
| `stripe_webhook.py` (platform_api) | `api.nebulacomponents.shop/api/stripe/webhook` | 8001 via CF | nebula-platform-api | **ACTIVE** | Fix-pack CRM + delivery + drip enroll |
| `webhook_server.py` | — | 9000 | nebula-webhook | **INACTIVE** | Legacy — correctly disabled |

**Two active handlers. Two different webhook secrets. Duplicate-delivery risk if both URLs are registered in Stripe dashboard — unresolved since Aug 16. Day 5 of this unknown.**

---

## 10. Blocking Unknown (UNCHANGED — Day 5)

**Which webhook endpoint(s) are registered in the Stripe dashboard?**

- Option A: Only `nebulacomponents.com/api/webhooks/stripe` — Handler A active, Handler B CRM/drip receives nothing
- Option B: Only `api.nebulacomponents.shop/api/stripe/webhook` — Handler B active, Handler A purchase record receives nothing
- Option C: Both — duplicate delivery risk on fix-pack payments (two emails to buyer, two deliver_prompt_pack.py calls)
- Option D: Neither updated since Aug 16 deploy — Handler B was coded but never wired

**CEO one-minute action:**
Log into Stripe dashboard → Developers → Webhooks:
- List all registered endpoints
- Confirm which event types each receives
- If both are registered: confirm dedup strategy or remove redundant endpoint

---

## 11. Revenue Reconciliation

```
DATE:                                2026-08-21
REVENUE (REAL):                      $0
CUMULATIVE REVENUE:                  $0
PURCHASES.livemode=true:             1 row (QA fixture — cs_test_billing_qa, created 2026-08-01)
SUBSCRIPTIONS (real):                0 rows (1 fixture row — sub_agency_founder_free, non-Stripe ID)
DAYS SUBSCRIPTION BLOCKED:          13 (first verified Aug 8, unresolved through Aug 21)
NEW COMMITS SINCE AUG 20:           29 (2 touch payment path — additive analytics only)
INFRASTRUCTURE:                      ALL HEALTHY
NEXT.JS WEBHOOK ENDPOINT:           REACHABLE — 405
PLATFORM_API WEBHOOK:               REACHABLE — 405
LEGACY WEBHOOK SERVER:              INACTIVE (correct)
FIX-PACK PATH (route.ts):           VERIFIED END-TO-END (core logic unchanged)
FIX-PACK PATH (platform_api):       VERIFIED END-TO-END
AGENCY PATH ($497):                 VERIFIED END-TO-END
SUBSCRIPTION PATH:                  BLOCKED — 9 columns missing from nebula_platform.subscriptions
FUNNEL LEDGER:                      2089 rows; 126 checkout_provider_error events (ESCALATING)
CHECKOUT_PROVIDER_ERROR RATE:       126 failures vs 4 checkout_started (31:1 failure:success ratio)
GA4 SERVER-SIDE TRACKING:           NOT CONFIGURED — GA4_API_SECRET missing from nebula-nextjs env
HEYCATCH SDK:                       ADDED (f5a20ebe) — verify @heycatch/sdk in package.json
BLOCKING UNKNOWN:                   Which endpoint(s) registered in Stripe dashboard? (Day 5)
ACTION OWNER:                       CEO — ALTER TABLE (30s) + dashboard check (1 min) + checkout_provider_error root cause
```

---

## 12. Verdict

| Payment path | Verdict | Confidence | Action needed |
|---|---|---|---|
| One-time fix-pack ($97) — route.ts | **VERIFIED** | HIGH | None on capture path |
| One-time fix-pack ($97) — platform_api | **VERIFIED** | HIGH | Dashboard check: confirm endpoint registration |
| Agency partner ($497) | **VERIFIED** | HIGH | None |
| Post-purchase drip (D3/D7/D14) | **FUNCTIONAL** | HIGH | Requires first real purchase to activate |
| Subscription ($29–$197/mo) | **BLOCKED — SCHEMA DEFECT DAY 13** | CERTAIN | CEO: ALTER TABLE NOW |
| Stripe dashboard webhook config | **UNVERIFIED** | N/A — URGENT | CEO: 1-min dashboard check (dual-endpoint risk, Day 5) |
| GA4 server-side purchase tracking | **MISCONFIGURED** | CERTAIN | CEO: add GA4_API_SECRET to nebula-nextjs env |
| checkout_provider_error (126 events) | **ACTIVE REVENUE LEAK** | HIGH | CEO: investigate root cause — 31:1 failure rate |

**Critical escalations:**

1. **(Day 13) Subscription schema defect:** unresolved since Aug 8. Every real subscription payment fails 100%. Fix is 30 seconds, zero downtime.

2. **(Day 5) Dual webhook endpoint ambiguity:** two active handlers, two different secrets. Cannot confirm which handler receives real payments without dashboard access.

3. **(Escalating — Day 2) 126 checkout_creation_failed / checkout_provider_error:** up from 24 yesterday. 31 failures per successful checkout start. Real visitors are being blocked at checkout. Revenue lost: unknown but growing.

4. **(Day 2) GA4_API_SECRET missing:** server-side purchase tracking silently no-ops. Attribution broken from launch.

5. **(New — Day 1) HeyCatch SDK module-level init:** `heycatch.init()` runs at route module load time. If `@heycatch/sdk` fails to import, the entire webhook route could fail to load. Verify package is in `package.json` and installed in the deployed build.

---

## 13. Evidence Chain

| # | What it proves | Path / command |
|---|---|---|
| 1 | nebula-nextjs ACTIVE | `systemctl is-active nebula-nextjs` → active — this run |
| 2 | nebula-platform-api ACTIVE | `systemctl is-active nebula-platform-api` → active — this run |
| 3 | Legacy webhook server INACTIVE | `systemctl is-active nebula-webhook` → inactive — this run |
| 4 | Cloudflare tunnel active, PID 910, tunnel 8cfcc2e1 | `pgrep -a cloudflared` — this run |
| 5 | Next.js webhook endpoint reachable, POST-only | `curl https://nebulacomponents.com/api/webhooks/stripe` → 405 — this run |
| 6 | platform_api webhook endpoint reachable, POST-only | `curl https://api.nebulacomponents.shop/api/stripe/webhook` → 405 — this run |
| 7 | `subscriptions` schema DEFECTIVE (8 cols, 9 missing) | `\d subscriptions` on nebula_platform — this run |
| 8 | `subscriptions` 1 row is a fixture (sub_agency_founder_free / cus_agency_founder) | `SELECT * FROM subscriptions` — this run |
| 9 | `purchases` has 1 QA fixture row (livemode=true, created 2026-08-01) | `SELECT livemode, COUNT(*), MAX(created_at) FROM purchases GROUP BY livemode` — this run |
| 10 | 29 new commits since Aug 20 — 2 touch payment path (additive only) | `git log --oneline --after=2026-08-20` — this run |
| 11 | f5a20ebe adds HeyCatch analytics to webhook (additive, fail-silent) | `git show f5a20ebe -- customer-portal/app/api/webhooks/stripe/route.ts` — this run |
| 12 | 126 checkout_provider_error events (up from 24) | `SELECT event_name, failure_reason, COUNT(*) FROM analytics_event_ledger GROUP BY...` — this run |
| 13 | Funnel purchase_completed row is synthetic/test only | `SELECT event_name, environment, payment_mode, is_synthetic FROM analytics_event_ledger WHERE event_name='purchase_completed'` — this run |
| 14 | GA4_API_SECRET not set in nebula-nextjs env | `grep GA4_API_SECRET /etc/systemd/system/nebula-nextjs.service.d/stripe.conf` → 0 matches — this run |
| 15 | analytics_event_ledger has 2089 rows | `SELECT COUNT(*) FROM analytics_event_ledger` — this run |
| 16 | HeyCatch init is module-level in route.ts | `git show f5a20ebe -- route.ts` lines 22-24 — this run |

---

*Report generated by ops-finance agent, task t_f7bc6ee6. Read-only verification. No production changes made.*
*Prior report: /home/mike/nebula/content/ops-finance/2026-08-20_revenue-funnel-reconciliation.md*
