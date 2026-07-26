# Landing Page Intelligence Stack User Stories

## Story US-1: Inspect and download the methodology

As a founder sending paid traffic to a weak landing page, I can inspect six bounded checks and download them without giving Nebula personal information.

### Acceptance criteria

- The public page contains exactly one H1.
- Six workflow names and their output artifacts are visible.
- The download is a direct, same-origin ZIP link.
- No email field or lead-capture form exists.
- The archive contains only files declared in its manifest.
- The copy contains no unsupported outcome or adoption claims.

## Story US-2: Escalate to a live diagnosis

As a founder who wants the workflows applied to a page, I can move from the resource page to Nebula's existing live audit without entering another funnel.

### Acceptance criteria

- A visible secondary CTA points to `/audit`.
- The CTA is keyboard accessible and has a visible focus treatment.
- Navigation succeeds in rendered desktop and mobile browser tests.
- Existing audit scoring, delivery, lead state, and payment behavior are unchanged.

## Persona

**Primary:** A founder or solo operator already paying for ad traffic and trying to diagnose why the landing page does not convert.

**Operating constraint:** They may have only public page evidence. The workflows must label missing inputs as `not_testable` rather than inventing conclusions.

## Traceability

- US-1 maps to implementation Tasks 1 and 2.
- US-2 maps to implementation Tasks 2 and 3.
- Release and independent verification for both stories are covered by Task 4.
