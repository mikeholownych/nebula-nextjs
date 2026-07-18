# Medium Integration — Long-Form Content Pipeline

**Purpose:** Extend existing LinkedIn content workflow to Medium with longer article-style content

**Key differences: LinkedIn vs Medium**

| Aspect | LinkedIn | Medium |
|--------|----------|--------|
| Length | 300-600 words | 1500-3500 words |
| Style | Punchy, scroll-stop | Narrative, evidence-heavy |
| Hook | First line visible | First 2-3 lines in preview |
| CTA | Comment/DM | Link in bio, comments |
| Audience | Warm network | Discovery-driven |
| SEO | Minimal | Strong (evergreen) |

---

## Content Strategy

**One idea → Two formats:**

| LinkedIn Post | Medium Article |
|----------------|----------------|
| Hook + Insight | Data + Deep-dive |
| 1 problem per post | 1 problem + methodology |
| Proof = 1 example | Proof = 3-5 examples |
| CTA = "Comment AUDIT" | CTA = "Full methodology in bio" |

---

## Article Template

### Structure

```
[HEADLINE — Problem + Outcome]

[OPENING — Why this matters]

[THE LEAK — What audit data shows]

[THE FIX — Step-by-step methodology]

[THE EVIDENCE — 3-5 examples from audits]

[THE OUTCOME — What changes when you apply this]

[CTA — Resource or next step]
```

### Example Article

**Headline:** "Your Headline Is Visible. 72% of Founders Don't Know It's Their Biggest Leak."

**Opening (2-3 paragraphs):**
> Last month I audited 50 landing pages. 36 of them had the same problem: vague headlines describing what the product is, not what it does for buyers.
> 
> These weren't amateur sites. YC companies, funded startups, established SaaS—they all made the same mistake.
> 
> Here's what the data shows, and how to fix it.

**The Leak (3-4 paragraphs):**
> When I analyze headlines, I look for one thing: does it promise an outcome, or describe a category?
> 
> "Project Management Platform" → Category
> "Stop Missing Deadlines" → Outcome
> 
> The difference matters. Top-performing pages (the 5% converting above 3%) all share one trait: their headline commits to a buyer outcome in the first 7 words.
> 
> The other 95% write headlines for themselves. They describe their product. They list features. They say what they are.
> 
> Buyers don't read to learn about you. They read to learn about themselves after you.

**The Fix (5-7 paragraphs):**
> Here's the exact methodology I use to audit headlines:
> 
> **Step 1: Identify the Category Claim**
> Find the first 7 words. If it's a category (CRM, Platform, Tool, Software), that's your baseline.
> 
> **Step 2: Extract the Buyer Outcome**
> What happens after someone uses your product? Write that.
> 
> "CRM Platform" → "No More Lost Leads"
> "Marketing Automation" → "Send Emails That Actually Get Opened"
> "AI Writing Assistant" → "Publish in Half the Time"
> 
> **Step 3: Add Specificity**
> Vague outcomes don't convert. Add a number, timeframe, or concrete change.
> 
> "No More Lost Leads" → "Catch Every Prospect Before They Slip Away"
> "Send Emails That Get Opened" → "3x Your Open Rate Without Changing Your List"
> 
> **Step 4: Test Against Ad Promise**
> If your ad says "Stop Losing Leads" and your headline says "CRM for Teams", you've created a disconnect. The fix: match the headline to the ad's promise.
> 
> **Step 5: Read It Aloud**
> If it sounds like you wrote it, rewrite it. Write the way buyers talk when they describe their problem.

**The Evidence (3-5 examples):**
> **Example 1: B2B SaaS (Zapier competitor)**
> Before: "Integration Platform for Apps"
> After: "Connect Your Apps Without Asking Engineering"
> Result: Demo requests +27%
> 
> **Example 2: FinTech (expense tracking)**
> Before: "Expense Management Software"
> After: "No More Receipt Hoarding"
> Result: Trial sign-ups +34%
> 
> **Example 3: DevTool (CI/CD)**
> Before: "CI/CD Pipeline Platform"
> After: "Ship Fast Without Breaking Production"
> Result: Sign-ups +41%
> 
> The pattern is consistent: outcome specificity beats category description every time.

**The Outcome (2-3 paragraphs):**
> When you change your headline from category to outcome, three things happen:
> 
> 1. **Ad spend efficiency** — Your message-match improves. People who clicked expecting "Stop Losing Leads" see "Stop Losing Leads" on the page. Bounce rates drop 15-30%.
> 
> 2. **Organic clarity** — Visitors don't have to guess what you do. The first 7 words tell them what changes for them.
> 
> 3. **Differentiated positioning** — Instead of competing on category ("We're another CRM"), you compete on outcome ("We're the only CRM that catches prospects before they slip away").

**CTA:**
> If you want to see how your headline scores, I'll audit it for free → nebulacomponents.shop/audit
> 
> You'll get specific recommendations tied to your exact copy, not generic best practices.

