# SOP-005: Outcome Measurement
**Owner:** Evidence & Learning Plane → Mike
**Service Target:** 14 days post-deployment for initial measurement

## Trigger
`interventions.validation_status = 'passed'` (fix deployed and verified)

## Required Inputs
| Field | Required | Source |
|-------|----------|--------|
| intervention_id | Yes | From deployed intervention |
| prospect_id | Yes | From intervention |
| Domain | Yes | From web_properties |
| Deployed changes | Yes | From `interventions.approved_change` |
| Staging/production confirmation | Yes | From deployment step |

## Validation Rules
1. Baseline period must be **before** the deployed changes - minimum 7 days of data
2. Measurement period must start **after** deployment - minimum 7 days
3. Do not cherry-pick favorable days - use full baseline and measurement windows
4. Document all confounders known at time of measurement
5. Conclusion must be honest - prefer `improvement_suggested` over `improvement_confirmed` unless evidence is statistically significant (> 10% change, > 100 sessions in each period)
6. Must obtain prospect confirmation before publishing any case study

## Procedure
1. Wait 14 days post-deployment before collecting outcome data
2. Collect baseline data (from GA4, PostHog, or prospect's analytics):
   - Sessions (daily average)
   - Conversion rate
   - Bounce rate
   - Key page engagement metrics
3. Collect measurement data (same sources, same metrics)
4. Calculate deltas and record in `outcomes`:
   - `baseline_sessions`, `measurement_sessions`
   - `baseline_cr`, `measurement_cr`
5. Record `change_description` - what was deployed
6. List all `confounders` (seasonality, new campaigns, site redesigns, competitor changes, etc.)
7. Determine `conclusion`:
   - `improvement_confirmed`: CR improved > 10% AND no major unconfounded alternate explanation
   - `improvement_suggested`: CR improved but confounders present or sample too small
   - `no_change`: CR within ±5% of baseline
   - `decline`: CR decreased > 5%
   - `insufficient_data`: < 7 days of valid data in either period
8. Send findings to prospect for confirmation
9. If prospect confirms improvement, set `customer_confirmed = TRUE`
10. If outcome qualifies as case-study worthy, set `case_study_eligible = TRUE`
11. Set `prospects.lifecycle_state = 'outcome_measured'`
12. Publish event: `outcome.recorded`

## Case Study Eligibility Criteria
Outcome qualifies as `case_study_eligible = TRUE` when ALL of:
- [ ] `conclusion` is `improvement_confirmed` or `improvement_suggested`
- [ ] `customer_confirmed = TRUE`
- [ ] Baseline and measurement each have >= 7 days of data
- [ ] Changes deployed are documented and linkable to specific findings
- [ ] Confounders are documented honestly alongside the improvement
- [ ] Prospect explicitly consents to case study use (separate from outcome confirmation)

## Decision Points
- **Prospect disabled the changes →** outcome is 'no_change' with confounder `changes_reverted_by_customer`
- **Prospect made other changes during measurement period →** list as confounder; do not claim attributable improvement
- **Prospect unreachable for confirmation →** mark `customer_confirmed = FALSE`, still record outcome but cannot use as case study
- **Multiple interventions in the same measurement window →** attribute to all; cannot isolate individual impact

## Outputs
- `outcome_id` (UUID)
- Baseline and measurement metrics
- Conclusion
- Customer confirmation status
- Case study eligibility flag

## Evidence Produced
- `outcomes` row with full measurement record
- Screenshots of analytics dashboards (from measurement dates)
- Prospect confirmation (email or message)
- Event: `outcome.recorded`

## Failure States
| Failure | Behavior |
|---------|----------|
| No analytics access | Record `insufficient_data`. Ask prospect to provide a GA/analytics screenshot |
| Prospect changed platforms | Note as confounder. Use consistent platform for baseline and measurement |
| Changes rolled back | Record `no_change` with reason `changes_reverted` |
| Measurement period too short | Extend to 14 days minimum |
| Prospect doesn't respond to confirmation | Mark `customer_confirmed = FALSE`. Still publish internal outcome |

## Escalation Path
- **Measurable negative outcome →** Mike reviews; offer remediation or refund at discretion
- **Prospect wants to dispute outcome →** share raw data and method; let analytics speak
- **Outcome qualifies for case study →** Mike writes the case study, prospect reviews and signs off before publication

## Automation Readiness Gate
- [ ] Deterministic trigger: YES - intervention deployed event
- [ ] Structured inputs: PARTIAL - metrics come from external analytics, not always accessible via API
- [ ] Bounded output: YES - outcome schema is fixed
- [ ] Explicit failure handling: YES - defined above
- [ ] Observable execution: YES - outcomes table + events
- [ ] Reversibility: NO - outcomes are historical records (but can be updated with new data)
- [ ] Stable decision rule: YES - conclusion criteria are explicit
