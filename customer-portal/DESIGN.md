---
name: Nebula Components
description: Evidence-backed landing-page conversion diagnostics with clinical authority
colors:
  near-black: "#050505"
  bg-elevated: "#0a0a0a"
  bg-panel: "#111111"
  signal-emerald: "#10b981"
  emerald-light: "#34d399"
  emerald-dark: "#059669"
  emerald-dim: "rgba(16, 185, 129, 0.1)"
  fg: "#ffffff"
  fg-muted: "#9e9e9e"
  fg-dim: "#666666"
  danger: "#f37979"
  danger-dim: "rgba(239, 68, 68, 0.15)"
  info: "#3b82f6"
  warning: "#f59e0b"
  warning-dim: "rgba(245, 158, 11, 0.15)"
  border: "rgba(255, 255, 255, 0.06)"
typography:
  display:
    fontFamily: "Karla, -apple-system, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 6vw, 4rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Karla, -apple-system, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "Karla, -apple-system, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Karla, -apple-system, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Karla, -apple-system, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    letterSpacing: "0.1em"
    textTransform: "uppercase"
rounded:
  xs: "2px"
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  "2xl": "24px"
  pill: "100px"
  circle: "50%"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "32px"
  xl: "48px"
  "2xl": "64px"
components:
  button-primary:
    backgroundColor: "{colors.signal-emerald}"
    textColor: "{colors.near-black}"
    rounded: "{rounded.lg}"
    padding: "16px 32px"
  button-primary-hover:
    backgroundColor: "{colors.emerald-light}"
    textColor: "{colors.near-black}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.signal-emerald}"
    rounded: "{rounded.lg}"
    padding: "14px 28px"
  card-default:
    backgroundColor: "{colors.bg-panel}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
  card-bordered:
    backgroundColor: "{colors.bg-panel}"
    textColor: "{colors.fg}"
    rounded: "{rounded.xl}"
---

# Design System: Nebula Components

## 1. Overview

**Creative North Star: "The Conversion Lab"**

