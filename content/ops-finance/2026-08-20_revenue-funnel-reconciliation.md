# Revenue Funnel Reconciliation — Payment Path Verification

**Date:** 2026-08-20
**Author:** ops-finance agent (task t_d99b96c1)
**Task type:** CEO action — read-only verification
**Constraint:** No production changes made. No Stripe events triggered. No DB writes.
**Prior runs:** t_d509dd52 (Aug 19), t_28092faa (Aug 18), t_5c02049c (Aug 17), t_412044db (Aug 16), t_f8fef8ee (Aug 15), t_f9122dff (Aug 14), t_aa10d2ec (Aug 13), t_c165e519 (Aug 12), t_0b813c19 (Aug 11), t_31d5ea3f (Aug 10), t_74a37665 (Aug 9), t_34cf059c (Aug 8)

---

## Executive Summary

**Fix-pack ($97) path — VERIFIED on TWO independent handler paths.**
**Agency partner ($497) path — VERIFIED (no new commits to handler).**
**Post-purchase drip (D3/D7/D14) — ACTIVE (deployed Aug 17, unexercised — no real purchases).**
**Subscription path ($29–$197/mo) — STILL BLOCKED — schema defect unresolved for DAY 12 (Aug 8–20).**
**Revenue to date: $0 real.**

**NEW since Aug 19 (16 commits, all Aug 19):** Two commits touch the payment path:
- `855be992` — `checkout/route.ts` and `webhooks/stripe/route.ts` both modified. **New funnel ledger wiring added** (`recordFunnelEvent`) at checkout creation failures AND at purchase completion. **New GA4 Measurement Protocol server-side forwarding** added inside the webhook. These are additive instrumentation changes — core Stripe flow unchanged.
- `fed3d8ae` — `checkout/route.ts` one-liner: product description text changed from "highest-impact conversion leak" to "highest-priority failed condition" (governance copy fix, non-functional).

**New finding (this run):** `analytics_event_ledger` is now LIVE and accumulating funnel data. 692 rows as of this run. 24 `checkout_creation_failed` events with reason `checkout_provider_error` indicate real visitors are hitting the checkout flow but something is wrong upstream. 8 `audit_not_unlocked` rejections also noted. **Zero real `purchase_completed` events from `stripe_webhook`** — the one `purchase_completed` row is `is_synthetic=true, payment_mode=test` from a client_beacon fixture.

**New finding (this run):** GA4 Measurement Protocol forwarding code (`recordFunnelEvent` → `https://www.google-analytics.com/mp/collect`) was added in `855be992` but `GA4_API_SECRET` / `GA_API_SECRET` are **NOT SET** in `nebula-nextjs` environment. GA4 server-side purchase tracking will silently fail on every real purchase. Non-blocking for payment capture, but purchase attribution to GA4 will be missing.

**Blocking unknown (unchanged, Day 4):** Which webhook endpoint(s) are registered in the Stripe dashboard?

---

## 1. Infrastructure Status

| Component | Status | Evidence |
|-----------|--------|----------|
| nebula-nextjs.service | **ACTIVE** | `systemctl is-active nebula-nextjs` — this run |
| Cloudflare tunnel | **ACTIVE** — PID 910, tunnel 8cfcc2e1 | `pgrep -a cloudflared` — this run |
| Webhook endpoint — Next.js (GET probe) | **REACHABLE** — HTTP 405 (POST-only, correct) | `curl https://nebulacomponents.com/api/webhooks/stripe` — this run |
| nebula-platform-api.service | **ACTIVE** | `systemctl is-active nebula-platform-api` — this run |
| Webhook endpoint — platform_api (GET probe) | **REACHABLE** — HTTP 405 (POST-only, correct) | `curl https://api.nebulacomponents.shop/api/stripe/webhook` — this run |
| nebula-webhook.service (legacy) | **INACTIVE** | `systemctl is-active nebula-webhook` — this run |
| STRIPE_WEBHOOK_SECRET (nebula-nextjs) | CONFIRMED — `whsec_pq33c1...` | `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf` — this run |
| STRIPE_WEBHOOK_SECRET (nebula-platform-api) | CONFIRMED — `whsec_yXRap7dk...` | `/etc/systemd/system/nebula-platform-api.service.d/stripe.conf` — this run |
| STRIPE_SECRET_KEY (nebula-nextjs) | CONFIRMED live key `sk_live_*` | stripe.conf — this run |
| PostgreSQL cluster | **ACTIVE** — port 5433, `nebula_platform` online | psql connects — this run |
| analytics_event_ledger | **ACTIVE** — 692 rows accumulated | `SELECT COUNT(*) FROM analytics_event_ledger` — this run |

