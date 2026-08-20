# Nebula Revenue Architecture

**Date:** 2026-08-20
**Constraint:** Homepage structure frozen except mobile bugfixes and measurement. No new vendors. No acquisition scale until a purchase exists.

This is a state machine, not a marketing diagram.

---

## Current vs target

Current (live ledger):

```
VISITOR
  → landing_page_view
  → [hero CTA unmeasured until 2026-08-20]
  → /audit second submit
  → audit_accepted / audit_started
  → audit_result_viewed
  → repair_sprint rarely exposed
  → checkout_creation_failed (40 prod) | checkout_started (0 prod)
  → purchase (0)
```

Target (challenge to the brief's example: identity is later, not after results; enrichment is optional; sales assist is off):

```
TRAFFIC (trigger or organic)
  → SEGMENT LANDING (problem-aware page that IS the tool)
  → URL SUBMIT (one step, homepage or /audit)
  → AUDIT STARTED
  → AUDIT COMPLETED
  → RESULTS (failed conditions visible)
  → REPAIR SPRINT EXPOSED (leftover)
  → CHECKOUT STARTED
  → PURCHASE COMPLETED
  → FULFILLMENT
  → RE-AUDIT
  → RETAIN / EXPAND
```

Do **not** insert email capture between results and leftover conditions.

---

## States

| State | Entry | Exit | Owner | Event | Data | Customer value | Business value | Failure | Timeout | Retry | Measure | Next |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| visitor | page load | CTA visible 500ms | site | landing_page_view, audit_cta_exposed | path, device, utm | See the offer | Funnel denom | bounce | session | none | views, exposure | intent |
| intent | CTA click or URL typed | URL accepted | site | audit_cta_clicked, audit_url_submitted | url, cta_location | Start diagnosis | Intent rate | invalid URL | 5 min | client validate | click, submit, reject | accepted |
| accepted | public HTTP URL | worker start | api | audit_accepted, audit_started | attempt_id, domain | Queue | Intake | SSRF, quota | 30s | 429 message | start vs reject | running |
| running | worker | complete or fail | audit | audit_completed / audit_failed | audit_id | Wait with honest status | Completion rate | fetch fail | 90s | one retry | completed, failed | results |
| results | complete | leftover seen | results UI | audit_result_viewed, finding_expanded | findings | Know what failed | Activation | load fail | 10 min | reload | viewed vs completed | leftover |
| leftover | failed conditions remain | checkout click | results UI | repair_sprint_exposed, repair_sprint_clicked | leftover ids | See what is still broken | Monetization intent | none shown | session | none | expose, click | checkout |
| checkout | click buy | session created | payments | checkout_started / checkout_creation_failed | reason | Pay path | CPA denom | provider_error, not_unlocked | 30s | show error | fail reasons | paid |
| paid | Stripe live charge | fulfillment sent | webhook | purchase_completed | session, audit_id | Receipt | Revenue | dual-handler, missing GA4 secret | n/a | idempotent lock | purchases | fulfilled |
| fulfilled | pack delivered | D3 drip | ops | (delivery log) | email, audit_id | The fix | Retention start | no audit_id | 24h | drip script | delivery receipt | reaudit |
| reaudit | D30 or manual | delta recorded | audit | (re-audit events) | before/after | Proof | Expansion | none | 30d | one | delta | retain |
| retain | success or stuck | subscribe or stop | lifecycle | subscription_activated | plan | Ongoing | LTV | **subscriptions schema blocked** | n/a | CEO DDL | MRR | — |
| dead | bounce, reject, fail, no pay | — | — | failure_reason | reason | Honest stop | Diagnostics | — | — | — | reasons | — |

---

## Event model (preserve canonical names)

Do not rename. Add only if a state is dark.

Already defined (funnel-ledger / diagnostics):

VISITOR → CTA EXPOSED → CTA CLICKED → URL SUBMITTED → ACCEPTED → STARTED → FAILED/COMPLETED → RESULT VIEWED → FINDING EXPANDED → REPAIR EXPOSED → REPAIR CLICKED → CHECKOUT STARTED / CREATION FAILED → PAYMENT FAILED → PURCHASE COMPLETED

**Gaps found 2026-08-20:**

| Event | Production n | Gap |
|---|---:|---|
| audit_cta_clicked | 0 | Hero did not fire. **Patched.** |
| audit_url_submitted | 3 vs started 66 | Most starts skip AuditForm client event. Server records started only. |
| audit_completed | 3 vs result_viewed 16 | Completed under-fired or viewed includes revisits |
| checkout_started | 0 | 40 creation_failed instead |
| purchase_completed | 0 live | Correct (no sales) |

**Do not add** vanity section_view events (legacy GA4 founder_proof_view). Not a state transition.

**Do not add** new vendors for CDP.

---

## Funnel economics (production, 2026-08-20)

Never manufactured. N/A where denom or meaning is broken.

| Step | n / denom | Rate |
|---|---|---|
| Visitor → Audit start | 66 / 733 | 9.0% |
| Audit start → Completed event | 3 / 66 | 4.5% (event likely undercounted) |
| Completed event → Result view | 16 / 3 | N/A (views > completes) |
| Result view → Repair exposed | 2 / 16 | 12.5% |
| Repair → Checkout started | 0 / 2 | 0% |
| Checkout started → Purchase | 0 / 0 | N/A |
| Checkout failed | 40 | 30 provider_error, 10 audit_not_unlocked |
| Invalid URL rejects | 42 | leak + bots mixed |
| CAC, CPL, CPA, ARPU, MRR, ARR, LTV, payback | — | **N/A** ($0) |
| Conversion by source / ICP / offer | — | **N/A** (utm present on schema, not sliced this run) |

---

## Owners

| Layer | Owner |
|---|---|
| Measurement | platform (ledger) |
| Audit execution | platform_api + next start route |
| Checkout | next `/api/checkout` |
| Fulfillment | `deliver_prompt_pack.py` + drip |
| Acquisition | growth, after one sale |

Escalate to Mike: spend > $50, Stripe dashboard webhook list, subscriptions DDL (Day 12), legal.

---

## Failure paths that are currently the bottleneck

1. **Hero → /audit second submit.** Not measured as a drop until hero click is live.
2. **checkout_provider_error x30.** Visitors reached buy and got 503-class failure. P1.
3. **audit_not_unlocked x10.** Buy without unlock. Expected if outreach signed unlock is missing.
4. **Subscription schema.** Expansion blocked. P0 for LTV, not for first $97.
5. **GA4_API_SECRET unset.** Purchase attribution to GA4 will no-op. Non-blocking for capture.
