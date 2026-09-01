# Commercialization Gates

**Status:** Active  
**Established:** 2026-09-01  
**Authority:** `docs/governance/opportunity-governance.md`

---

## Purpose

Defines the explicit multi-dimensional evidence criteria that must each be evaluated before a candidate can advance to COMPONENT_CANDIDATE, and the determinations permitted at each dimension.

Technical capability does not satisfy any criterion. Citable capability does not satisfy any criterion. A single customer request does not satisfy any criterion.

---

## Gate Determinations

Each criterion must be assigned one of four determinations:

| Determination | Meaning |
|---|---|
| **PASS** | Affirmative evidence gathered, documented, and linked. The criterion is satisfied. |
| **FAIL** | Evidence gathered; it negates the criterion. Further investigation may not reverse this without new evidence from independent sources. |
| **INDETERMINATE** | Observations exist but are insufficient to support PASS. Not the same as no evidence. |
| **INCOMPARABLE** | The criterion cannot be meaningfully evaluated with available methods or the available comparanda are not equivalent. |

**Authorization rules:**

- All seven criteria at PASS = gate passed; COMPONENT_CANDIDATE status may be authorized.
- Any criterion at FAIL = gate cannot pass. Opportunity moves to REJECTED or DORMANT.
- Any required criterion at INDETERMINATE or INCOMPARABLE = gate blocked at INSUFFICIENT_EVIDENCE.
- INDETERMINATE is not a path to PASS by default. New independent evidence is required.

---

## The Seven Criteria

### C1: Real Phenomenon

**Question:** Is there an observable, recurrent problem that exists independent of Nebula's framing?

