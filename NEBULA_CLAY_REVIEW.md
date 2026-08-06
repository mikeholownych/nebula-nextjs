# Nebula Components — Clay-Standard Design Review

## Executive Summary

**Verdict: does not pass a Stripe/Notion/Linear-caliber design review today.** The strongest part is the visual direction: a restrained near-black canvas, teal accent, consistent rounded surfaces, clear CTA hierarchy, and a credible evidence-first product narrative. The largest systemic gap is that the design system is not actually centralized: Tailwind tokens, legacy CSS variables, inline SVG colors, and route-local styles use different palettes and state rules. The second release-blocking gap is trust and semantic consistency: live surfaces still expose deprecated nine-signal/composite claims that the corrected aggregate API suppresses. Accessibility is uneven rather than absent; links generally have focus-visible treatment, but core controls and overlays do not share a complete keyboard, reduced-motion, and error-state contract.

**Scope.** The census covers all 29 reusable/shared component files under `customer-portal/components/**`, `customer-portal/app/components/**`, and the reusable `/benchmarks` client component. Route-local page JSX files are not treated as separate library components; they are consumers and are sampled through live `/`, `/audit`, and `/benchmarks` renders. No source files were modified by this review.

## Scorecard

Weighted overall = visual 18%, motion 15%, accessibility 18%, API 15%, tokens 15%, responsive 8%, docs 6%, performance 5%.

```toon
component_scores[28]{component,visual,motion,a11y,api,tokens,responsive,docs,perf,overall}:
Button,3,3,2,4,2,3,2,3,2.76
Input,3,2,2,4,2,3,2,3,2.61
Card,3,1,3,3,2,3,1,3,2.43
LinkButton,3,2,3,4,2,3,2,3,2.79
UIPageShell,3,1,2,3,2,3,1,2,2.20
SiteNav,3,3,3,3,2,3,1,2,2.68
Footer,2,2,3,2,1,3,1,2,2.05
NebulaMark,3,1,1,3,1,3,1,3,1.92
SignalIcons,2,1,1,3,1,3,1,3,1.74
WebMCP,2,1,1,2,2,3,1,2,1.69
EmailGate,2,2,2,3,2,2,1,2,2.09
FindingCallout,3,2,2,3,1,3,1,2,2.20
BrowserMockupCard,3,1,2,3,1,3,1,3,2.10
RecentFinding,2,1,2,3,2,3,1,3,2.07
SelfScan,2,2,2,3,1,3,1,2,2.02
CookieConsent,2,3,3,2,1,3,1,2,2.20
SEOHead,2,1,2,2,2,3,1,3,1.92
BreadcrumbSchema,2,1,2,2,2,3,1,3,1.92
AnalyticsRuntime,2,1,2,2,2,3,1,3,1.92
ArticlePage,2,1,2,2,2,3,1,2,1.87
Breadcrumb,3,2,3,3,2,3,1,3,2.58
AggregateProof,2,1,1,2,2,3,1,2,1.69
AppPageShell,3,1,2,3,2,3,1,2,2.20
LazyCookieConsent,2,1,2,2,1,3,1,3,1.77
Benchmarks,2,1,2,3,1,3,1,2,1.87
CitablePageShell,3,1,2,3,2,3,1,2,2.02
CitableJobTemplate,2,2,2,3,1,3,1,2,2.02
CitableProofPanel,2,1,1,2,2,3,1,2,1.69

```

The weighted mean across the 28 reviewed components is **2.11/5**.

## Findings

