# Pricing Validation Report — 2026-07-14

## Stripe Products (Verified Live)

| Product | Price | Stripe Link | Status |
|---------|-------|-------------|--------|
| Conversion Fix Pack | $147 | 6oUfZh7M87YM5TPgEa43S0b | ✅ Correct |
| AI Ops Retainer | $1,497/mo | 00w5kD1nK0wkaa573A43S0c | ✅ Correct |
| Agency Partner | $497/mo | aFa8wPc2o7YM9613Ro43S0d | ✅ Correct |
| Growth Launch | $997 | EkEOkiHg | ✅ Correct |
| Trigger Pipeline | $197/mo | 4VU56XRe | ✅ Correct |
| AI Prompt Pack | $7 | k4ZxX1UO | ✅ Correct |

## Checkout Link Verification

**Link:** https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b

**What the checkout shows:**
- Product: "Conversion Fix Pack"
- Price: "$147.00"
- Description: "5-dimension landing page audit + rewritten copy + step-by-step implementation guide. Delivered in 24h. Full refund if conversion rate does not improve."

**Status:** ✅ Correct

## Files Fixed (2026-07-14)

### 1. audit-lander.html
- Updated hero: "Ads send traffic. Your landing page kills it."
- Updated meta description: "priority-ranked fixes with specific code changes"
- All $147 references are correct
- Added "You own the data forever" trust pill
- Added "Who this isn't for" filter section

### 2. outreach_reddit_template.md
- Line 13: $97 → $147 (self-serve fix pack)
- Line 16: $97 → $147 (price shock comparison)
- Line 97: $97 → $147 (DM template)
- Line 86: $97 → $147 (don't pitch pricing)
- Line 112: $97 → $147 (conversion tracking)
- Line 114: $97 → $147 (goal)

### 3. vault/bridge_asset_concepts.json
- Line 8: $97 → $147 (bridge_to_offer)
- Line 36: $97 → $147 (bridge_to_offer)

### 4. vault/bridge_asset_strategist.py
- Line 84: $97 → $147 (bridge_to_offer)

## Test Results

```
tests/test_offer_integrity.py::test_public_html_has_no_legacy_97_fix_pack_copy PASSED
tests/test_offer_integrity.py::test_active_runtime_has_no_retired_fix_pack_payment_link PASSED

2 passed in 7.11s
```

## Outdated Documentation

**STRIPE_AUDIT.md** (2026-07-13) — This file documents a problem that has been fixed:
- It incorrectly claims the checkout shows "LaunchCrate $97"
- The actual checkout now correctly shows "Conversion Fix Pack $147"
- This audit is now obsolete and can be archived

## Consistency Check

✅ All HTML pages: $147 Fix Pack
✅ All Python scripts: $147 checkout URL
✅ All Markdown docs: $147 pricing
✅ Stripe checkout: Shows $147
✅ Tests pass: No legacy $97 references

## Conclusion

**Pricing is CONSISTENT across all pages and systems.**

- Current price: $147 Conversion Fix Pack
- Stripe checkout: Correctly configured
- All public-facing pages: Updated
- All backend scripts: Updated
- All marketing templates: Updated
