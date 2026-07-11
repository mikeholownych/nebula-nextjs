# Nebula Design Overhaul — Premium SaaS Transformation

**Date:** 2026-07-11
**Goal:** Transform from amateur DIY to professional SaaS credibility (Linear/Vercel tier)

---

## Current State Issues

### Typography
- ❌ Generic system font stack
- ❌ No weight variation (everything 700/800)
- ❌ No letter-spacing hierarchy
- ❌ Flat sizing (no clamp hero → body rhythm)

### Color
- ❌ Too many accent colors competing (blue, green, amber, yellow, red)
- ❌ Light theme default (lower perceived value)
- ❌ No systematic opacity levels
- ❌ Pill-shaped buttons (dated)

### Spacing
- ❌ Inconsistent padding (28px, 32px, 48px arbitrary)
- ❌ Tight section gaps (no breathing room)
- ❌ Cards with visible solid borders

### Depth
- ❌ Flat card styling
- ❌ No glassmorphism
- ❌ Basic hover states
- ❌ No shadow layering

### Visual Hierarchy
- ❌ Too many elements in hero (skeptic disarm, stats, nav, pills all fight for attention)
- ❌ Multiple CTAs with same visual weight
- ❌ No clear primary action path

---

## Target State (Linear-Inspired)

### Typography System
```
Font Family: Inter Variable (fallback: system-ui)
OpenType: 'cv01', 'ss03' enabled (geometric alternates)

Weight Ramp:
- 300: Light (de-emphasized text)
- 400: Regular (body)
- 510: Medium (UI labels, navigation — signature weight)
- 590: Semibold (strong emphasis)

Size Ramp with Letter-Spacing:
- 72px: -1.584px (hero)
- 48px: -1.056px (section headlines)
- 32px: -0.704px (major headings)
- 24px: -0.288px (sub-sections)
- 16px: normal (body)
- 13px: -0.13px (captions)

Line Heights:
- 1.00: Display (ultra-tight)
- 1.33: Headings
- 1.50: Body
- 1.60: Relaxed body
```

### Color Palette
```
Backgrounds (Dark Mode Native):
- #08090a: Marketing canvas (deepest)
- #0f1011: Panel backgrounds
- #191a1b: Elevated surfaces
- #28282c: Hover states

Text:
- #f7f8f8: Primary (not pure white)
- #d0d6e0: Secondary body
- #8a8f98: Muted/meta
- #62666d: Disabled

Accent (Nebula brand):
- #10b981: Emerald CTA (primary action)
- #059669: Emerald hover
- #34d399: Emerald light (status)

Borders:
- rgba(255,255,255,0.05): Subtle
- rgba(255,255,255,0.08): Standard

Buttons:
- Background: rgba(255,255,255,0.02) to 0.05 (ghost)
- Primary: #10b981 solid
- Radius: 6px (not pills)
```

### Spacing System
```
Base: 8px

Scale:
- 4px: Micro gaps
- 8px: Tight
- 16px: Medium
- 24px: Comfortable
- 32px: Section
- 48px: Major section
- 64px: Large gaps
- 96px: Hero padding

Section Padding:
- Desktop: 96px vertical
- Mobile: 64px vertical

Card Padding:
- Desktop: 32px
- Mobile: 24px
```

### Depth Model
```
Level 0 (Flat): #08090a bg
Level 1 (Subtle): rgba(0,0,0,0.03) shadow
Level 2 (Surface): rgba(255,255,255,0.05) bg + border
Level 3 (Elevated): Multi-layer shadow stack
Level 4 (Floating): Dropdowns, modals
Level 5 (Dialog): Maximum elevation

Shadow Strategy:
- No traditional shadows on dark (invisible)
- Semi-transparent white borders signal depth
- Background luminance stepping (darker = deeper)
- Inset shadows for recessed effect
```

### Component Styling

#### Buttons
```css
/* Ghost (Secondary) */
background: rgba(255,255,255,0.02);
border: 1px solid rgba(255,255,255,0.08);
color: #d0d6e0;
padding: 8px 16px;
border-radius: 6px;

/* Primary CTA */
background: #10b981;
color: #08090a;
padding: 14px 28px;
border-radius: 8px;
font-weight: 510;
box-shadow: 0 0 20px rgba(16,185,129,0.3); /* Glow */
```

