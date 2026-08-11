# Nebula Marketing Machine - System Documentation Index

**Version**: 1.0.0
**Last Updated**: Aug 9, 2026
**Status**: Phase 1 ✅ | Phase 2 ✅ | Phase 3 📋 (documented, awaiting budget approval)

---

## What This Is

Nebula's marketing machine converts founders with broken landing pages into paying customers - automatically, repeatably, and measurably. It has three layers:

1. **Attribution** - Every visitor, audit, and purchase is tagged by source so you know what works
2. **CRM** - Prospects, purchases, objections, and newsletter engagement in one PostgreSQL DB
3. **Amplification** - Paid channels ready to activate when budget is approved

---

## Architecture Overview

```
TRAFFIC SOURCES
    │
    ├── Organic (Landing page, Footer, Direct)
    ├── Newsletter (Weekly sends, Monday 8 AM ET)
    ├── Lead Magnet (/landing-page-mistakes)
    ├── YouTube (Video descriptions with UTM)
    └── Paid (PHASE 3 - ready to activate)
              │
              ▼
    UTM CAPTURE LAYER
    • utm_source / utm_medium / utm_campaign
    • First-touch preserved on customers table
    • Every audit records UTM at creation time
              │
              ▼
    FREE AUDIT (/audit)
    • Score 0-10 (red anchoring)
    • 14 buyer psychology principles applied
    • Before/after proof layer
    • $97 fix pack CTA
              │
         ┌────┴────┐
         │         │
    PURCHASED    NOT PURCHASED
         │         │
         ▼         ▼
  DELIVERY FLOW  CRM NURTURE
  (4 emails,     (newsletter,
  30-day re-audit lead magnet,
  upsell to Pro)  retargeting)
         │
         ▼
    POSTGRESQL CRM (nebula_audit DB)
    • customers       - lifecycle + UTM + LTV
    • audits          - all audits + UTM
    • purchases       - Stripe purchases
    • crm_feedback    - objections/wins/churn
    • newsletter_subscribers - engagement tracking
    • crm_weekly_reviews     - Sunday reviews
         │
         ▼
    ATTRIBUTION DASHBOARDS
    GET /api/crm/funnel    - daily conversions
    GET /api/crm/sources   - revenue by UTM
    GET /api/crm/objections/summary
```

---

## File Map

### Production Code

| File | Purpose | Status |
|------|---------|--------|
| `customer-portal/app/newsletter/page.tsx` | Newsletter signup page with UTM capture | ✅ Live |
| `customer-portal/app/landing-page-mistakes/page.tsx` | Lead magnet landing page | ✅ Live |
| `customer-portal/components/Footer.tsx` | Footer with UTM-tagged newsletter link | ✅ Live |
| `platform_api/services/crm.py` | Core CRM service (asyncpg, PostgreSQL) | ✅ Live |
| `platform_api/routes/newsletter.py` | Newsletter API endpoints | ✅ Live |
| `platform_api/routes/crm.py` | CRM attribution/feedback API | ✅ Live |
| `platform_api/main.py` | FastAPI app - routes mounted at /api | ✅ Live |

### Database (nebula_audit PostgreSQL)

| Table | Purpose | New Columns Added |
|-------|---------|----------|
| `audits` | All audits | utm_source, utm_medium, utm_campaign, referrer_url |
| `customers` | Prospect lifecycle | utm_source/medium/campaign, crm_status, lifetime_value_cents, audit_count, last_score |
| `purchases` | Stripe purchases | (existing) |
| `crm_feedback` | Objections, wins, churn | (new table) |
| `newsletter_subscribers` | Email list + engagement | (new table) |
| `crm_weekly_reviews` | Sunday review log | (new table) |

### Documentation

| File | Purpose |
|------|---------|
| `yt_channel/PHASE_1_COMPLETE.md` | Phase 1 attribution infrastructure |
| `yt_channel/PHASE_2_KICKOFF.md` | Phase 2 CRM strategy |
| `yt_channel/POSTHOG_DASHBOARD_CONFIG.md` | PostHog SQL queries + dashboard setup |
| `yt_channel/LEAD_MAGNET_EMAIL_SEQUENCE.md` | 3-email nurture flow |
| `yt_channel/WEEKLY_REVIEW_RITUAL.md` | Sunday review process |
| `yt_channel/WORD_OF_MOUTH_STRATEGY.md` | K-factor + shareability mechanics |
| `yt_channel/MARKETING_MACHINE_AUDIT.md` | 7-pillar gap analysis |
| `yt_channel/PHASE_3_PLAYBOOK.md` | Paid ads - master playbook |
| `yt_channel/PHASE_3_FACEBOOK.md` | Facebook/Meta retargeting runbook |
| `yt_channel/PHASE_3_GOOGLE.md` | Google Ads retargeting runbook |
| `yt_channel/PHASE_3_LINKEDIN.md` | LinkedIn cold audience runbook |

---

## API Reference

### Newsletter

```
POST /api/newsletter/subscribe
  Body: { email, name?, role?, utm_source?, utm_medium?, utm_campaign? }
  Returns: { success, message, subscriber_id }

POST /api/newsletter/unsubscribe
  Query: ?email=...
  Returns: { success, message }

GET  /api/newsletter/subscribers/count
  Returns: { total_subscribers }
```

