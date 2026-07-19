# Nebula Conversion Stewardship — Offer and Service Design

**Status:** Approved design
**Date:** 2026-07-19
**Owner:** Nebula Components
**Initial capacity:** Three concurrent founding customers
**Price:** $2,500 per month
**Initial term:** 90 days, followed by month-to-month continuation

## 1. Decision

Nebula will add an invitation-only monthly CRO service named **Nebula Conversion Stewardship**.

The service owns the health and disciplined improvement of the post-click conversion system receiving a customer's paid Google Ads traffic. It uses Google Ads as a read-only evidence source. Nebula does not create or manage ads.

### Core promise

> We continuously find and repair what stops your paid traffic from converting after the click.

### Boundary statement

> We do not manage your ads. We use read-only Google Ads and GA4 evidence to keep the landing-page conversion system receiving that traffic measured, healthy, and improving.

The customer buys accountable stewardship of a measurable conversion system—not a dashboard, report quota, block of hours, or guaranteed uplift.

## 2. Problem owned

After an initial landing-page fix, the system continues to change:

- Traffic mix and query intent shift.
- The audience responding to ads differs from the assumed audience.
- Pages, forms, scripts, and tracking regress.
- Customer behavior and objections change.
- Multiple providers alter conditions without preserving a causal record.
- The customer cannot tell whether the problem is traffic, message handoff, page experience, measurement, or the offer.

Nebula owns the recurring process that detects material post-click leaks, classifies the root cause, repairs what Nebula controls, verifies production behavior, and records whether the intervention worked.

### Operating loop

`Observe → classify → prioritize → repair → verify → measure → learn`

Each month ends with:

- Tracking health known.
- Material leaks identified and linked to evidence.
- The highest-value controllable issue addressed.
- Changes and production verification documented.
- Outcomes measured where evidence permits.
- Uncertainty stated where it does not.

## 3. Offer ladder and funnel

### Stage 1 — Free URL audit

- Public URL only
- No account connection
- Visible conversion risks
- Zero-friction diagnosis

### Stage 2 — One-time Fix Pack

- Current live public price is $147.
- One-time audit and implementation.
- Produces evidence about access, implementation speed, technical fit, and customer responsiveness.

Legacy internal references still describe a $97 Fix Pack. The monthly offer launch must reconcile the live $147 price with all internal records before public copy changes. This design does not authorize a Fix Pack price change.

### Stage 3 — Private invitation or application

A prospect may be invited after the free audit, Fix Pack, or a readiness review. A Fix Pack purchase is not mandatory when existing evidence already supports qualification.

Nebula creates a customer-specific **Stewardship Opportunity Brief** containing:

- Primary conversion path
- Paid traffic reaching it
- Visible or measured leak
- Cause Nebula can control
- Missing evidence
- Reason a one-time fix will not protect against drift
- Proposed Month 1 baseline and first-value scope

### Stage 4 — Evidence review

A short evidence review determines:

1. Is the problem real?
2. Is it post-click?
3. Can Nebula control it?
4. Can it be measured responsibly?
5. Is the economic upside meaningful relative to the fee?
6. Can the 90-day scope be bounded?

This is a qualification decision, not an unrestricted strategy call.

### Stage 5 — 90-day engagement

Qualified customers receive:

- Written scope
- Access and data terms
- Guarantee terms
- Recurring payment agreement
- Month 1 access checklist

After 90 days, service continues month to month when both parties agree that worthwhile controllable opportunities remain. Either party may stop before the next monthly renewal; no additional notice period or termination fee applies.

## 4. Ideal customer and readiness gate

### Ideal customer

The customer:

- Runs meaningful Google Ads traffic.
- Has one primary conversion path worth improving.
- Lacks a dedicated CRO function.
- Wants direct implementation, not another report.
- Can grant read-only Google Ads and GA4 access.
- Can grant implementation access to the owned page surface.
- Has enough economic headroom for one recovered leak to justify the service.
- Accepts evidence limits and privacy-preserving cohort analysis.

### Hard admission requirements

- Active Google Ads traffic in the preceding 30 days
- One named primary conversion path
- Read-only Google Ads access
- GA4 access
- Consent-aware analytics
- Implementation access
- A valid conversion action or one repairable during Month 1
- A technical stack Nebula can modify safely
- One decision-maker authorized to approve initiatives and access

### Internal readiness assessment

Nebula does not publish an arbitrary universal ad-spend threshold. Qualification evaluates:

