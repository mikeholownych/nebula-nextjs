# Gojiberry LinkedIn Playbook — Straight Steals & Integration Notes

**Source:** https://app.notion.com/p/The-LinkedIn-High-Intent-Outreach-System
**Author:** Romàn, co-founder of gojiberry.ai
**Core insight:** Trigger-based outreach beats demographic targeting by 10x. Same thesis as Nebula.

---

## 1. The Micro-DM Sequence (Key Steal)

Nebula's current pattern: "send the landing page, I'll tell you the first leak" (offer in msg 1).
Gojiberry's pattern: **Pure question. No offer. No link. No audit. Just conversation.**

| Step | Gojiberry DM | Word Count | Nebula Equivalent |
|------|-------------|------------|-------------------|
| 1 | "Quick question - what's your biggest challenge with [topic] right now?" | 23 | "Send the page, I'll tell you the first leak" |
| 2 | "Interesting — we just solved that for [company]. Mind if I send a 3-min video?" | 27 | "Saw your results — want me to show you the fix?" |
| Backup | "Hey [Name], noticed you're [observation] — we should chat." | 29 | "Quick value bomb: check if CTA appears before proof" |

**Why this matters:** First message with zero ask = lower friction = higher response. You qualify before you offer. When they answer the question, they've invested — conversion to next step is higher.

**A/B test design:**
- **TEST** (gojiberry_question_first): Pure question, no offer, no link
- **CONTROL** (nebula_audit_first): Audit offer in first DM
- Metric: response rate on first DM

---

## 2. Compressed AI Prompts

### Research Prompt (before writing)
```
Look at this person's LinkedIn profile: [URL]
Identify:
1. Their biggest business challenge based on recent posts
2. Something specific they're working on right now
3. A genuine compliment about their work
Keep it under 50 words total.
```

### Message Writing Prompt
```
Write a 30-word LinkedIn DM to [Name] who just [intent signal].
Their business: [what you learned from research]
Rules:
- Sound like texting a friend
- Reference something specific about them
- Ask one simple question
- No sales language
- No exclamation points
- Max 30 words
```

### Follow-Up Prompt
```
They responded: "[their response]"
Write a 25-word follow-up that:
- Acknowledges their specific situation
- Shares relevant social proof
- Suggests a next step
- Sounds conversational
```

---

## 3. Signal Agent Taxonomy (for LinkedIn)

Nebula currently tracks 6 trigger types (ad_bleed, zero_conversions, etc.) on Reddit/HN.
Gojiberry's LinkedIn agents expand the taxonomy:

| Agent Type | Signal | Nebula Status |
|-----------|--------|---------------|
| Company competitor profile | Follows/interacts with competitors | NOT IMPLEMENTED |
| Influencer profile in field | Engages with trending content | PARTIAL (post_monitor) |
| Recently changed jobs | New role = fresh budget | NOT IMPLEMENTED |
| Top 5% of ICP | Most active in target market | NOT IMPLEMENTED |
| Recently raised funds | Funding = buying intent | NOT IMPLEMENTED |
| Engagement & Interest | Recent interaction with relevant content | PARTIAL (post_monitor) |
| Your company | People engaging with your brand | NOT IMPLEMENTED |

**Nebula gap:** Zero LinkedIn signal detection currently active. All triggers run on Reddit/HN.

---

## 4. 3-Week Ramp (Adapted for Nebula 7-Day Challenge)

| Phase | Actions | Expected Results |
|-------|---------|-----------------|
| Day 1-2 | Setup agents (Reddit triggers + LinkedIn signals) | Capture leads, start convos |
| Day 3-4 | Optimize signals, A/B test patterns | 10-15 conversations |
| Day 5-7 | Scale patterns that work, push audit offers | 1+ paying customer |

Gojiberry's numbers: 300 leads/week → 40-50 conversations → 10-15 calls/bookings.

---

## 5. Mindset Steal (Messaging)

> "Stop thinking about LinkedIn as a professional network. Start thinking about it as a warm lead generation machine. Every post is a net. Every comment is a lead."

Applicable to Nebula's positioning: swap "LinkedIn" for "every touchpoint" and this IS Nebula's trigger-aware thesis.

---

## Implementation Status

- [x] gojiberry_outreach_pattern.py — Draft generator with A/B patterns
- [x] gojiberry-pattern-reference.md — This document
- [ ] Wire into cron workflow (linkedin outreach runner)
- [ ] Activate LinkedIn agent types in trigger engine
- [ ] A/B test: question-first vs audit-first first DM

**Bottleneck:** No LinkedIn API access in current Nebula stack. Patterns are ready for manual/testing use. LinkedIn signal detection requires LinkedIn API or browser automation.
