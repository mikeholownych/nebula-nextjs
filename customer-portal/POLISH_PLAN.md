# Nebula Homepage Polish Plan

## Issues Identified

### 1. Section Rhythm
- Hero: `py-8 md:py-12`
- Other sections: `py-16`
- **Fix**: Standardize to `py-20 md:py-24` for all sections (hero should be lighter: `py-12 md:py-16`)

### 2. Card Treatments (3 different styles)
- Style A: `rounded-xl border border-border bg-bg-muted/20 p-4` (signal cards)
- Style B: `rounded-2xl border border-border bg-bg-muted/30 p-6` (sample output)
- Style C: `rounded-2xl border border-border bg-bg-muted/10 p-5` (what you receive)
- **Fix**: Standardize to two card types:
  - Default card: `rounded-2xl border border-border/60 bg-bg-surface p-6`
  - Feature card: `rounded-2xl border border-accent/20 bg-accent/5 p-8`

### 3. Stat Strip
- 10px text (`text-[10px]`) too small for mobile
- 2xl numbers lack visual hierarchy
- **Fix**: Increase to `text-xs`, numbers to `text-3xl font-mono`, add proper spacing

### 4. Grid Gaps
- Inconsistent: gap-2, gap-3, gap-4, gap-8, gap-12
- **Fix**: Standardize to `gap-6` for most grids, `gap-8` for section-level

### 5. Border Treatments
- `border-border`, `border-border/40`, `border-border/60`, `border-accent/30`
- **Fix**: Use CSS variable system:
  - `border-border` (default, full opacity)
  - `border-border-subtle` (0.5 opacity, define in globals)
  - Reserved accent borders only for CTAs

### 6. Heading Hierarchy
- Mixed: `tracking-display`, `tracking-section`, `tracking-tight`
- **Fix**: Standardize hierarchy:
  - H1: `text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight`
  - H2: `text-2xl md:text-3xl font-bold tracking-tight`
  - H3: `text-lg font-semibold`

### 7. Button Consistency
- Primary: `px-8 py-4 text-base` (good)
- Secondary: `px-6 py-3 text-sm` (inconsistent)
- **Fix**: Standardize to:
  - Primary: `px-6 py-3.5 text-base` (reduce from px-8)
  - Secondary: `px-5 py-2.5 text-sm`

### 8. Missing Polish Items
- Stat strip needs visual separation (subtle card or border)
- Signal cards need hover states
- Teardown cards need clearer visual hierarchy
- "What you receive" cards are too flat
- Pattern section cards need better visual weight
- Comparison section (Other vs Nebula) needs clearer visual distinction

## Implementation Order

1. Define global utilities (`border-border-subtle`, `card-default`, `card-feature`)
2. Standardize section padding
3. Fix stat strip (larger text, better spacing, add card wrapper)
4. Standardize card treatments
5. Fix grid gaps
6. Standardize heading hierarchy
7. Add hover states to interactive cards
8. Polish comparison section