- Paid landing-page sessions
- Baseline conversion rate
- Conversion value or qualified-lead value
- Measurement reliability
- Detectable effect at available traffic volume
- Economic headroom relative to the $7,500 initial commitment
- Technical and organizational readiness

Controlled-test claims require a power calculation. Directional diagnostics do not masquerade as controlled experiments.

### Disqualifiers

- Pre-traffic or idea-stage business
- No stable offer or primary conversion action
- Wants campaign management, targeting, or ad creation
- Refuses measurement or implementation access
- Needs core application, CRM, lifecycle, or backend operations
- Insufficient traffic or economic headroom
- Unsupported or unsafe technical stack
- Expects guaranteed revenue, ROAS, or significant lift every month

## 5. Scope

### Nebula owns and may modify

- Landing pages
- On-page copy and information hierarchy
- Trust and proof presentation
- Mobile conversion experience
- Landing-page forms
- Consent-aware analytics instrumentation
- On-page conversion events
- On-page paths to booking, checkout, or another conversion destination
- Landing-page performance, accessibility, and regression defects that affect conversion

### Nebula observes but does not operate

- Google Ads campaign context
- Search intent and query cohorts
- Paid spend and click patterns
- Final URL routing
- Aggregated audience dimensions available under platform privacy rules
- Traffic-quality evidence

### Explicit exclusions

- Creating or managing ads
- Bid or budget changes
- Keyword or negative-keyword operations
- Audience targeting
- Ad creative or copy
- CRM operations
- Lifecycle email or SMS
- Sales operations
- Core product/application development
- Backend or checkout-platform rebuilds
- Individual visitor identification, profiling, scoring, or statistics

When evidence identifies an upstream traffic problem, Nebula documents it for the customer or ad provider and selects the next controllable post-click issue. It does not cross into campaign operations.

## 6. Delivery model

### Month 1 — Foundation and first value

- Connect read-only Google Ads and GA4.
- Verify freshness, permissions, and data availability.
- Audit consent and conversion tracking.
- Establish the primary conversion path and baseline.
- Map paid intent, responding cohorts, destinations, and outcomes.
- Produce the first Post-Click Leak Map.
- Repair tracking defects or one urgent, high-confidence page defect.

Month 1 must produce a functioning measurement foundation and a tangible improvement. A dashboard setup alone is insufficient delivery.

### Month 2 — Highest-impact initiative

Nebula selects the most valuable issue it controls, defines acceptance criteria, implements it, and verifies production behavior.

Examples:

- Rebuild above-the-fold message match.
- Restructure proof and objection handling.
- Repair mobile conversion friction.
- Redesign a form journey.
- Create a focused landing page for a proven intent cluster.
- Repair conversion instrumentation.
- Simplify the on-page path to booking or checkout.

### Month 3 — Measure, refine, and continue

- Measure the Month 2 intervention where evidence permits.
- Separate observed changes from causal certainty.
- Refine the intervention when justified.
- Ship the next bounded improvement.
- Establish the recurring priority queue.

Month 3 is not retrospective reporting only.

### Ongoing monthly cycle

1. System-health check
2. Evidence review
3. Root-cause classification
4. Initiative selection and approval
5. Direct implementation
6. Rendered production QA
7. Outcome memo and next-priority decision

### Definition of one initiative

An initiative is one coherent conversion outcome with:

- One primary conversion path
- Explicit baseline or evidence state
- One hypothesis or repair objective
- Defined implementation surface
- Acceptance criteria
- Rollback method
- Verification plan
- Measurement plan

It may include bounded supporting fixes required for the initiative to work. It is not unlimited development and is not restricted to one trivial edit.

### Priority interruption

Broken forms, tracking failures, consent defects, or severe regressions on the owned path interrupt the normal queue. Repair becomes the current initiative unless the defect is trivial.

## 7. Diagnostic model

Every material leak is classified before intervention:

1. **Traffic-intent failure** — identify and hand off; do not manage ads.
2. **Message-handoff failure** — repair the connection between upstream promise and page experience.
3. **Conversion-experience failure** — repair proof, hierarchy, forms, mobile, accessibility, performance, or friction.
4. **Measurement failure** — repair tracking and attribution on the owned surface.
5. **Offer failure** — diagnose and reshape on-page offer presentation within scope.

Nebula does not blame the page when the evidence indicates traffic quality or another excluded system is the primary cause.

## 8. Evidence architecture

### Evidence sources

