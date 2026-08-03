# Revenue and Funnel Evidence Reconciliation
**Date:** 2026-08-02
**Author:** ops-finance
**Scope:** Read-only reconciliation of ledgers, HOT_LEAD.json, stats.json, payments.log, audit-delivery.log, lead_state.db, tracking_log.jsonl

---

## Revenue

| Metric | Value | Source | Verified |
|--------|-------|--------|----------|
| Real revenue | **$0** | revenue-cost-ledger.jsonl (last entry 2026-07-04), payments.log | YES |
| Payment rows in payments.log | 7 | payments.log | YES |
| Real (livemode) payments | 0 | All payment_ids are cs_test_* or simulation flags | YES |
| Test revenue excluded | $7 + $497 + $97 + $97 + $97 + $30 = $825 | payments.log | YES |
| customer-ledger payment rows | 2 | customer-ledger.jsonl | YES |
| Both customer-ledger payments | TEST (cs_test_restart_001, cs_test_a1L9...) | customer-ledger.jsonl | YES |

**Conclusion:** Revenue is $0. No livemode Stripe session ID exists in any file. All payment_ids contain cs_test_ or simulation markers.

---

## Audits Delivered

| Source | Count | Notes |
|--------|-------|-------|
| customer-ledger.jsonl audit_delivered events | 40 | Last entry: 2026-07-11 (test@example.com — test send) |
| audit-delivery.log (JSON lines, sent=true) | 16 | JSONL entries only; rest of 250 lines are plaintext log lines |
| stats.json (main) | 39 | data_updated: 2026-07-13T10:29:33Z |
| dashboard/stats.json | 39 | updated: 2026-07-05T02:57:31Z |

**Discrepancy:** customer-ledger shows 40 events; stats.json shows 39. The 40th entry (2026-07-11, test@example.com) is a test send to nebulacomponents.shop/audit.html — it should not count as a real delivery. **Reconciled real audits delivered: 39.**

**Last real audit delivery:** 2026-07-07T17:07:32Z (support@godlike.host). No real audits delivered since July 7 per any log. 25-day gap as of today (2026-08-02).

---

## Emails Sent

| Source | Count | Notes |
|--------|-------|-------|
| dashboard/stats.json emails_sent | 155 | Updated: 2026-07-05T02:57:31Z; trigger_based_sends=66, hot_lead_pitches_sent=7 |
| stats.json (main) emails_sent | 80 | Updated: 2026-07-13T19:54:23Z; trigger_based_sends=80, hot_lead_pitches_sent=7 |

**Discrepancy flagged:** Dashboard (older, July 5) shows 155 emails; main stats.json (newer, July 13) shows 80. The dashboard was written first when Wave 1-3 outreach (155 emails) had been sent; the main stats.json was rewritten July 13 and reflects only trigger-based sends (80) — the 75-email delta (Wave 1-2 cold outreach) is unaccounted for in main stats.json. **No evidence file reconciles both counts.**

---

## Replies

| Source | Count | Notes |
|--------|-------|-------|
| dashboard/stats.json replies | 3 | warm_leads=1, open_convos=1 |
| stats.json (main) replies | 0 | warm_leads=0, open_convos=0 |
| customer-ledger.jsonl reply events | 0 | No event_type=reply or warm_reply in ledger |
| HOT_LEAD.json warm_replied stage | 1 | kanzariyamihir@gmail.com / referralful.com |
| lead_state.db replied stage | 1 | kanzariyamihir@gmail.com / referralful.com |
| tracking_log.jsonl email_sequence_engine_run | warm_replied_added=2 | 2026-07-08T00:02:06Z run; ozigi.app=positive_inquiry, referralful.com=soft_interest |

**Discrepancy flagged:** Main stats.json shows 0 replies. Dashboard shows 3. tracking_log records warm_replied_added=2 (referralful.com, ozigi.app). HOT_LEAD.json and lead_state.db each show 1 warm_replied (referralful.com only — ozigi.app not reflected in HOT_LEAD). No reply events are recorded in customer-ledger.jsonl at all. **Evidence supports 2 warm replies; neither is ledgered.**

