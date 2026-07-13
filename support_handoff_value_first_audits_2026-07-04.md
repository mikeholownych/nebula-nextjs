# Support handoff — value-first audit artifacts — 2026-07-04

Task: t_7f1babac
Handoff: growth -> support
JSONL source of truth: /home/mike/nebula/support_handoff_value_first_audits_2026-07-04.jsonl

Inputs inspected:
- /home/mike/nebula/ops/agent_handoff_process.md
- /home/mike/nebula/ops/handoff_queues.json
- /home/mike/nebula/leads_2026-07-04.md
- /home/mike/nebula/reddit_enriched_prospects.jsonl
- /home/mike/nebula/value_first_audit_artifacts_2026-07-04.md

Guardrails:
- No calls.
- No calendar links.
- No manual review gate.
- No reply-yes gate.
- No outbound sends were performed by this task.

Acceptance check:
Every row in the JSONL includes source_url, exact trigger_context, value-first finding, likely conversion leak, self_serve_cta, post_audit_checkout_cta, and support_next_action.

Self-serve CTA used on every row:
Run the free audit/tool without a call or reply gate: https://nebulacomponents.shop/audit.html

Post-audit implementation checkout for support after value has been delivered:
https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b

Rows staged:
1. Curb Caddie — $1,000 Google Ads, one non-paying conversion — https://curbcaddie.com
2. FunghiClear — 7,500 Search/PMax clicks, only 2 sales — https://funghiclear.com/products/funghiclear-nail-spray-with-manuka-oil
3. Time Technologies — Google/Facebook clicks, zero form fills/bookings — ask@timetechnologiesllc.com
4. LowTDFW / Magnolia Functional Wellness — low CPC, weak bookings/show rate — https://lowtdfw.com/offer
5. Handmade home goods store — $800 Google Ads, zero conversions — contact extraction needed
6. Shopify Meta ads operator — $400 day, 300 clicks, 150 visitors, zero sales — contact extraction needed
7. Ecommerce operator with sudden sales cliff — 5-8 daily sales then $11k spend with zero sales — contact extraction needed
8. LinkedIn B2B document-ad campaign — $1,500 over 31 days, zero form completions — contact extraction needed
9. First-month Shopify store — ads getting clicks, no conversions — contact extraction needed
10. Apple Search Ads app founder — installs but no paid conversions — contact extraction needed

Support next action:
Use the JSONL row opener/artifact for value-first outreach or audit delivery. Route warm responses directly to automated audit delivery / self-serve checkout flow. Do not ask for a call, calendar booking, manual review, or reply-yes permission.
