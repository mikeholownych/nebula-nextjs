# PostHog Analytics Dashboard Setup

**Status**: Phase 1B - Ready for deployment  
**Created**: Aug 9 2026  

---

## Dashboard 1: Daily Conversion Funnel

### Events to Capture

```javascript
// Audit started
posthog.capture('audit_started', {
  utm_source: getUTMParam('source') || 'direct',
  utm_medium: getUTMParam('medium') || 'organic',
  utm_campaign: getUTMParam('campaign') || 'free_audit',
  domain: userDomain,
  timestamp: new Date().toISOString()
})

// Results viewed
posthog.capture('results_viewed', {
  utm_source: getUTMParam('source'),
  score: auditScore,
  finding_count: findings.length,
  grade: computeGrade(auditScore),
  timestamp: new Date().toISOString()
})

// Fix pack CTA clicked
posthog.capture('fix_pack_cta_clicked', {
  utm_source: getUTMParam('source'),
  amount: 97,
  placement: 'results_page',
  timestamp: new Date().toISOString()
})

// Checkout started
posthog.capture('checkout_started', {
  utm_source: getUTMParam('source'),
  amount: 97,
  product_type: 'fix_pack',
  timestamp: new Date().toISOString()
})
```

### SQL Query: Daily Funnel

```sql
SELECT
  DATE(timestamp) as date,
  COUNT(DISTINCT user_id) as audits_started,
  COUNT(DISTINCT CASE WHEN event = 'results_viewed' THEN user_id END) as results_viewed,
  COUNT(DISTINCT CASE WHEN event = 'fix_pack_cta_clicked' THEN user_id END) as fix_pack_clicked,
  COUNT(DISTINCT CASE WHEN event = 'checkout_started' THEN user_id END) as checkout_started,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN event = 'checkout_started' THEN user_id END) /
    COUNT(DISTINCT user_id),
    2
  ) as conversion_rate_pct
FROM events
WHERE DATE(timestamp) >= CURRENT_DATE - INTERVAL 30 DAY
GROUP BY DATE(timestamp)
ORDER BY date DESC
```

### Dashboard View

```
┌─────────────────────────────────────────────────────┐
│ Daily Conversion Funnel (Last 30 Days)              │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Date    │ Audits │ Results │ CTA Click │ Checkout   │
│ Aug 12  │   45   │   38    │    12     │     3      │
│ Aug 11  │   38   │   32    │    10     │     2      │
│ Aug 10  │   52   │   41    │    15     │     4      │
│ ...     │   ...  │   ...   │    ...    │    ...     │
│                                                     │
│ Conversion Rate: 8.2% (audits → checkout)           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Dashboard 2: Source Breakdown

### SQL Query: Revenue by Source

```sql
SELECT
  utm_source,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT CASE WHEN event = 'audit_started' THEN user_id END) as audits,
  COUNT(DISTINCT CASE WHEN event = 'checkout_started' THEN user_id END) as purchases,
  COUNT(DISTINCT CASE WHEN event = 'checkout_started' THEN user_id END) * 97 as revenue,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN event = 'checkout_started' THEN user_id END) /
    COUNT(DISTINCT CASE WHEN event = 'audit_started' THEN user_id END),
    2
  ) as conversion_rate_pct
FROM events
WHERE DATE(timestamp) >= CURRENT_DATE - INTERVAL 30 DAY
  AND utm_source IS NOT NULL
