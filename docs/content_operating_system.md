# Nebula Content Operating System

**Version:** 1.0  
**Created:** 2026-07-18  
**Source:** Adapted from "The In-House Content System" + Nebula track infrastructure

---

## The Chain

```
Audit Insights → Content Ideas → Hooks → Assets → Distribution → Engagement → Audit Capture → Track Nurture → Conversion → Reporting
     ↓              ↓             ↓         ↓            ↓              ↓              ↓              ↓              ↓
  Findings       Angles      Templates  Posts     LinkedIn      Compliance     /audit       Problem-     Booked
    logged       in bank                          + reshares    boundary       forms        specific      calls
```

Each stage feeds the next. The weakest link sets the ceiling.

**Your advantage:** Audit findings = buyer pain in their words. Start from data, not guesses.

---

## The Week

| Day | Focus | Output | Owner | Time |
|-----|-------|--------|-------|------|
| Monday | Pull insights from audits | 3-5 finding-based ideas | Founder | 30 min |
| Tuesday | Plan posts + write hooks | 3-5 briefs with hooks | Founder | 1 hour |
| Wednesday | Write/draft content | First drafts | Founder | 1-2 hours |
| Thursday | Review + schedule | Approved + queued | Founder | 30 min |
| Friday | Publish + engage | Live posts + replies | Founder | 1 hour |
| Friday PM | Weekly review | One decision + track scores | Founder | 15 min |

**Rule:** Work one week ahead. Plan this week goes live next week.

---

## Stage Details

### Stage 1: Audit Insights (Source)

**Goal:** Pull real buyer pain from audit findings.

**Input:** Last 7-14 audits  
**Output:** 3-5 finding-based content ideas  
**Owner:** Founder  
**Tool:** `scripts/pull_audit_insights.py`  
**Metric:** Insights logged per week

**Process:**
```bash
# Run Monday morning
python3 scripts/pull_audit_insights.py --days 7 --limit 5

# Output format:
# 1. [headline-clarity] "Your headline describes what it is"
#    Source: audit_abc123 (example.com)
#    Angle: They want to know what it does for them
#    
# 2. [cta-friction] "Your CTA is visible"
#    Source: audit_def456 (company.io)
#    Angle: They don't know what click commits them to
```

**Check:** Every idea traced to a real audit finding.

---

### Stage 2: Content Ideas

**Goal:** Shape findings into specific angles.

**Input:** Findings from Stage 1  
**Output:** Titled ideas in the idea bank  
**Owner:** Founder  
**Tool:** Notion database (or lead_manager idea_bank)  
**Metric:** Ideas ready to brief

**Template:**
```
**Finding:** [exact quote from audit]
**Problem:** [headline-clarity | cta-friction | message-match | social-proof]
**Angle:** [your unique take]
**Working title:** [draft headline]
**Track:** [which nurture track this feeds]
```

**Example:**
```
**Finding:** "Your headline describes what it is. They want to know what it does for them."
**Problem:** headline-clarity
**Angle:** Most founders write category descriptions. Their buyers want outcome promises.
**Working title:** Your headline says 'CRM Platform'. They're looking for 'No More Lost Leads'.
**Track:** headline-clarity
```

---

### Stage 3: Hooks

**Goal:** Earn the first 3 seconds.

**Input:** Content idea from Stage 2  
**Output:** 5 hook variants → pick 1  
**Owner:** Founder  
**Tool:** Hook library (Part 3) + Nebula hooks  
**Metric:** Hook pass rate

**Hook Categories (adapted for Nebula):**

1. **Problem revelation hooks**
   - "Your [asset] is [status]. Most founders don't know why."
   - Example: "Your headline is visible. Most founders don't know it's their leak."

2. **Audit finding hooks**
   - "I audited [X websites]. [percentage]% had the same problem."
   - Example: "I audited 50 landing pages. 72% bury their value proposition."

3. **Cost hooks**
   - "You spent [amount] on [X]. Here's what you missed."
   - Example: "You spent $10k on ads. Your headline is costing you half."

4. **Counter-intuitive hooks**
   - "Most founders [action]. They're making it worse."
   - Example: "Most founders add more CTAs. They're creating more friction."

5. **Teardown hooks**
   - "I audited [URL]. Here's the one thing killing conversions."
   - Example: "I audited a $50k/mo ad spend landing page. Here's why they're bleeding."

**Hook Checklist:**
- [ ] First line stops the scroll (under 10 words)
- [ ] Promises specific insight, not clickbait
- [ ] Connects to a track (headline, CTA, message-match, proof)
- [ ] Previewed against last 10 hooks (not repetitive)

---

### Stage 4: Content Assets

**Goal:** Deliver on the hook's promise.

**Input:** Hook + idea  
**Output:** Finished post / video / carousel  
**Owner:** Founder  
**Tool:** Google Docs, Canva, CapCut  
**Metric:** Assets shipped per week

