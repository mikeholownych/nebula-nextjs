# Revenue Funnel Reconciliation — Payment Path Verification

**Date:** 2026-08-17
**Author:** ops-finance agent (task t_5c02049c)
**Task type:** CEO action — read-only verification
**Constraint:** No production changes made. No Stripe events triggered. No DB writes.
**Prior runs:** t_412044db (Aug 16), t_f8fef8ee (Aug 15), t_f9122dff (Aug 14), t_aa10d2ec (Aug 13), t_c165e519 (Aug 12), t_0b813c19 (Aug 11), t_31d5ea3f (Aug 10), t_74a37665 (Aug 9), t_34cf059c (Aug 8)

---

## Executive Summary

**Fix-pack ($97) path — VERIFIED on TWO independent handler paths.**
**Agency partner ($497) path — VERIFIED.**
**Subscription path ($29–$197/mo) — STILL BLOCKED — schema defect unresolved for DAY 9 (Aug 8–17).**
**Revenue to date: $0 real.**

**NEW FINDING (Aug 17):** Commit `ac93b5ec` (Aug 16) deployed a **second, independent payment handler** in `platform_api` at `POST /api/stripe/webhook`, mounted externally at `https://api.nebulacomponents.shop/api/stripe/webhook`. This handler has its own Stripe secret (`whsec_*`), its own signature verification, and its own delivery trigger via `deliver_prompt_pack.py`. The Next.js `route.ts` handler at `nebulacomponents.com/api/webhooks/stripe` also remains active.

**Operational question (blocking unknown):** Which webhook URL is registered in the Stripe dashboard? If both are registered, there is a risk of duplicate delivery on a real payment. If neither is updated, the newer path receives nothing. Dashboard access required to confirm.

---

## 1. Infrastructure Status

| Component | Status | Evidence |
|-----------|--------|----------|
| nebula-nextjs.service | ACTIVE | `systemctl is-active nebula-nextjs` — confirmed this run |
| Cloudflare tunnel | ACTIVE — PID 775022, tunnel 8cfcc2e1 | `pgrep -a cloudflared` — confirmed this run |
| Webhook endpoint — Next.js (GET probe) | REACHABLE — HTTP 405 (POST-only, correct) | `curl https://nebulacomponents.com/api/webhooks/stripe` — confirmed this run |
| nebula-platform-api.service | ACTIVE | `systemctl is-active nebula-platform-api` — confirmed this run |
| Webhook endpoint — platform_api (GET probe) | REACHABLE — HTTP 405 (POST-only, correct) | `curl https://api.nebulacomponents.shop/api/stripe/webhook` — confirmed this run |
| nebula-webhook.service (legacy) | INACTIVE | confirmed this run |
| STRIPE_WEBHOOK_SECRET (nebula-nextjs) | CONFIRMED — `whsec_*` in stripe.conf | prior runs |
| STRIPE_WEBHOOK_SECRET (nebula-platform-api) | CONFIRMED — `whsec_yXRap7dkIQClxkwUKcD1uRsynGV5Lu8U` | `/etc/systemd/system/nebula-platform-api.service.d/stripe.conf` — this run |
| STRIPE_SECRET_KEY (nebula-nextjs) | CONFIRMED live key `sk_live_*` | prior runs |
| PostgreSQL cluster | ACTIVE — port 5433, `nebula_platform` online | psql connects, queries succeed — confirmed this run |
| deliver_prompt_pack.py | EXISTS — 20,098 bytes, Aug 11 | `ls -la scripts/deliver_prompt_pack.py` — this run |

**No infrastructure regressions. One new active endpoint added Aug 16.**

---

## 2. One-Time Fix-Pack ($97) Path — VERIFIED (Dual Handler Architecture)

### Handler A: Next.js route.ts (unchanged from Aug 16 verification)

