# PAYMENT SETUP — BOTH STRIPE PRODUCTS

## CRITICAL: You need to create TWO Stripe products

The $7 and $147 offers should BOTH go through Stripe (not Gumroad).

---

## TASK 1: Create Stripe $7 Product (5 minutes)

### Step 1: Go to Stripe Dashboard
- URL: https://dashboard.stripe.com
- Login with your Stripe account

### Step 2: Create Product
1. Click **Products** in left sidebar
2. Click **+ Add product**
3. Fill in:
   - **Name:** "Landing Page Component Pack"
   - **Description:** "7 high-converting sections (hero, pricing, social proof, CTA, testimonials, FAQ, footer). Copy-paste ready templates."
   - **Price:** $7.00 USD (one-time payment)
   - **Billing period:** One-time

### Step 3: Create Checkout Link
1. In the product page, scroll to **Checkout links**
2. Click **+ Create link**
3. Copy the checkout URL

### Step 4: Save to Our System
```bash
echo "https://checkout.stripe.com/pay/cs_YOUR_7_LINK_HERE" > ~/.nebula/stripe_7_checkout_link.txt
```

---

## TASK 2: Create Stripe $147 Product (5 minutes)

### Step 1: Go to Stripe Dashboard (same window)

### Step 2: Create Product
1. Click **+ Add product**
2. Fill in:
   - **Name:** "Landing Page Audit - Founder Edition"
   - **Description:** "AI-powered audit of your landing page copy, design, and conversion potential"
   - **Price:** $147.00 USD (one-time payment)
   - **Billing period:** One-time

### Step 3: Create Checkout Link
1. In the product page, scroll to **Checkout links**
2. Click **+ Create link**
3. Copy the checkout URL

### Step 4: Save to Our System
```bash
echo "https://checkout.stripe.com/pay/cs_YOUR_97_LINK_HERE" > ~/.nebula/stripe_97_checkout_link.txt
```

---

## WHY BOTH THROUGH STRIPE (Not Gumroad)

**Advantages:**
- ✅ Single payment processor (simpler reconciliation)
- ✅ Both in one Stripe account (easier tracking)
- ✅ Same webhook handling (unified revenue tracking)
- ✅ Easier A/B testing (both links side-by-side)
- ✅ Better for automatio analytics (all in one place)

**No Gumroad needed** — Use Stripe for both $7 and $147 offers.

---

## REVISED TIMELINE

| Time | Task | Duration |
|------|------|----------|
| NOW | Read this doc | 2 min |
| 17:15 | Create Stripe $7 product | 5 min |
| 17:20 | Create Stripe $147 product | 5 min |
| 17:30 | Test both checkout links | 5 min |
| 17:35 | Save both links to config files | 2 min |
| 17:40 | Update Wave 2 email copy | 5 min |
| 17:50 | Run validation script | 2 min |
| 18:00 | READY FOR WAVE 2 | ✅ |

**Total time: 26 minutes**  
**Time available: 3 hours 49 minutes**

---

## SUCCESS CRITERIA

After completing:
- ✅ Stripe $7 product created with checkout link
- ✅ Stripe $147 product created with checkout link
- ✅ Both links saved to config files
- ✅ Wave 2 email includes both Stripe links
- ✅ Pre-campaign validation passes
- ✅ Ready to launch Wave 2 @ 21:00 with real payment flows

At that point, customers can actually buy BOTH offers from one Stripe checkout. Real revenue possible.
