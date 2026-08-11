# Phase 3: Paid Amplification Playbook

**Status**: 📋 DOCUMENTED - awaiting budget approval
**Budget required**: $100/day ($3,000/month)
**Break-even**: 31 purchases/month
**Expected ROAS at scale**: 1.5–3×
**Activation order**: Facebook (Day 1) → Google (Day 3) → LinkedIn (Day 5)

See individual channel runbooks:
- `PHASE_3_FACEBOOK.md` - $50/day retargeting
- `PHASE_3_GOOGLE.md` - $30/day retargeting + search
- `PHASE_3_LINKEDIN.md` - $20/day cold founders

---

## Strategic Logic

### Why Retargeting First (Not Cold)

**Cold audiences** (LinkedIn, cold Facebook) require trust-building before converting.
**Retargeting audiences** already know Nebula - they ran the audit. They saw the score. They just didn't pull the trigger.

Retargeting is 3–5× more efficient than cold:
- Familiar brand → lower CPM
- High intent → higher CTR
- Pre-qualified → higher CVR

**Activation order**:
1. **Facebook retarget** ($50/day) - biggest retarget pool, cheapest CPM
2. **Google retarget** ($30/day) - captures search intent post-audit
3. **LinkedIn cold** ($20/day) - top-of-funnel, feeds retarget pool

---

## Audience Architecture

### Core Audiences (All Channels)

```
RETARGET POOL:
  "Audit Results Viewers"
  → Visited /audit/*/results in last 30 days
  → Exclude: purchased (Custom Conversion)
  → Size estimate: 100-500 people/month

COLD POOL (LinkedIn only):
  "Founder ICP"
  → Job titles: Founder, Co-founder, CEO, CMO, Head of Growth
  → Company size: 1-50 employees
  → Industry: SaaS, DTC, E-commerce, B2B Software
  → NOT retarget pool (already captured)
```

---

## Ad Copy Library (All 3 Channels)

### Frame 1: Loss (Highest Performance, Use First)

**Headline**: Your landing page is leaking money right now

**Body (short)**:
> You ran the audit. You saw the score. Every day you wait, the same visitors bounce.
> $97 fixes the top 3 leaks in 30 minutes. Founders who implement see avg +$600/mo recovered.

**CTA**: Fix the leaks - $97

**UTM**: `utm_source=[channel]&utm_medium=paid&utm_campaign=retarget_loss_frame`

---

### Frame 2: Proof (For Warm Audiences)

**Headline**: 847 audits. Here's what founders fixed first.

**Body (short)**:
> The #1 fix across 847 landing pages: H1 doesn't match the ad.
> Fix takes 15 minutes. Average bounce rate improvement: 12%.
> Your fix pack is waiting.

**CTA**: Get my fix pack - $97

**UTM**: `utm_source=[channel]&utm_medium=paid&utm_campaign=retarget_proof_frame`

---

### Frame 3: Urgency (For 7+ Day Retarget Windows)

**Headline**: Your audit expires in 7 days

**Body (short)**:
> Audit results are time-sensitive. Rankings shift. Ad spend burns.
> Your 3 highest-impact fixes are in your fix pack. Implement before your audit resets.

**CTA**: Claim fix pack before expiry - $97

**UTM**: `utm_source=[channel]&utm_medium=paid&utm_campaign=retarget_urgency_frame`

---

## Budget Allocation

| Channel | Daily | Monthly | Audience | Priority |
|---------|-------|---------|---------|---------|
| Facebook | $50 | $1,500 | Audit result viewers | 1 (most volume) |
| Google | $30 | $900 | Audit result viewers + search | 2 (intent) |
| LinkedIn | $20 | $600 | Cold founders | 3 (top-of-funnel) |
| **Total** | **$100** | **$3,000** | | |

---

## Expected Performance (Benchmarks)

### Facebook Retargeting
- CPM: $8–15
- CTR: 1.5–3%
- CPC: $0.50–1.00
- CVR (click → purchase): 3–8%
- CPA: $15–35
- Monthly purchases at $50/day: 43–100
- Monthly revenue: $4,171–9,700
- **ROAS: 2.8–6.5×**

### Google Retargeting
- CPM (Display): $2–5
- CTR (Display): 0.3–0.8%
- CPM (Search): N/A
- CPC (Search): $2–5
- CVR: 5–12%
- CPA: $20–40
- Monthly purchases at $30/day: 23–45
- Monthly revenue: $2,231–4,365
- **ROAS: 2.5–4.9×**

### LinkedIn Cold
- CPM: $25–50
- CTR: 0.4–0.8%
- CPC: $4–8
- CVR (click → audit start): 15–25%
- CVR (audit → purchase): 5–10%
- CPL (audit start): $20–50
- CPA (purchase): $200–500
- Monthly purchases at $20/day: 1–3
- **Primary purpose: feed retarget pool, not direct revenue**

