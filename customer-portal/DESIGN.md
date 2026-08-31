---
name: Nebula Components
description: Evidence-backed landing-page conversion diagnostics, clinical authority, chartreuse accent, near-black foundation
colors:
  bg: "#050505"
  bg-elevated: "#0a0a0a"
  bg-panel: "#111111"
  bg-muted: "#0d0d0d"
  accent: "#c7ff2f"
  accent-dim: "rgba(199, 255, 47, 0.10)"
  accent-mid: "rgba(199, 255, 47, 0.20)"
  fg: "#ffffff"
  fg-muted: "#9e9e9e"
  fg-dim: "#666666"
  signal-fail: "#f59e0b"
  danger: "#f37979"
  border: "rgba(255, 255, 255, 0.06)"
  border-border: "rgba(255, 255, 255, 0.06)"
typography:
  fontFamily: "Geist Sans (local package, exposed as --font-geist-sans)"
  display:
    fontSize: "clamp(2.5rem, 6vw, 4rem)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.02em"
  headline:
    fontSize: "clamp(2rem, 4vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  button: "6px"
  card: "8px"
  pill: "100px"
components:
  button-primary:
    backgroundColor: "#c7ff2f"
    textColor: "#050505"
    borderRadius: "6px"
    padding: "12px 24px"
    hoverOpacity: 0.85
  card-default:
    backgroundColor: "#111111"
    border: "1px solid rgba(255,255,255,0.06)"
    borderRadius: "8px"
  card-feature:
    backgroundColor: "#0a0a0a"
    border: "1px solid rgba(199,255,47,0.12)"
    borderRadius: "8px"
---

# Design System: Nebula Components, v2 (Chartreuse / Aug 2026)

## Creative North Star

Clinical diagnostic authority. Not a lifestyle brand, not a SaaS dashboard. A precision instrument that finds specific, evidenced defects on landing pages. The chartreuse accent (#c7ff2f) marks only what matters: CTAs, pass indicators, active states, key data values. Everything else is near-black and white.

**The v1 to v2 change:** The previous accent palette was retired. Chartreuse (#c7ff2f) is the single accent color. This is a hard, permanent decision. No teal anywhere on the site.

## Brand Mark

`<NebulaLogo />` from `components/NebulaMark.tsx`, a 3×3 grid of dots in chartreuse (pass) and dimmed neutral. Never the old "N" lettermark with teal background.

## Anti-patterns (permanently banned)

- Retired teal palette or any hardcoded teal variant
- Glow orbs (large blur radial gradients for atmosphere)
- Gradient text (background-clip: text)
- Em-dashes (U+2014 or &mdash;) anywhere in content
- Eyebrow labels on every section
- Identical card grids
- Hero-metric template (big number + small label as decoration)
- `warning`, `text-warning`, `bg-warning` Tailwind classes (removed intentionally)
- `signal-fail` / amber (#f59e0b) used for anything other than failed audit signals

## Section spacing

- `section-default`: `py-20 px-6`
- Max width: `max-w-6xl mx-auto`
- Section separator: `border-t border-border` only where structurally needed

## Navigation

SiteNav (`components/SiteNav.tsx`): NebulaLogo + "Nebula Components" wordmark | Pricing | Learning | Teardowns | Workspace (links to app.nebulacomponents.com) | "Free Audit" CTA (bg-accent, text-bg, rounded)

## Footer

SiteFooter (`app/components/SiteFooter.tsx`): 4-column layout (Product | Audit Types | Learn | Nebula) + CTA strip + copyright bar with Google Preferred Sources button + VisibAI badge.

## Art direction freeze (2026-08-31)

Do not redesign the homepage hero, lime interruption, black field, diagnostic case file, nine-signal sequence, Citable strip, or Repair Sprint visual model. Remaining work is system codification, desktop validation, accessibility, and sitewide consistency.

Banned additions: rounded SaaS cards, gradient blobs, glassmorphism, generic icon grids, extra typefaces, extra accent colors, invented social proof, sticky CTA without an A/B test.

## Exposed diagnostic frame

Brand infrastructure. Vertical rails survive section boundaries.

- `--frame-max`: 1296px
- `--frame-gutter`: 20px / 32px / 48px
- `--frame-rail`: 7.5%
- `--frame-rule`: 1px
- `.nebula-document`: persistent left/right rails under the nav
- `.nebula-frame`: content inset
- `.nebula-signal`: 280px min-height, shared padding for 01/09 through 09/09

## Diagnostic vocabulary

CASE FILE, CONDITION, EVIDENCE, PASS / FAIL / REVIEW, PRIORITY, OBSERVED.
Public teardowns carry `PUBLIC AUDIT / NOT A CUSTOMER`.
Dataset provenance uses instrumentation: `DATASET / Q3-2026 / N=293 / COMPLETED AUDITS / METHODOLOGY`.
Repair lifecycle: 01 Audit / 02 Isolate / 03 Repair / 04 Re-audit.

## Homepage structure (canonical, Aug 2026 overhaul)

1. Hero, pain-first, URL input, trust strip, social proof row
2. Proof numbers, 62%/39%/40% stat cards from 293 audits
3. Output format, what the audit actually returns (monospace sample)
4. 9 signals, pass/fail grid
5. Citable CLI strip, open source verification
6. Public teardown evidence, knallhart.dev, postmint.de, basecamp.com
7. Repair Sprint offer, $97, 48h, one finding
8. Evidence boundary, what we prove, what we don't
9. FAQ
10. Final CTA

## Positioning

"The problem was never the ad. It was the page."
ICP: founder spending $500+/mo on paid ads, getting clicks, not getting conversions.
