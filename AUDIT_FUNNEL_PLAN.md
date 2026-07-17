# Audit Funnel — Full Plan

**Date:** 2026-07-17
**Status:** Planning
**Goal:** Convert free audit into paid fixes + monitoring

---

## Current Assets

- **Audit Engine:** `deliver_audit.py` — functional, scrapes and scores pages
- **Next.js App:** `customer-portal/` — 77 pages
- **Stripe Products:**
  - $7 — AI Prompt Pack (fix-yourself)
  - $147 — Fix Pack (implemented in 24h)
  - $497 — Agency Partner
  - $1,497/mo — AI Ops Retainer

---

## Funnel Architecture

### Step 1: Landing Page (URL Only)

**URL:** `/audit`

**Elements:**
- Headline: "Free Landing Page Audit"
- Subheadline: "Find out why your ads aren't converting — 60 seconds"
- Single input field: **URL only**
- Button: "Run Audit" or "Analyze My Page"
- Trust signals below fold: logos, use cases

**User flow:**
1. User enters URL
2. Clicks "Run Audit"
3. Immediate redirect to processing page

**Technical:**
- Form POST to `/api/audit/start`
- Backend validates URL (public HTTP/HTTPS only)
- Stores audit request in database with status `pending`
- Redirects to `/audit/[id]/processing`

---

### Step 2: Processing Page (Progress Animation)

**URL:** `/audit/[id]/processing`

**Elements:**
- Animated progress bar (fake but believable, 8-12 seconds)
- Status messages cycling:
  - "Scanning page structure..."
  - "Analyzing conversion elements..."
  - "Checking trust signals..."
  - "Generating findings..."
- After progress completes (100%):
  - **Fade in:** Email capture form
  - Headline: "Your audit is ready"
  - Input: Email address
  - Button: "Send Full Results"
  - Small link: "View preview now"

**User flow:**
1. User watches progress (builds anticipation)
2. After 10s, email capture appears
3. User can enter email OR click "view preview"

**Technical:**
- Frontend polls `/api/audit/[id]/status` every 2s
- Backend runs `deliver_audit.py` as background job
- Once complete, status changes to `ready`
- Email capture triggers send and redirects to results

**Email:**
- Full audit results in formatted email
- Links to view online and upsell

---

### Step 3: Results Page (Partial Reveal)

**URL:** `/audit/[id]/results`

**Elements:**
- Score prominently displayed: "6.1/10 · Grade C"
- First 1-2 findings visible with full detail:
  - Issue name
  - Why it matters
  - How to fix
- Remaining findings: **BLURRED OUT**
  - Show titles only: "Finding #3: Load Speed"
  - Overlaid with: "Enter email to unlock full results"
- CTA buttons:
  - Primary: "Unlock Full Results" (requires email)
  - Secondary: "Get AI prompts to fix these" ($7)
  - Tertiary: "I'll fix these for you — $147"

**Psychology:**
- Blurred results create curiosity + FOMO
- Showing 1-2 findings proves value
- Email unlock is "free" (feels like a fair trade)

**Unlocked view (after email):**
- All findings visible
- Score breakdown
- Priority matrix
- Link to full email results

---

### Step 4: Upsell Ladder (In Results)

**Tier 1: AI Prompt Pack — $7**

- "Get ChatGPT/Claude prompts to fix each issue"
- Pre-loaded with your page data
- Copy-paste to get fixes
- Button: "Get Prompts — $7"

**Tier 2: Fix Pack — $147**

- "We implement headline + above-fold clarity in 24h"
- Zero risk (we duplicate your page)
- Full refund if no improvement in 14 days
- Button: "Fix My Page — $147"

**Tier 3: AI Ops Retainer — $1,497/mo**

- Monthly audit refresh
- Up to 4 fixes per month
- Priority support
- OTO: "Pay yearly, get 20% off ($14,364/year = $1,197/mo)"
- Button: "Subscribe — $1,497/mo" or "$14,364/year (save $3,564)"

---

## Email Flow

### Email 1: Full Audit Results (Immediate)

**Send after email capture on processing page**

Content:
- Score + grade
- All findings with details
- Priority matrix
- AI prompt for first finding (free value)
- Link to view online
- CTAs: $7 prompts, $147 fix, $1,497 retainer

