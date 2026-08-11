# Lead & Customer Data Normalisation - Source Audit

Generated: 2026-07-25
Task: t_b8c4fc6d
Agent: ops-finance

---

## Sources Examined

| Source | Path | Format | Records | Fields |
|--------|------|--------|---------|--------|
| customer-ledger | ledgers/customer-ledger.jsonl | JSONL (line-prefixed N\|{}) | 54 | 43 |
| HOT_LEAD | HOT_LEAD.json | JSON array | 48 | 43 |
| lead_state.db (root) | lead_state.db | SQLite - table `leads` | 23 rows | 26 |
| lead_state.db (growth_system) | growth_system/lead_state.db | SQLite | 0 (empty) | - |

---

## Field Inventory by Source

### customer-ledger.jsonl - all fields present

actioned, agent, amount, attribution, audit_delivery_timestamp, classification,
contact_route, email, event, event_type, facts, follow_up, grade, kanban_task,
lead, lead_email, lead_id, message_id, note, overall, overall_grade, overall_score,
payment_id, pitch, post_audit_checkout_cta, preview, product, score, self_serve_cta,
send_result, send_status, sender, source_url, status, subject, summary, thread_id,
timestamp, top_issue, trigger_context, trigger_type, url, wave

**Notes:**
- Uses `lead_email` AND `email` for recipient address (inconsistent within source)
- Uses `overall_score` AND `overall` AND `score` for audit numeric score (3 field names, same datum)
- Uses `event_type` AND `event` for event classification (2 field names)
- Uses `overall_grade` AND `grade` for audit letter grade (2 field names)
- Payment records identified by `event_type = "payment"` with `amount` and `payment_id`

### HOT_LEAD.json - all fields present

action, audit_delivered_at, audit_grade, audit_score, autonomy_directive,
bounce_reason, bounced_at, calendar_link, classification, contact_route,
day3_followup_sent_at, day3_framework, email, holiday_timing_adjusted,
holiday_timing_note, lead_id, message_id, note, notes, our_response_sent_at,
pitch_due_at, pitch_sent_at, preview, recircle_due_at, replied_at,
reply_classification, reply_text, resolved_at, response_message_id, score,
sender, source, source_url, stage, status, subject, thread_id,
threaded_reply_sent_at, timestamp, trigger_context, trigger_type, updated_at, url

**Notes:**
- Has both `note` (singular) and `notes` (plural) - same semantic intent, different field names
- `score` is present but maps to what customer-ledger calls `audit_score` / `overall_score` / `overall`
- `stage` is the canonical pipeline stage here; `status` is a secondary operational flag

### lead_state.db - columns in `leads` table

email, url, stage, source, trigger_context, vertical, audit_score, audit_grade,
retry_count, error_info, discovered_at, site_found_at, contacted_at,
audit_delivered_at, pitch_sent_at, paid_at, bounced_at, dead_at,
needs_review_at, bounce_type, bounce_detail, lead_score, score_updated_at,
updated_at, notes, upsell_sent_at

**Notes:**
- Only source with `paid_at`, `dead_at`, `needs_review_at`, `upsell_sent_at`, `retry_count`, `vertical`
- `lead_score` (INTEGER) vs HOT_LEAD's `score` (REAL) - same concept, different type + name
- Canonical stage machine source: has `discovered_at` through `paid_at` lifecycle columns

---

## Canonical Field Ownership Map

