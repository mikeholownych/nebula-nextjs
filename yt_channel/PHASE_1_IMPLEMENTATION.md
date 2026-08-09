# Marketing Machine Build: Phase 1 (TODAY - 3 DAYS)

**Start Date**: Aug 9, 2026  
**Phase 1 End**: Aug 12, 2026  
**Goal**: Attribution infrastructure live → All traffic tagged → Dashboard visible  

---

## **PHASE 1A: UTM TAGGING (2-3 hours)**

### Task: Add UTM parameters to every traffic source

#### Newsletter Links
**File**: `customer-portal/app/newsletter/page.tsx`

Add UTM to email signup form:
```html
<form action="/api/newsletter/subscribe?utm_source=newsletter&utm_medium=email&utm_campaign=weekly">
  <!-- existing form fields -->
</form>
```

Add to footer newsletter link:
```html
<a href="/newsletter?utm_source=footer&utm_medium=link&utm_campaign=newsletter">Newsletter</a>
```

#### Social Share Buttons
**Files**:
- `customer-portal/app/audit/[id]/results/ResultsClient.tsx` (audit results page)
- `yt_channel/newsletter_templates.py` (newsletter footer)

For audit share button:
```tsx
// Twitter share
const twitterShare = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(`https://nebulacomponents.com/shared/audit-${auditId}?utm_source=twitter&utm_medium=social&utm_campaign=audit_share`)}`

// LinkedIn share
const linkedinShare = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://nebulacomponents.com/shared/audit-${auditId}?utm_source=linkedin&utm_medium=social&utm_campaign=audit_share`)}`
```

#### Landing Page CTAs
**File**: `customer-portal/app/page.tsx`

```html
<a href="/audit?utm_source=landing&utm_medium=organic&utm_campaign=homepage_hero">Free Audit</a>
<a href="/audit?utm_source=landing&utm_medium=organic&utm_campaign=homepage_cta">See Your Score</a>
```

#### YouTube Description
**File**: Video descriptions in all new uploads

```
Free audit: nebulacomponents.com/audit?utm_source=youtube&utm_medium=video&utm_campaign=[VIDEO_TITLE]
```

#### RB2B Pixel Capture
**File**: `platform_api/routes/lead_gen/rb2b_webhook.py`

Modify to capture UTM params:
```python
utm_source = request.query_params.get('utm_source', 'direct')
utm_medium = request.query_params.get('utm_medium', 'unknown')
utm_campaign = request.query_params.get('utm_campaign', 'unknown')

# Store in lead_state.db
INSERT INTO prospects (email, utm_source, utm_medium, utm_campaign, visited_at) 
VALUES (?, ?, ?, ?, ?)
```

---

## **PHASE 1B: ANALYTICS DASHBOARD (4-6 hours)**

### Dashboard 1: Daily Funnel

**Metrics to track**:
- Audits started (daily)
- Audits completed (daily, cumulative)
- Results page views (daily)
- $97 checkouts started (daily)
- $97 checkouts completed (daily)
- Revenue (daily, cumulative)

**PostHog Setup**:
```javascript
// Event 1: Audit started
posthog.capture('audit_started', {
  utm_source: utm.source,
  utm_medium: utm.medium,
  utm_campaign: utm.campaign,
  domain: formData.domain
})

// Event 2: Results viewed
posthog.capture('results_viewed', {
  utm_source: utm.source,
  score: auditScore,
  finding_count: findings.length
})

// Event 3: Checkout started
posthog.capture('checkout_started', {
  utm_source: utm.source,
  amount: 97
})

// Event 4: Checkout completed (via Stripe webhook)
posthog.capture('checkout_completed', {
  utm_source: utm.source,
  amount: 97,
  product_type: 'fix_pack'
})
```

**Query**: Get daily funnel
```sql
SELECT 
  DATE(event_timestamp) as date,
  COUNT(DISTINCT CASE WHEN event_name = 'audit_started' THEN user_id END) as audits_started,
  COUNT(DISTINCT CASE WHEN event_name = 'results_viewed' THEN user_id END) as results_viewed,
  COUNT(DISTINCT CASE WHEN event_name = 'checkout_completed' THEN user_id END) as checkouts,
  COUNT(DISTINCT CASE WHEN event_name = 'checkout_completed' THEN user_id END) * 97 as revenue
FROM events
WHERE event_timestamp >= NOW() - INTERVAL 30 DAY
GROUP BY DATE(event_timestamp)
ORDER BY date DESC
```

### Dashboard 2: Source Breakdown

**Query**: Revenue by source
```sql
SELECT 
  utm_source,
  COUNT(DISTINCT email) as unique_users,
  COUNT(*) as audit_count,
  SUM(CASE WHEN order_total > 0 THEN 1 ELSE 0 END) as purchases,
  SUM(order_total) as revenue,
  ROUND(100.0 * SUM(CASE WHEN order_total > 0 THEN 1 ELSE 0 END) / COUNT(*), 2) as conversion_rate
FROM prospects
WHERE utm_source IS NOT NULL
GROUP BY utm_source
ORDER BY revenue DESC
```

### Dashboard 3: Cohort View

**Query**: Daily cohort trends
```sql
SELECT 
  DATE(event_timestamp) as cohort_date,
  SUM(CASE WHEN event_name = 'audit_started' THEN 1 ELSE 0 END) as day0_audits,
  SUM(CASE WHEN event_name = 'checkout_completed' AND DATE(event_timestamp) = DATE(first_visit) THEN 1 ELSE 0 END) as day0_sales,
  SUM(CASE WHEN event_name = 'checkout_completed' AND DATEDIFF(day, first_visit, event_timestamp) = 1 THEN 1 ELSE 0 END) as day1_sales
