# Growth Experiment Backlog

**Date:** 2026-08-20
**Success metric for all viability tests:** attributable purchase. Clicks/audits diagnose only.
**States:** untested | running | sale_signal | no_purchases | reject

Priority =
(Revenue + Conversion + Differentiation + Customer Value + Evidence + Leverage)
- (Cost + Risk)
each 0-5.

Homepage freeze: no hero copy/layout tests.

---

## E1 — Measure homepage CTA (SHIPPED measurement)

**OBSERVATION:** Production `audit_cta_clicked` = 0 with 733 views and a URL hero.
**COMPETITOR EVIDENCE:** LandingBoost counts the homepage scan as the product.
**NEBULA CURRENT:** Hero routed to `/audit?url=` with no ledger events.
**HYPOTHESIS:** Instrumenting exposure+click will show a drop between hero submit and `/audit` submit.
**USER CHANGE:** None visible.
**BUSINESS EFFECT:** Makes E2 decision possible.
**PRIMARY:** production `audit_cta_clicked` > 0 after deploy
**GUARDRAIL:** no change in audit_started rate beyond noise
**COST:** 1 (instrumentation)
**DEPENDENCY:** deploy customer-portal
**RISK:** 1
**CONFIDENCE:** 5 (defect was observed)
**TEST:** ship, watch 48h ledger
**SUCCESS:** events appear with `cta_location=homepage_hero`
**ROLLBACK:** revert HeroSection tracking
**SCORE:** (2+5+0+3+5+5)-(1+1) = 18
**CLASS:** PARITY (measurement)
**STATUS:** implemented locally 2026-08-20, not deployed in this session until commit

---

## E2 — One-step audit from hero

**OBSERVATION:** Hero does not call `/api/audit/start`; second form on `/audit`.
**COMPETITOR EVIDENCE:** LandingBoost, LandingScore, Cruelx start from the first URL field.
**NEBULA CURRENT:** Extra step. Spend/reason fields live on `/audit`.
**HYPOTHESIS:** Starting the audit from hero increases start rate and does not reduce result quality.
**USER CHANGE:** Skip `/audit` form.
**BUSINESS EFFECT:** Higher start→complete. Still not a sale.
**PRIMARY:** audit_started / hero_clicks
**GUARDRAIL:** audit_failed rate, invalid_url rate
**COST:** 3 (homepage behavior; freeze)
**DEPENDENCY:** Mike lift freeze or allow behavior-only change
**RISK:** 3 (loses spend/reason; freeze)
**CONFIDENCE:** 4
**TEST:** 50 hero starts vs 50 /audit starts, 7 days
**SUCCESS:** start rate lift with failed-condition quality unchanged
**ROLLBACK:** restore router.push
**SCORE:** (3+5+3+4+4+4)-(3+3) = 17
**CLASS:** EXPERIMENT (blocked by homepage freeze)
**STATUS:** untested

---

## E3 — Root-cause checkout_provider_error

**OBSERVATION:** 30 production `checkout_creation_failed` reason `checkout_provider_error`; 0 `checkout_started`.
**COMPETITOR EVIDENCE:** N/A (our pipe)
**NEBULA CURRENT:** Buy path dying before Stripe session.
**HYPOTHESIS:** Fixing the 503-class failure is required before any monetization test is valid.
**USER CHANGE:** Checkout loads.
**BUSINESS EFFECT:** Enables first purchase.
**PRIMARY:** checkout_started > 0 and provider_error → 0 on live offers
**GUARDRAIL:** no test-mode charges
**COST:** 2
**DEPENDENCY:** stripe.conf, offer registry
**RISK:** 2
**CONFIDENCE:** 5
**TEST:** reproduce one live checkout create, read failure_reason
**SUCCESS:** a live session URL returned
**ROLLBACK:** none (bugfix)
**SCORE:** (5+5+0+5+5+5)-(2+2) = 21
**CLASS:** PARITY
**STATUS:** untested (not implemented this session; dirty worktree on adjacent payment files)

---

## E4 — Repair sprint always exposed when leftovers exist

**OBSERVATION:** `repair_sprint_exposed` = 2 vs `audit_result_viewed` = 16.
**COMPETITOR EVIDENCE:** LandingBoost paywall is on the scan receipt.
**NEBULA CURRENT:** Leftover sell may not render.
**HYPOTHESIS:** If leftovers always render with $97 CTA, checkout attempts rise.
**USER CHANGE:** See the unpaid remainder on results.
**BUSINESS EFFECT:** Diagnostic: more checkout_started (not yet sales)
**PRIMARY:** repair_sprint_exposed / result_viewed
**GUARDRAIL:** no fake urgency
**COST:** 2
**DEPENDENCY:** ResultsClient
**RISK:** 2
**CONFIDENCE:** 3
**TEST:** 20 completed audits, leftover present ⇒ exposed
**SUCCESS:** expose rate ≥ 80% when failed conditions > 0
**ROLLBACK:** previous render gate
**SCORE:** (4+4+4+4+3+4)-(2+2) = 19
**CLASS:** DIFFERENTIATION
**STATUS:** untested

---

## E5 — Do not drop price to $9

**OBSERVATION:** LandingBoost $9 First Edit.
**HYPOTHESIS (negative):** Matching $9 without DFY fulfillment trains DIY buyers and does not produce $97 economics.
**CLASS:** REJECT as a default. Only test if fulfillment is a prompt (then $97 is the lie).
**STATUS:** reject unless offer-contract says prompt-only

---

## E6 — Problem-aware SEO page that is the scanner

**OBSERVATION:** PageAudit ranks #1 for `landing page audit`. LandingBoost ranks via tool URLs.
**HYPOTHESIS:** A `/landing-page-audit` page that embeds the same form, no email gate, can enter the AI Overview citation set.
**PRIMARY:** organic sessions to that URL, then purchases with utm
**GUARDRAIL:** no fabricated 40% claims
**COST:** 3
**RISK:** 2
**CONFIDENCE:** 3
**SCORE:** (3+2+3+3+4+4)-(3+2) = 14
**CLASS:** EXPERIMENT
**STATUS:** untested. **Do not run as acquisition scale until E3 produces checkout_started.** P6.

---

## E7 — Named proof after first sale only

No experiment until a purchase. Then ask for a named leftover → fix story. Never manufacture.

**CLASS:** DIFFERENTIATION
**STATUS:** blocked on revenue

---

## Kill rule

Any experiment with max sample reached and 0 purchases = `no_purchases`. Do not promote on replies or audits.
