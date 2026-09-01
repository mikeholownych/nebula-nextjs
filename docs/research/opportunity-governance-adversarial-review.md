# Opportunity Governance — Adversarial Pre-Implementation Review

**Date:** 2026-09-01  
**Commit reviewed:** c585b503f  
**Reviewer role:** Independent adversarial reviewer  
**Mandate:** Determine whether the documented system actually encodes the intended operating model, or merely appears rigorous. Do not fix anything. Do not implement anything.

---

## 1. Verdict

**CONDITIONAL GO** — with four corrections required before implementation begins.

The system encodes the intended operating model in its core architecture. The three-layer separation is real. The gate criteria are honest. The evidence vocabulary is appropriate. The structural choice to extend existing controls rather than build parallel systems is sound.

However, four specific defects would allow the system to be bypassed or to misrepresent evidence in ways that violate the core doctrine. Three are P0 — they create paths to doctrine violations that currently exist in the documented system without further action by an adversary. One is a P0 infrastructure defect: the archive of aspirational documents is not committed to the repository.

The system can proceed to implementation only after these four corrections are made.

---

## 2. Invariant Assessment

The table below assesses the eleven claimed invariants from the design review against the actual repository state.

| Claimed invariant | Actual state | Verdict |
|---|---|---|
| No commercial offer fact reaches public surface without `getActiveFixPack` validation | **VERIFIED**: `public-facts.ts` + tests enforce this. Not changed by this system. | Holds |
| Every active claim has evidence, expiry decision, Observatory status | **PARTIAL**: Claim register has Observatory column added; expiry is `-` for all active claims (no expiry dates to check); CI enforcement not yet implemented. | Holds at current state; collapses on first dated claim |
| No Observatory quantity claim without DatasetRecord | **ASPIRATIONAL**: `observatory-boundary.md` states this as an obligation. No CI test enforces it. `datasets.ts` tests verify the registry but not that Observatory content cites it. | Documentary, not operative |
| C7 FAIL if item is on Refuse list | **VERIFIED in doc**: Subtractive-differentiation Refuse list exists. Gate record requires C7 assessment. No CI enforcement. | Operative by convention only |
| HYPOTHESIS in finding-defensibility-architecture cannot satisfy C1/C3 PASS | **STATED in design-review**: No CI or gate enforcement. Assessor must know the rule. | Documentary only |
| Citable entry with `nebula_commercial_consideration: none` does not imply commercialization | **VERIFIED**: Schema comment states this. Defaults are set. No automated check prevents changing the field on an existing entry. | Convention, no enforcement |
| C5 cannot PASS with fewer than 3 independent customers | **PARTIALLY DEFECTIVE**: "behavioral **or** strong stated evidence" in the PASS definition allows stated preference alone. See A1/A3. | **P1 DEFECT** |
| INDETERMINATE is not PASS | **VERIFIED**: Gate authorization rules state this explicitly. Gate record format enforces it by design. | Holds |
| Observatory authoring gate enforced by citable-proof-integrity.test.ts | **FALSE**: `citable-proof-integrity.test.ts` does not check `observatory_status` in evidence.yaml. The field `observatory_status` does not appear anywhere in the current codebase. | **P0 DEFECT** |
| System archive of system_setup aspirational docs is committed | **FALSE**: `.legacy/` is in `.gitignore`. Archive note, archive copies, and SUPERSEDED banners (on a submodule) are not committed to the parent repository. | **P0 DEFECT** |
| Gate record `adr_ref: null` for PASS outcome is a visible violation | **ASPIRATIONAL**: No test checks this. The comment says "required if outcome is PASS or REJECTED" but null is the default value in the format example. | Documentary only |

---

## 3. Attack Matrix

### A1. One customer request becomes apparent established demand

**Attack:** Record a single customer request in `customer-demand-signals.jsonl` with `independent_customer_count: 1` and `demand_state: observed`. Advance to UNDER_INVESTIGATION (no authorization required). Write a gate record with C5 = INDETERMINATE, citing the one signal. Write the gate outcome as INSUFFICIENT_EVIDENCE but set `next_status: DORMANT`. Six weeks later, the same customer follows up. Record a second entry: `independent_customer_count: 1` again. Now assert "two sessions have occurred" and re-assess with C5 noting "two separate observation windows, behavioral evidence of repeat inquiry." This is technically compliant.

**Result:** P1. The gate stays blocked at INDETERMINATE for C5 (fewer than three independent customers). However, the "two sessions" language in C5 could be read as: two sessions with one customer each = INDETERMINATE but approaching PASS. The design does not explicitly prohibit this reading.

**Correction needed:** C5 must state that "two distinct sessions" means two sessions with **distinct customers**, not two separate contacts with the same customer.

---

### A2. Three coordinated requests satisfy the demand-pattern threshold

**Attack:** A sales team member mentions an opportunity at a conference. Three attendees from different companies independently contact Nebula with requests for the same feature within two weeks. Record three demand signal entries, each with `independent_customer_count: 1`. Write a convergence record. Claim: "three independent customers, multiple interaction events, behavioral evidence (they reached out unsolicited)." C5 PASS.

**Result:** P1. The independence rule states customers reached through "the same content campaign" are not independent. A conference talk is not a "content campaign" by the literal text. The system does not define "independent" rigorously enough to block this.

**Finding:** The independence definition needs to explicitly include: "Customers who received the same pitch, attended the same event, or were referred by the same contact are not independent." This is a gap in the definition, not a willful bypass, but a real adversary exploits it.

---

### A3. Same organization counts as independent customers

**Attack:** A company with three separate business units all submit feature requests. Record three entries with `independent_customer_count: 3`, each citing a different business unit contact. `independence_verified: true` because they are from different domains. C5 PASS on count.

**Result:** **P0.** The system provides no definition of what constitutes an independent "customer" entity. An economic buyer with three internal advocates is not three independent customers. The current schema has no `economic_buyer` or `organization` field (correct for PII reasons), but this also means there is no mechanism to verify that three contacts represent three distinct buying decisions.

