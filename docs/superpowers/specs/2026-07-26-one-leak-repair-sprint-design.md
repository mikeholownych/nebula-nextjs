# One-Leak Repair Sprint Design

**Date:** 2026-07-26
**Status:** Approved by Mike H via “proceed” after the ADHD product-gap review

## Objective

Replace the live $97 DIY prompt-pack offer with a bounded, implementation-controlled **One-Leak Repair Sprint** so Nebula owns the portion of the customer journey where value is created and can produce honest before/after evidence.

## Product contract

The $97 purchase covers:

1. One landing page already submitted to the Nebula audit.
2. One high-confidence, page-level repair selected by Nebula from the audit findings.
3. A baseline record before work starts.
4. Written scope confirmation and buyer approval.
5. Implementation by Nebula through temporary collaborator access or a buyer-approved patch/handoff path.
6. A production verification and same-scope re-audit.
7. One additional same-scope evidence check within 30 days.

The purchase does not cover a full redesign, multiple pages, backend/application logic, analytics migrations, paid third-party tools, or every audit finding. Nebula does not promise conversion lift. If the page or access path cannot support a safe bounded implementation, the buyer receives a full refund before work begins.

## Customer journey

1. Buyer runs the free audit.
2. Buyer reviews the One-Leak Repair Sprint on `/pricing` or `/checkout`.
3. Buyer pays $97 through the existing locked Stripe price/link.
4. Stripe persists the purchase and alerts Mike that a manual repair-sprint kickoff is required.
5. Mike confirms the audited URL, proposed repair, exclusions, access method, and publication consent.
6. Buyer approves the bounded repair.
7. Nebula records the baseline, implements the repair, verifies production, and re-runs the same audit scope.
8. Nebula delivers the evidence packet. Business-outcome metrics are included only when supplied by the buyer with an adequate measurement window and explicit consent.

## Architecture

Keep the existing Stripe price, payment link, and internal `fix-pack` offer key for compatibility. Introduce a canonical TypeScript offer contract for customer-facing surfaces. Remove automatic prompt-pack fulfillment from the Stripe webhook; the first customer loops are intentionally manual and begin from the existing persisted purchase plus a Telegram kickoff alert. Store the evidence procedure as a version-controlled template rather than building order-management infrastructure before validation.

## Evidence boundary

The evidence packet may prove:

- what page state was observed before work;
- what repair was approved;
- what implementation changed;
- whether the production page reflects that change;
- whether the same audit condition changed on re-audit.

It must not claim the repair caused conversion lift unless buyer-supplied outcome data, the measurement window, and material confounds are documented. Browser overrides and mockups are labelled previews, never outcomes.

## Privacy and consent

Operational purchase/contact data remains private and is used only for fulfillment. Public proof requires explicit named, anonymous, or private-only consent. Nebula retains cohort-level aggregates only unless the buyer authorizes a named artifact. Passwords must never be sent to Nebula; access uses platform collaborator roles or a buyer-controlled patch workflow.

## Compatibility constraints

- Public price remains `$97` through 2026-12-31.
- Existing Stripe price/payment link remains unchanged.
- Internal offer key remains `fix-pack`.
- Existing free audit and seven-signal framework remain unchanged.
- Existing prompt-pack script remains archived but is no longer invoked by live Stripe fulfillment.
- No outbound prospecting is part of this implementation slice.

## Acceptance criteria

- `/`, `/pricing`, `/checkout`, terms, WebMCP, and `llms-full.txt` describe the same bounded repair offer.
- Buyer-facing surfaces contain no claim that every finding is implemented, prompt packs are the paid deliverable, no site access is required, delivery occurs within minutes, or conversion improvement is guaranteed.
- Exact $97 live purchases persist normally and produce a manual kickoff alert without executing `deliver_prompt_pack.py`.
- A complete manual evidence-packet template exists.
- Homepage self-audit score is internally consistent.
- Jest, typecheck, lint, production build, focused Python tests, and rendered desktop/mobile checkout verification pass.