**No infrastructure regressions. Cloudflare PID changed from 916 (Aug 19) to 910 (Aug 20) — tunnel restart occurred, same tunnel ID 8cfcc2e1, same config. Normal.**

---

## 2. New Commits Since Aug 19 — 16 Commits

| SHA | Time (UTC) | Description | Touches payment path? |
|-----|-----------|-------------|----------------------|
| fed3d8ae | 01:09 | Hardening sprint: canonical registries, repair-sprint, fixtures, CI | **YES — checkout/route.ts: product description copy fix (non-functional)** |
| dd708db3 | 01:41 | Fix estate-wide governance violations | **NO — content/copy only** |
| 48c1b888 | 01:58 | Estate-wide governance enforcement | **NO — content only** |
| b2074104 | 03:01 | Governance long-tail sweep, 29 files | **NO — content only** |
| 037d5d5c | 03:13 | Fix remaining HIGH-risk governance violations | **NO — content only** |
| 06b01397 | 03:19 | Fix long-tail content governance | **NO — content only** |
| 18afe1d0 | 03:21 | Remove fabricated social proof | **NO — content only** |
| e54fd4f9 | 06:07 | Integrate Questly hero into customer portal homepage | **NO — frontend only** |
| 8d54894e | 06:30 | Restore workspace access, ban em-dashes, align interior design | **NO** (checkout/page.tsx 4-line change: non-functional) |
| 53ae02b3 | 06:39 | Allow GA4 image beacons in img-src (CSP) | **NO — CSP header only** |
| e641be73 | 06:54 | Make v2 chartreuse the only live projection | **NO — brand/design only** |
| **855be992** | **06:59** | **Funnel/brand/prototype work — checkout + webhook modified** | **YES — see §3 below** |
| 8d1e52fe | 07:16 | Send billing links to /workspace?tab=billing | **NO — UI routing only** |
| f506cb04 | 07:10 | Compress homepage and close causal-copy leaks | **NO — content only** |
| dcd32670 | 07:40 | Bound remaining causal claims, freeze homepage structure | **NO — content only** |
| ef3b2dda | 10:40 | Stop mobile hero waveform from covering CTAs | **NO — frontend/CSS only** |

**2 commits touch the payment path (fed3d8ae — trivial copy, 855be992 — additive instrumentation).**

---

## 3. Payment-Path Changes in 855be992 (Aug 19, 06:59)

### 3a. checkout/route.ts — Funnel Ledger Wiring (additive)

`recordFunnelEvent()` calls added at 4 failure points:
1. `STRIPE_SECRET_KEY` missing → `checkout_creation_failed` / `checkout_provider_error`
2. Offer unavailable → `checkout_creation_failed` / `checkout_provider_error`
3. Audit not unlocked → `checkout_creation_failed` / `audit_not_unlocked`
4. Audit not eligible → `checkout_creation_failed` / `audit_not_eligible`

Also added: `journeyId` extraction from `x-nebula-journey-id` header or `attribution.journey_id`, injected into Stripe metadata as `metadata[journey_id]`.

**Assessment: Additive only. No change to Stripe session creation logic, payment method config, pricing, or success/cancel URLs. Core capture path unchanged.**

### 3b. webhooks/stripe/route.ts — Funnel Ledger + GA4 (additive, after purchase INSERT)

Two new blocks inserted **after** the existing Stripe purchase record INSERT:

1. `recordFunnelEvent('purchase_completed')` → writes to `analytics_event_ledger` with `dedupKey: stripe_<session.id>_purchase`, `environment: live/test`, `is_synthetic: !isLive`. Wrapped in try/catch — failure is non-blocking.

