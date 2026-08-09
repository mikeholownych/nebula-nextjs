# Weekly Review Ritual: Marketing Machine Accountability

**Frequency**: Every Sunday, 6 PM ET  
**Duration**: 30 minutes  
**Purpose**: Systematic iteration vs reactive firefighting  
**Output**: One data-driven decision for the week ahead

---

## Setup Instructions

### 1. Calendar Invite

**Create recurring event**:
- Title: "Marketing Machine Weekly Review"
- Time: Every Sunday, 6 PM ET
- Duration: 30 minutes
- Repeats: Every week, forever (until Oct 31, 2026)
- Reminder: 30 minutes before

**Add to calendar** (Google Calendar, Apple Calendar, Outlook):
- Set as "Focus time" (block distraction)
- Mark as "Busy" (protect the time)

### 2. Review Template (Google Doc)

**Create new document**: `Marketing Machine - Weekly Reviews`

**Copy-paste this template each Sunday**:

```
=== WEEKLY REVIEW: [DATE RANGE] ===

📊 METRICS (7 days ending [DATE]):

Audits started: ___ (target: 20+, last week: ___)
Audit completion rate: __% (target: 80%+)
Results page views: ___ 
Checkout started: ___
Checkout completed: ___ (target: 2-5)
Revenue (7-day): $___ (target: $200+)
Newsletter signups: ___ (target: 10+)
Lead magnet downloads: ___ (target: 5+)

📈 SOURCE BREAKDOWN (this week):

Landing:     ___ audits, $___ revenue, __% conv rate
Newsletter:  ___ audits, $___ revenue, __% conv rate
Footer:      ___ audits, $___ revenue, __% conv rate
Social:      ___ audits, $___ revenue, __% conv rate
Direct:      ___ audits, $___ revenue, __% conv rate

Highest ROI: __________ (__% conv, $___ revenue)
Lowest ROI:  __________ (__% conv, $___ revenue)

🟢 WHAT'S WORKING:

1. [Highest ROI source/channel]
   • Why: ________________
   • Trend: ↑ or ↓

2. [Second best performing]
   • Why: ________________
   • Trend: ↑ or ↓

3. [Best converting page/CTA]
   • Why: ________________
   • Trend: ↑ or ↓

🔴 WHAT'S FAILING:

1. [Lowest ROI source]
   • Expected: $___
   • Actual: $___
   • Gap: ___

2. [Highest bounce page]
   • Bounce rate: ___%
   • Improvement needed: ___

3. [Broken funnel step]
   • Where: audits → results → checkout
   • Leak: ___% dropping off at ____
   • Hypothesis: ___

❓ QUESTIONS TO ANSWER:

1. Is conversion rate stable or trending?
2. Which source is most profitable (LTV)?
3. Which source has lowest CAC?
4. Are newsletter emails opening?
5. Are lead magnet downloads converting to audits?

💡 ONE CHANGE FOR NEXT WEEK:

Specific test to run (not vague):

Change: [specific, measurable change]
  Example: "Add social proof counter to results page"
  NOT: "Improve conversion"

Why: [data-driven reasoning]
  Example: "Results page has 0% conversion from direct traffic.
  Social proof is missing. Adding '847 audits analyzed' counter
  should increase trust → checkout."

How to measure: [specific metric]
  Example: "Compare checkout rate (direct traffic) week of Aug 12 vs week of Aug 19"

Expected impact: [what success looks like]
  Example: "2-3% → 5%+ conversion rate (50%+ lift)"

✅ ACTION ITEMS (for this week):

1. [ ] [Action item 1]
2. [ ] [Action item 2]
3. [ ] [Action item 3]

📝 NOTES:

[Any other observations, patterns, blockers, ideas]

---

Previous week's test results: [link to last week's review]
```

---

## Running the Review (30 minutes)

### Minute 0-5: Gather Data
- Pull PostHog dashboard (daily funnel)
- Pull source breakdown (revenue by channel)
- Check newsletter stats (open rates, clicks)
- Check lead magnet stats (signups, downloads)

### Minute 5-15: Analyze
- Fill in metrics section (copy numbers from dashboards)
- Identify what's working (highest ROI, best conversions)
- Identify what's failing (lowest ROI, highest bounce, biggest drop-off)
- Answer the 5 questions (stability, profitability, CAC, engagement, attribution)

