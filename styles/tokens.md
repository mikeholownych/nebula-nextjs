# Nebula Design Tokens

**Version:** 1.0
**Last Updated:** 2026-07-14

---

## Color Tokens

### Brand Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#050505` | Primary background |
| `--bg-elevated` | `#0a0a0a` | Card backgrounds |
| `--fg` | `#f9f9f9` | Primary text |
| `--fg-muted` | `#666` | Secondary text |
| `--accent` | `#10b981` | Primary accent (emerald) |
| `--border` | `#1a1a1a` | Borders |

### Semantic Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--success` | `#10b981` | Success states |
| `--warning` | `#f59e0b` | Warning states |
| `--error` | `#ef4444` | Error states |
| `--info` | `#3b82f6` | Info states |

### Accent Variants
| Token | Value | Opacity |
|-------|-------|---------|
| `--accent-glow` | `rgba(16, 185, 129, 0.15)` | 15% |
| `--accent-light` | `rgba(16, 185, 129, 0.1)` | 10% |
| `--accent-hover` | `#059669` | - |

---

## Typography Tokens

### Font Family
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Font Sizes
| Token | Size | Usage |
|-------|------|-------|
| `--text-xs` | `12px` | Badges, labels |
| `--text-sm` | `14px` | Meta text, captions |
| `--text-base` | `17px` | Body text |
| `--text-lg` | `20px` | Large body |
| `--text-xl` | `24px` | Subheadings |
| `--text-2xl` | `32px` | H3 |
| `--text-3xl` | `48px` | H2 |
| `--text-4xl` | `68px` | H1 |

### Font Weights
| Token | Value | Usage |
|-------|-------|-------|
| `--font-normal` | `400` | Body text |
| `--font-medium` | `500` | Emphasis |
| `--font-semibold` | `600` | Headings |
| `--font-bold` | `700` | Strong emphasis |
| `--font-extrabold` | `800` | Hero text |

### Line Heights
| Token | Value | Usage |
|-------|-------|-------|
| `--leading-tight` | `1.1` | Headings |
| `--leading-snug` | `1.3` | Subheadings |
| `--leading-normal` | `1.65` | Body text |
| `--leading-relaxed` | `1.75` | Long form |

---

## Spacing Tokens

### Base Scale
| Token | Value |
|-------|-------|
| `--space-0` | `0` |
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `20px` |
| `--space-6` | `24px` |
| `--space-8` | `32px` |
| `--space-10` | `40px` |
| `--space-12` | `48px` |
| `--space-16` | `64px` |
| `--space-20` | `80px` |

---

## Border Tokens

### Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `4px` | Small elements |
| `--radius` | `8px` | Inputs, buttons |
| `--radius-lg` | `12px` | Cards |
| `--radius-xl` | `16px` | Large cards |
| `--radius-2xl` | `24px` | Hero sections |
| `--radius-full` | `9999px` | Pills, avatars |

### Border Width
| Token | Value |
|-------|-------|
| `--border-0` | `0` |
| `--border` | `1px` |
| `--border-2` | `2px` |

---

## Shadow Tokens

| Token | Value |
|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0, 0, 0, 0.3)` |
| `--shadow` | `0 4px 12px rgba(0, 0, 0, 0.4)` |
| `--shadow-lg` | `0 8px 24px rgba(0, 0, 0, 0.5)` |
| `--shadow-xl` | `0 16px 48px rgba(0, 0, 0, 0.6)` |
| `--shadow-glow` | `0 0 24px rgba(16, 185, 129, 0.3)` |

---

## Animation Tokens

### Durations
| Token | Value |
|-------|-------|
| `--duration-fast` | `150ms` |
| `--duration` | `200ms` |
| `--duration-slow` | `300ms` |
| `--duration-slower` | `500ms` |

### Easing
| Token | Value |
|-------|-------|
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` |

---

## Breakpoint Tokens

| Token | Value |
|-------|-------|
| `--breakpoint-sm` | `640px` |
| `--breakpoint-md` | `768px` |
| `--breakpoint-lg` | `1024px` |
| `--breakpoint-xl` | `1280px` |
| `--breakpoint-2xl` | `1536px` |

---

## Z-Index Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--z-below` | `-1` | Behind content |
| `--z-base` | `0` | Default |
| `--z-dropdown` | `10` | Dropdowns |
| `--z-sticky` | `20` | Sticky headers |
| `--z-fixed` | `30` | Fixed elements |
| `--z-modal` | `40` | Modals |
| `--z-popover` | `50` | Popovers |
| `--z-tooltip` | `60` | Tooltips |

---

## Usage Guidelines

### DO ✅
- Use tokens for all design values
- Reference tokens in custom CSS
- Maintain consistency across pages
- Document new tokens

### DON'T ❌
- Hardcode color values
- Mix token and non-token values
- Create duplicate tokens
- Skip tokens for one-off values

---

## Token Updates

When adding new tokens:
1. Check if existing token works
2. Follow naming convention
3. Document in this file
4. Update base styles
5. Test across all pages

---

## Example Usage

```css
/* Good: Using tokens */
.custom-card {
  background: var(--bg-elevated);
  color: var(--fg);
  border: var(--border) solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow);
}

/* Bad: Hardcoding values */
.custom-card {
  background: #0a0a0a;
  color: #f9f9f9;
  border: 1px solid #1a1a1a;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}
```

---

## Migration Checklist

- [ ] Replace all hardcoded colors
- [ ] Replace all hardcoded spacing
- [ ] Replace all hardcoded fonts
- [ ] Update all components to use tokens
- [ ] Document any new tokens
- [ ] Test across all 41 pages

---

**Status:** Active
**Next Update:** Ongoing as needed