---

## Monitoring Cadence

### Day 1-3: Daily Checks (3 per day)
- Morning: Spend pacing, any disapprovals
- Afternoon: CTR trending (>1% = good, <0.5% = pause)
- Evening: Conversions attributed

### Day 4-7: Twice Daily
- Morning: Overnight summary
- Evening: Optimize bids/placements

### Week 2+: Daily Check
- 15 min per channel
- Compare CVR by frame (loss vs proof vs urgency)
- Kill weakest frame, scale strongest

---

## Kill Criteria (Pause Rules)

| Metric | Threshold | Action |
|--------|-----------|--------|
| CTR < 0.5% after $50 spend | Any channel | Pause ad, test new creative |
| CPA > $80 after 5 purchases | Any channel | Pause adset, review audience |
| ROAS < 1.0 after $300 spend | Any channel | Pause campaign, diagnose |
| No conversions after $150 | Any channel | Stop + full creative review |
| CPM > $30 (Facebook) | Facebook | Narrow audience or pause |

---

## Pre-Launch Checklist

Complete before spending any budget:

### Technical (30 min)
- [ ] Meta Pixel firing on `/audit/*/results` (verify in Events Manager)
- [ ] Google Tag firing on same page (verify in Tag Assistant)
- [ ] Conversion actions set up (purchase = Stripe webhook → conversion)
- [ ] UTM params in all ad destination URLs
- [ ] PostHog receiving paid traffic events

### Audiences (30 min)
- [ ] Facebook Custom Audience: "Audit Results Viewers (30 days)" - min 100 people
- [ ] Facebook Exclusion Audience: "Fix Pack Purchasers"
- [ ] Google Remarketing List: "Audit Results Viewers"
- [ ] LinkedIn Matched Audience: "Site Visitors" (needs 300 min)

### Creative (1 hour)
- [ ] 3 ad images (one per frame: loss / proof / urgency)
- [ ] Copy reviewed (no hype claims, specific metrics only)
- [ ] Destination URL correct + UTM tagged
- [ ] Mobile preview checked

### Budget
- [ ] Mike approves $100/day total
- [ ] Payment methods added to each platform
- [ ] Billing alerts set ($100/day, $500/week limits)

---

## Activation Command (When Ready)

When budget is approved, activate in this order:

```bash
# Day 1: Facebook
# 1. Go to Meta Business Manager
# 2. Create campaign per PHASE_3_FACEBOOK.md
# 3. Set budget: $50/day
# 4. Launch Loss Frame ad first

# Day 3: Google
# 1. Go to Google Ads
# 2. Create campaign per PHASE_3_GOOGLE.md
# 3. Set budget: $30/day
# 4. Launch Display retargeting first

# Day 5: LinkedIn
# 1. Go to LinkedIn Campaign Manager
# 2. Create campaign per PHASE_3_LINKEDIN.md
# 3. Set budget: $20/day
# 4. Launch Single Image ad first
```

---

## Integration With CRM

All paid traffic flows into PostgreSQL CRM:

1. Visitor clicks ad → UTM captured by audit form
2. Audit created → `audits.utm_source = 'facebook'` (or google/linkedin)
3. Purchase made → `purchases` linked to customer
4. LTV updated → `customers.lifetime_value_cents`
5. Attribution visible → `GET /api/crm/sources`

**Weekly review includes**: revenue from paid vs organic
**Kill decision based on**: CPA from CRM, not ad platform (more accurate)

---

## Expected Impact

### Month 1 (First 30 days of paid):
- Retarget pool: 100-300 people/month
- Additional purchases: 5-15/month
- Revenue from paid: $485-1,455/month
- Net after ad spend ($3,000): -$1,545 to -$2,515
- **Status**: Learning phase (not profitable yet - normal)

### Month 2 (Optimized):
- Retarget pool growing: 200-500 people/month
- Additional purchases: 15-30/month
- Revenue from paid: $1,455-2,910/month
- Net after ad spend: -$545 to -$90
- **Status**: Near break-even

### Month 3 (Scaled):
- All 3 channels optimized
- Additional purchases: 30-60/month
- Revenue from paid: $2,910-5,820/month
- Net after ad spend: -$90 to +$2,820
- **Status**: Profitable

### Key insight:
Paid is a **volume amplifier**, not a standalone channel. It works because:
1. Free audit is high-converting (psychology + proof layer deployed)
2. Retarget pool is pre-qualified (already seen their score)
3. $97 is low-friction (not $1,000+)

Without strong organic (newsletter, SEO, WOM), paid alone will be marginal.

---

**Status**: Fully documented. Ready to activate on budget approval.

**Activation time**: ~3 hours (technical setup + creative + launch)
**Time to first data**: 48 hours
**Time to first optimization decision**: 7 days
**Time to first profitable month**: 60-90 days
