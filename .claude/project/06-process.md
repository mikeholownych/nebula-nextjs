# Nebula Components — Process

## The full acquisition path: stranger to onboarded

### Stage 1: Signal detection
- Source: public signals — HN Show/Ask, IH posts, Product Hunt launches, LinkedIn posts, Reddit paid-ads threads
- Qualification: is there a struggling moment present? (active ad spend + zero/near-zero conversion)
- Output: domain + contact name + trigger evidence
- Tool: manual scan or `lead_gen/sequence_engine.py` + growth_system triggers
- Time: trigger must be <72 hours old

### Stage 2: Verification
- Hunter.io domain search → email + role + confidence score
- MailCheck SMTP verification → HIGH_CONFIDENCE_VALID or PROBABLE_VALID only
- ICP gate: dm=True, confidence ≥85, not agency
- Output: deliverable email address or discard

### Stage 3: Audit
- `deliver_audit.py {domain} {email} --json --dry-run` → score + opp_matrix + strategic_finding
- Extract: single highest-impact finding
- Check claims.json — findings must be on the approved claims list
- Output: audit score + primary finding + evidence

### Stage 4: Outreach (first touch)
- Subject: the specific finding or a question about the evidence
- Body: max 200 words, their symptom first, finding second, one CTA
- CTA: free audit URL or reply to receive the readout
- No: calls, calendars, booking links, "let me know"
- Wait: minimum 24 hours before follow-up
- No open tracking on cold emails

### Stage 5: Audit delivery (post-reply or post-audit-request)
- Send full audit email via AgentMail (`nebulashop@agentmail.to`)
- Subject: "Your [domain] audit — [primary finding]"
- Includes: score, grade, top findings, dollar-math estimate, $97 offer link
- Stripe link: https://buy.stripe.com/5kQbJ1eawdj6eql1Jg43S0h

### Stage 6: Pitch (follow-up at D3/D7/D14)
- If no reply to audit: follow-up with a new angle or a re-engagement question
- If reply: respond same day, do not pitch without understanding the reply first
- Apply Mom Test to every reply: what did they actually mean? What are they doing instead?
- Push forces: name what the ad spend is costing per month
- Pull forces: the audit is already done, the finding is waiting

### Stage 7: Payment
- Stripe checkout at https://buy.stripe.com/5kQbJ1eawdj6eql1Jg43S0h
- Post-payment webhook triggers `scripts/post_purchase_drip.py`
- Fix Pack delivered via email within 48 hours
- Re-audit scheduled at D30

### Stage 8: Retention
- D30: re-audit and comparison report
- D7 post-delivery: check-in email
- D30: case study offer (with permission)
- D30+: retainer offer at $1,497/month if >1 finding still failing

---

## Lead state machine
new → site_found → contacted → audit_delivered → pitch_sent → paid
Terminal: dead, bounced, max_retries_exceeded

## Suppression rules
- Max 3 touches per lead before terminal state
- No contact within 24 hours of previous touch
- `LeadStore.is_bounced(email)` checked before every send
- Unsubscribe: nebulacomponents.com/unsubscribe

## CAN-SPAM footer (mandatory on all sends)
Nebula Components, 66 Sonneck Square, Scarborough, ON M1E 1A9
Unsubscribe: https://nebulacomponents.com/unsubscribe

## Key systems
- `deliver_audit.py` — audit engine, scoring, email generation
- `lead_gen/sequence_engine.py` — lead pipeline
- `scripts/post_purchase_drip.py` — post-payment D3/D7/D14 drip
- AgentMail: `nebulashop@agentmail.to` (REST only, no SMTP)
- Platform API: `localhost:8001`
- Customer portal: `nebulacomponents.com` (Next.js, systemd: nebula-nextjs)

## Revenue to date
$0. Learning: filter-based targeting fails. Trigger-based targeting is the current approach.
Purchases are the only validation. Replies, audits, clicks are diagnostic.