**Format Mix:**
- 60% LinkedIn posts (short-form)
- 20% Carousels (visual teardowns)
- 20% Short videos (founder POV)

**Asset Checklist:**
- [ ] One idea only
- [ ] Hook in first line
- [ ] Proof or example included (audit data > opinion)
- [ ] Clear CTA (comment for resource, DM for chat, /audit for full audit)
- [ ] Track tag in metadata (for reporting)

---

### Stage 5: Distribution

**Goal:** Put it where buyers already are.

**Input:** Approved assets  
**Output:** Published + reshares  
**Owner:** Founder  
**Tool:** LinkedIn, scheduler  
**Metric:** Impressions and reach

**Schedule:**
- Tuesday 9 AM: Post #1 (problem reveal)
- Thursday 9 AM: Post #2 (teardown)
- Saturday 9 AM: Post #3 (proof/case study)

**Reshare protocol:**
- Founder reshares to profile
- Tag relevant team members (if applicable)
- Cross-post to Twitter/X (optional)

---

### Stage 6: Engagement (LinkedIn Compliance Boundary)

**Goal:** Turn views into conversation.

**Input:** Published posts  
**Output:** Replies + conversations started  
**Owner:** Founder  
**Tool:** LinkedIn  
**Metric:** Comments + reply rate

**Compliance:**
| Action | Classification | Rule |
|--------|---------------|------|
| Reply to comments | ✅ Allowed | Human-written, within 1 hour |
| Like comments | ✅ Allowed | Automated OK |
| Start conversation from comment | ⚠️ Human-approved | Manual only, no scripts |
| Send DM (unsolicited) | ❌ Prohibited | Never automated |
| Send DM (after opt-in) | ⚠️ Human-approved | After email capture or explicit request |

**Engagement protocol:**
1. Check LinkedIn every 2 hours on publish day
2. Reply to every comment within 1 hour.
3. Ask follow-up question (keeps conversation going)
4. Log objection/questions for future content

**Sample reply:**
```
Comment: "I think our headline is fine, it says what we do."

Reply: "Fair point. Curious — when you look at your top 3 ad campaigns, do the headlines match what the ad promised, or explain it differently?"
```

---

### Stage 7: Audit Capture (Lead Magnet)

**Goal:** Trade value for email + URL.

**Input:** Engaged commenters + profile visitors  
**Output:** Email + URL captured  
**Owner:** Founder (marketing role)  
**Tool:** `/audit` endpoint + forms  
**Metric:** Audits requested

**Capture paths:**
1. **Comment hook:** "Comment 'AUDIT' and I'll send you a free landing page teardown"
2. **Post CTA:** "Get your free audit at [URL]/audit"
3. **DM opt-in:** After explicit request → send `/audit` link

**Capture checklist:**
- [ ] Form collects: email, URL, optional company size
- [ ] Thank you page sets expectation (audit in 24-48 hours)
- [ ] Auto-reply email confirms receipt
- [ ] Lead record created in `leads.jsonl`

---

### Stage 8: Track Nurture

**Goal:** Build trust until ready.

**Input:** Captured email + URL + audit findings  
**Output:** Sequence they actually read  
**Owner:** Nurture engine (automated)  
**Tool:** `nurture_engine.py` + templates  
**Metric:** Open rate, reply rate

**Track Assignment:**
```
Audit finding: headline-clarity (high severity)
→ Track: headline-clarity
→ Segment: cold (no previous engagement)
→ Day 0: cold_headline_diagnosis_1.md
→ Day 7: cold_headline_intro_1.md (variant 2)
```

**Nurture logic:**
- Cold: diagnosis → intro (educational)
- Warm: teardown → checklist (proof-driven)
- Hot: pitch → direct ask

**Subject line format:**
```
[Problem] [Promise]

Example: "Headline fix → 30% more demo requests"
```

**Nurture checklist:**
- [ ] Track assigned from audit findings
- [ ] First email sent within 24 hours of audit delivery
- [ ] Track position logged
- [ ] Reply marked as conversion signal (+3 score)

---

### Stage 9: Conversion

**Goal:** Ask for the call.

**Input:** Nurture sequence + engagement signals  
**Output:** Booked call  
**Owner:** Founder (sales role)  
**Tool:** Calendly + email  
**Metric:** Calls booked

**Conversion triggers:**
- Hot lead (engagement score ≥ 8)
- Reply to nurture email
- Explicit request for help

**Ask formats:**
1. **Soft ask (warm):** "Want me to walk through the fixes? 15 min call: [link]"
2. **Hard ask (hot):** "Your audit shows [specific leak]. Want me to fix it for you? $97, 48-hour turnaround: [checkout]"
3. **Follow-up (cold → warm):** "Still thinking about your [problem]? Here's how another founder fixed it: [case study]"