**Correction needed:** C5 must explicitly state: "Independent customers means distinct economic buyers capable of making independent purchase decisions. Multiple contacts from the same company, division, or controlled affiliate do not satisfy independence regardless of organizational separation."

---

### A4. Three-customer threshold treated as commercial validation

**Attack:** An opportunity reaches `demand_state: pattern` (3 customers, 2 sessions). A gate assessment is written. The rationale says "C5 PASS: demand pattern established." The gate outcome is written as PASS if C1-C4, C6, C7 also pass. The resulting ADR says "demand is validated."

**Result:** ACCEPTED RISK. This is the intended behavior of the gate — C5 PASS means the demand criterion is satisfied, not that commercial validation is complete. The gate design correctly requires all seven criteria. However, the language in `opportunity-governance.md` uses "Repeated customer demand" and "pattern" without making clear that a C5 PASS is only a demand criterion PASS, not "validated demand" in a colloquial sense.

**Finding:** The documents should consistently say C5 PASS means the demand *criterion* is satisfied, never "demand is validated." Validated demand implies commercial authorization; criterion PASS does not.

---

### A5. Citable capability becomes Nebula roadmap without customer ROI evidence

**Attack:** A new Citable AEO detector gets significant OSS contributor interest. Marketing updates a blog post: "Nebula is exploring how our AEO detection work may inform future product capabilities." This is technically not a public roadmap claim. But it creates an implied roadmap in public minds. No gate record exists. No ADR required for a blog post.

**Result:** P1. The system governs Observatory publication and commercial claims but does not explicitly govern blog posts, conference talks, or interview remarks. These surfaces can create roadmap expectations without triggering any governance gate.

**Finding:** The scope should explicitly state that informal public statements about potential future Nebula capabilities (blog, talk, interview) trigger the same evidence obligations as Observatory publications. This is currently absent.

---

### A6. Popular Citable feature treated as willingness-to-pay evidence

**Attack:** The Citable open-source package releases a new namespace. It gets 200 GitHub stars. The demand signal log is updated: "external research: Citable feature has 200 stargazers; evidence_refs: github.com/citable/releases. independent_customer_count: 200. demand_state: pattern." C5 PASS cited.

**Result:** **P0.** The system explicitly states "Citable GitHub activity, stars, forks" should not be treated as commercial demand. But the current C5 definition says evidence can come from `source_type: external_research`. GitHub stars would qualify as external research under the literal schema. There is no exclusion in the demand signal schema for OSS adoption metrics.

**Correction needed:** The demand signal log schema must explicitly exclude: "OSS adoption metrics (stars, forks, issues, downloads) do not constitute customer demand for a commercial product. A customer is a person or organization that would exchange money for the capability."

---

### A7. Citable GitHub activity treated as commercial demand

**Result:** Same as A6. PASS if A6 is fixed, resolved by same correction.

---

### A8. Common-origin signals recorded as independent convergence

**Attack:** Nebula publishes a blog post about the problem that Citable detects. The blog drives traffic. Three readers come to the audit page. Their audit reasons cite the blog topic. These are recorded as customer demand signals. A Citable evidence run is cited as the Citable signal. A convergence record is written: `independence_verified: true` because the customer signals were "unsolicited audit submissions." The rationale: "customers found us through search, not through the blog."

**Result:** P1. The convergence record schema requires `independence_rationale` to explain the basis for independence. The rule states customers reached through "Nebula-framed audit" are not independent. A blog post discussing the same problem as the Citable detector is Nebula framing. However, the assessor could reasonably argue that search discovery is independent of specific blog promotion.

**Finding:** The independence rules need to state that "Nebula framing" includes any Nebula-authored content about the problem domain, not just the direct audit flow. A customer who arrived through Nebula content may be influenced by that framing even if they were not shown a specific form.

---

### A9. Nebula stimulates customer interest then records as independent corroboration

**Attack:** Nebula runs a LinkedIn post: "Have you struggled with X? Reply with your experience." Three replies come in. These are recorded in the demand signal log as independent customer signals (different companies, unsolicited descriptions of their experience). A C5 PASS is written.

**Result:** **P0.** This is the contamination-by-prompt problem. The C5 definition says customers reached through "the same content campaign" are not independent. A targeted LinkedIn question is a content campaign. However, the current text specifically names "NPS survey, Reddit thread" and "Nebula-framed audit" as failure modes. A proactive demand-generation campaign is not in the list.

**Correction needed:** The failure modes for C5 and the independence rules must explicitly include: "Customers responding to a Nebula-authored request for their experience on a specific problem are not independent — they are a prompted cohort. Independence requires the customer to have described the problem without Nebula prompting the description."

---

### A10. Environmental change classified as trend without persistence evidence

**Attack:** A single Google Search Central blog post announces an algorithm change. This is recorded in evidence.yaml as `evidence_type: external_research`, `signal_source: external_research`, `demand_state: observed`. A convergence record cites it as a Citable trend signal. Gate assessment proceeds to UNDER_INVESTIGATION.

**Result:** ACCEPTED RISK. Advancing to UNDER_INVESTIGATION requires no evidence threshold. Single observations triggering investigation is the intended behavior. The system only blocks advancement at GATE_ASSESSMENT, not at observation recording. This is correct and by design.

---

### A11. Commercially attractive opportunity passes with C4 = INDETERMINATE

**Attack:** Review the gate authorization rules: "Any required criterion at INDETERMINATE or INCOMPARABLE = gate blocked at INSUFFICIENT_EVIDENCE." C4 is a required criterion. C4 INDETERMINATE = gate blocked. 

**Result:** DEFENDED. The system correctly handles this. A PASS requires C4 ≠ INDETERMINATE. The word "required" in the gate rules applies to all seven criteria. A11 is not exploitable as documented.

---

