# Phase 3 — LinkedIn Cold Audience Runbook

**Status**: 📋 Ready to launch — awaiting budget approval  
**Budget**: $20/day  
**Audience**: Cold — founders running paid ads, 1–200 employees  
**Goal**: Drive free audit starts (feeds retarget pool → $97 purchase)  
**Primary KPI**: Cost per audit start (target: under $40)  
**Note**: LinkedIn does NOT directly produce purchases. It fills the retarget pool for Facebook/Google.

---

## 1. Pre-Launch: LinkedIn Insight Tag (15 min)

### Install Insight Tag

1. LinkedIn Campaign Manager → Account Assets → Insight Tag
2. Copy the tag snippet (JavaScript)
3. Add to Nebula site: `customer-portal/app/layout.tsx` — before `</body>`

```html
<script type="text/javascript">
_linkedin_partner_id = "YOUR_PARTNER_ID";
window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
window._linkedin_data_partner_ids.push(_linkedin_partner_id);
</script>
<script type="text/javascript">
(function(l) {
if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
window.lintrk.q=[]}
var s = document.getElementsByTagName("script")[0];
var b = document.createElement("script");
b.type = "text/javascript";b.async = true;
b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
s.parentNode.insertBefore(b, s);})(window.lintrk);
</script>
<noscript>
<img height="1" width="1" style="display:none;" alt=""
  src="https://px.ads.linkedin.com/collect/?pid=YOUR_PARTNER_ID&fmt=gif" />
</noscript>
```

### Set Up Conversion

Campaign Manager → Account Assets → Conversions → Create:
```
Conversion name: Free Audit Started
Conversion type: Lead
Post-click window: 30 days
Attribution model: Last touch
URL rule: URL contains /audit AND contains /results
  (fires when someone completes an audit)
```

---

## 2. Audience Targeting

### Primary Targeting (Job-Title Based — No Demographics)

```
Campaign Manager → Audiences → Create → Saved Audience

Name: "Founder ICP — Paid Ads Buyers"

Job Titles (include ALL of these):
  Founder
  Co-founder
  Chief Executive Officer
  Chief Marketing Officer
  Head of Growth
  VP of Marketing
  Growth Lead
  Director of Marketing
  Head of Demand Generation

Company Size:
  1-10 employees
  11-50 employees
  51-200 employees

Industries:
  Internet
  Computer Software
  Marketing and Advertising
  E-Commerce (via keyword targeting)
  Information Technology and Services

Member Skills (add for precision):
  Facebook Ads
  Google Ads
  Paid Advertising
  Digital Marketing
  Conversion Rate Optimization
  Landing Page Optimization

Geography: United States, Canada, United Kingdom, Australia
Language: English

EXCLUDE:
  - Retargeted site visitors (Website Audiences → All Site Visitors)
  - Job functions: Engineering, Finance, Legal
```

**Estimated audience size**: 200,000–600,000 people (healthy range)

---

## 3. Campaign Structure

```
Campaign Group: Nebula — Paid Amplification

Campaign: LI Cold — Founder ICP — Free Audit
  Objective: Website Visits
  LinkedIn Audience Network: OFF (keep on LinkedIn only)
  Budget: $20/day (daily budget)
  Schedule: Start immediately, no end date
  Bid type: Maximum Delivery (let LinkedIn optimize delivery first)

  Ad Format: Single Image Ad

  Ad 1A: Pain-Aware
  Ad 1B: Curiosity
  Ad 1C: Authority
```

**After 2 weeks**: Switch to Manual CPC bidding at $6/click once you know average CPC.

---

## 4. Ad Copy (3 Variants)

### Variant A: Pain-Aware (Launch First)

**Intro text** (150 chars max):
> Running paid ads but not seeing conversions?
> Most founders have 3-5 fixable issues on their landing page. Find yours in 90 seconds.

**Headline** (70 chars max):
> Free Landing Page Audit — 90 Seconds

**Description** (70 chars max):
> See exactly what's costing you conversions

**CTA button**: Learn More

**Destination**: `https://nebulacomponents.com/audit?utm_source=linkedin&utm_medium=paid&utm_campaign=cold_pain_aware`

---

### Variant B: Curiosity / Data

**Intro text**:
> We analyzed 847 landing pages running paid ads.
> 
> 94% had at least one issue costing them $500+ per month.
> 
> Run a free audit on yours. Takes 90 seconds.

**Headline**: What's Your Landing Page Score?

**Description**: 847 audits. Most sites score under 5/10.

**CTA button**: Learn More

**Destination**: `https://nebulacomponents.com/audit?utm_source=linkedin&utm_medium=paid&utm_campaign=cold_curiosity`

---

### Variant C: Authority / Specific

**Intro text**:
> The #1 finding across 847 landing page audits:
> 
> H1 doesn't match the ad headline.
> 
> This one issue causes 12%+ bounce rate increase.
> 
> Check if your page has it → free audit, no email required.

**Headline**: Is Your H1 Killing Your Conversions?

**Description**: Free audit. See your score in 90 seconds.