### Email 2: Follow-up (24h later)

- "Your audit results are aging"
- Pages drift, assumptions change
- CTA: "Get your fix started — $147"

### Email 3: Value Add (3 days)

- Free tip: "Here's how to fix finding #1 yourself"
- Single actionable fix (no upsell)
- Builds trust

### Email 4: Retainer Pitch (7 days)

- "What if you never had to audit again?"
- Monthly monitoring
- CTA: "Start 3-month trial — $1,497/mo"

-

--
## Database Schema

```sql
CREATE TABLE audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url VARCHAR(2048) NOT NULL,
  email VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  score INTEGER,
  grade VARCHAR(2),
  findings JSONB,
  tech_stack JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  email_sent_at TIMESTAMP,
  email_opens INTEGER DEFAULT 0,
  paid_at TIMESTAMP,
  paid_product VARCHAR(50)
);
```

**Status values:**
- `pending` — just submitted
- `processing` — scraping in progress
- `ready` — audit complete, awaiting email
- `delivered` — email sent
- `paid` — purchased something

---

## API Endpoints

### `POST /api/audit/start`
- Input: `{ url: string }`
- Validate URL
- Create audit record (status: pending)
- Queue background job
- Return: `{ audit_id: string, redirect_url: string }`

### `GET /api/audit/[id]/status`
- Return: `{ status: string, progress: number, score?: number }`
- Poll every 2s from frontend

### `POST /api/audit/[id]/email`
- Input: `{ email: string }`
- Update audit record
- Send full results email
- Return: `{ success: true, results_url: string }`

### `GET /api/audit/[id]/results`
- Return: `{ score, grade, findings: [...] }`
- Findings include `visible: boolean` based on email capture

### `POST /api/audit/[id]/unlock`
- Input: `{ email: string }`
- Mark email captured
- Return full findings

---

## Technical Implementation

### Backend Architecture: Hybrid (Next.js + n8n)

**Next.js Frontend:**
- Landing page `/audit`
- Processing page `/audit/[id]/processing`
- Results page `/audit/[id]/results`
- API routes trigger n8n webhooks

**n8n Workflows:**

1. **Audit Processing Workflow**
   - Trigger: Webhook from Next.js (`POST /webhook/audit/start`)
   - Steps:
     - Validate URL
     - Call `deliver_audit.py` (Execute Command node)
     - Parse JSON output
     - Store in PostgreSQL
     - Trigger email workflow

2. **Email Delivery Workflow**
   - Trigger: Webhook from audit workflow
   - Steps:
     - Render email template with audit data
     - Send via AgentMail API
     - Update audit status to `delivered`
     - Track email_sent_at timestamp

3. **Follow-up Sequence Workflow**
   - Trigger: Audit completed (scheduled)
   - Steps:
     - Check if user purchased (email match)
     - If not purchased, send follow-up emails (24h, 3d, 7d)
     - Track opens/clicks (AgentMail webhook)

**Why n8n:**
- Visual workflow management
- Built-in retry logic
- Webhook triggers (no polling)
- AgentMail integration (HTTP Request node)
- PostgreSQL integration (Postgres node)
- Execution history for debugging
- Can run standalone or self-hosted

### n8n Workflow Definitions

**Workflow 1: Audit Processing**
```
Webhook (POST /audit/start)
  → Validate URL (Function node)
  → Execute deliver_audit.py (Execute Command)
  → Parse JSON (Function node)
  → Store in PostgreSQL (Postgres node)
  → Return audit_id (Respond to Webhook)
  → Trigger email workflow (Webhook call)
```

**Workflow 2: Email Delivery**
```
Webhook (POST /email/send)
  → Fetch audit data (Postgres node)
  → Render email HTML (Function node)
  → Send via AgentMail (HTTP Request)
  → Update status (Postgres node)
```

**Workflow 3: Follow-up Sequence**
```
Schedule (daily at 9am)
  → Query audits with no purchase (Postgres node)
  → Split by days since completion (Function node)
  → Send appropriate follow-up (HTTP Request to AgentMail)
  → Track sent (Postgres node)
```

### API Endpoints (Next.js → n8n Webhooks)

