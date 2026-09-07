# Nebula Agency OS — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a coordinated agency-grade marketing OS that runs link building, content, pitch follow-up, brand monitoring, and weekly reporting automatically — without requiring manual prompting.

**Architecture:** Eight cron-driven scripts operating as independent agents, each appending to shared JSONL ledgers. A Friday orchestrator reads all ledgers and generates the weekly brief. All sends go through the existing `AgentMailClient` + `outbound_release_gate`. All new leads register in `lead_state.db`.

**Tech Stack:** Python 3.11, AgentMailClient, lead_state.db (SQLite), DataForSEO MCP, web_search, existing nebula venv, Hermes cron scheduler.

## Global Constraints

- No em-dashes in any generated copy
- No AI tells: leveraging, holistic, seamlessly, delve, robust, synergy, unlock, game-changer, cutting-edge, innovative
- All email sends via `AgentMailClient(inbox='mike@nebulacomponents.com')` with `client_id` prefix `campaign:`
- All new outreach targets registered in `/home/mike/nebula/lead_state.db` before send
- No outreach without a specific, traceable reason (data, signal, or finding)
- All scripts are no_agent crons — stdout triggers delivery, silence means nothing to report
- Scripts live in `/home/mike/nebula/scripts/` (source) and `/home/mike/.hermes/scripts/` (cron copy)
- Ledger files live in `/home/mike/nebula/seo/ledger/`

---

### Task 1: Pitch Follow-Up Engine

**Blocks:** none (can start immediately)
**Demoable:** Running the script generates and sends 7-day and 14-day follow-ups for any pitch where no reply has been received.

**Files:**
- Create: `/home/mike/nebula/scripts/pitch_followup_engine.py`
- Create: `/home/mike/nebula/seo/ledger/pitches.jsonl` (seeded with CXL, Unbounce, Demand Curve sends)

**What it does:**
- Reads `pitches.jsonl` — each row: `{email, subject, sent_at, thread_id, status, follow_up_1_sent, follow_up_2_sent}`
- Checks `mike@nebulacomponents.com` inbox for replies on each thread
- If no reply after 7 days: sends follow-up 1 (soft nudge, adds one new data point)
- If no reply after 14 days: sends follow-up 2 (final close, offers to send draft directly)
- Updates `pitches.jsonl` with follow-up sent timestamps and reply status
- Silent if no actions needed

**Follow-up 1 template (7 days):**
```
Subject: Re: [original subject]

Hi [name],

Wanted to follow up on the pitch I sent last week.

One additional data point that might make this more compelling: social proof issues have the highest per-finding impact score in our dataset (4.3/5) but appear in only 7.1% of pages. That means when it's wrong, it's very wrong -- and it's almost never on anyone's radar.

Happy to send a full draft if that would make the decision easier.

Mike
Nebula Components
```

**Follow-up 2 template (14 days):**
```
Subject: Re: [original subject]

Hi [name],

Last follow-up on this. I've written a full 2,500-word draft if you'd like to read it before deciding -- no commitment to publish, just easier to evaluate with something concrete in hand.

Happy to send it over. Otherwise no worries.

Mike
```

- [ ] Create `/home/mike/nebula/seo/ledger/` directory
- [ ] Create `pitches.jsonl` seeded with CXL, Unbounce, Demand Curve entries using real thread IDs from send results
- [ ] Write `pitch_followup_engine.py` with reply-check logic and follow-up send logic
- [ ] Test dry-run: `python3 scripts/pitch_followup_engine.py --dry-run`
- [ ] Copy to `~/.hermes/scripts/pitch_followup_engine.py`
- [ ] Register cron: daily at 9am ET, deliver to origin

---

### Task 2: Competitor Backlink Gap Monitor

**Blocks:** none (can start immediately)
**Demoable:** Running the script outputs the top 5 new domains linking to CXL/Unbounce but not to Nebula, with contact angles.

**Files:**
- Create: `/home/mike/nebula/scripts/backlink_gap_monitor.py`
- Create: `/home/mike/nebula/seo/ledger/backlink_gaps_seen.json`

