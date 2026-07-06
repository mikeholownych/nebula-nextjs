DATE: 2026-07-04
SNAPSHOT_TIME_UTC: 2026-07-04T22:32:54+00:00
TASK: t_610a6bd6 — revenue and evidence integrity snapshot

EXECUTIVE SCOREBOARD — EVIDENCE-BACKED ONLY
REVENUE: $0 real revenue (cumulative: $0)
COSTS: unknown/unverified; authoritative cost ledger is empty
P&L: cannot be computed from evidence; with verified revenue only, P&L is $0 minus unknown costs
CASH POSITION: unknown/unverified; no bank/Stripe balance evidence found
ACTIVE OFFER: Free Landing Page Audit + $97 Implementation (challenge-charter.json lines 10-14)
EMAILS SENT: 188 rows in outreach_log.txt; stats.json claims 155 legacy sends plus 64 trigger_based_sends. Treat 188 as log-row evidence, not unique prospects.
REPLY RATE: legacy baseline 2/155 = 1.3% in challenge-charter/decision-ledger; current trigger reply rate 0.0% (0/66) from ledger_metrics.py. stats.json claims 3 replies but backing is inconsistent.
AUDITS DELIVERED: 24 hot-lead audits in ledger_metrics/HOT_LEAD; customer-ledger has 26 audit_delivered rows (25 unique emails); audit-delivery.log has 24 Email SENT lines.
PAYMENTS RECEIVED: 0 real payments. customer-ledger has 0 real payment rows; payments.log has 6 rows, all classified as test/non-real.
BOUNCES: 8 bounced rows in outreach_log.txt; inbound_replies.log also summarizes 5 bounces on 2026-06-26.
INCIDENTS: No prior entries in incident-ledger.jsonl before this snapshot; evidence shows repeated AgentMail/API failures and scrape failures.
MISSING EVIDENCE: revenue-cost ledger empty; real payment proof absent; costs absent; inbox/reply evidence inconsistent; outreach_evidence has 'sent' status but AgentMail evidence says API key not set.
RISKS: 0 revenue; 7 hot-lead $97 pitches with 0 real payments; 30+/66 trigger sends with 0 warm replies triggered kill criteria; inbox monitor errors risk missed replies.
AGENT NOTES: Activity logs materially overstate certainty. Do not count outreach_evidence status=sent as delivered email without AgentMail message_id or provider acceptance.

DETAILED FINDINGS

1) Revenue and payments
- Authoritative revenue-cost ledger: /home/mike/nebula/ledgers/revenue-cost-ledger.jsonl (exists, 0 bytes). It exists but is empty.
- customer-ledger payment rows: 1 total; ledger_metrics classifies real_payments=0, real_revenue_cents=0, test_payments_excluded=1.
- payments.log: 6 payment-like rows; real=0, test/non-real=6. Test/non-real amount total=$892.00; excluded from revenue.
- stats.json: real_revenue=0, real_payments=0, test_revenue_excluded=True, test_payments_excluded=1.
Conclusion: verified real revenue is $0. Any $7/$97/$497 payment entries found are test/simulation rows and must not be counted.

2) Outreach, bounces, and replies
- outreach_log.txt rows: 188 sent-labeled rows, 40 unique contacts, 8 bounced rows, 5 delayed rows.
- stats.json claims emails_sent=155, replies=3, open_convos=1.
- decision-ledger/challenge-charter baseline claims 155 emails, 2 replies, 1 warm lead, 0 conversions.
- inbound_replies.log says: No replies to the $97 audit offer found. | [2026-06-26 19:14:57] Inbox check started. Total messages: 8 | [2026-06-26 19:14:57] CUSTOMER MESSAGE: from=Dorothy mia <miadorothy250@gmail.com> | subj=I might have a few ideas that could fit what you're building | date=Thu, 25 Jun 2026 02:10:26 | [2026-06-26 19:14:58]   -> REPLIED to miadorothy250@gmail.com | [2026-06-26 19:14:59] Inbox check complete. Human replies: 1, Bounces: 5, Replied to: 1
- inbox_log.txt says: No inbound messages from real customers found.
- customer-ledger has event_counts={'inbound_reply': 1, 'audit_delivered': 26, 'outreach_sent': 5, 'payment': 1}. The only inbound_reply row is founder@testco.com/test-thread-001, which is test-coded and should not be treated as current real customer traction.
Conclusion: current real replies cannot be stated as 3 from available evidence. Defensible figures are: legacy baseline 2/155 from decision/challenge ledgers, one 2026-06-26 human reply in inbound_replies.log, and zero warm replies in trigger metrics.