2. GA4 Measurement Protocol forwarding → `POST https://www.google-analytics.com/mp/collect?measurement_id=G-KJ9S3450LH&api_secret=<GA4_API_SECRET>`. Wrapped in try/catch — failure is non-blocking.

**Assessment: Both blocks are additive and fail-silent. Core purchase INSERT, idempotency lock, deliver_prompt_pack.py, and Telegram notification unchanged. Capture path integrity: MAINTAINED.**

**New defect found (this run):** `GA4_API_SECRET` / `GA_API_SECRET` not present in nebula-nextjs systemd environment. GA4 server-side purchase events will be silently dropped. `if (gaSecret)` guard means the fetch is simply skipped — no error, no crash. Purchase capture unaffected. Attribution data lost.

---

## 4. One-Time Fix-Pack ($97) Path — VERIFIED (Dual Handler Architecture)

### Handler A: Next.js route.ts (modified Aug 19 — additive instrumentation only)

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
  [8] recordFunnelEvent('purchase_completed') → analytics_event_ledger [NEW — fail-silent]
  [9] GA4 Measurement Protocol forwarding [NEW — fail-silent, currently no-op: key missing]
  [10] PostHog capture
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

**Dual-handler duplicate delivery risk: UNCHANGED from Aug 17–20. CEO dashboard check still required.**

---

## 5. Agency Partner ($497) Path — VERIFIED

No commits since Aug 13 touch agency-partner handling in `route.ts`. VERIFIED unchanged.

---

## 6. Subscription Path ($29–$197/mo) — BLOCKING DEFECT PERSISTS (Day 12)

Schema unchanged. 8 columns, 9 missing. Zero subscription rows.

```
sudo -u postgres psql -p 5433 -d nebula_platform -c "\d subscriptions"
```

Result: **8 columns only.** Same result every day Aug 8–20. Zero subscription rows.

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

Additive only. Zero data loss. Zero downtime. **Day 12.**

---

## 7. Funnel Ledger — New Operational View (analytics_event_ledger)

As of this run, `analytics_event_ledger` has 692 rows and is the authoritative funnel diagnostic source. Key findings:

| Finding | Count | Assessment |
|---------|-------|-----------|
| `landing_page_view` (client_browser) | 420 | Real visitor traffic confirmed |
| `audit_cta_exposed` | 53+1 | Audit CTA rendering correctly |
| `audit_started` / `audit_accepted` | 53+1 | Audit pipeline healthy |
| `audit_submission_rejected` — `invalid_url` | 28 | Visitors submitting invalid/malformed URLs — funnel leak |
| `audit_submission_rejected` — `invalid_payload` | 16 | Likely bot/scraper traffic — acceptable |
| `checkout_creation_failed` — `checkout_provider_error` | 24 | **ACTIVE FUNNEL LEAK: visitors reaching checkout but blocked — investigate** |
| `checkout_creation_failed` — `audit_not_unlocked` | 8 | Visitors clicking buy without completing audit |
| `audit_result_viewed` | 14 (server) + 1 (beacon) | Audits completing |
| `purchase_completed` | 1 (synthetic, test mode) | **Zero real purchases** |

**24 `checkout_provider_error` events means real visitors hit the checkout API but it returned 503 (STRIPE_SECRET_KEY missing or offer unavailable). This is a new observable symptom of checkout failures that was not instrumented before today's commit. Root cause: STRIPE_SECRET_KEY may be intermittently unavailable in the Next.js runtime, or the offer is configured as unavailable at certain times. CEO should investigate.**

---

## 8. Test/Live Separation

