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
  fg-muted: "#737373"
  fg-dim: "#666666"
  danger: "#ef4444"
  danger-dim: "rgba(239, 68, 68, 0.15)"
  info: "#3b82f6"
  warning: "#fbbf24"
  warning-dim: "rgba(251, 191, 36, 0.15)"
  border: "rgba(255, 255, 255, 0.06)"
typography:
  fontFamily: "Karla, -apple-system, system-ui, sans-serif"
  scale:
    xs: "11px"
    sm: "12px"
    base: "14px"
    md: "15px"
    lg: "16px"
    xl: "1rem"
    "2xl": "1.125rem"
    "3xl": "1.25rem"
    "4xl": "1.5rem"
    "5xl": "2.5rem"
    "6xl": "3rem"
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
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  card-bordered:
    backgroundColor: "{colors.bg-panel}"
    textColor: "{colors.fg}"
    rounded: "{rounded.lg}"
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
- **FG Muted** (#737373): Secondary text, descriptions, supporting context. Contrast 4.67:1 on #050505.
- **FG Dim** (#666666): Tertiary text, disabled states.
- **Border** (rgba(255, 255, 255, 0.06)): Subtle dividers. Near-invisible until needed.

### Semantic

- **Danger** (#ef4444): Error states, "before" tags, negative signal, unfixed defects.
- **Danger Dim** (rgba(239, 68, 68, 0.15)): Background tint for danger badges.
- **Info** (#3b82f6): Secondary glow orb, rarely used in UI.
- **Warning** (#fbbf24): Scoring highlights, attention markers in audit output.

### Named Rules

**The One Signal Rule.** Signal Emerald is reserved for actionable elements and positive signal. It appears on ≤10% of any screen surface. Its rarity is the point.

**The No-Warm-Neutral Rule.** Backgrounds live on the cool near-black axis. No cream, sand, paper, parchment, or warm-tinted neutrals. Warmth is carried by the emerald accent and imagery — never the canvas.

**The Authority-Not-Friendliness Rule.** Signal Emerald is not "friendly green." It marks signal, not inclusion. No pastel tints, no soft gradients. Sharp, saturated, assertive.

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
- **Body** (400, 17px, 1.65): Primary prose. Capped at 65–75ch line length for readability. Good contrast against near-black.
- **Label** (600, 13px, 0.1em tracking, uppercase): Badges, eyebrows, step numbers. Wide tracking creates small-caps appearance.

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
- **Card Glow** (0 0 40px rgba(16, 185, 129, 0.15)): Featured/pricing cards.

### Named Rules

**The No-Drop-Shadow Rule.** No traditional drop shadows with offset. Use centered glow (0 offset, high blur) or tonal layering (BG Panel on BG Elevated) instead.

**The Ambient-Not-Lifted Rule.** Glow orbs set atmosphere; state changes set interaction. No static glow on interactive elements at rest.

**The Surface Emergence Rule.** Backgrounds transition through tonal steps (#050505 → #0a0a0a → #111111), not through shadow elevation. Surfaces emerge from depth, not float above it.

---

## 5. Components

### Buttons

**Shape:** Rounded-lg (12px) standard, rounded-xl (16px) for hero emphasis. Never full-pill on action buttons.

- **Primary** (Signal Emerald bg, Near Black text, 16px 32px padding, fontWeight 600): Main CTAs — "Audit My Landing Page", "Get Started", form submits.
  - Hover: BG shifts to Emerald Light, translateY(-1px), Button Glow appears (16px @ 0.25).
  - Active: No lift, reduced glow.
  - Touch devices: No hover lift; active uses scale(0.98) instead.

- **Secondary / Outline** (transparent bg, 2px Signal Emerald border, Signal Emerald text, 14px 28px padding): Secondary actions — "View Sample Audit", "Learn More".
  - Hover: BG shifts to Emerald Dim, border stays.

- **Ghost** (transparent bg, FG Muted text): Tertiary nav, cancel actions.
  - Hover: Text shifts to FG.

### Cards

**Corner Style:** Rounded-lg (12px) for utility cards, rounded-xl (16px) for content. Never >24px.

- **Default** (BG Panel background, 1px Border): Standard container.
- **Elevated** (BG Panel, Card Glow): Featured/pricing cards.
- **Internal Padding:** 32px default, range 16px–48px.

### Inputs / Fields

**Style:** Near Black background, 1px Border, rounded-lg (12px), padding 14px–16px.

- **Focus:** Border shifts to Signal Emerald, focus ring (0 0 0 3px Emerald Dim).
- **Error:** Border shifts to Danger, background tints to Danger Dim.

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
- **Do** include skip-link for keyboard navigation. Target WCAG 2.2 AA minimum.
- **Do** assert: Karla was chosen specifically to exit the Inter/DM Sans reflex-default monoculture.

### Don't:

- **Don't** use gradient text (`background-clip: text` with gradient). Solid Signal Emerald or nothing.
- **Don't** apply side-stripe borders (border-left/right greater than 1px) as visual decoration.
- **Don't** use identical card grids with icon + heading + text repeated endlessly.
- **Don't** add a tiny uppercase tracked eyebrow above every section. One named kicker is deliberate; eyebrows as section grammar is AI scaffolding.
- **Don't** use drop shadows with large blur (≥16px) on cards or buttons. Use centered glow or tonal layering.
- **Don't** use border-radius greater than 24px on cards.
- **Don't** fabricate testimonials, case studies, or conversion claims.
- **Don't** look like a "generic AI SaaS", "CRO agency", "website-design studio", "cheap audit generator", "digital-marketing guru funnel", "space-themed novelty brand", "cybersecurity product", "enterprise analytics platform", "SEO audit tool", or "black-box 'AI says so' product" — all explicitly rejected in positioning.
- **Don't** animate images on hover. If a card needs hover feedback, animate background, border, or shadow — never the image.
- **Don't** default to Inter, DM Sans, Fraunces, or any font on the reflex-reject list. Karla is the committed brand font.
