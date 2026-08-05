# Nebula Workspace Enhancement Spec — 7 Stickiness Features

## Overview

Seven features to add client stickiness and competitive differentiation to the Nebula workspace. Built iteratively in priority order. Each feature is scoped to be independently shippable.

---

## Feature 1: Automated Re-Audit with Before/After Diff

**Problem:** Founders fix something, then have no feedback loop to confirm it worked.

**Spec:**
- Backend: `audit_schedules` table (user_id, url, interval_days, next_run_at, enabled)
- Backend: Cron job that re-audits scheduled URLs weekly
- Backend: `/api/audit/diff?audit_a=<id>&audit_b=<id>` — returns finding-level diff (added, removed, changed findings + score delta)
- Frontend: "Schedule re-audit" toggle per page in Pages tab (defaults to weekly)
- Frontend: Diff view in workspace — side-by-side or unified showing:
  - Score: 62 → 78 (+16)
  - Findings resolved (green strikethrough)
  - New findings introduced (red)
  - Unchanged findings (dim)
- Notification: email/webhook when re-audit completes with score delta

**Data model:**
```sql
CREATE TABLE audit_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  interval_days INT DEFAULT 7,
  next_run_at TIMESTAMPTZ,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX ix_audit_schedules_user_url ON audit_schedules(user_id, url);
```

**Files to create/modify:**
- `migrations/versions/0004_audit_schedules.py`
- `platform_api/audit/schedule_routes.py` (CRUD + diff endpoint)
- `customer-portal/app/api/audit/schedule/route.ts` (proxy)
- `customer-portal/app/api/audit/diff/route.ts` (proxy)
- `customer-portal/app/workspace/diffView.tsx` (new view)
- `customer-portal/app/workspace/pagesView.tsx` (add schedule toggle)
- `scripts/cron_reaudit.py` (scheduled runner)

---

## Feature 2: Revenue Impact Estimator

**Problem:** Findings are abstract labels. Founders can't prioritize without knowing dollar impact.

**Spec:**
- User inputs their monthly ad spend OR average CPC (one field in Settings, stored in `user_preferences`)
- Backend: given CPC + GSC traffic data per page, estimate monthly revenue lost per finding:
  - Formula: `lost_revenue = (bounce_rate_delta × monthly_visitors × CPC)`
  - Simplified: each critical finding → 15-30% of page traffic × CPC; high → 5-15%; medium → 2-5%
- Display in audit results + fix queue: "$2,100/mo" next to each finding
- Display in Pages tab: total estimated monthly leak per page
- KPI card in Dashboard: "Total estimated monthly leak: $X,XXX"

**Data model:**
```sql
ALTER TABLE user_preferences ADD COLUMN monthly_ad_spend NUMERIC(10,2);
ALTER TABLE user_preferences ADD COLUMN avg_cpc NUMERIC(6,2);
```

**Files:**
- `platform_api/audit/revenue_estimator.py` (calculation logic)
- `platform_api/routes/audit_api.py` (add revenue_impact to audit response)
- `customer-portal/app/workspace/views.tsx` (Dashboard KPI)
- `customer-portal/app/workspace/pagesView.tsx` (leak column)
- `customer-portal/app/workspace/recsView.tsx` ($ badge per finding)
- `customer-portal/app/workspace/settingsView.tsx` (CPC input)

---

## Feature 3: Shareable Client Reports

**Problem:** Agencies and freelancers need to share audit results with their clients professionally.

**Spec:**
- Already have `/shared/[token]` page skeleton
- Add: PDF export button (server-side rendered via Puppeteer or @react-pdf)
- Add: White-label option — user can set their agency name + logo in Settings
- Share link includes: audit score, all findings, recommendations, branded header
- PDF includes: executive summary, score breakdown, finding cards, "Powered by Nebula" footer (removable on paid plan)
- Optional: custom domain CNAME for agency share links (future)

**Data model:**
```sql
ALTER TABLE user_preferences ADD COLUMN agency_name TEXT;
ALTER TABLE user_preferences ADD COLUMN agency_logo_url TEXT;
```

**Files:**
- `customer-portal/app/shared/[token]/page.tsx` (enhance existing)
- `platform_api/reports/pdf_generator.py` (PDF generation)
- `platform_api/routes/report_routes.py` (/api/report/pdf?audit_id=)
- `customer-portal/app/workspace/settingsView.tsx` (agency branding fields)

---

## Feature 4: Competitor Benchmark Tracking

**Problem:** Founders don't know if they're better or worse than competitors.

**Spec:**
- User adds 1-3 competitor URLs in Settings (stored in `competitor_tracking`)
- Backend: monthly cron audits competitor pages (same engine, no findings exposed — just score)
- Dashboard card: "You: 72 | Competitor A: 61 | Competitor B: 85"
- Pages tab: optional column showing competitor score for same page type
- Chart: score trend over time (you vs competitors, line chart)