**What it does:**
- Uses DataForSEO `backlinks_domain_intersection` to compare Nebula vs CXL, Unbounce, Hotjar, CrazyEgg
- Filters to domains with rank > 150 (quality threshold)
- Deduplicates against previously seen gaps
- Outputs top 5 new gap targets: domain, their rank, link angle (what they covered that linked to competitor)
- Appends new gaps to `link_opportunities.jsonl` with type=`competitor_gap`
- Silent if no new gaps above threshold

- [ ] Write `backlink_gap_monitor.py` using existing DataForSEO MCP patterns from `link_opportunity_scanner.py`
- [ ] Add dedup via `backlink_gaps_seen.json`
- [ ] Test against live DataForSEO data
- [ ] Copy to `~/.hermes/scripts/`
- [ ] Register cron: every Monday 7am ET

---

### Task 3: Unlinked Brand Mention Monitor

**Blocks:** none (can start immediately)
**Demoable:** Running the script finds pages that mention "Nebula Components" or "nebulacomponents" without linking, and outputs the top results with contact angles.

**Files:**
- Create: `/home/mike/nebula/scripts/unlinked_mention_monitor.py`
- Create: `/home/mike/nebula/seo/ledger/mentions_seen.json`

**What it does:**
- Searches `"Nebula Components" -site:nebulacomponents.com -site:nebulacomponents.shop` via web_search
- For each result, checks whether the page contains a link to nebulacomponents.com
- If mentioned without link: queues as an outreach opportunity with type=`unlinked_mention`
- Appends to `link_opportunities.jsonl`
- Silent if no new unlinked mentions

- [ ] Write `unlinked_mention_monitor.py`
- [ ] Add seen dedup via `mentions_seen.json`
- [ ] Test: verify it correctly distinguishes linked vs unlinked mentions
- [ ] Copy to `~/.hermes/scripts/`
- [ ] Register cron: every Tuesday 8am ET

---

### Task 4: Content Brief Queue

**Blocked by:** none (can start immediately)
**Demoable:** Running produces 6 SEO-targeted content briefs for the next 6 blog posts, each targeting a specific acquisition query with search volume > 100/month.

**Files:**
- Create: `/home/mike/nebula/scripts/content_brief_queue.py`
- Create: `/home/mike/nebula/seo/ledger/content_briefs.jsonl`

**What it does:**
- Pulls keyword gap data from existing GSC/keyword reports
- Targets queries where:
  - Nebula has no content
  - The query has clear buyer/acquisition intent (e.g. "landing page audit tool", "why is my conversion rate low")
  - Competitor content exists (proving the query converts)
- Generates a structured brief per query: title, H1 question, target word count, required data from audit DB, external citations to include, internal links to include, CTA
- Each brief is a valid input for the blog pipeline
- Briefs stored in `content_briefs.jsonl` with status=`queued`

Target queries to seed (from prior keyword research):
1. "landing page audit tool" — tool comparison intent, Nebula vs Hotjar/VWO
2. "why is my conversion rate low" — diagnostic intent, high volume
3. "landing page not converting" — exact match to existing post but more depth needed
4. "conversion rate optimization checklist" — listicle format, linkable
5. "ad spend not converting" — trigger audience exact match
6. "landing page message match" — technical CRO, cites research

- [ ] Write `content_brief_queue.py` pulling from GSC data + keyword gap
- [ ] Seed with 6 briefs above as baseline
- [ ] Validate brief schema matches blog pipeline frontmatter requirements
- [ ] Copy to `~/.hermes/scripts/`
- [ ] Register cron: every Sunday 8am ET (generates briefs for the week ahead)

---

### Task 5: Directory Listing Status Watcher

**Blocks:** none (can start immediately)
**Demoable:** Running checks whether SaaSHub, Capterra, and AlternativeTo listings are live and alerts on any status change.

**Files:**
- Create: `/home/mike/nebula/scripts/directory_status_watcher.py`

**What it does:**
- Checks `saashub.com/nebula-components` — looks for "pending" vs live listing indicators
- Checks `capterra.com` for Nebula Components listing (search by name)
- Checks `alternativeto.net/software/nebula-components/` for pending vs approved status
- Outputs status changes only (silent if all statuses unchanged)
- When a listing goes live: outputs alert with the live URL + optimization action (add screenshots, request reviews, update description)