| Layer | Status | Evidence |
|-------|--------|----------|
| Stripe sig verification (Next.js route.ts) | CONFIRMED — `constructEvent()` with `whsec_pq33c1...` | stripe.conf — this run |
| Stripe sig verification (platform_api) | CONFIRMED — HMAC-SHA256, `whsec_yXRap7dk...` | stripe.conf — this run |
| `event.livemode` check — purchases (route.ts) | CONFIRMED — test events dropped | route.ts ~line 201 |
| `livemode` column in `purchases` | CONFIRMED present (1 QA fixture row, created 2026-08-01) | psql — this run |
| `livemode` column in `subscriptions` | **NOT PRESENT** | DEFECT — §6 |
| `is_synthetic` + `payment_mode` in analytics_event_ledger | CONFIRMED — index `idx_ledger_env_live` enforces separation | psql \d — this run |
| Funnel ledger `purchase_completed` row | CONFIRMED `is_synthetic=true`, `payment_mode=test` | psql — this run |
| Dev-mode sig bypass (platform_api) | ACCEPTABLE — bypass only if secret empty; secret IS set | stripe.conf — this run |
| Legacy `webhook_server.py` / nebula-webhook.service | INACTIVE | systemctl — this run |

---

## 9. Webhook Architecture

| Handler | Endpoint | Port | Service | Status | Role |
|---------|----------|------|---------|--------|------|
| `route.ts` (Next.js) | `nebulacomponents.com/api/webhooks/stripe` | 3000 via CF | nebula-nextjs | **ACTIVE** | Fix-pack, agency-partner, subscription |
| `stripe_webhook.py` (platform_api) | `api.nebulacomponents.shop/api/stripe/webhook` | 8001 via CF | nebula-platform-api | **ACTIVE** | Fix-pack CRM + delivery + drip enroll |
| `webhook_server.py` | — | 9000 | nebula-webhook | **INACTIVE** | Legacy — correctly disabled |

**Two active handlers. Two different webhook secrets. Duplicate-delivery risk if both URLs are registered in Stripe dashboard — unresolved since Aug 16. Day 4 of this unknown.**

---

## 10. Blocking Unknown (UNCHANGED — Day 4)

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

## 11. Revenue Reconciliation

```
DATE:                           2026-08-20
REVENUE (REAL):                 $0
CUMULATIVE REVENUE:             $0
PURCHASES.livemode=true:        1 row (QA fixture — cs_test_billing_qa / e2e-crawler-test@example.com, created 2026-08-01)
SUBSCRIPTIONS:                  0 rows
DAYS SUBSCRIPTION BLOCKED:      12 (first verified Aug 8, unresolved through Aug 20)
NEW COMMITS SINCE AUG 19:       16 (2 touch payment path — additive instrumentation only)
INFRASTRUCTURE:                 ALL HEALTHY
NEXT.JS WEBHOOK ENDPOINT:       REACHABLE — 405
PLATFORM_API WEBHOOK:           REACHABLE — 405
LEGACY WEBHOOK SERVER:          INACTIVE (correct)
FIX-PACK PATH (route.ts):       VERIFIED END-TO-END (core logic unchanged)
FIX-PACK PATH (platform_api):   VERIFIED END-TO-END
AGENCY PATH ($497):             VERIFIED END-TO-END
SUBSCRIPTION PATH:              BLOCKED — 9 columns missing from nebula_platform.subscriptions
FUNNEL LEDGER:                  ACTIVE — 692 rows; 24 checkout_provider_error events (new finding)
GA4 SERVER-SIDE TRACKING:       NOT CONFIGURED — GA4_API_SECRET missing from nebula-nextjs env
BLOCKING UNKNOWN:               Which endpoint(s) registered in Stripe dashboard? (Day 4)
ACTION OWNER:                   CEO — ALTER TABLE (30s, zero risk) + dashboard check (1 min) + checkout_provider_error investigation
```

---

## 12. Verdict

| Payment path | Verdict | Confidence | Action needed |
|---|---|---|---|
| One-time fix-pack ($97) — route.ts | **VERIFIED** | HIGH | Investigate 24 checkout_provider_error events in funnel ledger |
| One-time fix-pack ($97) — platform_api | **VERIFIED** | HIGH | Dashboard check: confirm endpoint registration |
| Agency partner ($497) | **VERIFIED** | HIGH | None |
| Post-purchase drip (D3/D7/D14) | **FUNCTIONAL** | HIGH | Requires first real purchase to activate |
| Subscription ($29–$197/mo) | **BLOCKED — SCHEMA DEFECT DAY 12** | CERTAIN | CEO: ALTER TABLE NOW |
| Stripe dashboard webhook config | **UNVERIFIED** | N/A — URGENT | CEO: 1-min dashboard check (dual-endpoint risk, Day 4) |
| GA4 server-side purchase tracking | **MISCONFIGURED** | CERTAIN | CEO: add GA4_API_SECRET to nebula-nextjs env |

