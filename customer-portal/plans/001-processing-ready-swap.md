# 001 — Animate the processing→ready Card swap

- **Status**: DONE
- **Commit**: de2bb34e
- **Severity**: MEDIUM
- **Category**: Missed opportunities (Purpose & frequency: preventing a jarring change)
- **Estimated scope**: 1 file, 1 required line change (+1 optional line change)

## Problem

`app/audit/[id]/processing/page.tsx` renders two mutually-exclusive `Card`
blocks gated on `status`. When the polling interval reaches 100%, `status`
flips from `'processing'` to `'ready'` in a single React render: the
processing Card unmounts and the ready Card mounts in the same tick, with no
transition on either side. The user sees a hard cut from a progress bar to a
checkmark.

This is the single highest-emotion moment in the audit funnel — "your audit
is done," seen exactly once per audit — and it currently gets zero motion
budget.

Current code:

```tsx
// app/audit/[id]/processing/page.tsx:107-131 — processing state, unmounts instantly
{status === 'processing' && (
  <Card variant="elevated" className="text-center">
    <h1 className="mb-6 text-2xl font-bold text-fg">
      Analyzing Your Page
    </h1>
    {/* Progress Bar */}
    <div className="mb-6">
      <div className="h-3 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full w-full origin-left rounded-full bg-accent transition-transform duration-1000 ease-linear"
          style={{ transform: `scaleX(${progress / 100})` }}
        />
      </div>
      <p className="mt-2 text-sm text-fg-muted">{Math.round(progress)}% complete</p>
    </div>
    {/* Status Message */}
    <div className="min-h-[2rem]">
      <p className="text-lg text-fg animate-pulse">
        {STATUS_MESSAGES[messageIndex].message}
      </p>
    </div>
  </Card>
)}

{status === 'ready' && (
  <Card variant="elevated" className="vt-audit-card text-center">
    <div className="mb-4 text-5xl">✓</div>
    <h1 className="mb-2 text-2xl font-bold text-fg">
      Your Audit Is Ready
    </h1>
    <p className="mb-6 text-fg-muted">
      Enter your email to receive the full detailed report
    </p>
    ...
  </Card>
)}
```

The `vt-audit-card` class (`app/globals.css:1060-1067`) already gives this
same Card a `view-transition-name` for the later *route* change
(processing → `/results`), but that only fires on navigation via
`pushWithViewTransition`. It does nothing for the in-page `status` flip —
that swap is a plain conditional render with no motion at all.

## Target

Reuse the repo's existing `finding-reveal` keyframe (already defined,
already used elsewhere for exactly this "content appears, don't let it
teleport" case) on the ready-state Card, instead of introducing any new
animation, easing, or duration:

```tsx
// app/audit/[id]/processing/page.tsx:134 — target
<Card variant="elevated" className="vt-audit-card finding-reveal text-center">
```

That's the entire required fix. `finding-reveal` is defined at
`app/globals.css:1069-1082`:

```css
@keyframes finding-reveal {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
.finding-reveal {
  animation: finding-reveal 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
}
```

`animation-fill-mode: both` means the Card starts at `opacity: 0` the
instant it mounts (no flash-then-animate), then eases up into place over
420ms. No new CSS is required — do not add a new keyframe or duration.

### Optional (nice-to-have, same file, do only if Step 1 lands cleanly)

The checkmark is the one truly rare/high-emotion element on this screen —
AUDIT.md category 8 explicitly allows spending extra delight budget on
rare, high-emotion moments. Give it a beat of its own by delaying it
slightly past the card's entrance, reusing the same class and the exact
stagger pattern already established in `ResultsClient.tsx:696`
(`style={{ animationDelay: ... }}` on a `finding-reveal` element):

```tsx
// app/audit/[id]/processing/page.tsx:135 — optional target
<div className="mb-4 text-5xl finding-reveal" style={{ animationDelay: '120ms' }}>✓</div>
```

This is additive polish, not required for the finding to be resolved. Skip
it if it makes the diff feel out of scope.

## Repo conventions to follow

