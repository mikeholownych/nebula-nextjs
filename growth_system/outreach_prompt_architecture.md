# Nebula Outreach Prompt System — Conversation Design for Autonomous LinkedIn Outreach

**Source:** Kakiyo / Claude Sonnet 5 LinkedIn playbook
**Core steal:** Instead of rigid templates, give an agent instructions on HOW to hold a conversation — start to finish, for every prospect, in parallel.
**Nebula application:** Chain existing assets (Voice DNA, ICP MEMO, cold_email_frameworks, reply_templates) into a single prompt architecture that can run on Sonnet 5.

## Why This Matters

Kakiyo claims 30-40% reply rate vs 5-10% for template sequences. The difference isn't the model — it's the architecture. Templates treat every prospect the same. Conversation design treats every prospect as a unique interaction with a shared set of instructions.

Sonnet 5 makes this feasible because it can run the full conversation loop autonomously. Nebula's current system is template-first. This prompt system is conversation-first.

## The 8-Prompt Chain

Run these in order, in the same chat context, so the AI retains the full frame.

### Prompt 1: Build ICP Filter (Signal Definition)

```
You are identifying prospects for Nebula Components — a free landing page audit tool for founders burning ad spend.

Define exactly who to target using SIGNALS, not demographics:
- SIGNAL: Recently posted about ad spend with no conversions
- SIGNAL: Commented on a CRO/landing page post expressing frustration
- SIGNAL: Job change to Head of Growth / CMO / VP Marketing (first 90 days — most open to new tools)
- SIGNAL: Company just raised funding and is hiring marketing roles

Nebula's ICP: Founders who have spent $2k-$20k/mo on ads with zero or near-zero conversions.
The trigger is BEHAVIORAL (active suffering from ad waste), not demographic.

When you find a match, log:
- name + profile URL
- the specific signal
- their estimated ad spend frustration level (1-5)
- industry
- company stage

[Paste your website URL here — turn web search ON]
```

### Prompt 2: Capture Voice (Voice DNA Load)

```
Read the following voice documents and synthesize a voice profile for Mike Holownych (Nebula Components).

Documents to ingest:
- Nebula_Voice_DNA.md (voice rules, banned words, hook patterns, proof rules)
- ICP_MEMO.md (forensic buying language)
- linkedin_80_20_review.md (content pillars)

Key voice rules:
- Short declarative sentences. 12-18 words average.
- Dollar amounts always: "$97 fix pack" not "premium service tier"
- NEVER use: leverage, unlock, elevate, optimize (use fix/improve), best-in-class, holistic, seamless
- NEVER say: "book a call," "jump on a call," "let me know"
- Lead with the problem or the number: "$3,000/mo ad spend. Zero conversions. Here's the leak."
- One claim per sentence. One idea per paragraph.

Voice profile generated: [INSERT HERE]

Keep this profile at the top of the chat for ALL subsequent messages.
```

### Prompt 3: Research Prospect (Individual Deep-Dive)

```
Research this prospect for a personalized outreach:

Prospect: [paste LinkedIn URL or profile info]

Read:
1. Their profile headline, about section, and featured
2. Their recent posts (last 30 days)
3. Their comments on recent posts

Identify:
- What specific problem are they expressing (even implicitly)?
- What industry/vertical are they in?
- What's their likely ad spend situation? (look for clues: "spent X," "tried Y platform," "agency burned me")
- What's the most specific, non-generic way in?

Output a 3-line research brief:
1. Who they are + what they do
2. The pain signal you found
3. Your specific angle for the first message
```

### Prompt 4: Write Icebreaker (First Message)

```
Write a first LinkedIn DM or connection request note for this prospect.

Rules:
- Must reference something SPECIFIC about their profile, post, or comment
- Must lead with a relevant insight, not a pitch
- Must NOT ask for a meeting, call, or demo
- Must be short: 2-3 sentences max for connection request, 3-5 sentences for DM
- Must pass the Nebula Content Firewall (no AI vocabulary, no vendor camouflage)

Available frameworks from cold_email_frameworks.json:
- linkedin_comment_outreach: "Saw your comment on [creator]'s post about [topic]. [relevant take]. [audit URL]"
- signal_quick_fix: "Saw your post about [their problem]. [one-liner about what you noticed]. [free audit link]"
- pain_solution: "[question about pain point]? [audit diagnoses which leak]."

Template starting point (REWRITE in your own words, do not copy):
[Saw your comment on {{creator}}'s post about {{topic}}] — [your specific insight based on research].
I built a free tool that diagnoses the exact conversion leak on landing pages — curious if it finds the same patterns on yours: nebulacomponents.shop/audit

Output: The message. Nothing else.
```

### Prompt 5: Run Conversation (Reply Handling)

