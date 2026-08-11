# SOP-002: Commercial Qualification
**Owner:** Qualification Plane → Mike (manual review) / n8n (scoring assist)
**Service Target:** < 24h from audit completion to qualification decision

## Trigger
`audits.status = 'completed'` AND the prospect has at least one finding with `severity >= 'medium'`

Alternatively: triggered manually by Mike when reviewing a prospect with sufficient information.

## Required Inputs
| Field | Required | Source |
|-------|----------|--------|
| prospect_id | Yes | From the audit trigger |
| audit_id | Yes | From the audit that produced findings |
| Findings array | Yes | At least one finding with evidence |
| URL / Domain | Yes | From web_properties |
| Traffic status | Yes (can be 'unverified') | Assessment or analytics |

## Validation Rules
1. Audit must be in `completed` status - do not qualify an incomplete audit
2. At least one finding with `severity >= 'medium'` must exist
3. Findings with `confidence < 0.3` must be flagged for human review before qualification
4. Qualification must be re-reviewed if audit is re-run with a newer version

## Qualification Criteria

Nebula classifies into three buckets. Use the following assessment framework:

### Qualified (score = 6-7 points)
Requires at least 5 of 7 criteria:

| # | Criterion | Points | Evidence Required |
|---|-----------|--------|-------------------|
| 1 | Active paid traffic | 2 | Google Ads / Meta Ads / TikTok Ads running now |
| 2 | Material conversion weakness | 2 | CR < 2% for ecommerce, < 5% for SaaS, or expressed pain about "no conversions" |
| 3 | Measurable business value | 1 | Traffic volume justifies $97 (typically > 500 sessions/mo) |
| 4 | Ability to make changes | 1 | Owns or controls the site; has dev access or uses a platform |
| 5 | Willingness to implement | 1 | Expressed openness to "fixing it" or hired help before |
| 6 | Buyer authority | 1 | Is the decision-maker or has budget authority |
| 7 | Urgency | 1 | Wants result "this week" or "as soon as possible" |

### Potentially Qualified (score = 3-5 points)
- Has some evidence of conversion weakness but missing traffic verification, authority, or urgency data
- Re-review when missing_evidence is obtained

### Not Qualified (score = 0-2 points)
- No active traffic
- No conversion problem
- No budget / no authority
- Re-review in 90 days or on re-engagement

## Procedure
1. Load audit findings for `audit_id`
2. Assess each of the 7 criteria against available evidence
3. Populate `reason_codes` array with confirmed criteria
4. Populate `missing_evidence` array with what's missing
5. Set `classification` based on points
6. Set `reviewed_at` and `reviewer` (Mike or automated)
7. Publish event: `qualification.completed`
8. Route based on classification:
   - **Qualified →** create `offers` record with `status = 'draft'`, notify Mike
   - **Potentially Qualified →** set `prospects.lifecycle_state = 'problem_confirmed'`, queue for follow-up
   - **Not Qualified →** set `prospects.lifecycle_state = 'audit_completed'`, send nurture (if email exists)

## Decision Points
- **Conflicting signals** (e.g., high traffic but no demonstrated pain) → route to human review
- **Missing traffic data** → do not classify as "qualified" - mark as "potentially_qualified" with reason `active_paid_traffic_unconfirmed`
- **New business / pre-revenue** → flag as potentially_qualified; Nebula's $97 fix is appropriate for early-stage but retainer is not
- **Agency or consultant submitting on behalf of client** → ask for client relationship clarity before qualifying

## Outputs
- `qualification_id` (UUID)
- `classification` (qualified / potentially_qualified / not_qualified)
- `reason_codes` array
- `missing_evidence` array
- Updated `prospects.lifecycle_state`

## Evidence Produced
- `qualifications` row with classification and reasons
- Event: `qualification.completed` with classification in payload

## Failure States
| Failure | Behavior |
|---------|----------|
| No findings for audit | Mark as 'potentially_qualified' with reason `audit_completed_no_findings` |
| Missing URL | Cannot qualify - set missing_evidence = ['url'] |
| Missing traffic data | Classification capped at 'potentially_qualified' |

## Escalation Path
- **High-value prospect** (traffic > 10k/mo or ecommerce revenue > $100k/mo) → always route to Mike
- **Edge case** (unusual business model, compliance-sensitive industry) → flag for Mike
- **Prospect disputes qualification** → Mike reviews manually

## Automation Readiness Gate
- [ ] Deterministic trigger: YES - audit.completed event
- [ ] Structured inputs: YES - findings, prospect, web_properties all in known schema
- [ ] Bounded output: YES - 3 classifications, fixed schema
- [ ] Explicit failure handling: YES - defined above
- [ ] Observable execution: YES - qualifications table + events
- [ ] Reversibility: YES - can re-qualify with new data
- [ ] Stable decision rule: NOT YET - needs 20+ human qualification cycles to validate thresholds
