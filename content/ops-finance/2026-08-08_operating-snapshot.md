# Nebula Components — Authoritative Operating Snapshot

**Date:** 2026-08-08
**Task:** t_6dccda4a (ops-finance)
**Constraint:** Read-only; no fabricated values. Any value without a live source is marked UNKNOWN with a note.

---

## Summary

| Metric | Value | Source |
|---|---|---|
| Total live revenue | **$0.00** | Stripe live extract (t_6548869b), reconciliation report |
| Active customers (paid) | **0** | nebula_platform.purchases livemode=true → 0 real rows |
| Active subscriptions | **0** | nebula_platform.subscriptions → 0 rows |
| Pipeline value (live) | **UNKNOWN** — no current-source pipeline value is tracked; not in any live file | — |
| Production leads (HOT_LEAD.json) | **47** (2 test excluded) | HOT_LEAD.json 2026-08-08 read |
| Leads in LeadStore (lead_state.db) | **66** | lead_state.db 2026-08-08 read |
| Audits delivered (cumulative) | **39** | audit_delivery_monitor (ledgers/customer-ledger.jsonl) |
| Deliveries last 7d | **0** (last 2026-07-07) | audit_delivery_monitor |
| Unrouted warm replies | **0** | audit_delivery_monitor (post predicate-fix) |

**Double-count resolution:** All revenue figures resolve to Stripe (nebula_platform.purchases/subscriptions) as the single authoritative source. stats.json (last written 2026-07-13) and pipeline_health.json (last written 2026-07-21) are STALE and excluded per CEO review 2026-08-06 — they are not sources of authority for this snapshot. Lead counts: HOT_LEAD.json (legacy actionable pipeline) and lead_state.db (LeadStore, CRM of record) are separate systems; overlap is only 4 emails. Do NOT sum them.

---

## 1. Revenue (authoritative: Stripe)

| Metric | Value | Source file / query | Timestamp |
|---|---|---|---|
| Live purchases | 0 real rows (1 QA fixture `cs_test_billing_qa` / `e2e-crawler-test@example.com`, livemode flag true — not revenue) | `SELECT COUNT(*) FROM purchases WHERE livemode=true` (nebula_platform) | 2026-08-08 |
| Live subscriptions | 0 | `SELECT COUNT(*) FROM subscriptions` (nebula_platform) | 2026-08-08 |
| Test events in live ledger | 0 leaked (livemode filter in route.ts; purchases table has livemode column) | customer-portal/app/api/webhooks/stripe/route.ts + reconciliation report | 2026-08-08 |

**Double-count risk:** NONE resolved — Stripe is the sole revenue authority.

## 2. Leads (two systems, never summed)

### HOT_LEAD.json — legacy actionable pipeline (47 prod)
| Stage | Count |
|---|---|
| pitch_sent | 27 |
| bounced | 12 |
| closed | 6 |
| warm_replied | 1 |
| recircle_60d | 1 |
| **Total** | **47** (2 test records excluded) |

Source: HOT_LEAD.json, read 2026-08-08.

### lead_state.db — LeadStore, CRM of record (66)
| Stage | Count |
|---|---|
| bounced | 45 |
| audit_delivered | 7 |
| contacted | 5 |
| discovered | 4 |
| site_found | 4 |
| replied | 1 |
| **Total** | **66** |

Source: lead_state.db, read 2026-08-08.

**Overlap:** 4 emails appear in both systems. **Do not sum** the two totals (47 + 66 ≠ 113 unique leads).

## 3. Delivery pipeline (authoritative: audit_delivery_monitor)

| Metric | Value | Source |
|---|---|---|
| Delivered total | 39 | ledgers/customer-ledger.jsonl event_type=audit_delivered |
| Last 24h | 0 | audit_delivery_monitor |
| Last 7d | 0 | audit_delivery_monitor |
| Last delivery | 2026-07-07T17:07:32+00:00 | audit_delivery_monitor |
| Payments recorded | 0 | customer-ledger |
| Pending audit requests | 0 | audit_delivery_monitor |
| Overdue pitches | 0 | audit_delivery_monitor |
| Unrouted warm replies | 0 | audit_delivery_monitor (fix: scripts/audit_delivery_monitor.py, has_response_evidence) |
| Service / local / public | active / 200 / 200 | audit_delivery_monitor --strict-exit 2026-08-08 |

## 4. Widget / partner usage

| Partner | IPs | Last ts |
|---|---|---|
| agency_demo | 3 distinct | 2026-08-04T22:07:09Z |

Source: lead_state.db widget_usage (3 rows).

## 5. Payment capture path (reference)

Verified read-only 2026-08-08: webhook endpoint live (POST active, 405 on GET), signature verified, livemode filter present. One blocking unknown: whether Stripe dashboard subscribes `customer.subscription.*` events (dashboard access required). Full evidence: `content/ops-finance/2026-08-08_revenue-funnel-reconciliation.md`.

---

## Anomalies / notes

1. **QA fixture row** in purchases with livemode=true (`cs_test_billing_qa`) — flagged, not revenue; consider cleaning or annotating in DB.
2. **27 pitch_sent leads stale 25–32 days** with no follow-up since July 8 (day-3 sequence). Follow-up decision is a separate CEO action, not a snapshot fix.
3. **stats.json (Jul 13) and pipeline_health.json (Jul 21) stale** — excluded; replaced by current-source timestamp-gated metrics above.
4. Pipeline value ($$) is **UNKNOWN** — no live source tracks it; do not invent.
