# Sep 2 Launch Checklist — YouTube Audit Channel + Trigger-Aware Lead Gen

**Timeline**: 24 days to Sep 2 launch  
**Goal**: Nebula audit videos live on YouTube, lead gen pipeline in background (no sends yet)

---

## Pre-Launch (Aug 9–Sep 1)

### Video Pipeline (Ships Complete)
- [x] Sonic Foundation (per-segment TTS, pitch variation, whoosh SFX, -14 LUFS)
- [x] Brand sting (2s logo flash hook→body)
- [x] End-screen outro (reserved zones for YouTube interactive elements)
- [x] Brenda Turner voice gate (direct address + fifth-wall narration)
- [x] {PAUSE} markers (natural rhythm at sentence boundaries)
- [x] pytest green (5/5)
- [ ] Deploy to YouTube (manual: turn on channel upload scheduler)

### Lead Gen Pipeline (Ships with No Sends)
- [x] Hunter.io Discovery (Stage 1)
- [x] RB2B webhook handler (Stage 2)
- [x] Claude Intent Scoring (Stage 3)
- [x] AgentMail Outbound (Stage 4, code ready, not deployed)
- [x] n8n Reply Handler (Stage 5, code ready, not deployed)
- [ ] Flask endpoints wired into yt_orchestrator.py
- [ ] lead_state.db schema verified + populated with 50–100 seed prospects
- [ ] RB2B pixel code deployed on nebulacomponents.com
- [ ] Monitoring dashboard (Prometheus/Grafana OR simple JSON API)

### Configuration
- [ ] HUNTER_KEY in ~/.env (verify ~1k credits/year available)
- [ ] RB2B_API_KEY in ~/.env
- [ ] YouTube channel settings: upload scheduler + auto-publish gate
- [ ] n8n workflow saved (not yet activated)

### Testing (end-to-end)
- [ ] Test video produced (discover.py + score_intent.py + produce.py)
- [ ] Mock visitor event → prospect matched + profile aggregated
- [ ] Mock reply → classified as interested + DB updated
- [ ] All 5 stages working with mock data

### Documentation
- [x] Video pipeline playbook (yt_channel/brenda_turner_playbook.md)
- [x] Lead gen playbook (yt_channel/trigger_aware_lead_gen_playbook.md)
- [x] Deployment checklist (this file)
- [ ] Runbook for manual operations (how to manually send emails if needed)
- [ ] SDR brief for Sedrick Murphy (what to do when "interested" replies come in)

---

## Launch Day (Sep 2)

### Morning (8 AM)
- [ ] Deploy code to production (branch merge + deploy)
- [ ] Verify YouTube channel is live + upload scheduler active
- [ ] Run first audit video through pipeline (end-to-end test)

