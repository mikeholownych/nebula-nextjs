# Design System: Nebula Components

## 1. Visual Theme & Atmosphere

A **high-agency, forensic-grade interface** that feels like a precision instrument, not a SaaS template. The atmosphere is clinical confidence - the visual language of a tool that finds what others miss.

**Density:** 4 (Art Gallery Airy) - whitespace as power, not emptiness
**Variance:** 7 (Offset Asymmetric) - deliberate compositional tension
**Motion:** 5 (Fluid CSS) - purposeful micro-interactions, no decoration

The dark theme is retained but **elevated**: surfaces lift through warm-tinted elevation, not flat grays. The brand color (#00c2a0) punctuates - it does not saturate.

---

## 2. Color Palette & Roles

### Surfaces (Dark Canvas)
- **Void Black** `#050505` - Root background, negative space
- **Elevated Dark** `#0a0a0a` - Card containers, lifted panels
- **Warm Surface** `#0d1110` - Elevated cards, input backgrounds (warm-tinted)
- **Panel Slate** `#111111` - Deep containers, modal overlays

### Typography
- **Pure White** `#FFFFFF` - Primary text, high-emphasis
- **Steel Muted** `#9E9E9E` - Secondary text, descriptions, metadata (AAA contrast)
- **Whisper** `#6B6B6B` - Tertiary text, timestamps, hint text

### Accent (Single, Controlled)
- **Nebula Teal** `#00c2a0` - Primary CTA, active states, focus rings, links
- **Teal Light** `#33d4b8` - Hover states, hover-lift glow (never used directly)
- **Teal Dark** `#009980` - Pressed states
- **Teal Dim** `rgba(0, 194, 160, 0.1)` - Background fills, badges

### Semantic Colors
- **Signal Pass** `#22c55e` - Passing audit checks, positive states
- **Signal Fail** `#EF4444` - Failing checks, errors (used sparingly)
- **Signal Warn** `#F59E0B` - Warning states, attention (audit fail ONLY)
- **Secondary** - not used; single-accent system enforced

### Structural
- **Border Whisper** `rgba(255, 255, 255, 0.06)` - Card borders, dividers
- **Border Focus** `rgba(0, 194, 160, 0.5)` - Focus rings

---

## 3. Typography Rules

### Font Stack
- **Display:** `Geist` - Track-tight headlines, controlled scale. **Inter is BANNED.**
- **Body:** `Geist` - Relaxed leading, 65ch max
- **Mono:** `JetBrains Mono` - Code, audit scores, timestamps, financial numbers

### Scale Hierarchy
```css
--text-xs: 0.75rem;      /* 12px - tags, captions */
--text-sm: 0.875rem;      /* 14px - secondary, nav */
--text-base: 1.0625rem;   /* 17px - body prose */
--text-lg: 1.25rem;       /* 20px - section labels */
--text-xl: 1.5rem;        /* 24px - section headings */
--text-2xl: 2rem;         /* 32px - hero subhead */
--text-hero: clamp(2.5rem, 5vw, 4rem);  /* 40-64px - hero display */
```

### Typography Constraints
- **Display headlines:** Track-tight (`letter-spacing: -0.03em`). Weight-driven hierarchy, not size screaming
- **Body:** Relaxed leading (`1.6`), max-width `65ch`. Never full-bleed.
- **Numbers:** Always monospace in high-density contexts (audit scores, benchmarks)
- **BANNED:** Inter, generic system fonts, centered text blocks longer than 2 lines

---

## 4. Component Stylings

### Buttons
- **Primary:** Solid Nebula Teal fill. No outer glow. Tactile `-1px translateY` on active. Subtle inner shadow for depth.
- **Secondary:** Ghost/outline. Border in Border Whisper. Text in Pure White.
- **Hover:** Background-teal-dim fill for secondary. Slight brightness lift for primary.
- **Focus ring:** 2px Nebula Teal, offset 2px.
- **BANNED:** Neon outer glows, gradient fills, pill shapes on large buttons

### Cards
- **Elevation:** Use ONLY when hierarchy demands. Tint shadows to warm-dark (`rgba(0, 0, 0, 0.4)`).
- **Border:** 1px Border Whisper, generous `12px` radius.
- **High-density:** Replace with border-top dividers or negative space - cards only when lifting serves comprehension
- **Shadow:** `0 4px 24px rgba(0, 0, 0, 0.3)` - diffused, warm-tinted

### Inputs
- **Label position:** Above input, Steel Muted, `text-sm`
- **Input field:** Warm Surface fill, Border Whisper, 12px radius
- **Focus:** Border-Teal, no glow
- **Error:** Border-Signal Fail, error text below in `text-sm`
- **BANNED:** Floating labels, full-width inputs (constrain to ~60ch)

### Badges/Pills
- **Radius:** `9999px` (full pill)
- **Padding:** `0.25rem 0.75rem`
- **Background:** Teal Dim for active, Border Whisper for neutral

### Score Display
- **Large numbers:** Monospace, tracked-tight, Nebula Teal
- **Grade badges:** Solid fills matching grade (A: Signal Pass, B: Teal Dim, C: Warning, D/F: Signal Fail)

---

## 5. Layout Principles

### Grid System
- **Containment:** `max-width: 1400px`, centered
- **Grid-first:** CSS Grid for multi-column, Flexbox only for component internals
- **BANNED:** `calc()` percentage hacks, uncontained full-bleed sections

### Hero Section
- **Structure:** Asymmetric split. Left 55% headline + subhead + CTA. Right 45% visual proof (audit card artifact).
- **Mobile:** Stack vertically, visual below text.
- **BANNED:** Centered heroes, full-bleed background images, overlapping text on images

### Section Rhythm
- **Vertical spacing:** `clamp(4rem, 10vw, 8rem)` between major sections
- **Internal section padding:** `4rem` desktop, `2rem` mobile
- **Section delimiter:** Subtle background shift OR border-top, never both

### Feature Rows (Anti-Pattern Override)
- **BANNED:** Three equal-width cards side-by-side
- **USE:** 2-column zig-zag alternating, or asymmetric grid (large + 2 small), or horizontal scroll bands

### Proof Density
- **Logo bar:** 6–12 customer logos, single row, even grayscale opacity
- **Case study blocks:** Logo + metric + label + link. Consistent card height.
- **No testimonials, no case studies?** Use aggregate metrics (e.g., "139 pages audited") with visual counter treatment

---

## 6. Motion & Interaction

### Spring Physics (Default)
```css
--spring-stiffness: 100;
--spring-damping: 20;
```
Weighty, confident, not bouncy.

### Micro-Interactions (Perpetual)
- **Audit score reveal:** Counter animation 0 → score, 800ms, ease-out
- **Pass/Fail badges:** Pulse once on mount, then static
- **CTA buttons:** Scale 1.02 on hover, -1px translate on press
- **Scorecards:** Fade in with slight upward translate (`translateY(8px) → 0`)

### Staggered Reveals
- Lists of checks/teardowns mount with cascade delays: `delay: index * 60ms`
- Never instant wall-of-content

### Performance Constraints
- **Animate ONLY:** `transform`, `opacity`
- **NEVER animate:** `top`, `left`, `width`, `height`, `margin`
- **Reduced motion:** All animations cut to instant (`duration: 0.01ms`)

---

## 7. Signature Visual Moment

**The Audit Card Artifact.**

Every hero and results page features a **composed audit card** - not a screenshot, but a designed artifact:
- Score badge (large monospace number + grade)
- Top leak callout (accent border-left, bold finding text)
- Signal pills (Pass/Fail badges, 4–6 visible)
- Subtle card shadow, warm-tinted
- Inline with typography, not floating

This repeats across:
- Homepage hero (example card)
- Audit results page (live card)
- Teardown pages (findings summary)
- Benchmarks page (aggregate stats)

---

## 8. Anti-Patterns (Strictly BANNED)

**Typography:**
- ❌ Inter font
- ❌ Generic system fonts (`-apple-system`, `BlinkMacSystemFont`)
- ❌ Centered text blocks > 2 lines
- ❌ Screaming headlines (scale > 4rem)

**Color:**
- ❌ Pure black (`#000000`) - use Void Black instead
- ❌ Neon outer glows
- ❌ Multiple accent colors
- ❌ Purple/blue AI neon aesthetic
- ❌ Oversaturated accent (> 80%)

**Layout:**
- ❌ Centered heroes
- ❌ Three equal-width feature cards
- ❌ Full-bleed background images with text overlay
- ❌ Uncontained content (no max-width)
- ❌ Overlapping elements (text on images)

**Components:**
- ❌ Emojis in UI
- ❌ Generic placeholder names ("John Doe", "Acme")
- ❌ Fake rounded numbers (`99.99%`, `5000+`)
- ❌ AI copywriting clichés ("Elevate", "Seamless", "Unleash", "Next-Gen")
- ❌ Filler UI text ("Scroll to explore", "Swipe down")
- ❌ Broken image links (use `picsum.photos` or SVGs)

**Motion:**
- ❌ Linear easing (use spring physics)
- ❌ Instant list mounts (cascade required)
- ❌ Gratuitous particles/blobs/grain filters

---

## 9. Specific Homepage Composition

### Hero Section
**Left (55%):**
- H1: "Know exactly what's killing your conversions."
- Subhead: "Your ads work. The page doesn't. Nebula runs 9 evidence-backed checks against your actual HTML - finds the leak, with dollar math and the exact fix."
- Primary CTA: "Find My Leak - Free" (button)
- Secondary: "No signup. Results in <2 min." (text only, no link)

**Right (45%):**
- **Composed audit card artifact** (not screenshot):
  - Score: `67/100` (large mono, Nebula Teal)
  - Grade badge: `C+` (Signal Fail background)
  - Top leak callout: Left-border accent, 1-line finding
  - 6 signal pills: Pass/Fail mix, clearly visible
  - Subtle shadow, warm-tinted

### Calculator Section
- Retain bleed calculator, but design as **floating panel** with Warm Surface background, border, and generous padding
- Inputs: Clean, input-mode numeric where possible
- Result: Large monospace dollar amount, Signal Fail color

### Unfair Advantage Matrix
- Retain comparison table, but elevate:
  - Option cards with border-top divider instead of full cards
  - Checkmarks in Signal Pass green, X marks in Border Whisper gray
  - Nebula column: Accent border-left, slight `background: Teal Dim`
  - Mobile: Stack vertically, Nebula last (highlighted)

### Core Checks Section
- **BANNED:** 3-column equal card grid
- **USE:** 2-column grid, alternating (check name left, description right)
- Each check: Badge (Pass/Fail) + name + brief check description
- Visual rhythm: Consistent height, clear separation

### Teardowns Section
- 3 cards in a row: Logo + page URL + finding count badge + link
- Each card: Same height, border only, no shadow
- Mobile: Horizontal scroll OR vertical stack

### Final CTA Section
- Full-width Nebula Teal background
- White text: "Run the leak detection before you spend another dollar."
- CTA button: White fill, Nebula Teal text, dark on hover

---

## 10. Responsive Strategy

### Desktop (> 1024px)
- Hero: Asymmetric split (55/45)
- Feature rows: 2-column grid or asymmetrical layouts
- Max containment: 1400px

### Tablet (768–1024px)
- Hero: Stack vertically, card below text
- Feature rows: 2-column grids collapse to single column
- Section padding: 3rem

### Mobile (< 768px)
- **Single column everywhere.** No exceptions.
- Hero text: Full-width, left-aligned
- Audit card: Full-width, stack vertically
- Feature rows: Stack vertically
- Touch targets: Minimum 44px
- Typography: Clamp scale, min `16px` body
- No horizontal scroll

---

## Implementation Notes

1. **Fonts:** Install `Geist` and `JetBrains Mono` via `next/font` optimization. Load `Geist` as display + body, `JetBrains Mono` for code/numbers.

2. **Color tokens:** Replace Inter-specific references in globals.css with Geist. All hex values above are authoritative.

3. **Motion:** Use Framer Motion for orchestrated animations. Reduce motion preference must disable all non-essential animation.

4. **Polish pass:** Before deploying, audit for:
   - Centered text blocks > 2 lines
   - Inter font usage
   - Pure black backgrounds
   - Equal 3-column grids
   - Missing hover/focus states

5. **Performance:** All animations use `transform`/`opacity` only. No layout-thrashing properties.

---

This design system encodes premium, high-agency, non-generic visual language. Every decision intentional. No AI tells. No template defaults.
