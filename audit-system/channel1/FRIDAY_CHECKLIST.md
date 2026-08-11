# Channel 1 - Friday Operating Checklist (15 minutes, in execution order)

**Purpose:** ONE page. Work top to bottom. Every step says what to check, what
red means, and the EXACT next move. No numbers without a decision.

**Run the board:** `cd /home/mike/nebula/audit-system/channel1 && python3 weekly_rollup.py`

**Why this order matters:** freshness first, because stale data invalidates every
judgment downstream. Revenue before everything, because it's the least gameable
number and your explicit top gate. Audit rate before reply rate, because it tests
whether the offer moves people at all. Sourcing LAST, because volume on a dead
message only multiplies noise.

---

## 0. FRESHNESS (2 min) - do this FIRST, always

- [ ] `stats.json` updated this week? (rollup flags `⚠️ STALE` if not)
- [ ] Pipeline sheet reflects reality (sends, statuses, touches)?
- [ ] If stats.json is stale → **⛔ HARD STOP. Do nothing else until it's green.**
      The rollup refuses to show the board on stale data (use `--force` only to preview while fixing).
      Judging anything on dead data is self-deception.

## 1. REVENUE (3 min) - the only gate that stops everything

- [ ] Fix Pack purchases this week? (Stripe + ops-finance ledger)
- [ ] Audit → purchase rate ≥ 10%?

```
IF RED (0 purchases / <3%):
→ STOP ALL OUTREACH. Do not send one more message.
→ The problem is the offer or the delivery, not the list. Fix before volume.
```

## 2. AUDIT REQUEST RATE (3 min) - does the offer move people?

- [ ] Audits requested this week ≥ 3?

```
IF 0 THIS WEEK:
→ Touch 1 is not making the audit artifact concrete. The opening must SHOW
  value, not promise it: lead with the measured finding (pre-audit first) or
  a sample issue, then the free-audit link. Never lead with the offer.
```

## 3. REPLY RATE & DIAGNOSTICS (4 min) - is the message resonating?

- [ ] Reply rate per angle ≥ 20%? (10–19% = workable, <10% = broken)
- [ ] Any angle at 10 sends / 0 replies? → **KILL IT. Tag the reason.**

```
KILL-REASON TAXONOMY - always tag, so the ledger compounds:
  bad_list         → wrong segment or stale trigger (research, not copy)
  weak_proof       → not enough proof in touch 1 (add audit artifact)
  bad_framing      → S3 wrong - they don't feel the pain you name
  too_much_friction→ ask is a call; drop to $97 link / free audit
  stale_sample     → <5 sends, no statistical basis - don't conclude
  too_few_sends    → same as stale_sample; keep the angle, add volume

Record: python3 weekly_rollup.py --kill "<angle>" --reason <reason> [--note "..."]
```

- [ ] Check S1–S4 failure distribution (reply_diagnostics.jsonl): whichever stage
      fails most is your copy to-do list for next week.

## 4. SOURCING VOLUME (3 min) - only after 0–3 are at least YELLOW

- [ ] Prospects in sheet ≥ 30 (by week 6)? Touches ≤ 3 per prospect?

```
IF RED (<15 prospects):
→ Add a sourcing lane, not more sends. Order of signal strength:
  1. Your post engagers (comments on Nebula posts)
  2. Commenters on 3–5 creator CRO posts
  3. LinkedIn search: founder + ads/CAC/landing page
  4. Existing signal-watcher queue (score ≥8 + real URL)
  5. Recircle 30-day-old leads with a fresh angle

IF GREEN across 0–4:
→ Double batch to 10 offers/week. Keep pre-auditing. Protect the reply SLA.
```

## 5. TEARDOWN PROPAGATION (2 min) - owned-channel validation

- [ ] Run `python3 teardown_tracker.py rollup`

```text
Q1 (distribution): teardown live, founder NOT contacted → contact them TODAY
                   (blog comment / LinkedIn). The channel hypothesis is unproven
                   until the subject is notified.
Q2 (qualification): teardown live >7 days, referral_visits >0, audit_starts = 0
                   → traffic is curiosity. Fix the CTA/offer on the teardown page.
                   visits = 0 → distribution retry (new channel), NOT a new teardown.
Rule: do not publish teardown #4 until #1-#3 show a propagation signal (share,
response, or audit start). Volume without measurement is the old trap.
```

---

## The ruthless version (print this line)

> Revenue red → stop. Audit rate 0 → show the artifact. Reply <10% → rewrite S1/S3.
> 10 sends / 0 replies → kill + tag reason. Sheet <15 → add a lane.
> All green → double the batch.

## Kill ledger (compounding learning)

Every killed angle logged with a reason becomes data for the next batch:
two kills tagged `weak_proof` in a row = proof problem, not message problem.
The graveyard is only useful if every tombstone has a cause of death.
