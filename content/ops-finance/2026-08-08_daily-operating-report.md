# Nebula Components - Daily Operating Report

**DATE:** 2026-08-08
**PERIOD:** Week of 7-day challenge (Day 5, started 2026-08-04)
**PREPARED BY:** ops-finance (t_f42182b6)
**SOURCES:** audit_delivery_monitor --strict-exit (exit 0), HOT_LEAD.json, lead_state.db, Stripe live extract (t_6548869b), customer-ledger.jsonl, operating snapshot t_6dccda4a

---

## Operating Summary

| Field | Value |
|---|---|
| REVENUE | $0 (cumulative: $0) |
| COSTS | hosting (Proxmox homelab) + AgentMail subscription (no $ figure on record) |
| P&L | $(costs) - no revenue offset |
| CASH POSITION | $0 from product; operating costs ongoing |
| ACTIVE OFFER | $97 Fix Pack (locked through 2026-12-31) |
| EMAILS SENT | ~155 cumulative (Wave 1–3, 2026-06-24 to 06-27); 0 this period |
| AUDITS DELIVERED | 39 cumulative; 0 last 7d (last: 2026-07-07) |
| PAYMENTS RECEIVED | 0 |
| INCIDENTS | None new this period |
| MISSING EVIDENCE | Pipeline $ value unknown (no live source); AgentMail key absent from environment (CRITICAL dependency unmet) |
| RISKS | See below |

---

## Warm Reply Queue - CLEAN

**Unrouted warm replies: 0**

Evidence: `venv/bin/python3 scripts/audit_delivery_monitor.py --strict-exit` - exit code 0, 2026-08-08T05:21:08Z.

Action queue snapshot:
- Pending audit delivery: 0
- Unrouted warm replies: **0** (post predicate-fix: has_response_evidence() guard added 2026-08-08)
- Overdue post-audit pitches: 0

The one `warm_replied` record in HOT_LEAD.json is kanzariyamihir@gmail.com (referralful.com). Our response was sent 2026-07-07T23:59:10Z. The monitor predicate was fixed in t_24c8c711 to correctly classify it as responded. No unrouted action exists.

---

## Lead Pipeline

### HOT_LEAD.json (47 production records)

| Stage | Count |
|---|---|
| pitch_sent | 27 |
| bounced | 12 |
| closed | 6 |
| warm_replied | 1 |
| recircle_60d | 1 |

### lead_state.db / LeadStore (66 records - CRM of record)

| Stage | Count |
|---|---|
| bounced | 45 |
| audit_delivered | 7 |
| contacted | 5 |
| discovered | 4 |
| site_found | 4 |
| replied | 1 |

Note: 4 emails overlap between the two systems. Do not sum 47 + 66.

---

## Delivery Pipeline

| Metric | Value |
|---|---|
| Audits delivered (all time) | 39 |
| Last delivery | 2026-07-07T17:07:32Z |
| Last 24h | 0 |
| Last 7d | 0 |
| Payments recorded | 0 |
| Service health | nebula-nextjs active, local 200, public 200 |

---

## Risks

1. **27 pitch_sent leads stale 25–32 days** - no follow-up since 2026-07-08 day-3 sequence. Requires CEO decision on follow-up wave.
2. **AgentMail key missing** - outreach is blocked until key is restored in environment. No sends possible.
3. **Zero conversions** - 39 audits delivered, 0 payments. Conversion rate: 0%. Funnel has a structural break between audit delivery and payment. Root cause unresolved.
4. **Pipeline $ value unknown** - no live source tracks opportunity value. Cannot estimate expected revenue.
5. **QA fixture row in purchases** with livemode=true (`cs_test_billing_qa`) - should be cleaned or annotated; creates false positive risk in revenue queries.

---

## Incidents

None new this period.

Prior resolved: monitor false-flagging warm reply as unrouted (t_24c8c711, fixed 2026-08-08).

---

## Agent Notes

- Warm reply sweep is CLEAN. Zero unrouted actions. State is verified, not estimated.
- 72-hour challenge: FAILED. 7-day challenge started 2026-08-04.
- All revenue figures resolve to Stripe as sole authority. stats.json and pipeline_health.json are stale and excluded.
- No fabricated values in this report. Every metric has a cited source.
