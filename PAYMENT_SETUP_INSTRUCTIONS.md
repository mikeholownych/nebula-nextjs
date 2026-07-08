# PAYMENT SETUP — CONCRETE STEPS

## TASK 1: Create Stripe $147 Checkout (5 minutes)

### Step 1: Go to Stripe Dashboard
- URL: https://dashboard.stripe.com
- Login with your Stripe account

### Step 2: Create Product
1. Click **Products** in left sidebar
2. Click **+ Add product**
3. Fill in:
   - **Name:** "Landing Page Audit - Founder Edition"
   - **Description:** "AI-powered audit of your landing page copy, design, and conversion potential"
   - **Price:** $147.00 USD (one-time payment)
   - **Billing period:** One-time

### Step 3: Create Checkout Link
1. In the product page, scroll to **Checkout links**
2. Click **+ Create link**
3. Keep defaults
4. Copy the checkout URL (will be like: `https://checkout.stripe.com/pay/cs_...`)

### Step 4: Save to Our System
```bash
# Create the checkout link file
echo "https://checkout.stripe.com/pay/cs_YOUR_LINK_HERE" > ~/.nebula/stripe_97_checkout_link.txt
```

**Result:** When you're done, you'll have a URL you can share in emails that customers can click to pay $147.

---

## TASK 2: Create Gumroad $7 Template (10 minutes)

### Step 1: Go to Gumroad
- URL: https://gumroad.com
- Login with your Gumroad account

### Step 2: Upload Product
1. Click **Create** in top left
2. Click **Upload a file**
3. Upload your template file (the landing page component pack)
4. Fill in:
   - **Title:** "Landing Page Component Pack"
   - **Description:** "7 high-converting sections (hero, pricing, social proof, CTA, testimonials, FAQ, footer). Copy-paste ready. Works with any page builder."
   - **Price:** $7 USD

### Step 3: Publish Product
1. Set to **Public**
2. Click **Publish**

### Step 4: Get Public URL
1. After publishing, copy your product URL from the address bar
2. Will be like: `https://gumroad.com/l/landing-page-components`

### Step 5: Save to Our System
```bash
# Create the product info file
cat > ~/.nebula/gumroad_7_product.json << 'EOF'
{
  "title": "Landing Page Component Pack",
  "price_dollars": 7,
  "url": "https://gumroad.com/l/YOUR_PRODUCT_ID",
  "published": true
}
EOF
```

**Result:** Customers can buy your $7 template instantly with one click.

---

## TASK 3: Update Wave 2 Email Copy (5 minutes)

Edit the email templates to include both payment links.

**For $7 Template Focus:**
```
Subject: How to launch a landing page in 2 hours ($7 templates)

Body:
...
👉 Get the template pack now ($7): [INSERT GUMROAD LINK HERE]
Already ready to go all-in? Book a $147 audit: [INSERT STRIPE LINK HERE]
```

**For $147 Audit Focus:**
```
Subject: Your landing page audit: $147 (or grab templates for $7)

Body:
...
👉 Get a full audit ($147): [INSERT STRIPE LINK HERE]
Want to DIY first? Grab the templates ($7): [INSERT GUMROAD LINK HERE]
```

**Action:** Update the Wave 2 cron job prompt to include actual links (not placeholders)

---

## TASK 4: Test Payment Flow (5 minutes)

### Test Stripe Checkout
1. Copy Stripe checkout link
2. Paste into browser, verify it loads
3. DO NOT enter real payment info (uses test key)
4. Verify you can see: Product name, $147 price, payment form

### Test Gumroad Purchase
1. Copy Gumroad product link
2. Paste into browser, verify it loads
3. Verify you can see: "Landing Page Component Pack", $7 price, "Add to cart"
4. Click through to payment screen (do not complete)

**Goal:** Make sure both links work from a browser

---

## TASK 5: Verification Script

```bash
# Verify Stripe link is saved
test -f ~/.nebula/stripe_97_checkout_link.txt && echo "✅ Stripe link saved" || echo "❌ Stripe link missing"

# Verify Gumroad link is saved
test -f ~/.nebula/gumroad_7_product.json && echo "✅ Gumroad link saved" || echo "❌ Gumroad link missing"

# Run pre-campaign validation
python3 /home/mike/nebula/validate_before_campaign.py
```

---

## TIMELINE

| Time | Task | Duration |
|------|------|----------|
| NOW | Read this doc | 2 min |
| 17:15 | Create Stripe product | 5 min |
| 17:20 | Create Gumroad product | 10 min |
| 17:30 | Update Wave 2 email copy | 5 min |
| 17:35 | Test both payment links | 5 min |
| 17:40 | Run validation script | 2 min |
| 17:45 | Buffer/troubleshooting | 15 min |
| 18:00 | READY FOR WAVE 2 | ✅ |

**You have 3.8 hours. This is a 27-minute fix.**

---

## IMPORTANT NOTES

- **Stripe uses test mode by default** (safe for testing)
- **Gumroad links are publicly accessible** (customers can buy immediately)
- **Both are live payment systems** (real money flows when customers pay)
- **No refunds needed** (these are real products with real value)

---

## SUCCESS CRITERIA

After completing all tasks:
- ✅ Stripe product created with public checkout link
- ✅ Gumroad product published with public product link
- ✅ Both links tested and working
- ✅ Wave 2 email includes both payment links
- ✅ Pre-campaign validation passes
- ✅ Ready to launch Wave 2 @ 21:00 with real payment flows

At that point, customers can actually buy. No more test data. Real revenue possible.
