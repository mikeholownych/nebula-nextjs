# LinkedIn GTM Framework — Nebula Adaptation

**Source:** Regina Kuts, CEO, Profigent — "Stop Treating LinkedIn Like a Content Platform"
**Original:** https://www.linkedin.com/in/regina-kuts/ (July 7, 2026)
**Stolen concept:** LinkedIn as customer discovery engine, not content publishing platform.
**Nebula fit:** Direct. Validates trigger-aware outbound, 98% non-engager stat, and "every post is a test" content philosophy.

## Core Thesis

> LinkedIn isn't a content platform. It's customer discovery disguised as social media.

Most founders stop customer discovery at launch. That's backwards. It should become their GTM.

For Nebula: **Every post, comment, DM, and outbound message is another interview. Analytics tell you what happened. Conversations tell you why.**

Nebula's existing tools map to this directly:
- `linkedin_post_monitor.py` → tracks who engages and why
- `trigger_lead_engine.py` → outbound from day 1
- `linkedin_80_20_review.md` → existing content pillars align
- `linkedin_reply_templates.json` → conversation starter infrastructure

## 7-Step GTM Framework

### Step 1: Start with a hypothesis. Not a content calendar.

**Original:** "Who do you think buys from you? And why?"

**Nebula adaptation:** Nebula's ICP is already forensic (spent $10K+ on ads with zero conversions). Don't write about "CRO tips." Write about the **specific pain of burning ad budget with nothing to show for it.** That's not a demographic — it's a buying trigger.

**Action:** Every LinkedIn post should test one dimension of the ICP hypothesis:
| Test | Post Angle | Success Signal |
|---|---|---|
| Pain validation | "Spent $5K on ads, got 0 conversions. Here's the actual leak." | DMs from founders saying "same" |
| Offer validation | Free audit case study post | Audit signups from post |
| Objection surfacing | "Why your last agency couldn't fix it" | Comments naming past agency trauma |

### Step 2: Rebuild your profile around ONE offer.

**Original:** "One offer. One audience. No mixed signals."

**Nebula adaptation:** Nebula's offer is: **Free audit → $97 fix → $1,497/mo retainer.** The profile headline must answer in 2 seconds:
- Who you help → "Founders bleeding ad spend"
- What problem → "Landing pages that don't convert"
- Why trust → "40+ audits, 2-3x avg CVR improvement"
- Next step → "Free audit at nebulacomponents.shop/audit"

**Action:** Mike's LinkedIn profile headline, about, and featured section should all point at ONE thing: the free audit. No "AI agent OS" or "autonomous business" framing unless it supports the audit funnel.

### Step 3: Talk about your buyer. Not yourself.

**Original:** "Your customers don't wake up thinking about your company. They wake up thinking about their problems."

**Nebula adaptation:** Every Nebula post should answer a question the ICP is already asking:
- "Why are my ads getting clicks but no sales?"
- "Is it my landing page or my offer?"
- "I burned $3K on an agency and they delivered nothing — how do I fix this myself?"
- "How do I know if my landing page is the leak?"

**Test for every post:** If the ICP wouldn't type the headline into Google, don't write it.

### Step 4: Give every post somewhere to go.

**Original:** ""What do you think?" is not a funnel. That's a full stop."

**Nebula adaptation:** This is Nebula's biggest opportunity. Every post should end with a **specific next action** tied to the free audit:

```
Burned $5K on ads with zero conversions?
I built a tool that shows you exactly which leak is killing your page.
Free audit → [link] — takes 30 seconds.
```

Not:
```
What do you think? Drop your thoughts below.
```

**Framework shift:**
| Bad CTA | Good CTA |
|---|---|
| "What do you think?" | "Run the audit on your own page — you'll see the exact same leaks." |
| "Let me know in the comments" | "Curious if your page has this leak. Free audit: [link]" |
| "Follow for more" | "I share one of these breakdowns each week. DM me your URL and I'll audit it manually." |
| "Link in bio" | Specific tool link with a direct action verb |

### Step 5: Run outbound from day one.

**Original:** "98% of LinkedIn users never engage publicly. Content builds familiarity. Outbound starts conversations."

**Nebula adaptation:** This is Nebula's superpower. The trigger-aware outbound engine IS this step — but the content must prime the pump.

**Two-sided engine:**
1. **Content → inbound familiarity** — Founders see your posts, recognize the pain, join the wait to convert
2. **Outbound → direct conversations** — Trigger-aware cold emails + DMs based on buying signals (Reddit posts, LinkedIn comments, ad spend signals)

**Nebula already has:** `trigger_lead_engine.py`, `scripts/trigger_lead_engine.py`, `linkedin_post_monitor.py`
**Gap: No LinkedIn DM sequence for high-value engagers.** The reply templates exist in `linkedin_reply_templates.json` but there's no automated DM outreach for 7+ score engagers.

### Step 6: Let conversations shape your positioning.

**Original:** "Your positioning shouldn't come from brainstorming. It should come from your market."

**Nebula adaptation:** This is what ICP_MEMO.md does already — forensic analysis of what prospects actually say. Every reply, DM, email response, and objection is data.

**Systematize with:** Add a "positioning signals" log to the LinkedIn monitor:
- Objections that keep appearing → update cold email frameworks
- Words prospects use → add to ICP forensic voice doc
- Industries that respond → adjust vertical targeting

### Step 7: Double down.

**Original:** "Stop reinventing everything. Do more of what already works."

**Nebula adaptation:** Track which content angles drive audit signups:
| Content Angle | Audit Signups | Revenue |
|---|---|---|
| Personal story (spent $X, found leak) | | |
| Case study (client page, before/after) | | |
| Educational (5 leaks, how to fix) | | |
| Industry data (X% of pages have problem) | | |
| Trigger-aware (spotted a pattern on Reddit) | | |

Double down on the angle with highest audit→paid conversion rate. Kill angles with engagement but no conversion.

## Quotable Lines for Nebula Posts

> "Content builds familiarity. Outbound starts conversations. Together, they become one engine."

> "Your positioning shouldn't come from brainstorming. It should come from your market."

> "Analytics tell you what happened. Conversations tell you why."

> "98% of LinkedIn users never engage publicly. If you're only playing inbound, most of your market never even knows you exist."

> "Every post is a test. Every reply is feedback. Every conversation makes your positioning stronger."

## Nebula Adaptation — What's Different

| Kuts Framework | Nebula Twist |
|---|---|
| CTA: An audit, a checklist, a template, a call | CTA: The free landing page audit URL |
| Outbound: DM people who engage | Outbound: Trigger-aware email + Reddit + LinkedIn based on buying signals |
| Positioning: Let conversations shape it | Positioning: ICP_MEMO forensic analysis + conversation data |
| Content: Talk about buyer problems | Content: Diagnose specific leaks with dollar figures |
| Profile: One offer | Profile: Free audit → $97 fix → $1,497 retainer (ladder) |

## Files Referenced
- `linkedin_post_monitor.py` — engager tracking
- `linkedin_reply_templates.json` — DM/reply templates
- `linkedin_80_20_review.md` — prior content framework
- `cold_email_frameworks.json` — email templates
- `ICP_MEMO.md` — forensic voice research
- `trigger_lead_engine.py` — outbound engine
