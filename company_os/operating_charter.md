# Nebula Components Operating Charter

Updated 2026-08-11 from the reviewed startup OS and EOS references.

## Core Focus

Help founders identify and fix landing-page leaks that waste paid traffic, without hiring a consultant.

## Current Mission

Convert a verified paid-traffic pain signal into a useful diagnosis, a clear implementation offer, and an attributable purchase.

## Current 90-Day Rock

Produce and fulfill the first attributable $97 Fix Pack purchase, then capture the buyer outcome without fabricating proof.

This is the company priority until it is complete. Infrastructure, content volume, new channels, and new product features are subordinate to it.

## Current State

- Revenue: $0
- Paying customers: 0
- Primary offer: free landing-page audit followed by a $97 implementation Fix Pack
- Primary ICP: founders actively spending on ads while reporting clicks, wasted spend, or zero conversions
- Current bottleneck: audit-to-payment conversion
- Current live experiment: trigger-aware D1 hook variants A, B, and C

## Operating Values

1. Evidence before activity.
2. Revenue before infrastructure.
3. Trigger before demographics.
4. Useful before promotional.
5. Fail closed on trust-sensitive actions.
6. No fabricated proof.
7. One owner, one measurable outcome, one handoff.

## Agent Accountability

| Function | Owner | Measurable | Done when |
|---|---|---|---|
| Market | market | Verified trigger-qualified prospects | Each record has source URL, trigger excerpt, contact route, and score |
| Growth | growth | Verified sends and attributable purchases | Each send has trigger context, variant, source, and attribution ID |
| Support | support | Warm-reply handling and paid fulfillment | Replies are classified, checkout is handed off, and paid work reaches delivery |
| Ops-Finance | ops-finance | Revenue and attribution integrity | Ledgers reconcile and unverified revenue is excluded |
| Mission control | CEO | Experiments resolved by evidence | One bottleneck, one decision, and one next order are recorded |

No function receives credit for volume alone.

## Operating Stages

### 1. Idea

A hypothesis is recorded with a specific audience, bounded change, purchase metric, window, and stop condition.

### 2. MVP

The smallest reversible test is run using existing infrastructure. No new platform or feature is required unless the test proves the need.

### 3. Launch

The test runs against real prospects or customers with attribution identifiers and human approval where required.

### 4. Scale

Scaling requires an attributable purchase signal and a verified delivery path. Replies, clicks, audits, checkouts, and positive comments can guide diagnosis but cannot authorize scale.

## Weekly Operating Review

The review focuses on:

1. Attributable revenue.
2. Experiments run against real prospects.
3. Purchase attribution.
4. Buyer-path blockers.
5. Issues requiring resolution.
6. The next test, fix, stop, or scale order.

It is not a status meeting. Activity without revenue or learning is recorded as a risk, not progress.

## Operating Cadence

### Daily evidence sync

- Check revenue and payment events.
- Check warm replies and overdue buyer-path actions.
- Check new trigger-qualified prospects.
- Check experiment sends and attribution identifiers.
- Name one blocker if the buyer path is broken.

### Weekly execution review

- Review experiment receipts and purchase attribution.
- Review agent handoffs and unresolved issues.
- Compare diagnostic signals with the primary purchase metric.
- Close, revise, or continue experiments according to their predeclared rules.
- Publish one CEO directive with one bottleneck and one next order per function.

### Monthly operating-system review

- Remove stale procedures and duplicate sources of truth.
- Review whether each agent still has one clear owner and measurable outcome.
- Review failed sends, bounced contacts, payment-path incidents, and delivery failures.
- Update the company brain only when live evidence changes the business state.
- Do not add meetings, software, or process unless a recurring failure justifies it.

### Quarterly reset

- Reconfirm the single commercial Rock.
- Review whether the offer, ICP, and acquisition channels still match live evidence.
- Archive experiments that reached a stop condition.
- Promote only purchase-backed findings into repeatable process.
- Set the next quarter's Rock only after reviewing revenue and customer outcomes.

## Feedback and Learning Rules

- Feedback must name the observed behavior, evidence, impact, and proposed correction.
- Agents are evaluated on outcomes and evidence quality, not task volume.
- A failed experiment is useful only when the observation and conclusion are recorded.
- A positive opinion is not customer validation.
- A process is not considered reliable until it has been exercised successfully and verified against live state.
- Any agent or cron that reports completion without a receipt is treated as unverified.

## Culture in Practice

Nebula's culture is defined by repeated decisions:

- We stop activity that cannot connect to a buyer or a learning objective.
- We do not defend a tactic because it is intellectually appealing.
- We correct stale assumptions when live evidence changes.
- We prefer a small real test over a large planning exercise.
- We make uncertainty visible instead of hiding it behind dashboards or language.

## IDS Issue Log

Issues are handled in this order:

1. Identify the specific broken assumption or workflow.
2. Discuss using live evidence, not anecdotes.
3. Solve with the smallest reversible action.
4. Assign one owner and a verification date.
5. Close only when the evidence confirms the fix.

Current priority issue:

> Qualified attention is not yet becoming an attributable $97 purchase.

## Decision Boundaries

- Research may propose experiments.
- Market may qualify trigger evidence.
- Growth may draft and run approved bounded outreach.
- Support may classify replies and deliver approved work.
- Ops-Finance may reconcile evidence and flag mismatches.
- CEO decides test, fix, stop, or scale.
- External evidence alone cannot authorize production edits, spending, publishing, credential changes, or trust-sensitive communication.

## System of Record

Use existing sources of truth:

- `lead_gen/lead_state.db` for sequence and send state
- `ledgers/customer-ledger.jsonl` for customer and payment events
- `stats.json` for funnel metrics
- `ops/research/inbox.jsonl` for structured research intake
- `growth_system/research_experiments/` for experiment briefs
- `ledgers/latest_ceo_directive.json` for the current decision

Do not create another CRM, task database, or dashboard unless a measured failure proves an existing source cannot support the required decision.