Assertive authority meets clinical precision. The system projects confidence through density and sharpness — not friendliness, not warmth, not restraint. This is diagnostic equipment, not a lifestyle brand. The Karla grotesque (quiet, geometric, weight-capable) replaced Inter specifically to avoid the reflex-default monoculture. The near-black foundation (#050505) eliminates visual competition. Signal Emerald (#10b981) marks actionable elements with authority, pulling the eye toward what matters.

The aesthetic explicitly rejects generic AI SaaS cream, CRO agency theatrics, and "black-box AI says so" interfaces. No conversion claims without evidence. No decorative motion. No gradient text. Every visual choice serves the belief ladder — the visitor must believe Nebula finds real, specific defects on their page.

Depth emerges from ambient glow orbs (120px blur, 0.15 opacity) that create atmospheric layering, not lift. The interface feels like surfaces emerging from atmosphere, not sitting on top of it.

**Key Characteristics:**
- Near-black canvas eliminates everything but the diagnostic content
- Signal Emerald authority on actions and positive signal — used sparingly (≤10% surface area)
- Karla grotesque: geometric, weight-capable, assertively non-default
- Ambient depth via layered glow, never drop shadows
- Tight tracking (-0.03em) on display for condensed authority
- Evidence-first: annotated defects trump marketing claims

**Resolved drift:** the indigo/mint palette (`#6366f1`, `#a5b4fc`, `#79f2c0` on `#080a0f`/`#111723`) that used to appear across `app/about/**` and most of `app/learning-centre/**` has been migrated onto the tokens documented here. The ~20 pages that used a raw `dangerouslySetInnerHTML` HTML-injection anti-pattern (nested `<body>` tag, unscoped global `<style>` overriding `:root`/`body`/`a`/`h1`-`h3` and forcing Inter over Karla) were rewritten as real JSX. The two bespoke pages (`resources/citable`, `resources`) kept their custom `<style>` blocks but had them scoped under a page-level class and recolored. No page should reintroduce this palette or the raw-HTML-injection pattern.

---

## 2. Colors

**Signal Emerald palette** — one accent, high contrast, clinical authority. The palette is deliberately restrained: one primary accent carries the entire brand signal.

### Primary

- **Signal Emerald** (#10b981): Primary accent. Used exclusively on CTAs, positive indicators, step numbers, success states, and findings that mark "fixed" or "correct." Never decorative. Always carries semantic meaning.
- **Emerald Light** (#34d399): Hover state for primary buttons. Same hue, higher lightness.
- **Emerald Dark** (#059669): Pressed state, secondary accents when Signal Emerald needs support.

### Neutral

- **Near Black** (#050505): Body background. Deliberately extreme — eliminates visual competition entirely.
- **BG Elevated** (#0a0a0a): Secondary background for sections requiring subtle separation.
- **BG Panel** (#111111): Card backgrounds, input backgrounds, containers.
- **FG** (#ffffff): Primary text on dark backgrounds. Maximum contrast (21:1).
- **FG Muted** (#9e9e9e): Secondary text, descriptions, supporting context. Canonical across the codebase: `tailwind.config.ts`'s `fg.muted` and `globals.css`'s `--fg-muted` both resolve to this value. Bumped from #888888 (~5.7:1, AA-only) to clear WCAG 2.2 AAA (~7.05:1 on BG Panel, ~7.6:1 on Near Black) — see the resolved AAA Gap note below.
- **FG Dim** (#666666): Tertiary text, disabled states.
- **Border** (rgba(255, 255, 255, 0.06)): Subtle dividers. Near-invisible until needed.

### Semantic

- **Danger** (#f37979): Error states, "before" tags, negative signal, unfixed defects. Bumped from #ef4444 (~5.0-5.4:1, AA-only) to clear WCAG 2.2 AAA (~7.0:1 on BG Panel, ~7.6:1 on Near Black) — same hue, lightened. Danger Dim is unaffected (a background tint, not text, so AAA text-contrast rules don't apply to it).
- **Danger Dim** (rgba(239, 68, 68, 0.15)): Background tint for danger badges.
- **Info** (#3b82f6): Secondary glow orb, rarely used in UI.
- **Warning** (#f59e0b): Scoring highlights, attention markers in audit output. Canonical across the codebase: `tailwind.config.ts`'s `warning` and `globals.css`'s new `--warning` custom property both resolve to this value (`.sample-score` previously hardcoded `#fbbf24` directly; fixed to reference `var(--warning)` / `var(--warning-dim)`).

### Named Rules

**The One Signal Rule.** Signal Emerald is reserved for actionable elements and positive signal. It appears on ≤10% of any screen surface. Its rarity is the point.

**The No-Warm-Neutral Rule.** Backgrounds live on the cool near-black axis. No cream, sand, paper, parchment, or warm-tinted neutrals. Warmth is carried by the emerald accent and imagery — never the canvas.

**The Authority-Not-Friendliness Rule.** Signal Emerald is not "friendly green." It marks signal, not inclusion. No pastel tints, no soft gradients. Sharp, saturated, assertive.

**The AAA Gap (resolved).** PRODUCT.md targets WCAG 2.2 AAA (7:1 for body text, 4.5:1 for large text). FG Muted (#888888 → #9e9e9e) and Danger (#ef4444 → #f37979) both used to fall short (~5.0-5.75:1, AA-only). Both were bumped, same hue, to clear 7:1 against both Near Black and BG Panel. Signal Emerald, Warning, and body text on any documented background already cleared AAA before this fix.

---

## 3. Typography

**Display Font:** Karla (geometric grotesque, weight range 400–800)
**Body Font:** Karla (same family, consistent voice)
**Label Font:** Karla (600 weight, uppercase, tracked)

**Character:** A quiet grotesque that can carry weight without shouting. Karla replaces Inter to exit the reflex-default monoculture. The geometric structure provides precision; the rounded terminals prevent clinical coldness. Pairing as a single family maintains voice consistency — weight contrast (700/400) creates hierarchy, not family switching.

### Hierarchy

- **Display** (700, clamp(2.5rem, 6vw, 4rem), 1.1, -0.03em): Hero headlines. The largest type on any page. Assertive presence, condensed tracking for density. Never below the fold.
- **Headline** (700, clamp(2rem, 4vw, 2.5rem), 1.2): Section titles. Used for major page divisions.
- **Title** (600, 1.5rem, 1.3): Card titles, step headings, secondary labels.
- **Body** (400, 17px, 1.65): Primary prose, set via `globals.css`'s `--text-base`. Capped at 65–75ch line length for readability. Good contrast against near-black.
- **Label** (600, 13px, 0.1em tracking, uppercase): Badges, eyebrows, step numbers. Wide tracking creates small-caps appearance.

Tailwind's own `text-xs`…`text-6xl` utility scale (defined in `tailwind.config.ts`, independent of the five roles above) is used ad hoc inside component library code for one-off sizing — e.g. Button's `size` variants pull `text-sm`/`text-base`/`text-lg` directly. It runs about 1px off `--text-base` (16px vs. the body's 17px) at the `base` step; not a defect, just two adjacent scales worth knowing are both live.

### Named Rules

**The Tracking Floor.** Display letter-spacing never goes below -0.03em. Tighter risks letter collision at 4rem scale.

**The Weight-Contrast Rule.** Display (700) and Body (400) are 300 weight apart. No intermediate siblings. The gap creates hierarchy.

**The No-Decoration Rule.** No gradient text. No text-shadow effects. Signal Emerald may appear as solid color or background — never as gradient-fill on typography.

---

## 4. Elevation: Ambient Depth

**Surfaces emerge from the atmosphere rather than sitting on top of it.**

The system rejects conventional drop shadows (offset + blur + spread) entirely. Depth is conveyed through atmospheric glow and tonal layering — not lift.

### Glow Vocabulary

- **Ambient Emerald** (120px blur, 600×600px, radial-gradient emerald @ 0.15 opacity): Fixed-position orb, top-right quadrant. Creates ambient glow from within the atmosphere.
- **Ambient Blue** (120px blur, 600×600px, radial-gradient blue @ 0.12 opacity): Fixed-position orb, bottom-left. Cooler counterpoint.
- **Button Glow** (0 0 16px rgba(16, 185, 129, 0.25)): Primary button hover state. Responsive, not ambient.
- **Card Glow** (0 0 40px rgba(16, 185, 129, 0.15)): Featured/pricing cards — `shadow-glow` in `tailwind.config.ts`.

### Named Rules

**The No-Drop-Shadow Rule.** No traditional drop shadows with offset. Use centered glow (0 offset, high blur) or tonal layering (BG Panel on BG Elevated) instead.

**The Ambient-Not-Lifted Rule.** Glow orbs set atmosphere; state changes set interaction. No static glow on interactive elements at rest.

**The Surface Emergence Rule.** Backgrounds transition through tonal steps (#050505 → #0a0a0a → #111111), not through shadow elevation. Surfaces emerge from depth, not float above it.

---

## 5. Components

### Buttons

**Shape:** Actual rendered radii by size (`components/ui/Button.tsx`): 8px (`sm`), 12px (`md`, the default and most common size), 16px (`lg`, hero emphasis). Never full-pill.

- **Primary** (Signal Emerald bg, Near Black text, fontWeight 600): Main CTAs — "Run Free Audit", "Review checkout", form submits.
  - Hover: BG shifts to Emerald Light, Button Glow appears (16px @ 0.25).
  - Active: No lift, reduced glow.
  - Touch devices: No hover lift; active uses scale(0.98) instead.
- **Secondary / Outline** (transparent bg, 1–2px Signal Emerald border, Signal Emerald text): Secondary actions — "View audit status", "Review checkout →" on outline contexts.
  - Hover: BG shifts to Emerald Dim, border stays.
- **Ghost** (transparent bg, FG Muted text): Tertiary nav, cancel actions.
  - Hover: Text shifts to FG.

**Don't** hand-roll hero CTAs as raw `<Link className="...">` markup with one-off Tailwind classes (the homepage's "Run Free Audit" button does this). Use the `Button` component at `size="lg"` so radius, glow, and disabled/loading states stay centralized instead of drifting per page.

### Cards

**Corner Style:** 16px (`rounded-2xl`) uniformly — `components/ui/Card.tsx` doesn't vary radius by variant. Never >24px.

- **Default** (BG Panel background): Standard container.
- **Bordered** (BG Panel, 1px Border): Standard container with a visible edge — used for pricing/plan comparisons.
- **Elevated** (BG Panel, `shadow-glow`): Featured/pricing cards.
- **Internal Padding:** `none` (0) / `sm` (16px) / `md` (24px, default) / `lg` (32px).

### Inputs / Fields

**Style:** Near Black background, 1px Border, rounded-xl (12px), padding 12–16px (`px-4 py-3`).

- **Focus:** Border shifts to Signal Emerald, focus ring (`ring-2 ring-accent/20`).
- **Error:** Border shifts to Danger; error text below in Danger, `role="alert"`.
- **Helper text:** FG Dim, shown only when no error is present.

### Navigation

**Header:** Fixed, backdrop-filter blur(20px), BG Elevated @ 0.8 opacity. Padded 16px 24px desktop, 12px 16px mobile.

- **Nav Links:** FG Muted text, 14px, fontWeight 600. Hover shifts to Signal Emerald.
- **Touch:** Min-height 44px, increased padding on coarse pointers.
- **Mobile:** Stacked vertical menu below header on max-width 480px.

### Proof Section Components

- **Before/After Tags:** tag-before (Danger Dim bg, Danger text, 4px radius), tag-after (Emerald Dim bg, Signal Emerald text, 4px radius).
- **Shift Cards:** old/danger-tinted border, new/emerald-tinted border, 32px padding.

---

## 6. Do's and Don'ts

### Do:

- **Do** use Signal Emerald (#10b981) exclusively for actionable elements and positive signal — CTAs, step numbers, success states, "fixed" highlights.
- **Do** maintain Near Black (#050505) as the body background everywhere. No warm neutral tints.
- **Do** use ambient glow orbs (120px blur, 0.15 opacity) for atmospheric depth instead of drop shadows.
- **Do** set display headlines with tight tracking (-0.03em) but never below that floor.
- **Do** cap body prose at 65–75ch line length.
- **Do** show evidence — annotated screenshots and specific defects — instead of generic claims.
- **Do** include skip-link for keyboard navigation. Target WCAG 2.2 AAA (raised from AA; see the AAA Gap note in Colors — FG Muted doesn't clear this yet).
- **Do** assert: Karla was chosen specifically to exit the Inter/DM Sans reflex-default monoculture.
- **Do** use the shared `Button`/`Card`/`Input` components from `components/ui/` instead of re-implementing their styles inline.

### Don't:

- **Don't** use gradient text (`background-clip: text` with gradient). Solid Signal Emerald or nothing.
- **Don't** apply side-stripe borders (border-left/right greater than 1px) as visual decoration.
- **Don't** use identical card grids with icon + heading + text repeated endlessly.
- **Don't** add a tiny uppercase tracked eyebrow above every section. One named kicker is deliberate; eyebrows as section grammar is AI scaffolding.
- **Don't** use drop shadows with large blur (≥16px) on cards or buttons. Use centered glow or tonal layering.
- **Don't** use border-radius greater than 24px on cards.
- **Don't** fabricate testimonials, case studies, or conversion claims — every claim traces to one of the two documented case studies (48x ROAS ecommerce, −50% CPC B2B SaaS) until more are added.
- **Don't** look like a "generic AI SaaS", "CRO agency", "website-design studio", "cheap audit generator", "digital-marketing guru funnel", "space-themed novelty brand", "cybersecurity product", "enterprise analytics platform", "SEO audit tool", or "black-box 'AI says so' product" — all explicitly rejected in PRODUCT.md's positioning.
- **Don't** animate images on hover. If a card needs hover feedback, animate background, border, or shadow — never the image.
- **Don't** default to Inter, DM Sans, Fraunces, or any font on the reflex-reject list. Karla is the committed brand font.
- **Don't** reintroduce the old indigo/mint palette (#6366f1, #a5b4fc, #79f2c0 on #080a0f/#111723) — it was migrated off every page. If it resurfaces anywhere, that's regression, not a second intentional aesthetic.
- **Don't** re-add `dangerouslySetInnerHTML`-based page templates with their own `<body>` tag and unscoped `<style>` block. Every learning-centre article is now plain JSX on shared tokens; new articles should follow that pattern.
- **Don't** hardcode a token value directly (a hex, an rgba) when a shared color/utility class already names it. `globals.css` used to duplicate `fg-muted` and `warning` at different values than their Tailwind equivalents (`#737373`/`#fbbf24`); both now reference `var(--fg-muted)` / `var(--warning)` at the canonical values — don't reintroduce a hardcoded one-off.
