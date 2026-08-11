# Revenue Funnel Reconciliation - Payment Path Verification

**Date:** 2026-08-05
**Author:** ops-finance agent (run 90, task t_f5256ec9)
**Scope:** Read-only end-to-end payment capture verification
**Constraint:** No payments created, no Stripe modifications, no production config changes
**Prior run:** t_998b9fd2 (2026-08-04) - findings updated where changed

---

## Executive Summary

A real Stripe payment sent to `https://buy.stripe.com` would be captured,
webhook-delivered to `https://nebulacomponents.com/api/webhooks/stripe`,
and persisted to the PostgreSQL `purchases` table (one-time) or `subscriptions`
table (membership plans). The code path is coherent and structurally sound.

**NEW SINCE YESTERDAY:** Two significant commits landed Aug 4:
1. `f4f330e1` - Membership plans (Pro/Growth/Agency) added with Stripe subscriptions.
   Webhook handler extended to handle `customer.subscription.created/updated/deleted`.
2. `23e74cb3` - Subscription welcome email wired in (fire-and-forget on new sub).

These expand the revenue surface. Two new DB tables (`subscriptions`, `monitored_pages`,
`monitoring_events`) have migration files but **migration execution is unverified.**

**One blocking unknown (unchanged core):** The Stripe dashboard webhook endpoint URL
and signing secret cannot be verified read-only. If the dashboard is still pointing
to `nebulacomponents.shop` and the new events (`customer.subscription.*`) are not
subscribed, subscription revenue events will be silently dropped.

**Second blocking unknown (new today):** The `subscriptions` table migration
(`20260804_add_subscriptions.sql`) has no confirmed-applied record. If it was not
run, any real subscription event will hit a 500 error in the webhook handler -
Stripe will retry up to 72 hours, then stop.

**Revenue to date: $0.** No new payments in payments.log. Revenue-cost ledger
last updated 2026-07-04 (32 days stale).

**Production health state: FAILING** - `production_health_state.json` shows
`status: failing`, `consecutive_failures: 23`. This is a new signal not present
in yesterday's report. The health-check system is failing repeatedly.

---

## Section 1: Request Path Evidence

### 1.1 Cloudflare Tunnel Routing

**Source:** `/home/mike/.cloudflared/config.yml` (last modified 2026-08-03, unchanged today)

| Hostname | Routes to |
|----------|-----------|
| `nebulacomponents.com` | `http://localhost:3000` (primary) |
| `nebulacomponents.shop` | `http://localhost:3000` (legacy, redirect to .com) |
| `api.nebulacomponents.shop` | `http://localhost:8001` |
| `mcp.nebulacomponents.com` | `http://localhost:8002` |
| `launchcrate.io` | `http://localhost:3001` |
| Catch-all | `http://localhost:3000` |

**Finding:** Both domains route to port 3000. No change from prior run.

### 1.2 Production Service Status

**Source:** `systemctl show nebula-nextjs.service` (verified 2026-08-05)

- `nebula-nextjs.service`: **active (running)**
- Active since: `2026-08-05 00:03:54 UTC` (restarted overnight, likely after the Aug 4 commits)
- PID: 1690049 (`next-server v1...`), port 3000
- DB connection: DATABASE_URL present in `customer-portal/.env.local` (credentials redacted, pattern confirmed)

**Finding:** Service healthy. Restart at 00:03 UTC today is consistent with a deploy after the
21:36 UTC commit yesterday.

### 1.3 Stripe Webhook Route - Updated

**Source:** `/home/mike/nebula/customer-portal/app/api/webhooks/stripe/route.ts`
(last modified 2026-08-04 21:36 UTC, 16,377 bytes - **grew from 12,453 bytes**)

The webhook handler now handles two revenue paths:

**Path A - One-time purchases (unchanged):**
1. Reads `Stripe-Signature` header
2. HMAC verification via `constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)`
3. On `checkout.session.completed`: livemode flag check → PostgreSQL `purchases` insert → `deliver_prompt_pack.py` → Telegram alert → PostHog event