| Field (normalised name) | Canonical Owner | Present In | Risk |
|-------------------------|----------------|------------|------|
| email | lead_state.db | ALL 3 | Low - join key |
| url | lead_state.db | ALL 3 | Low - join key |
| stage / lead_status | lead_state.db | HL + DB | DB is authoritative lifecycle |
| audit_score | lead_state.db | HL + DB | HL `score` = DB `audit_score` - same datum |
| audit_grade | lead_state.db | HL + DB | Identical field name, same data |
| audit_delivered_at | lead_state.db | HL + DB | Same timestamp in both |
| pitch_sent_at | lead_state.db | HL + DB | Same timestamp in both |
| bounced_at | lead_state.db | HL + DB | Same timestamp in both |
| notes | lead_state.db | HL + DB | HL has both `note` and `notes` |
| updated_at | lead_state.db | HL + DB | Same timestamp in both |
| source | lead_state.db | HL + DB | Semantic overlap |
| trigger_context | lead_state.db | CL + HL + DB | All 3 carry this - duplication risk |
| trigger_type | customer-ledger | CL + HL | Both carry it |
| contact_route | HOT_LEAD | CL + HL | Overlapping |
| classification | HOT_LEAD | CL + HL | Overlapping |
| message_id | customer-ledger | CL + HL | CL is the send record |
| thread_id | customer-ledger | CL + HL | CL is the send record |
| lead_id | customer-ledger | CL + HL | CL growth-handoff entries are origin |
| sender | customer-ledger | CL + HL | CL is inbox-reply source |
| subject | customer-ledger | CL + HL | CL is inbox-reply source |
| preview | customer-ledger | CL + HL | CL is inbox-reply source |
| source_url | customer-ledger | CL + HL | CL growth-handoff is origin |
| status | customer-ledger | CL + HL | Operational flag; CL has event context |
| timestamp | customer-ledger | CL + HL | CL is event log |
| score (unqualified) | CONFLICT | CL + HL | CL uses `score`, `overall`, `overall_score` - HL uses `score` - none match DB `audit_score` |
| note / notes | CONFLICT | CL + HL + DB | Three field names for one concept |

---

## Duplicate Fields - Explicit Call-Out

26 fields appear in more than one source. High-priority conflicts:

### DOUBLE-COUNT RISK: audit score stored under 4+ names

- customer-ledger: `score`, `overall`, `overall_score` (all numeric, same audit value)
- HOT_LEAD: `score`
- lead_state.db: `audit_score`, `lead_score`

**Action required:** standardise to `audit_score` (REAL) everywhere. Remove `score`, `overall`, `overall_score` aliases.

### DOUBLE-COUNT RISK: audit grade stored under 2 names

- customer-ledger: `overall_grade`, `grade`
- HOT_LEAD: `audit_grade`
- lead_state.db: `audit_grade`

**Action required:** standardise to `audit_grade`. Drop `grade`, `overall_grade`.

### DOUBLE-COUNT RISK: email field inconsistency in customer-ledger

- customer-ledger uses both `email` and `lead_email` - 15 records use `lead_email`, 39 use `email`

**Action required:** normalise to `email` in all new CL writes.

### REDUNDANCY: event classification under 2 names in customer-ledger

- `event` (older records) vs `event_type` (newer records)

### REDUNDANCY: free-text notes under 3 names

- `note`, `notes` - all three sources use at least one of these inconsistently

---

## Unified Table

Exported to: `/home/mike/nebula/ops/unified_leads.csv`

Columns: `record_id, source, customer_id, lead_status, revenue_attributed, last_updated`

| Source | Row Count | Notes |
|--------|-----------|-------|
| customer-ledger | 54 | Includes 2 payment events, outreach events, audit delivery, handoff |
| HOT_LEAD | 48 | Per-contact pipeline state |
| lead_state.db | 23 | Lifecycle stage machine |
| **Total** | **125** | - |

### Revenue-attributed rows (non-test payments in customer-ledger)

| record_id | customer_id | amount | payment_id |
|-----------|-------------|--------|------------|
| CL-0033 | restart-test@example.com | $97.00 | cs_test_restart_001 |
| CL-0041 | stripe@example.com | $30.00 | cs_test_a1L9Cm... |

**Both payment rows are test transactions** (payment_id prefixed `cs_test_`, email domains `@example.com`).
**Verified real revenue: $0.**

---

## Findings Summary

1. **lead_state.db is the canonical stage-machine** - it owns lifecycle timestamps (discovered_at → paid_at).
2. **HOT_LEAD.json is the operational hot-list** - current pitch/bounce state per contact. Overlaps heavily with lead_state.db on audit_score, audit_grade, audit_delivered_at, pitch_sent_at, bounced_at.
3. **customer-ledger.jsonl is the event log** - not a state store. Mixing event records with state records creates apparent duplication; it is not true duplication if used correctly.
4. **26 fields appear in more than one source**, of which 3 clusters (audit score, audit grade, email address field name) are genuine double-count risks that need schema normalisation.
5. **growth_system/lead_state.db is empty** - can be ignored or removed.
6. **No real revenue** - all payment records are test transactions.
