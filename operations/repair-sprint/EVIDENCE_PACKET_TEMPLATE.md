# One-Leak Repair Sprint Evidence Packet

> Copy this template for each paid sprint. Preserve completed packets as versioned evidence records. Do not put passwords, access tokens, analytics exports, or other secrets in this file.

## Record Control

- **Repair ID:** `repair-YYYYMMDD-NNN`
- **Record status:** `draft | scoped | approved | implemented | verified | outcome-eligible | closed`
- **Created at (UTC):**
- **Last updated at (UTC):**
- **Owner:**
- **Stripe session ID:**
- **Private contact reference:** `Operational ledger reference only; do not duplicate email here`
- **Audited URL:**
- **Audit run ID:**
- **Audit engine/version:**

## Consent and Privacy

- **Evidence retention consent:** `private-only | anonymous aggregate | anonymous artifact | named artifact`
- **Consent captured at:**
- **Consent source/reference:**
- **Named publication approved:** `yes | no`
- **Buyer may revoke future publication:** `yes`
- **Secrets excluded from this record:** `confirmed | not confirmed`

## Baseline — Page-Condition Evidence

- **Baseline timestamp (UTC):**
- **Production URL/version:**
- **Viewport/device:**
- **Screenshot paths or evidence IDs:**
- **DOM/network evidence IDs:**
- **Observed condition:**
- **Why this condition was selected:**
- **Confidence:** `high | medium | low`
- **Known uncertainty:**

## Repair Scope

- **Single repair statement:**
- **Exact page element/selectors:**
- **Included work:**
- **Explicit exclusions:**
- **Expected proximal page condition:**
- **What this repair does not promise:** `Conversion lift is not guaranteed.`
- **Buyer approval timestamp (UTC):**
- **Approval source/reference:**

## Access and Change Control

- **Access method:** `temporary collaborator role | buyer-controlled patch handoff`
- **Platform/repository:**
- **Password received:** `must be no`
- **Rollback method:**
- **Access removal owner:**
- **Access removal verified at (UTC):**

## Implementation

- **Implementation started at (UTC):**
- **Files/elements changed:**
- **Exact diff or commit reference:**
- **Automated checks:**
- **Manual checks:**
- **Rollback exercised or validated:**

## Production Verification — Page-Condition Evidence

- **Deployment timestamp (UTC):**
- **Production version/commit:**
- **Desktop rendered check:** `pass | fail | not measured`
- **390px mobile rendered check:** `pass | fail | not measured`
- **Accessibility check:** `pass | fail | not measured`
- **Console/network check:** `pass | fail | not measured`
- **Post-deploy screenshot/evidence IDs:**
- **Same-scope re-audit run ID:**
- **Baseline condition changed:** `yes | no | inconclusive`
- **Remaining page-condition uncertainty:**

## Business-Outcome Evidence

- **Status:** `measured | not measured | insufficient data`
- **Metric:**
- **Buyer-supplied data reference:**
- **Baseline window:**
- **Post-change window:**
- **Traffic/sample size:**
- **Material campaign, audience, offer, or tracking changes:**
- **Observed result:**
- **Causal claim allowed:** `no unless an approved analysis below supports it`
- **Interpretation and limitations:**

## 30-Day Same-Scope Evidence Check

- **Requested at (UTC):**
- **Completed at (UTC):**
- **Audit engine/version:**
- **Same URL and selector confirmed:** `yes | no`
- **Page-condition result:**
- **Business-outcome status:** `measured | not measured | insufficient data`
- **New confounds:**

## Claim Boundary

Classify every deliverable statement before publication:

- **Page-condition evidence:** Directly observed page state, implementation diff, production verification, or same-scope audit result.
- **Business-outcome evidence:** Buyer-supplied metric with documented window, sample size, and confounds.
- **Not measured:** Any outcome without adequate source data.

**Approved public statement:**

**Statements explicitly prohibited:**

- Do not call a preview an implemented outcome.
- Do not equate a better audit score with conversion lift.
- Do not claim causation from a simple before/after observation.
- Do not publish private contact, credential, or analytics-level data.

## Closeout

- **Evidence packet delivered at (UTC):**
- **Buyer acknowledgement:**
- **Publication artifact URL (if approved):**
- **Repair status:** `verified | closed-refunded | closed-unimplemented`
- **Final proof boundary:**