### A12. Commercially attractive opportunity passes with C6 = INDETERMINATE

**Result:** Same as A11. DEFENDED. Gate authorization rules apply to all seven criteria uniformly.

---

### A13. C7 becomes subjective override for failed evidence elsewhere

**Attack:** C1-C6 all fail or are INDETERMINATE. The founder personally believes the opportunity is strategically coherent. Write C7 = PASS, all others INDETERMINATE. Gate outcome = INSUFFICIENT_EVIDENCE (correct because other criteria failed). But in a future gate assessment with slightly more evidence, write C7 = PASS again, then optimistically upgrade C1-C6 to PASS based on enthusiasm rather than new evidence.

**Result:** P1. This is the compliance theater risk. C7 = PASS does not override C1-C6. But a founder who wants to proceed can write five weakly-evidenced PASS determinations alongside a C7 PASS and produce a gate PASS. The gate format does not require evidence quality to be independently assessed — the assessor is also the founder.

**Finding:** This is an inherent limitation of a self-governed single-founder system. The mitigation is git history, the ADR requirement, and the principle that these artifacts will be reviewed by future employees or acquirers. Accept as a structural risk at current scale. Flag for reassessment when a second operator is added.

---

### A14. Gate determination changed without preserving previous determination

**Attack:** A gate record was written with C5 = INDETERMINATE. Evidence improves. The existing gate record is edited in-place to change C5 from INDETERMINATE to PASS.

**Result:** P1 with mitigation. The gate record format says "immutable once written; if evidence changes, a new record supersedes the prior one." Git diff would reveal the in-place edit. The system depends on this convention being followed.

**Finding:** No CI enforcement prevents in-place editing of committed gate records. Git history is the only protection. This is inherent to a file-based system and ACCEPTED RISK at current scale. However, the gate record should have a `supersedes:` field that new records must fill to reference the prior decision. Currently absent.

---

### A15. Evidence references technically valid but semantically stale

**Attack:** An evidence entry in `evidence.yaml` has `verification_status: verified`. The underlying source (an internal SOP) is subsequently updated. The evidence entry retains `verified` status. A gate assessment cites this evidence_id. C1 = PASS.

**Result:** P1. `verification_status: stale` is a defined value but the schema does not require periodic review or staleness triggers. There is no mechanism to invalidate an evidence entry when its source changes. This is a known limitation of manual governance systems.

**Finding:** The existing `measurement_period` field on evidence entries provides partial mitigation (captures when evidence was measured). A staleness TTL policy would close this but introduces maintenance burden. ACCEPTED RISK at current scale.

---

### A16. Empirical marketing claim persists after evidence expires

**Result:** G7 is known open. Claim expiry CI test not yet implemented. The CLAIM_REGISTER for current active claims has all expiry dates as `-` (no expiry set), so no current claim is imminently at risk. The vulnerability exists for future claims with date-based expiry. P0 for future state; not immediately exploitable against current register. Implementation phase must close this.

---

### A17. Empirical claim reclassified as positioning language to bypass evidence

**Attack:** "Landing page audits identify conversion leaks" is an empirical claim (it implies audits work). A marketing operator argues this is "capability framing" rather than an empirical claim and removes it from CLAIM_REGISTER's evidence obligation.

**Result:** P1. The CLAIM_REGISTER validation rules define "performance claims" and "capability claims" but do not define where the capability/empirical boundary lies. A skilled operator could argue many capability statements are positioning rather than empirical.

**Finding:** The design review correctly identifies this risk. The mitigation is the `evidence-atoms.ts` fail-closed pattern, which requires explicit slot registration. The Observatory boundary document's epistemic label table helps. But reclassification of public claims is not CI-blocked. ACCEPTED RISK, mitigated by existing `evidence-atoms.ts` pattern.

---

### A18. Observatory selectively exposes favourable results

**Attack:** Nebula investigates whether a certain signal reliably predicts conversion drop. Results are mixed — sometimes yes, sometimes no. The Observatory only publishes the "yes" cases.

**Result:** **P0 — aspirational rather than operative.** The `observatory-boundary.md` states the adverse result must be "Recorded in the `CLAIM_REGISTER.md` exclusion log." But nothing enforces this. An operator who does not record the adverse result faces no CI consequence. The adverse result handling depends entirely on good faith.

**Correction needed:** The adverse result obligation must be tied to an actionable mechanism. The minimum viable enforcement: the Observatory authoring gate (when implemented) should check that any claim being published has `adverse_result: false` OR has a documented adverse result entry in CLAIM_REGISTER. This is not possible without the `observatory_status` field, which is itself not yet implemented.

---

### A19. Future Citable capability appears in Observatory before authorization

**Attack:** A contributor adds a Citable AEO namespace. An operator adds it to the Observatory's "What Citable checks" page without a gate record.

**Result:** **P0 — the Observatory authoring gate is not enforced.** The design review claims `citable-proof-integrity.test.ts` enforces the Observatory authoring gate, but inspection of that test reveals it enforces case study governance via a compile script, not `observatory_status` field validation. The field `observatory_status` does not exist in the codebase. This means the stated protection does not exist.

**This is the most critical P0 in the system.**

---

### A20. Rejected opportunity re-enters without ADR

**Attack:** An opportunity is written with `gate_outcome: REJECTED`. No ADR is written (ADR is required for REJECTED but the gate record comment says `adr_ref: null` is the default). Two months later, a new gate record is written for the same opportunity with a new ID and no reference to the prior rejection. The prior rejection is not mentioned.

**Result:** P1. The lifecycle diagram shows reopening DORMANT requires ADR. But reopening REJECTED is described as "reopening of DORMANT after prior REJECTED determination" — this means a prior REJECTED opportunity must first be moved to DORMANT before it can be re-assessed, and that move requires an ADR. The path exists and the ADR requirement is explicit. However:

1. The `adr_ref: null` default in the gate record template implies a PASS outcome with no ADR is not immediately rejected by the format.
2. A new gate record with a new OPP-ID would not reference the prior rejection.

