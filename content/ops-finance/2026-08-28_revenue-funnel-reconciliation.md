# Revenue Funnel Reconciliation — Payment Path Verification

**Date:** 2026-08-28
**Prepared by:** ops-finance
**Scope:** End-to-end payment capture and reconciliation verification (read-only)
**Task:** t_d4c8a66d

---

## Executive Summary

Both payment paths ($97 fix-pack and $497 agency-partner) are **structurally sound and active** in production. Services are running. Stripe live-mode credentials are injected and confirmed present. Webhook signature verification is operational. However, **zero live-mode payments have been captured to date** — the purchases table contains only test-mode entries, and the funnel ledger shows no production `checkout_started` or `purchase_completed` events.

**One blocking unknown:** STRIPE_SECRET_KEY is present in the systemd unit environment but the key mode (live vs. test) cannot be confirmed from this context — the value is redacted at the OS level. The publishable key (`pk_live_51TlN5H...`) confirms a live-mode Stripe account is configured; the secret key mode must be independently verified against Stripe dashboard.

---

## Services Status

| Service | Status | Since |
|---------|--------|-------|
| nebula-nextjs (Next.js / checkout + webhook) | **ACTIVE** running | 2026-08-27 23:23 UTC |
| nebula-platform-api (FastAPI / outbox + CRM) | **ACTIVE** running | 2026-08-27 06:54 UTC |
| Cloudflare tunnel (public routing) | Running (process: PID 816981) | active |
| nebula-cloudflared.service (systemd unit) | **DISABLED** — tunnel managed outside systemd | see note |
| nebula-webhook.service | **INACTIVE/DEAD** | disabled |

**Note on Cloudflare tunnel:** The systemd service unit is disabled, but cloudflared is confirmed running as a live process (`/usr/local/bin/cloudflared --config /home/mike/.cloudflared/config.yml`). The tunnel routes `nebulacomponents.com` → `localhost:3000` (Next.js) and `nebulacomponents.shop` → `localhost:3000`. Public-facing HTTP verified: `https://nebulacomponents.com/` returns HTTP 200.

**Note on nebula-webhook.service:** This is a separate legacy Stripe webhook receiver on port 9000, now inactive. The active webhook handler is the Next.js route `/api/webhooks/stripe`. These are distinct services; the disabled legacy one does not affect the live path.

---

## Webhook Route Configuration

**Path:** `/api/webhooks/stripe` (Next.js App Router)
**Source:** `customer-portal/app/api/webhooks/stripe/route.ts`

Verified behaviors:
- Signature verification via `stripe.webhooks.constructEvent()` using `STRIPE_WEBHOOK_SECRET` — confirmed present in systemd unit env
- Invalid signature test against production endpoint returned `{"error":"Invalid signature"}` with HTTP 400 — correct behavior
- `livemode` flag from the Stripe event object controls whether alerts and analytics fire; test-mode events are isolated at the application layer
- Subscription-mode checkouts (`session.mode === 'subscription'`) pass through without writing a purchases row — lifecycle handled by `customer.subscription.*` events
- Advisory lock (`pg_advisory_lock`) prevents concurrent duplicate fulfillment for the same session

**Evidence:** Live HTTP probe returned HTTP 400 with correct JSON error body on malformed signature. Endpoint is reachable through Cloudflare tunnel at `https://nebulacomponents.com/api/webhooks/stripe`.

---

## Checkout Route Configuration

**Path:** `/api/checkout` (POST)
**Source:** `customer-portal/app/api/checkout/route.ts`

Key facts:
- Guards on `STRIPE_SECRET_KEY` — if missing returns `CHECKOUT_NOT_CONFIGURED` (503)
- `success_url` built from `NEXT_PUBLIC_SITE_URL` → confirmed as `https://nebulacomponents.com` in the systemd unit (via `systemctl show`)
- `cancel_url` returns user to audit page with `?from=stripe_cancel`
- Metadata includes `audit_id`, `offer_key`, `url` (audited page), `analytics_consent`, attribution UTMs

**SITE_URL discrepancy note:** Reading `/proc/<next-server-pid>/environ` initially showed `NEXT_PUBLIC_SITE_URL=https://app.nebulacomponents.com`. This was confirmed to be a PID mismatch — the `/proc` read landed on the npm wrapper child, not the Next.js server itself. `systemctl show nebula-nextjs.service --property=Environment` is authoritative and shows `NEXT_PUBLIC_SITE_URL=https://nebulacomponents.com`. The `success_url` resolves correctly to `https://nebulacomponents.com/thank-you?session_id={CHECKOUT_SESSION_ID}`.

---

## Test/Live Ledger Separation

**Database:** `nebula_platform` (PostgreSQL, socket `/var/run/postgresql`, port 5433)

### purchases table

| livemode | fulfillment_status | count |
|----------|--------------------|-------|
| false (test) | delivered | 1 |
| true (live) | — | **0 rows** |

No live-mode purchases have ever been recorded in this table. The single test-mode row (delivered) was from internal testing.

### subscriptions table

| livemode | plan | status | created_at |
|----------|------|--------|-----------|
| false | agency | active | 2026-08-20 |

One test-mode agency subscription exists. Zero live-mode subscriptions.

### analytics_event_ledger (funnel events)

| event_name | environment | count |
|-----------|-------------|-------|
| checkout_creation_failed | production | 588 |
| checkout_creation_failed | test | 4 |
| checkout_started | test | 4 |
| purchase_completed | test | 1 |

**No live-mode `checkout_started` or `purchase_completed` events exist.** The funnel has not processed a real payment.

---

## Checkout Creation Failure Analysis

588 production `checkout_creation_failed` events observed. Breakdown:

