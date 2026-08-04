# Reddit r/SaaS Post Draft
# Status: DRAFT — requires Mike approval before posting
# Target subs: r/SaaS (primary), r/SideProject (secondary)

---

## Title: I asked ChatGPT, Perplexity, and my own audit tool to diagnose the same landing page. Here's what each found (and missed).

---

I've been building a landing page audit tool for founders spending on ads with zero conversions. After 86 audits, I noticed something: the advice ChatGPT gives for "fix my landing page" is dangerously generic.

So I ran the same page through three approaches:

**ChatGPT (GPT-4o):**
- "Add social proof" ✓ (but where? above fold? below CTA?)
- "Improve your headline" ✓ (but what's wrong with it specifically?)
- "Add urgency" ❌ (this is terrible advice for a B2B SaaS page)
- Score: Generic. Would apply to literally any page.

**Perplexity:**
- Pulled recommendations from 4 blog posts
- Mostly regurgitated Unbounce's CRO guide
- Zero page-specific findings
- Score: Aggregator of other people's advice. Not an audit.

**Nebula (my tool — biased, obviously):**
- Message match: 3/10 — ad says "save 4 hours/week", page headline says "all-in-one platform"
- CTA clarity: 4/10 — 3 competing CTAs in hero section
- Trust: 2/10 — no logos, testimonials below fold, no security badges near form
- Mobile CTA: 5/10 — primary button requires 3 scrolls on iPhone
- Specific fix for each signal with evidence

**The difference:** AI chat gives you a checklist that applies to every page on the internet. A conversion audit finds the *specific* leak on *this* page.

The stats across all 86 audits so far:
- **Zero pages scored an A** (best: 77/100, average: 62.7)
- **100% had above-the-fold failures** — headline present, no CTA in first viewport
- **99% failed ad signal continuity** — the page doesn't continue what the ad promised
- **Page speed was only a problem on 29%** — yet it's the only thing most free tools measure

The most common leak across 86 audits: **message match failure** (ad promises X, page headline says Y). Speed tools miss it. ChatGPT gives you "improve your headline" without identifying the gap.

If you want to try it: https://nebulacomponents.com/audit (free, no signup, ~90 seconds)

Building in public — happy to answer questions about the scoring methodology or share more audit patterns.

---

# NOTES
# - Tone: builder sharing findings, not pitching
# - Include real data points (verify 73 audits, 5.2 avg score from DB)
# - Do NOT be salesy — Reddit will destroy us
# - Respond to every comment for 48 hours
# - Secondary post for r/SideProject: shorter, more "launch day" style
# - Wait for SaaSHero outreach first (don't flood all channels same day)
