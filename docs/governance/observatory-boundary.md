# Observatory Boundary

**Status:** Active  
**Established:** 2026-09-01  
**Authority:** `docs/governance/opportunity-governance.md`

---

## What the Observatory Is

The Observatory is the public evidentiary and educational surface for the capabilities Nebula currently commercializes. Its purpose is to make Nebula's evidence visible, honest about its limits, and verifiable.

The Observatory is NOT:

- A public roadmap for future Nebula capabilities.
- A demonstration of Citable's full capability set.
- A signal that any Citable-observable condition will become a commercial Nebula Component.
- A forward-looking research publication.

---

## Scope: Covered Capabilities

The Observatory's present disclosure obligation is limited to:

**Nebula currently commercializes:**

1. Landing page conversion signal detection (9 signals, paid-traffic-specific)
2. Evidence-backed findings delivery (finding_events, audit provenance)
3. One-Leak Repair Sprint ($97, customer-implemented, 30-day re-audit)

Any capability that Nebula does not currently commercialize is outside the Observatory's disclosure scope. Citable may observe conditions related to capabilities Nebula has not commercialized; those observations live in `.citable/` and are not required to appear on the Observatory.

---

## Disclosure Obligations

### For commercialized capabilities, the Observatory must:

1. **Present evidence accurately.** The evidence state of any published finding is the state documented in `customer-portal/.citable/evidence.yaml` at publication time.

2. **Disclose adverse, inconclusive, INCOMPARABLE, and NOT ESTABLISHED results.** When Nebula has investigated a claim and found it does not hold, that result must not be hidden merely because it is commercially inconvenient. Document it in `CLAIM_REGISTER.md` under Excluded Claims.

3. **Never imply conversion causality without SOP-005-level evidence.** Auditing a condition and finding it changed (FAIL to PASS) is observable. Claiming that change caused a conversion lift requires SOP-005 outcome evidence with a documented confounder analysis and customer confirmation.

4. **Never fabricate a denominator.** All quantitative Observatory claims must cite a `DatasetRecord` from `app/lib/datasets.ts`. The dataset must have a scope, collection window, and provenance. Live aggregates must use `sampleSize: null`.

5. **Use the correct epistemic label for each statement:**

   | Statement type | Label |
   |---|---|
   | Deterministic observation (measured from page HTML/CSS/DOM) | "We measured" / "observed" |
   | Evidence-backed semantic finding | "We found" + evidence reference |
   | Probabilistic inference | "This suggests" / "this may indicate" |
   | Strategic hypothesis | "Our hypothesis is" — not presented as fact |
   | NOT ESTABLISHED | Explicitly stated as not established |

### For non-commercialized capabilities, the Observatory must NOT:

- Publish findings about a capability Nebula has not decided to commercialize.
- Imply that Citable observing a condition means Nebula can address it commercially.
- Use Observatory publication to test market demand. That belongs in the customer demand signal log and a bounded validation experiment.

---

## Observatory Authoring Gate

Before a new Observatory entry is authored:

1. The capability must have COMMERCIALIZED status in `docs/governance/commercialization-gates.md`.
2. An ADR must exist (`docs/adr/`) recording the commercialization decision.
3. The `observatory_status` field in the corresponding evidence entry in `customer-portal/.citable/evidence.yaml` must be set to `publishing_authorized`.

**`observatory_status` field definition:**

This field is added to the `evidence.yaml` schema as an optional field on any entry that may be referenced by Observatory content.

| Value | Meaning |
|---|---|
| `not_applicable` | This evidence entry is for Citable purposes only and will not appear on the Observatory. Default for Citable-sourced entries. |
| `publishing_authorized` | Mike (founder) has authorized Observatory publication of this capability, a PASS gate record exists, and an ADR has been committed. |

An evidence entry without `observatory_status` defaults to `not_applicable`. An entry must be explicitly set to `publishing_authorized` before Observatory content referencing it can be published.

**Enforcement status:**

- **DOCUMENTED OBLIGATION:** The rule remains a policy obligation for operators.
- **MACHINE-ENFORCED (I2):** `npm run check:opportunity-governance` resolves the canonical Observatory source registry used by `app/observatory/page.tsx`, rejects empty or unresolved production bindings, and fails when a governed source lacks `publishing_authorized`, has an invalid evidence state, or cannot resolve. `observatory_status` is an additional gate, not a bypass.

The `citable-proof-integrity.test.ts` test continues to enforce case-study governance via the compile script mechanism. I2 is implemented in the dedicated governance checker and its focused Jest fixtures.

---

## Adverse and Inconclusive Result Handling

If Nebula has investigated a claim and the result is:

- **Adverse** (the intervention did not work as hypothesized)
- **Inconclusive** (evidence is insufficient to confirm or deny)
- **INCOMPARABLE** (conditions could not be meaningfully compared)
- **NOT ESTABLISHED** (the relationship was not established in the study)

The result must be:

1. Recorded in the `CLAIM_REGISTER.md` exclusion log with reason code `adverse_result`, `inconclusive`, `incomparable`, or `not_established`.
2. Not hidden, not marked as a draft indefinitely, and not buried in a footnote.
3. If the adverse result relates to a live claim, that claim must be reviewed and updated or expired.

This is the accountability mechanism. The Observatory's credibility rests on it.

---

## Boundary Violations to Watch For

The following are boundary violations that must not occur:

| Pattern | Why it violates the boundary |
|---|---|
| Publishing a Citable detector capability as "what Nebula checks" without a commercialization decision | Implies commercialization that has not been authorized |
| Stating "our audits show X% of pages fail Y" without a declared dataset with scope and window | Fabricated or undeclared denominator |
| Publishing a before/after comparison without SOP-005 evidence | Implies conversion causality without evidence |
| Omitting that a condition was found NOT ESTABLISHED | Adverse result hidden |
| Describing a "coming soon" capability on a public surface | Observatory is not a roadmap |
| Publishing a case study without `publicationPermission.granted: true` in the record | Unauthorized use of customer identity |

---

*This document is reviewed whenever a new capability is advanced to COMMERCIALIZED. If the commercialization decision changes, the disclosure obligations change with it.*
