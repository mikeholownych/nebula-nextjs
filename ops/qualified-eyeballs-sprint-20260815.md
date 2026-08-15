# Nebula qualified-eyeball sprint

Date: 2026-08-15
Experiment ID: nebula-qualified-eyeballs-20260815
Objective: drive qualified audit starts, not generic traffic, toward one attributable $97 purchase.

## Proof boundary

- Public audit: https://nebulacomponents.com/audit
- Legacy checkout repaired: https://nebulacomponents.com/checkout.html redirects to https://nebulacomponents.com/checkout
- Public pricing: https://nebulacomponents.com/pricing
- No public post has been sent by this artifact.
- External search results are leads for manual review, not verified buyer intent.

## Target

20 qualified visitors
8 audit starts
3 real buyer conversations
1 completed $97 payment

## Channel exclusion

Reddit is permanently excluded. Mike has empirically confirmed that every account is shadowbanned. Do not search Reddit for Nebula acquisition, draft Reddit replies, or recommend Reddit posting.

## Source lane A: Direct trigger email

Use the existing Nebula trigger engine to identify founders with public evidence of active ad spend and zero conversions. Hunter and MailCheck run for every lookup. Send only when the source trigger, contact route, suppression state, compliance footer, and Nebula release gate pass.

Required email angle:

> You said the ads are getting attention but the page is not closing the click. I found one specific condition worth checking. Run the free audit here: https://nebulacomponents.com/audit

No generic list expansion. Every send must preserve source URL, trigger text, provider observations, and payment attribution.

## Source lane B: Indie Hackers founder pain

### 4. Still no paying users
Source: https://www.indiehackers.com/post/still-no-paying-users-so-im-doing-something-different-2f5bf557b8

Draft reply:

> The split between visitors, audit starts, completed reports, and paid outcomes is the right diagnosis. “No sales” is not one problem. It is a stage. The first thing I would make explicit above the fold is who the report is for and what decision it helps the founder make. That is the same distinction our free audit is designed to expose on landing pages: https://nebulacomponents.com/audit

### 5. Posted everywhere, zero sales
Source: https://www.indiehackers.com/post/ive-posted-everywhere-and-gotten-zero-sales-here-s-what-im-learning-about-why-818b90462f

Draft reply:

> Twenty handpicked visitors will teach you more than broad posting if you can see where they stop. If they do not start, it is probably positioning or trust. If they complete the audit and do not buy, the paid outcome is the next question. That is the funnel I would instrument before adding more channels.

## Connector lane

### Target: John Portalios
Community: https://www.skool.com/meta-shopify

Draft DM:

> Hey John, I have been following your Meta Ads and Claude work for Shopify founders. A recurring problem in that audience is: the ads get attention, but the page does not convert the click.
>
> I built a free evidence-backed landing-page audit for that exact moment. I would like to run it on one student example first, with no commitment from you. If it helps, you can send students to it when they hit that wall. If a student buys the $97 One-Leak Repair Sprint, I would pay 25% referral commission.
>
> Worth testing on one example?

## Attribution

Use source parameters where the surface supports them:

- `?utm_source=indiehackers&utm_medium=thread&utm_campaign=qualified-eyeballs-20260815`
- `?utm_source=connector&utm_medium=skool&utm_campaign=qualified-eyeballs-20260815`
- `?utm_source=trigger-email&utm_medium=email&utm_campaign=qualified-eyeballs-20260815`

Primary success event: completed Stripe payment attributed to this experiment.

Diagnostic events: thread reply, audit start, completed audit, checkout start, reply, payment.

## Manual action required

Review the two Indie Hackers drafts manually if the threads are still active. Send the connector DM manually. Run the direct trigger-email lane through Nebula's existing provider and release-gate path. Do not claim reach until platform receipts or analytics show it.
