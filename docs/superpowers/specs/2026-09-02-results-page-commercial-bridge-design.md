# Results Page Commercial Bridge Design

Date: 2026-09-02
Status: Proposed for review
Scope: `/audit/[id]/results` only

## Objective

Make the existing results page create a credible reason to buy the `$97 One-Leak Repair Sprint` after the visitor understands the first measured finding.

The page must sell the value of a bounded repair artifact, not claim that a failed condition caused a known amount of lost revenue or that the repair will produce conversion lift.

## Non-goals

- No homepage changes.
- No changes to the audit score, condition registry, thresholds, evidence model, or determination semantics.
- No new signals, benchmarks, testimonials, guarantees, scarcity, or outcome claims.
- No change to the checkout price or Stripe product.
- No redesign of the overall results-page information architecture.

## Design principles

1. Recognition before offer. The finding should describe the visitor's experience before presenting the product.
2. Evidence before interpretation. Preserve the existing observed value, threshold, selector, condition ID, version, and determination.
3. Artifact before price. Show what the buyer receives before asking them to pay.
4. Verification after repair. Position the re-audit as a check for whether the same condition changed, not proof of conversion impact.
5. One decision. Use one canonical CTA: `Get the repair: $97`.

## Proposed flow

### 1. Finding recognition

Keep the existing finding and evidence object, but present it in this order:

- Visitor-facing recognition sentence from the finding.
- Named structural condition.
- `Observed` value.
- `Threshold` value when available.
- Selector or source evidence when available.
- Explicit determination label.

The recognition sentence must remain grounded in the finding data. It must not imply an observed conversion loss unless the system has direct evidence for that claim.

### 2. Repair artifact preview

Replace generic remediation framing with an explicit delivery preview:

- `What you receive`
- The selected condition being addressed.
- The exact artifact type: copy, code, or configuration, based on `isExactArtifact`.
- A page-specific preview only when the artifact is real.
- If no exact artifact exists, label it `Recommended change` and describe the bounded scope without calling it exact or ready to paste.
- Placement or implementation context when available.
- One same-condition re-audit within 30 days.

The implementation must not manufacture a copy, code block, or configuration artifact merely to improve conversion framing.

### 3. Commercial bridge

Use a short three-step sequence immediately before the CTA:

```text
Observed on your page
One scoped repair artifact
Same-condition re-audit
```

Supporting copy should state that the sprint turns one selected finding into a page-specific repair package. It should not state or imply guaranteed conversion improvement.

The CTA remains:

```text
Get the repair: $97
```

The existing Stripe form, audit ID, offer key, and locked-state behavior remain unchanged.

### 4. CTA placements

Use the same CTA at three decision points where the data is already understood:

- After the first priority finding and artifact preview.
- After the repair scope and verification explanation.
- At the end of the remediation section.

Avoid competing action labels such as `Stop the leak`, `Fix this now`, or different price language.

## Component boundaries

Primary file:

- `customer-portal/app/audit/[id]/results/ResultsClient.tsx`

Likely bounded edits:

- `ImmediateRepairOffer`
- Remediation copy surrounding the selected finding
- Existing CTA placements that currently point to the same repair offer

Do not alter:

- `auditResultSchema.ts`
- `conditionLineage.ts`
- Score calculation or finding prioritization
- Homepage components
- Public offer facts

## Instrumentation

Preserve existing funnel events and add placement context only if the event schema already supports it. Any new event must distinguish:

- `audit_id`
- `offer_key`
- `placement`
- `unlocked`
- `condition_id` when available

The success metric is not click volume. The meaningful downstream signal is payment completion attributable to the results-page CTA. Until payment data exists, the change is an instrumented conversion hypothesis, not a proven lift.

## Validation plan

Before implementation:

- Confirm current results-page copy and CTA locations.
- Confirm exact-artifact gating remains intact.
- Confirm no homepage files are modified.

After implementation:

- Run TypeScript, lint, content and claim guards.
- Run focused results-page tests and the full unit suite.
- Run the mandatory E2E suite.
- Deploy only through `scripts/deploy_customer_portal.sh` if all gates pass.
- Verify live HTTP 200 for `/`, `/audit`, and a results route.
- Verify rendered HTML contains the canonical CTA and does not contain banned causal or scarcity language.
- Verify the Next.js journal after restart has no new errors.
- Record payment and CTA instrumentation state separately. Do not claim conversion improvement without a purchase comparison.

## Risks and mitigations

- Risk: Recognition language overstates the finding. Mitigation: derive it from measured evidence and preserve explicit uncertainty.
- Risk: The artifact preview becomes generic advice. Mitigation: enforce `isExactArtifact` and use `Recommended change` otherwise.
- Risk: More CTAs create pressure or clutter. Mitigation: reuse one label and place it only at comprehension boundaries.
- Risk: The change contaminates the frozen baseline. Mitigation: results-page-only scope, no homepage edits, and commit diff review before deploy.