**Path B - Subscription lifecycle (NEW, commit f4f330e1 + 23e74cb3):**
1. Handles `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
2. Resolves price ID via `planFromStripePrice()` against known price IDs in `stripe-subscription-ids.json`
3. Looks up customer email via Stripe API call
4. Inserts/upserts to `subscriptions` table
5. On live `created`: Telegram sale alert + `sendSubscriptionWelcome(email, plan)` email
6. On live `deleted`: Telegram cancellation alert
7. Livemode gating active on both alerts

**Finding:** Code path is complete. Test/live separation uses `event.livemode` flag
throughout - correct approach.

---

## Section 2: Test/Live Ledger Separation

### 2.1 Separation Logic

**Source:** `customer-portal/app/api/webhooks/stripe/route.ts`

- One-time purchases: `event.livemode` gates delivery and alerting
- Subscriptions: `event.livemode` gates Telegram alerts; all subscription events (test or live) write to `subscriptions` table with `livemode` column set from the event
- No string-matching on email addresses or session ID prefixes in the webhook handler

**Finding:** Separation is structurally correct for both paths.

### 2.2 payments.log Audit

**Source:** `/home/mike/nebula/payments.log` (7 lines, no change from prior run)

| Date | Email | Payment ID | Amount | Classification |
|------|-------|------------|--------|----------------|
| 2026-06-23 | test-buyer@example.com | cs_test_simulation | $7 | TEST |
| 2026-06-24 | pilot-test-buyer@example.com | cs_test_pilot_001 | $497 | TEST |
| 2026-07-03 | test@test.com | test_123 | $97 | TEST |
| 2026-07-03 | test-prod@test.com | test_prod_123 | $97 | TEST |
| 2026-07-03 | fix-test@example.com | cs_test_fix_001 | $97 | TEST |
| 2026-07-03 | restart-test@example.com | cs_test_restart_001 | $97 | TEST |
| 2026-07-05 | stripe@example.com | cs_test_a1L9C... | $30 | TEST |

**Finding:** No new entries since 2026-07-05. All 7 are test transactions.
Real one-time payments land in PostgreSQL `purchases` table (not this log).
Real subscription events land in `subscriptions` table.
Revenue = **$0 confirmed.**

### 2.3 Revenue-Cost Ledger

**Source:** `/home/mike/nebula/ledgers/revenue-cost-ledger.jsonl`

1 entry total. Last: `2026-07-04T23:04:35Z` - confirming $0 real revenue.
**32 days stale.** Does not reflect the new subscription product lines.

---

## Section 3: Database - Migration Status

### 3.1 Known migrations

| File | Date | Tables created |
|------|------|----------------|
| `20260803_add_purchase_livemode.sql` | 2026-08-03 | Adds `livemode` column to `purchases` |
| `20260804_add_subscriptions.sql` | 2026-08-04 16:26 | `subscriptions`, `client_workspaces` |
| `20260804_add_monitoring.sql` | 2026-08-04 20:31 | `monitored_pages`, `monitoring_events` |
| `20260804_add_widget_partners.sql` | 2026-08-04 21:36 | (unread) |

**Source:** `/home/mike/nebula/customer-portal/db/migrations/` (directory listing)

### 3.2 Migration execution status

**PostgreSQL on port 5433: confirmed listening.**
Direct DB query blocked - `psql` requires password; no socket auth from this agent.
No migration runner log file found. No `applied_migrations` record found.

**Critical gap:** The `subscriptions` table is now referenced by the live webhook handler.
If the migration was not applied before the service restarted at 00:03 UTC today,
any incoming subscription webhook will return HTTP 500 and Stripe will retry.
No evidence either confirms or denies that the migration was run.

### 3.3 purchases table (unchanged from prior runs)

**Source:** `/home/mike/nebula/customer-portal/db/schema_purchases.sql`

Schema correct. `stripe_session_id UNIQUE` constraint provides idempotency.
Table existence in the running DB cannot be confirmed without DB credentials.

---

## Section 4: Stripe Environment - Live Keys Confirmed

**Source:** `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf` (last modified 2026-08-01, unchanged)

- `STRIPE_SECRET_KEY`: `sk_liv...XDPR` (live key prefix confirmed)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: `pk_live_51TlN5H...` (live key confirmed)
- `STRIPE_WEBHOOK_SECRET`: `whsec_pq33c1getciaJRXbFDAVe9fHqyTNhgGS` (present, unchanged)

**Source:** `/home/mike/nebula/.stripe_links`

Active payment links - all `buy.stripe.com` (Stripe-hosted, live mode):

| Variable | URL |
|----------|-----|
| `NEBULA_LINK` | `https://buy.stripe.com/bJefZhd6s0wkgytew243S07` |
| `LAUNCHCRATE_97_LINK` | `https://buy.stripe.com/aFa7sL5E03Iwgyt2Nk43S02` |
| `LAUNCHCRATE_197_LINK` | `https://buy.stripe.com/14AcN58Qca6Ueql2Nk43S08` |
| `PROMPT_PACK_7_LINK` | `https://buy.stripe.com/8x2dR90jG1Aobe99bI43S0a` |