```toon
findings[14]{component,dimension,severity,citation,gap_vs_benchmark,recommendation,effort}:
AggregateProof,accessibility,blocker,app/components/AggregateProof.tsx:38-43,"Stripe color_system + evidence integrity: the homepage still renders average score when avg_score is non-null, contradicting the corrected aggregate contract and live public-facts boundary","Remove avg_score from the response type and render path; publish only completed-audit count with an explicit verified-sample label until a defensible score exists.",S
NebulaMark,consistency_tokens,blocker,components/NebulaMark.tsx:3-14,"Stripe color_system: the primary brand mark still encodes nine conversion signals, including deprecated checks, while the public taxonomy is seven core checks","Make the mark semantic-neutral or drive it from the current signal registry; remove the nine-state product claim from comments, props, and decorative state.",M
Benchmarks,consistency_tokens,blocker,app/benchmarks/Benchmarks.tsx:24-55,"Stripe color_system: deprecated Above Fold and Ad Signals remain in public descriptions and pass standards even when aggregate data excludes them","Filter deprecated keys before rendering descriptions, cards, failure rates, and standards; add a visible verified-sample caveat.",M
Input,accessibility,major,components/ui/Input.tsx:3-10;30-35,"Stripe form_inputs: error association must be deterministic for every rendered field","Require or generate a stable id before composing aria-describedby; add aria-errormessage where supported and test label, helper, error, disabled, and keyboard states.",S
Button,accessibility,major,components/ui/Button.tsx:25-40,"Stripe form_inputs: the component defines hover/active but no component-owned focus-visible ring","Add a tokenized focus-visible ring and preserve consumer overrides; test keyboard focus against dark and light contexts.",S
CookieConsent,accessibility,major,app/components/CookieConsent.tsx:150-196,"Linear keyboard_first: a role=dialog overlay needs modal semantics, focus entry/return, Escape behavior, and a reliable focus order","Use a dialog primitive or implement aria-modal, initial focus, focus return, Escape, and reduced-motion behavior; keep both choices reachable at 200% zoom.",M
CookieConsent,consistency_tokens,major,app/components/CookieConsent.tsx:158-190,"Stripe color_system: raw emerald, gray, white, and arbitrary background values bypass the Tailwind token layer","Replace raw utility colors with semantic tokens shared by the rest of the product; remove the second consent palette.",S
Tailwind/CSS token layers,consistency_tokens,major,customer-portal/tailwind.config.ts:11-53;public/styles/nebula-design-system.css:12-19,"Stripe color_system + Linear motion_language: Tailwind uses #00c2a0 while legacy CSS uses #10b981, with different foreground/border scales","Choose one token source, generate or consume it from both layers, and add a CI check that rejects hardcoded palette values outside token files.",L
Motion system,motion_interaction,major,customer-portal/tailwind.config.ts:98-115;public/styles/nebula-design-system.css:63-70,"Linear motion_language: durations/easings exist as scattered literals and no prefers-reduced-motion contract is defined","Add semantic duration/easing tokens and a global reduced-motion override; use the same transition recipe for Button, LinkButton, nav, consent, and reveal components.",M
SiteNav,responsive_adaptive,major,components/SiteNav.tsx:43-53,"Linear density_control: the mobile summary trigger is approximately 38px before visual padding and the open menu is not a tested navigation state","Set a minimum 44px target, add explicit open/close keyboard tests, and ensure outside-click/Escape behavior is intentional.",S
BrowserMockupCard,visual_craft,major,components/mockups/BrowserMockupCard.tsx:70-76,"Vercel loading_states / Linear density_control: browser chrome uses 7px URL text and decorative status dots without a clear semantic hierarchy","Treat chrome as decorative, raise the minimum readable URL size, and provide a deliberate compact variant rather than shrinking text to 7px.",S
FindingCallout,performance,major,components/mockups/FindingCallout.tsx:14-29;128-147,"Vercel performance: each call renders a full SVG filter definition and displacement filter, which can multiply paint cost on long pages","Hoist RoughFilters to the page shell once, use CSS/text decoration where possible, and test a long teardown with performance marks.",M
WebMCP,api_ergonomics,major,components/WebMCP.tsx:20-43;46-71,"Notion API ergonomics: the advertised request_audit tool redirects instead of completing or returning a stable submission result, and its pricing description still names deprecated checks","Return a typed result contract with validation/error states, then source all offer/check descriptions from the canonical public registry.",M
Documentation,documentation,major,customer-portal/package.json:5-26,"Stripe/Notion documentation: there is no Storybook, Ladle, MDX, or component docs surface despite 29 shared components","Add a component workbench with prop tables, interaction states, keyboard stories, dark/light themes, and do/don't examples.",L
```

### Additional major evidence

