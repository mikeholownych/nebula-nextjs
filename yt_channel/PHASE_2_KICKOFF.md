# Phase 2: CRM + Feedback Loop (Aug 13-15, 2026)

**Goal**: Establish sales/marketing feedback loop via Airtable CRM  
**Timeline**: 3 days (Aug 13-15)  
**Effort**: 6-8 hours total  
**Impact**: Link every prospect to their source, objections, outcomes

---

## Why Phase 2 Now (Not Sep 2)?

**Phase 1** gave you data: "Newsletter converts 9.6% vs landing 7.2%"

**Phase 2** tells you why: "Newsletter subscribers who object to price are X. Newsletter subscribers who buy are Y. Newsletter subscribers who churn are Z."

Without Phase 2:
- High conversion rate looks good
- But you don't know which subscribers become repeat customers
- You don't know which objections actually kill deals
- You can't segment + remarket effectively

With Phase 2:
- Data flows from Stripe (checkout) → Airtable
- Data flows from email opens → Airtable
- Weekly objections logged (sales calls, support email)
- Cohort analysis: "Newsletter + pro subscribers have 40% repeat rate vs 10% for landing"

---

## Phase 2 Deliverables

### 1. Airtable CRM Setup

**Database**: Nebula Components CRM  
**Tables**: 4

#### Table 1: Prospects

```
Fields:
  • prospect_id (primary key, auto)
  • email (required, unique)
  • first_name
  • last_name
  • company (optional)
  • job_title (optional)
  • utm_source (from audit)
  • utm_medium (from audit)
  • utm_campaign (from audit)
  • first_audit_date
  • audit_score (0-10)
  • finding_count
  • status (cold → interested → purchased → pro → churn)
  • last_contact_date
  • notes
  • created_at
```

#### Table 2: Checkouts (Purchases)

```
Fields:
  • checkout_id (primary key)
  • email (linked to Prospects)
  • amount (97 for fix pack, 29/79/199 for subscriptions)
  • product_type (fix_pack, pro_monthly, growth_monthly, etc.)
  • checkout_date
  • completed_date
  • utm_source (from checkout)
  • payment_status (completed, failed, refunded)
  • repeat_purchase (yes/no)
  • customer_lifetime_value
```

#### Table 3: Feedback (Objections + Wins)

```
Fields:
  • feedback_id (primary key)
  • email (linked to Prospects)
  • interaction_type (objection, win, churn, question)
  • objection_reason (too expensive, not sure it works, no time, etc.)
  • source (support email, sales call, live chat)
  • date_logged
  • resolved (yes/no)
  • resolution_type (price discount, proof/demo, followup, etc.)
  • outcome (closed/won, closed/lost, nurturing, etc.)
  • notes
```

#### Table 4: Newsletter (Email Engagement)

```
Fields:
  • subscriber_id (primary key)
  • email (linked to Prospects)
  • signup_date
  • utm_source (from signup)
  • last_email_sent
  • last_email_opened
  • email_open_rate (%)
  • email_click_rate (%)
  • unsubscribed_date (optional)
  • subscription_status (active, unsubscribed)
```

---

### 2. Zapier Integrations (Automated Data Flow)

#### Integration 1: Stripe → Airtable

**Trigger**: Stripe charge.succeeded  
**Action**: Add row to Airtable "Checkouts" table

```
Mapping:
  • Stripe customer email → Checkouts.email
  • Stripe amount → Checkouts.amount
  • Stripe product name → Checkouts.product_type
  • Stripe date → Checkouts.completed_date
  • Stripe payment status → Checkouts.payment_status
```

**Setup time**: 15 min (Stripe API key + Airtable base)

#### Integration 2: Email Opens → Airtable

**Trigger**: Email open (from Brevo/Mailchimp)  
**Action**: Update Newsletter table

```
Mapping:
  • Email address → Newsletter.email
  • Open date → Newsletter.last_email_opened
  • Open count → Newsletter.email_open_rate
```

**Setup time**: 20 min (email platform API + Airtable)

#### Integration 3: Manual Feedback Logger (Google Form → Airtable)

**Trigger**: Form submission (objections, wins, churn)  
**Action**: Add row to Feedback table

```
Form fields:
  • Prospect email
  • Interaction type (dropdown)
  • Objection/win description
  • Source (dropdown)
  • Date
```

**Setup time**: 25 min (Google Form + Airtable integration)

---

### 3. Weekly Feedback Review Process

**When**: Tuesday mornings (sync with sales calls from Mon)  
**What**: Review new feedback entries in Airtable