### Midday (12 PM)
- [ ] Post first audit video to YouTube (manual)
- [ ] Configure n8n: pause reply handler (don't activate yet)
- [ ] Initialize lead_state.db with 50 seed prospects from Hunter.io
- [ ] Verify RB2B pixel is active on nebulacomponents.com

### Afternoon (4 PM)
- [ ] Smoke test: RB2B webhook → mock visitor event → DB updated ✓
- [ ] Smoke test: n8n reply webhook → mock reply → classified ✓
- [ ] Monitor: check dashboard for any errors

### Evening (6 PM)
- [ ] Hand off to Sedrick Murphy (SDR): explain pipeline + expected workflow
- [ ] Schedule Week 2 manual send review (Sep 9)

---

## Week 1 (Sep 2–9): Discovery + Intent Scoring

**Goal**: Accumulate prospect DB + intent baseline (no sends)

### Daily (Sep 2–9)
- [ ] Monitor video uploads (0 issues expected, full automation)
- [ ] Monitor RB2B webhook (watch for visitor events)
- [ ] Check lead_state.db: visitor_events accumulating ✓

### By Sep 9
- [ ] At least 1–3 visitor events from real visitors (if traffic)
- [ ] Intent scoring background job completed for all prospects
- [ ] Top 10 high-intent prospects (score ≥75) identified
- [ ] Sedrick Murphy briefed on Week 2 manual sends (top 5 prospects)

### Metrics to Publish
- YouTube videos published: X
- Prospects discovered: ~50
- Visitors tracked: X
- High-intent prospects (≥75): X
- Ready for outbound: "Week 2"

---

## Week 2 (Sep 9–16): Manual Sends + Reply Classification

**Goal**: Validate email messaging before scaling

### Preparation (Sep 9)
- [ ] Review top 5 high-intent prospects (score ≥85)
- [ ] Draft cold email: subject + body (Sedrick Murphy + Hermes)
- [ ] QA email copy (proof-read, personalization check)

### Execution (Sep 10–12)
- [ ] Manually send 5 emails via AgentMail (Sedrick Murphy)
  - [ ] Email 1 sent (date: Sep 10, time: 10 AM)
  - [ ] Email 2 sent (date: Sep 10, time: 2 PM)
  - [ ] Email 3 sent (date: Sep 11, time: 10 AM)
  - [ ] Email 4 sent (date: Sep 11, time: 2 PM)
  - [ ] Email 5 sent (date: Sep 12, time: 10 AM)
- [ ] Record message_id + timestamp in lead_state.db (manual entry)

### Monitoring (Sep 12–16)
- [ ] Reply handler webhook: any replies? (if yes, manually test webhook)
- [ ] Track: opens, clicks, replies (Google Analytics / email provider)
- [ ] Expected reply rate: 0–2 (very low, cold outreach)
- [ ] Classification accuracy: manually verify if replies come back

### By Sep 16
- [ ] At least 1 reply received OR confirmed 0 bounces
- [ ] Email messaging validated (or iterate if 0 replies)
- [ ] Decision: ready to scale automated sends?

### Metrics to Publish
- Manual sends: 5
- Bounce rate: X%
- Open rate: X%
- Reply rate: X%
- Conversion to $97 pack: 0 (too early)
- Status: "Ready for Week 3 automation"

---

## Week 3–4 (Sep 16–30): Automated Sends + Monitoring

**Goal**: Scale outbound, prove intent → conversion relationship

### Preparation (Sep 16)
- [ ] Unlock AgentMail automated sends (≥75 intent threshold)
- [ ] Activate n8n reply handler webhook (classify incoming replies)
- [ ] Set up monitoring dashboard (sends/bounces/opens/clicks/replies/conversions)

### Daily (Sep 16–30)
- [ ] Monitor automated sends (target: 5–10 per day)
- [ ] Monitor bounce rate (alert if > 10%)
- [ ] Monitor reply rate (alert if < 1%)
- [ ] Classify incoming replies (n8n → update lead_state.db)
- [ ] Notify Sedrick Murphy of "interested" prospects (manual follow-up)

### By Sep 23 (Mid-point check)
- [ ] Total sends: ~50
- [ ] Bounce rate: < 5% ✓
- [ ] Reply rate: 2–5% ✓
- [ ] Interested: X prospects
- [ ] Conversions to $97: 0–1 (possible, not expected yet)

### By Sep 30 (End of sprint)
- [ ] Total sends: ~100
- [ ] Bounce rate: < 5% ✓
- [ ] Open rate: > 15% ✓
- [ ] Reply rate: 2–5% ✓
- [ ] Click rate (CTA link): 1–3% of opens
- [ ] Interested: 2–5 prospects
- [ ] Conversions to $97: 0–2 ✓
- [ ] Status: "Ready for Oct 1 scaling"

### Metrics to Publish
- Sends (cumulative): 100+
- Bounce rate: X%
- Open rate: X%
- Reply rate: X%
- Interested prospects: X
- Conversion rate ($97): X%
- Revenue: $0–200 (breakeven or small positive)

---

## Go / No-Go Criteria (Sep 30 Gate)

### Go (Proceed to Oct 1 scaling)
- ✓ Bounce rate < 5%
- ✓ Reply rate > 1%
- ✓ At least 1 interested prospect reached out
- ✓ YouTube channel has > 50 views (traffic signal)

### No-Go (Pause, iterate)
- ✗ Bounce rate > 10% → issue with prospect discovery
- ✗ Reply rate < 1% AND open rate > 20% → email copy issue
- ✗ Zero interested prospects + zero conversions → ICP misaligned

**If No-Go**: Iterate email copy or ICP discovery (Hermes + Sedrick) → re-run Week 3 starting Oct 5.

---

## Oct 1+ (Scale Phase)

### Week 5 (Oct 1–7): Expand + A/B Test
- [ ] Expand seed domain list (partner database, industry verticals)
- [ ] A/B test email subject lines (track open rate delta)
- [ ] Implement multi-touch sequences (if no reply after 5d, send follow-up #2)

### Ongoing Monitoring
- [ ] Dashboard: sends/bounces/opens/replies/conversions (daily)
- [ ] Monthly retrospective: reply rate, conversion rate, revenue
- [ ] Iterate: email copy, subject lines, ICP refinement

---

## Runbook: Manual Operations

### If automated send fails
1. Check lead_state.db: is prospect registered?
2. Check cooldown: has 300s passed since last send?
3. Check AgentMail: is it accessible?
4. Manual workaround: open outbound.py, call `send_cold_email(prospect_id, email, subject, body)`

### If reply webhook fails
1. Check n8n: is workflow active?
2. Test webhook: POST to `/webhook/outbound-reply` with mock payload
3. Check lead_state.db: did contacts.reply_status update?
4. Manual workaround: open n8n_reply_handler.py, call `handle_reply_webhook(payload)`

### If visitor event doesn't match
1. Check RB2B: is pixel firing?
2. Check lead_state.db: does prospect exist?
3. Try fuzzy matching: RB2B posts "Stripe" but DB has "Stripe Inc."
4. Manual fix: update prospects table with correct company_name

---

## SDR Brief (Sedrick Murphy)

**Role**: Manual follow-up on interested prospects

**Workflow**:
1. Each morning, check lead_state.db: `SELECT * FROM prospects WHERE status = 'interested'`
2. For each interested prospect, call + email (personalized follow-up)
3. If converts to $97 pack: update status to 'closed' in DB
4. If converts to subscription: high-five

**Template follow-up call**:
> "Hi {first_name}, I saw your reply to our audit offer. You mentioned {quote from their reply}. 
> Here's what I'd recommend: {personalized recommendation based on audit}.
> Can we schedule 15 min to discuss how we'd implement this for you?"

**Template follow-up email**:
> "Subject: {first_name}, here's the specific fix for {company}"
> 
> Based on your interest, I analyzed your audit results. The top 3 fixes:
> 1. {fix 1}
> 2. {fix 2}
> 3. {fix 3}
> 
> Implementing these alone will recover ~15% of your lost conversions. Our $97 fix pack does exactly this + monitoring.
> 
> When can we start?

---

## Final Checks (Sep 1)

- [ ] All code committed + tested (pytest 5/5)
- [ ] Dependencies installed (lead_gen/requirements.txt up-to-date)
- [ ] Environment variables set (.env has HUNTER_KEY, RB2B_API_KEY)
- [ ] Database schema verified (lead_state.db tables exist)
- [ ] Flask endpoints wired (yt_orchestrator.py imports + registers)
- [ ] Monitoring setup (at least simple JSON API)
- [ ] Team briefed (Sedrick Murphy knows the workflow)
- [ ] Go / No-Go criteria documented (Sep 30 gate)

---

**SHIP IT!** Sep 2, 8 AM UTC → Nebula audit videos live + lead gen pipeline running (Week 1: automation only, no sends).
