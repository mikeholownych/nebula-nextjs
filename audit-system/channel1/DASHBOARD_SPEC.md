# Channel 1 - Weekly Dashboard Spec (Decision-First)

**Purpose:** One 15-minute Friday review. Every number below maps to one
decision: KEEP (scale), FIX (copy/research), KILL (angle), or ESCALATE (to you).
If a number doesn't trigger a decision, it doesn't belong here.

**Run it:** `cd /home/mike/nebula/audit-system/channel1 && python3 weekly_rollup.py`
Pulls live from pipeline_sheet.csv + stats.json + reply_diagnostics.jsonl + kill_log.jsonl.

**Operational artifact:** `FRIDAY_CHECKLIST.md` - the ordered execution runbook.
Review order matters and is enforced by the rollup:
**0. Freshness → 1. Revenue → 2. Audit rate → 3. Reply rate → 4. Sourcing volume.**
Volume is reviewed LAST because volume on a dead message only multiplies noise.

---

## 1. Revenue (the only lagging number that matters)

| Metric | Source | Green | Yellow | Red | Decision |
|---|---|---|---|---|---|
| Fix Pack purchases ($97) | Stripe + ops-finance ledger | ≥1/wk | 1 every 2 wks | 0 in 4 wks | RED → stop adding new sources, fix offer/delivery first |
| Audits → purchase rate | pipeline_sheet.csv | ≥10% | 3–9% | <3% | Below 10% → the audit isn't qualifying, not the traffic |
| Avg days to purchase | pipeline_sheet.csv | <14 | 14–30 | >30 | Slow close → add day-10 close to every sequence |

**Decision rule:** revenue is the ONLY metric that cannot be gamed by volume.
If revenue is red, do not send more outreach. Diagnose the funnel first.

## 2. Volume & Throughput (leading indicators)

| Metric | Source | Green | Yellow | Red | Decision |
|---|---|---|---|---|---|
| Offers sent / week | stats.json `emails_sent` delta + sheet | 5–10 | 3–4 | <3 | Below 3 → you're not doing the daily 17-min routine; fix process, not copy |
| Prospects in sheet | pipeline_sheet.csv count | 30–50 by wk 6 | 15–29 | <15 | Sourcing is the bottleneck → add a lane (creator posts, search, recircle) |
| Touches per prospect | sheet `last_contact` | ≤3 | 4 | >4 | You're stalking. Stop. Recircle after 30 days with fresh angle only |

## 3. Reply Rate & Diagnostics (the copy feedback loop)

| Metric | Source | Green | Yellow | Red | Decision |
|---|---|---|---|---|---|
| Reply rate per angle | stats.json `trigger_reply_rate` (per batch/angle) | ≥20% | 10–19% | <10% | <10% → S1 trigger stale or S3 reason wrong - diagnose, rewrite, resend |
| No-reply after 10 sends (same angle) | sheet + reply_diagnostics.jsonl | - | - | 10 sends, 0 replies | **KILL the angle.** Never resend as-is. Fix S1/S3, then re-test on 5 fresh leads. Tag the kill reason: `bad_list | weak_proof | bad_framing | too_much_friction | stale_sample | too_few_sends` via `weekly_rollup.py --kill "<angle>" --reason <reason>` → `kill_log.jsonl` |
| Diagnostic failure distribution | reply_diagnostics.jsonl (S1–S4) | - | - | - | Whichever stage fails most = the fix target for next batch |

**Diagnostic mapping (from `diagnose_reply` in agentmail_client.py):**
- **S1 fail (Trigger):** they don't see the event you referenced → research quality, not copy
- **S2 fail (Who):** they don't trust you → add proof (audit artifact, number, prior work)
- **S3 fail (Why them):** they don't feel the pain → wrong segment or wrong framing
- **S4 fail (Ask):** they engage but won't act → friction too high (call vs $97 link), or they're not qualified

**48-hour rule:** any reply (or notable non-reply pattern) gets diagnosed within 48h -
that's the loop that improves copy week over week. `reply_monitor.py` logs these
automatically; the failure distribution is your weekly copy to-do list.

## 4. Audit Pipeline (value delivery health)

| Metric | Source | Green | Yellow | Red | Decision |
|---|---|---|---|---|---|
| Audits requested / wk | pipeline_sheet.csv + PostHog | ≥3 | 1–2 | 0 | RED → offer not visible enough in touch 1; lead with audit artifact |
| Audits delivered | pipeline_sheet.csv | = requested | lagging | < requested | Fix delivery path - every requested audit delivered within 24h |
| Pre-audited prospects (score ≥8) | sheet notes | most of batch | some | none | Pre-audit = highest reply play; do it before outreach, not after |

## 5. Channel 2 Check (once every 2 weeks, 2 minutes)

| Metric | Source | Decision |
|---|---|---|
| Any Channel 1 reply signal yet? | this dashboard | NO → do not start Channel 2 pages. YES + sustained → begin 3–5 bottom-funnel pages |

---

## The Decision Matrix (print this)

```
REVENUE RED        → stop outreach, fix offer/delivery
REPLY <10%         → fix S1/S3, rewrite, 5 fresh leads
10 SENDS 0 REPLIES → KILL angle, diagnose, new angle
AUDITS 0/wk        → put audit artifact in touch 1
SHEET <15          → add sourcing lane, not more sends
ALL GREEN          → double batch size to 10/wk, keep pre-auditing
```

## What NOT to look at weekly

- Total emails sent (vanity - drives the wrong behavior)
- Individual message open rates (too noisy at this volume)
- PostHog pageviews (that's Channel 2 / demand capture - separate review)
- Revenue compared to an agency's numbers (you're solo; compare to last week only)