**Finding:** Gate records should include a `prior_assessments: []` field listing any previous OPP-IDs for the same problem domain. This is a low-cost addition that makes the history traceable.

---

### A21. Large customer finances bespoke capability

**Attack:** A $5k ARR enterprise customer demands a specific reporting feature. Nebula builds it to close the deal. The feature is now live in production but has no gate record.

**Result:** P1 with a real risk. The current system governs Observatory publication and new Components. It does not govern bespoke customer work or feature work built under a service agreement. A bespoke capability built for one customer can quietly become a general product feature without any gate process.

**Finding:** The system should state explicitly that any capability built under a bespoke arrangement that is subsequently made available to other customers requires a commercialization gate assessment. This is currently absent from the scope definition.

---

### A22. Experiment continues indefinitely without closing

**Attack:** An opportunity reaches VALIDATION_ACTIVE. A bounded experiment is authorized. No deadline is set in the gate record. The experiment continues for 18 months, consuming operational resources. It never produces enough evidence to PASS but never produces enough FAIL evidence to close.

**Result:** P1. The gate record format does not include a `validation_deadline` or `experiment_scope` field. VALIDATION_ACTIVE has no exit condition in the lifecycle diagram other than proceeding to GATE_ASSESSMENT. A "bounded" experiment is described in `opportunity-governance.md` but "bounded" is not defined.

**Finding:** The gate record format should require a `validation_scope` field (what specifically is being tested) and a `closes_at` or `evidence_required_by` date when VALIDATION_ACTIVE is authorized. Without this, experiments can run indefinitely.

---

### A23. Bounded validation becomes de facto production

**Attack:** A validation experiment builds a feature for a small cohort. The cohort grows by word of mouth. The feature is now in production for 50 customers. The gate was never passed.

**Result:** P1. This is the same as A21/A22 but through growth rather than explicit bespoke work. Mitigated by `public-facts.ts` — a feature cannot be commercially offered or priced without going through the offer facts mechanism. However, features that are "available without formal pricing" could exist outside this gate.

**Finding:** ACCEPTED RISK at current scale. Nebula has one commercial offering and a small customer base. This risk grows as the business scales.

---

### A24. Missing evidence interpreted as absence of negative evidence

**Attack:** C5 has `demand_state: not_assessed`. Assessor writes C5 = INDETERMINATE with rationale "insufficient evidence gathered to date; no counter-evidence." The gate outcome is INSUFFICIENT_EVIDENCE. But the assessor notes in the rationale "no negative signal." This subtly misrepresents INDETERMINATE as a neutral holding state.

**Result:** ACCEPTED RISK. The system explicitly states "INDETERMINATE is not a path to PASS by default." INDETERMINATE means observations are insufficient, not that absence of failure is present. The gate format prevents INDETERMINATE from becoming PASS. ACCEPTED.

---

### A25. Founder authority overrides failed gate

**Attack:** C3 = FAIL. The founder disagrees with the assessment. The founder writes a new gate record with C3 = PASS, citing "corrected analysis." No ADR for the change.

**Result:** P1 in a single-founder system. The system depends on the founder's self-discipline. The mitigation is git history: the sequence of two gate records for the same opportunity, with C3 flipping from FAIL to PASS, is auditable. Future employees, investors, or acquirers would see this clearly.

**Finding:** ACCEPTED RISK at current scale. Flag for structural reassessment when a second operator is added with independent authority.

---

### A26. Operator ignores governance artifacts

**Attack:** An operator adds a new Nebula feature, updates `public-facts.ts`, deploys. No gate record. No ADR. No demand signal entries.

**Result:** P1. The `public-facts.test.ts` would catch structural invalidity in the offer facts but would not catch a new offer being added without a gate record. A new offer could be added if `publicFacts` structure is maintained.

**Finding:** There is a downstream catch (`public-facts.ts` must be structurally valid) but no upstream gate enforcement. A new commercial offering that maintains the `publicFacts` structure requires no gate record. This is the most likely real-world bypass vector for Nebula at current scale.

**Finding severity upgraded to P0:** A new commercial offer can be shipped without any evidence gate simply by following the existing `public-facts.ts` pattern. The governance system must explicitly state that changes to `public-facts.ts` that add new offer keys require a prior PASS gate record. This connection is stated in prose but no test enforces it.

---

### A27. Governance records written after decision

**Attack:** Decision made. Feature shipped. Gate record written afterwards to create the appearance of prior governance.

**Result:** ACCEPTED RISK. Git timestamp provides weak evidence of sequence. The ADR requirement creates a second artifact (the ADR commit), making post-hoc documentation more visible. No structural enforcement prevents it in a file-based system.

---

### A28. System becomes burdensome, bypass becomes rational

**Result:** The gate format is intentionally minimal (one YAML block, fifteen fields). Time cost of writing a gate record: approximately 15-20 minutes. Risk: If the format drifts toward requiring extensive supporting documentation, the burden-to-value ratio inverts and bypass becomes rational.

**Finding:** ACCEPTED RISK. The minimality principle is a design invariant; if the system grows heavier, invoke ADR-003's revision triggers.

---

## 4. C1-C7 Gate Analysis

### C1: Real Phenomenon

**PASS requirements:** Three or more independent observations, at least one predating Nebula's commercial framing.

**Evidence reference mandatory?** No. The gate record format has `citable_signal_ids: []` and `demand_signal_ids: []` as free-text arrays. No CI check validates that these IDs exist in their respective registries.

**Circular evidence possible?** Yes. An internal SOP describing a problem can be cited as evidence that the problem is real. This is circular: Nebula documents the problem, then cites its own documentation as evidence the problem exists.

**Can one evidence item satisfy multiple gates?** Yes. A customer interview that describes pain (C2), economic consequence (C4), and a workaround (C5) satisfies three criteria. This is legitimate multi-criterion evidence, not circular.