**CTA button**: Learn More

**Destination**: `https://nebulacomponents.com/audit?utm_source=linkedin&utm_medium=paid&utm_campaign=cold_authority`

---

## 5. Creative Specs

| Spec | Value |
|------|-------|
| Image size | 1200×627px |
| File type | JPG or PNG |
| File size | Max 5MB |
| Aspect ratio | 1.91:1 |
| Text overlay | Keep minimal — LinkedIn penalizes text-heavy images |

**Recommended creative**: Clean screenshot of audit results UI (score 4/10, findings listed) with minimal branding. Authentic product screenshots outperform designed graphics on LinkedIn.

**Avoid**: Stock photos, generic business imagery, fake testimonials.

---

## 6. UTM Parameters

| Parameter | Value |
|-----------|-------|
| utm_source | `linkedin` |
| utm_medium | `paid` |
| utm_campaign | `cold_pain_aware` / `cold_curiosity` / `cold_authority` |
| utm_content | `single_image_a` / `single_image_b` / `single_image_c` |

---

## 7. Daily Monitoring Checklist (5 min/day)

**Morning**:
- [ ] Spend pacing ($20 target)
- [ ] Any policy rejections? (Campaign Manager → Ads → status)
- [ ] Impressions delivered?

**Afternoon**:
- [ ] CTR: above 0.4%? Below = swap creative
- [ ] CPC: below $8? Above = reduce bid or narrow audience
- [ ] Audit starts attributed to LinkedIn (PostHog → `/api/crm/sources`)

**Weekly**:
- [ ] CPL (cost per audit start) vs $40 target
- [ ] Which variant has highest CTR? Pause the other two.
- [ ] Are LinkedIn audit starters entering Facebook/Google retarget pool?

---

## 8. Pause / Kill Criteria

| Trigger | Action |
|---------|--------|
| CTR below 0.4% after $40 spend | Pause ad, new creative next week |
| CPL above $60 after 10 audit starts | Narrow audience (remove lower-relevance job titles) |
| Zero audit starts after $60 spend | Full review — check UTM tracking, landing page |
| CPC above $12 consistently | Switch to Manual CPC at $6 |
| Ad rejected by LinkedIn | Revise copy (common trigger: superlatives, "best", "guaranteed") |

---

## 9. LinkedIn-Specific Rules

1. **No demographic targeting**: Age and gender targeting increases CPM without improving quality. Stick to job title + company size + skills only.

2. **No LinkedIn Audience Network**: LAN extends reach to third-party sites with much lower quality. Keep it on LinkedIn only.

3. **Frequency cap**: LinkedIn auto-applies frequency caps. If CPM spikes after week 2, audience is saturating — expand or pause 2 weeks.

4. **Creative fatigue**: LinkedIn audiences are small. Rotate fresh creative every 3-4 weeks.

5. **Lead Gen Forms vs Website Visits**: Native LinkedIn Lead Gen Forms have higher conversion rates but collect email only. Use Website Visits to drive actual audits (more qualified signal).

---

## 10. Expected Metrics

| Metric | Conservative | Realistic |
|--------|-------------|-----------|
| CPM | $45 | $30 |
| CTR | 0.4% | 0.6% |
| CPC | $11 | $5 |
| CVR (click → audit start) | 15% | 25% |
| Cost per audit start | $73 | $20 |
| Monthly audit starts at $20/day | 8 | 30 |
| Of those, % who enter retarget pool | 100% | 100% |
| Of retarget pool, % who purchase (via FB) | 5% | 8% |
| **Indirect purchases/month** | **0.4** | **2.4** |

**Key takeaway**: LinkedIn's value is the retarget pool it builds, not direct purchases. At $20/day, expect 8-30 new qualified founders entering your Facebook/Google retarget audience each month. Those people are worth $3-10 each (blended retarget CPA), making LinkedIn's effective CPL $2-7 when measured against the full funnel.

---

## Integration With Retarget Pool

Every LinkedIn audit start:
1. Lands on `/audit` with `utm_source=linkedin`
2. Runs audit → recorded in `audits.utm_source = 'linkedin'`
3. Views results → Meta Pixel fires `PageView` on results URL
4. Enters Facebook's "Audit Results — Last 30 Days" audience
5. Gets retargeted by Facebook/Google within 24 hours

**Track this**: `GET /api/crm/sources` will show LinkedIn-attributed audits. Facebook retarget pool size visible in Meta Audiences Manager.

---

## Launch Checklist

- [ ] LinkedIn Insight Tag installed and firing (verify in Campaign Manager → Insight Tag)
- [ ] Conversion: `Free Audit Started` set up
- [ ] Saved Audience created (job titles + company size + skills, exclude site visitors)
- [ ] Campaign created: Website Visits, $20/day
- [ ] All 3 ads uploaded, Ad 1A set as primary
- [ ] UTM params in all destination URLs
- [ ] LinkedIn Campaign Manager billing active
- [ ] Spend alert set at $25/day (overspend protection)

**Activation time**: ~45 minutes from zero to launched