- [ ] Write `directory_status_watcher.py` using `web_extract` for each directory
- [ ] Define "pending" vs "live" detection logic per directory
- [ ] Test against current known-pending state
- [ ] Copy to `~/.hermes/scripts/`
- [ ] Register cron: every Wednesday 9am ET

---

### Task 6: Internal Linking + Audit CTA Fix

**Blocks:** none (can start immediately)
**Demoable:** Both blog posts link to `/audit` and to each other. The internal linking validator passes with no orphans.

**Files:**
- Modify: `/home/mike/nebula/customer-portal/app/blog/content/paid-traffic-not-converting.md`
- Modify: `/home/mike/nebula/customer-portal/app/blog/content/what-we-got-wrong-about-filter-based-targeting.md`

**What it does:**
- Adds a `[Run the free audit](/audit)` CTA near the end of post 1 (acquisition lane — required by pipeline)
- Adds cross-links between the two posts (post 1 references post 2, post 2 references post 1)
- Submits both URLs to GSC via Indexing API for faster crawl pickup
- Verifies both posts pass the `NEXT_STEP` pipeline gate

- [ ] Edit post 1 to add `/audit` CTA paragraph before the FAQ section
- [ ] Edit both posts to add cross-reference link to the other post in the "related reading" section
- [ ] Run `python3 scripts/content_pipeline/review_draft.py --draft` on both to verify NEXT_STEP passes
- [ ] Submit both URLs to GSC Indexing API: `claude-seo run indexing_notify.py https://nebulacomponents.com/blog/paid-traffic-not-converting`
- [ ] Rebuild and verify live

---

### Task 7: Blog → Audit Conversion Tracking

**Blocked by:** Task 6 (needs audit CTA in posts first)
**Demoable:** PostHog captures a `blog_audit_click` event with `{source_post, referrer}` when a user clicks the `/audit` CTA from a blog post.

**Files:**
- Modify: `/home/mike/nebula/customer-portal/app/blog/[slug]/page.tsx`

**What it does:**
- Wraps the `/audit` CTA in the blog page with a PostHog `capture()` call
- Event: `blog_audit_click`, properties: `post_slug`, `content_lane`, `post_type`
- Allows attribution: "blog posts drove N audit starts this week"

- [ ] Add PostHog client-side event on audit CTA click in `page.tsx`
- [ ] Verify event fires in PostHog dashboard after click
- [ ] Rebuild + restart

---

### Task 8: Reply Monitor for All Pitches + Weekly Agency Brief

**Blocked by:** Tasks 1-7 (reads their ledgers)
**Demoable:** Every Friday at 6pm ET, a Telegram message arrives summarising: domain rank change, new referring domains, pitches sent/replied/accepted this week, directory approvals, new backlink gaps found, content briefs queued, keyword position changes.

**Files:**
- Create: `/home/mike/nebula/scripts/weekly_agency_brief.py`
- Modify: `/home/mike/.hermes/scripts/cxl_reply_monitor.py` → expand to watch all pitches

**Weekly brief covers:**
1. **Domain score** — current rank vs last week
2. **Referring domains** — new domains added this week (from DataForSEO diff)
3. **Pitches** — sent, opened (if trackable), replied, accepted this week
4. **Directories** — status of SaaSHub, Capterra, AlternativeTo
5. **Content** — posts published, briefs queued, word counts
6. **Backlink gaps** — top 3 new competitor gap targets surfaced
7. **Unlinked mentions** — new mentions found
8. **GSC** — top keyword position changes vs prior week
9. **Next week priority** — single recommended action

**Format:** Concise, punchy, numbers-first. No fluff. Under 400 words.

- [ ] Write `weekly_agency_brief.py` reading from all ledgers + live DataForSEO + GSC
- [ ] Expand `cxl_reply_monitor.py` to watch all pitches in `pitches.jsonl`, not just CXL thread
- [ ] Test brief generation with current data
- [ ] Copy to `~/.hermes/scripts/`
- [ ] Register cron: every Friday 6pm ET, deliver to Telegram

---

## Execution Order

Tasks 1-6 have no dependencies and can run in parallel.
Task 7 blocked by Task 6.
Task 8 blocked by all others (reads their outputs).

Recommended parallel dispatch: Tasks 1, 2, 3, 4, 5, 6 simultaneously.
Then Task 7 after Task 6 is verified.
Then Task 8 last.