1. **Acquisition context** — query themes, campaign context, final URLs, spend, clicks, device, geography, and aggregated demographics where available
2. **Post-click behavior** — consented sessions, engagement, funnel events, form completion, and conversion
3. **Experience evidence** — rendered snapshots, audit findings, technical checks, and regressions
4. **Intervention evidence** — what changed, when, why, production verification, and rollback state
5. **Outcome evidence** — before/after results, confounders, confidence, and optional customer-supplied aggregate revenue or lead-quality data

Version one supports Google Ads and GA4 only. Other ad platforms are excluded until the method is proven.

CRM access is not required. If qualified-lead or revenue evidence is unavailable, Nebula limits conclusions to observable conversions.

### Normalized evidence layer

Nebula stores only the aggregate evidence necessary to operate:

- Source and collection time
- Date range and freshness
- Intent/query cohort
- Campaign context
- Final landing page
- Device/geography/cohort dimensions
- Spend, clicks, sessions, and conversions
- Tracking-health state

### Post-Click Leak Map

The map connects:

`Acquisition context → landing-page destination → observed cohort → page experience → conversion outcome`

Each candidate leak records:

- Severity
- Economic relevance
- Confidence
- Controllability
- Evidence provenance
- Data sufficiency
- Recommended disposition

### Claim labels

- **Observed** — directly present in source data
- **Directional** — a pattern exists, but evidence is insufficient for causality
- **Supported** — multiple sources agree and material confounders are limited
- **Controlled** — a valid experiment supports causal attribution

A post-change increase is not automatically attributed to Nebula.

## 9. Privacy and security

### Privacy model

- Aggregated personas and cohorts only
- No individual visitor identification, profiling, scoring, or statistics
- No user-level event export
- No fingerprinting or identity resolution
- No GCLID or persistent visitor-identifier retention
- No sensitive or protected-trait personalization
- Minimum cohort size of 20; smaller groups are suppressed or rolled up
- No inference when data is thresholded or unknown
- Only minimized aggregate evidence may enter an LLM
- Cross-customer learning uses de-identified aggregate patterns only
- No customer data or identifying detail appears in another customer's output

The system answers: **Which consented cohorts respond and convert?**

It never answers: **Who is this individual visitor?**

### Access and retention

- Credentials use least privilege and encrypted storage.
- Credential access is auditable.
- Credentials are revoked or deleted immediately at termination.
- Operational aggregate data is deleted within 30 days after termination.
- The customer receives an export of reports and intervention history before deletion.
- Nebula may retain only de-identified, non-customer-attributable aggregate learnings.
- Billing and contractual records follow applicable legal retention requirements and remain separate from behavioral evidence.

## 10. Decision and implementation controls

### Initiative priority

1. Expected customer value
2. Evidence strength
3. Nebula control over the cause
4. Effort and reversibility
5. Measurement feasibility
6. Privacy and operational risk

A human approves each consequential production initiative. Automation may collect, normalize, monitor, and rank evidence; it does not autonomously authorize consequential changes.

### Required implementation record

- Baseline and hypothesis
- Scope and exclusions
- Acceptance criteria
- Files, pages, and events affected
- Rollback method
- Production deployment record
- Rendered-browser QA
- Form and event verification
- Mobile and accessibility checks
- Post-deployment monitoring

### Failure handling

- **Access unavailable:** pause the delivery clock; do not infer missing data.
- **Tracking unreliable:** repair becomes the initiative.
- **Evidence insufficient:** label directional or defer the claim.
- **Traffic cause:** document and hand off without touching ads.
- **Concurrent customer/provider changes:** record as confounders.
- **Scope expansion:** split the initiative or quote a separate project.
- **No worthwhile opportunity:** recommend stopping.
- **Production regression:** roll back and repair before continuing.

## 11. Customer experience and artifacts

The customer receives:

- Current system-health status in the monthly brief
- Post-Click Leak Map
- Current initiative and acceptance criteria
- Evidence and change ledger
- Production QA proof
- Monthly outcome memo
- Next-priority rationale
- Exportable engagement archive

Communication cadence:

- Kickoff and access verification
- Asynchronous monthly initiative approval
- Material breakage alerts
- Concise monthly evidence review
- Calls only when a decision genuinely requires one

The service is high-touch in judgment and implementation, not high-meeting overhead.

## 12. Pricing, term, and guarantee

### Price

- $2,500 per month
- 90-day initial term
- $7,500 initial customer commitment
- No separate setup fee
- Month-to-month continuation after 90 days

The founding pilot accepts no more than three concurrent customers. This is a real delivery-capacity limit.

### Market context reviewed on 2026-07-19

