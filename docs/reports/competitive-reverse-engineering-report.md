# Competitive Reverse Engineering Report

**Date:** 2026-08-20
**Scope:** commercial systems, not screenshot contests
**Evidence:** public pages, DataForSEO SERP + Labs, G2 aggregates, live `analytics_event_ledger`
**Not done:** competitor email signups, auth bypass, paid-ad libraries, Stripe dashboard webhook list

---

## 1. Executive finding

Nebula already has the right commercial *shape* (no-login diagnosis, leftover failed conditions, public $97) and is **not using it as a measured system**.

The strongest competitors (LandingBoost, Cruelx, HubSpot Grader) turn a URL into a state machine. Nebula's homepage URL field **does not emit funnel events** and **does not start the audit**. The ledger showed 733 production page views, 66 audit starts, **0 production CTA clicks**, **0 checkout_started**, **40 checkout_creation_failed**, **0 purchases**.

The misunderstanding is not "we need Unbounce's builder" or "we need more AI." It is: **the free→paid remainder is dark, the first click is unmeasured, and the buy path is failing before Stripe.**

Until checkout creates a session, competitor-inspired acquisition is theater.

---

## 2. Competitive landscape

See `docs/research/competitor-landscape.md`.

**Direct:** LandingBoost, LandingScore, Cruelx, PageAudit (SERP #1, weak product), Fibr, Attention Insight.

**Adjacent:** Unbounce, VWO, Hotjar/Contentsquare, HubSpot Grader, Instapage.

**Best-in-class mechanisms:** Ahrefs/Grammarly leftover depth, Stripe proof, Wynter message tests (latter two not fully re-crawled).

Nebula is **not in the SERP** for `landing page audit` (DataForSEO 2026-08-20). PageAudit is. That is a P6 problem.

---

## 3. Competitor revenue systems

See `docs/research/competitive-revenue-system.md`.

Shared winning shape:

```
problem-aware traffic → URL → immediate diagnosis → unpaid remainder → money
```

Variants:

- LandingBoost: $9 DIY remainder
- Cruelx: $8.99 PDF remainder
- Grader: email remainder (REJECT)
- Unbounce: hosted-page subscription
- Fibr/VWO: demo then enterprise

Sales intervention: only at concierge/enterprise. Beachhead products are PLG.

Qualification: behavioral (scans) beats forms, except Cruelx's short context quiz.

---

## 4. Industry frontier

See `docs/research/industry-frontier.md`.

Composite: tool-as-page, no email, leftover sell, rescan proof, public price, no session cap, named proof only when real.

---

## 5. Nebula gap analysis

| | |
|---|---|
| AHEAD | No-login, leftover conditions, public $97, inspectable evidence, trigger outbound, no fake 40% lifts |
| COMPETITIVE | URL hero, teardowns, one-time SKU |
| BEHIND | SERP, one-step start, named outcomes, rescan loop, checkout reliability, repair-sprint exposure |
| BLIND | Competitor lifecycle email, Stripe webhook registration, offer-contract vs prompt-pack reality |

---

## 6. Differentiation

See `docs/strategy/nebula-differentiation-opportunities.md`.

Outperform by **removing steps and selling the leftover implementation**, not by adding GEO, MCP, PDFs, or heatmaps.

---

## 7. Highest-value changes

| Pri | Item | Class |
|---|---|---|
| P0 | Hero CTA in the ledger | PARITY measurement **shipped in source this session** |
| P0 | Explain audit_completed 3 vs result_viewed 16 | PARITY measurement |
| P1 | checkout_provider_error x30 | PARITY conversion |
| P1 | Extra /audit submit (freeze-blocked) | EXPERIMENT |
| P1 | repair_sprint_exposed 2/16 | DIFFERENTIATION |
| P2 | Interior leftover copy (homepage frozen) | — |
| P5 | Unfinished-audit nudge | EXPERIMENT |
| P6 | `/landing-page-audit` tool page | EXPERIMENT after a sale |

---

## 8. Experiments

See `docs/strategy/growth-experiment-backlog.md`.

Highest score: E3 checkout failure (21), E4 leftover exposure (19), E1 measurement (18, shipped source), E2 one-step hero (17, freeze).

E5 price-to-$9 = REJECT unless fulfillment is a prompt.

---

## 9. Rejected practices

See `docs/strategy/rejected-competitor-practices.md`.

Email-first, signup-first, fake lifts, PDF theater, session caps, demo-only price, $9 DIY copy, GEO dilution.

---

## 10. Implemented changes

| File | Behavior |
|---|---|
| `customer-portal/app/components/HeroSection.tsx` | `audit_cta_exposed` via VisibilityBeacon; `audit_cta_clicked` on submit. **No copy/layout change.** |

Not deployed in this session. Parallel dirty worktree on outreach/checkout scripts was not touched.

**Not implemented (blocked or higher-risk):** one-step hero start (homepage freeze), checkout_provider_error (needs live Stripe repro; adjacent files dirty), subscriptions DDL (CEO), GA4_API_SECRET (env).

---

## 11. Measurement

Authoritative: `analytics_event_ledger` production rows.

After deploy of hero tracking, success is:

- `audit_cta_exposed` with `cta_location=homepage_hero`
- `audit_cta_clicked` > 0
- ratio clicked / exposed
- then `audit_url_submitted` on `/audit` (diagnoses the extra step)

Purchase remains the only validation. All rates above are diagnostic.

Live baseline 2026-08-20 (production): views 733, starts 66 (9.0%), purchases 0. CAC/LTV **N/A**.

---

## 12. Unknowns

- Competitor email sequences (no test accounts)
- Paid ad creative (not scraped)
- Whether checkout_provider_error is missing key, offer flag, or Stripe 503
- Which Stripe webhooks are registered
- Whether $97 fulfillment is DFY repair or a prompt pack (must match checkout)
- LandingBoost/Cruelx actual conversion rates (not public)
- DataForSEO etv for LandingBoost/Cruelx (not queried)

---

## Proof boundary

**Proves:** public competitor mechanisms, SERP occupancy, Nebula ledger counts, hero was uninstrumented.

**Does not prove:** that copying LandingBoost would sell; that SEO pages will produce purchases; that 9.0% start rate is "good"; that checkout failures are all real buyers (bots mixed with invalid_url 42).