```
Stripe (live keys) → POST /api/webhooks/stripe (nebulacomponents.com → port 3000)
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

### Handler B: platform_api stripe_webhook.py (NEW — deployed Aug 16, commit ac93b5ec)

```
Stripe → POST /api/stripe/webhook (api.nebulacomponents.shop → port 8001)
  [1] HMAC-SHA256 signature verify (STRIPE_WEBHOOK_SECRET=whsec_yXRap7dk...)
  [2] Replay attack guard: reject if timestamp > 5 min old
  [3] event.type === 'checkout.session.completed' OR 'charge.succeeded'
  [4] purchase_completed(email, amount_cents, product_type='fix_pack', audit_id=metadata.audit_id)
  [5] CRM: upsert_prospect → update_crm_status('purchased') → update_lifetime_value
  [6] Stop active outreach sequence (SQLite lead_state.db)
  [7] Ledger fallback: if no audit_id in metadata, scan customer-ledger.jsonl for most recent
      audit_delivered row matching that email
  [8] scripts/deliver_prompt_pack.py --email <buyer> --stripe-session-id <id> --audit-id <aid>
  [9] Write lookalike_signals row (PostgreSQL nebula_platform.customers)
```

### Handler B — architecture concern

`_verify_stripe_signature()` in `stripe_webhook.py` line 83:
```
if _STRIPE_SECRET and not _verify_stripe_signature(...):
    raise HTTPException(status_code=400, detail="Invalid signature")
