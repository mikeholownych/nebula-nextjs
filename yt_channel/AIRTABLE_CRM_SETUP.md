# Airtable CRM Setup: Step-by-Step Implementation

**Status**: Implementation guide (Aug 13-15, 2026)
**Effort**: 6-8 hours total
**Cost**: ~$20/month (Zapier subscription)

---

## Step 1: Create Airtable Base (30 minutes)

### 1.1 Sign Up / Access Airtable

- Go to: https://airtable.com
- Sign up or log in
- Create new workspace: "Nebula Components"
- Create new base: "Nebula CRM"

### 1.2 Create Table 1: Prospects

**Name**: `Prospects`

**Fields** (in order):

```
1. prospect_id (Autonumber)
2. email (Email, required, unique)
3. first_name (Single line text)
4. last_name (Single line text)
5. company (Single line text)
6. job_title (Single line text)
7. utm_source (Single line text) - landing, newsletter, twitter, etc.
8. utm_medium (Single line text) - organic, social, email
9. utm_campaign (Single line text) - free_audit, newsletter_signup
10. first_audit_date (Date)
11. audit_score (Number) - 0-10
12. finding_count (Number)
13. status (Single select)
    Options: cold, interested, purchased, pro_subscriber, churned
14. last_contact_date (Date)
15. notes (Long text)
16. created_at (Date, auto-set to today)
```

**Primary key**: email (set as primary field in Airtable)

---

### 1.3 Create Table 2: Checkouts

**Name**: `Checkouts`

**Fields**:

```
1. checkout_id (Autonumber)
2. email (Email, required)
   Link to Prospects table
3. amount (Currency)
4. product_type (Single select)
   Options: fix_pack, pro_monthly, growth_monthly, agency_monthly
5. checkout_date (Date)
6. completed_date (Date)
7. utm_source (Single line text)
8. payment_status (Single select)
   Options: completed, failed, refunded
9. repeat_purchase (Checkbox)
10. customer_lifetime_value (Currency, formula)
    Formula: Calculate sum of all purchases for this email
11. notes (Long text)
12. created_at (Date, auto)
```

**Primary key**: checkout_id

---

### 1.4 Create Table 3: Feedback (Objections + Wins)

**Name**: `Feedback`

**Fields**:

```
1. feedback_id (Autonumber)
2. email (Email)
   Link to Prospects table
3. interaction_type (Single select, required)
   Options: objection, win, churn, question
4. objection_reason (Single select)
   Options: too_expensive, not_sure_works, no_time,
            complexity, already_fixed, other
5. source (Single select)
   Options: support_email, sales_call, live_chat, feedback_form
6. date_logged (Date, required, auto-today)
7. resolved (Checkbox)
8. resolution_type (Single select)
   Options: price_discount, proof_demo, followup, educated,
            none_yet
9. outcome (Single select)
   Options: closed_won, closed_lost, nurturing
10. notes (Long text)
11. follow_up_date (Date)
```

**Primary key**: feedback_id

---

### 1.5 Create Table 4: Newsletter

**Name**: `Newsletter`

**Fields**:

```
1. subscriber_id (Autonumber)
2. email (Email, required, unique)
   Link to Prospects table
3. signup_date (Date)
4. utm_source (Single line text)
5. last_email_sent (Date)
6. last_email_opened (Date)
7. email_open_count (Number)
8. email_click_count (Number)
9. email_open_rate (Percent)
10. email_click_rate (Percent)
11. unsubscribed_date (Date)
12. subscription_status (Single select)
    Options: active, unsubscribed, bounced
```

**Primary key**: email

---

## Step 2: Set Up Views (20 minutes)

### Create views for daily scanning:

**Prospects table views**:
- View 1: "All" (default)
- View 2: "Cold" (status = cold)
- View 3: "Interested" (status = interested)
- View 4: "Purchased" (status = purchased)
- View 5: "Pro Subscribers" (status = pro_subscriber)

**Checkouts table views**:
- View 1: "This Week" (completed_date last 7 days)
- View 2: "By Source" (grouped by utm_source)
- View 3: "Failed Payments" (payment_status = failed)

**Feedback table views**:
- View 1: "Open Objections" (resolved = unchecked)
- View 2: "Wins" (interaction_type = win)
- View 3: "By Type" (grouped by objection_reason)

**Newsletter table views**:
- View 1: "Active" (subscription_status = active)
- View 2: "Unengaged" (email_open_rate < 20%)
- View 3: "By Source" (grouped by utm_source)

---

## Step 3: Create Relationships (15 minutes)

In Airtable, link tables for data consistency:

### Relationship 1: Prospects → Checkouts

- Go to Checkouts table
- Find `email` field
- Change to "Link to another record" type
- Link to: Prospects table
- Link field name: `purchases` (on Prospects side)

**Result**: Each Prospect can have multiple Checkouts linked

### Relationship 2: Prospects → Feedback

- Go to Feedback table
- Find `email` field
- Change to "Link to another record" type
- Link to: Prospects table
- Link field name: `feedback_entries` (on Prospects side)

**Result**: Each Prospect can have multiple Feedback entries

### Relationship 3: Prospects → Newsletter

- Go to Newsletter table
- Find `email` field
- Change to "Link to another record" type
- Link to: Prospects table
- Link field name: `newsletter_subscription` (on Prospects side)

**Result**: Each Prospect has one Newsletter subscription

---

## Step 4: Set Up Zapier Integrations (2 hours)

### Integration 1: Stripe → Airtable (Purchases)

**Goal**: Auto-log every successful purchase

