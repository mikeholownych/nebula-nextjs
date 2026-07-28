# SOP-003: Offer Delivery
**Owner:** Delivery Plane → Mike
**Service Target:** < 1h from qualification → offer sent (during business hours)

## Trigger
`qualifications.classification = 'qualified'` AND `offers.status = 'draft'`

## Required Inputs
| Field | Required | Source |
|-------|----------|--------|
| qualification_id | Yes | From qualification step |
| prospect_id | Yes | From qualification step |
| audit_id | Yes | Associated audit that produced findings |
| Findings (top 3 by severity) | Yes | From findings table, filtered by severity DESC |
| Prospect email | Yes | From prospects table |
| Offer type | Yes | 'one_leak_repair' (default), 'retainer', 'agency_partner' |

## Validation Rules
1. Qualification must be `qualified` — do not send offers to `potentially_qualified` or `not_qualified`
2. Prospect must have an email address — if missing, notify Mike for manual outreach
3. Offer must not already exist with `status = 'sent'` or `status = 'accepted'` for this prospect
4. Price must match the current published offer for the type ($97 fix pack through 2026-12-31)
5. Do not send offers on Sunday or after 9pm ET unless Mike explicitly authorizes

## Procedure
1. Load qualification record and top 3 findings
2. Generate offer:
   - Set `offers.offer_type` (default: 'one_leak_repair')
   - Set `offers.price_cents` (default: 9700 for one_leak_repair)
   - Set `offers.status = 'sent'`, `offers.sent_at = now()`
3. Generate Stripe checkout session:
   a. Call Stripe API to create checkout session
   b. Store `offers.stripe_session_id` and `offers.stripe_url`
4. Send offer to prospect:
   - **Preferred:** Personalized email with (a) audit findings summary, (b) the one concrete change they should make, (c) offer to do it for $97
   - **Alternative:** If no email, send via Reddit DM or direct reply thread
5. Publish event: `offer.sent` with offer_id and stripe_url
6. Set `prospects.lifecycle_state = 'fix_offered'`
7. Notify Mike via Telegram: "Offer sent to {email} — ${price}"

## Offer Message Template (Email)
```
Subject: Audit results for {domain}

Hi {name || "there"},

I ran a conversion audit on {domain}. Here's what I found:

1. {finding_1.issue} ({finding_1.severity})
2. {finding_2.issue} ({finding_2.severity})
3. {finding_3.issue} ({finding_3.severity})

The biggest issue is {finding_1.issue}. This alone could be costing you
{finding_1.estimated_impact} of your ad spend.

I can fix it in 48 hours for $97. No retainer, no commitment, just one leak plugged.

Want me to go ahead?

{offer_url}
```

## Decision Points
- **Prospect replies with questions →** answer directly, do not auto-escalate to higher price
- **Prospect asks "what would you fix?" →** share the top finding evidence block (unlocked) as credibility
- **Prospect says "too expensive" →** do not discount — $97 is intentionally low. If they can't afford $97, they can't implement fixes
- **Prospect asks for retainer →** offer the $1,497 retainer (3-month engagement) if they have > 3 significant issues

## Outputs
- `offer_id` (UUID)
- `offers.status = 'sent'`
- Stripe checkout URL
- Prospect notified

## Evidence Produced
- `offers` row with status, price, stripe_session_id, sent_at
- Event: `offer.sent`

## Failure States
| Failure | Behavior |
|---------|----------|
| Stripe checkout creation fails | Log event `offer.stripe_failed`, retry once with 10s delay, then route to Mike |
| Email send fails | Log event `offer.email_failed`, fall back to manual messaging |
| No email on file | Notify Mike — cannot auto-send. Mike decides whether to DM on Reddit/LinkedIn |
| Duplicate offer detected | Cancel new offer, reference existing offer to prospect |

## Escalation Path
- **Prospect haggles or pushes back on price →** Mike replies directly (no auto-response)
- **Stripe checkout keeps failing →** generate a direct payment link instead of checkout session
- **Prospect asks for specific scope not in findings →** Mike reviews feasibility; do not promise out-of-scope work

## Automation Readiness Gate
- [ ] Deterministic trigger: YES — qualification completed event
- [ ] Structured inputs: YES — qualification + findings + prospect
- [ ] Bounded output: YES — offer created, status set
- [ ] Explicit failure handling: YES — defined above
- [ ] Observable execution: YES — offers table + events
- [ ] Reversibility: YES — offers can be cancelled, new ones created
- [ ] Stable decision rule: YES — offer is always $97 fix pack (no variation needed until retainer path proven)
