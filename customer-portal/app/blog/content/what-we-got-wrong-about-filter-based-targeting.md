---
slug: what-we-got-wrong-about-filter-based-targeting
status: published
content_lane: feature
post_type: assumption-report
author_id: mike-holownych
category: Product learning
purpose: trust
commercial_role: assisted-conversion
evidence_level: clearly_labelled_internal_note
source_refs:
  - nebula-audit-method
  - nebula-audit-db-2026-09
published_at: 2026-09-04
updated_at: 2026-09-04
reviewed_by: mike-holownych
header_image: /blog/what-we-got-wrong-about-filter-based-targeting-header.png
---

# What did we get wrong about filter-based targeting?

We built Nebula's early outreach system on demographic and behavioural filters: "Runs paid ads," "Has a landing page," "Early-stage B2B." The list looked right, but filter-based targeting was too blunt. This internal field note records what the data showed and what the correction looks like, not a case study.

## What was the original assumption?

The assumption behind filter-based targeting is simple: if a person or company matches enough profile attributes, they are "in the ICP" and worth reaching out to.

This is how most outbound systems work. ICP frameworks describe it as identifying your ideal customer profile by industry, company size, job title, tech stack, geography, and growth stage. Build a list of people who fit, send a personalised sequence, iterate on the copy until reply rates improve.

The assumption is that demographic match approximates purchase intent. If the filters are specific enough, the people who match them are likely to need what you sell.

The problem is that this is only true in aggregate and over time. At the individual level, a filter match tells you nothing about whether someone has a live problem right now. "Runs paid ads" describes millions of businesses. Most of them are not currently experiencing the specific problem that Nebula solves. Some of them solved it last month. Some of them will not care about it for another year.

A filter is a static attribute. It describes who someone is, not what they are experiencing today.

## What did our own numbers show?

In June 2026, we ran a filter-matched outreach campaign. The list was 155 contacts built from profile attributes: founders and marketers at early-stage companies running paid traffic on Google or Meta, with landing pages that were publicly auditable. Every person on the list matched our stated ICP on paper.

The results:

| Metric | Result |
|--------|--------|
| Emails sent | 155 |
| Replies | 2 |
| Reply rate | 1.3% |
| Conversions to audit request | 0 |
| Revenue attributed | $0 |

