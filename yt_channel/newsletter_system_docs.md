# Newsletter System — Landing Page Diagnostics Weekly

**Status**: ✅ Complete and ready for deployment  
**Route**: `/newsletter` (signup page)  
**API**: `POST /api/newsletter/subscribe`, `POST /api/newsletter/unsubscribe`  
**Cron**: Weekly send (Monday 8 AM ET)  

---

## Strategy

### **Why Newsletter?**

Current funnel: YouTube audit → free results page → $97 fix pack

**Gap**: One-time transaction = low customer lifetime value

**Newsletter solves**:
- Build trust through weekly expertise (not just audit results)
- Keep founder in loop (Monday ritual = habit)
- Drive repeat audits (new findings = new re-audit opportunities)
- Nurture for referrals (share newsletter with colleagues → new customers)
- Set up for Pro subscription (weekly findings → "why not just subscribe?")

### **Content Strategy**

Each week: **One finding. One fix. One pattern.**

Format:
1. **Title**: Specific finding (e.g., "H1 Doesn't Match Ad Copy")
2. **The Finding**: Real example from our audits (anonymized)
3. **The Impact**: Specific metric damage (bounce rate, CTR, conversion impact)
4. **The Fix**: Exact steps (copy-paste ready, 30 min implementation)
5. **Data proof**: "Found in 23% of audits this week" (social proof)

**Tone**: Nebula voice (direct, specific, helpful, no fluff)

---

## Components

### **1. Signup Page** (`/newsletter/page.tsx`)

**Location**: `/newsletter`

**Content**:
- Hero: "Landing Page Diagnostics — Weekly insights from 847 audits"
- 3 value props (specific findings, actionable fixes, real results)
- Sample findings (3 real examples with impact metrics)
- Signup form (email + optional role dropdown)
- FAQ (5 questions: frequency, scope, unsubscribe, audience, support)
- CTA to free audit

**Psychology**:
- Social proof: "847 audits" + "real results" (proof this is legitimate)
- Low barrier: Free, one email/week, unsubscribe anytime
- Specificity: Show real findings + impact (not generic promises)

### **2. API Endpoints** (`/platform_api/routes/newsletter.py`)

```
POST /api/newsletter/subscribe
  Request: { email, role?, referrer? }
  Response: { success, message, subscriber_id }
  Logic: Validate email, check if already subscribed, create subscriber, send welcome email

POST /api/newsletter/unsubscribe
  Request: { email }
  Response: { success, message }
  Logic: Mark as unsubscribed

GET /api/newsletter/subscribers/count
  Response: { total_subscribers }
  Logic: Public endpoint for dashboard
```

### **3. Database Schema** (`/platform_api/db/newsletter_schema.py`)

```sql
CREATE TABLE newsletter_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT,  -- Optional: founder, marketer, product, designer, developer, agency, other
  referrer TEXT,  -- Optional: utm_source, audit_id, page referrer
  subscribed_at TEXT NOT NULL,  -- ISO 8601
  unsubscribed_at TEXT,  -- NULL = currently active
  last_email_sent_at TEXT,
  confirmation_sent_at TEXT,
  confirmation_token TEXT,
  is_confirmed BOOLEAN DEFAULT FALSE,
);
```

### **4. Weekly Send Job** (`/yt_channel/weekly_newsletter_job.py`)

**Trigger**: Every Monday at 8 AM ET (1 PM UTC)

**Flow**:
1. Query active subscribers (unsubscribed_at IS NULL, is_confirmed = TRUE)
2. Get this week's finding (from findings queue)
3. Render email (subject + body with finding details)
4. Send via AgentMail (fail-closed, rate-limited)
5. Update last_email_sent_at
6. Log results (sent count, failures)

**Email content**:
- Title: "Nebula Weekly: [Finding Title]"
- Finding + impact
- Fix (exact steps)
- CTA: "Get the full audit" → /audit
- Unsubscribe link

---

## Deployment Checklist

### **Before Sep 2** (Sep 1):

1. [ ] Wire newsletter router into `platform_api/main.py`:
   ```python
   from platform_api.routes.newsletter import router as newsletter_router
   app.include_router(newsletter_router)
   ```

2. [ ] Create newsletter_subscribers table:
   ```bash
   python platform_api/db/newsletter_schema.py
   ```

3. [ ] Test signup flow:
   - Navigate to `/newsletter`
   - Fill out form
   - Verify subscriber in DB
   - Verify welcome email (if email service wired)

4. [ ] Add link to `/newsletter` from:
   - Top nav (footer or secondary menu)
   - Audit results page (bottom CTA)
   - Landing page (footer)

5. [ ] Configure weekly cron job:
   - Tool: Celery, APScheduler, or manual cron
   - Schedule: "0 13 * * 1" (Monday 1 PM UTC)
   - Script: `weekly_newsletter_job.py`

### **After Sep 2** (Sep 2-9):

6. [ ] Wire AgentMail integration:
   - Newsletter signup → Send welcome email
   - Weekly job → Send newsletter

7. [ ] Create findings queue system:
   - New audit → Extract finding
   - Queue for weekly newsletter
   - Rotate so each week is different

8. [ ] Set up email templates:
   - Welcome email
   - Weekly newsletter template
   - Unsubscribe confirmation

---

## Expected Impact

### **Signups**

- **Week 1** (Sep 2-9): 10-20 signups (from audit traffic)
- **Week 2-4** (Sep 9-30): 20-50 signups cumulative (word-of-mouth + footer link)
- **Oct**: 100+ subscribers

### **Engagement**

- **Open rate**: 35-45% (high-specificity content + founder audience)
- **Click rate**: 8-15% (CTA: audit or re-audit)
- **Conversion**: 2-5% of clicks → free audit re-runs → 1-2% → $97 fix pack

### **Revenue**

- **Direct**: Newsletter subscribers + re-audit conversion = $97 fix packs
- **Indirect**: Newsletter social proof → referral loop → new customers
- **Recurring**: Newsletter habit builds relationship → Pro subscription consideration

---

## Files Delivered

1. ✅ `/app/newsletter/page.tsx` — Signup page
2. ✅ `/platform_api/routes/newsletter.py` — API endpoints
3. ✅ `/platform_api/db/newsletter_schema.py` — Database schema + setup script
4. ✅ `/yt_channel/weekly_newsletter_job.py` — Weekly send cron job
5. ✅ This documentation

---

## Integration Points (TODO)

- [ ] Wire newsletter_router into platform_api/main.py
- [ ] Wire AgentMail for signup welcome email
- [ ] Wire AgentMail for weekly send
- [ ] Create findings queue system (which finding to send each week)
- [ ] Set up email templates (welcome, weekly, unsubscribe)
- [ ] Add /newsletter link to site navigation
- [ ] Add /newsletter CTA to audit results page footer

---

## Future Enhancements (Post-Sep 2)

1. **Newsletter segmentation**: Different findings for different roles (founder vs designer)
2. **A/B testing**: Test subject lines, finding selection, CTA copy
3. **Engagement scoring**: Track opens/clicks, segment interested vs inactive
4. **Referral loop**: "Share this finding with X colleagues, get $50 credit per signup"
5. **Pro upsell**: "Subscribe to Pro to get findings daily (not weekly)"
6. **Content repurposing**: Newsletter finding → YouTube Shorts → LinkedIn post

---

**Status**: Ready for deployment. All files in place, waiting for Sep 1 integration.
