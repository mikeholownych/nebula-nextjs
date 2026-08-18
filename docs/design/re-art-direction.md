# Re-Art Direction — Nebula Components

## Design Thesis

**The governing idea:** Nebula is a diagnostic instrument, not a marketing tool.

Every strong diagnostic instrument — oscilloscopes, spectrometers, flight instruments, surgical imaging — shares a visual vocabulary: precision, constraint, evidence, and trust earned through accuracy rather than appeal. The design should feel like it was made by people who care more about what the numbers mean than how the dashboard looks.

The visual language is built from the product's core mechanic: the 9-signal grid. This is not a marketing motif. It is the actual architecture of how Nebula reads a page. The design system amplifies what already exists.

---

## Brand Attributes

**Primary:**
- Exact — every number means something, every mark is placed deliberately
- Controlled — the system does not decorate; it diagnoses
- Authoritative — earned through evidence, not assertion
- Restrained — less is always the default

**Secondary:**
- Editorial — text is a design material
- Institutional — this could appear in a procurement document without embarrassment

**Explicitly not:**
- Friendly
- Playful
- Futuristic
- Minimal in the "we removed everything" sense

---

## Three Art Directions Explored

### Direction A: "Instrument Panel"

**Concept:** The site as a precision diagnostic console. Aesthetic draws from medical imaging, aviation instruments, and scientific data systems.

**Typography:** DM Mono as the primary display typeface. Numbers and labels in monospace throughout. Body in system sans. Numeric hierarchy is the primary design instrument.

**Color:** Warm off-white on near-black. Accent: cold white `#e8eae6`. Data values in the same cold white at varying opacity. Signal colors (pass/fail) are the only chromatic values.

**Layout:** Dense. Technical annotation style. Grid lines visible. Strict horizontal bands.

**Imagery:** Cropped, high-contrast renderings of the audit card itself. No orbs, no gradients.

**Graphic device:** Technical annotation lines with coordinate labels. Data tables as visual proof.

**Product presentation:** Audit output rendered at near-full size with annotation callouts. The report *is* the product visualization.

**Strengths:** Extremely differentiated. No SaaS competitor uses this language. Screams accuracy.

**Risks:** Can read as cold or off-putting. Requires disciplined execution or looks amateur. Monospace display typography is a strong bet.

**Scores:**
- Brand fit: 8 — diagnosis product maps perfectly
- Differentiation: 10 — genuinely unique
- Enterprise credibility: 7 — depends on execution
- Product clarity: 9 — the product IS the instrument
- Maintainability: 6 — requires careful extension
- Accessibility: 8 — high contrast by default
- Scalability: 7 — complex to extend to content pages
- Implementation risk: 7 — significant type/token change

---

### Direction B: "Editorial Precision" ✓ SELECTED

**Concept:** The site as a serious institutional document. Aesthetic draws from financial journalism, annual reports, and the better end of academic publishing — not "editorial" as in magazine, but editorial as in: every word and every mark is considered, nothing is decorative, the composition carries authority through restraint.

**Typography:** Geist Sans retained (no font change, lower implementation risk). The change is in *how* it is used. Display text set large, tracked tighter, with deliberate weight contrast. A secondary type style for data/labels using Geist Mono. No decorative use of type — weight and scale carry hierarchy.

**Color:** Accent replaced. Current teal `#00c2a0` → cold white-green `#c7ff2f` (the Nebula Chartreuse). This is the only change to the palette. It is visually distinct from every competitor while remaining within the dark-mode technical space. It reads as precise, not aggressive.

**Layout:** Maximum width tightened. Left-aligned composition on content. Section rhythm varies — some sections use full-bleed horizontal bands, others use asymmetric columns, others use a single centered editorial column.

**Graphic device:** The NebulaMark 3×3 grid scales up. Used at display size (80-120px) as a section mark, as a large background device at 10% opacity, and as an animated state diagram in product explanation sections.

**Product presentation:** The AuditCardArtifact is styled as a precision document — ruled lines, monospace data labels, no rounded corners. Findings rendered as a data table, not a card stack.

**Motion:** Entrance transitions only. Fast, physics-based. Reduced-motion respected. The audit card state changes (neutral → pass/fail) are the signature animation.