### Minute 15-25: Decide
- Pick ONE change to test next week (not two, not three)
- Document the change, reasoning, measurement, and expected impact
- Write action items (specific tasks to implement the change)

### Minute 25-30: Commit
- Share review with accountability partner (or save to Google Drive)
- Set reminder for implementation (Monday morning)
- Review previous week's test results (did it work?)

---

## Decision Framework: Choosing the One Change

**Priority order**:

1. **Biggest leak** (highest % drop-off at one step)
   - Example: "Results viewed → Checkout" is 92% drop-off
   - Fix: Add social proof, proof layer, urgency
   - Expected lift: 5-10%

2. **Lowest ROI source** (needs fixing first)
   - Example: "Twitter" = $0 revenue (0% conversion)
   - Fix: Different message angle, different audience, or pause
   - Expected lift: 2-5% or recommendation to pause

3. **Highest ROI source** (double down)
   - Example: "Newsletter" = 10% conversion, $1,455 revenue
   - Fix: More newsletter signups, more frequent send, new topics
   - Expected lift: 10-20% more revenue (from same conversion rate, higher volume)

4. **Simplest win** (quick validation)
   - Example: "Add one word to CTA button" → "Get Started" → "Start Free Audit"
   - Fix: A/B test both versions
   - Expected lift: 2-5%

---

## Accountability Structure

**Weekly commitment**:
- Sunday 6 PM: Run review (30 min)
- Monday 8 AM: Implement ONE change (1-2 hours)
- Friday 5 PM: Measure results (5 min)
- Next Sunday: Report results in review

**Success criteria**:
- Every week has ONE specific change (not multiple, not vague)
- Every change is measured (not just implemented)
- Every measurement informs next week's decision

---

## Examples (Reference)

### Week 1 Review (Aug 12-18)
```
🟢 WORKING: Newsletter (9.6% conv, $1,455)
🔴 FAILING: Twitter (0% conv, $0)
💡 ONE CHANGE: Add social proof to results page
  ("847 audits analyzed" counter)
  Expected: Direct traffic 0% → 3% conv (from proof)
```

### Week 2 Review (Aug 19-25)
```
Results of week 1 change:
  Direct traffic: 0% → 2.1% (SUCCESS: 7% instead of 3%)
  
🟢 WORKING: Newsletter still strong, social proof helped
🔴 FAILING: Landing page bounce still 15% (vs 8% target)
💡 ONE CHANGE: A/B test landing page CTA
  Current: "Get Your Free Score"
  Test: "See Your Landing Page Score (60 seconds)"
  Expected: 2% higher CTA click rate
```

---

## Telegram Reminder Bot (Optional)

Set up Telegram reminder every Sunday 5:30 PM ET:

```
Command in Telegram group:
/schedule_weekly "Marketing Machine Review - Sunday 6 PM ET"

Message: "🎯 Weekly review time! Run your 30-minute analysis. 
Remember: Pick ONE change to test this week."
```

---

## Document Management

**File structure**:
- Google Drive folder: `Nebula/Marketing Machine/Weekly Reviews`
- Naming: `Review_Aug12-18_COMPLETE.txt`, `Review_Aug19-25_COMPLETE.txt`, etc.
- Link from review doc to previous review (chain of decisions)

**Archive**: Save all reviews (future reference, pattern analysis)

---

## First Review: Aug 18, 2026

**Schedule now**:
- [ ] Google Calendar invite set (recurring, every Sunday 6 PM ET)
- [ ] Google Doc template created
- [ ] Telegram alert configured (optional)
- [ ] First review scheduled for Aug 18, 6 PM ET

**Before Aug 18**:
- Aug 12: Launch Phase 1 (UTM, dashboards, lead magnet)
- Aug 12-18: Collect first week of clean data
- Aug 18, 6 PM: Run first review (analyze 6 days of data)

---

**Status**: Weekly review ritual ready for launch (Aug 18, 2026).

This ritual + ONE change per week = compound growth.

By Sep 2: 24 days of data. 4 tested changes. Winners identified. Scale ready.