### CRM Attribution

```
GET  /api/crm/funnel?days=30
  Returns: { days, rows: [{ day, audits_started, audits_completed,
             results_viewed, checkouts, revenue_cents }] }

GET  /api/crm/sources
  Returns: { sources: [{ utm_source, unique_customers, audits,
             purchases, revenue_cents, conversion_rate_pct }] }
```

### CRM Feedback

```
POST /api/crm/feedback
  Body: { customer_email, interaction_type, objection_reason?,
          source?, notes?, follow_up_at? }
  Returns: { success, id }

POST /api/crm/feedback/{id}/resolve
  Body: { resolution_type, outcome }

GET  /api/crm/objections
  Returns: { open_objections: [...] }

GET  /api/crm/objections/summary
  Returns: { summary: [{ reason, frequency, resolved_count, won_count }] }
```

### CRM Weekly Review

```
POST /api/crm/weekly-review
  Body: { week_starting (date), one_change_text, one_change_metric, notes? }
  Returns: { success, review: { audits_count, checkouts_count,
             revenue_cents, newsletter_signups, conversion_rate_pct, ... } }
```

---

## UTM Convention

All traffic sources use this consistent UTM schema:

| Source | utm_source | utm_medium | utm_campaign |
|--------|-----------|------------|--------------|
| Homepage CTA | `landing` | `organic` | `homepage_hero` |
| Footer newsletter link | `footer` | `link` | `newsletter` |
| Newsletter email | `newsletter` | `email` | `weekly_[date]` |
| Lead magnet page | `magnet` | `content` | `mistakes_checklist` |
| Magnet → audit CTA | `magnet` | `content` | `mistakes_to_audit` |
| YouTube video | `youtube` | `video` | `[video_slug]` |
| Facebook retargeting | `facebook` | `paid` | `retarget_audit_visitors` |
| Google retargeting | `google` | `paid` | `retarget_audit_visitors` |
| LinkedIn cold | `linkedin` | `paid` | `cold_audit_offer` |
| Twitter/X share | `twitter` | `social` | `audit_share` |

---

## Operational Cadence

| Frequency | What | Who/What |
|-----------|------|----------|
| Daily | Check PostHog funnel dashboard | Mike |
| Monday 8 AM ET | Newsletter send (weekly finding) | Cron job |
| Tuesday AM | Review feedback table (new objections) | Mike |
| Sunday 6 PM ET | Weekly 30-min review ritual | Mike |
| Aug 18 | First weekly review (6 days of data) | Mike |
| Sep 2 | Product Hunt launch + lead gen activation | Mike |
| Sep 30 | Go/No-Go gate (revenue + attribution + testimonials) | Mike |

---

## Phase 3 Activation Checklist

When budget is approved, activate in this order:

```
Day 1 (Facebook):
  □ Verify Meta Pixel is firing on /audit/*/results (check Events Manager)
  □ Create Custom Audience: "Visited /audit results in last 30 days"
  □ Exclude: "Purchased fix pack" (Custom Conversion audience)
  □ Create campaign per PHASE_3_FACEBOOK.md
  □ Budget: $50/day
  □ Monitor for 48h before adjusting

Day 3 (Google):
  □ Verify Google Tag is on site (check Tag Assistant)
  □ Create Remarketing List: "Visited /audit/*/results"
  □ Create campaign per PHASE_3_GOOGLE.md
  □ Budget: $30/day

Day 5 (LinkedIn):
  □ Create LinkedIn Insight Tag on site
  □ Define Matched Audience: page visitors
  □ Create campaign per PHASE_3_LINKEDIN.md
  □ Budget: $20/day

Total: $100/day ($3,000/month)
Expected ROAS: 1.5-3× ($4,500-9,000/month revenue at scale)
Break-even: 31 purchases/month ($97 × 31 = $3,007)
```

---

## Success Metrics (Sep 30 Go/No-Go Gate)

| Metric | Minimum | Target |
|--------|---------|--------|
| Total revenue (Sep 2-30) | $150 | $500+ |
| Attributed signups (organic) | 3 | 10+ |
| Newsletter subscribers | 20 | 100+ |
| Top revenue source identified | ✓ | ✓ |
| Repeat purchases / Pro subs | 1 | 3+ |
| Testimonials captured | 1 | 3+ |
| Open objections resolved | 50% | 80% |

If 4+ metrics hit target → Scale Phase 3 (activate paid ads, raise budget).
If <3 metrics → Diagnose bottleneck, iterate before scaling.

---

## Connection Details

```
PostgreSQL:
  DB: nebula_audit
  Host: /var/run/postgresql (unix socket)
  Port: 5433
  User: postgres
  ENV: AUDIT_DATABASE_URL=postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433

Platform API:
  Host: 127.0.0.1:8001
  Process: .venv/bin/python3 -m uvicorn platform_api.main:app --host 127.0.0.1 --port 8001

Next.js:
  Service: nebula-nextjs (systemd)
  Restart: sudo systemctl restart nebula-nextjs
```