**Setup**:

1. Go to: https://zapier.com
2. Create new Zap: "Stripe to Airtable"
3. Trigger: "Stripe" → Event: "Charge Succeeded"
   - Connect your Stripe account
4. Action: "Airtable" → "Create Record"
   - Connect your Airtable account
   - Select base: "Nebula CRM"
   - Select table: "Checkouts"

5. Map fields:
   ```
   Stripe → Airtable
   customer.email → email
   amount → amount (convert cents to dollars)
   description → product_type (parse from description)
   created → completed_date
   status → payment_status
   ```

6. Test the Zap (make a test purchase in Stripe)
7. Enable the Zap

**Expected**: Every Stripe charge auto-appears in Checkouts table

---

### Integration 2: Email Opens → Airtable (Newsletter Engagement)

**Goal**: Auto-log email opens from Brevo/Mailchimp

**Setup**:

1. Go to: https://zapier.com
2. Create new Zap: "Brevo to Airtable"
3. Trigger: "Brevo" → Event: "Email Opened"
   - Connect your Brevo account
4. Action: "Airtable" → "Update Record"
   - Select base: "Nebula CRM"
   - Select table: "Newsletter"
   - Find record by: email
   - Fields to update:
     ```
     last_email_opened → Today
     email_open_count → +1
     email_open_rate → (open_count / email_count) * 100
     ```

5. Test the Zap (open a test email)
6. Enable the Zap

**Expected**: Every email open updates Newsletter table

---

### Integration 3: Google Form → Airtable (Feedback Logger)

**Goal**: Manual feedback form submits to Feedback table

**Setup**:

1. Create Google Form: "Nebula Feedback Logger"
   ```
   Question 1: "Prospect Email"
   Question 2: "Interaction Type" (radio: objection, win, churn, question)
   Question 3: "Details" (long text)
   Question 4: "Source" (radio: support email, sales call, live chat)
   Question 5: "Resolution Needed?" (radio: yes, no, unsure)
   ```

2. Go to Zapier
3. Create new Zap: "Google Forms to Airtable"
4. Trigger: "Google Forms" → Event: "New Response"
   - Connect your Google account
   - Select the form
5. Action: "Airtable" → "Create Record"
   - Select base: "Nebula CRM"
   - Select table: "Feedback"
   - Map fields:
     ```
     Email → email
     Interaction Type → interaction_type
     Details → notes
     Source → source
     Today → date_logged
     ```

6. Test the form
7. Enable the Zap

**Expected**: Form submissions auto-appear in Feedback table

---

## Step 5: Test End-to-End (1 hour)

### Test 1: Stripe Integration

- Make a test charge in Stripe (or use a $0.50 test)
- Wait 2 minutes
- Check Airtable Checkouts table
- Verify: Email, amount, product_type populated
- If missing: Debug Zapier zap

### Test 2: Email Opens

- Send yourself a test email from Brevo
- Open the email
- Wait 2 minutes
- Check Airtable Newsletter table
- Verify: last_email_opened updated
- If missing: Debug Zapier zap

### Test 3: Feedback Form

- Fill out Google Form
- Wait 1 minute
- Check Airtable Feedback table
- Verify: Email, interaction_type, notes populated
- If missing: Debug Zapier zap

---

## Step 6: Create Weekly Review Dashboard (20 minutes)

### In Airtable, create a summary view:

**New table**: `Weekly Summary` (optional, but useful)

**Fields**:
```
1. week_of (Date)
2. total_audits (Count, formula)
   COUNTA(records with first_audit_date in this week)
3. total_checkouts (Count, formula)
   COUNTA(checkouts with completed_date in this week)
4. total_revenue (Sum, formula)
   SUM(amount) for week
5. top_objection (Text, formula)
   Most common objection_reason this week
6. objection_frequency (Count)
7. wins_this_week (Count)
8. churn_this_week (Count)
```

**Use this for Sunday review** (faster than manual queries)

---

## Step 7: Google Sheet Backup (Optional, 15 minutes)

Create a read-only Google Sheet that mirrors Airtable:

1. Create new Google Sheet: "Nebula CRM Backup"
2. Use Zapier to sync key tables to sheets (nightly)
3. Use for manual analysis / pivot tables

---

## Verification Checklist (By Aug 15)

- [ ] Airtable base created (4 tables)
- [ ] All fields configured correctly
- [ ] Views created (7 total)
- [ ] Relationships set up (3 links)
- [ ] Stripe → Airtable zap live + tested
- [ ] Email opens → Airtable zap live + tested
- [ ] Google Form → Airtable zap live + tested
- [ ] First week of data flowing (Aug 12-15)
- [ ] Weekly review template ready
- [ ] At least 1 test record in each table

---

## Expected Data By Aug 19

**Prospects table**: 50-100 rows
- Email, name, score, source from Phase 1

**Checkouts table**: 5-10 rows
- Auto-populated from Stripe
- Linked to Prospects

**Newsletter table**: 20-50 rows
- Auto-populated from email opens
- Linked to Prospects

**Feedback table**: 2-5 rows
- Manual entries from support/sales
- Objection patterns emerging

---

## Cost

- Airtable free tier: Included (sufficient for 1,000 rows)
- Zapier: $19-20/month (3 integrations)
- Google Forms: Free
- Total monthly: ~$20

---

**Status**: Ready for implementation Aug 13.

By Aug 15: CRM fully operational.
By Aug 19: First week of data + weekly review.
By Aug 26: Objection patterns clear.
By Sep 2: Targeting strategy ready.
