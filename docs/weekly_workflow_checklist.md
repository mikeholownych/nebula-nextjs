# Weekly Content Workflow Checklist

**Nebula Content Operating System — Weekly Checklist**

---

## Monday: Pull Audit Insights

**Time:** 30 minutes  
**Output:** 3-5 finding-based ideas

- [ ] Run `python3 scripts/pull_audit_insights.py --days 7 --limit 5`
- [ ] Review findings by category
- [ ] Pick top 3 findings (high severity + specific)
- [ ] Log into idea bank:
  - Finding quote
  - Problem category
  - Angle
  - Working title
- [ ] Check if finding matches existing track (headline, CTA, message, proof)

**Idea bank entry template:**
```
Date: [YYYY-MM-DD]
Finding: "[exact quote from audit]"
Problem: [headline-clarity | cta-friction | message-match | social-proof]
Angle: [your unique take]
Working title: [draft headline]
Track: [which nurture track this feeds]
```

---

## Tuesday: Plan Posts + Write Hooks

**Time:** 1 hour  
**Output:** 3-5 briefs with hooks

- [ ] Choose format for each idea (post, carousel, video)
- [ ] Write 5 hook variants per idea (use hook library)
- [ ] Select best hook (passes checklist)
- [ ] Write brief for each post:
  - Hook (first line)
  - Core insight (audit finding)
  - Proof (data/example)
  - CTA (comment, DM, or /audit)
- [ ] Assign track tag for reporting

**Brief template:**
```
Hook: [first line, under 10 words]
Finding: [source audit]
Insight: [what you'll prove]
Proof: [data, example, or teardown]
CTA: [action + how to capture]
Track: [headline | CTA | message | proof]
```

**Hook checklist:**
- [ ] Under 10 words
- [ ] Specific insight promised
- [ ] Not clickbait
- [ ] Connects to track
- [ ] Not repetitive with last 5 hooks

---

## Wednesday: Write Drafts

**Time:** 1-2 hours  
**Output:** First drafts of all posts

- [ ] Write posts in batch (don't edit yet)
- [ ] One idea per post
- [ ] Hook in first line
- [ ] Proof or example included
- [ ] Clear CTA at end
- [ ] Track tag in metadata

**Post structure:**
```
[Hook — stops scroll]

[Setup — why this matters]

[Insight — what audit data shows]

[Proof — example or teardown]

[CTA — what to do next]

---
Track: [which problem category]
```

---

## Thursday: Review + Schedule

**Time:** 30 minutes  
**Output:** Approved + queued

**Review checklist for each post:**
- [ ] Brand voice correct
- [ ] Facts/numbers checked
- [ ] Names/links correct
- [ ] No typos
- [ ] LinkedIn formatted (short lines, white space)
- [ ] Scheduled for correct time
- [ ] Owner assigned to reply to comments

**Schedule:**
- [ ] Post #1: Tuesday 9 AM
- [ ] Post #2: Thursday 9 AM
- [ ] Post #3: Saturday 9 AM

**Lead capture setup:**
- [ ] `/audit` endpoint ready
- [ ] Reply template for comment capture
- [ ] DM boundary remembered (human-only)

---

## Friday: Publish + Engage + Review

**Time:** 1 hour 15 minutes

### Publishing (15 min)
- [ ] Publish scheduled post
- [ ] Check formatting on mobile
- [ ] Reshare to founder profile
- [ ] Tag team members (if applicable)

### Engagement (45 min)
- [ ] Check LinkedIn every 2 hours OR
- [ ] Reply to all comments within first hour
- [ ] Ask follow-up question
- [ ] Log objections/questions for next week
- [ ] Send `/audit` link to engaged commenters

**Reply format:**
```
[Validate their point]

[Ask follow-up question]

[Offer resource if qualified]
```

**Example:**
```
Comment: "I think our headline is fine."

Reply: "Fair point. Curious — when you look at your ad campaigns, do the headlines match what the ad promised, or explain it differently?"

[If reply engaged] "Want me to audit it free? Link in comments 👇"
```

### Weekly Review (15 min)
- [ ] Run `python3 scripts/monitor_tracks.py`
- [ ] Fill Weekly Reporting Sheet
- [ ] Score each track: Scale / Improve / Retire
- [ ] Identify winning hook
- [ ] Make one decision for next week

**Decision format:**
```
Week of [date]:
- Scale: [track/template that beat 2x avg]
- Improve: [track that was avg — one change]
- Retire: [track that failed — stop]
- Decision: [one thing to change next week]
```

---

## Daily Prompts

**Monday AM reminder:** "Pull 3 insights from last 7 audits. Data first, not guesses."

**Tuesday AM reminder:** "Write 5 hooks per finding. Pick best. Brief each post."

**Wednesday AM reminder:** "Draft batch. No editing yet. One idea per post."

**Thursday AM reminder:** "Review + approve. Schedule Tue/Thu/Sat."

**Friday AM reminder:** "Publish + engage. Reply within 1 hour. Review at end of day."

---

## Monthly Prompts

**Week 1:** Review track distribution. Are we balanced across headline, CTA, message, proof?

**Week 2:** Check hook performance. Which hooks beat 2x avg?

**Week 3:** Audit nurture sends. Which tracks have highest open/reply rates?

**Week 4:** Review pipeline. How many audits → calls booked?

---

## Content Production Minimums

**Floor (can't skip):**
- [ ] 3 posts/week
- [ ] 1 weekly review
- [ ] Reply to every comment

**Target:**
- [ ] 5 posts/week
- [ ] 1 carousel/week
- [ ] 1 video/week
- [ ] 1 lead magnet/month

---

## Compliance Reminders

**LinkedIn:**
- [ ] ✅ Reply to comments (human, <1 hr)
- [ ] ✅ Like comments (auto OK)
- [ ] ⚠️ Send DM (only after opt-in)
- [ ] ❌ Auto-DM (never)

**Capture:**
- [ ] Comment "AUDIT" → Reply with link (human)
- [ ] Post CTA → `/audit` link in post
- [ ] DM request → Send link (human, after explicit request)

---

## Quick Reference

**Scripts:**
```bash
# Pull insights
python3 scripts/pull_audit_insights.py --days 7 --limit 5

# Monitor tracks
python3 scripts/monitor_tracks.py

# Validate system
python3 scripts/validate_content_to_pipeline.py
```

**Docs:**
- Content Operating System: `docs/content_operating_system.md`
- Hook Library: `docs/hook_library.md`
- Track Templates: `templates/` (13 files)
- Compliance: `compliance/linkedin_boundary.md`

**Cron jobs:**
- Nurture trickle: every 5 min
- Track metrics: daily 9 AM (Telegram)

---

**End of Weekly Checklist**
