# Nebula experiment backlog

Updated 2026-08-11 after correcting the research-agent evidence rule.

## Evidence rule

An experiment is not successful because it produces replies, clicks, impressions, audits, checkouts, or positive opinions. Those are diagnostic signals only.

Primary success requires an attributable purchase. Every experiment below has a purchase attribution path, a sample or time window, and a stop rule.

## P0: Run now

### 1. D1 hook variants

- Hypothesis: a specific trigger-aware opening can produce more paid Fix Pack purchases than the current finding-first hook.
- Audience: founders with a public paid-traffic or zero-conversion trigger.
- Change: compare existing Variants A, B, and C. Keep offer, sender, audit URL, and pacing constant.
- Method: verified D1 emails, balanced cohorts, maximum 20 sends per variant.
- Primary metric: attributable $97 purchase linked to recipient email and hook variant.
- Diagnostic metrics: bounce, reply, audit start, checkout start.
- Stop rule: stop a variant at 20 sends with zero attributable purchases, or immediately for hard bounce or complaint signals.
- Current state: A has 9 total sends, B has 1, C has 1. No purchase. The existing active-sequence cap previously blocked the test. A one-time three-message override was started and requires receipt reconciliation.

### 2. Email gate versus no email gate

- Hypothesis: removing the email gate increases completed audits enough to produce more attributable $97 purchases than the gated flow.
- Audience: new audit visitors from the same qualified acquisition source.
- Change: route one cohort through the current email-gated flow and one through the existing no-email audit flow. Do not change audit content or price.
- Method: balanced traffic assignment, persistent cohort identifier, 14-day observation window.
- Primary metric: attributable purchases per audit visitor by cohort.
- Diagnostic metrics: audit completion, follow-up opt-in, checkout start.
- Stop rule: stop the challenger if it creates a purchase rate below the control after the minimum observation window, or if attribution cannot distinguish cohorts.
- Note: this was previously discussed as operationally risky, but it was not tested. It should not have been dismissed without a controlled cohort test.

### 3. Audit finding to Fix Pack transition

- Hypothesis: showing the concrete finding and dollar cost before presenting the $97 implementation offer produces more purchases than a generic audit completion CTA.
- Audience: completed audits with a qualifying conversion blocker.
- Change: one CTA presentation only. Keep price, refund terms, delivery, and checkout unchanged.
- Method: balanced results-page cohorts, 14 days or 50 completed audits per cohort, whichever comes first.
- Primary metric: attributable $97 purchase by cohort.
- Diagnostic metrics: CTA click, checkout start, purchase abandonment.
- Stop rule: revert the challenger if it produces zero purchases after the defined cohort threshold while control produces purchases, or if checkout errors occur.

## P1: Run after the current outbound batch is reconciled

### 4. Native zero-click content

- Hypothesis: a useful diagnostic finding delivered inside a founder community produces more attributable purchases than a post that primarily asks for an audit click.
- Audience: communities containing founders publicly reporting paid-ad waste or zero conversions. Reddit remains excluded.
- Change: publish one native diagnostic post with the audit link as a secondary action. No extra content volume.
- Method: one post in one approved channel, tracked URL and source identifier, 14-day window.
- Primary metric: attributable purchase linked to the post source.
- Diagnostic metrics: qualified replies, audit starts, checkout starts.
- Stop rule: no second post in the same channel after the window closes with zero purchases.
- Prior treatment: discussed as promising, never actually run.

### 5. Connector distribution

- Hypothesis: a useful audit artifact delivered to a highly relevant educator or community owner can produce attributable purchases through a referral path.
- Audience: 10 small, highly relevant Shopify, Meta Ads, or paid-traffic educators with audience-overlap evidence.
- Change: one tailored artifact and one message per connector. No repeated pitch.
- Method: unique referral identifiers, one contact per candidate, 30-day window.
- Primary metric: attributable purchase through connector identifier.
- Diagnostic metrics: view, reply, referral click, audit start.
- Stop rule: stop the connector batch if zero purchases occur after 10 candidates and the attribution path is verified.
- Prior treatment: John Portalios was contacted once and ignored. The broader 10-candidate experiment was never run.

### 6. Manual founder-assisted Fix Pack delivery

- Hypothesis: personally delivering the first few Fix Packs and documenting the exact buyer objection improves purchase conversion enough to justify later automation.
- Audience: warm prospects who complete an audit or reply with a concrete pain signal.
- Change: founder-assisted delivery only after a qualified prospect opts in. No new product feature.
- Method: 3 qualified prospects, individual attribution identifiers, 30-day window.
- Primary metric: attributable purchase.
- Diagnostic metrics: objection, time to decision, requested deliverable, implementation completion.
- Stop rule: stop after 3 qualified prospects with zero purchases and record the objection pattern.
- Prior treatment: “personally help 2 to 3 founders” was discussed but not run as a controlled commercial test.

## Not currently worth testing

These remain lower priority because they do not directly test the payment bottleneck:

- Venture funding and dilution content. It concerns financing, not customer acquisition or conversion.
- One-tab productivity dashboards. They may improve internal efficiency, but no direct purchase hypothesis exists yet.
- Generic research tooling. It can improve evidence quality, but it is not itself a Nebula revenue experiment.
- Copying unverified creator or website-business revenue claims. No attributable sales evidence exists. A comparable Nebula offer may be tested, but the external claim cannot be treated as proof.
- Artificial scarcity, countdown timers, and unsupported urgency. These introduce trust risk without a customer-backed reason to test them.

## Operating rule

A candidate moves from this backlog to execution only when the following are present:

1. One hypothesis.
2. One bounded change.
3. One audience or trigger.
4. A purchase attribution identifier.
5. A minimum sample or observation window.
6. A stop condition.
7. A reversible execution path.

A candidate is never removed because it lacks proof. It is either tested, blocked by a stated operational constraint, or stopped after the defined purchase observation window.
