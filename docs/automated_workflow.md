# Automated Content Workflow — "Publish + Engage" Architecture

**Your Role:** Review briefs, publish, engage (Monday-Friday, ~1-2 hours total)  
**System Role:** Everything else (automatic)

---

## Automation Overview

```
MONDAY (Automatic)
───────────────────
8:00 AM ET → Cron pulls findings
          → Generates LinkedIn + Medium briefs
          → Delivers to your inbox/chat

YOUR WORK (Manual)
───────────────────
Monday PM    → Review 3 briefs (15 min)
Tuesday-Thu  → Write content OR delegate to subagent (30-60 min)
             → Schedule posts (10 min)
Fri-Sun      → Publish + Engage (45-90 min)

TRACKING (Automatic)
───────────────────
Daily 9 AM   → Monitor track metrics
Weekly       → Nurture stats update
Monthly      → Conversion funnel report
```

---

## Your Reduced Workload

| Day | Task | Time |
|-----|------|------|
| Monday | Review 3 briefs | 15 min |
| Tuesday-Thursday | Write/draft content | 30-60 min |
| Friday | Publish + engage | 45-60 min |
| **Total** | **Your work** | **~90-135 min/week** |

---

## Automation Components

### 1. Monday Content Pipeline (Cron)

**Schedule:** Every Monday 8:00 AM ET  
**Job ID:** `93f5ca19d3e2`

**What it does:**
1. Pulls top 3 findings from last 7 audits
2. Generates LinkedIn briefs (hook variants + structure)
3. Generates Medium outlines (headline + sections)
4. Delivers formatted brief to your inbox/chat

**Output format:**
```
📋 MONDAY CONTENT BRIEFS
YYYY-MM-DD

FINDING #1
────────────
Track: headline-clarity
Finding: "Your headline says what it is. They're looking for what it does."
LinkedIn Hook: "Your headline is visible. Most founders don't know it's their biggest leak."
Medium Headline: "Why 72% of Landing Pages Fail on the First Line"

[Repeat for findings 2-3]

FILES:
- LinkedIn briefs: /home/mike/nebula/content_queue/*.json
- Medium outlines: /home/mike/nebula/content_queue/*.json

NEXT STEPS:
1. Review briefs
2. Write content (or ask: "draft LinkedIn post for finding #1")
3. Schedule: LinkedIn Tue/Thu/Sat 9 AM, Medium Sunday 10 AM
4. Engage: Reply within 1 hour
```

---

### 2. Daily Track Metrics (Cron)

**Schedule:** Every day 9:00 AM ET  
**Job ID:** `monitor_tracks` (existing)

**What it does:**
1. Counts leads by track
2. Shows nurture send volumes
3. Highlights winning tracks
4. Delivers to Telegram

**Your action:** None (monitoring only)

---

### 3. Content Brief Generation (On-Demand)

**CLI:**
```bash
# Generate from single finding
python3 scripts/generate_content_briefs.py \
  --finding "Your CTA is visible. They just don't know what it commits them to." \
  --track cta-friction

# Generate from idea bank
python3 scripts/generate_content_briefs.py \
  --input idea_bank.json \
  --limit 3
```

**Output:**
- `content_queue/linkedin_brief_*.json`
- `content_queue/medium_outline_*.json`

---

### 4. Subagent Content Drafting (On-Demand)

**When you don't want to write:**

```
You: "Draft LinkedIn post for finding #1 from today's brief"

Hermes: [spawns subagent → drafts post → returns for review]
```

**Subagent workflow:**
1. Reads finding from brief file
2. Selects best hook from library
3. Drafts post following brief structure
4. Returns draft for your approval

**Your action:** Review + approve/publish

---

## Platform Integration

### LinkedIn

**Your role:**
- Review scheduled posts
- Publish on Tue/Thu/Sat 9 AM
- Reply to comments within 1 hour
- DM only after explicit opt-in

**Automation:**
- Briefs generated Monday
- Hooks from library
- Structure pre-filled

### Medium

**Your role:**
- Review article outline
- Expand outline to full article (or ask subagent)
- Publish Sunday 10 AM
- Engage within 24 hours

**Automation:**
- Outline generated Monday
- Headlines from template
- Structure pre-filled
- SEO keywords suggested

**Medium-specific:**
- Length: 1500-3500 words
- Subheads every 3-4 paragraphs
- 3-5 examples in evidence section
- CTA with UTM tracking

---

## Weekly Workflow (Your Reduced Workload)

### Monday (15 min)

**Morning:**
- Receive briefs via automated delivery (8 AM)

**PM:**
- Review 3 findings
- Check hooks check all boxes
- Assign to publishing days (Tue/Thu/Sat + Sunday)

---

### Tuesday-Thursday (30-60 min)

**Option A: Write yourself**
```
Tuesday: Draft LinkedIn post for finding #1 (20 min)
Wednesday: Draft Medium article OR LinkedIn posts #2-3 (30 min)
Thursday: Review + schedule (10 min)
```

**Option B: Delegate to subagent**
```
You: "Draft LinkedIn post for headline-clarity finding"
Hermes: [Spawns subagent → Returns draft]
You: Review + approve
```

