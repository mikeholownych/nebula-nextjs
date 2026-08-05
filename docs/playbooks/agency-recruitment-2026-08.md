# Agency Partner Recruitment Playbook
## Play 4 — Seed the first 3 agency partners

**Goal:** 3 agencies embedding the widget within 14 days (by 2026-08-18).

---

## ICP for Agency Partners

**Who converts:**
- Small web/marketing agencies (2–15 people)
- Actively managing client landing pages or running paid ads for clients
- Already offer "landing page optimization" or "CRO" as a service line
- Would benefit from a lead-gen tool that positions them as conversion experts

**Trigger signals:**
- Agency posts about landing page work on LinkedIn/X
- Agencies with "CRO" or "conversion" in their service offerings
- Agencies on directories (Clutch, DesignRush, Upwork top-rated)
- Agencies already offering free tools/calculators on their sites

---

## Channels (ranked by expected signal quality)

1. **LinkedIn DM (warm)** — find 10 agencies posting about CRO/landing pages
2. **Agency directory outreach** — Clutch "Conversion Optimization" category
3. **Indie Hackers / X** — founders with agency offerings, already talking about tools

---

## Outreach Template (LinkedIn DM — cold)

Subject: Your own lead-gen audit tool (one-time, no monthly)

---

Hey [Name],

Saw you work on landing pages for [context — their niche/recent post].

We built an embeddable audit widget that scores any landing page (0–10) and shows the top conversion leaks — in real time, right on your agency's site. Your visitors scan their page, you get the lead. Full attribution.

It's two lines of HTML. Dark/light theme. No monthly fees. One-time $497.

Live demo: https://nebulacomponents.com/agency-partner

Worth a look? Happy to answer questions.

— Mike, Nebula Components

---

## Outreach Template (X / short-form)

Built an embeddable audit widget for agencies doing landing page work.

Your visitors enter a URL → instant conversion score + top 3 leaks → you get the lead. Shadow DOM, dark/light, two lines of code.

One-time $497. No monthly. Live demo: nebulacomponents.com/agency-partner

---

## Qualification Criteria (before spending time)

✓ Agency has a live website (not a Linktree)
✓ Landing pages / CRO / ads mentioned in services
✓ Fewer than 50 employees (large agencies have internal tools)
✓ Active social presence (they'll actually see the DM)

---

## Delivery After Purchase (automated via webhook)

1. Stripe checkout → webhook fires → `provisionAgencyPartner()` creates partner row
2. Telegram alert to Mike with embed code
3. Mike sends welcome email manually (until volume warrants automation):
   - Embed instructions
   - Their partner ID + domain
   - Dashboard access (future — workspace integration)
   - Rate limit bump offer

---

## Success Metrics

| Metric | Target | Tracking |
|--------|--------|----------|
| DMs sent | 10 per channel | Manual log |
| Demo page views | 30+ from outreach | PostHog `/agency-partner` |
| Widget purchases | 3 | Stripe |
| Widgets actually embedded | 2+ | `SELECT * FROM partners WHERE status='active'` |

---

## Anti-patterns to avoid

- Don't pitch agencies that only do branding/logo work (no landing pages)
- Don't discount below $497 — the offer is already underpriced for lifetime access
- Don't promise features that don't exist yet (white-label, dashboard, multi-domain)
- Don't spam — 10 DMs max per channel, wait for signals before follow-up