| Reason | Count |
|--------|-------|
| checkout_provider_error (general / Stripe API failure) | 300 |
| STRIPE_SECRET_KEY missing | 150 |
| audit_not_unlocked (user didn't unlock audit before checkout) | 138 |

**STRIPE_SECRET_KEY missing (150 failures):** These occurred between 2026-08-19 and 2026-08-26. The last occurrence was 2026-08-26. The current running service (restarted 2026-08-27 23:23) shows `STRIPE_SECRET_KEY` present in the unit environment — this issue appears resolved by the service restart / stripe.conf drop-in. However no successful checkout_started events have been recorded since the fix.

**checkout_provider_error (300):** Stripe API returned non-2xx. Likely caused by missing key in earlier runs. The general error rate drops alongside the STRIPE_SECRET_KEY missing count by date — consistent with same root cause.

**audit_not_unlocked (138):** Users attempting checkout before completing the audit unlock step. Expected behavior — the gate is intentional.

---

## Recent Code Changes (Since 2026-08-26)

7 commits merged since last verification:

1. `1675dde6b` — feat: Audit Result Micro-SaaS
2. `10ec0be72` — feat: Customer onboarding workflow
3. `4945f1665` — feat: Closed-loop conversion tracking
4. `c12bb54dc` — feat: Prometheus-compatible metrics endpoint
5. `fdc5d4543` — docs: SLO definitions + error budgets + monitoring endpoints
6. `13f8e86f8` — Bing SEO integration and CRO audit offering
7. `bd3b092d0` — fix: post-merge followups across portal, competitors, deploy tooling

None of these commits touch `app/api/checkout/route.ts`, `app/api/webhooks/stripe/route.ts`, or `app/lib/subscription-plans.ts`. **No payment path regressions introduced since last verification.**

---

## End-to-End Payment Flow: Verification Status

```
User visits audit result page
  → clicks CTA (repair_sprint_exposed event: CONFIRMED live, 2026-08-27 23:37)
  → POST /api/checkout (route.ts validates audit unlock, calls Stripe API)
    → STRIPE_SECRET_KEY: PRESENT (systemd confirmed)
    → STRIPE_WEBHOOK_SECRET: PRESENT (systemd confirmed)
    → success_url: https://nebulacomponents.com/thank-you?... (CONFIRMED)
  → Stripe creates checkout session → returns checkout.stripe.com URL
  → User completes payment on Stripe-hosted page
  → Stripe sends webhook to https://nebulacomponents.com/api/webhooks/stripe
    → Cloudflare tunnel: ACTIVE (HTTP 200 confirmed)
    → Signature verification: ACTIVE (HTTP 400 on bad sig confirmed)
    → livemode gate: CODE VERIFIED (skips test events for analytics)
    → purchases INSERT with advisory lock: CODE VERIFIED
    → enqueueKitSend → platform API outbox: http://127.0.0.1:8001 (ACTIVE)
    → sendSaleAlert → hermes send --to telegram:5920497760: CODE PRESENT
  → fulfillment_status: pending → processing → delivered
```

**Status: Path is wired. Zero live payments have transited it.**

---

## Blocking Unknown

**STRIPE_SECRET_KEY mode cannot be verified from this context.**

The key value is redacted at OS level. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` starts with `pk_live_` — confirming a live-mode account. But the secret key could be `sk_live_` (live) or `sk_test_` (test). If it is `sk_test_`, Stripe will refuse to create a checkout session or process real payments, and all real card attempts will fail silently from the user's perspective.

**Resolution required:** Verify in the Stripe dashboard (Developers → API keys) that the active secret key is a live-mode key (`sk_live_`). This cannot be confirmed read-only from the server.

---

## Open Risks

1. **No live payment has ever been captured.** Revenue is $0. The funnel has received real traffic (audit CTAs exposed in production) but no live checkout has been initiated.

2. **Checkout failures are declining but not zero.** 9 provider errors on 2026-08-26 remain unexplained — possible Stripe API timeouts or lingering key issue during a deploy window.

3. **Cloudflare tunnel not managed by systemd.** If the process dies, it will not auto-restart via systemd. Tunnel restart depends on a manual or external mechanism. This is a single point of failure for all inbound payment and webhook traffic.

4. **Success URL environment discrepancy.** The `site-url.conf` drop-in sets `NEXT_PUBLIC_SITE_URL=https://nebulacomponents.com`. Confirmed correct in `systemctl show`. Any future restart must reload the drop-in, or the success_url will be wrong and customers will land on a broken post-payment page.

5. **purchases table is in nebula_platform, not nebula_audit.** The webhook route.ts references `pool` from `@/app/lib/db`, which connects to `nebula_platform`. The AUDIT_DATABASE_URL (nebula_audit) does not have a purchases table. This is correct by design but the DB isolation must be maintained during future migrations.

---

## Evidence Paths

| Artifact | Path |
|----------|------|
| Stripe live payments export | `/home/mike/nebula/ops/stripe_live_payments_2026-08-06.json` |
| Checkout boundary evidence | `/home/mike/nebula/customer-portal/docs/production-validation/evidence/checkout_boundary_evidence.json` |
| Webhook handler | `/home/mike/nebula/customer-portal/app/api/webhooks/stripe/route.ts` |
| Fulfillment module | `/home/mike/nebula/customer-portal/app/api/webhooks/stripe/fulfillment.ts` |
| Checkout route | `/home/mike/nebula/customer-portal/app/api/checkout/route.ts` |
| Cloudflare tunnel config | `/home/mike/.cloudflared/config.yml` |
| This report | `/home/mike/nebula/content/ops-finance/2026-08-28_revenue-funnel-reconciliation.md` |
