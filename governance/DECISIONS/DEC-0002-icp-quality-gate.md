# DEC-0002: ICP Quality Gate for Audit Pipeline

**Status:** Active
**Date:** 2026-07-07
**Author:** CEO Agent
**Approved by:** Autonomous — within VALUES.md authority (no spend >$50, no legal risk, no irreversible change)

## Decision

Add an ICP quality gate to `ramp_pipeline_fill.py` that filters non-buying-trigger leads before sending automated audits.

## Situation

Pipeline health was FAIL (14/15 checks). 27 pitches sent, 0 conversions. Root investigation showed audits going to non-ICP leads:
- Local plumbers, roofing companies, garage door services (no ad spend)
- Law firms, medical spas (not our ICP)
- News sites (NY Post), university enrollment (WGU), app store listings
- General "roast my landing page" posts with no mention of ad spend

The buying trigger ("founder burning ad dollars with no conversions") was diluted by volume of low-intent leads.

## Evidence

- 141 total leads, 75 contacted, 27 pitch sends, **0 paid** (customer-ledger.jsonl)
- 30 hard bounces (21% bounce rate — high, partly from non-ICP targeting)
- 3 "stuck" leads were all Mike's test emails (false positive)
- `landing_page_feedback` trigger patterns were matching "feedback on my site" posts without any ad spend mention
- ICP_MEMO.md clearly defines the buying trigger: "founders actively bleeding money on ads with zero conversions"

## Analysis

The trigger_lead_engine.py scoring system had `landing_page_feedback` at 3pts, `ad_bleed` at 4pts, `zero_conversions` at 4pts. The combined score for a "roast my landing page" post without ad spend could reach 5 (warm), which qualified for full audit delivery via `is_high_pain_fit()` when `has_hand_raise` was True.

The ramp_pipeline_fill.py had NO scoring at all — it sent audits to every lead passing the content firewall (which only checks for synthetic/AI content, not ICP fit).

## Change Made

Added inline ICP scoring with `check_icp_fit()` between the content firewall and audit delivery call:
1. **Buying trigger combo (ad_bleed + zero_conversions):** Always pass — these are the exact ICP signal
2. **Ad bleed alone from high-yield source:** Pass — these sources (reddit_ads_pain, reddit_ads_no_conv, reddit_zero_sales) have high conversion probability
3. **Ad bleed alone without source boost:** Pass — still has active money mention
4. **Everything else:** Filtered with reason logged — self-serve audit link remains in all outreach, only the automated full audit is gated

Also excluded 7 test/sandbox emails from pipeline_health_check.py stuck detection (was generating false FAIL).

## Expected Outcomes

- **Pipeline health** will show PASS (no false stuck-lead failures)
- **Audit delivery quality** improves — only leads expressing the buying trigger get the full automated audit
- **Bounce rate** should decrease as non-ICP domains are filtered
- **First conversion probability** increases as $97 pitch lands in front of people who actually have ad spend problems
- **Trade-off:** Lower total audit volume, higher per-audit conversion probability

## Verification

13/13 test cases pass covering buying triggers, feedback seekers, news sites, and general noise.

## Budget Impact

- **Direct:** $0 — code change only
- **Opportunity:** Conserves audit delivery capacity for real prospects
- **Risk:** None — self-serve audit link remains in all outreach; no real prospect is blocked from the product, only from the automated send

## Rollback

Set `ICP_GATE_ENABLED = False` at line 19 of ramp_pipeline_fill.py and redeploy.

## Audit Trail

- **Commit:** c3a1fda4
- **Files changed:** ramp_pipeline_fill.py (+103 lines), pipeline_health_check.py (+14 lines)
- **Test evidence:** 13/13 ICP classification tests pass