---

### Friday-Sunday (45-90 min)

**Publishing:**
- LinkedIn: Tue/Thu/Sat 9 AM (auto or manual)
- Medium: Sunday 10 AM

**Engagement:**
- LinkedIn: Check every 2 hours OR reply within 1 hour
- Medium: Engage within 24 hours

**Capture:**
- Comment "AUDIT" → Reply with link (human)
- Track enters nurture (automatic)

---

## Tracking & Metrics (Automatic)

### Daily Metrics (Telegram)

```
TRACK METRICS — 2026-07-18

Leads: 12 (+3 this week)
├─ headline-clarity: 5 (42%)
├─ cta-friction: 3 (25%)
├─ message-match: 2 (17%)
└─ social-proof: 2 (17%)

Nurture sends: 47 this week
├─ Cold: 25 (53%)
├─ Warm: 18 (38%)
└─ Hot: 4 (9%)

Reply rate: 24% (target: 30%)
Best track: headline-clarity (31%)
```

---

### Weekly Review (Friday)

**Automatic:**
1. Content performance (LinkedIn + Medium)
2. Track conversion rates
3. Hook winners/losers
4. One Scale/Improve/Retire decision

**Format:**
```
WEEKLY CONTENT REVIEW

SCALE: headline-clarity posts (3x avg)
IMPROVE: CTA posts (avg — test new hook)
RETIRE: Generic hooks (below avg)

NEXT WEEK: Double down on problem-revelation hooks
```

---

## Future Automation Opportunities

### Phase 2: Subagent Drafting

**Extend Monday cron:**
1. Pull findings
2. Generate briefs
3. **Spawn subagent to draft LinkedIn posts**
4. Return drafts for approval

**Your role:** Review + approve (5 min)

---

### Phase 3: Auto-Scheduling

**Extend automation:**
1. Connect to LinkedIn API or Buffer
2. Auto-schedule approved posts
3. Send reminder on publish day

**Your role:** Engage only (30 min/week)

---

### Phase 4: Full Automation Loop

**Hypothetical:**
1. Monday: Pull findings → Draft posts → Schedule
2. Pub Day: Auto-publish at 9 AM
3. Engagement: Sentiment analysis → Alerts for replies needing response
4. Capture: Auto-trigger nurture when comment contains "AUDIT"
5. Reporting: Weekly metrics + decisions

**Your role:** Engage + strategic decisions only

---

## Compliance Boundaries (Enforced)

**LinkedIn:**
- ✅ Auto-generate briefs
- ✅ Auto-schedule posts
- ⚠️ Auto-reply to comments = REVIEW FIRST
- ❌ Never auto-DM

**Medium:**
- ✅ Auto-generate outlines
- ✅ Auto-add UTM tracking
- ⚠️ Auto-publish = REVIEW FIRST
- ❌ Never auto-comment

**Human-in-loop:**
- All posts reviewed before publish
- All comment replies approved by you
- All DMs sent by you

---

## Files & Scripts

| Component | File | Purpose |
|-----------|------|---------|
| Monday cron | Job `93f5ca19d3e2` | Pull findings → generate briefs |
| Pull insights | `scripts/pull_audit_insights.py` | Extract findings from audits |
| Generate briefs | `scripts/generate_content_briefs.py` | Create LinkedIn + Medium briefs |
| Monitor tracks | `scripts/monitor_tracks.py` | Daily metrics |
| Brief templates | `docs/content_brief_template.md` | Template reference |
| Medium guide | `docs/MEDIUM_INTEGRATION.md` | Medium-specific protocol |
| Hook library | `docs/hook_library.md` | 80+ hooks |
| Workflow checklist | `docs/weekly_workflow_checklist.md` | Day-by-day reference |

---

## Current State

**What's automated:**
- ✅ Monday 8 AM: Pull findings + generate briefs
- ✅ Daily 9 AM: Track metrics
- ✅ Cron job: Job `93f5ca19d3e2` active

**What's manual:**
- Review briefs (15 min)
- Write content OR ask subagent (30-60 min)
- Publish + engage (45-90 min)

**Your total workload: ~90-135 min/week**

---

## Next Phase (Manual → Automated)

**When you're ready:**

1. **"Draft LinkedIn post for finding #1"**
   → I spawn subagent → return draft → you approve

2. **"Draft Medium article from finding #2"**
   → Subagent expands outline → returns draft → you review

3. **"Schedule all 3 posts"**
   → I save to posting schedule → remind you on pub days

---

## Summary

**Before automation:**
- Monday: Pull insights manually (30 min)
- Tuesday: Write briefs manually (1 hour)
- Wednesday: Draft content (1-2 hours)
- Thursday: Review (30 min)
- Friday: Publish + engage (1 hour)
- **Total: 4-5 hours/week**

**After automation:**
- Monday: Review briefs (15 min)
- Tuesday-Thursday: Write OR delegate (30-60 min)
- Friday-Sunday: Publish + engage (45-90 min)
- **Total: 90-135 min/week**

**Time saved: 2.5-4 hours/week**

---

**End of Automated Workflow Architecture**
