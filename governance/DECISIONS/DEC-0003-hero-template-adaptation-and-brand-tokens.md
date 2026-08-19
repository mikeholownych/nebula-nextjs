# DEC-0003: Hero Template Adaptation and Brand Token Alignment

**Status:** Active  
**Date:** 2026-08-19  
**Author:** Antigravity / Senior Design Engineer  
**Approved by:** Mike  

---

## 1. Decision

Adapt the high-impact spatial composition of the Questly hero template (full-viewport vertical flex rhythm, prominent 2-line staggered headline, floating pill search interaction bar, and docked 896px scaled browser mockup with foreground silhouette layering) specifically for Nebula Components. 

Rather than adopting the template verbatim (e.g. light pastoral grassy theme, generic SaaS generative copy), adapt the architecture into a bespoke, precision technical diagnostic instrument that reflects Nebula's Brand v2 design tokens, 9 governed conversion signals, Priority Score heuristic ranking, and strict evidence boundaries.

---

## 2. Context & Requirements

1. **Brand System Alignment:** Must strictly adhere to Nebula Brand v2 tokens (`#080909`, `#0d0f0e`, `#131615`, `#191c1a`, `#e8ebe7`, `#7a8078`, `#525750`, `#c7ff2f`, `#f59e0b`). Deprecated teal/emerald (`#00c2a0`, `#10b981`) must not be used.
2. **Diagnostic Authority:** Must communicate empirical measurement, DOM inspection, and verifiable evidence rather than speculative conversion lift or generic AI promises.
3. **Evidence Boundaries:** Public copy must not claim to "prove why a page failed to convert", predict conversion rates, or evaluate ad targeting.
4. **Spatial Layout & Layering:** Retain Questly's dramatic spatial layering and docked dashboard, replacing pastoral grass with a custom SVG `SignalHorizon` (diagnostic waveform & measurement calibration terrain) grounding the dashboard in real telemetry.

---

## 3. What Changed

| Component / Surface | Questly Baseline | Nebula Adapted Unique Implementation |
|---|---|---|
| **Atmosphere / Canvas** | Light pastoral background, rural gradient | Deep space titanium (`#080909`), radial Chartreuse (`#c7ff2f`) glow, calibration grid |
| **Foreground Overlay** | `grass_eam204.png` silhouette | Custom SVG `SignalHorizon` with glowing signal waveform, pulse nodes, scanlines |
| **Headline** | "Get cited. Effortlessly." | "Find page-side leaks. Before blaming the traffic." (2-line staggered fade-up) |
| **Search / Action Bar** | White pill with search query | Dark glassmorphism pill with URL validation, animated diagnostic progress steps |
| **Description Copy** | AI citation generation | Observable DOM evaluation against 9 governed signals with inline `NebulaMark` |
| **Dashboard Mockup** | 2-column article drafting tool | 2-column Conversion Diagnostic Lab: 9 Signals, Priority Scores, Evidence Atoms |
| **Responsive Scaling** | Fixed 896px `ResizeObserver` scaler | Fixed 896px `ResizeObserver` `ScaledDashboard` wrapper |
| **Navigation** | Toolkit dropdown, Plans, News | Diagnostics dropdown (Signals, Priority Model, Teardowns), Benchmarks, Repair Sprints ($97) |

---

## 4. Governance & Claim Verification

- **Governed Signals:** 9 active signals registered in `customer-portal/config/signals.canon.json` and `src/config/product.ts`.
- **Repair Sprint Offer:** $97 One-Leak Repair Sprint synchronized with Stripe Price ID `price_1TwYwlEINR1kU9chLpOPfOJD` and `CLAIM_REGISTER.md`.
- **Evidence Atom Schema:** All diagnostic findings reflect rule IDs (`CTA_INITIAL_VIEWPORT_V3`, `HEADLINE_OUTCOME_SPECIFICITY_V2`, etc.) and explicit diagnostic boundaries.

---

## 5. Audit Trail

- Implementation files:
  - `src/components/Hero.tsx`
  - `src/components/Navbar.tsx`
  - `src/components/DashboardMockup.tsx`
  - `src/components/ScaledDashboard.tsx`
  - `src/components/SignalHorizon.tsx`
  - `src/components/NebulaLogo.tsx`
  - `src/config/brand.ts`
  - `src/config/product.ts`
- Decision record committed to `governance/DECISIONS/DEC-0003-hero-template-adaptation-and-brand-tokens.md`.