- The live `/` render still shows `Above Fold` as the “Last finding,” while the self-scan caveat says Above Fold and Ad Signals are omitted. This is a trust-breaking contradiction visible in the browser accessibility tree.
- The live `/audit` render still says “See your score,” displays a historical 7.7/10 image, reports “9 conversion signals,” and renders Above the fold and Ad signals in the illustrative output. These are not component defects alone, but they prevent the shipped surface from passing a design review that includes evidence integrity.
- The live `/benchmarks` render still contains “Pass:” copy and source-level descriptions for deprecated checks. The implementation at `app/benchmarks/Benchmarks.tsx:24-55` confirms this is not a browser artifact.
- ESLint is not clean: `app/shared/[token]/page.tsx:131` references an unavailable `@next/next/no-img-element` rule, and `next.config.ts:2` has an unused `withPostHogConfig` import. These are release hygiene issues, not scored as component findings.

## Systemic Issues

### 1. The token layer is split

There are at least two active systems: Tailwind semantic tokens (`tailwind.config.ts:11-53`) and legacy CSS variables (`public/styles/nebula-design-system.css:4-19`). They disagree on the primary accent (`#00c2a0` vs `#10b981`), foreground values, border treatment, and font family. Components then add inline values such as `#f59e0b` in `NebulaMark.tsx:39` and raw colors in `CookieConsent.tsx:158-190`. **Single fix:** establish one semantic token registry and make Tailwind, global CSS, SVG defaults, and consent styles consume it.

### 2. Deprecated signal taxonomy still leaks through shared and route-local surfaces

`NebulaMark.tsx:3-14`, `SignalIcons.tsx:51-66;121-136`, `WebMCP.tsx:59`, `Benchmarks.tsx:24-55`, and live `/audit` content still know about Above Fold and Ad Signals. **Single fix:** define one canonical public signal registry with `public: true|false`, then derive icons, copy, WebMCP descriptions, benchmark cards, self-scan output, and page copy from it.

### 3. Interactive state contracts are incomplete

`Button.tsx:30-39` has transition and active styling but no explicit focus-visible state; `Input.tsx:21-31` has focus styling but no stable error contract when `id` is absent; `SiteNav.tsx:43-53` relies on native `<details>` without a tested escape/outside-click model; `CookieConsent.tsx:150-196` is a modal-like overlay without modal behavior. **Single fix:** create a shared interaction primitive/test matrix covering hover, active, focus-visible, disabled, loading, error, Escape, reduced motion, and touch target size.

### 4. There is no component documentation system

The repository has 29 shared components, nine component-specific tests, no Storybook/Ladle, no stories, and no MDX component docs. The current README documents the application, not component APIs (`customer-portal/README.md:1-43`). **Single fix:** add a workbench and require each component to document intent props, defaults, edge states, keyboard behavior, and responsive examples.

### 5. Duplicate shell primitives increase drift

`components/ui/PageShell.tsx:3-27` and `app/components/PageShell.tsx:6-20` share a name but have different responsibilities and styling. The UI barrel exports only the former (`components/ui/index.ts:1-4`). **Single fix:** rename and separate layout primitives by intent, then enforce one import path per use case.

### 6. Public evidence and visual presentation are coupled to stale claims

The screenshot on `/audit` is explicitly historical, but the live page still visually presents a 7.7/10 artifact and nine-signal output. The browser screenshot also shows the cookie banner covering the hero/form region. **Single fix:** create a “public evidence” content contract that validates every number, signal label, screenshot caption, and benchmark claim at build time.

## Quick Wins

1. **Remove aggregate score rendering** — `app/components/AggregateProof.tsx:38-43`; effort S, blocker. The API already returns `avg_score: null`; the component should not retain a path that can re-expose it.
2. **Add Button focus-visible styling** — `components/ui/Button.tsx:30-39`; effort S, major.
3. **Make Input ids deterministic** — `components/ui/Input.tsx:3-10;30-35`; effort S, major.
4. **Raise mobile nav trigger to 44px** — `components/SiteNav.tsx:43-53`; effort S, major.
5. **Replace raw cookie-banner palette utilities with semantic tokens** — `app/components/CookieConsent.tsx:158-190`; effort S, major.
6. **Remove deprecated signal descriptions from Benchmarks** — `app/benchmarks/Benchmarks.tsx:24-55`; effort S, blocker.
7. **Hoist `RoughFilters` once per page** — `components/mockups/FindingCallout.tsx:14-29;128-147`; effort S/M, major.

