# Results Page Commercial Bridge Implementation Plan

> **For agentic workers:** Use the executing-plans skill to implement this plan task-by-task with verification checkpoints.

**Goal:** Make `/audit/[id]/results` present the first measured finding, the bounded repair artifact, and same-condition verification as one credible purchase path for the existing `$97 One-Leak Repair Sprint`.

**Architecture:** Keep the audit result schema, condition lineage, score, prioritization, checkout form, and locked-state behavior unchanged. Refine the existing `ImmediateRepairOffer` presentation and add small pure formatting helpers only where needed. All buyer-facing language remains conditional and evidence-led.

**Tech Stack:** Next.js 16, React, TypeScript, Tailwind CSS, Jest, Playwright, existing Nebula content and claim guards.

## Global Constraints

- Scope is `/audit/[id]/results` and focused tests only.
- Do not modify the homepage or public offer facts.
- Do not change audit scoring, thresholds, condition IDs, versions, determination semantics, or finding prioritization.
- Do not add fabricated testimonials, benchmarks, guarantees, scarcity, ROI, or conversion-lift claims.
- `Exact Fix` and `ready to paste` remain conditional on `isExactArtifact`.
- Use the canonical CTA `Get the repair: $97`.
- Re-audit language must describe whether the same condition changed, not whether a fix held or conversion improved.
- No em-dashes in shipped content.
- Preserve existing funnel events and checkout fields.
- Deploy only through `scripts/deploy_customer_portal.sh` after all gates pass.

---

### Task 1: Add focused contract tests for the commercial bridge

**Blocks:** none (can start immediately)
**Demoable:** Tests prove the first finding, artifact label, verification language, and canonical CTA contract without rendering unrelated surfaces.

**Files:**
- Modify: `customer-portal/__tests__/results-page-commercial-bridge.test.ts` or the existing closest results-page unit test file after locating it.
- Test: same file.

**Interfaces:**
- Consumes: the current result-page copy constants and `ImmediateRepairOffer` behavior.
- Produces: executable assertions for the approved commercial bridge contract.

- [ ] **Step 1: Locate the existing results-page test harness and constants**

Run:

```bash
cd /home/mike/nebula/customer-portal
find __tests__ -maxdepth 2 -type f | sort | grep -E 'result|audit|repair'
grep -n "REPAIR_CTA\|ImmediateRepairOffer\|isExactArtifact" app/audit/\[id\]/results/ResultsClient.tsx
```

Use the existing test conventions. Do not create duplicate helpers if an established renderer or constants test already exists.

- [ ] **Step 2: Write the first failing behavioral assertion**

Assert that the rendered repair offer contains all of these strings for an unlocked result with a real exact artifact:

```text
What you receive
Observed on your page
One scoped repair artifact
Same-condition re-audit
Get the repair: $97
```

Also assert that the same rendered output does not contain:

```text
Stop the leak
fix held
conversion lift guaranteed
```

Use a representative result fixture with `condition_id`, `condition_version`, `evidence.measured`, `evidence.required`, and a real artifact that satisfies the existing `isExactArtifact` predicate.

- [ ] **Step 3: Run the focused test and verify RED**

Run:

```bash
npm test -- --runInBand __tests__/results-page-commercial-bridge.test.ts
```

Expected: the new assertion fails because the approved three-step and delivery-preview copy is not yet present.

- [ ] **Step 4: Add the edge-case assertion**

Add a second test using a non-exact generic fix. Assert that it renders `Recommended change` and does not render `Exact artifact` or `ready to paste`.

- [ ] **Step 5: Run the focused test again**

Expected: both tests fail only on the missing commercial bridge behavior, not because of fixture or harness errors.

---

### Task 2: Implement the evidence-led commercial bridge

**Blocks:** Task 1
**Demoable:** The unlocked results page shows a recognition-first finding, tangible delivery scope, observed → repair → re-audit sequence, and one canonical CTA while preserving the existing checkout path.

**Files:**
- Modify: `customer-portal/app/audit/[id]/results/ResultsClient.tsx`
- Test: `customer-portal/__tests__/results-page-commercial-bridge.test.ts`

**Interfaces:**
- Consumes: `results.findings`, `isExactArtifact`, `conditionIdFor`, `conditionVersionFor`, `REPAIR_CTA`, `REPAIR_SPRINT_OFFER`, and the existing checkout form.
- Produces: unchanged checkout submission fields plus the approved rendered commercial bridge.

- [ ] **Step 1: Add the delivery-preview block inside `ImmediateRepairOffer`**

After the selected finding evidence and before the checkout form, render a bounded section with this semantic content:

