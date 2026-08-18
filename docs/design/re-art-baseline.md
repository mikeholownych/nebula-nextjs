# Re-Art Baseline — Nebula Components

## Current Visual Language

**Palette:** Near-black background (`#050505`) with teal accent (`#00c2a0`). Muted grey foreground (`#9e9e9e`). Danger red (`#f37979`). Amber reserved for signal-fail state only.

**Typography:** Geist Sans + Geist Mono. Scale is functional — no display voice, no editorial character. Headings track at `-0.03em`. Weights mostly 700. No typographic hierarchy below heading level creates visual sameness across sections.

**Components:** Rounded cards (12px radius default) throughout. `border: rgba(255,255,255,0.06)` on almost everything. Section padding 100px. `card-default`, `section-default`, `heading-1/2/3` utility classes.

**Mark:** NebulaMark — 3×3 grid of pass/fail/neutral circles. Semantically rich, visually underused as a design device. Currently lives only in nav and footer at small size.

**Global chrome:** Fixed header with blur backdrop. 3 nav links + CTA button. Footer: 2-column brand + 3 nav columns + sitemap strip.

**Homepage structure (11 sections):**
1. Hero: asymmetric split, copy left, AuditCardArtifact right
2. ROICalculator inline component
3. StackTaxComparison component
4. Origin / honest proof (2-col text grid)
5. Core checks grid (9 signals)
6. HonestyGrid component
7. Teardown proof (named pages)
8. Patterns (dominant + 2)
9. HowItWorksAnimated
10. WithWithout comparison
11. Comparison table
12. "What the click proved" (3 divider articles)
13. Direct answers (3 cards)
14. Diagnostic Guides (2 link lists)
15. AgenticNativeBanner
16. Final CTA

## Current Strengths

- Color system is already semantic and well-constrained
- NebulaMark is a genuinely original brand device with product meaning
- Typography baseline is clean — Geist is a strong neutral
- Honest, evidence-first copy tone is a real differentiator
- Glyph animation logic (pass/fail states) is architecturally sound
- Accessibility foundations exist (focus states, reduced-motion, skip links)
- Responsive architecture is solid
- The `signal.fail` amber lock is a rare example of design discipline

## Current Weaknesses

1. **Teal accent is not ownable.** `#00c2a0` is generic "developer tool" teal — indistinguishable from dozens of dark SaaS properties.
2. **Glow orbs.** Fixed-position radial gradients in CSS. Exact anti-pattern for institutional credibility.
3. **Repetitive section rhythm.** Every section is `section-default` + heading + paragraph + cards or grid. No compositional variation.
4. **NebulaMark is underutilized.** The 3×3 grid is the most original visual device on the site but appears only at 16-22px in chrome.
5. **Border uniformity.** `rgba(255,255,255,0.06)` on every surface — no visual hierarchy through elevation or separation.
6. **Typography is not a design instrument.** No display scale exploited. No contrast between label/metadata type and heading type. All headings feel the same weight.
7. **Card radius monoculture.** `12px` everywhere. Rounded cards with a subtle border is not a design language — it is the absence of one.
8. **Stat numbers in the hero stat strip** are styled identically to body text — the numbers that should be the hero go unnoticed.
9. **Color count.** Accent teal appears everywhere (CTAs, links, stats, icons, tags, hover states) which dilutes its semantic value.
10. **Product visualization** (AuditCardArtifact) is presented adequately but not as a precision-engineered design artifact.

## Design System Structure

- `tailwind.config.ts` — token definitions
- `app/globals.css` — ~1,164 lines of global styles, many one-off class definitions
- No component library — styles scattered across page files and globals
- Tailwind JIT classes used inline in TSX throughout

## Brand Assets

- NebulaMark SVG + PNG at 64/128/256px (dark, emerald, light, mono variants)
- Wordmark SVG + PNG (dark/light)
- No illustration system
- No icon system beyond NebulaMark
- No diagram language

## Implementation Constraints

- Next.js 14 App Router, Tailwind 3, Geist fonts
- `signal.fail` amber must remain exclusively for conversion signal failure state
- No fabricated social proof
- Build must remain clean (TypeScript, lint)
- Performance must not regress
- All accessibility infrastructure must be preserved