3) Audits delivered and fulfillment
- ledger_metrics audits_delivered_hot_lead=24.
- HOT_LEAD entries=25, stages={'closed': 1, 'pitch_sent': 7, 'audit_delivered': 17}, pending=17, pitch_due_past_or_now=0 at snapshot time.
- customer-ledger audit_delivered rows=26; unique audit recipient emails=25.
- audit-delivery.log: Email SENT=24, dry runs=4, failures=6.
Conclusion: use 24 hot-lead audits delivered for the scoreboard because that is the normalized metric in ledger_metrics.py and stats.json; note raw customer-ledger contains duplicates/test rows and shows 26 rows.

4) Trigger experiment and follow-up risk
- trigger_based_sends=66; trigger_warm_replies=0; trigger_reply_rate=0.0%.
- hot_lead_pitches_sent=7 from followup_state.jsonl.
- challenge_risk_monitor_state.json records kill_30_0_alerted and audit_depth_alerted.
Conclusion: active segment has evidence of failure: 66 trigger sends, 0 warm replies, 7 $97 pitches, 0 real payments.

5) Evidence integrity failures
- outreach_evidence.jsonl rows=67, status_sent=66, rows_with_AGENTMAIL_API_KEY_not_set=66.
- auto_responder_dual_inbox.log contains 14 error rows; examples include authentication failed, 403, 404, and parser errors.
- incident-ledger.jsonl existed but had 0 entries before this snapshot, despite the above failures.
Conclusion: delivery, reply monitoring, and incident recording are not reliable enough for autonomous claims.

EXACT FILES CHECKED
- /home/mike/nebula/stats.json
- /home/mike/nebula/outreach_log.txt
- /home/mike/nebula/outreach_evidence.jsonl
- /home/mike/nebula/payments.log
- /home/mike/nebula/inbound_replies.log
- /home/mike/nebula/inbox_log.txt
- /home/mike/nebula/auto_responder_dual_inbox.log
- /home/mike/nebula/followup_state.jsonl
- /home/mike/nebula/HOT_LEAD.json
- /home/mike/nebula/ledger_metrics.py
- /home/mike/nebula/ledgers/customer-ledger.jsonl
- /home/mike/nebula/ledgers/revenue-cost-ledger.jsonl
- /home/mike/nebula/ledgers/decision-ledger.jsonl
- /home/mike/nebula/ledgers/experiment-ledger.jsonl
- /home/mike/nebula/ledgers/incident-ledger.jsonl
- /home/mike/nebula/ledgers/audit-delivery.log
- /home/mike/nebula/ledgers/challenge-charter.json

MISSING / INSUFFICIENT EVIDENCE PATHS
- /home/mike/nebula/ledgers/revenue-cost-ledger.jsonl: exists but empty; needs every real/test/refund/cost row.
- /home/mike/nebula/ledgers/incident-ledger.jsonl: existed empty; should contain delivery/auth/scrape/inbox-monitor failures.
- /home/mike/nebula/ledgers/customer-ledger.jsonl: missing normalized bounce rows and lacks a clear real-vs-test flag on some historical rows.
- /home/mike/nebula/inbox_log.txt and /home/mike/nebula/inbound_replies.log: insufficient to substantiate stats.json replies=3.
- No bank/Stripe balance export found under /home/mike/nebula/ or /home/mike/nebula/ledgers/; cash position cannot be verified.

MINIMAL LEDGER SCHEMA TO CLOSE GAPS
Use the canonical entry envelope for all ledgers:
{"timestamp":"ISO-8601 UTC","agent":"source agent/script","event_type":"payment|refund|cost|audit_delivered|outreach_sent|reply|bounce|incident","summary":"human-readable one-line fact","facts":{...typed fields...},"inference":"labeled conclusion or null","decision":"action taken or null","evidence":["file path, message_id, Stripe event id, API response id"],"follow_up":"next action or null"}

Required facts by event_type:
- payment: amount_cents, currency, product, customer_email_hash_or_id, payment_id, mode, livemode, fulfillment_status, test_flag.
- cost: amount_cents, vendor, category, period_start, period_end, recurring, approved_by, expected_return, invoice_or_receipt_path.
- outreach_sent: contact, channel, offer_variant, source_url, provider_message_id, thread_id, delivery_status.
- bounce: contact, provider_message_id/thread_id, bounce_type, raw_error, suppress_until.
- reply: contact, thread_id, classification, buying_signal_level, related_offer, next_follow_up_at.
- audit_delivered: contact, url, audit_id/path, provider_message_id, grade, top_issue, fulfillment_status.
- incident: system, severity, root_cause, affected_metrics, first_seen, resolved_at, prevention.

NEXT DECISION RECOMMENDATION
Stop counting activity as traction. Until revenue-cost-ledger has a real livemode payment row or bank/Stripe evidence, CEO scoreboard should show revenue=$0 and conversions=0. Pause additional trigger-send volume until inbox monitoring and delivery proof are fixed, then run a smaller test with explicit success/failure criteria.
