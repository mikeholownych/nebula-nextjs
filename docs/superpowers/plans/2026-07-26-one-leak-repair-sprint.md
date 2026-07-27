# One-Leak Repair Sprint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut over the live $97 paid offer from a DIY prompt pack to one bounded, implementation-controlled repair with honest evidence boundaries and manual-first fulfillment.

**Architecture:** Keep Stripe pricing and the internal `fix-pack` key stable. Centralize the buyer-facing offer in `app/lib/repair-sprint-offer.ts`, project it across application surfaces, replace automatic prompt-pack execution with a manual kickoff alert, and use a version-controlled evidence template until paid loops validate a durable order schema.

**Tech Stack:** Next.js 16, React 19, TypeScript, Jest, Python unittest, Stripe webhooks, Playwright.

## Global Constraints

- Price is exactly `$97` through 2026-12-31.
- Stripe payment link is exactly `https://buy.stripe.com/5kQbJ1eawdj6eql1Jg43S0h`.
- Internal offer key remains `fix-pack`.
- Customer-facing name is `One-Leak Repair Sprint`.
- Scope is one landing page and one high-confidence page-level repair.
- Full redesigns, multiple pages, backend/application logic, analytics migrations, paid third-party tools, and “fix every finding” are excluded.
- Nebula promises implementation and same-scope verification, not conversion lift.
- If safe implementation is impossible, refund before work begins.
- No passwords by email; collaborator access or buyer-controlled patch handoff only.
- No outbound prospecting in this slice.
- Tests must be written and observed failing before production changes.

---

### Task 1: Canonical Offer Contract and Surface Cutover

**Files:**
- Create: `customer-portal/app/lib/repair-sprint-offer.ts`
- Create: `customer-portal/__tests__/one-leak-repair-sprint-offer.test.ts`
- Modify: `customer-portal/app/page.tsx`
- Modify: `customer-portal/app/pricing/page.tsx`
- Modify: `customer-portal/app/checkout/page.tsx`
- Modify: `customer-portal/components/WebMCP.tsx`
- Modify: `customer-portal/app/terms/page.tsx`
- Modify: `customer-portal/public/llms-full.txt`

**Interfaces:**
- Produces: `REPAIR_SPRINT_OFFER`, an immutable object containing `key`, `name`, `priceUsd`, `checkoutUrl`, `summary`, `includes`, `excludes`, and `evidenceBoundary`.
- Consumes: existing `fix-pack` checkout key and locked Stripe link.

- [ ] **Step 1: Write the failing offer-integrity test**

Create a Jest test that imports `REPAIR_SPRINT_OFFER`, reads every listed buyer-facing file, and asserts:

```ts
expect(REPAIR_SPRINT_OFFER).toMatchObject({
  key: 'fix-pack',
  name: 'One-Leak Repair Sprint',
  priceUsd: 97,
  checkoutUrl: 'https://buy.stripe.com/5kQbJ1eawdj6eql1Jg43S0h',
})
for (const text of surfaces) {
  expect(text).not.toMatch(/AI prompt pack|prompt per finding|every finding|no site access required|within minutes of payment|conversion does not improve/i)
}
expect(pricing).toContain('One-Leak Repair Sprint')
expect(pricing).toContain('one landing page')
expect(pricing).toContain('one high-confidence repair')
expect(pricing).toContain('does not promise conversion lift')
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- --runInBand __tests__/one-leak-repair-sprint-offer.test.ts`
Expected: FAIL because the canonical module is missing and legacy prompt-pack language remains.

- [ ] **Step 3: Implement the canonical contract**

Create:

```ts
export const REPAIR_SPRINT_OFFER = {
  key: 'fix-pack',
  name: 'One-Leak Repair Sprint',
  priceUsd: 97,
  checkoutUrl: 'https://buy.stripe.com/5kQbJ1eawdj6eql1Jg43S0h',
  summary: 'One landing page. One high-confidence repair. Implemented and verified by Nebula.',
  includes: [
    'Baseline evidence for the selected page condition',
    'Written scope confirmation before implementation',
    'One buyer-approved page-level repair',
    'Production verification and same-scope re-audit',
    'One additional same-scope evidence check within 30 days',
  ],
  excludes: [
    'Full redesigns or multiple pages',
    'Backend application logic or analytics migrations',
    'Paid third-party tools',
    'A promise of conversion lift',
  ],
  evidenceBoundary: 'The re-audit verifies the page condition changed; it does not by itself prove conversion lift.',
} as const
```

- [ ] **Step 4: Project the contract across all surfaces**

Use the canonical object in TSX surfaces where practical. Replace static text in `llms-full.txt` and terms with the exact same bounded scope. State that purchase confirmation is immediate and Mike confirms scope/access by email within one business day. State that collaborator access is temporary and passwords are never requested.

- [ ] **Step 5: Verify GREEN**

Run the focused Jest test, then `npm test -- --runInBand`.
Expected: focused PASS; all Jest suites PASS.

- [ ] **Step 6: Commit**

