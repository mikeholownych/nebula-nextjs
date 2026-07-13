# Stripe Checkout Audit — 2026-07-13

## Root Cause of 0/26 Conversions

**Every "Buy Now / Get Fix Pack" link on the site and in emails points to:**
`https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b`

**That checkout page shows:**
| Field | Shows | Should show |
|-------|-------|------------|
| Product name | "LaunchCrate - Done-For-You SaaS Launch" | "Conversion Fix Pack" |
| Price | $97 | $147 |
| Description | "Custom landing page (7 sections) deployed on your domain..." | "5-dimension audit + rewritten copy + implementation guide" |

**Result:** Lead clicks "$147 Fix Pack" → sees "$97 LaunchCrate" → doesn't buy. 100% conversion killer.

## All Stripe Products (Live)

| Product | Price | Status |
|---------|-------|--------|
| AI Prompt Pack | $7 ✅ | Working |
| LaunchCrate (old name) | $197 | Wrong name/price for Fix Pack |
| Growth Launch | $997 | Has correct link? |
| Trigger Pipeline | $197/mo | OK |
| Managed Outbound Pilot | $497 | Has broken link |
| Outbound SDR Starter | $1,500/mo | OK |
| Outbound SDR Growth | $3,000/mo | OK |
| Outbound SDR Scale | $5,000/mo | OK |

## Broken Payment Links

| Link | Shows | Status |
|------|-------|--------|
| `6oUfZh7M87YM5TPgEa43S0b` | LaunchCrate $97 (used everywhere as Fix Pack) | ❌ Wrong product |
| `3cs9Dp2NV5Oa6Sk28a` | "Something went wrong" | ❌ Broken |
| `5kAcPJcxJ2HM7tS7sw` | "Something went wrong" | ❌ Broken |
| `4gMdR9aYkenafup3Ro43S00` | Nebula Components $7 | ✅ Working |
| `4gMcN5aYk92Qaa5drY43S09` | Not checked | ? |

## Fix Required (Stripe Dashboard — 2 minutes)

1. Go to https://dashboard.stripe.com/products
2. Click **"LaunchCrate - Done-For-You SaaS Launch"** ($197, the main one `prod_UlPkjwyFBx2QEh`)
3. Rename it to **"Conversion Fix Pack"**
4. Update description to match
5. Click "Add pricing" → **$147 one-time** (keep the existing $197 too, or replace it)
6. Go to Payment Links → **Create payment link** → select the Conversion Fix Pack → Publish
7. Copy new link

## After Creating New Link

Update these files (replace old `6oUfZh7M87YM5TPgEa43S0b` with new link):

| File | Occurrences |
|------|-----------|
| `index.html` | Hero CTA, pricing section |
| `checkout.html` | Primary checkout link |
| `followup_sequence.py` | STRIPE constant (line 56) |
| `fix_map.py` | HTML template (line 197) |
| `claude_growth_system.py` | CHECKOUT_URL (line 25) |
| `create_97_checkout.html` | Redirect (line 105) |
| `part_after.html` | 3 occurrences |
| `part_before.html` | JSON reference (line 76) |
