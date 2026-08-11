# SOP-004: Fix Delivery
**Owner:** Delivery Plane → Mike
**Service Target:** < 48h from offer acceptance → deployment

## Trigger
`offers.status = 'accepted'` (Stripe checkout completed)

Alternatively: `offers.status = 'accepted'` with `payment_received = true` via Stripe webhook.

## Required Inputs
| Field | Required | Source |
|-------|----------|--------|
| offer_id | Yes | From accepted offer |
| prospect_id | Yes | From offer |
| audit_id | Yes | Associated audit |
| Finding IDs to fix | Yes | From findings; selected by Mike based on scope |
| Prospect email | Yes | For delivery confirmation |
| Staging/production access | Yes (per prospect) | Shared via secure channel during purchase confirmation |

## Validation Rules
1. Payment must be confirmed via Stripe webhook (`checkout.session.completed`) before any work begins
2. Scope is bounded to the specific findings explicitly approved by the prospect - no scope creep
3. Before-snapshot must be captured before any code change
4. After-snapshot must be captured immediately after deployment
5. Do not deploy to production without prospect's explicit go-ahead
6. Do not claim results until measurement period has elapsed

## Procedure
1. Receive Stripe webhook `checkout.session.completed` with `offer_id` in metadata
2. Set `offers.status = 'accepted'`, `offers.accepted_at = now()`
3. Set `prospects.lifecycle_state = 'fix_purchased'`
4. Create `interventions` records for each finding in scope:
   - Link to finding via `finding_id`
   - Record `approved_change` (Mike writes the specific fix description)
   - Set `implementation_status = 'pending'`
5. Capture before-state snapshot:
   - Screenshot of affected page elements
   - Current HTML of relevant sections
   - Performance metrics (LCP, CLS, FCP on mobile + desktop)
6. Implement the changes:
   - For simple fixes (copy, color, layout): edit directly in prospect's platform
   - For complex fixes (backend logic): document exact change spec, share with prospect's dev
7. Capture after-state snapshot:
   - Same views as before, after deployment
   - Updated metrics where applicable
8. Set `implementation_status = 'deployed'`, `deployed_at = now()`
9. Set `validation_status`:
   - **passed** if before/after evidence confirms the change was applied correctly
   - **failed** if change wasn't applied or had unintended side effects
10. Notify prospect with before/after evidence
11. Set `prospects.lifecycle_state = 'fix_delivered'`
12. Publish event: `intervention.deployed`

## Decision Points
- **Scope disagreement →** remove the finding from scope; do not do extra work for free. Offer separate $97 fix pack for the additional item
- **Prospect wants more changes →** new offer, separate $97. Do not bundle into current scope
- **Implementation requires dev access →** ask prospect to set up staging environment or provide temporary access; document exactly what's needed
- **Fix doesn't work as expected →** diagnose, attempt alternative approach. If still fails after 2 attempts, refund and explain limitation candidly

## Outputs
- `interventions` rows with before/after snapshots
- Updated `offers.status`
- Deployment notification to prospect

## Evidence Produced
- `interventions` rows with full before/after JSONB snapshots
- Screenshots stored in `.citable/snapshots/` directory
- Event: `intervention.deployed`

## Failure States
| Failure | Behavior |
|---------|----------|
| Stripe payment fails | Do not start work. Set `offers.status = 'cancelled'`, notify prospect |
| Prospect doesn't provide access | After 72h of no access, set `implementation_status = 'cancelled'`, notify Mike |
| Deploy breaks something | Roll back immediately using `rollback_method`. Fix issue, deploy corrected version |
| Fix doesn't improve metric | Log in outcome as 'no_change'. This is valid data, not a failure |
| Prospect requests refund | Refund via Stripe. Set `interventions.implementation_status = 'reverted'` |

## Escalation Path
- **Prospect disputes quality →** Mike handles directly. Never auto-escalate
- **Security concern discovered during access →** stop work, notify prospect immediately
- **Legal/reputational risk (e.g., compliance) →** stop work, consult Mike

## Automation Readiness Gate
- [ ] Deterministic trigger: YES - Stripe webhook `checkout.session.completed`
- [ ] Structured inputs: PARTIAL - interventions are bounded but fix content is human-authored
- [ ] Bounded output: YES - intervention status + snapshots
- [ ] Explicit failure handling: YES - defined above
- [ ] Observable execution: YES - interventions table + events
- [ ] Reversibility: YES - all changes are revertible; rollback_method recorded
- [ ] Stable decision rule: NOT YET - each fix is unique; automation of fix content is Phase 4+ goal
