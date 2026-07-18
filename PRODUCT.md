# Nebula Components — Design System

## Brand

**Positioning:** Conversion-focused landing page audit for founders bleeding money on ads with zero conversions.
**Personality:** Calm certainty. Clinical confidence. Not hype.
**Aesthetic:** Near-black, emerald accent, precise typography. Rejects generic SaaS cream and black-box AI.

---

## Typography

### Font
**Primary:** Karla (Google Fonts)
- Weights: 400 (body), 600 (labels), 800 (display)
- Fallback: `-apple-system, system-ui, sans-serif`

### Type Scale (1.25 ratio)

| Token | rem | px | Use Case |
|-------|-----|-----|----------|
| `--text-xs` | 0.75rem | 12px | Captions, tags, legal |
| `--text-sm` | 0.875rem | 14px | Secondary UI, nav, metadata |
| `--text-base` | 1.0625rem | 17px | Body prose |
| `--text-lg` | 1.5rem | 24px | Section headings, subheads |
| `--text-xl` | clamp(2.5rem, 6vw, 4rem) | 40-64px | Hero display |

### Weight Strategy

| Weight | Role |
|--------|------|
| 400 | Body text, descriptions |
| 600 | Labels, buttons, navigation |
| 800 | Headlines, hero text |

### Line Height

| Context | Value |
|---------|-------|
| Display (hero) | 1.1 |
| Headings | 1.2 |
| Body | 1.65 |
| UI labels | 1.5 |

### Letter Spacing

| Context | Value |
|---------|-------|
| Display (xl) | -0.03em (floor) |
| Body | 0 (default) |
| Labels (uppercase) | +0.1em |

---

## Color

### Backgrounds

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | #050505 | Canvas |
| `--bg-elevated` | #0a0a0a | Panels |
| `--bg-panel` | #111111 | Cards, inputs |

### Text

| Token | Value | Contrast |
|-------|-------|----------|
| `--fg` | #ffffff | 21:1 |
| `--fg-muted` | #737373 | 4.67:1 (AA) |

### Accent

| Token | Value | Use |
|-------|-------|-----|
| `--accent` | #10b981 | Primary CTA |
| `--accent-light` | #34d399 | Hover |
| `--accent-dim` | rgba(16, 185, 129, 0.1) | Backgrounds |

### Borders

| Token | Value |
|-------|-------|
| `--border` | rgba(255, 255, 255, 0.06) |
| `--radius` | 12px |

---

## Spacing

8px grid system:
- `--space-1`: 4px
- `--space-2`: 8px
- `--space-3`: 16px
- `--space-4`: 24px
- `--space-5`: 32px
- `--space-6`: 48px
- `--space-7`: 64px
- `--space-8`: 96px

---

## Anti-Patterns (Banned)

- ❌ Inter, Roboto, Fraunces, Geist, Plus Jakarta Sans, Space Grotesk
- ❌ Gradient text (`background-clip: text`)
- ❌ Glassmorphism as default
- ❌ Side-stripe borders
- ❌ Identical card grids
- ❌ Eyebrow on every section
- ❌ `border-radius: 32px+` on cards

---

## Register

**Brand register:** Marketing, landing page, portfolio — design IS the product.
**Reference:** `~/.hermes/skills/impeccable/reference/brand.md`
