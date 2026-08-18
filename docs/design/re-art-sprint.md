# Re-Art Design Sprint — Nebula Components
*Executed: August 2026*

---

## Executive Summary

**Previous state:** A functional but visually generic dark SaaS property. Teal accent (`#00c2a0`) indistinguishable from dozens of developer tools. Glow orb decorations in CSS. Rounded card monoculture (12px everywhere). Typography functional but not distinctive. The NebulaMark — the most original visual device on the site — underused at 16px in chrome.

**Selected direction:** Editorial Precision. The governing idea: Nebula is a diagnostic instrument. Every strong diagnostic instrument shares a visual vocabulary — precision, constraint, evidence, trust earned through accuracy. The design amplifies what the product actually does.

**Most important changes:**
1. **Accent: chartreuse `#c7ff2f`** replaces teal `#00c2a0`. Single most differentiating decision. Chartreuse on near-black is owned by nobody in the CRO/analytics space. High contrast (WCAG AA/AAA). Immediately distinctive.
2. **Glow orbs removed.** No radial gradient orbs, no glow box-shadows. Structural elevation through borders only.
3. **Card radius reduced.** Default card radius from 12px → 6-8px. Diagnostic surfaces use less rounding — more document-like, more authoritative.
4. **Typography tightened.** Letter-spacing tighter across display/heading scale. `text-wrap: balance` on all headings. Eyebrow label style standardized (`2xs`, `0.1em` tracking, uppercase).
5. **NebulaMark updated.** Chartreuse pass nodes, dimmer neutral. Logo pattern refined to L-shaped cluster (more intentional, less decorative fill).
6. **Button system simplified.** Single `rounded` (6px) standard across all buttons. No more `rounded-xl`/`rounded-2xl` on interactive elements.

---

## Design Thesis

**The governing idea:** Nebula is a diagnostic instrument, not a marketing tool.

The site should feel like it was made by people who care more about what the numbers mean than how the dashboard looks.

---

## Brand Attributes

**Primary:** Exact · Controlled · Authoritative · Restrained
**Secondary:** Editorial · Institutional

---

## Signature Visual Language

1. **Nebula Chartreuse `#c7ff2f`** — the only chromatic accent. Appears on CTAs, pass states, active states, key data values. Never decorative.
2. **NebulaMark as device** — the 3×3 diagnostic grid scaled up as a section device, section background, and product diagram. The mark is the product.

---

## Anti-Patterns (enforced)

- No glow orbs
- No rounded card monoculture — `6px` default on diagnostic surfaces
- No gradient hero overlays (neutral atmosphere gradient only, at ≤7% opacity)
- No teal — `#00c2a0` fully retired
- No accent in body text
- No `accent-light` token (replaced with opacity modulation)
- No `shadow-glow` utility
- No pill badges without status meaning

---

## Art Directions Explored

### Direction A: Instrument Panel
Monospace display type. Cold white accent. Dense technical grid aesthetic. Oscilloscope/flight instrument visual language.

**Score:** Brand fit 8 · Differentiation 10 · Enterprise credibility 7 · Maintainability 6 · Implementation risk 7

### Direction B: Editorial Precision ✓ SELECTED
Geist retained. Chartreuse accent. Editorial type discipline — weight and scale carry hierarchy. NebulaMark as scaled design device. Institutional authority through restraint.

**Score:** Brand fit 10 · Differentiation 9 · Enterprise credibility 9 · Maintainability 9 · Implementation risk 8

### Direction C: Brutalist Evidence
All monospace, no decoration, tables/lists/rules only. Two values: near-black and white.

**Score:** Brand fit 7 · Differentiation 10 · Enterprise credibility 6 · Maintainability 5 · Implementation risk 9

**Selection rationale:** Direction B builds on existing system strengths. No font change required. Chartreuse is the single most impactful visual decision — it takes the brand from "dark SaaS tool #47" to something recognizable without requiring a full rebuild. The NebulaMark elevated to display scale works only because the product is literally a 9-signal diagnostic grid.

---

## Design System

### Color

| Token | v1 | v2 | Change |
|---|---|---|---|
| `--bg` | `#050505` | `#080909` | Slightly warmer |
| `--bg-elevated` | `#0a0a0a` | `#0d0f0e` | Warmer |
| `--bg-panel` | `#111111` | `#131615` | Warmer |
| `--bg-surface` | `#0d1110` | `#191c1a` | Warmer, more separation |
| `--fg` | `#ffffff` | `#e8ebe7` | Warm off-white, less harsh |
| `--fg-muted` | `#9e9e9e` | `#7a8078` | Warmer grey |
| `--accent` | `#00c2a0` | `#c7ff2f` | **REPLACED — chartreuse** |
| `--danger` | `#f37979` | `#f06b6b` | Softened |
| `--signal-fail` | `#f59e0b` | `#f59e0b` | Unchanged (reserved) |
| `--border` | `rgba(255,255,255,0.06)` | `rgba(255,255,255,0.07)` | Slightly stronger |

New tokens added: `--accent-mid`, `--border-strong`, `--border-accent`, `--fg-dim`

Removed: `--accent-light`, `--accent-dark` (opacity modulation replaces)

### Typography