GROUP BY utm_source
ORDER BY revenue DESC
```

### Dashboard View

```
┌───────────────────────────────────────────────────────┐
│ Revenue by Source (Last 30 Days)                      │
├───────────────────────────────────────────────────────┤
│                                                       │
│ Source      │ Audits │ Conv │ Revenue  │ Conv Rate   │
│ landing     │  234   │  18  │  $1,746  │   7.7%      │
│ newsletter  │  156   │  15  │  $1,455  │   9.6%      │
│ twitter     │   78   │   4  │   $388   │   5.1%      │
│ footer      │   45   │   3  │   $291   │   6.7%      │
│ direct      │   32   │   2  │   $194   │   6.3%      │
│ linkedin    │   21   │   1  │   $97    │   4.8%      │
│                                                       │
│ Total: 566 audits → 43 purchases → $4,171 revenue    │
│ Blended conversion rate: 7.6%                        │
│                                                       │
└───────────────────────────────────────────────────────┘
```

---

## Dashboard 3: Cohort View (Daily Cohorts)

### SQL Query: Cohort Trends

```sql
WITH cohorts AS (
  SELECT
    DATE(timestamp) as cohort_date,
    user_id,
    event,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY timestamp) as event_order
  FROM events
  WHERE event IN ('audit_started', 'checkout_started')
)
SELECT
  cohort_date,
  COUNT(DISTINCT CASE WHEN event = 'audit_started' THEN user_id END) as day_0_audits,
  COUNT(DISTINCT CASE WHEN event = 'checkout_started' AND event_order = 1 THEN user_id END) as day_0_checkouts,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN event = 'checkout_started' THEN user_id END) /
    COUNT(DISTINCT CASE WHEN event = 'audit_started' THEN user_id END),
    2
  ) as conversion_rate_pct
FROM cohorts
WHERE DATE(cohort_date) >= CURRENT_DATE - INTERVAL 30 DAY
GROUP BY cohort_date
ORDER BY cohort_date DESC
```

### Dashboard View

```
┌────────────────────────────────────────────┐
│ Daily Cohorts (Last 30 Days)               │
├────────────────────────────────────────────┤
│                                            │
│ Cohort   │ Audits │ Checkouts │ Conv %    │
│ Aug 12   │   45   │     3     │   6.7%    │
│ Aug 11   │   38   │     2     │   5.3%    │
│ Aug 10   │   52   │     4     │   7.7%    │
│ Aug 09   │   41   │     3     │   7.3%    │
│ ...      │  ...   │   ...     │   ...     │
│                                            │
│ Average conversion: 7.1%                   │
│ Best day: Aug 10 (7.7%)                    │
│                                            │
└────────────────────────────────────────────┘
```

---

## Dashboard 4: Attribution Table (Manual Tracking)

### Google Sheet Template

```
Date       | Source  | Medium    | Campaign  | Audits | Conv | Revenue | Conv % | Notes
-----------|---------|-----------|-----------|--------|------|---------|--------|----------
Aug 12     | footer  | link      | newsletter|   5    |  1   | $97     | 20%    | New
Aug 12     | landing | organic   | homepage  |  12    |  2   | $194    | 17%    | Strong
Aug 12     | twitter | social    | audit_share| 3     |  0   | $0      | 0%     | Weak
Aug 12     | direct  | unknown   | unknown   |  2     |  0   | $0      | 0%     | Investigate
```

---

## Implementation Tasks

### Task 1: Add PostHog Events to Code

**Files to update**:
- `customer-portal/app/audit/[id]/results/ResultsClient.tsx` → Add events for results_viewed, fix_pack_cta_clicked, checkout_started
- `platform_api/routes/stripe_webhook.py` → Add event for checkout_completed (Stripe)

### Task 2: Create PostHog Dashboards

1. Go to PostHog dashboard
2. Create 4 new dashboards (copy queries above)
3. Set refresh interval to 5 minutes (real-time-ish)
4. Pin to home

### Task 3: Daily Review Process

Create daily review:
- 8 AM ET: Check previous day's funnel
- Track: Audits started, conversion rate, revenue
- Identify: Top source, lowest source, biggest delta from average

---

## Success Criteria (By Aug 12)

- ✓ All events firing in PostHog
- ✓ 4 dashboards visible
- ✓ Daily funnel showing clean data
- ✓ Source breakdown calculated
- ✓ First day of data captured

---

**Status**: Configuration ready. Ready for implementation.
