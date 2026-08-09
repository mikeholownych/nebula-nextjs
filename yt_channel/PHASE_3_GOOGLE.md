# Phase 3 — Google Ads Retargeting Runbook

**Status**: 📋 Ready to launch — awaiting budget approval  
**Budget**: $30/day  
**Audiences**: Audit results page visitors (Display remarketing + Search RLSA)  
**Goal**: $97 fix pack purchases  
**Target CPA**: $35  

---

## 1. Pre-Launch: Google Tag Verification (15 min)

### Verify Google Tag Is Firing

1. Install [Tag Assistant Chrome extension](https://chrome.google.com/webstore/detail/tag-assistant-legacy)
2. Navigate to `nebulacomponents.com/audit/[any-id]/results`
3. Confirm Google tag fires with no errors
4. In Google Ads → Tools → Audience Manager → confirm tag status: "Recording"

### Set Up Conversion Action

Google Ads → Tools → Conversions → New Conversion Action → Website:

```
Conversion name: Fix Pack Purchase
Category: Purchase
Value: Use the same value for each conversion → $97
Count: One (one purchase per visitor = one conversion)
Click-through window: 30 days
View-through window: 1 day
Attribution model: Data-driven (or Last click if no history yet)
```

**How to track**: Add conversion snippet to Stripe success page OR use Google Tag Manager to fire on `/checkout/success` URL.

---

## 2. Audience Lists (20 min)

### Remarketing List 1: Audit Results Viewers

Google Ads → Tools → Audience Manager → Audience Lists → Website Visitors:

```
List name: "Audit Results — Last 30 Days"
Membership duration: 30 days
URL rule: URL contains → /audit/  AND  URL contains → /results
```

### Remarketing List 2: All Site Visitors (Broad)

```
List name: "All Site Visitors — Last 60 Days"
Membership duration: 60 days
URL rule: URL contains → nebulacomponents.com
```

### Exclusion List: Purchasers

```
List name: "Fix Pack Purchasers — All Time"
Membership duration: 540 days (max)
URL rule: URL equals → nebulacomponents.com/checkout/success
```

**Minimum list size**: 100 users for Search, 1000 for Display. Build organic traffic for 2–4 weeks before launching if lists are smaller.

---

## 3. Campaign Structure

### Campaign 1: Display Remarketing ($20/day)

```
Campaign name: Nebula — Display Retarget — Fix Pack
Campaign type: Display
Goal: Sales
Bidding: Target CPA → $35
Budget: $20/day

Ad Group 1: Audit Results Viewers
  Audiences (Observation + Bid only):
    + "Audit Results — Last 30 Days" (TARGET)
    - "Fix Pack Purchasers" (EXCLUDE)
  Placements: Automatic (Responsive Display Ads)

  Responsive Display Ad:
    Headlines (up to 5):
      1. Your landing page is leaking money
      2. Audit done. Fix it for $97.
      3. 847 audits analyzed — here's the fix
      4. Your top 3 fixes. 30 minutes.
      5. Stop the conversion bleed today
    Descriptions (up to 5):
      1. You saw your score. Now fix the 3 biggest leaks. Copy-paste prompts included.
      2. Founders average +$600/mo after implementing their fix pack.
      3. Your specific issues. Not generic advice. Yours.
    Logo: Nebula logo (1:1 square, 1200×1200px)
    Marketing images: Audit results screenshot (1.91:1, 1200×628px)
```

### Campaign 2: Search RLSA ($10/day)

```
Campaign name: Nebula — Search RLSA — Fix Pack
Campaign type: Search
Goal: Website traffic (no enough conversion data yet)
Bidding: Manual CPC → $3.00 max
Budget: $10/day

Ad Group 1: Landing Page Problems — Remarketing
  Audience: "Audit Results — Last 30 Days" (Targeting — not observation)
  Keywords (exact + phrase match):
    [landing page not converting]
    [landing page audit]
    "fix landing page conversion"
    "landing page conversion problems"
    "why is my landing page not converting"
    "landing page bounce rate fix"

  Responsive Search Ad:
    Headline 1: Your Landing Page Audit Is Ready
    Headline 2: Fix Your 3 Biggest Leaks — $97
    Headline 3: 30-Minute Implementation Guide
    Headline 4: Specific Fixes. Not Generic Advice.
    Headline 5: 847 Audits Analyzed — Yours Too
    Description 1: You've already seen your score. Your fix pack has the exact prompts to implement changes today. One-time $97.
    Description 2: Founders who implement their top fix average +$600/month recovered. Your issues. Your fixes. 30 min.

  Final URL: https://nebulacomponents.com/audit?utm_source=google&utm_medium=paid&utm_campaign=rlsa_search
```

---

## 4. Ad Copy — Responsive Search Ad Variants

### Variant 1: Problem-Aware (Default)

```
Headline pool (use all — Google rotates):
  Your Audit Results Are Ready
  Landing Page Losing You Money?
  Fix Your Top 3 Conversion Leaks
  $97 Fix Pack — 30 Minutes
  Specific Fixes For Your Page
  Not Converting? Here's Why
  847 Audits. Here's What Works.

Description pool:
  You saw your score. The fix pack has exact prompts to implement your top 3 changes today. One-time $97.
  Founders average +$600/mo recovered after implementing their specific fix pack. No dev needed.
  Your findings are specific to your page. Not generic tips — the exact copy and code prompts.
```

---

## 5. UTM Parameters

| Parameter | Value |
|-----------|-------|
| utm_source | `google` |
| utm_medium | `paid` |
| utm_campaign | `retarget_display` / `rlsa_search` |
| utm_content | `responsive_display` / `rsa_v1` |

**Final URL template** (set in campaign settings):
```
{lpurl}?utm_source=google&utm_medium=paid&utm_campaign={campaign}&utm_content={ad}
```

---

## 6. Bidding Strategy

**Weeks 1-2**: Manual CPC ($3 Search, $1.50 Display) — not enough conversion data for Smart Bidding
**Week 3+** (after 10+ conversions): Switch to Target CPA → $35
**Month 2+** (after 30+ conversions): Switch to Target ROAS → 250% ($2.50 revenue per $1 spent)

**Rule**: Never switch to Smart Bidding before 10 conversions in the lookback window — Google needs the data.

---

## 7. Daily Monitoring Checklist (10 min/day)

**Morning**:
- [ ] Spend pacing (on track for $30?)
- [ ] Any policy disapprovals (check Ads status column)
- [ ] Impressions delivered on Display (if 0 → audience too small)

**Afternoon**:
- [ ] CTR by campaign (Search: target 3%+, Display: target 0.5%+)
- [ ] Avg CPC (Search: under $4, Display: under $0.50)
- [ ] Conversions attributed (lag up to 24h normal)

**Weekly**:
- [ ] CPA vs $35 target
- [ ] Search impression share (below 50% = increase bid or budget)
- [ ] Display frequency (above 5× per user = expand audience)
- [ ] Search term report (add negative keywords for irrelevant queries)

---

## 8. Negative Keywords (Add Before Launch)

Prevent wasted spend on non-buyers:

```
jobs
career
free
template download
course
tutorial
how to code
wordpress plugin
shopify app
[competitor names]
```

Add to: All Search campaigns → Negative Keywords tab

---

## 9. Kill / Pause Criteria

| Trigger | Action |
|---------|--------|
| Search CTR below 2% after $30 spend | Rewrite headlines, test new variants |
| Display CTR below 0.3% after $30 spend | Replace creative, test new images |
| CPA above $70 after 5 conversions | Pause worst ad group, review audience |
| Zero conversions after $100 spend | Full review — landing page or tracking issue |
| Search CPC above $8 consistently | Reduce bids, focus on exact match only |

---

## 10. Expected Metrics

### Display Remarketing

| Metric | Conservative | Realistic | Best Case |
|--------|-------------|-----------|-----------|
| CPM | $4 | $3 | $2 |
| CTR | 0.3% | 0.5% | 0.8% |
| CPC | $1.33 | $0.60 | $0.25 |
| CVR | 5% | 8% | 12% |
| CPA | $27 | $7.50 | $2 |
| Monthly purchases ($20/day) | 22 | 80 | 300 |

### Search RLSA

| Metric | Conservative | Realistic | Best Case |
|--------|-------------|-----------|-----------|
| CTR | 3% | 5% | 8% |
| CPC | $4 | $2.50 | $1.50 |
| CVR | 8% | 12% | 18% |
| CPA | $50 | $21 | $8 |
| Monthly purchases ($10/day) | 6 | 14 | 37 |

**Combined ROAS (realistic)**: ~4× ($120/day ad spend → ~$480/day revenue at scale)

---

## Launch Checklist

- [ ] Google Tag verified firing on audit results page
- [ ] Conversion action set up: `Fix Pack Purchase` ($97)
- [ ] Remarketing list `Audit Results — 30 Days` has 100+ users (Display) or 100+ (Search)
- [ ] Exclusion list `Fix Pack Purchasers` created
- [ ] Display campaign created, responsive ad uploaded
- [ ] Search RLSA campaign created, all keywords added
- [ ] Negative keywords added to Search campaign
- [ ] UTM params in all final URLs
- [ ] Billing method active in Google Ads
- [ ] Daily budget alert: notify at $35 spend

**Activation time**: ~60 minutes from zero to launched
