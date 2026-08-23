# Billing and Entitlements Spine (Phase 2) Design

Date: 2026-08-23
Status: Approved design, pending implementation plan
Phase: 2 of 5 (billing + entitlements spine; first enforced entitlement: monitoring)
Supersedes: nothing. Builds on phase 1 (`2026-08-22-teardown-claims-design.md`).

## Problem and motivation

The paid tier cannot be sold today. Concretely:

1. No subscription-mode checkout exists anywhere; only the $97 payment-mode fix-pack flow.
2. The portal Stripe webhook inserts email-keyed rows into the org-shaped `subscriptions` table in `nebula_platform`; those inserts fail against the live schema, so subscription persistence is broken before a single subscription has been sold.
3. `POST /api/monitors` queries columns (`email`, `livemode`) that do not exist on any live table; monitor creation 500s for every non-founder identity.
4. Plan resolution is a founder hardcode plus an effectively empty org-subscription join.
5. Two monitor systems exist: a portal-side system (broken, zero rows) and the platform engine (working runner + regression alert emails, ungated).

Phase 2 delivers one org-keyed subscription spine with a single writer, one entitlement authority, subscription checkout plus customer portal, and monitoring as the first paid-only entitlement.

## Product packaging (locked 2026-08-23)

| Tier | Monthly | Annual | Audits | Monitored pages | Cadence |
| --- | --- | --- | --- | --- | --- |
| Free | - | - | 1/month | 0 | - |
| Pro | $29 | $290 | 20/month | 3 | monthly only |
| Growth | $79 | $790 | unlimited | 10 | weekly or monthly |
| Agency | $497 flat monthly | - | unlimited | unlimited | weekly or monthly |

Five Stripe prices total (Pro monthly+annual, Growth monthly+annual, Agency monthly). Annual equals two months free. Existing $97 fix pack, $497 agency-partner one-time, and $1,497 retainer offers are unchanged by this phase.

## Chosen architecture

Org-keyed spine, portal-owned money, one EntitlementService.

- The org-shaped `subscriptions` table in `nebula_platform` stays canonical.
- The portal webhook (SDK signature verification, npm stripe ^22.x pinned apiVersion) remains the ONLY writer of subscription state.
- The platform API owns a single `EntitlementService.resolve(email)` that every consumer of plan information uses.
- The organizations/memberships model becomes the real tenant structure now, which makes phase 4 team seats native rather than a migration.

Rejected alternatives: moving all money into FastAPI (rewrites a proven payment path mid-flight); repair-only without gating (does not deliver phase 2); email-keyed dual-write transitions (two truths).

## Data model and provisioning

Migration on `nebula_platform.subscriptions` (additive):

| New column | Type | Purpose |
| --- | --- | --- |
| billing_interval | text nullable | `monthly` or `annual`; null on legacy seed row |
| current_period_start | timestamptz nullable | lifecycle window start |
| current_period_end | timestamptz nullable | gates close after this when canceled/deleted |
| cancel_at_period_end | boolean default false | Stripe cancellation semantics |
| livemode | boolean default false | test vs live provenance |

Subscriber auto-provisioning inside the webhook writer, transactionally with the subscription upsert, reusing the signup provisioning pattern from `platform_api/auth/routes.py`: find-or-create User by lowercased email, find-or-create default Organization (slug derived deterministically from email), find-or-create owner Membership. Existing users are linked, never duplicated.

## Price mapping

Exactly two representations must agree, enforced by a shared fixture both test suites load:

1. Portal: `app/lib/subscription-plans.ts` gains `{priceId -> (plan, interval)}` alongside existing quota definitions.
2. Platform mirror of plan limits in Python for the EntitlementService.

Price IDs are public values and are committed. Bootstrap script emits them into this config. Unknown price IDs must never guess a plan (see failure modes).

## Stripe bootstrap

`scripts/stripe_bootstrap_billing.py` creates two Products and five Prices using a provided secret key (`STRIPE_TEST_SECRET_KEY` for rehearsal, live `.hermes` key at cutover). Idempotent: it looks up by lookup_keys before creating. Output writes price IDs into the mapping config.

## Checkout and customer portal

- `POST /api/subscribe {plan, interval}` (workspace session required): resolves email, finds or creates the Stripe customer, opens subscription-mode Checkout with mapped price, metadata carries workspace email. Success redirects `/workspace?upgraded=<plan>`; cancel returns to `/pricing`.
- `POST /api/billing-portal` (session required): creates a Stripe Customer Portal session with default configuration (cancel, plan switch, card update), return URL `/workspace`.
- No card data ever touches Nebula servers; all sensitive flows are hosted Stripe surfaces.