| Next.js Route | n8n Webhook | Purpose |
|--------------|--------------|---------|
| `POST /api/audit/start` | `/webhook/audit/start` | Queue audit |
| `GET /api/audit/[id]/status` | PostgreSQL direct | Poll status |
| `POST /api/audit/[id]/email` | `/webhook/audit/email` | Capture email |
| `POST /api/audit/[id]/unlock` | `/webhook/audit/unlock` | Unlock results |

### n8n Self-Hosting

**Instance:** `https://n8n.mikeholownych.com` (existing Hermes n8n)
**Status:** Already running, webhooks available
**Credentials:** Already configured (PostgreSQL, AgentMail, etc.)

**No additional setup required — use existing n8n instance.**

Webhook URLs will be:
- `https://n8n.mikeholownych.com/webhook/audit/start`
- `https://n8n.mikeholownych.com/webhook/audit/email`
- `https://n8n.mikeholownych.com/webhook/audit/status`

### Background Processing

**MVP:** n8n handles async processing naturally (webhook triggers)
**Scale:** Add Redis queue if needed (n8n can consume from queues too)

### Email Delivery

**Via n8n:**
- HTTP Request node to AgentMail API
- Template rendering in Function node
- Retry logic built-in (3 retries with exponential backoff)

---

## Funnels Within the Funnel

### Path A: High Intent (They enter email on processing page)
1. See full results in email
2. Click back to results page
3. See upsells
4. Purchase ($7, $147, or $1,497)

### Path B: Impatient (They click "view preview" instead of email)
1. See 1-2 findings
2. Hit paywall (blurred results)
3. Enter email to unlock
4. See upsells
5. Purchase

### Path C: Cautious (They don't enter email)
1. Leave site
2. Get retargeted with ads
3. Return later

---

## Analytics Events

- `audit_started` — URL submitted
- `audit_processing_viewed` — processing page loaded
- `audit_email_entered` — email captured
- `audit_results_viewed` — results page loaded
- `audit_results_unlocked` — email entered on results page
- `audit_email_sent` — full results delivered
- `audit_prompt_purchased` — $7
- `audit_fix_purchased` — $147
- `audit_retainer_purchased` — $1,497
- `audit_retainer_yearly_purchased` — $14,364

---

## Conversion Targets

| Metric | Target |
|--------|--------|
| Audit starts per day | 50 |
| Email capture rate | 70% |
| $7 purchase rate | 10% of completed audits |
| $147 purchase rate | 3% of completed audits |
| $1,497 subscription rate | 0.5% of completed audits |

---

## MVP Scope (Ship First)

**Phase 1: Core Flow (Day 1)**
- [x] Audit engine tested and verified
- [ ] `/audit` landing page with URL input
- [ ] Processing page with progress animation
- [ ] Email capture after progress completes
- [ ] Results page with 1-2 visible findings
- [ ] Email delivery of full results

**Phase 2: Upsells (Day 2)**
- [ ] Stripe checkout for $7 prompts
- [ ] Stripe checkout for $147 fix
- [ ] Retainer landing page link

**Phase 3: Polish (Day 3)**
- [ ] Blurred results UX
- [ ] Email sequence automation
- [ ] Analytics tracking

---

## Confirmed Architecture

### Database & Processing
1. ✅ **Database:** Full PostgreSQL (existing)
2. ✅ **Queue:** n8n webhooks (async processing)
3. ✅ **Processing Flow:**
   - Audit kicks off IMMEDIATELY when URL submitted
   - Progress animation is purely visual (10s fake progress for UX)
   - Actual processing runs async via n8n webhook
4. ✅ **Lead Capture:** Name + email REQUIRED before full results emailed

### n8n Instance
- **URL:** `https://n8n.mikeholownych.com` (existing Hermes n8n)
- **Webhooks:** Create webhook triggers for audit workflows
- **Credentials:** Already configured (PostgreSQL, AgentMail, etc.)

---

## Future State: Customer Dashboard

**Phase 2 (Post-MVP):** `/dashboard` — Customer self-serve portal

**Features:**
- Account management
- Billing history + subscription management
- Additional scans (run new audits)
- Management/support for monthly monitoring
- Scan/report/fix history (archive of all audits)
- Resource library (purchased prompts, fix packs)

