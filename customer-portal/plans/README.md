# Animation plans

| # | Title | Severity | Status |
| --- | --- | --- | --- |
| 001 | [Animate the processing→ready Card swap](001-processing-ready-swap.md) | MEDIUM | DONE |

## Execution order

Single plan, no dependencies. Run 001 on its own with
`improve-animations execute 001-processing-ready-swap.md` (or hand
`plans/001-processing-ready-swap.md` to any agent directly) - it touches
one file (`app/audit/[id]/processing/page.tsx`) and requires no changes
elsewhere.

## Also implemented (no separate plan file - specs were already precise from the originating sweep)

These came out of the same `find-animation-opportunities` sweep as plan 001,
each gated the same way (purpose/frequency/speed/function) before landing:

- `components/ui/Button.tsx` + `app/audit/AuditForm.tsx` - `:active` press
  feedback (`scale(0.97)`, 160ms `ease-out`) on the shared Button component
  and the audit-form submit CTA.
- `app/audit/AuditForm.tsx` - URL-validation error message now expands in
  via `grid-template-rows` (200ms) + opacity fade (150ms) instead of
  teleporting in/out.
- `components/SiteNav.tsx` - mobile nav `<details>` panel now scales/fades
  in from its trigger (`transform-origin: top right`, 200ms `ease-out`)
  instead of snapping open.
- `app/audit/[id]/results/ResultsClient.tsx` - the per-finding evidence
  `<details>` disclosure now expands via the same `grid-template-rows`
  technique as the form error, instead of snapping open.
- `app/components/CookieConsent.tsx` - dismiss now slides/fades out
  (`translateY(100%)` + opacity, 300ms) instead of an instant `hidden = true`
  cut, with a `setTimeout` backstop so the banner can never get stuck
  visible-but-dismissed if `transitionend` doesn't fire.

Verified against a real production build (`npm run build` + `next start`)
via a throwaway Playwright script (not committed) driving Chromium: mobile
nav open/close, button/CTA press transforms, the animated error reveal, and
cookie-consent dismiss (including under `prefers-reduced-motion: reduce`)
all confirmed working end-to-end.