- Motion tokens are not centralized as CSS custom properties in this repo;
  instead, purpose-built animation classes live directly in
  `app/globals.css` and get applied via `className`. `finding-reveal` is
  the established "content appears, don't teleport it" class — extend it,
  don't invent a parallel one.
- Exemplar to imitate: `app/audit/[id]/results/ResultsClient.tsx:693-696`
  applies `finding-reveal` to each finding `Card` with a staggered
  `animationDelay` inline style. The optional checkmark step above follows
  the identical pattern (class + inline `animationDelay`), just without a
  loop since there's only one element.
- `prefers-reduced-motion` is handled globally at
  `app/globals.css:1085-1100` — it zeroes all `animation-duration` and
  `transition-duration` sitewide. Do not add component-level reduced-motion
  handling; it's already inherited for free.

## Steps

1. Open `app/audit/[id]/processing/page.tsx`. On the line reading
   `<Card variant="elevated" className="vt-audit-card text-center">`
   (the Card inside the `status === 'ready'` block), change the
   `className` to `"vt-audit-card finding-reveal text-center"`.
2. (Optional) On the line reading `<div className="mb-4 text-5xl">✓</div>`
   directly below it, change it to
   `<div className="mb-4 text-5xl finding-reveal" style={{ animationDelay: '120ms' }}>✓</div>`.
3. Save. No other files need to change — `finding-reveal` already exists in
   `app/globals.css` and needs no edits.

## Boundaries

- Do NOT touch `app/globals.css` — the `finding-reveal` keyframe already
  exists and already has the correct values; do not redefine it or add a
  new one.
- Do NOT touch the progress bar, the `STATUS_MESSAGES` cycling logic, or
  the `setInterval`/`setStatus('ready')` call inside the `useEffect`
  (`page.tsx:28-62`) — the trigger for the swap is out of scope, only its
  visual result.
- Do NOT introduce `document.startViewTransition` or `flushSync` for this
  swap. `setStatus('ready')` is called from inside the functional updater
  passed to `setProgress` (`page.tsx:36-43`), a nested state-setter call —
  wrapping that in a same-document view transition is fragile to get right
  and unnecessary here; the CSS keyframe approach above sidesteps the
  timing question entirely.
- Do NOT touch `vt-audit-card` or `pushWithViewTransition` — that governs
  the separate cross-route transition to `/results` and must keep working
  unmodified.
- Do NOT add new dependencies or new CSS classes.
- If the `className` string on the ready Card has drifted from what's
  quoted above (i.e., doesn't match `"vt-audit-card text-center"`
  verbatim), STOP and report the mismatch instead of guessing at the edit.

## Verification

- **Mechanical**: run `npm run typecheck` (`tsc --noEmit`) and
  `npm run lint` (`eslint .`) from `customer-portal/` — both must pass with
  no new errors. This is a `className` string edit only; neither command
  should report anything.
- **Feel check**: run `npm run dev`, open `/audit`, submit any URL, and
  watch the screen once the progress bar reaches 100%:
  - The ready Card should visibly ease up into place (starts offset
    `translateY(14px)` + transparent, settles to its resting position) over
    ~420ms — not appear in a single frame.
  - In Chrome DevTools → Animations panel, set playback to 10% and
    re-trigger; confirm the motion starts fast and decelerates into place
    (the `cubic-bezier(0.22, 1, 0.36, 1)` ease-out feel), with no linear or
    robotic pacing.
  - If the optional checkmark step was applied, confirm it settles
    noticeably after the card itself (~120ms behind), reading as two beats
    rather than one — not simultaneous, not so delayed it looks broken.
  - Toggle `prefers-reduced-motion: reduce` in DevTools → Rendering panel,
    re-trigger the flow, and confirm the ready Card still appears (content
    is never hidden) but the animation collapses to effectively instant,
    per the existing global rule at `globals.css:1085-1100`.
- **Done when**: the processing→ready swap visibly eases in at normal
  playback speed, the 10%-speed check in DevTools confirms the correct
  curve, reduced-motion still resolves the Card to fully visible with no
  regression, and both `typecheck` and `lint` are clean.