- WebFX publicly lists a $1,500 first month and $750 monthly ongoing basic CRO plan with one ongoing CRO/UX asset.
- Entry-level specialist CRO providers commonly report $2,000–$5,000 monthly ranges.
- Smaller specialist agencies commonly report $5,000–$8,000 monthly ranges.
- Mature agencies commonly begin at $10,000 monthly.
- Recommendations without implementation commonly price lower and do not match Nebula's delivery model.

Sources:

- https://www.webfx.com/digital-marketing/pricing/conversion-rate-optimization/
- https://conversionrate.store/blog/cro-pricing
- https://www.invespcro.com/blog/how-much-does-it-cost-to-hire-a-cro-firm/
- https://vwo.com/conversion-rate-optimization/conversion-rate-optimization-pricing/

### Delivery-and-integrity guarantee

- If Nebula fails to ship the agreed initiative for reasons within Nebula's control, the customer receives a $2,500 service credit against the next invoice. If no future invoice will be issued, Nebula refunds that month's $2,500 fee.
- If Month 1 proves no worthwhile controllable opportunity exists, Nebula releases the customer from remaining payments.
- If Nebula causes a production regression, Nebula rolls it back and repairs it before continuing.
- If evidence does not support a claim, Nebula says so.
- Customer-caused access delays, approval delays, or scope changes pause delivery and do not trigger credits.
- Nebula does not guarantee revenue, ROAS, conversion rate, or significant lift.

The customer owns all implemented assets, reports, and intervention history.

## 13. Operational components

The service requires six bounded components:

1. **Access and connector layer** — read-only Google Ads, GA4, and site access
2. **Evidence layer** — minimized aggregate observations with provenance and freshness
3. **Diagnostic layer** — leak classification, confidence, controllability, and prioritization
4. **Initiative workflow** — approval, scope, acceptance, implementation, rollback, and status
5. **Verification layer** — rendered production QA, events, forms, accessibility, and monitoring
6. **Customer evidence layer** — Leak Map, ledger, outcome memo, and export

Each component must be independently testable and replaceable without changing the offer contract.

## 14. Founding pilot success criteria

The first three customers test delivery viability, not only conversion lift.

### Required service proof

- All required access verified or explicitly rejected
- Month 1 baseline and Leak Map delivered
- One bounded initiative agreed and shipped per paid month, except when an approved readiness repair replaces it
- Rendered production QA completed for every change
- Every outcome claim assigned an evidence label
- Every material confounder recorded
- Zero individual visitor profiles or user-level exports
- Zero unauthorized ad-account mutations
- Customer archive export works
- Credential revocation and data deletion process works

### Business proof tracked

- Delivery hours per component
- Time from evidence review to initiative approval
- Time from approval to production verification
- Number of worthwhile controllable opportunities found
- Service credits triggered
- Customer continuation after 90 days
- Gross margin at $2,500 per month
- Which steps can be automated without weakening judgment, privacy, or proof

No target conversion uplift is declared before customer baselines exist.

## 15. Current-state gap

Nebula currently has:

- A real public landing-page audit
- One-time implementation capability
- GA4 consent-mode instrumentation on its own site
- Production deployment and rendered-browser QA discipline

Nebula does not yet have:

- Multi-customer Google Ads OAuth/connectors
- Multi-customer GA4 connectors
- Tenant-isolated credential storage
- Normalized cohort evidence ingestion
- Post-Click Leak Maps
- Intervention ledgers
- Readiness scoring
- Monthly initiative workflow
- Customer evidence exports
- Recurring offer checkout and contract flow

The monthly service must not be sold until its minimum operational and privacy controls are implemented and verified with a controlled internal fixture or consenting pilot.

## 16. Launch blockers and public-copy changes

Before launch:

1. Reconcile the live $147 Fix Pack with legacy $97 records.
2. Replace the absolute public claim "No retainers. No monthly commitments" with language specific to the one-time Fix Pack.
3. Preserve the Fix Pack as a no-recurring-obligation product.
4. Create an invitation/application route rather than public self-serve subscription checkout.
5. Publish explicit service boundaries and privacy terms.
6. Implement the connector, evidence, workflow, verification, export, and deletion controls.
7. Run one controlled end-to-end delivery rehearsal.
8. Accept no more than three concurrent founding customers.

## 17. Non-goals

This design does not authorize:

- A public monthly checkout
- A general digital-marketing retainer
- An ad agency service
- Meta Ads or other platforms in version one
- Individual visitor analytics
- Unlimited development
- Performance-based compensation
- Revenue or ROAS guarantees
- Implementation before the specification and implementation plan are approved