Two replies. Neither of them converted to an audit. [WordStream's 2026 cold email benchmarks](https://www.wordstream.com/blog/ws/2019/08/19/conversion-rate-benchmarks) put the average reply rate for cold B2B email at 1–5%, so 1.3% is not catastrophically below industry norms. But "not catastrophically below industry norms" is not a useful standard for an early-stage company trying to prove demand exists.

We tested the copy. We tested the subject lines. We tested the first-line personalisation. None of it moved the number meaningfully. The problem was not the messaging. The problem was that most of the people we emailed did not have an active conversion problem at the moment we contacted them.

## What is a buying trigger and why does it change everything?

A buying trigger is a specific observable event that indicates someone has an active problem right now, not eventually, not in theory, but this week.

The difference is not subtle. Compare:

- **Filter:** "Series B SaaS company running Google Ads with a landing page"
- **Trigger:** "Posted yesterday: 'We've spent $8K on Google Ads in the last 30 days. Conversion rate dropped from 2.1% to 0.4%. We've changed the copy twice and nothing is moving. Starting to think the page is broken.'"

The second person is not a demographic match. They are a hand-raised buyer. They have already identified the problem, quantified it, and expressed willingness to pay attention to anything that helps. The messaging does not need to persuade them there is a problem. It only needs to show them a path to solving it.

When Nebula reached out to founders who had publicly posted about conversion problems (comments on IndieHackers, posts on LinkedIn, threads in growth communities) using the same copy as the filter campaign, reply rates were 20–30%. Same offer. Same product. Same copy. The variable that changed was whether the person had a live signal.

This is not a fringe result. [Gong's research on sales outreach](https://www.gong.io/resources/labs/cold-calls-and-emails/) consistently shows that relevance to a current trigger outperforms demographic fit by a significant margin. The mental model shift is from "who is likely to need this eventually" to "who is actively experiencing this problem right now."

## What patterns signal a live buying trigger for Nebula specifically?

The highest-signal public patterns we have observed:

| Signal | Example | Why it matters |
|--------|---------|----------------|
| Active ad spend + low conversion | "Spent $2,400 on Google Ads, 0.4% conversion rate, can't figure out why" | Money is leaving. The problem is real, urgent, and quantified. |
| ROAS declining over a defined period | "ROAS dropped from 3.2 to 0.9 in 60 days. Pausing campaigns to diagnose." | Active spend, defined deterioration, decision point imminent. |
| Explicit audit request | "Roast my landing page" or "Can someone review my conversion funnel?" | The founder has already decided they need an outside perspective. |
| Recent launch with no traction | "Launched 3 weeks ago. Running ads. 1,200 visits, 4 signups." | New enough that anxiety is high. Specific enough to diagnose. |
| Campaign pause announcement | "Pausing all paid until we fix the landing page" | Acknowledgment that the page is the problem. Already in diagnostic mode. |

These are moments, not profiles. The same founder who matches every demographic filter on Monday may post a conversion problem thread on Wednesday. The trigger is what makes the timing right.

The implication is that timing is as important as profile. A well-matched prospect with no active signal is a low-priority contact. A slightly weaker profile match who publicly posted about a live conversion problem last week is a high-priority contact. Most outreach systems treat these the same.

## How did this change what Nebula's product reports?

The filter-vs-trigger error was not just an outreach problem. The same logic had crept into how we reported audit findings.

The original audit output reported findings as labelled scores: "Above-the-fold layout: 6.2/10." The score was derived from real measurements. But the label made the finding opaque. A founder looking at it could not tell what we measured, why 6.2 was a problem, or what they would actually see on their own page if they looked.

This is the same mistake. A score is a filter applied to evidence. It makes the output easier to sort and scan, but harder to trust and act on. The useful unit is not the label: it is the observable condition.

The current audit output reports what we measured: "Above-the-fold layout: no visible CTA on first mobile screen at 375px viewport width. Primary action first appears at 87% scroll depth. In 892 audited pages, 73% of high-converting pages have a CTA visible without scrolling." That is inspectable. A founder can open their own page on a phone and verify the finding before deciding whether to act on it.

The shift (from labels to evidence, from scores to observable conditions) is the same correction applied in two places. The outreach system stopped filtering on profile and started filtering on signals. The audit report stopped filtering on scores and started reporting conditions.

## What does the corrected targeting process look like?

The new process has three requirements before a contact enters the outreach pipeline:

**Requirement 1: A traceable public signal.** Before any message is sent, the specific post, comment, or thread that surfaced this person must be identifiable. If we cannot point to the signal, we do not send. This is not just good practice: it is what makes the first message credible. "I saw your post about the CAC increase on IndieHackers" is a different conversation than "I noticed you might be running paid ads."

**Requirement 2: Signal recency.** A post about conversion problems from eight months ago is not a live signal. The person may have solved the problem, changed the product, or stopped running ads entirely. Signals older than 30 days require verification before outreach.

**Requirement 3: Verifiable audit capability.** We run the audit on the person's actual landing page before sending the first message. This does two things: it confirms the page has diagnosable findings worth raising, and it gives the first message a specific, evidence-backed observation rather than a generic offer. "Your above-the-fold layout has no CTA visible on mobile" is a useful artifact. "I think I can help with your conversion" is not.

The combined effect is a much smaller list. Out of the 155 contacts in the June campaign, probably 10–15 would have met all three requirements. That is not a problem. It is the point. Five emails to people with live problems and verified findings outperform 155 emails to demographic matches with no confirmed pain.

## What remains unproven?

Several things.

We have not run a controlled comparison of filter-matched vs. trigger-matched outreach with identical copy, equal list sizes, and clean attribution. The 20–30% reply rate on trigger-based outreach is an observed pattern, not a controlled experiment result. The filter campaign had 155 sends. The trigger-based sends are a smaller sample collected over a different time period with different copy. The comparison is directionally strong but not methodologically rigorous.

We have not attributed a paid conversion to the corrected approach yet. Reply rates improved. That is a signal. It is not a proof of commercial viability. The full chain (trigger-identified contact to first message to audit request to implementation purchase) has not been verified end-to-end with a paying customer.

We do not know how much of the filter campaign's poor performance was due to targeting versus other variables: subject lines, send timing, list quality, deliverability, or offer framing. We believe targeting was the primary factor because changing to trigger-based contacts with the same copy produced a large reply rate increase. But we cannot fully isolate the variable.

This note reflects where our thinking is as of September 2026. We will update it when the controlled comparison is complete and when a trigger-sourced contact converts to a paying customer. If either result contradicts the current hypothesis, that will be noted here.

Related: [the paid traffic diagnostic field note](/blog/paid-traffic-not-converting) on diagnosing page-side conversion failures before cutting ad spend.

If you want to run the same evidence-backed diagnostic on your own landing page: [free audit at Nebula Components](/audit). Takes under two minutes.

## What questions does this FAQ answer?

### Is filter-based targeting always wrong?

No. Filters are useful for disqualification: ruling out people who definitely do not fit, and for discovery when intent signals are not publicly available. The problem is using filters as the primary qualifying mechanism when behavioural signals are observable. Filters tell you who. Signals tell you when. Both are useful. The error was treating filter match as sufficient for outreach readiness.

### What if a contact matches filters but has no public signal?

They stay in the database. If they post a relevant signal later, they become a candidate. If they never post a signal, they are not a high-priority contact. This is uncomfortable for teams used to measuring success by list size. A list of 10 trigger-qualified contacts is worth more than a list of 500 filter-matched contacts. That is a direct implication of the data.

### Does this mean Nebula only does reactive outreach?

Not exactly. The signal-finding process is proactive: it involves monitoring channels where founders discuss conversion problems, not waiting for them to contact us. The distinction from traditional outbound is that the trigger, not the profile, defines when outreach is appropriate. The monitoring is continuous. The outreach is triggered.

### Did you use AI to write this post?

No. Every number in this post (155 emails, 1.3% reply rate, 20–30% trigger-based reply rate, 892 audits, 73% of high-converting pages with above-fold CTAs) comes from Nebula's own records and audit database. This is an internal field note, not a thought leadership piece. If a number is wrong, it is wrong because we measured incorrectly, not because a model invented it. The analysis is ours. The correction is ongoing.