FROM events
GROUP BY DATE(event_timestamp)
```

### Dashboard 4: Attribution Table

**Simple spreadsheet** (track manually first):

| Date | Source | Audits | Checkouts | Revenue | Conv Rate | Notes |
|------|--------|--------|-----------|---------|-----------|-------|
| Aug 10 | newsletter | 5 | 1 | $97 | 20% | Weekly send |
| Aug 10 | twitter | 3 | 0 | $0 | 0% | Audit share |
| Aug 10 | landing | 12 | 2 | $194 | 17% | Homepage |
| Aug 10 | direct | 2 | 1 | $97 | 50% | Unknown |

---

## **PHASE 1C: LEAD MAGNET CHECKLIST (3-4 hours)**

### Deliverable: "Top 10 Landing Page Mistakes Checklist"

**Format**: 1-page PDF, scannable

```
TOP 10 LANDING PAGE MISTAKES
(Costing you thousands in wasted ad spend)

☐ H1 doesn't match the ad your visitor clicked
☐ CTA button is below the fold on mobile
☐ No social proof above the fold
☐ Form asks for too much info upfront
☐ No clear value prop in first 3 seconds
☐ Weak reason to believe (no proof of claims)
☐ Mobile version doesn't work properly
☐ Copy uses "we" instead of "you"
☐ No urgency or scarcity signaling
☐ Trust signals missing (no testimonials/logos)

SCORE YOURSELF: __ out of 10 mistakes found

Get a free audit: [LINK with utm_source=magnet]
```

**Landing page**: `/landing-page-mistakes`
- Hero: "The 10 Mistakes Costing You Money"
- 2-3 bullet points
- Email capture form (Name + Email required)
- CTA: "Get the Checklist"

**Email sequence**:
1. Email 1 (immediate): Checklist PDF download link
2. Email 2 (day 1): Related article "How to fix each mistake"
3. Email 3 (day 3): "Free audit to check your site against all 10"

---

## **PHASE 1D: WEEKLY REVIEW RITUAL (1 hour)**

### Setup: Sunday 6 PM ET Weekly Review

**Calendar invite**:
- Title: "Weekly Marketing Machine Review"
- Time: Every Sunday 6 PM ET
- Duration: 30 minutes
- Attendees: Just you (founder)

**Template** (copy to Google Doc):

```
=== WEEKLY REVIEW: [DATE] ===

METRICS (Last 7 days):
  Audits: ___ (target: 20+)
  Checkouts: ___ (target: 2-5)
  Revenue: $___ (target: $200+)
  Newsletter signups: ___ (target: 10+)
  Audit shares: ___ (target: 2+)

SOURCES (% of revenue):
  Newsletter: __% ($___)
  Landing: __% ($___)
  Social: __% ($___)
  Direct: __% ($___)
  Other: __% ($___)

WHAT'S WORKING:
  • [Highest ROI source]
  • [Best converting CTA]
  • [Strongest magnet]

WHAT'S FAILING:
  • [Lowest ROI source]
  • [Highest bounce rate]
  • [Weakest email subject]

ONE CHANGE FOR NEXT WEEK:
  [One specific, measurable change to test]

ACTION ITEMS:
  1. [Implement change]
  2. [Monitor results]
  3. [Check next Sunday]
```

---

## **IMMEDIATE ACTIONS (RIGHT NOW)**

### Step 1: Create UTM Tracking Spreadsheet
**File**: `yt_channel/UTM_TRACKING_PLAN.md`

List every traffic source + its UTM params. Use this as reference while adding to code.

### Step 2: Modify 5 Key Files
1. `customer-portal/app/newsletter/page.tsx` → Add newsletter UTM
2. `customer-portal/app/page.tsx` → Add landing page UTM
3. `customer-portal/app/audit/[id]/results/ResultsClient.tsx` → Add social share UTM
4. `platform_api/routes/lead_gen/rb2b_webhook.py` → Capture UTM
5. YouTube description template → Add UTM

### Step 3: Build PostHog Events
Wire PostHog events to capture: utm_source, utm_medium, utm_campaign at each step

### Step 4: Create Dashboard
PostHog dashboard showing: daily funnel + source breakdown + cohort view

### Step 5: Create Checklist PDF
"Top 10 Landing Page Mistakes" → download page → email sequence

### Step 6: Schedule Weekly Review
Sunday 6 PM ET, every week, from now until Oct 31

---

## **DELIVERABLES BY EOD AUG 12**

- ✅ All 5 files updated with UTM parameters
- ✅ PostHog events configured
- ✅ Attribution dashboard visible
- ✅ Lead magnet landing page live
- ✅ Lead magnet email sequence set up
- ✅ Weekly review ritual scheduled
- ✅ Committed to main + deployed

---

## **SUCCESS CRITERIA**

By Aug 12:
- Every traffic source is tagged with UTM
- Dashboard shows daily funnel (audits → checkouts)
- Source breakdown visible (revenue by channel)
- Lead magnet live and capturing emails
- First weekly review scheduled for Aug 18

By Aug 19 (1 week later):
- Data flowing in
- Top 2 revenue sources identified
- Lowest ROI source identified
- First optimization decision made

By Aug 26 (2 weeks later):
- Patterns emerging
- First A/B test launched
- Lead magnet contribution measured

---

**Status**: Phase 1 starts now. No waiting for Sep 2. Ship by Aug 12.
