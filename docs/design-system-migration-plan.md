# Design System Migration Plan

**Date:** 2026-07-14
**Goal:** Apply modern dark design system to all HTML pages

---

## Current Status

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ New Design (Inter) | 22 | 54% |
| ❌ Old Design | 19 | 46% |
| **Total** | **41** | **100%** |

---

## Pages Using NEW Design ✅

These pages already use Inter font and modern dark theme:

1. index.html
2. index-old.html (archived)
3. audit-lander.html
4. accessible-nebula.html
5. ad-burn-leaderboard.html
6. ai-sdr-vs-audit.html
7. beta-tester.html
8. blog-trigger-aware-outreach.html
9. checkout-impulse.html (partial)
10. cta-optimization.html
11. demo.html
12. generator.html
13. growth-launch-confirmation.html
14. growth-launch.html
15. headline-optimization.html
16. lead-dashboard.html
17. mobile-landing-page-optimization.html
18. page-speed-conversion.html
19. part_after.html
20. pricing-generator.html
21. social-proof-landing-page.html
22. why-landing-pages-dont-convert.html

---

## Pages Needing Update ❌

These pages still use old light theme:

### HIGH PRIORITY (Revenue/Customer-facing)

1. **agency-partner.html** — $497/mo pricing page
2. **checkout.html** — Stripe checkout
3. **checkout_v2.html** — Alternative checkout
4. **thank-you.html** — Post-purchase

### MEDIUM PRIORITY (Marketing)

5. **audit.html** — Audit page
6. **ai-ops-retainer.html** — $1,497/mo pricing
7. **7-systems.html** — Content marketing
8. **marketing-ops.html** — Service page

### LOW PRIORITY (Internal/Test)

9. audit_dashboard.html
10. create_97_checkout.html
11. dashboard.html
12. launch_page_97.html
13. og-card-source.html
14. part_before.html
15. primer.html
16. roas-cliff.html
17. unsubscribe.html
18. what-is-landing-page-audit.html
19. privacy-policy.html

---

## Shared Design System

**File:** `/styles/nebula-design-system.css`

**Features:**
- Inter font (Google Fonts)
- Dark theme (#050505 background)
- Emerald accent (#10b981)
- Ambient glow effects
- Modern typography (68px/48px/32px)
- Responsive breakpoints
- Reusable components (buttons, cards, badges)

---

## Migration Strategy

### Option 1: Full Conversion (Recommended)

Replace inline styles with design system:

**Steps:**
1. Add `<link rel="stylesheet" href="/styles/nebula-design-system.css">`
2. Remove old :root variables
3. Replace light colors with dark theme
4. Update button classes
5. Add glow effects to hero sections

**Pros:**
- Consistent across all pages
- Modern, premium feel
- Better performance (shared CSS)

**Cons:**
- More work initially
- May break some layouts

---

### Option 2: Hybrid Approach

Keep existing pages, only convert revenue-critical:

**Pages to convert:**
- agency-partner.html
- checkout.html
- thank-you.html
- audit.html

**Pros:**
- Faster to implement
- Lower risk
- Focus on high-impact pages

**Cons:**
- Inconsistent experience
- Maintains technical debt

---

## Implementation Plan (Option 1)

### Phase 1: Revenue Pages (2-3 hours)
1. agency-partner.html
2. checkout.html
3. checkout_v2.html
4. thank-you.html

### Phase 2: Marketing Pages (3-4 hours)
5. audit.html
6. ai-ops-retainer.html
7. 7-systems.html
8. marketing-ops.html

### Phase 3: Remaining Pages (2-3 hours)
9-19. All remaining pages

**Total Estimated Time:** 7-10 hours

---

## Design System Elements

### Colors
```css
--bg: #050505 (near black)
--bg-elevated: #0a0a0a (elevated)
--fg: #f9f9f9 (off white)
--fg-muted: #666 (gray)
--accent: #10b981 (emerald)
--border: #1a1a1a (dark gray)
```

### Typography
- H1: 68px, weight 600
- H2: 48px, weight 600
- H3: 32px, weight 600
- Body: 17px, line-height 1.65

### Buttons
- .btn-primary: Emerald background, white text
- .btn-secondary: Transparent, border, white text

### Effects
- Ambient glow orbs (fixed position)
- Gradient text
- Pulse animations

---

## Risk Mitigation

### Testing Checklist
- [ ] Visual appearance matches design
- [ ] Links and buttons work
- [ ] Forms submit correctly
- [ ] Stripe checkout works
- [ ] Mobile responsive
- [ ] Cross-browser compatible

### Rollback Plan
- Git revert to previous version
- Keep index.html as reference
- Test in staging before production

---

## Success Criteria

- ✅ All pages use Inter font
- ✅ All pages use dark theme
- ✅ Consistent button styling
- ✅ Mobile responsive
- ✅ Performance > 90 Lighthouse
- ✅ WCAG AA contrast ratios
- ✅ Stripe checkout functional
- ✅ Forms submit correctly

---

## Next Steps

1. **Immediate:** Commit shared design system CSS
2. **Short-term:** Migrate HIGH PRIORITY pages
3. **Medium-term:** Migrate remaining pages
4. **Long-term:** Remove duplicate styles, optimize

---

## Commands

```bash
# View pages needing update
cd /home/mike/nebula
for f in *.html; do
  if ! grep -q "Inter" "$f"; then
    echo "$f"
  fi
done

# Check specific page
grep -c "Inter" agency-partner.html
```

---

## Timeline

- **Today:** Design system created, HIGH PRIORITY migrated
- **This week:** MEDIUM PRIORITY migrated
- **Next week:** LOW PRIORITY migrated
- **Ongoing:** Maintain consistency

---

## Status

- ✅ Design system created
- ⏭️ HIGH PRIORITY pending
- ⏭️ Testing pending
- ⏭️ Deployment pending