**C1 assessment:** Adequate for documentary purposes. The "predates Nebula's commercial framing" requirement is the correct protective element. However, there is no enforcement — an assessor can cite post-framing evidence and write a PASS.

---

### C2: Meaningful Pain

**PASS requirements:** Two or more independent customers document cost or workaround.

**Gap:** C2 PASS requires only two customers, while C5 requires three. A situation where C2 = PASS but C5 = INDETERMINATE (only two customers) means the gate still blocks. Consistent — C2's lower bar is appropriate because it measures pain depth, not demand breadth.

**C2 assessment:** Sound. The workaround requirement is good — it demands behavioral evidence of pain.

---

### C3: Addressability

**PASS requirements:** A specific, bounded intervention described with explicit scope boundaries and at least one limitation.

**Critical observation:** C3 PASS requires only a written description. No prototype. No feasibility validation. No customer feedback on the proposed intervention. An operator can write "we would offer a report that identifies X" with "limitation: does not address Y" and satisfy C3 PASS. This is the weakest criterion.

**Assessment:** C3 is essentially a self-attestation criterion. This is acceptable at the investigation phase but should be explicitly noted as requiring a prototype or feasibility test if the opportunity reaches VALIDATION_ACTIVE.

---

### C4: Customer ROI Potential

**PASS requirements:** At least one customer-side cost or value estimate that supports a plausible breakeven.

**Exploit:** "Plausible breakeven at a price point Nebula **can charge**" — this is Nebula-framed, not customer-framed. The criterion says "customer-side cost or value estimate (not Nebula's internal economics)" but the PASS threshold says "price point Nebula can charge." These are in tension. The assessor determines what price Nebula can charge, then asks if the customer estimate supports a breakeven at that price. This allows working backwards from a desired price to declare C4 PASS.

**Correction needed:** C4 PASS should require: "at least one customer who has described an economic consequence that they would plausibly pay to relieve, at a price they named or accepted." Nebula should not be setting the price point in the criterion definition.

---

### C5: Observable Demand and Willingness to Act

**Primary gap (P0):** "behavioral **or** strong stated evidence" — the word "or" allows three customers with purely stated preference (no behavioral evidence) to satisfy C5 PASS. "Strong stated preference" is undefined. Two operators could reach opposite conclusions about whether the same interview constitutes "strong stated preference."

**Secondary gap (A3):** No definition of independent economic buyer vs. independent contact.

**Tertiary gap (A2):** Conference attendees, event-triggered requests are not explicitly excluded.

**C5 assessment:** The threshold number (3/2) is reasonable as an initial operating level. The problem is definitional ambiguity in what constitutes independence and what constitutes behavioral vs stated evidence. The criterion needs tightening, not the number.

---

### C6: Sustainable Nebula Economics

**INDETERMINATE path:** "Economics are unclear because delivery cost is unknown." This is a valid INDETERMINATE state. However, a founder motivated to proceed can delay the economics assessment indefinitely by keeping delivery cost "unknown." There is no requirement to make delivery cost known before proceeding past VALIDATION_ACTIVE.

**C6 assessment:** The criterion is correctly formulated. The risk is deferral of the economics assessment to GATE_ASSESSMENT rather than VALIDATION_ACTIVE. Consider requiring a rough economics estimate before VALIDATION_ACTIVE is authorized.

---

### C7: Strategic Coherence

**Subjectivity risk:** C7 is fundamentally a judgment call. "Consistent with current positioning perimeter" is not measurable by two operators independently. The Refuse list provides some objective anchors, but positioning coherence beyond the Refuse list is subjective.

**C7 assessment:** This criterion is intentionally the least measurable. Accept as designed. The Refuse list is the objective anchor; coherence beyond that is founder judgment. Document this explicitly so future operators understand that C7 = PASS on borderline cases is a founder prerogative, not an evidence determination.

---

## 5. Demand-Threshold Analysis

**The threshold:** ≥3 independent customers, ≥2 distinct observation sessions.

**Q1. What constitutes an independent customer?**  
**Gap (P0):** Currently undefined. "No shared prompt or Nebula framing" is the only stated exclusion. Multiple contacts from the same company are not excluded by the current text.

**Q2. What constitutes an independent session?**  
**Gap:** "A single interview session with multiple participants" is excluded. But two sessions, each with the same two participants, would satisfy the two-session requirement. "Session" needs a definition: "A session is a distinct observation event with at least one customer not present in any prior session."

**Q3. Can subsidiaries/accounts/users from one economic buyer count independently?**  
**Gap (P0):** Currently yes, because there is no economic-buyer definition. Three divisions of one company can satisfy the threshold.

**Q4. Can requests from the same campaign count independently?**  
**Partially addressed:** "Same content campaign" is excluded. A conference talk or a direct outreach campaign is not clearly a "content campaign."

**Q5. Does the threshold establish PATTERN or VALIDATED DEMAND?**  
**Defect:** The design review (section 10) says "the minimum for `demand_state: pattern` is three independent customers. The gate cannot PASS with `demand_state: observed` on C5." However, `demand_state: pattern` in the signal log does not map directly to C5 PASS. C5 PASS has its own threshold definition. The relationship between `demand_state: pattern` and C5 PASS is not explicitly stated in either document.

**Q6. Is 3/2 evidence-based or an initial operating threshold?**  
**Transparent and honest:** ADR-003 states "The minimum evidence thresholds prove systematically wrong (too strict or too permissive) based on outcomes" as a revision trigger. The threshold is explicitly provisional. This is acceptable.

**Q7. Should the threshold be versioned?**  
**Recommendation:** The threshold should be stated with a version date. If it changes, ADR-003 item 7 requires an ADR. Adding `threshold_version: "2026-09-01"` to the gate record format would make threshold changes traceable in historical decisions.

**Q8-10:** Answered in attacks A1-A3 above.

---

## 6. Convergence Independence Analysis

