# WhyNotConverting - competitor note (2026-08-19)

Classification: **direct job competitor**, not a peer company.
Evidence: observed live product + pricing. No attributable sales.

Commercial frame (Mike, 2026-08-19):
Give the diagnosis away. Then monetize fully. Never optimize for theater.

Theater = email gates that contradict "no signup", invented waste math,
unnamed before/after cards, lift percentages, hostage unlocks.

## Who
- Product: https://whynotconverting.com
- Owner: NRB Consulting Ltd (Nick, West Lancashire). Footer: nrbconsulting.co.uk
- Role: one of five solo AI side-products. Real business is a 750 GBP / 7-day AI feature sprint.
- Stack: Next.js on Vercel. Sitemap lastmod 2026-05.
- Claimed: "1,200+ audits". Company-reported. Unverified.

## Offer
- Advertised: free homepage audit, no signup, results instantly.
- Live path: sitemap crawl -> page picker (50 URLs) -> teaser finding -> email gate -> $12 / $24 / $59 unlock.
- Waste banner on Nebula run: "~370 GBP/month" from assumed 1,000 visitors, 2.5% conversion, 15 GBP value. Not measured.

## What they monetize that we currently leave on the table
1. Site crawl + page picker. One URL leaves the rest of the site undiagnosed and unsold.
2. Multi-page packages after the first finding. We stop at one $97 Repair Sprint.
3. Observed vs expected bars. Makes the paid change concrete without inventing lift.

## What they do that is theater (reject)
1. Email gate after promising no signup.
2. Dollarized "costing you" number from assumed traffic.
3. "Recent diagnoses" with no named pages (42 to 68, +22% CTA, bounce -31%).
4. Guide copy that treats 10-40% lift as typical.

## What we already provide that they do not
1. Ungated findings.
2. Inspectable evidence, rule IDs, registry version, heuristic class.
3. Public named teardowns.
4. One-leak repair + same-scope re-audit.
5. Explicit "cannot prove conversion" boundary.
6. Instrument UI that shows the engine.

## Their audit of nebulacomponents.com (live, 2026-08-19)
- Teaser: "H1 lacks explicit payoff" on `Find page-side leaks. Before blaming the traffic.`
- Remaining issues gated behind email.
- Unlocked screenshot (user): score 30, 7 issues, 370 GBP/month, then $12/$24/$59.
- Mix of observables (CTA fold, LCP) and a category error: "160px of payment trigger" on a non-checkout homepage.

## Decision
| Move | Verdict | Why |
|---|---|---|
| Email gate, waste math, lift %, fake recents | Reject | Theater. Contradicts the free-diagnosis wedge. |
| Change H1 because they flagged payoff | Reject | Headline is the instrument. |
| Homepage redesign to look like them | Reject | Freeze holds. |
| Multi-page picker / residual-page sprints | Re-eval after first real purchase | Only candidate that captures leftover money without theater. |
| $12 unlock ladder | Reject unless a buyer asks for a smaller SKU after paying | Dilutes $97. Do not copy their hostage pricing. |

Post-conversion question (not a now-question):
After one paid Repair Sprint, how many other failed conditions on the same site were left unsold, and what bounded offer sells those without gating the free diagnosis?

Watch: cron `70a6ccf4d4bb` (`wnc-post-conversion-reeval`). Silent until `payments.log` has a non-test purchase.
