# Payment Capture Verification — CEO Synthesis Report

**Date:** 2026-08-08
**Author:** ops-finance agent (task t_34cf059c)
**Sources:** t_48000540 (webhook route inspection), t_c4e5953c (ledger separation audit),
t_a9849c02 (Aug 8 daily verification), t_522efacc (Aug 7 verification)
**Constraint:** Read-only throughout. No production changes made.

---

## Verdict: Live Capture Path

**One-time fix-pack ($97): INTACT.**
**Subscription revenue (Pro/Growth/Agency): STRUCTURALLY INTACT — one external config unverified.**

A real payment hitting `buy.stripe.com` will flow:

```
Stripe → HTTPS POST → nebulacomponents.com/api/webhooks/stripe
       → signature verified (whsec_pq33c1… confirmed in both env files)
       → event handler fires (route.ts, 526 lines, no auth gap)
       → INSERT to nebula_platform.purchases or .subscriptions
       → fulfillment (email + Telegram alert)
```

All DB migrations confirmed applied as of Aug 8. Infrastructure (Next.js service,
Cloudflare tunnel) passing health checks. Zero code changes to payment path since Aug 5.

---

## Evidence Paths (ordered by capture sequence)

| # | What it proves | File / command |
|---|---|---|
| 1 | Stripe live keys confirmed in production | `/home/mike/nebula/.env` — `sk_live_…` + `whsec_pq33c1…` |
| 2 | Webhook route registered and reachable | `customer-portal/app/api/webhooks/stripe/route.ts` — POST handler, 405 on GET confirmed |
| 3 | Cloudflare routes both domains to port 3000 | `/home/mike/.cloudflared/config.yml` |
| 4 | Next.js service active | `systemctl show nebula-nextjs.service` — PID 3496796, running since 2026-08-07 01:19 UTC |
| 5 | Webhook URL resolves live | `curl https://nebulacomponents.com/api/webhooks/stripe` → HTTP 405 |
| 6 | purchases schema correct (livemode col) | `psql nebula_platform` — `\d purchases` confirms `livemode` column |
| 7 | subscriptions schema correct (webhook-compatible) | `psql nebula_platform` — `\d subscriptions` confirms `email`, `billing_interval`, `livemode`, `current_period_start/end` |
| 8 | Four migrations all applied | psql direct reads on `nebula_platform` and `nebula_audit` |
| 9 | Livemode filtering implemented in code | route.ts checks `event.livemode` before writing — test events do not pollute live tables |
| 10 | Zero real payments to date | `SELECT COUNT(*) FROM purchases WHERE livemode=true` → 0 real rows (1 QA fixture: `cs_test_billing_qa`, `e2e-crawler-test@example.com`) |
| 11 | Zero subscriptions to date | `SELECT COUNT(*) FROM subscriptions` on `nebula_platform` → 0 |
| 12 | No payment-path code changes since Aug 5 | `git log --oneline --since=2026-08-05` — Aug 6/7 commits: brand rename + collateral only |

---

## Livemode Filtering — Ledger Separation Status

The webhook handler in `route.ts` reads `event.livemode` from the Stripe event payload.
Test-mode events (livemode=false) do not write to `nebula_platform.purchases` or
`nebula_platform.subscriptions`. The `purchases` table has a `livemode` column
(migration `20260803_add_purchase_livemode.sql`, confirmed applied) to support
post-hoc filtering even if a test row slips through.

**Known anomaly:** One row in `purchases` has `livemode=true` by database flag but
belongs to `cs_test_billing_qa` / `e2e-crawler-test@example.com`. This is a QA
fixture row, not a real customer. It does not represent revenue. It should be flagged
for cleanup but does not affect live payment capture.

**Audit DB (`nebula_audit.purchases`):** No rows. Separate from the live DB.
The handler writes to `nebula_platform`; `nebula_audit` is an audit-pipeline mirror.
No cross-contamination.

---

## One Blocking Unknown

**Stripe dashboard webhook configuration — cannot verify read-only from this machine.**

Specifically:

1. **Endpoint URL** — Dashboard must point to `https://nebulacomponents.com/api/webhooks/stripe`.
   If an old `nebulacomponents.shop` endpoint was registered and never updated, Stripe
   may send to `.shop`. Both domains route to port 3000 via Cloudflare tunnel, so delivery
   would still succeed — but this is unverified. LOW risk for fix-pack (`.shop` still works);
   MEDIUM risk for subscriptions (if the `.shop` endpoint predates the subscription events).

2. **Subscribed events** — Dashboard must include `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`. These events
   were added to the handler in the Aug 4 commits. Registering them in the Stripe
   dashboard is a human-action step. If not done, subscription revenue events are
   silently dropped at Stripe before they reach the handler.

**Impact:** Fix-pack one-time purchases are almost certainly fine (original webhook
registration predates these changes). Subscription revenue is the at-risk path —
if the dashboard events are not updated, no subscription purchase will ever be
recorded, regardless of how correct the code is.

**Resolution — CEO action required:**
Log into Stripe dashboard → Developers → Webhooks.
Confirm: (a) endpoint URL ends in `.com`, (b) all three `customer.subscription.*`
events are subscribed.
This is a one-minute check. It cannot be automated or delegated to the agent.

---

## Operating Snapshot

```
DATE: 2026-08-08
REVENUE: $0 (cumulative: $0)
LIVEMODE PURCHASES: 0 real
LIVEMODE SUBSCRIPTIONS: 0
QA FIXTURE IN PURCHASES: 1 row (cs_test_billing_qa — not revenue)
PRODUCTION HEALTH: PASS (payment path)
OUTREACH PIPELINE: FAIL (unrelated — AgentMail/SMTP credential failures)
BLOCKING UNKNOWN: Stripe dashboard — subscription event subscriptions unconfirmed
MISSING EVIDENCE: Stripe dashboard screenshot or API export
```

---

*Report generated by ops-finance agent, task t_34cf059c.*
*Read-only verification. No production changes made.*
*Primary sources: t_a9849c02 (Aug 8), t_522efacc (Aug 7), t_6548869b (Stripe live payment extract).*
