# Daily LinkedIn Engagement Routine — Nebula Components

**Source:** Vasilije Simic (Undecagon) — "LinkedIn Inbound Funnel"
**Principle:** Content builds attention. Daily engagement converts it into conversations.

## Why This Exists

LinkedIn's algorithm rewards daily active users. More importantly, your ICP is on LinkedIn every day having conversations about problems you solve. Commenting on their posts (and your competitors' posts) is free market research AND lead generation.

## Daily Routine (15-20 min)

### Step 1: Review Trigger Alerts (3 min)

Check the latest output from:
- `linkedin_post_monitor.py` — new engagers on your posts
- Reddit trigger monitor — new buying signals
- Creator posts you're tracking (CRO/landing page space)

**Action:** Reply to every comment on your posts within 24h. Use `linkedin_reply_templates.json` as starting point, rewrite in your voice.

### Step 2: Strategic Commenting (7 min)

Find 3-5 ICP-relevant posts and add value in the comments.

**Where to find them:**
- LinkedIn feed (algorithm surfaces relevant content if you engage correctly)
- Posts from 3-5 CRO creators you follow (Joanna Wiebe, Peep Laja, Talia Wolf, etc.)
- Posts in your target ICP hashtags: #landingpagedesign #conversionrateoptimization #saasgrowth #ppcproblems

**How to comment:**
- Add a specific insight, not "Great post!" or "👏"
- Reference your experience: "We audited 40 pages in this space last month and found..."
- Ask a follow-up question that shows you read the post: "Have you tested whether the headline or the CTA has more impact?"
- Never pitch. Never link. The profile does the selling.

### Step 3: Warm DM Outreach (5 min)

Check for new high-value engagers (score >= 7) from the last 24h.

**Profile** → **Send connection request** (if not connected) → **Wait 24h** → **Send Touch 1 DM**

If already connected: send Touch 1 DM directly.

### Step 4: Track Results (2 min)

Log:
- Comments you left (save links for reference)
- DMs sent (note which touch in the sequence)
- Profile views (YouTube/notebook — track spikes)

## Time Budget

| Activity | Time | Frequency |
|---|---|---|
| Reply to comments on your posts | 3 min | Daily (24h SLA) |
| Strategic commenting on ICP posts | 7 min | Daily |
| Warm DM outreach | 5 min | Daily |
| Track and log | 2 min | Daily |
| **Total** | **17 min** | **Daily** |

## Automation vs Human

**Automated (cron):**
- `linkedin_post_monitor.py` — monitors engagers every 2h
- `reddit-trigger-monitor` — finds buying signals every 4h
- `hot_lead_watcher.sh` — flags high-value leads

**Requires Mike:**
- Replying to comments (use templates as starting point)
- Strategic commenting (can't fake context + personality)
- Sending DM touches (use templates, but rewrite slightly each time)
- Profile optimization (one-time, then quarterly review)

## Metrics to Watch

| Metric | Target | Why |
|---|---|---|
| Comments per day | 3-5 ICP posts | Keeps you visible to ICP + feed relevance |
| DM conversations started | 2-3/week | Warm conversations > cold outreach |
| Profile views/week | 100+ | Shows your content + engagement is working |
| Calls booked/month | 20+ (target from playbook) | Ultimate conversion metric |
