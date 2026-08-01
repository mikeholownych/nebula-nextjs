# Channel 1 — Week 1 Rehearsal (simulated first Friday)

**⚠️ This is a REHEARSAL, not real data.** It simulates what the first week
*could* look like so you can rehearse the decision loop before feeding the
machine real sends. All names/outcomes below are illustrative. The mechanics
are real — the rollup, kill ledger, and S1–S4 diagnostics run exactly as shown.

**Replay it yourself:**
```bash
cd /home/mike/nebula/audit-system/channel1
CH1_SHEET=/tmp/ch1-sim/pipeline_sheet.csv \
CH1_STATS=/tmp/ch1-sim/stats.json \
CH1_DIAG=/tmp/ch1-sim/reply_diagnostics.jsonl \
CH1_KILL_LOG=/tmp/ch1-sim/kill_log.jsonl \
python3 weekly_rollup.py
```

---

## The simulated week

- **10 sends:** 7 HN thread replies (the drafts in `ops/proactive_thread_replies_2026-07-31.md`, now posted) + 3 direct DMs on the same "above-fold" angle.
- **2 replies → audit requests** (feedhammer, tryreadaloud) — audits delivered same day.
- **1 reply → "what's the cost?"** (competiflow) — engagement, not conversion.
- **4 no-replies** (grader, cygnus, taste test, cosmos47) — still in sheet, touch 1 sent.
- **1 angle killed:** the direct-DM variant (10 sends, 0 replies) → `bad_framing`.

## The board it produces

```
0. FRESHNESS   stats.json: 2026-08-07  ok · Kill ledger: 1 (bad_framing)
1. REVENUE     0 purchases  [RED] → but AUDIT RATE LIVE → defer $97 ask, don't scale pitches
2. AUDIT       2.0/wk       [YELLOW] — the offer moves people
3. REPLY       2.3% agg     [RED] · diagnostics S1:1, S4:1 → fix target: S4 (Ask)
4. VOLUME      7 prospects  [RED] → add a sourcing lane
```

## Reading each number (the point of the rehearsal)

**Revenue RED + Audit YELLOW — the important nuance.**
Old rule said "revenue red → stop outreach." New rule (implemented this turn):
if audit rate is live, you do NOT stop talking — you stop *pitching the $97
before value delivery*. The audits were requested; deliver them, then the
$97 ask becomes a follow-up, not a cold pitch. Revenue red with audit rate 0 =
stop everything. Revenue red with audit rate live = the funnel is working,
you're just early.

**Reply rate 2.3% aggregate vs ~28% per-angle.**
The aggregate is polluted by 80 historical sends with 0 replies. The thread
replies themselves did 2/7. Lesson: stats.json aggregates hide per-angle
truth — judge angles from the sheet, not the aggregate. (Known limitation,
noted in DASHBOARD_SPEC.)

**Diagnostics S4 + S1 — the copy to-do list for week 2.**
- S4 (competiflow: "what's the cost?") → the ask surfaced price before value.
  Fix: deliver the audit artifact FIRST, price only after. That's already the
  playbook — the diagnosis confirms it.
- S1 (tryreadaloud: "what do you mean no conversion event?") → the trigger
  phrasing was jargon. Fix: name the finding with the number ("no signup event
  fires when someone clicks Install"), not the category ("Ad Signals").

**Kill ledger — the DM variant died with `bad_framing`.**
The lesson compounds: launch ICP founders don't feel ad-spend pain, so the
DM angle that assumed it was S3-mismatched from the start. Thread replies
(S3 = "you just launched, here's a concrete leak") worked. Week 2 drops the
DM variant entirely and doubles down on thread replies + comment-first.

## Week 2 adjustments this rehearsal prescribes

1. Deliver the 2 requested audits (done in-sim) → then offer $97 in the delivery thread.
2. Rewrite touch 1: lead with the measured number, not the category name.
3. Kill the DM variant (recorded). Replace its slot with comment-first DMs on creator posts.
4. Add a sourcing lane — sheet at 7/30 is the binding constraint now.
5. First purchase not expected yet. The machine's job in week 1 was turning
   "0 revenue" from a constant into a diagnosis. It did.

## What's real vs simulated

| Piece | Status |
|---|---|
| 7 HN drafts | REAL — ready in `ops/proactive_thread_replies_2026-07-31.md`, not yet posted |
| Rollup + kill ledger + diagnostics | REAL — verified running |
| Freshness hard stop | REAL — verified: stale stats now blocks the board |
| Revenue-refined decision rule | REAL — verified in the sim board |
| All names, replies, outcomes | SIMULATED — illustrative only |