```tsx
<div>
  <p>What you receive</p>
  <ul>
    <li>One scoped repair for this selected condition.</li>
    <li>{isExactArtifact(worst.fix) ? 'A page-specific copy, code, or configuration artifact.' : 'A page-specific recommended change for this condition.'}</li>
    <li>One same-condition re-audit within 30 days.</li>
  </ul>
</div>
```

Use existing design tokens and component conventions. Do not introduce a new card grid or decorative visual system.

- [ ] **Step 2: Add the three-step bridge**

Render a simple ordered sequence immediately before the CTA column:

```text
Observed on your page
One scoped repair artifact
Same-condition re-audit
```

The sequence must not imply that the repair guarantees a conversion result.

- [ ] **Step 3: Preserve exact-artifact semantics**

Keep the existing conditional label:

```tsx
{isExactArtifact(worst.fix) ? 'Exact artifact' : 'Recommended change'}
```

If the artifact is not exact, do not use `Exact Fix`, `ready to paste`, or equivalent language anywhere in the new bridge.

- [ ] **Step 4: Keep the CTA and form contract unchanged**

The unlocked form must continue to submit:

```tsx
<input type="hidden" name="auditId" value={auditId} />
<input type="hidden" name="offerKey" value={REPAIR_SPRINT_OFFER.key} />
```

The button text must remain the existing canonical `REPAIR_CTA`, whose rendered value is `Get the repair: $97`. Do not change the locked-state `Unlock this audit first` behavior.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```bash
npm test -- --runInBand __tests__/results-page-commercial-bridge.test.ts
```

Expected: all focused commercial-bridge assertions pass.

- [ ] **Step 6: Run content and banned-language checks**

Run:

```bash
npm run check:content
npm run check:claims
node scripts/check-banned-strings.mjs
```

Expected: all commands exit 0 and no em-dash or unsupported causal/commercial language is reported.

- [ ] **Step 7: Review scope before committing**

Run:

```bash
git diff --stat
git diff -- customer-portal/app/audit/'[id]'/results/ResultsClient.tsx customer-portal/__tests__/results-page-commercial-bridge.test.ts
git status --short
```

Confirm the diff contains no homepage, schema, score, API, pricing, or unrelated files.

- [ ] **Step 8: Commit the implementation**

```bash
git add customer-portal/app/audit/'[id]'/results/ResultsClient.tsx customer-portal/__tests__/results-page-commercial-bridge.test.ts
git commit -m "feat(results): clarify one-leak repair value"
```

---

### Task 3: Run full verification and deploy only if clean

**Blocks:** Task 2
**Demoable:** The production results surface is live with the approved bridge, or deployment is safely blocked with exact failing gates and the previous live release intact.

**Files:**
- Modify: none unless a focused verification failure requires a scoped correction.
- Test: existing portal test and E2E suites.

**Interfaces:**
- Consumes: the committed results-page implementation.
- Produces: test output, build output, deployment receipt, live HTTP and rendered-content evidence, and journal evidence.

- [ ] **Step 1: Run the full portal CI gate**

Run:

```bash
cd /home/mike/nebula/customer-portal
npm run ci
```

Expected: typecheck, lint, content guards, unit tests, build, and E2E all pass. If an unrelated known baseline failure blocks the deploy script, do not bypass the production deploy gate.

- [ ] **Step 2: Deploy through the atomic script**

Run from `/home/mike/nebula` only if Step 1 is clean:

```bash
bash scripts/deploy_customer_portal.sh
```

Expected: incoming build rehearsal passes, `nebula-nextjs.service` swaps successfully, production verification passes, and cache purge completes or reports its exact warning.

- [ ] **Step 3: Verify live blast radius**

Run:

```bash
for path in / /audit; do
  curl -fsS -o "/tmp/nebula${path//\//_}.html" -w "$path %{http_code}\n" "https://nebulacomponents.com$path"
done
curl -fsS -o /tmp/nebula-results-probe.html -w "/audit/[id]/results probe %{http_code}\n" https://nebulacomponents.com/audit/sample
```

Use the specific unlocked production audit URL captured during the deploy verification run for the results-surface probe. Verify homepage, audit, and the results surface all return HTTP 200.

- [ ] **Step 4: Verify rendered strings and forbidden strings**

Inspect the live HTML or browser-rendered surface and verify:

```text
Get the repair: $97
What you receive
Same-condition re-audit
```

Verify the changed results surface does not introduce `Stop the leak`, `fix held`, fake scarcity, or conversion guarantees.

- [ ] **Step 5: Verify service and logs**

Run:

```bash
systemctl is-active nebula-nextjs.service
journalctl -u nebula-nextjs.service --since "10 minutes ago" --no-pager -p err
```

Expected: service is active and no new errors are attributable to this deployment.

- [ ] **Step 6: Record the commercial interpretation**

Report CTA rendering and payment events separately. Do not call the change a conversion win until a purchase comparison exists.