**Required evidence:**
- Two or more independent sources documenting the same problem pattern (not customer descriptions of Nebula's own product).
- Evidence must not be Nebula-originated framing presented back to customers.

**Failure mode:** Evidence consists only of Nebula marketing copy validated by customers who have seen that copy first.

**Determination thresholds:**
- PASS: Three or more independent observations from distinct sources, at least one of which predates Nebula's commercial framing.
- INDETERMINATE: Observations exist but provenance is single-source or potentially Nebula-contaminated.
- FAIL: Investigation finds the problem is primarily Nebula-induced framing rather than a pre-existing condition.

---

### C2: Meaningful Pain

**Question:** Does the problem cause material cost, lost opportunity, or significant friction that a customer would rationally pay to relieve?

**Required evidence:**
- Customer-described economic consequence or time cost (not Nebula's modeled projection).
- Evidence that customers have already attempted a workaround (implies the pain is real enough to prompt action).

**Failure mode:** Customers acknowledge the problem but show no behavior (search, spend, workaround) indicating willingness to act.

**Determination thresholds:**
- PASS: Two or more independent customers document a cost or workaround attributable to the problem.
- INDETERMINATE: Customers agree the problem is real but no economic or behavioral evidence of pain.
- FAIL: Problem is acknowledged as cosmetic or low-stakes across all observations.

---

### C3: Addressability

**Question:** Does Nebula have or can Nebula develop a specific, bounded intervention that materially reduces the problem?

**Required evidence:**
- A proposed intervention scoped to the problem (not a general capability).
- An honest assessment of what the intervention cannot address.

**Failure mode:** The proposed solution is a general platform expansion that addresses many problems none deeply.

**Note:** This is a Nebula capability assessment, not a Citable capability assertion. Citable's ability to detect a condition is not evidence that Nebula can address the underlying customer problem.

**Determination thresholds:**
- PASS: A specific, bounded intervention is described with explicit scope boundaries and at least one identifiable limitation.
- INDETERMINATE: An intervention is conceivable but not specified.
- INCOMPARABLE: The problem domain is outside Nebula's viable scope regardless of technical capability.

---

### C4: Customer ROI Potential

**Question:** Can a customer plausibly recover the cost of the intervention from the relief it provides?

**Required evidence:**
- Customer-side cost or value estimate (not Nebula's internal economics).
- Enough specificity to allow a rough breakeven calculation.

**Failure mode:** Value is entirely in the form of "peace of mind" or "best practice" with no attributable economic consequence.

**Determination thresholds:**
- PASS: At least one customer-side cost or value estimate that supports a plausible breakeven at a price point Nebula can charge.
- INDETERMINATE: Value is acknowledged but unquantifiable.
- FAIL: Customer explicitly states the problem does not affect revenue, cost, or efficiency in a measurable way.

---

### C5: Observable Demand and Willingness to Act

**Question:** Do multiple independent customers exhibit behavior (not just stated preference) that signals they would exchange value for the intervention?

**Required evidence:**
- Three or more independent customers expressing the same underlying job/problem.
- Evidence cannot come from a single session or a single interview cohort.
- Behavioral evidence (search, spend, workaround, purchase of alternative) is stronger than stated preference.

**The minimum threshold:**
- Three independent customers, two distinct observation sessions.
- "Independent" means no shared prompt or Nebula framing. Customers reached through the same content campaign are not independent.

**Failure mode:** All evidence comes from the same NPS survey, the same Reddit thread, or customers who self-selected into a Nebula-framed audit.

**Determination thresholds:**
- PASS: Three or more independent customers, behavioral or strong stated evidence, across at least two distinct sessions.
- INDETERMINATE: Fewer than three, or independence is unverified.
- FAIL: All observations are single-session or share a common framing source.

---

### C6: Sustainable Nebula Economics

**Question:** Can Nebula deliver the intervention at a price the market will pay while maintaining margin sufficient to continue operations?

**Required evidence:**
- Rough unit economics: estimated delivery cost vs viable price point.
- An honest assessment of whether automation reduces marginal cost over time.
- Whether the intervention requires ongoing operational capacity Nebula does not currently have.

**Failure mode:** Intervention is priced below sustainable delivery cost, or requires staffing/operational investment Nebula cannot currently make.

**Determination thresholds:**
- PASS: Unit economics support a positive or breakeven margin at a price customers have indicated willingness to pay.
- INDETERMINATE: Economics are unclear because delivery cost is unknown.
- FAIL: Delivery cost exceeds viable price at current operational scale.

---

### C7: Strategic Coherence

**Question:** Does this opportunity align with Nebula's current positioning and not dilute or contradict the existing commercialized offer?

**Required evidence:**
- Assessment against `docs/product/subtractive-differentiation.md` Refuse list.
- Assessment of whether this opportunity competes with or reinforces the existing diagnostic→$97 repair sprint path.

**Failure mode:** Opportunity is technically adjacent but repositions Nebula as a broad SEO/analytics tool, which is on the Refuse list.

**Determination thresholds:**
- PASS: Opportunity is consistent with the current positioning perimeter and is not on the Refuse list.
- FAIL: Opportunity conflicts with the Refuse list or requires re-positioning that weakens the existing commercial focus.
- INDETERMINATE: Positioning implications are unclear; requires explicit founder assessment.

---

## Gate Record Format

Each opportunity that reaches gate assessment must have a gate record appended to this file under the `## Gate Decisions` section below. The record is immutable once written; if evidence changes, a new record supersedes the prior one.

```yaml
# Gate record format
opportunity_id: OPP-YYYYMM-NNN       # unique, assigned at UNDER_INVESTIGATION
label: "brief human-readable label"
assessed_by: "mike"
assessed_at: "YYYY-MM-DD"
citable_signal_ids: []               # from evidence.yaml
demand_signal_ids: []                # from customer-demand-signals.jsonl
convergence_record_id: null          # from convergence-records.yaml, if applicable
determinations:
  c1_phenomenon: INDETERMINATE       # PASS | FAIL | INDETERMINATE | INCOMPARABLE
  c2_pain: INDETERMINATE
  c3_addressability: INDETERMINATE
  c4_roi: INDETERMINATE
  c5_demand: INDETERMINATE
  c6_economics: INDETERMINATE
  c7_strategic_coherence: INDETERMINATE
gate_outcome: INSUFFICIENT_EVIDENCE  # PASS | INSUFFICIENT_EVIDENCE | REJECTED
next_status: DORMANT                 # COMPONENT_CANDIDATE | DORMANT | REJECTED
rationale: ""
adr_ref: null                        # required if outcome is PASS or REJECTED
```

---

## Gate Decisions

*No gate decisions recorded yet. First entries will appear here as opportunities are formally assessed.*

---

## What Is Explicitly Not a Gate

- A Citable capability existing in the open-source package.
- A competitor offering a similar product.
- A founder intuition or preference.
- A single customer feature request.
- Industry analyst opinion or press coverage.
- The existence of an adjacent market category.
- Technical feasibility.

None of these constitute PASS evidence on any criterion. They may be cited as evidence for INDETERMINATE if no behavioral or independent evidence is available.