**Strengths:** Maintains brand continuity (no font change). Chartreuse accent is genuinely ownable. NebulaMark as a scaled graphic device is novel and semantically correct. Institutional credibility is high. Implementation risk is moderate.

**Risks:** Chartreuse is a strong bet — needs disciplined constraint to avoid garish. NebulaMark at large scale must be handled carefully or it looks like a pattern tile.

**Scores:**
- Brand fit: 10 — precision instrument meets editorial authority
- Differentiation: 9 — chartreuse + mark = recognizable signature
- Enterprise credibility: 9 — restrained, documented, evidence-first
- Product clarity: 9 — mark carries product meaning
- Maintainability: 9 — token swap + extended use of existing system
- Accessibility: 9 — chartreuse on near-black passes WCAG AA/AAA
- Scalability: 9 — system extends cleanly to all content types
- Implementation risk: 8 — moderate, no full rewrite required

---

### Direction C: "Brutalist Evidence"

**Concept:** No decoration at all. Copy only. Tables, lists, ruled lines. If it is not data, it does not exist. Black on black with white type. Every metric displayed in a table. No cards. No icons.

**Typography:** All monospace. No display hierarchy. Information is the visual.

**Color:** Two values: near-black and white. Signal red/green for pass/fail only.

**Strengths:** Radically differentiated. Entirely uncopied in the CRO space.

**Risks:** Extreme execution risk. Reading resistance. No designed conversion surface. Inconsistent with any secondary page.

**Scores:**
- Brand fit: 7
- Differentiation: 10
- Enterprise credibility: 6 (reads cheap if not perfect)
- Product clarity: 8
- Maintainability: 5
- Accessibility: 9
- Scalability: 4
- Implementation risk: 9

---

## Selected Direction: B — Editorial Precision

**Rationale:**

Direction B is the only option that simultaneously achieves genuine differentiation, institutional credibility, and implementation feasibility. It builds on the existing system's strengths (Geist, NebulaMark, semantic color discipline) rather than replacing them. The accent change from teal to chartreuse is the single most impactful visual decision in the sprint — it takes the brand from "dark SaaS tool #47" to something recognizable. The NebulaMark elevated to display scale is a design move that no competitor can copy because it only works if your product is literally a 9-signal diagnostic grid.

Direction A would require significant typography change and risks cold/alienating on conversion surfaces.
Direction C is a bet that requires perfect copy on every surface and fails on any weak page.

---

## Visual Principles

1. **The mark is the system.** The 3×3 NebulaMark is the primary graphic device. Every use must be intentional and semantically defensible.

2. **Chartreuse only earns its place.** The accent color (`#c7ff2f`) appears only on: primary CTAs, active states, pass indicators, key data values, and the mark in brand contexts. Never decorative.

3. **Type weight is hierarchy.** There are three text weights in use: 800 (display/hero), 600 (headings/labels), 400 (body). Weight contrast replaces color contrast for structure.

4. **Borders describe structure, not decoration.** A border exists because two surfaces need separation. Not because a card needs definition.

5. **Evidence precedes assertion.** Every section that makes a claim must show the underlying evidence. This is a design rule, not a copy rule.

6. **Density is earned.** Start sparse. Add information only when it creates value. Never fill space.

---

## Signature Elements

1. **NebulaMark at scale** — the 3×3 grid used at 80-200px as a section device, section background, and product diagram. The states animate from neutral to pass/fail to demonstrate the product.

2. **Chartreuse on near-black** — `#c7ff2f` is the only chromatic accent. Used with restraint. The combination is immediately recognizable and unowned in this space.

---

## Anti-Patterns (explicit, enforced)

- No glow orbs
- No rounded card monoculture (use `rounded-none` or `rounded-sm` as the default on diagnostic surfaces)
- No gradient hero overlays
- No teal — `#00c2a0` retired
- No accent color in body text
- No multi-color icon arrays
- No "three equal cards" section unless genuinely appropriate
- No floating UI screenshots in hero
- No fake dashboards
- No pill badges that don't convey status
- No decorative horizontal rules as section dividers (use whitespace instead)