**Database Schema (Full):**

```sql
-- Customers table (for dashboard auth)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  stripe_customer_id VARCHAR(255),
  subscription_status VARCHAR(50) DEFAULT 'free',
  subscription_id VARCHAR(255)
);

-- Audits table
CREATE TABLE audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  url VARCHAR(2048) NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  score INTEGER,
  grade VARCHAR(2),
  findings JSONB,
  tech_stack JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  email_sent_at TIMESTAMP,
  email_opens INTEGER DEFAULT 0,
  paid_at TIMESTAMP,
  paid_product VARCHAR(50)
);

-- Purchases table
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  audit_id UUID REFERENCES audits(id),
  product VARCHAR(50) NOT NULL,
  amount_cents INTEGER NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Monitors table (for retainer customers)
CREATE TABLE monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  url VARCHAR(2048) NOT NULL,
  frequency VARCHAR(20) DEFAULT 'monthly',
  last_scan_at TIMESTAMP,
  next_scan_at TIMESTAMP,
  active BOOLEAN DEFAULT true
);

-- Create indexes
CREATE INDEX idx_audits_email ON audits(email);
CREATE INDEX idx_audits_customer_id ON audits(customer_id);
CREATE INDEX idx_audits_status ON audits(status);
CREATE INDEX idx_purchases_customer_id ON purchases(customer_id);
CREATE INDEX idx_monitors_customer_id ON monitors(customer_id);
```

**Dashboard Routes (Phase 2):**
- `/dashboard` — Overview (recent audits, subscription status)
- `/dashboard/audits` — Audit history
- `/dashboard/audits/[id]` — Single audit details
- `/dashboard/billing` — Stripe billing portal
- `/dashboard/monitors` — Active monitoring
- `/dashboard/resources` — Purchased content

**Auth (Phase 2):**
- Magic link (email-only) or Clerk integration

---

## Approval Needed

Before proceeding:
1. ✅ Funnel flow confirmed
2. ✅ MVP scope confirmed  
3. ✅ Database: PostgreSQL
4. ✅ Processing: n8n webhooks (async, immediate start)
5. ✅ n8n: Existing instance at n8n.mikeholownych.com
6. ✅ Lead capture: Name + email required before email delivery
7. ⏳ Proceed to implementation?

---

## Implementation Checklist

**Phase 1: Database + Backend (Day 1)**
- [x] Create PostgreSQL tables (customers, audits, purchases, monitors)
- [x] Add `--json` flag to deliver_audit.py for API integration
- [x] Set up n8n workflows via n8n-build MCP:
  - [x] `J4AQX7eHhht8XRga` — Audit Processing (Resilient) ✅
  - [x] `jhxYkE0wppyIGP0F` — Email Delivery Queue ✅
  - [x] `cAPeE9LrlIM9dSsN` — Follow-up Sequence ✅
- [x] Configure PostgreSQL credentials in n8n (`4A8XEDkH12OxT7IO`)
- [x] Create AgentMail API credential (`mPASqxXTDa6UsyRE`)
- [x] Create FastAPI audit endpoint (`/audit/run`)
- [ ] Start platform_api server (FastAPI on port 8000)
- [ ] Activate n8n workflows
- [ ] Test webhook endpoints
  - [x] `jhxYkE0wppyIGP0F` — Email Delivery Queue ✅
  - [x] `cAPeE9LrlIM9dSsN` — Follow-up Sequence ✅
- [ ] Configure PostgreSQL credentials in n8n
- [ ] Configure email/SMTP credentials in n8n
- [ ] Test webhook endpoints
- [ ] Test deliver_audit.py integration

**Phase 2: Frontend (Day 2)**
- [ ] Build `/audit` landing page (URL input)
- [ ] Build `/audit/[id]/processing` (progress animation)
- [ ] Build `/audit/[id]/results` (partial reveal)
- [ ] Email capture form

**Phase 3: Upsells + Polish (Day 3)**
- [ ] Stripe checkout integration ($7, $147, $1,497)
- [ ] Email templates (audit results, follow-ups)
- [ ] Analytics tracking
- [ ] Blurred results UX

---