The convergence record schema has a sound structure: `independence_verified: bool` + `independence_rationale: string` is the right primitive.

**Identified gaps:**

1. The three-way relationship type (`co-directional`, `corroborating`, `possibly_related_unverified_independence`) is good. However, "corroborating" is weaker than "co-directional" but is not treated differently in any downstream gate assessment. A gate record that cites only corroborating convergence as its basis for C1 PASS has lower evidentiary weight than one citing co-directional convergence. The gate format does not capture this nuance.

2. There is no mechanism to prevent the same underlying cause from being recorded as two independent signals. Example: Nebula publishes about a problem → Citable detects that problem → customers read the Nebula publication and report the problem. Three "signals" with one root cause.

3. **No CI check verifies that `citable_signal_ids` in a convergence record exist in `evidence.yaml`.** Free text IDs.

**Overall assessment of convergence design:** Sound for a file-based system at current scale. The independence rationale requirement is the key protection. The weakness is unverified reference IDs.

---

## 7. Observatory Boundary Analysis

**The Citable ≠ Nebula distinction:**

- "Citable knows/supports X ≠ Nebula sells X" — stated clearly in `opportunity-governance.md` Layer 1 and `observatory-boundary.md`.
- "Nebula investigates X ≠ Nebula sells X" — stated in lifecycle; UNDER_INVESTIGATION does not trigger any public disclosure obligation.
- "Nebula validates X ≠ Nebula publicly claims X works" — stated in observatory-boundary: "SOP-005-level evidence required" for before/after claims.
- "Nebula commercially presents X = corresponding evidence obligation" — stated and defined.

**Critical defect (P0 — repeated from A19):**

The Observatory authoring gate is documented as enforced by `citable-proof-integrity.test.ts`. This is false. That test enforces case study governance but does not check `observatory_status`. The field `observatory_status` mentioned in `observatory-boundary.md` does not exist in the codebase. The authoring gate is entirely aspirational.

**Adverse result handling:**

The adverse result obligation ("must be recorded in CLAIM_REGISTER under Excluded Claims") is stated as a "must" in `observatory-boundary.md` but has no enforcement mechanism. It is a policy statement without a test. If an operator investigates a capability and finds adverse results, there is nothing technically stopping them from simply not recording the finding.

**Assessment:** The boundary definition is correct and clearly written. The enforcement is missing. Two of the three named enforcement mechanisms (`citable-proof-integrity.test.ts` for Observatory and adverse result recording in CLAIM_REGISTER) are documentary only. The only real enforcement is downstream (downstream being `public-facts.ts` and the CLAIM_REGISTER for existing claims) which does not prevent new Observatory content from appearing without authorization.

---

## 8. Claim Governance / G7 Analysis

**G7 current state:** The CLAIM_REGISTER contains active claims with all expiry dates set to `-`. No dated expiry exists in the current register. The CI test gap does not presently affect any current claim.

**Minimum CI enforcement to close G7:**

The test must correctly:

1. Identify the "Active Claims" section (between `## Active Claims` and `## Excluded Claims`).
2. Parse table rows within that section only.
3. Extract the `Expiry` column (column 6, 0-indexed, in the 8-column table).
4. If the value is a date string matching `YYYY-MM-DD`, compare to today's date and fail if past.
5. If the value is `-`, pass silently.
6. Ignore rows in the Excluded Claims section.
7. Ignore header rows and separator rows (`---`).

**Is CLAIM_REGISTER.md reliably machine-parseable?**

**Partially.** Findings:

1. **Section boundary detection is safe:** `## Active Claims` and `## Excluded Claims` are reliable section markers.
2. **Table structure inconsistency:** The Active Claims table has two separate `### Product Claims` and `### Service Claims` subsections, each with their own header row. A parser must handle multiple table headers in the same logical section.
3. **Column count:** All Active Claims rows now have 8 columns (verified). Parser must expect 8 columns.
4. **Excluded Claims table has a different column structure** (no Observatory column, no Expiry column): columns are `Claim | Reason | Removal Date | Routes Cleaned`. A section-aware parser handles this correctly.
5. **Change Log at the bottom uses a 3-column table.** Must be ignored.

**Verdict:** Machine-parseable with a section-aware parser. A naïve `grep` for pipe-delimited rows would produce false positives from the Excluded Claims and Change Log sections. Recommend a structured parser that identifies section boundaries explicitly.

**Additional tests needed for G7 closure:**

- `review-due claim`: A claim whose evidence entry has `verification_status: reviewed` (not `verified`) and is more than 90 days old should trigger a review warning (not fail).
- `missing expiry where mandatory`: Any claim with `evidence_type: test_result` or `verification_status: reviewed` (implying time-sensitive evidence) should require an expiry date. Currently underdefined.
- `invalid date`: A claim with `Expiry: not-a-date` should fail the parser with a clear error.
- `methodology version dependency`: If a claim's evidence entry has `measurement_period` older than N months, the claim's `verification_status` should be checked for `stale`. Currently no test enforces this relationship.
- `evidence-state regression`: If `evidence.yaml` changes `verification_status` to `stale` on an entry referenced by an active claim, the CI should flag the claim for review. Currently no cross-reference exists between claims and evidence IDs.
- `Observatory/public-surface claim with stale evidence`: When `observatory_status` is implemented, any claim in `published` state must have backing evidence with `verification_status: verified` (not `stale`).

**Migration recommendation:** CLAIM_REGISTER.md is adequate for CI parsing. Do not migrate to JSON/YAML unless the table structure becomes inconsistent. The current structure is parseable. A migration would be unnecessary complexity at current scale.

---

## 9. Submodule Authority Analysis

**Actual state (confirmed by repository inspection):**