Commit message: `feat: cut over paid offer to one-leak repair sprint`

---

### Task 2: Manual-First Stripe Fulfillment

**Files:**
- Modify: `customer-portal/__tests__/stripe-webhook-fulfillment-gate.test.ts`
- Modify: `customer-portal/app/api/webhooks/stripe/route.ts`
- Modify: `customer-portal/app/api/checkout/route.ts`

**Interfaces:**
- Consumes: Stripe `checkout.session.completed`, existing `purchases` persistence, live-sale Telegram alert.
- Produces: a `REPAIR SPRINT KICKOFF REQUIRED` alert for exact $97 live purchases; no prompt-pack subprocess.

- [ ] **Step 1: Rewrite the exact-price test first**

For a live paid 9700-cent checkout, assert that no `deliver_prompt_pack.py` command is executed and that `hermes send` receives an alert containing:

```text
REPAIR SPRINT KICKOFF REQUIRED
$97.00
buyer@example.com
cs_live_test
```

Retain the tests proving $7 and $1,497 purchases do not enter repair-sprint fulfillment.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --runInBand __tests__/stripe-webhook-fulfillment-gate.test.ts`
Expected: FAIL because the webhook still executes `deliver_prompt_pack.py`.

- [ ] **Step 3: Remove automatic prompt-pack execution**

Delete `deliverPromptPack()` and its exact-price invocation. Preserve purchase persistence. For exact $97 live purchases, send the manual kickoff alert. Keep other live sale alerts unchanged. Update checkout analytics offer name to `One-Leak Repair Sprint` while preserving key `fix-pack`.

- [ ] **Step 4: Verify GREEN**

Run the focused webhook suite, then the full Jest suite.
Expected: all PASS and no test observes a Python fulfillment call.

- [ ] **Step 5: Commit**

Commit message: `fix: route repair sprint sales to manual kickoff`

---

### Task 3: Manual Evidence Packet and Visible Integrity Repair

**Files:**
- Create: `operations/repair-sprint/EVIDENCE_PACKET_TEMPLATE.md`
- Create: `customer-portal/__tests__/homepage-evidence-consistency.test.ts`
- Modify: `customer-portal/app/page.tsx`

**Interfaces:**
- Produces: a manual evidence record schema and one canonical visible self-audit score.

- [ ] **Step 1: Write the failing homepage consistency test**

Read `app/page.tsx`, extract every `/10` self-audit score associated with Nebula, and assert there is exactly one unique score.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --runInBand __tests__/homepage-evidence-consistency.test.ts`
Expected: FAIL with both `7.1` and `7.4` present.

- [ ] **Step 3: Make the self-score internally consistent**

Use the currently enumerated nine homepage dimensions as the source; keep the displayed score already attached to that list and replace the stale narrative score with the same value. Do not claim causation or client outcomes.

- [ ] **Step 4: Create the evidence template**

The template must contain required fields for repair ID, purchase/session ID, private contact reference, URL, audit engine version, baseline timestamp, screenshots, exact observed condition, scope, exclusions, buyer approval, collaborator-access method, implementation diff, deployment timestamp, same-scope re-audit, buyer-supplied outcome data, measurement window, confounds, consent mode, and claim boundary. Include explicit labels: `page-condition evidence`, `business-outcome evidence`, and `not measured`.

- [ ] **Step 5: Verify GREEN**

Run the focused test and full Jest suite.
Expected: all PASS.

- [ ] **Step 6: Commit**

Commit message: `feat: add repair sprint evidence packet`

---

### Task 4: Release Verification

**Files:**
- Modify only if a verification defect requires a focused TDD fix.

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: build/test proof and rendered screenshots; no deployment until all gates pass.

- [ ] **Step 1: Static quality gates**

Run:

```bash
npm run typecheck
npm run lint
npm test -- --runInBand
npm run build
```

Expected: all exit 0.

- [ ] **Step 2: Content-integrity gates**

Scan changed TSX/text files for block/control characters, forbidden Tailwind warning classes, obsolete prompt-pack language, unsupported guarantees, `$147`, and implementation of every finding. Expected: zero findings except documented historical/archive files outside changed public surfaces.

- [ ] **Step 3: Rendered verification**

Start the production build on an unused port and use Playwright at desktop and 390px mobile widths. Verify `/pricing` and `/checkout` visibly show `$97`, `One-Leak Repair Sprint`, one-page/one-repair scope, evidence boundary, secure checkout CTA, no horizontal overflow, and no browser-console errors.

- [ ] **Step 4: Independent review**

Review the full branch diff for offer drift, unsupported claims, fulfillment regressions, security/privacy concerns, and accidental changes beyond scope. Fix Critical/Important findings with focused tests and re-review.

- [ ] **Step 5: Commit any verification fixes**

Commit message: `fix: close repair sprint release findings`

- [ ] **Step 6: Finish branch**

Report exact commits, files, commands/results, proof boundaries, worktree state, and deployment decision. Production deployment requires synchronizing this clean branch without overwriting the unrelated dirty worktree.