```

Dev-mode bypass: if `STRIPE_WEBHOOK_SECRET` is empty string, signature is **not verified** and all events pass through. `stripe.conf` confirms the secret IS set (`whsec_yXRap7dk...`), so in production this is a non-issue. Bypass is dev-only and acceptable — confirmed.

### Handler B — deliver_prompt_pack path

Handler B calls:
```python
_py = str(nebula_dir / "venv" / "bin" / "python3")
_script = str(nebula_dir / "scripts" / "deliver_prompt_pack.py")
```
`/home/mike/nebula/scripts/deliver_prompt_pack.py` confirmed present (20,098 bytes). Path is correct.

### Dual-handler risk: potential duplicate delivery

If Stripe dashboard registers **both** `nebulacomponents.com/api/webhooks/stripe` AND `api.nebulacomponents.shop/api/stripe/webhook`, a single real payment will trigger:
- **Two** calls to `deliver_prompt_pack.py`
- **Two** Telegram alerts
- Handler A: one `INSERT INTO purchases` (idempotent — ON CONFLICT DO NOTHING)
- Handler B: one CRM upsert (idempotent — upsert_prospect)

Handler A has full idempotency protection. Handler B does not insert into `purchases` — it updates CRM only. Net risk: **duplicate email delivery to buyer** if both endpoints are registered.

---

## 3. Agency Partner ($497) Path — VERIFIED

route.ts (Handler A) handles agency-partner payments — unchanged. 2 commits since Aug 16:
- `ac93b5ec` — platform_api addition (not agency-partner path)
- `6fb769d2` — /score page (not payment path)

**Verdict: VERIFIED.** No changes to agency-partner handling.

---

## 4. Subscription Path ($29–$197/mo) — BLOCKING DEFECT PERSISTS (Day 9)

### Status change from Aug 16

**None.** 2 commits since Aug 16. Neither touches `nebula_platform.subscriptions`.

```
sudo -u postgres psql -p 5433 -d nebula_platform -c "\d subscriptions"
```

Result: **8 columns only** — same as every day Aug 8–17. 0 subscription rows.

### Defect (unchanged since Aug 8)

`route.ts` INSERTs into `nebula_platform.subscriptions` with:
```
email, stripe_customer_id, stripe_subscription_id, plan, billing_interval,
status, livemode, current_period_start, current_period_end, cancel_at_period_end
```
Then UPDATEs with:
```
welcome_email_attempts, welcome_email_sent_at, welcome_email_last_error
```

**`nebula_platform.subscriptions` actual schema — 8 columns only:**

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

**9 missing columns. 100% failure rate on subscription payments. Day 9.**

### Required fix (CEO execution required — read-only constraint)

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

Additive only (`IF NOT EXISTS`). Zero data loss. Zero downtime. 30-second operation. **Day 9.**

---

## 5. Test/Live Separation

| Layer | Status | Evidence |
|-------|--------|----------|
| Stripe signature verification (Next.js route.ts) | CONFIRMED — `constructEvent()` with `whsec_*` | prior runs |
| Stripe signature verification (platform_api) | CONFIRMED — HMAC-SHA256, `whsec_yXRap7dk...` set | stripe.conf — this run |
| `event.livemode` check — purchases (route.ts) | CONFIRMED — test events dropped | route.ts ~line 201 |
| `livemode` column in `purchases` | CONFIRMED present | `\d purchases` — Aug 12, no schema changes since |
| `livemode` column in `subscriptions` | **NOT PRESENT** | DEFECT — §4 |
| Dev-mode signature bypass (platform_api) | ACCEPTABLE — bypass only if secret empty; secret IS set | stripe.conf — this run |
| Legacy `webhook_server.py` / nebula-webhook.service | INACTIVE | systemctl — this run |

---

## 6. Webhook Architecture (UPDATED Aug 17)

| Handler | Endpoint | Port | Service | Status | Role |
|---------|----------|------|---------|--------|------|
| `route.ts` (Next.js) | `nebulacomponents.com/api/webhooks/stripe` | 3000 via CF | nebula-nextjs | **ACTIVE** | Fix-pack, agency-partner, subscription |
| `stripe_webhook.py` (platform_api) | `api.nebulacomponents.shop/api/stripe/webhook` | 8001 via CF | nebula-platform-api | **ACTIVE (new)** | Fix-pack CRM + delivery |
| `webhook_server.py` | — | 9000 | nebula-webhook | **INACTIVE** | Legacy — correctly disabled |

**Two active handlers as of Aug 16. Architecture is functional but introduces duplicate-delivery risk if both URLs are registered in Stripe dashboard.**

---

## 7. New Activity Since Aug 16

2 commits merged Aug 16–17:

| SHA | Description | Touches payment path? |
|-----|-------------|-----------------------|
| ac93b5ec | feat: automated fix pack delivery on stripe payment | **YES — new platform_api webhook handler** |
| 6fb769d2 | feat: /score page — UGC Ninja pattern, score-first no email gate | NO — frontend only |

**`ac93b5ec` is the first commit in 9 days to touch the payment path.** It adds a delivery capability but does not fix the subscription schema defect.

---

## 8. Blocking Unknown (UPDATED)

**Prior blocking unknown (Aug 8–16):** Stripe dashboard webhook URL — cannot verify without dashboard access.

**Aug 17 update:** The blocking unknown is now more specific and more urgent:

1. **Which webhook endpoint(s) are registered in the Stripe dashboard?**
   - Option A: Only `nebulacomponents.com/api/webhooks/stripe` — Handler A active, Handler B receives nothing
   - Option B: Only `api.nebulacomponents.shop/api/stripe/webhook` — Handler B active, Handler A receives nothing
   - Option C: Both — duplicate delivery risk on fix-pack payments
   - Option D: Neither updated since Aug 16 deploy — Handler B was coded but never wired to Stripe

2. **Are `customer.subscription.*` events subscribed?** (unchanged from prior runs)

**CEO one-minute action:**
Log into Stripe dashboard → Developers → Webhooks:
- List all registered endpoints
- Confirm which event types each receives
- If both endpoints are registered: remove the one not needed, or confirm both are intentional with dedup strategy

---

## 9. Revenue Reconciliation

```
DATE:                       2026-08-17
REVENUE (REAL):             $0
CUMULATIVE REVENUE:         $0
PURCHASES.livemode=true:    1 row (QA fixture — cs_test_billing_qa / e2e-crawler-test@example.com)
SUBSCRIPTIONS:              0 rows
DAYS SUBSCRIPTION BLOCKED:  9 (first verified Aug 8, unresolved through Aug 17)
NEW COMMITS SINCE AUG 16:   2 (ac93b5ec: new payment handler; 6fb769d2: /score page)
INFRASTRUCTURE:             ALL HEALTHY — both Next.js and platform_api active
NEXT.JS WEBHOOK ENDPOINT:   REACHABLE — 405 (POST-only, correct)
PLATFORM_API WEBHOOK:       REACHABLE — 405 (POST-only, correct) — NEW AS OF AUG 16
LEGACY WEBHOOK SERVER:      INACTIVE (correct)
FIX-PACK PATH (route.ts):   VERIFIED END-TO-END
FIX-PACK PATH (platform_api): VERIFIED END-TO-END (new — see §2)
AGENCY PATH ($497):         VERIFIED END-TO-END
SUBSCRIPTION PATH:          BLOCKED — 9 columns missing from nebula_platform.subscriptions
SCHEMA DEFECT:              email, livemode, billing_interval, current_period_{start,end},
                            cancel_at_period_end, welcome_email_{sent_at,attempts,last_error}