**Template**:
```
Weekly Feedback Summary (Aug 13-19):

New Objections:
  • [Objection 1]: 2 instances
    Resolution: [how handled]
  • [Objection 2]: 1 instance
    Resolution: [how handled]

Wins (converted from objection):
  • [Prospect name]: [Objection] → [Resolution] → Sale

Churn (if any):
  • [Prospect email]: Reason: [reason from feedback]

Top Objection This Week: ___
  Frequency: ___
  Pattern: ___
  Hypothesis for fixing: ___
```

---

## Implementation Tasks

### Task 1: Create Airtable Base + Tables (2 hours)

1. Sign up for Airtable (free tier sufficient)
2. Create new base: "Nebula Components CRM"
3. Create 4 tables with fields above
4. Set up relationships (Prospects ← → Checkouts, Feedback, Newsletter)
5. Create views:
   - Prospects: filter by status (all, cold, interested, purchased)
   - Checkouts: filter by month, product type
   - Feedback: filter by status (objections open/closed, wins, churn)
   - Newsletter: filter by engagement (high, medium, low)

### Task 2: Set Up Zapier Integrations (1.5 hours)

1. Stripe → Airtable:
   - Connect Stripe account to Zapier
   - Connect Airtable to Zapier
   - Map fields, test, enable
   - Estimated time: 15 min

2. Email platform → Airtable:
   - Connect Brevo/Mailchimp to Zapier
   - Map open events to Newsletter table
   - Estimated time: 20 min

3. Google Form → Airtable (feedback logger):
   - Create Google Form (3 questions)
   - Connect to Zapier
   - Map to Feedback table
   - Estimated time: 25 min

### Task 3: Test End-to-End (1 hour)

1. Make a test Stripe purchase → Verify Airtable entry
2. Open a test email → Verify Newsletter table update
3. Submit test feedback → Verify Feedback table entry
4. Run weekly review (dry run, no real data yet)

---

## Expected Data By Aug 19

### Airtable Prospects Table
- 50-100 rows (from Phase 1 audits)
- Populated with: email, name, audit_score, utm_source, status

### Airtable Checkouts Table
- 5-10 rows (from Phase 1 conversions)
- Linked to Prospects via email
- Stripe data auto-populated

### Airtable Feedback Table
- 2-5 rows (manual logging, if applicable)
- Objections: price, confidence, complexity

### Airtable Newsletter Table
- 20-50 rows (newsletter signups)
- Email engagement data auto-populated

---

## Weekly Feedback Review (Starting Aug 20)

**Output**: One insight per week

**Example Week 1 (Aug 13-19)**:
```
Top Objection: "This seems expensive for just a fix pack"
  Frequency: 2 instances
  Sources: 1 support email, 1 live chat
  Resolution: Explained ROI ($97 fix → $500-2k/mo lift)
  Outcome: 1 converted, 1 still thinking

Insight: Add ROI calculator to results page
  "You're paying \$[CPC] × [daily traffic] = \$[daily spend]"
  "One fix saves 10% → \$[monthly savings]"
  Expected impact: +3% conversion (price objection → purchased)
```

---

## Success Criteria (By Aug 15)

- ✅ Airtable base created (4 tables)
- ✅ Zapier integrations live (Stripe, email, form)
- ✅ Test purchase flows through to Airtable
- ✅ Email opens tracked in Airtable
- ✅ Feedback form working
- ✅ Weekly review template ready
- ✅ First week of data flowing (Aug 12-15)

---

## Files to Create

1. `AIRTABLE_CRM_SCHEMA.md` — Database structure
2. `ZAPIER_SETUP_GUIDE.md` — Step-by-step integration
3. `FEEDBACK_REVIEW_TEMPLATE.md` — Weekly process
4. `GOOGLE_FORM_FEEDBACK_LOGGER.txt` — Form questions

---

## Cost

- Airtable: Free tier (sufficient for 1,000 rows)
- Zapier: $19-20/month for 3 integrations
- Total: ~$20/month

---

## Phase 2 Impact

**By Aug 26**:
- Every prospect linked to their source + objections + outcome
- Objection patterns visible (price, confidence, complexity)
- Newsletter cohort vs landing page cohort LTV comparison
- Repeat purchase rate measured
- Churn indicators identified

**By Sep 2**:
- Segment based on objection type
- Re-target each segment with tailored message
- Scale high-LTV sources, pause low-LTV
- Pricing/positioning decisions informed by objection data

---

**Status**: Phase 2 ready to start Aug 13.

By Aug 16, Airtable CRM fully operational.
By Aug 19, first week of feedback logged + weekly review done.
By Aug 26, objection patterns clear → targeting strategy ready.
