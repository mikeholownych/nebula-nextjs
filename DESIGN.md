# Nebula Design System — Typography

## Font Family

**Primary:** `Karla` (Google Fonts)
**Fallback:** `-apple-system, BlinkMacSystemFont, sans-serif`

---

## Type Ramp (5 sizes, 1.25 ratio)

| Token | rem | px | Use Case |
|-------|-----|-----|----------|
| `--text-xs` | 0.75rem | 12px | Captions, tags, legal |
| `--text-sm` | 0.875rem | 14px | Secondary UI, nav, metadata |
| `--text-base` | 1.0625rem | 17px | Body prose |
| `--text-lg` | 1.5rem | 24px | Section headings, subheads |
| `--text-xl` | clamp(2.5rem, 6vw, 4rem) | 40-64px | Hero display |

---

## Weight Ramp

| Weight | Role |
|--------|------|
| 400 | Body text, descriptions |
| 600 | Labels, buttons, navigation |
| 800 | Headlines, hero text |

---

## Line Heights

| Context | Value |
|---------|-------|
| Display (hero) | 1.1 |
| Headings | 1.2 |
| Body | 1.65 |
| UI labels | 1.5 |

---

## Letter Spacing

| Context | Value |
|---------|-------|
| Display (xl) | -0.03em |
| Body | 0 (default) |
| Labels (uppercase) | +0.1em |

---

## Anti-Patterns (Banned)

- ❌ Inter, Roboto, Fraunces, Geist, Plus Jakarta Sans, Space Grotesk
- ❌ Gradient text (`background-clip: text`)
- ❌ Font-size literals outside this ramp