## Strategic Bets

### 1. Canonical design-token and semantic-state layer — L

Unify Tailwind, CSS variables, SVG defaults, radii, shadows, typography, durations, easings, and semantic states. Add a static check for raw hex values and a visual token page. This is the highest-leverage investment because the palette and state drift currently repeats across nearly every component.

### 2. Accessible interaction foundation — M/L

Standardize Button, LinkButton, Input, navigation, dialog/consent, loading, and error primitives. Add keyboard-only, screen-reader semantics, focus-visible, 200% zoom, touch-target, and prefers-reduced-motion tests. This moves the library from “mostly styled HTML” to a dependable component system.

### 3. Component workbench and evidence contract — L

Add Storybook or an equivalent Next-compatible workbench with stories for every shared component and state. Pair it with a canonical public-signal registry and build-time checks for stale claims, screenshots, numbers, and deprecated labels. This would make the design system reviewable continuously instead of only during a release audit.

## Verification

- **Inventory:** 29 shared/reusable component files reviewed from full source, including `components/**`, `app/components/**`, and `app/benchmarks/Benchmarks.tsx`.
- **Stories/docs:** no Storybook, Ladle, MDX, or story files found. Nine component tests exist under `__tests__/components/`.
- **Runtime:** local Next app inspected in browser at `/`, `/audit`, and `/benchmarks`; desktop screenshot inspected for hierarchy, spacing, cookie overlay, and visual state.
- **Build checks:** `npm run lint` attempted and failed with the two errors documented above. No source edits were made.
- **Read-only constraint:** no application source files were modified during this review; the working tree already contained unrelated changes in `customer-portal/app/benchmarks/Benchmarks.tsx`, `customer-portal/app/components/RecentFinding.tsx`, `customer-portal/app/components/SelfScan.tsx`, and `customer-portal/components/WebMCP.tsx`.

## Remediation Status

remediation[15]{id,status,commit,note}:
F1,fixed,d9de1d81,"AggregateProof no longer renders avg_score; targeted component and full-suite verification passed."
F2,fixed,62a20274,"NebulaMark is semantic-neutral and contains no deprecated signal labels; source grep passed."
F3,fixed,ede279e2,"Benchmarks filters to the verified seven-signal set and shows the verified-sample caveat; diff and typecheck passed."
F4,fixed,70e00607,"RecentFinding rejects deprecated keys and labels before rendering; typecheck and full-suite verification passed."
F5,fixed,ce2b2d5c,"Audit page removed historical score and nine-signal claims; source assertions and full-suite verification passed."
F6,fixed,802e4e2b,"Invalid ESLint rule and unused config import removed; npm run lint passed."
F7,fixed,d9425721,"Input generates stable useId identifiers and aria-errormessage; Input tests passed."
F8,fixed,bea4d191,"Button owns a tokenized focus-visible ring; Button tests and lint passed."
F9,fixed,be469f28,"CookieConsent has modal semantics, focus entry/return, Escape, Tab trapping, and reduced-motion behavior; consent tests passed."
F10,fixed,62224ae5,"CookieConsent consumes semantic design tokens instead of the duplicate raw palette; consent tests and lint passed."
F11,fixed,085903de,"Original 50bb2333 missed Tailwind; redo centralizes the accent and removes all #10b981 matches from public app/component paths."
F12,fixed,d3b3c7fa,"Motion duration/easing tokens and global reduced-motion override are present in Tailwind/globals; lint and typecheck passed."
F13,fixed,682b7388,"WebMCP uses the canonical seven-signal list and returns typed submitted/error results from POST /api/audit/start; lint, typecheck, and 23 targeted tests passed."
F14,fixed,1e9ad154,"BrowserMockupCard treats chrome dots as decorative and raises URL text to readable text-xs; lint and typecheck passed."
F-doc,deferred,TODO,"Component workbench is tracked in docs/CLAY_COMPONENT_WORKBENCH_TODO.md with explicit Storybook/workbench acceptance criteria."
