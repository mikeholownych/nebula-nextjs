# Nebula Membership Plans - Product Architecture
## Status: APPROVED (Mike, Aug 4 2026) - pricing $29/$79/$199 confirmed, free tier = 1 audit/mo, PH discount = launch week

**Decisions locked:**
1. Pricing: Pro $29/mo·$290/yr, Growth $79/mo·$790/yr, Agency $199/mo·$1,990/yr ✅
2. Free tier: 1 audit/month ✅
3. PH discount: **launch week (Sep 2-9)** - rationale: PH traffic tail runs 3-5 days post-launch; day-only windows leave the long-tail visitors at full price and convert worse. Week window with visible end date + Stripe max_redemptions cap preserves urgency.

---

## Pricing Model

| Tier | Price | Billing | Core Value |
|------|-------|---------|------------|
| **Free** | $0 | - | 1 audit/month, 9-signal score + grade, top-line findings |
| **Pro** | $29/mo or $290/yr (save 17%) | Recurring | Unlimited audits, full reports, monitoring, historical comparisons |
| **Growth** | $79/mo or $790/yr (save 17%) | Recurring | Everything in Pro + multi-page, team seats, priority support, API access |
| **Agency** | $199/mo or $1,990/yr (save 17%) | Recurring | Everything in Growth + client workspaces, unlimited white-label, reseller margin |
| **One-Leak Kit** | $97 | One-time | Tailored implementation kit for one finding (existing offer, unchanged) |

---

## Tier Breakdown

### Free (current state, codified)
- 1 audit per month per email
- 9-signal score + letter grade
- Top 3 findings (summary only)
- Email unlock required for full report
- 7-day result retention
- No monitoring, no historical data

### Pro - $29/mo | $290/yr
**For**: Solo founders running ads who need ongoing conversion visibility

**Includes**:
- Unlimited audits (fair use: 20/mo)
- Full signal reports with evidence
- Page monitoring (weekly re-scan, alerts on score drops)
- Historical score tracking (trend charts)
- Before/after comparison on re-audits
- 30-day audit result retention → permanent for subscribers
- Priority audit queue (faster processing)
- Exportable PDF reports
- Email support

### Growth - $79/mo | $790/yr
**For**: Agencies, multi-product founders, growth teams

**Includes everything in Pro, plus**:
- Multi-page audits (up to 10 URLs per workspace)
- Team seats (up to 5 members)
- White-label PDF reports (custom logo/branding)
- API access (programmatic audits)
- Competitor page monitoring (track 3 competitor URLs)
- Priority support (24h response)
- Custom scoring weights (emphasize signals that matter to your vertical)
- Bulk audit CSV import/export

### One-Leak Repair Sprint - $97 one-time
**Unchanged from current offer. Available to any tier.**
- Works with or without a subscription
- Audit-bound (requires completed audit)
- One finding, one tailored fix, one re-audit
- Natural upsell from Free → paid after seeing the audit results

### Agency - $199/mo | $1,990/yr
**For**: Agencies auditing client pages as a service; freelance CRO consultants

**Includes everything in Growth, plus**:
- Client workspaces (up to 25 separate client organizations, isolated data)
- Unlimited monitored URLs across client workspaces
- Unlimited team seats
- Full white-label: custom domain for shared reports (reports.youragency.com), agency logo, zero Nebula branding
- Client-facing shareable dashboards with agency branding
- Reseller rights: bundle audits into your own retainers at your price
- Kit reseller margin: buy One-Leak Kits at $67 (30% off), resell at your rate
- Dedicated onboarding call
- Priority support (same-day response)

**Positioning note**: This supersedes the legacy $497 one-time "agency partner" Stripe link. That link should be deactivated when Agency tier goes live - recurring at $199/mo ($2,388/yr) captures far more LTV than a $497 one-off, and white-label monitoring is the retention hook.

---

## Strategic Rationale

### Why add recurring plans now
1. **Revenue predictability** - $97 one-time purchases don't compound; MRR does
2. **PH launch pricing** - "Launch special: first year at $290" is a proven PH conversion driver
3. **Retention through monitoring** - founders who see weekly score alerts don't churn
4. **Upsell ladder** - Free audit → $29/mo monitoring → $97 kit when they find a leak → $79/mo when they have multiple pages

### How the $97 kit fits
The kit is an **add-on** available at any tier, not a replacement for the subscription:
- Free user: sees audit results → buys $97 kit for one fix
- Pro user: monitors pages, spots a regression → buys $97 kit for expert implementation guidance
- Growth user: may buy multiple kits for different pages/clients