**Source:** `/home/mike/nebula/growth_system/stripe-subscription-ids.json`

Live Stripe product/price IDs for membership plans:

| Plan | Monthly Price ID | Annual Price ID |
|------|-----------------|-----------------|
| nebula-pro | `price_1U0l9AEINR1kU9chtiA64BKd` | `price_1U0l9BEINR1kU9chItjep7v9` |
| nebula-growth | `price_1U0l9BEINR1kU9chHMT77i8i` | `price_1U0l9BEINR1kU9chdxMOIkr6` |
| nebula-agency | `price_1U0l9CEINR1kU9chAZGBoJHS` | `price_1U0l9CEINR1kU9chITjlRF0H` |

**Finding:** All secrets are live-mode. Subscription product IDs registered.
The `buy.stripe.com` links for one-time products bypass Next.js checkout -
webhook fires to whatever URL is registered in the Stripe dashboard.
Subscription checkouts route through `/api/subscribe` (new endpoint).

---

## Section 5: New Signal - Production Health Failing

**Source:** `/home/mike/nebula/production_health_state.json`

```json
{
  "status": "failing",
  "last_alert_at": null,
  "consecutive_failures": 23
}
```

**Finding:** The production health monitor is reporting 23 consecutive failures.
`last_alert_at: null` means alerts were never sent (or the alerting channel is broken).
This is a NEW signal not in prior reports. The health check system defined in
`20260804_add_monitoring.sql` may be failing because the `monitored_pages`/`monitoring_events`
tables don't exist yet (migration not applied). Alternatively this could be a service
health check failing for other reasons.

**Risk:** If the health check itself is broken, silent failures in the payment
pipeline would not surface.

---

## Section 6: The Blocking Unknowns

### Unknown 1 (unchanged, HIGH): Stripe dashboard webhook configuration

Cannot confirm read-only:
1. Which URL is registered as the live-mode webhook endpoint (`.shop` or `.com`)
2. Whether `checkout.session.completed` is subscribed
3. **NEW:** Whether `customer.subscription.created/updated/deleted` are subscribed
4. Whether the signing secret on the dashboard endpoint matches `whsec_pq33c1...`

**If secret mismatches:** Every payment event returns HTTP 400. Stripe retries 72h then drops.
**If subscription events not subscribed:** Subscription revenue never hits the DB.

### Unknown 2 (NEW today, HIGH): Subscriptions migration not confirmed applied

The webhook handler writes to `subscriptions` table (commit f4f330e1, deployed ~00:03 UTC today).
No evidence migration `20260804_add_subscriptions.sql` was run before or after deploy.
If table is absent: any subscription event → 500 → Stripe retry loop.

---

## Section 7: Evidence Paths Summary