- `system_setup` is tracked as a git submodule (confirmed by `git ls-files` returning it as a tracked item and `git diff` showing it as `Subproject commit`).
- `.gitmodules` is absent — the submodule is registered as a submodule in the git index but has no mapping file. This is a degenerate submodule state.
- The `.legacy/` directory is in `.gitignore` and is therefore **not committed** to the parent repository.
- The SUPERSEDED banners were written to the submodule's working tree but changes to the submodule cannot be committed from the parent repository.
- The archive note and copies in `.legacy/` are therefore invisible to anyone cloning the repository.

**The ADR-003 claim "Archived to `.legacy/` with a rationale note"** is false as committed. The archive artifacts exist on disk but are not part of the repository.

**Does the parent repository currently:**

1. **Clearly establish which governance artifacts are authoritative?** YES — `docs/governance/` directory with clear `opportunity-governance.md` entry point. `docs/adr/adr-003-opportunity-governance.md` is committed.

2. **Prevent system_setup files from being mistaken as operative policy?** PARTIALLY — `opportunity-governance.md` states it supersedes those documents. But someone discovering `system_setup/GOVERNANCE_POLICIES.md` by browsing the repository would see the SUPERSEDED banner only if the submodule is checked out. If the submodule is not checked out (common for shallow clones), the directory would either be empty or show the old commit, without the SUPERSEDED banner.

3. **Need a tracked parent-repository supersession notice?** YES. A file at the parent repository level (e.g., `system_setup/README.md` as a tracked file if the submodule path can carry tracked files — which it cannot) or a note in `AGENTS.md`/`CLAUDE.md` is needed.

**Correction needed:** Add a note to `CLAUDE.md` and `AGENTS.md` that `system_setup/GOVERNANCE_POLICIES.md` and `system_setup/PROVENANCE_SYSTEM.md` are aspirational documents superseded by `docs/governance/`. This is tracked in the parent repository and will be visible to all operators without needing the submodule checked out.

---

## 10. Compliance-Theater Findings

For each control, does the artifact make an incorrect decision harder to make?

| Control | Harder decision | Theater or operative? |
|---|---|---|
| `opportunity-governance.md` | Advancing to COMPONENT_CANDIDATE without documentation | **Documentary** — no CI block |
| `commercialization-gates.md` + gate record format | Writing a PASS gate record without seven determination fields | **Partially operative** — gate format structure enforces completeness; no enforcement of evidence quality |
| `observatory-boundary.md` | Publishing Observatory content without authorization | **Documentary** — the cited CI enforcement (`citable-proof-integrity.test.ts`) does not enforce this |
| `customer-demand-signals.jsonl` | Recording three signals as "pattern" when fewer than 3 independent customers | **Documentary** — no CI check; independence is self-assessed |
| `convergence-records.yaml` | Claiming independent convergence when sources share a cause | **Documentary** — `independence_verified: bool` is self-assessed |
| `evidence.yaml` `signal_source` field | Citing Citable evidence as demand evidence | **Partially operative** — C5 PASS requires demand_signal_ids; Citable signal_ids cannot satisfy C5. Gate criteria design enforces the separation. |
| `evidence.yaml` `nebula_commercial_consideration: none` | Treating an unchanged Citable entry as commercial signal | **Partially operative** — the default field value makes the non-consideration state explicit; operator must actively change it |
| `CLAIM_REGISTER.md` Observatory column | Publishing Observatory claim without setting `pending` | **Documentary** — no CI check on Observatory column values |
| `adr-003-opportunity-governance.md` | Making commercialization decisions without an ADR | **Documentary** — no CI enforcement |

**Summary:** Approximately 3 of 9 controls are operative (the gate criteria design, the evidence.yaml field defaults, and the downstream public-facts.ts gate). Six of nine are documentary. The system is not compliance theater at its core — the gate criteria correctly require non-circular evidence for seven dimensions — but the enforcement surface is thin.

The most operative control is not in the new documents at all: it is the existing `public-facts.ts` + tests which prevent a new offer from reaching customers without structural validation. The new governance layer is strongest when it is treated as a pre-commercial deliberation record, not an enforcement system.

---

## 11. Minimality Findings

**Redundant fields:**

- `demand_state` in `evidence.yaml` and the `demand_state` field in `customer-demand-signals.jsonl` can drift. Consider whether `evidence.yaml` needs `demand_state` or whether that is better owned entirely by the signal log. Currently the signal log is authoritative for demand state; the evidence.yaml field is a denormalized convenience. Flag for decision: is this intentional duplication acceptable?

**Unnecessary lifecycle states:**

- `VALIDATION_ACTIVE` is appropriate but "bounded" is undefined and the stage has no exit criteria in the gate record format. Either define it or merge it with UNDER_INVESTIGATION.

**Records nobody would realistically maintain:**

- `convergence-records.yaml` — at current scale with one paying customer and no expansion candidates, this will likely remain empty for months. This is acceptable; the schema is correct even if unused.

**Thresholds without meaningful decision effect:**

- The C5 three-customer threshold is the right number, but "strong stated evidence" as an alternative to behavioral evidence makes the threshold effectively "three stated preferences" in the worst case. The qualifier adds complexity without adding protection.

**Simplification opportunity:**

- The `nebula_commercial_consideration` field in `evidence.yaml` has five values (`none`, `watching`, `under_review`, `declined`, `admitted`). `watching` and `under_review` duplicate the `UNDER_INVESTIGATION` and `VALIDATION_ACTIVE` lifecycle states without adding information. Consider reducing to three values: `none`, `under_assessment`, `decided` — where `decided` state is fully described by the gate record, not by this field.

**What should be deleted/simplified, not expanded:**

- Do not add SOPs 006 and 007 until the first real gate assessment is attempted. Learn from the real process before documenting an ideal one.
- Do not add a `prior_assessments` field to the gate record until a second gate assessment is written. At zero gate records, adding complexity is premature.

---

## 12. Required Design Corrections Before Implementation

These are corrections to the design documents (not implementations). They must be made before the implementation phase begins.

### Correction R1 (P0): Observatory authoring gate is not enforced