### Annual discount logic
- 17% discount (2 months free) is standard SaaS
- Annual upfront cash improves runway
- From the Honcho memory: "22% of new subscribers chose annual billing" is a realistic conversion rate

---

## Implementation Requirements

### Stripe Products to Create
1. `nebula-pro-monthly` - $29/mo recurring
2. `nebula-pro-annual` - $290/yr recurring
3. `nebula-growth-monthly` - $79/mo recurring
4. `nebula-growth-annual` - $790/yr recurring
5. `nebula-agency-monthly` - $199/mo recurring
6. `nebula-agency-annual` - $1,990/yr recurring
7. Existing: `one-leak-kit` - $97 one-time (already live)
8. DEACTIVATE: legacy $497 one-time agency partner link (superseded by Agency tier)

### Database Changes
- `subscriptions` table: `id, customer_id, stripe_subscription_id, plan, status, current_period_start, current_period_end, created_at`
- `workspace` extended with: `plan` (free/pro/growth/agency), `audit_quota`, `team_seats`
- `client_workspaces` table (Agency tier): `id, parent_org_id, client_name, created_at` - isolated audit/monitoring data per client
- Existing `purchases` table unchanged (one-time kits)

### Feature Gating
- Middleware checks subscription status on protected routes
- Audit creation checks quota (free: 1/mo, pro: 20/mo, growth: unlimited, agency: unlimited across client workspaces)
- Monitoring cron only runs for active subscribers
- PDF export/API endpoints gated to appropriate tier
- White-label report rendering: growth = logo swap; agency = full custom domain + zero Nebula branding

### Webhook Events to Handle
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### Pricing Page Redesign
Current: single $97 offer
New: 4-column pricing grid (Free / Pro / Growth / Agency) + "Need one fix? $97 kit" section below. Growth marked "Most popular"; Agency links to a short qualification page (/agency-partner) with the onboarding-call CTA.

---

## PH Launch Pricing Strategy

**Launch special (Sep 2 only)**:
- Pro annual: ~~$290~~ → $197 (first year, 32% off)
- Growth annual: ~~$790~~ → $497 (first year, 37% off)
- Agency annual: ~~$1,990~~ → $1,490 (first year, 25% off)
- Create limited coupon codes in Stripe with `max_redemptions`

**Why this works on PH**:
- Time pressure (launch day only)
- Discount anchored to visible regular price
- Annual locks in retention through the critical first year
- PH audience expects a deal

---

## Revenue Projections (conservative)

| Month | Free users | Pro ($29) | Growth ($79) | Agency ($199) | Kits ($97) | MRR |
|-------|-----------|-----------|-------------|--------------|-----------|-----|
| 1 (launch) | 200 | 15 | 3 | 1 | 5 | $871 |
| 3 | 500 | 30 | 8 | 2 | 8 | $1,900 |
| 6 | 1,000 | 50 | 15 | 4 | 12 | $3,431 |
| 12 | 2,000 | 80 | 25 | 7 | 15 | $5,688 |

Assumes:
- 5-8% free→paid conversion
- 15% monthly churn on monthly plans
- 5% annual churn
- Kit purchases are sporadic add-ons
- Agency: 1-2 signups/quarter from partner outreach + PH; lowest volume, highest LTV (~$2,400/yr each)

---

## Implementation Priority

1. **Stripe products + pricing page** (Week 1: Aug 4-8)
2. **Subscription webhook handling** (Week 1: Aug 4-8)
3. **Database schema + feature gating** (Week 2: Aug 11-15)
4. **Page monitoring infrastructure** (Week 2: Aug 11-15)
5. **PDF export + historical tracking** (Week 3: Aug 18-22)
6. **API access for Growth tier** (Week 3: Aug 18-22)
7. **PH launch special coupons** (Aug 25)
8. **QA + production deploy** (Aug 28-29)

This gives us the full subscription product live by **Aug 29** - 4 days before PH launch.

---

## Open Questions for Mike

1. **Pricing feel right?** $29/$79 or should we go $19/$49 or $39/$99?
2. **Annual discount**: 17% (2 months free) or 20% (aggressive PH conversion)?
3. **Free tier quota**: 1 audit/month or 3 audits/month?
4. **Growth tier team seats**: 5 included or 3 included + $10/seat?
5. **White-label reports**: Growth only or available as Pro add-on ($10/mo)?
6. **API rate limits for Growth**: 100 audits/day? 500?
7. **PH launch discount**: one-day only or first-week?
8. **Agency at $199/mo**: right price vs $149 or $249? (Anchor: legacy one-time was $497)
9. **Agency client workspace cap**: 25 clients or unlimited?
10. **Kit reseller discount for Agency**: 30% off ($67) or 50% off ($48)?