---

## Lead Stages

### HOT_LEAD.json (48 records)

| Stage | Count |
|-------|-------|
| pitch_sent | 27 |
| bounced | 13 |
| closed | 6 |
| warm_replied | 1 |
| recircle_60d | 1 |

- No HOT_LEAD records in paid/checkout/converted stage
- HOT_LEAD.json has 48 records; lead_state.db has 30 rows — **18-record discrepancy**

### lead_state.db (30 rows)

| Stage | Count |
|-------|-------|
| bounced | 23 |
| discovered | 4 |
| audit_delivered | 2 |
| replied | 1 |

- 0 paid rows
- lead_state.db stage names differ from HOT_LEAD.json stage names (no pitch_sent stage in DB)
- The two systems are not synchronized

---

## Stats.json Version Conflict

| Field | main stats.json | dashboard/stats.json |
|-------|----------------|---------------------|
| emails_sent | 80 | 155 |
| replies | 0 | 3 |
| warm_leads | 0 | 1 |
| open_convos | 0 | 1 |
| trigger_based_sends | 80 | 66 |
| updated | 2026-07-13T19:54:23Z | 2026-07-05T02:57:31Z |

Main stats.json is newer (July 13) but shows fewer emails and zero replies — it does not appear to be a superset of the dashboard data. The two files are divergent and neither is authoritative.

---

## Tracking Signal (Latest Activity)

| Date | Event | Detail |
|------|-------|--------|
| 2026-07-08 | email_sequence_engine_run | Day 3 replies processed; 2 warm_replied added, 1 recircle_60d |
| 2026-07-13 | stats.json rewrite | main stats.json updated with 80 trigger sends, 0 replies |
| 2026-07-14 | email opens | lakisha@goldenweeks.co opened twice (pixel fire, 127.0.0.1 — likely bot/proxy) |
| 2026-07-29 | lead_state.db | referralful.com notes updated — research invite sent |
| 2026-08-02 | hot_lead_watcher | actionable=0, changed=False |

---

## Discrepancies Summary

1. **Emails sent:** dashboard=155 vs main stats=80 — 75-email delta unreconciled
2. **Replies:** main stats=0 vs dashboard=3 vs tracking_log=2 warm_replied — no reply event in customer-ledger
3. **Audits:** customer-ledger=40 vs stats=39 — off-by-one explained by test send; reconciles to 39 real
4. **HOT_LEAD vs lead_state.db:** 48 vs 30 records, different stage vocabularies, not synchronized
5. **Revenue-cost-ledger:** last entry July 4; no cost entries exist at all — infrastructure costs (Proxmox, AgentMail) are unlogged

---

## Release-Blocking Unknown

**The reply count cannot be verified from any single authoritative source.**

Three sources give three different numbers (0 / 2 / 3). No reply events exist in customer-ledger.jsonl. The warm_replied tracking_log entry is machine-generated and was not ledgered. Until replies are logged as customer-ledger events with message_id evidence, the funnel conversion rate (emails → replies → paid) cannot be calculated and any reported reply rate is unauditable.

**Action required:** Support agent must pull inbox for kanzariyamihir@gmail.com (referralful.com) and ozigi.app, confirm message content, and create customer-ledger reply events with timestamps and thread_ids.

---

## Evidence Files Cited

- /home/mike/nebula/ledgers/revenue-cost-ledger.jsonl
- /home/mike/nebula/ledgers/customer-ledger.jsonl
- /home/mike/nebula/ledgers/audit-delivery.log
- /home/mike/nebula/ledgers/tracking_log.jsonl
- /home/mike/nebula/ledgers/hot_lead_watcher.log
- /home/mike/nebula/ledgers/followup_sequence.log
- /home/mike/nebula/payments.log
- /home/mike/nebula/HOT_LEAD.json
- /home/mike/nebula/stats.json
- /home/mike/nebula/dashboard/stats.json
- /home/mike/nebula/lead_state.db