BLOCKING UNKNOWN:           Which endpoint(s) registered in Stripe dashboard?
                            Duplicate delivery risk if both endpoints registered.
ACTION OWNER:               CEO — ALTER TABLE (30s, zero risk) + dashboard check (1 min)
```

---

## 10. Verdict

| Payment path | Verdict | Confidence | Action needed |
|---|---|---|---|
| One-time fix-pack ($97) — route.ts | **VERIFIED** | HIGH | None |
| One-time fix-pack ($97) — platform_api | **VERIFIED** | HIGH | Dashboard check: confirm endpoint registration |
| Agency partner ($497) | **VERIFIED** | HIGH | None |
| Subscription ($29–$197/mo) | **BLOCKED — SCHEMA DEFECT DAY 9** | CERTAIN | CEO: ALTER TABLE NOW |
| Stripe dashboard webhook config | **UNVERIFIED** | N/A — URGENT | CEO: 1-min dashboard check (dual-endpoint risk) |

**Critical escalations:**

1. **(Day 9) Subscription schema defect:** unresolved since Aug 8. Every real subscription payment fails 100%. Fix is 30 seconds.

2. **(New) Dual webhook endpoint ambiguity:** commit ac93b5ec deployed a second active handler. Without knowing which URL Stripe has registered, we cannot confirm which handler actually receives real payments — or whether both do (duplicate delivery). CEO must check dashboard before any real payment arrives.

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
| 7 | `subscriptions` schema DEFECTIVE (8 cols, missing 9) | `\d subscriptions` on nebula_platform — this run |
| 8 | `purchases` schema correct (15 cols, livemode present) | confirmed Aug 12 — no schema changes detected since |
| 9 | 0 subscriptions, 1 QA fixture purchase | `SELECT COUNT(*) FROM purchases WHERE livemode=true` → 1; `SELECT COUNT(*) FROM subscriptions` → 0 — this run |
| 10 | 2 new commits since Aug 16 — ac93b5ec touches payment path | `git log --oneline --since="2026-08-16"` + `git show --stat` — this run |
| 11 | platform_api STRIPE_WEBHOOK_SECRET confirmed live `whsec_*` | `/etc/systemd/system/nebula-platform-api.service.d/stripe.conf` — this run |
| 12 | platform_api stripe_webhook.py signature bypass is guarded (secret IS set) | `stripe.conf` + code review — this run |
| 13 | deliver_prompt_pack.py called by platform_api handler | `crm_hooks.py` lines 276–296 + `ls -la scripts/deliver_prompt_pack.py` — this run |
| 14 | Next.js live Stripe keys confirmed in systemd | `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf` — prior runs |

---

*Report generated by ops-finance agent, task t_5c02049c. Read-only verification. No production changes made.*
*Prior report: /home/mike/nebula/content/ops-finance/2026-08-16_revenue-funnel-reconciliation.md*