| Artifact | Path | What it proves |
|----------|------|----------------|
| Cloudflare tunnel config | `/home/mike/.cloudflared/config.yml` | Both .shop and .com → port 3000 |
| Active service | `systemctl show nebula-nextjs.service` | Next.js running (PID 1690049), healthy since 00:03 UTC |
| Webhook handler code | `customer-portal/app/api/webhooks/stripe/route.ts` | Full capture→DB→delivery flow; subscription lifecycle added |
| DB schema - purchases | `customer-portal/db/schema_purchases.sql` | purchases table defined with idempotency key |
| DB migration - subscriptions | `customer-portal/db/migrations/20260804_add_subscriptions.sql` | Schema defined; applied status UNKNOWN |
| DB migration - monitoring | `customer-portal/db/migrations/20260804_add_monitoring.sql` | Schema defined; applied status UNKNOWN |
| Stripe subscription IDs | `growth_system/stripe-subscription-ids.json` | Live product/price IDs for 3 membership plans |
| Systemd env | `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf` | Live keys injected into running service |
| payments.log | `/home/mike/nebula/payments.log` | 7 entries, all test transactions, $0 real |
| Revenue-cost ledger | `/home/mike/nebula/ledgers/revenue-cost-ledger.jsonl` | $0 real revenue confirmed as of 2026-07-04 |
| Stripe links | `/home/mike/nebula/.stripe_links` | Live-mode buy.stripe.com links active |
| Production health state | `/home/mike/nebula/production_health_state.json` | **FAILING - 23 consecutive failures** |

---

## Section 8: Open Risks

| Risk | Severity | Verifiable how |
|------|----------|----------------|
| Webhook secret mismatch (Stripe dashboard ≠ whsec_ in systemd) | **HIGH** | Stripe dashboard → Developers → Webhooks → check endpoint + secret |
| `customer.subscription.*` events not subscribed in Stripe dashboard | **HIGH** | Same dashboard → confirm event subscriptions |
| `subscriptions` migration not applied (table may not exist) | **HIGH** | `psql -p 5433 -c '\dt subscriptions'` from mike user or via DB credentials |
| `monitored_pages` migration not applied (health-check tables absent) | HIGH | Same psql check - may explain 23 consecutive health failures |
| Production health system showing 23 consecutive failures | HIGH | Investigate `sre_state.json` and health check implementation |
| purchases table may not exist in running DB | HIGH | Same psql verification |
| `buy.stripe.com` links bypass Next.js - `audit_id` metadata cannot be set | MEDIUM | One-time purchases → `fulfillment_status='review'`, not auto-delivered |
| Revenue-cost ledger 32 days stale; subscription product lines not reflected | MEDIUM | Add new product lines and any future revenue entries |
| Legacy Python webhook_server (port 9000) | LOW | Port 9000 not listening - inactive |

---

## Verdict

**Would a real one-time payment be captured?**
Structurally yes, if: (a) Stripe dashboard has the correct webhook URL, (b) signing secret matches,
(c) `purchases` table exists in the running DB. Same conditions as yesterday.

**Would a real subscription payment be captured?**
Structurally yes, if: (a) all conditions above, (b) `customer.subscription.created` is subscribed
in the Stripe dashboard, AND (c) `subscriptions` table exists (migration applied).
This is a new and currently unverified path.

**Revenue to date:** $0 real. Ledger 32 days stale.

**Action required (CEO):**

1. **Stripe dashboard** → `https://dashboard.stripe.com/webhooks`:
   - Confirm endpoint URL is `https://nebulacomponents.com/api/webhooks/stripe`
   - Confirm events subscribed include `checkout.session.completed` AND
     `customer.subscription.created`, `customer.subscription.updated`,
     `customer.subscription.deleted`
   - Confirm signing secret matches `whsec_pq33c1getciaJRXbFDAVe9fHqyTNhgGS`

2. **DB migrations** - run from mike user or via credentials:
   ```
   psql -p 5433 -d nebula_audit -f customer-portal/db/migrations/20260804_add_subscriptions.sql
   psql -p 5433 -d nebula_audit -f customer-portal/db/migrations/20260804_add_monitoring.sql
   psql -p 5433 -d nebula_audit -c '\dt' -- confirm tables exist
   ```

3. **Production health failures** - investigate `production_health_state.json`
   (23 consecutive failures, no alerts sent). This may be the monitoring tables missing.

4. **Revenue-cost ledger** - add subscription product lines (Pro/Growth/Agency at
   monthly/annual pricing) so any future revenue is captured with correct product attribution.