**Problem:** `observatory-boundary.md` claims `citable-proof-integrity.test.ts` enforces the Observatory authoring gate. This is false. The field `observatory_status` does not exist in the codebase. The enforcement claim is a false positive.

**Required correction:** Remove the claim that `citable-proof-integrity.test.ts` currently enforces this gate. State explicitly that the Observatory authoring gate CI enforcement is pending implementation. Add `observatory_status` to the `evidence.yaml` schema as a defined field with values `not_applicable | publishing_authorized`. This field must be added and tested in the implementation phase before any new Observatory content is published.

---

### Correction R2 (P0): A26 — new commercial offer can bypass gate

**Problem:** A new commercial offer that maintains the `publicFacts` structure requires no gate record. The connection between gate records and `public-facts.ts` changes is stated in prose but not enforced.

**Required correction:** Add to `opportunity-governance.md` and `commercialization-gates.md`: "Any addition of a new offer key to `public-facts.ts` requires a PASS gate record with matching `opportunity_id` committed in the same or prior commit. This is enforced in the implementation phase by a test that checks `public-facts.ts` offer keys against the gate decision log."

---

### Correction R3 (P0): A9/A3 — independence definitions are too narrow

**Problem:** The C5 independence definition only excludes "same content campaign," "same Reddit thread," and "same Nebula-framed audit." It does not exclude:
- Multiple contacts from the same economic buyer (A3).
- Customers responding to Nebula-authored prompts for their experience (A9).
- Customers from the same event or pitch (A2).

**Required correction:** Rewrite C5 independence definition as:

> "Independent customers means distinct economic buyers capable of making independent purchase decisions. Multiple contacts from the same company, division, or controlled affiliate do not satisfy independence regardless of domain or organizational separation. Customers who responded to a Nebula-authored request (content, event, direct outreach, survey) about the specific problem are not independent for this criterion — they are a prompted cohort. Independence requires the customer to have described the problem without Nebula initiating the inquiry."

---

### Correction R4 (P0): Archive of aspirational docs is not committed

**Problem:** The `.legacy/` directory is gitignored. The archive note and SUPERSEDED banners are not part of the committed repository. A future operator cloning the repository without the submodule will see `system_setup/` as a pointer to an old commit with no supersession notice.

**Required correction:** Add explicit supersession notices to `AGENTS.md` and `CLAUDE.md` in the parent repository identifying `system_setup/GOVERNANCE_POLICIES.md` and `system_setup/PROVENANCE_SYSTEM.md` as superseded by `docs/governance/`. This is tracked in the parent repository and visible without submodule checkout.

---

## 13. Recommended Implementation Controls

Minimum CI enforcement that meaningfully converts documentary controls to operative ones. Listed in priority order.

**I1 (closes G7, P0-adjacent):** `claim-expiry.test.ts` — parse CLAIM_REGISTER.md, fail on past-dated active claims. Section-aware parser required.

**I2 (closes A19, P0):** Add `observatory_status` field to `evidence.yaml` schema. Add test to `citable-proof-integrity.test.ts` or new `observatory-authoring-gate.test.ts` that rejects Observatory content without `observatory_status: publishing_authorized` on the backing evidence entry.

**I3 (closes A26, P0-adjacent):** Test that cross-checks `public-facts.ts` offer keys against gate records in `commercialization-gates.md`. If a new offer key appears in `publicFacts`, a PASS gate record for a matching `opportunity_id` must exist. Note: this requires the gate decisions section to be machine-parseable, which the current YAML block format supports.

**I4 (evidence reference integrity):** Test that `citable_signal_ids` and `demand_signal_ids` in gate records refer to IDs that exist in their respective registries. Currently free-text strings with no cross-reference validation.

**I5 (PII scan):** Test that `customer-demand-signals.jsonl` entries do not contain email patterns or obvious company names. A simple regex over `pii_free_notes` and all string fields.

---

## 14. Residual Risks That Cannot Reasonably Be Eliminated

**RR1:** A founder who is both assessor and approver can write optimistic gate determinations. Git history is the only accountability mechanism. Unresolvable at current organizational scale; flag for reassessment when a second authority is added.

**RR2:** Evidence can become stale after a gate record is written. No mechanism forces re-assessment when source evidence changes. The `measurement_period` field provides partial documentation but no automated staleness check.

**RR3:** The gap between "demand pattern observed" (C5 PASS) and "customers will pay" (genuine commercial demand) is not measurable until a customer is actually asked to pay. The gate system documents readiness for commercial investigation, not commercial success. This is inherent to pre-commercial governance and cannot be resolved.

**RR4:** The `observatory-boundary.md` adverse result obligation is aspirational. An operator who fails to record adverse results faces no CI consequence today. I2 partially addresses this for new Observatory content; historical adverse results require good faith.

**RR5:** Convergence independence is self-assessed. An operator who genuinely believes two signals are independent but is wrong cannot be detected by any automated mechanism.

---

## 15. Recommendation

**CONDITIONAL GO.**

The core architecture is correct. The three-layer separation model, the seven gate criteria, the fail-closed evidence vocabulary, and the reuse of existing controls are all sound. The system does not create unnecessary bureaucracy. A competent operator reading the documents can understand the intent.

**Four corrections required before implementation begins (R1-R4 above).**

None of the four corrections require a new file. Two are one-paragraph additions to existing documents. Two require adding `observatory_status` to a schema and updating one incorrect claim in `observatory-boundary.md`.

**After corrections, proceed to implementation with controls I1-I5 in the order listed.**

The system will be genuine governance — not compliance theater — once I1 and I2 are implemented. I1 closes the only currently-exploitable P0 that touches existing production claims. I2 closes the primary observatory boundary enforcement gap.

The demand-threshold corrections (R3) are the most important substantive design change. Without them, three contacts from one company or three responses to a Nebula-authored prompt can satisfy the C5 PASS threshold. This is the most likely real-world path to a motivated bypass.

---

*No production code modified. No design artifacts modified. No tests implemented. Review only.*