## Webhook consolidation

Portal webhook is the only subscription-state writer. Changes:

1. Replace the broken email-shaped INSERT with: provision-or-link organization per above, then upsert `subscriptions` keyed by unique `stripe_subscription_id` including all new lifecycle columns.
2. `customer.subscription.created|updated|deleted` drive state; `checkout.session.completed` with subscription mode only links customer-to-email if needed (the created event does the real work).
3. Platform `/stripe/webhook` stays CRM-projection-only. It must never write entitlements.
4. Idempotency: existing event dedup plus upsert-on-conflict make redeliveries no-ops; provisioning failures return non-2xx so Stripe retries.

## EntitlementService

`platform_api/services/entitlements.py`:

- `resolve(email) -> {plan, status, limits}` joining users -> memberships(active) -> organizations -> subscriptions where the row grants access: `status in {active, trialing}`, OR a canceled/deleted row whose `current_period_end` is still in the future (paid time is honored after cancellation). Canceled rows past their period end grant nothing. Canceled-but-paid time is honored via `current_period_end` (see failure modes).
- Limits single-source: free {audits 1/mo, monitors 0}, pro {20, 3, monthly cadence}, growth {unlimited, 10, any}, agency {unlimited, unlimited, any}.
- Consumers migrated: `/auth/me` drops its hardcoded founder set (founder seed row yields agency through the normal join); audit quota reads resolved plan instead of assuming free; monitor mutations gate here server-side.
- Failure rules: resolution errors degrade free-tier reads open (free experience never breaks); premium mutations require positive entitlement evidence (fail closed). A resolved status of past_due or canceled-past-period grants nothing premium.

## Monitor consolidation and gating

- Retire the empty portal path: remove `app/api/monitors/*` routes; leave `monitored_pages`/`monitoring_events` tables dormant untouched.
- Rewire `app/workspace/monitoringView.tsx` through new session-authenticated proxies onto platform `/audit/monitors` CRUD, workspace email injected server-side.
- Platform monitor mutations gain server-side gates: plan > free required (403 + upgradeUrl shape), atomic per-plan page caps (advisory-lock count-check-insert), cadence clamp per plan.
- The single pre-existing monitor (founder) rides through under the seed row's agency plan.
- Verify during build that `POST /audit/monitors/run-due` has a scheduler; if none exists, add a systemd timer in this phase. Paid monitoring without a heartbeat ships as theater otherwise.

## Failure modes

| Failure | Behavior |
| --- | --- |
| Unknown price ID in event | Write nothing; alert ops outbox; entitlement unchanged. Never guess a plan. |
| Webhook redelivery | Dedup + upsert = no-op. |
| Provisioning failure | Non-2xx so Stripe retries after transient cause clears. |
| Cancellation | `cancel_at_period_end` keeps entitlements until `current_period_end`; `deleted` also honors remaining paid time. Gates close at period lapse. |
| EntitlementService outage | Free reads degrade open; premium mutations fail closed. |
| Test vs live rows | `livemode` recorded; test events only ever touch test identities; no special-casing. |

## Verification plan

1. Unit: price-map parity fixture loaded by both TS and Python suites; entitlement resolution matrix across plans x statuses x period states; monitor gate rules (plan x cadence x cap) including the atomic-cap race path.
2. Integration: synthetic webhook sequences (created / updated / past_due / deleted / unknown-price) with double-delivery idempotency assertions.
3. E2E in Stripe test mode: bootstrap products -> subscribe with 4242 -> gates open -> fill monitor cap -> exceed rejected -> Customer Portal cancel -> entitlement persists to simulated period end -> closes.
4. Production DoD artifacts: migration applied; test-mode E2E evidence; deploy with live price IDs wired; `/pricing` renders three tiers; anonymous and free monitor creation rejected with upgrade CTA; founder agency intact across `/auth/me`, quota, monitors; logged-out audit flows unchanged; journals clean on both units.
5. Live-money validation: one real subscription purchase made by Mike (refunded afterward) or an explicit decision to skip; cutover checklist appended to aidlc-docs/audit.md.

Ship order within phase 2: migration, test-mode bootstrap, EntitlementService + consumers, checkout/portal routes, webhook rewrite, monitor rewire, retire dead routes, test-mode E2E, live cutover checklist.

## Out of scope (later phases)

Deeper diagnostics, funnel-wide analysis, competitor/peer benchmarking, prioritized remediation programs, collaboration/team seats, integrations beyond existing GA4/GSC, productized API keys, exports, higher-frequency/deeper audit quotas. Card-display list payload enrichment (phase 3 prerequisite).