**Data model:**
```sql
CREATE TABLE competitor_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  competitor_url TEXT NOT NULL,
  label TEXT,
  last_score NUMERIC(4,1),
  last_audited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Files:**
- `migrations/versions/0005_competitor_tracking.py`
- `platform_api/competitor/routes.py`
- `scripts/cron_competitor_audit.py`
- `customer-portal/app/workspace/competitorView.tsx` (new view or Dashboard section)
- `customer-portal/app/workspace/settingsView.tsx` (competitor URL inputs)

---

## Feature 5: AI Rewrite Preview

**Problem:** Audit findings tell what's wrong but don't show what "fixed" looks like.

**Spec:**
- On audit results page, each finding gets a "Preview fix" button
- Clicking generates an AI rewrite of the specific element (H1, meta description, CTA text) using the user's actual page content as context
- First rewrite shown free (teaser); full set behind $97 paywall
- Rewrite stored in DB for the audit (not regenerated each time)
- Uses Claude via existing Bedrock connection

**Data model:**
```sql
CREATE TABLE ai_rewrites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL,
  finding_key TEXT NOT NULL,
  original_text TEXT,
  rewritten_text TEXT,
  model TEXT DEFAULT 'claude-sonnet-4-5',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(audit_id, finding_key)
);
```

**Files:**
- `migrations/versions/0006_ai_rewrites.py`
- `platform_api/audit/rewrite_routes.py`
- `customer-portal/app/audit/[id]/results/RewritePreview.tsx`
- `customer-portal/app/api/audit/rewrite/route.ts`

---

## Feature 6: Weekly Email/Slack Digest

**Problem:** Users forget to check. No passive re-engagement.

**Spec:**
- Weekly email (Monday 9am) to users with active audit schedules:
  - Score changes this week
  - New pages not indexed
  - Top recommended action
  - Link back to workspace
- Optional Slack webhook (user pastes webhook URL in Settings)
- Uses existing email infrastructure (AgentMail or platform SMTP)

**Data model:**
```sql
ALTER TABLE user_preferences ADD COLUMN digest_enabled BOOLEAN DEFAULT true;
ALTER TABLE user_preferences ADD COLUMN digest_day TEXT DEFAULT 'monday';
ALTER TABLE user_preferences ADD COLUMN slack_webhook_url TEXT;
```

**Files:**
- `platform_api/digest/builder.py` (compose digest content)
- `platform_api/digest/sender.py` (email + Slack delivery)
- `scripts/cron_weekly_digest.py`
- `customer-portal/app/workspace/settingsView.tsx` (digest preferences)

---

## Feature 7: Experiment Tracking

**Problem:** Founders make changes but can't attribute results.

**Spec:**
- User logs an "experiment": date, what changed, which URL
- System auto-re-audits that URL and tracks GSC metrics from that date forward
- Dashboard shows: "Since you changed H1 on Aug 4: +12% CTR, position 8→5, score 62→78"
- Experiment states: running, concluded (user marks), inconclusive
- Can link to specific findings that were addressed

**Data model:**
```sql
CREATE TABLE experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  description TEXT NOT NULL,
  finding_keys TEXT[], -- which findings this addresses
  started_at TIMESTAMPTZ DEFAULT now(),
  concluded_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running', -- running, concluded, inconclusive
  baseline_score NUMERIC(4,1),
  baseline_position NUMERIC(5,1),
  baseline_ctr NUMERIC(5,4),
  current_score NUMERIC(4,1),
  current_position NUMERIC(5,1),
  current_ctr NUMERIC(5,4),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Files:**
- `migrations/versions/0007_experiments.py`
- `platform_api/experiment/routes.py`
- `customer-portal/app/workspace/experimentsView.tsx` (rewrite existing placeholder)
- `customer-portal/app/api/experiments/route.ts`
- `scripts/cron_experiment_tracker.py`

---

## Implementation Order

| # | Feature | Est. Effort | Dependencies |
|---|---------|------------|--------------|
| 1 | Auto re-audit + diff | 4-6h | Existing audit engine |
| 2 | Revenue impact estimator | 2-3h | GSC connection (done), user CPC input |
| 3 | Shareable client reports | 3-4h | Existing /shared/[token] |
| 4 | Competitor benchmark | 3-4h | Existing audit engine |
| 5 | AI rewrite preview | 3-4h | Bedrock Claude access |
| 6 | Weekly digest | 2-3h | Email infra (AgentMail) |
| 7 | Experiment tracking | 4-5h | GSC + re-audit (#1) |

**Total:** ~22-30h implementation across all 7.

---

## Principles

- Each feature ships independently — no feature blocks another
- All new tables use Alembic migrations with sequential IDs
- All new routes registered in platform_api/main.py
- All frontend proxy routes follow existing pattern (authHeaders)
- No new npm packages unless absolutely required
- All features gracefully degrade (empty states) when data isn't available
- Revenue numbers always labeled "estimated" — never claim precision