```
You are handling a reply from a prospect who received the icebreaker message.

Current context (paste conversation so far):
[conversation]

Prospect's reply:
[their reply]

Your job: Write the next message.

Rules:
- Read what they actually said. Respond to IT, not your agenda.
- If they asked a question, answer it directly and honestly.
- If they expressed skepticism, address the real objection (see Prompt 6).
- If they expressed interest, move toward qualification (see Prompt 7).
- Stay in Nebula's voice — short, direct, no fluff.
- Never pressure. Never ask "jump on a call." Never pitch the $97 before they've run the audit.

Available response templates from linkedin_reply_templates.json:
- question_about_audit: Explains how the 5-dimension audit works
- skeptical: "Fair question. The audit is a fixed rubric, not AI guesswork."
- sharing_pain: "That's exactly who this is for. Run it — 30 seconds."
- objection_free: "No catch. The audit is free with no email gate."

Output: The next message. Just the message.
```

### Prompt 6: Handle Objections (Objection Lab)

```
Prospect said:
[paste their exact words]

Read the REAL objection behind their words:
1. Is it skepticism? ("How is this different from...")
2. Is it trust? ("I've been burned by agencies before")
3. Is it priority? ("We're busy with other things right now")
4. Is it fit? ("Does this work for [my industry]?")

Available cold email frameworks for objection handling:
- guarantee: "If it doesn't show you at least 3 conversion leaks, you're out nothing."
- silent_objection_pre_empt: "I get it — last agency charged for 'testing' and delivered nothing."

ICP MEMO language for objections:
- "Your page is leaking ~$X/month. Here's the audit."
- "Last agency charged you for 3 months of 'testing' and delivered nothing? This isn't that. 30 seconds."

Output: Two alternative responses. Let the human pick.
1. Direct answer to their specific objection
2. Alternative angle (if direct doesn't land)
```

### Prompt 7: Book Signal (Close Detection)

```
Read this conversation and assess readiness:

[conversation]

Signal checklist:
□ Prospect has run the free audit
□ Prospect has acknowledged the audit found issues
□ Prospect has asked "how much" or "what's next"
□ Prospect has expressed frustration about not knowing what to fix
□ Prospect HAS NOT expressed budget constraints or timing issues

Decision:
- BOOK NOW: If 3+ signals present. Write the message that books.
- NOT YET: If <3 signals. Write the next value step (offer to review their audit results personally, share a relevant case study).
- DEAD: If prospect explicitly said no or stopped replying after 2 follow-ups. Move to revive cadence (Prompt 8).

Booking message template (BOOK NOW):
"You've got your audit results. Want me to implement the fix? $97, full refund if your conversion rate doesn't improve within 14 days. Nebulacomponents.shop/$97-fix. Are you in?"

Output: Decision + next message.
```

### Prompt 8: Revive Cold Conversations

```
This conversation went cold. Here's the thread:

[conversation]
[last message was sent X days ago]

Write a re-engagement message.

Rules:
- Reference the PREVIOUS conversation naturally ("circling back on the audit we ran")
- Add NEW value — a recent case study, a new feature, a relevant industry data point
- Keep it short. Don't apologize for following up.
- If this is the 3rd re-engagement attempt with no reply, mark as dead and move on.
- Never sound needy. "Up to you" is always the closer.

Revive message:
[write message]

Mark as:
□ REPLIED → Move back to conversation flow (Prompt 5)
□ STILL COLD → Move to recircle cadence (re-approach in 30-60 days with fresh trigger)
□ DEAD → Archive
```

## Autopilot Integration (Nebula's Path)

Nebula's existing cron system can implement the 8-prompt chain:

| Prompt | Nebula Cron Equivalent | Gap |
|---|---|---|
| 1. Build ICP | trigger_lead_engine.py + reddit-trigger-monitor | No Sonnet 5 agent running conversations yet |
| 2. Voice | Nebula_Voice_DNA.md (loaded by crons) | Already wired |
| 3. Research | linkedin_post_monitor.py → lead scoring | No individual deep-dive per prospect |
| 4. Icebreaker | cold_email_frameworks.json (8 frameworks) | Static templates, not personalized per prospect |
| 5. Conversation | linkedin_reply_templates.json (13 templates) | No dynamic reply handling — manual only |
| 6. Objections | icp_memo_subject_lines / guarantee framework | Documented but not automated |
| 7. Book | Stripe checkout links | Manual handoff — no AI-led qualification |
| 8. Revive | followup_sequence.py (recycler) | Already automated — good |

**Bottleneck:** Sonnet 5 can run the full loop autonomously. Nebula's current stack runs on Sonnet 4 via Bedrock crons. To close the gap: update the cron model to Sonnet 5 + add a "conversation runner" agent that takes a lead from signal → icebreaker → conversation → book, referencing the 8 prompts as context.

## Competitive Insight

Kakiyo charges for exactly what this prompt system describes. The difference is Nebula owns the stack end-to-end — triggers, audit, delivery, checkout — and only needs the conversation layer to be agentic. Kakiyo is a tool Nebula could replicate internally with the 8-prompt chain + existing infrastructure.

## Key Files Referenced

- `/home/mike/nebula/growth_system/Nebula_Voice_DNA.md`
- `/home/mike/nebula/growth_system/cold_email_frameworks.json`
- `/home/mike/nebula/growth_system/linkedin_reply_templates.json`
- `/home/mike/nebula/ICP_MEMO.md`
- `/home/mike/nebula/linkedin_80_20_review.md`
- `/home/mike/nebula/followup_sequence.py`
- `/home/mike/nebula/linkedin_post_monitor.py`
