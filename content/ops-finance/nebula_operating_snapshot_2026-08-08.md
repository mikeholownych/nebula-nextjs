# Nebula Operating Snapshot - Signed-Off Report

**Date:** 2026-08-08
**Task:** t_9c1028cf (ops-finance integrity audit)
**Input:** content/ops-finance/2026-08-08_operating-snapshot.md (t_6dccda4a)
**Constraint:** Read-only. All cross-checks against live sources.

---

## Executive Summary

Nebula Components has **zero real revenue**, **zero paid customers**, and **zero subscriptions** as of 2026-08-08. The revenue funnel is structurally live (webhook, signing secret, livemode filter, fulfillment path all verified) but has never captured a real payment. The lead pipeline holds 47 production records in HOT_LEAD.json and 66 in LeadStore, with only 4 overlapping emails. Audit delivery stopped 2026-07-07 (39 cumulative, 0 in the last 7 days) - the delivery surface is healthy; the pause is due to the outreach hold (30-confirmed-delivery gate not met) and no new strong-trigger leads passing the gate.

---

## Key Metrics Table

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Total live revenue | $0.00 | **High** | Stripe DB cross-check (below) |
| Paid customers | 0 | **High** | nebula_platform.purchases (1 row = QA fixture, test IDs) |
| Active subscriptions | 0 | **High** | nebula_platform.subscriptions (0 rows) |
| Test/simulated payments in live ledger | 1 QA fixture row (cs_test_billing_qa, e2e-crawler-test@example.com) | **High** | purchases table, session/event IDs are `test_` prefixed |
| Production leads (HOT_LEAD.json) | 47 | **High** | HOT_LEAD.json read 2026-08-08 (2 test excluded) |
| Leads in LeadStore | 66 | **High** | lead_state.db read 2026-08-08 |
| Deliveries cumulative | 39 | **High** | customer-ledger.jsonl event_type=audit_delivered |
| Deliveries last 7d | 0 | **High** | audit_delivery_monitor 2026-08-08 |
| Unrouted warm replies | 0 | **High** | audit_delivery_monitor (post predicate-fix, 6/6 tests) |
| Pipeline value ($$) | UNKNOWN | **Low** | no live source tracks it |

---

## Integrity Audit Results

### (1) Revenue cross-check - PASS (with noted anomaly)
- Snapshot claims $0.00 real revenue.
- Live DB: `SELECT livemode, COUNT(*), SUM(amount_total) FROM purchases GROUP BY livemode` → `t | 1 | 9700`.
- The single row is `cs_test_billing_qa` / `evt_test_billing_qa` / `e2e-crawler-test@example.com` - session and event IDs are **test-mode prefixed**, amount 9700 ($97 fixture), fulfillment "delivered" (test/internal fulfillment 2026-08-05).
- **Anomaly:** the row's `livemode` column = `t` (true) even though its Stripe IDs are test-mode. The livemode flag is inconsistent with the test IDs. This row is NOT real revenue, but the flag could mislead future aggregation.
- **Resolution:** treat as QA fixture, exclude from revenue; recommend fixing the flag to `f` or annotating in DB (ops-finance cleanup task, low priority).

### (2) Lead count consistency - PASS
- HOT_LEAD.json: 47 prod (stages: pitch_sent 27, bounced 12, closed 6, warm_replied 1, recircle_60d 1).
- lead_state.db: 66 (bounced 45, audit_delivered 7, contacted 5, discovered 4, site_found 4, replied 1).
- Overlap = 4 emails. Two systems measure different things (legacy actionable pipeline vs CRM of record); snapshot does not sum them. No implausible delta.

### (3) Plausibility flags - NONE
- Revenue ($0) ≤ pipeline (unknown) - no contradiction.
- No lead count = 0 when payments exist (no real payments exist).
- Stale files excluded: stats.json (Jul 13), pipeline_health.json (Jul 21) - excluded per CEO review; timestamp-gated metrics used instead.

### (4) Test/simulated payments - CONFIRMED excluded
- The only purchases row is test-mode by Stripe ID. livemode filter in route.ts verified. Zero test events leaked into a live-revenue context beyond this fixture row (which is flagged, not counted).

### (5) Signed-off report - this document.

---

## Data Quality Issues

1. **[LOW]** purchases QA fixture row has livemode=t with test-mode IDs - flag inconsistent; exclude from revenue; fix flag or annotate.
2. **[MED]** 27 pitch_sent leads stale 25–32 days (no follow-up since Jul 8). Separate CEO decision needed; not a data integrity issue.
3. **[MED]** Pipeline value ($) not tracked in any live source → UNKNOWN. Consider adding to operating metrics if needed for reporting.
4. **[LOW]** Delivery metric (39 cumulative) is immutable-ledger-based; last delivery 2026-07-07 - stale but accurate.

---

## Confidence Rating

| Metric | Confidence | Rationale |
|---|---|---|
| Revenue / customers / subscriptions | High | Live DB cross-checked this audit |
| Lead counts | High | Direct file/DB reads this audit |
| Delivery metrics | High | Deterministic monitor + immutable ledger |
| Pipeline value | Low | No live source |

**Overall verdict: INTEGRITY CLEAN** - no fabrications, no double counting, revenue figure verified against the live DB. The single anomaly (QA fixture livemode flag) is documented and does not affect revenue.