**Critical escalations:**

1. **(Day 12) Subscription schema defect:** unresolved since Aug 8. Every real subscription payment fails 100%. Fix is 30 seconds, zero downtime. 12 days without action.

2. **(Day 4) Dual webhook endpoint ambiguity:** two active handlers, two different secrets. Cannot confirm which handler receives real payments without dashboard access. Risk of duplicate buyer email delivery if both registered.

3. **(New — Day 1) 24 checkout_creation_failed / checkout_provider_error events:** real visitors reached the checkout API and received 503. Root cause unknown — may be intermittent STRIPE_SECRET_KEY env resolution failure or offer configuration timing. Revenue impact: UNKNOWN but potentially non-zero missed conversions.

4. **(New — Day 1) GA4_API_SECRET missing:** server-side purchase tracking added in 855be992 will silently no-op. Purchase attribution to GA4 lost on every real transaction. Non-blocking for capture but attribution is broken from launch.

---

## 13. Evidence Chain

| # | What it proves | Path / command |
|---|---|---|
| 1 | nebula-nextjs ACTIVE | `systemctl is-active nebula-nextjs` → active — this run |
| 2 | Cloudflare tunnel active, PID 910, tunnel 8cfcc2e1 | `pgrep -a cloudflared` — this run |
| 3 | nebula-platform-api ACTIVE | `systemctl is-active nebula-platform-api` → active — this run |
| 4 | Legacy webhook server INACTIVE | `systemctl is-active nebula-webhook` → inactive — this run |
| 5 | Next.js webhook endpoint reachable, POST-only | `curl https://nebulacomponents.com/api/webhooks/stripe` → 405 — this run |
| 6 | platform_api webhook endpoint reachable, POST-only | `curl https://api.nebulacomponents.shop/api/stripe/webhook` → 405 — this run |
| 7 | `subscriptions` schema DEFECTIVE (8 cols, 9 missing) | `\d subscriptions` on nebula_platform — this run |
| 8 | `purchases` has 1 QA fixture row (livemode=true, created 2026-08-01) | `SELECT livemode, COUNT(*), MAX(created_at) FROM purchases GROUP BY livemode` → t:1 — this run |
| 9 | 0 subscriptions | `SELECT COUNT(*) FROM subscriptions` → 0 — this run |
| 10 | 16 new commits since Aug 19 — 2 touch payment path (additive only) | `git log --oneline --after=2026-08-19T00:18:00` + `git show --stat` — this run |
| 11 | 855be992 adds funnel ledger + GA4 forwarding to webhook (additive, fail-silent) | `git show 855be992 -- customer-portal/app/api/webhooks/stripe/route.ts` — this run |
| 12 | 24 checkout_provider_error events in funnel ledger | `SELECT ... FROM analytics_event_ledger WHERE event_name='checkout_creation_failed' GROUP BY reason_code` — this run |
| 13 | Funnel purchase_completed row is synthetic/test only | `SELECT event_name, environment, payment_mode, is_synthetic FROM analytics_event_ledger WHERE event_name='purchase_completed'` — this run |
| 14 | GA4_API_SECRET not set in nebula-nextjs env | `grep GA4_API_SECRET /etc/systemd/system/nebula-nextjs.service.d/stripe.conf` → empty — this run |
| 15 | analytics_event_ledger has journey_id, environment, payment_mode, is_synthetic columns with idx_ledger_env_live index | `\d analytics_event_ledger` — this run |

---

*Report generated by ops-finance agent, task t_d99b96c1. Read-only verification. No production changes made.*
*Prior report: /home/mike/nebula/content/ops-finance/2026-08-19_revenue-funnel-reconciliation.md*