---

### Stage 10: Reporting + Optimization

**Goal:** Keep what works, cut what doesn't.

**Input:** Weekly metrics  
**Output:** One clear decision  
**Owner:** Founder  
**Tool:** `monitor_tracks.py` + Weekly Reporting Sheet  
**Metric:** Actions shipped per week

**Weekly metrics board:**
```
Monday AM: Run scripts/monitor_tracks.py
Friday PM: Fill Weekly Reporting Sheet

Metrics to track:
- Audits requested (week)
- Track distribution (headline, CTA, message, proof)
- Nurture sends (by track)
- Open rates (by track)
- Replies captured (by track)
- Calls booked (by track)
```

**Scoring framework:**
| Status | Rule |
|--------|------|
| 🟢 Scale | >2x average open rate OR >30% reply rate |
| 🟡 Improve | Average open rate, 10-30% reply rate |
| 🔴 Retire | <10% reply rate after 20+ sends |

**Decision format:**
```
Week of [date]:
- Scale: [track/template that beat goals]
- Improve: [track/template that was average — one change to test]
- Retire: [track/template that failed — stop using]
- Next week: [one decision to implement]
```

---

## Minimum Viable Week

If you can only do 3 things:

1. **Monday:** Pull 3 audit findings → log as ideas (15 min)
2. **Tuesday-Thursday:** Write 3 posts from findings (1 hour total)
3. **Friday:** Publish + engage + review (1 hour)

Protect the 3 posts + weekly review. Everything else is upside.

---

## The One-Page Operating System

Print this. Put it on your wall.

```
THE CHAIN:
Audit Insights → Ideas → Hooks → Posts → Publish → Engage → Capture → Nurture → Convert → Report

THE WEEK:
Mon: Pull insights (30 min)
Tue: Plan + hook (1 hr)
Wed: Write drafts (1-2 hr)
Thu: Review + schedule (30 min)
Fri: Publish + engage (1 hr) + Review (15 min)

THE FLOOR:
3 posts/week, 1 audit capture, 1 weekly review

THE RULE:
Pick a cadence you can keep. Never miss it.

THE SCORING:
Scale >2x avg | Improve avg | Retire <10% reply rate
```

---

## Implementation: 30 Days

### Week 1: Set Up
- [ ] Copy this document to Notion
- [ ] Create idea bank database in Notion
- [ ] Set up `/audit` form endpoint
- [ ] Verify nurture engine running (cron active)
- [ ] Choose north star metric (audits requested)

### Week 2: First Campaign
- [ ] Pull 5 findings from last 10 audits
- [ ] Write 3 posts using hook library
- [ ] Brief each post with problem/angle/hook
- [ ] Schedule Tue/Thu/Sat at 9 AM
- [ ] Test capture: comment → reply → `/audit` link

### Week 3: Publish + Engage
- [ ] Publish on schedule
- [ ] Reply to every comment within 1 hour
- [ ] Log 3 new findings from conversations
- [ ] Send first 5 audits (manual or nurture-triggered)
- [ ] Track position for each lead

### Week 4: Report + Improve
- [ ] Fill Weekly Reporting Sheet
- [ ] Run `monitor_tracks.py`
- [ ] Score each track: Scale/Improve/Retire
- [ ] One decision: what to change next week
- [ ] Plan month 2 from winners

---

## Tool Stack

**Minimum (free):**
- Notion (idea bank + workflow)
- Google Docs (writing)
- LinkedIn (distribution)
- `/audit` endpoint (capture)
- `nurture_engine.py` (automated sequences)
- `monitor_tracks.py` (metrics)

**Advanced (when scaling):**
- Scheduler (Buffer, Hootsuite, or native)
- Canva Pro (carousels)
- Calendly (call booking)
- Stripe (checkout for $97 implementation)
- Twenty CRM (pipeline tracking)

---

## File Integration

This system connects to your existing infrastructure:

| Stage | Nebula File | This System |
|-------|--------------|--------------|
| Audit Insights | `deliver_audit.py` outputs | Stage 1 input |
| Capture | `platform_api/routes/audit_api.py` | Stage 7 |
| Track Assignment | `track_assignment.py` | Stage 8 trigger |
| Nurture | `nurture_engine.py` + templates/ | Stage 8 execution |
| Reporting | `scripts/monitor_tracks.py` | Stage 10 metrics |

**New file needed:**
- `scripts/pull_audit_insights.py` — extracts findings from last N audits for content planning

---

## Next Steps

1. Create idea bank in Notion (or extend `lead_manager.py`)
2. Build `pull_audit_insights.py` script
3. Copy hook library into working document
4. Schedule first week (3 posts)
5. Publish + track

---

**End of Nebula Content Operating System v1.0**