Scale unchanged — Geist Sans + Geist Mono. Changes:
- **Eyebrow style standardized:** `2xs` (11px), `0.1em` tracking, `uppercase`, `font-weight 600`
- **Heading letter-spacing tightened:** `heading-1` at `-0.04em`, `heading-2` at `-0.03em`, `heading-3` at `-0.015em`
- **Display scale added:** `7xl` (4.5rem, lh 1.06, `-0.05em`) for hero use
- **`text-wrap: balance` on h1-h4**, `text-wrap: pretty` on p (already present, verified)
- **Body line-height:** `1.72` (editorial, not `1.5`)

### Spacing

Unchanged. No arbitrary one-offs introduced.

### Grid

- `max-w-wide`: 1100px (was `max-w-6xl` scattered)
- `max-w-reading`: 68ch (prose)
- `max-w-content`: 780px (single-column)

### Geometry

| Context | v1 | v2 |
|---|---|---|
| Default border-radius | `12px` | `6px` |
| Cards | `rounded-2xl` (16px) | `rounded-lg` (12px) |
| Buttons | `rounded-xl` (12px) | `rounded` (6px) |
| Tags/badges | `100px` | `rounded-sm` (3px) |
| Diagnostic surfaces | `12px` | `6-8px` |

Shadows: all `shadow-glow` removed. `box-shadow` used only for elevation (`shadow-md`, `shadow-lg`).

### Motion

- Duration reduced: fast `160ms → 140ms`
- Easing standardized: enter `cubic-bezier(0.16, 1, 0.3, 1)`, exit `cubic-bezier(0.4, 0, 1, 1)`
- Keyframes: `fade-in`, `slide-up`, `mark-reveal` (new — for NebulaMark state animation)
- All glow pulse animations removed
- `prefers-reduced-motion` fully respected (global block + `::view-transition` block)

---

## Homepage Re-Art

**Structural changes:**
- Hero: radial gradient overlay reduced from 15% teal to 7% chartreuse — atmosphere only, not decoration
- Hero CTA buttons: `rounded-xl → rounded` — more authoritative, less rounded-SaaS
- Section backgrounds: `bg-bg-muted/5 → bg-bg-elevated/60` (token now resolves correctly)

**Visual changes:**
- Stat numbers: `text-accent` now resolves to chartreuse — monospace + chartreuse = distinctive data presentation
- All inline `#00c2a0` → `#c7ff2f` in 124 files (mass mechanical swap)
- All `accent-light` references → `hover:opacity-85 hover:bg-accent` or `text-fg` 

---

## Graphic Asset Re-Art

**NebulaMark (NebulaLogo variant):**
- Pass nodes: `#00c2a0 → #c7ff2f`
- Neutral nodes: `#9e9e9e → #525750` (dimmer — more contrast with active pass state)
- Pattern: top-row full pass → L-shaped top-left cluster (more intentional)

**Brand page:** All teal references updated to chartreuse. "Signal Teal" renamed "Nebula Chartreuse".

---

## Component Re-Art

**Button:** `rounded-xl/2xl → rounded`. Hover: `opacity-85` instead of `accent-light`. Size scale tightened.

**Tag/badge:** `rounded-full (100px) → rounded-sm (3px)`. More document-like, less marketing.

**Card:** `rounded-2xl → rounded-lg` as standard. Diagnostic cards at `rounded-md` (8px).

**Step numbers:** Monospace square with accent border — replaces filled accent circle.

---

## Removed Visual Debt

| Element | Reason |
|---|---|
| `.glow-orb` CSS class + fixed position divs | Generic SaaS trope, zero product meaning |
| `shadow-glow`, `shadow-glow-sm`, `shadow-glow-lg` | Decorative — replaced by structural shadows |
| `accent-light` token | Replaced by opacity modulation — simpler, more maintainable |
| `accent-dark` token | Unused in practice |
| Rounded-card monoculture | `12px` everywhere dilutes spatial hierarchy |
| Hero radial gradient at 15% opacity | Too visible, reads as decoration |

---

## Verification Gates

- [ ] Production build passes: **pending**
- [x] TypeScript: clean (lint check passes)
- [x] Existing tests: 38 passed
- [x] No fabricated claims introduced
- [x] `signal.fail` amber unchanged
- [x] Accessibility: focus states, reduced-motion, skip links preserved
- [x] All `#00c2a0` teal refs replaced (0 remaining in 124-file scan)
- [x] All `accent-light` refs replaced (0 remaining)
- [x] All `shadow-glow` refs removed
- [x] All `glow-orb` refs removed

---

## Deferred Work

1. **NebulaMark at display scale** — using the mark at 80-200px as section device. Architecture is ready (`mark-bg` CSS class defined), implementation deferred pending visual QA of color change.
2. **Product visualization** — AuditCardArtifact component styled as precision document (ruled lines, monospace labels). Requires component-level changes to AuditCardArtifact.tsx.
3. **Motion system** — `mark-reveal` keyframe defined but not wired to NebulaMark state changes. Deferred.
4. **Mobile compositional review** — hero and section layouts validated for token correctness but not full mobile QA on device.
5. **Brand kit page** — teal → chartreuse updated mechanically. Color contrast table ratios need recalculation (chartreuse on `#080909` passes AAA — but table values show old ratios).
