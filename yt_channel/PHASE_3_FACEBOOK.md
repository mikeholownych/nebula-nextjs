# Phase 3 — Facebook/Meta Retargeting Runbook

**Status**: 📋 Ready to launch — awaiting budget approval  
**Budget**: $50/day  
**Audience**: Visited `/audit/*/results` in last 30 days, exclude purchasers  
**Goal**: $97 fix pack purchases  
**Target CPA**: $40 or less  

---

## 1. Pre-Launch: Pixel Verification (15 min)

### Verify Meta Pixel Is Firing

1. Install [Meta Pixel Helper Chrome extension](https://chrome.google.com/webstore/detail/meta-pixel-helper)
2. Navigate to `nebulacomponents.com/audit/[any-id]/results`
3. Open the extension — confirm:
   - Pixel fires `PageView` event ✓
   - No errors shown ✓
4. Confirm in Meta Events Manager → `nebulacomponents.com` → Events → `PageView` appears with recent activity

### Add Custom Conversion (Purchase Tracking)

In Meta Events Manager → Custom Conversions → Create:
- Name: `Fix Pack Purchase`
- URL Rule: `nebulacomponents.com/checkout/success` (or Stripe redirect URL)
- Category: `Purchase`
- Value: `97`
- Currency: `USD`

**Verify**: Make a test purchase → confirm Custom Conversion fires in Events Manager within 24h.

---

## 2. Audiences (20 min)

### Custom Audience 1: Audit Results Viewers (Retarget Pool)

Meta Business Manager → Audiences → Create Audience → Custom Audience → Website:

```
Audience name: "Audit Results — Last 30 Days"
Include: People who visited specific web pages
  URL contains: /audit/
  URL contains: /results
Retention: 30 days
Estimated size: ~100-500 people/month (grows with traffic)
```

**Minimum size required**: 100 people before running ads (Meta won't serve below this)

### Custom Audience 2: Purchasers (Exclusion)

```
Audience name: "Fix Pack Purchasers — All Time"
Include: People who performed Custom Conversion: Fix Pack Purchase
Retention: 180 days (max)
```

### Lookalike Audience (Week 3+, after 50+ purchasers)

```
Source: "Fix Pack Purchasers — All Time"
Location: United States + Canada + UK + Australia
Size: 1% (tightest match)
Name: "Fix Pack Purchaser Lookalike 1%"
```

---

## 3. Campaign Structure

```
CAMPAIGN: Nebula — Retarget — Fix Pack
  Objective: Sales
  Budget type: Campaign Budget Optimization (CBO)
  Daily budget: $50/day

  AD SET 1: Retarget — 30-Day Results Viewers
    Audience: "Audit Results — Last 30 Days"
    Exclude: "Fix Pack Purchasers — All Time"
    Placement: Automatic (let Meta optimize)
    Optimization: Conversions → Fix Pack Purchase
    Bid: Cost Cap → $40

    AD 1A: Loss Frame (launch first)
    AD 1B: Proof Frame (launch week 2)
    AD 1C: Urgency Frame (launch week 2)
```

---

## 4. Ad Copy (3 Variants)

### Variant A: Loss Frame (Launch First)

**Primary text**:
> You ran the audit. You saw the score.
> 
> Every day that page stays broken, your ad spend bleeds.
> 
> The fix pack implements your top 3 changes in 30 minutes. Founders who do it average +$600/month recovered.
> 
> $97. One-time.

**Headline**: Your landing page is leaking money right now

**Description**: Fix your top 3 conversion leaks today

**CTA button**: Shop Now → `https://nebulacomponents.com/audit?utm_source=facebook&utm_medium=paid&utm_campaign=retarget_loss_frame`

---

### Variant B: Proof Frame

**Primary text**:
> 847 landing pages audited. Here's what founders fixed first.
> 
> Finding #1 across 72% of sites: H1 doesn't match the ad copy.
> Fix time: 15 minutes. Average bounce rate improvement: 12%.
> 
> Your fix pack has your specific issues. Not generic advice — the exact prompts for your page.

**Headline**: 847 audits. Here's what the top founders fixed first.

**Description**: Specific fixes. Your page. 30 minutes.

**CTA button**: Learn More → `https://nebulacomponents.com/audit?utm_source=facebook&utm_medium=paid&utm_campaign=retarget_proof_frame`

---

### Variant C: Urgency Frame

**Primary text**:
> Your audit expires in 7 days.
> 
> After that, your findings reset and you start over.
> 
> Your fix pack is already built from your audit. 3 specific changes. Copy-paste prompts. Implement before the window closes.

**Headline**: Your audit expires in 7 days

**Description**: Claim your fix pack before findings reset — $97

**CTA button**: Shop Now → `https://nebulacomponents.com/audit?utm_source=facebook&utm_medium=paid&utm_campaign=retarget_urgency_frame`

---

## 5. Creative Specs

| Format | Size | Notes |
|--------|------|-------|
| Feed image | 1200×628px (1.91:1) | Primary |
| Square image | 1080×1080px (1:1) | Better mobile performance |
| Story/Reels | 1080×1920px (9:16) | Optional week 2 |
| File type | JPG or PNG | Max 30MB |
| Text on image | Under 20% | More text = reduced reach |

**Recommended creative approach**:
- Screenshot of the audit results page (score 4/10, red)
- Overlay text: "Is your landing page this broken?"
- No stock photos — authentic audit UI performs better

---

## 6. Bidding Strategy

**Week 1**: Cost Cap at $40 CPA
- Meta will spend conservatively to stay under $40/purchase
- Expect slow delivery first 3 days (learning phase)

**Week 2 (if CPA is consistently under $30)**: Raise budget to $75/day

**Week 2 (if no conversions after $150 spend)**: Switch to Lowest Cost, pause Cost Cap

**Week 3+**: Shift budget toward best-performing ad variant (pause the other two)

---

## 7. UTM Parameters

| Parameter | Value | Purpose |
|-----------|-------|---------|
| utm_source | `facebook` | Channel attribution |
| utm_medium | `paid` | Medium type |
| utm_campaign | `retarget_loss_frame` / `retarget_proof_frame` / `retarget_urgency_frame` | Ad variant |
| utm_content | `feed` / `story` / `square` | Creative format |

**Full URL example**:
```
https://nebulacomponents.com/audit?utm_source=facebook&utm_medium=paid&utm_campaign=retarget_loss_frame&utm_content=feed
```

---

## 8. Daily Monitoring Checklist (10 min/day)

**Morning check (after overnight spend)**:
- [ ] Total spend yesterday: on pace for $50? (check pacing)
- [ ] Any ad disapprovals? (Meta → Ads Manager → review flags)
- [ ] Impressions delivered? (if 0, audience too small or bid too low)

**Afternoon check**:
- [ ] CTR (link): above 1.0%? Below = creative fatigue or wrong audience
- [ ] CPC: below $2.00? Above = bid competition or low relevance
- [ ] Conversions: any Fix Pack Purchases attributed?

**Weekly check (Sunday)**:
- [ ] Cost per purchase vs $40 target
- [ ] Frequency: above 3× = audience fatigue → expand or pause
- [ ] Best performing variant → pause the others, scale the winner

---

## 9. Kill / Pause Criteria

| Trigger | Action |
|---------|--------|
| CTR below 0.5% after $50 spend | Pause ad, create new creative |
| CPA above $80 after 5 purchases | Pause ad set, review audience |
| CPA above $80 after $300 spend | Pause campaign, diagnose |
| Zero conversions after $150 spend | Stop → full creative review |
| Frequency above 4× in 7 days | Expand audience or pause 2 weeks |
| Ad disapproved 2× | Revise copy, avoid trigger words |

---

## 10. Expected Metrics

| Metric | Conservative | Realistic | Best Case |
|--------|-------------|-----------|-----------|
| CPM | $12 | $10 | $8 |
| CTR | 1.5% | 2.0% | 3.0% |
| CPC | $0.80 | $0.50 | $0.27 |
| CVR (click → purchase) | 3% | 5% | 8% |
| CPA | $27 | $10 | $3 |
| Monthly purchases at $50/day | 55 | 150 | 500 |
| Monthly revenue | $5,335 | $14,550 | $48,500 |
| **ROAS** | **3.6×** | **9.7×** | **32×** |

*Note: Realistic figures are for an optimized campaign after 30 days. Month 1 will be below conservative while learning.*

---

## Launch Checklist

- [ ] Meta Pixel firing on `/audit/*/results` (verified in Events Manager)
- [ ] Custom Conversion: `Fix Pack Purchase` set up
- [ ] Custom Audience: `Audit Results — Last 30 Days` has 100+ people
- [ ] Exclusion Audience: `Fix Pack Purchasers` created
- [ ] Campaign created with $50/day CBO budget
- [ ] Ad Set targeting correct audiences with exclusion applied
- [ ] All 3 ad variants uploaded (A first, B+C week 2)
- [ ] UTM params in all destination URLs
- [ ] Billing method added in Meta Business Manager
- [ ] Daily spend alert set at $60 (notify if overspending)

**Activation time**: ~90 minutes from zero to launched