#### Cards
```css
background: rgba(255,255,255,0.02);
border: 1px solid rgba(255,255,255,0.08);
border-radius: 16px;
padding: 32px;
box-shadow: rgba(0,0,0,0.2) 0px 0px 0px 1px;

/* Hover */
background: rgba(255,255,255,0.04);
border-color: rgba(255,255,255,0.12);
transform: translateY(-2px);
```

#### Inputs
```css
background: rgba(255,255,255,0.02);
border: 1px solid rgba(255,255,255,0.1);
color: #f7f8f8;
padding: 12px 14px;
border-radius: 6px;

/* Focus */
border-color: #10b981;
box-shadow: 0 0 0 3px rgba(16,185,129,0.2);
```

---

## Implementation Phases

### Phase 1: CSS Variables & Typography (lines 114-300)
- Replace root color palette
- Add Inter font with OpenType features
- Define typography ramp
- Update spacing system

### Phase 2: Component Styles (lines 118-250)
- Button overhaul (ghost + primary)
- Card glassmorphism
- Input dark mode styling
- Badge/pill redesign

### Phase 3: Hero Simplification (lines 298-344)
- Remove skeptic disarm (move below)
- Single stat line
- One primary CTA
- Reduce pill clutter

### Phase 4: Section Spacing (throughout)
- Increase vertical rhythm (32px → 64px gaps)
- Standardize section padding (96px desktop, 64px mobile)
- Add breathing room between cards

### Phase 5: Hover States & Micro-interactions
- Button glow effects
- Card lift on hover
- Smooth transitions (0.2s micro, 0.4s macro)
- prefers-reduced-motion support

---

## Code Changes

### index.html (lines 114-294)
Full CSS replacement with Linear-inspired system.

### audit-lander.html (lines 17-74)
Same design system, adapted for form-focused layout.

### primer.html
Apply same CSS variables for consistency.

---

## Expected Outcomes

### Before
- Looks like DIY builder output
- Multiple competing accents
- Flat, cluttered hero
- Amateur button styling
- Inconsistent spacing

### After
- Premium dark-mode aesthetic
- Single emerald accent (focused)
- Clean hero with clear hierarchy
- Professional button depth
- Consistent 8px grid system
- Glassmorphism cards
- Linear-level polish

---

## Verification

1. **Visual check:** `browser_vision` to compare to Linear
2. **Contrast ratios:** Ensure WCAG AA (4.5:1 minimum)
3. **Mobile:** Verify responsive typography scaling
4. **Performance:** CSS size should not exceed 15KB

---

## Design Tokens (Copy-Paste Ready)

```css
:root {
  /* Backgrounds */
  --bg-canvas: #08090a;
  --bg-panel: #0f1011;
  --bg-surface: #191a1b;
  --bg-elevated: #28282c;
  
  /* Text */
  --text-primary: #f7f8f8;
  --text-secondary: #d0d6e0;
  --text-muted: #8a8f98;
  --text-disabled: #62666d;
  
  /* Accent (Emerald) */
  --accent-primary: #10b981;
  --accent-hover: #059669;
  --accent-light: #34d399;
  
  /* Borders */
  --border-subtle: rgba(255,255,255,0.05);
  --border-standard: rgba(255,255,255,0.08);
  
  /* Spacing (8px grid) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 16px;
  --space-4: 24px;
  --space-5: 32px;
  --space-6: 48px;
  --space-7: 64px;
  --space-8: 96px;
  
  /* Typography */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  
  --text-xs: 10px;
  --text-sm: 13px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 24px;
  --text-2xl: 32px;
  --text-3xl: 48px;
  --text-4xl: 72px;
  
  --weight-light: 300;
  --weight-regular: 400;
  --weight-medium: 510;
  --weight-semibold: 590;
  
  /* Animation */
  --ease-micro: 0.2s ease;
  --ease-macro: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## Next Actions

1. ✅ Load Linear design system reference
2. ⏳ Delegate CSS generation (in progress)
3. ⏳ Apply to index.html (awaiting delegate)
4. ⏳ Apply to audit-lander.html
5. ⏳ Apply to primer.html
6. Verify with browser_vision
7. Test mobile responsiveness
8. Commit changes

---

**Status:** Awaiting delegate completion for index.html CSS overhaul.