---

## Conversion Differences

| Metric | LinkedIn | Medium |
|--------|-----------|--------|
| CTR to audit | 1-3% | 3-7% (SEO evergreen) |
| Time to convert | 1-7 days | 7-30 days |
| Attribution | Direct comment | Often indirect |

**Medium attribution:**
- Link in bio (primary)
- Comment link (secondary)
- SEO discovery (delayed)

---

## Publishing Cadence

| LinkedIn | Medium |
|----------|--------|
| 3-5 posts/week | 1 article/week |
| Tue/Thu/Sat | Sunday (long-form day) |
| 9 AM ET | 10 AM ET |

**Workflow:**
- Monday: Pull finding → LinkedIn brief + Medium outline
- Tuesday: LinkedIn post drafted
- Wednesday: Medium article drafted
- Thursday: LinkedIn post scheduled + Medium article reviewed
- Friday: LinkedIn post published + Medium article scheduled for Sunday
- Engage: LinkedIn same-day, Medium within 24 hours

---

## Article Ideas Generation

**From LinkedIn post → Medium article:**

Each LinkedIn post can spawn a Medium article:

| LinkedIn Hook | Medium Headline |
|---------------|-----------------|
| "Your headline is visible..." | "Why 72% of Landing Pages Fail on the First Line" |
| "I audited 50 pages..." | "The 5 Problems Killing Conversions on Funded Startup Landing Pages" |
| "You spent $10k on ads..." | "How to Stop Bleeding Ad Spend: A Data-Driven Audit Approach" |

**Transformation rule:**
- LinkedIn = Hook + one insight
- Medium = Full methodology + 3-5 examples

---

## Medium-Specific Metrics

| Metric | Target | Tracking |
|--------|--------|----------|
| Read ratio | >50% | Medium built-in |
| Claps | >50 | Medium built-in |
| Responses | >5 | Manual |
| Audit requests | >2/week | attribution |

**Medium attribution tracking:**
- UTM parameters on bio link: `?utm_source=medium&utm_medium=article&utm_campaign=headline-series`
- Comment links: Direct to `/audit`
- Email mentions: Track "found you on Medium"

---

## Integration with Nebula Pipeline

```
Monday: Pull finding
  ↓
  ├── LinkedIn brief (5 min) → Tuesday draft (30 min)
  └── Medium outline (10 min) → Wednesday draft (60 min)
               ↓
          Sunday publish (Medium)
               ↓
          Track audit requests (UTM source)
               ↓
          Feed into nurture track
```

**Track-aware articles:**
- Headline-clarity finding → "The 5 Headline Problems Killing Conversions" (headline track)
- CTA-friction finding → "Why Your CTA Is Visible But Ignored" (CTA track)
- Message-match finding → "The Ad-to-Page Disconnect Bleeding Your Ad Spend" (message-match track)
- Social-proof finding → "How to Turn Decorative Testimonials into Evidence" (proof track)

---

## Content Creation Pipeline

### Step 1: Find Finding (Monday)

```bash
# Pull from last 7 audits
python3 scripts/pull_audit_insights.py --days 7 --limit 3

# Result: 3 findings with:
# - Category (track)
# - Observation (quote)
# - Angle (your take)
```

### Step 2: Create Two Briefs (Monday)

**LinkedIn brief:**
- Hook (1 line)
- Insight (3-5 sentences)
- Proof (1 example)
- CTA (comment/link)

**Medium brief:**
- Headline (problem + outcome)
- Opening (why it matters)
- Leak section (what data shows)
- Fix section (step-by-step)
- Evidence section (3-5 examples)
- Outcome section (what changes)
- CTA (resource/link)

### Step 3: Draft LinkedIn (Tuesday)

Use `content_brief_template.md`

### Step 4: Draft Medium (Wednesday)

Use Medium article template above

### Step 5: Review (Thursday)

- LinkedIn: Check hook passes checklist
- Medium: Read ratio optimization
  - Subheads every 3-4 paragraphs
  - Punchy opening
  - Evidence-heavy middle
  - Actionable close

### Step 6: Schedule (Thursday/Friday)

- LinkedIn: Tue/Thu/Sat 9 AM
- Medium: Sunday 10 AM

---

## Automation Scope

**What we CAN automate:**
- Pull findings (Monday)
- Generate brief outlines
- Schedule posts
- Track metrics

**What we CAN'T automate:**
- Writing the actual content
- Engagement/replies
- Medium-specific formatting

---

## Automation Plan

**Monday automation:**
1. Cron job pulls findings at 8 AM ET
2. Generates brief templates (LinkedIn + Medium)
3. Delivers to your inbox or Notion

**Your work (publish + engage):**
- Review briefs
- Write content (or delegate to subagent)
- Schedule posts
- Reply to comments within 1 hour
- Engage with Medium responses

---

**End of Medium Integration**
