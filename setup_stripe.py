#!/usr/bin/env python3
"""Set up Stripe products and payment links for Nebula + LaunchCrate"""
import json, urllib.request, os, stripe

# Read Stripe keys from .env
with open('/home/mike/.hermes/.env', 'rb') as f:
    raw = f.read()
for line in raw.split(b'\n'):
    if b'STRIPE_SECRET_KEY' in line:
        sk = line.split(b'=', 1)[1].strip().decode()
    if b'STRIPE_PUBLISHABLE_KEY' in line:
        pk = line.split(b'=', 1)[1].strip().decode()

stripe.api_key = sk

print("=== Creating Stripe products ===")

# 1. Nebula Components - standard price $7
try:
    nebula_product = stripe.Product.create(
        name="Nebula Components",
        description="7 premium dark-themed HTML/CSS landing page components. Commercial license. Instant download.",
        metadata={"source": "ai-agent-launch"}
    )
    print(f"Nebula product: {nebula_product.id}")
    
    nebula_price = stripe.Price.create(
        product=nebula_product.id,
        unit_amount=700,  # $7.00
        currency="usd",
        nickname="Standard",
        metadata={"type": "standard"}
    )
    print(f"Nebula price: {nebula_price.id}")
    
    # Payment link
    nebula_link = stripe.PaymentLink.create(
        line_items=[{"price": nebula_price.id, "quantity": 1}],
        after_completion={"type": "redirect", "redirect": {"url": "https://nebulacomponents.shop/checkout.html?success=true"}},
        metadata={"product": "nebula-components"}
    )
    print(f"Nebula payment link: {nebula_link.url}")
    
except Exception as e:
    print(f"Nebula setup error: {e}")

# 2. LaunchCrate - $197
try:
    lc_product = stripe.Product.create(
        name="LaunchCrate - Done-For-You SaaS Launch",
        description="Custom landing page (7 sections), deployed on your domain, email setup, 5-email outreach sequence, 20-email nurture loop, offer strategy session. Delivered in 24 hours.",
        metadata={"source": "ai-agent-launch"}
    )
    print(f"\nLaunchCrate product: {lc_product.id}")
    
    lc_price = stripe.Price.create(
        product=lc_product.id,
        unit_amount=19700,  # $197.00
        currency="usd",
        nickname="Launch Special",
        metadata={"type": "launch-special"}
    )
    print(f"LaunchCrate price: {lc_price.id}")
    
    lc_link = stripe.PaymentLink.create(
        line_items=[{"price": lc_price.id, "quantity": 1}],
        after_completion={"type": "redirect", "redirect": {"url": "https://launchcrate.io/checkout.html?success=true"}},
        metadata={"product": "launchcrate"}
    )
    print(f"LaunchCrate payment link: {lc_link.url}")
    
except Exception as e:
    print(f"LaunchCrate setup error: {e}")

# Save links
print("\n=== PAYMENT LINKS ===")
print(f"Nebula: {nebula_link.url}")
print(f"LaunchCrate: {lc_link.url}")

# Save to files for later use
with open('/home/mike/nebula/.stripe_links', 'w') as f:
    f.write(f"NEBULA_LINK={nebula_link.url}\n")
    f.write(f"LAUNCHCRATE_LINK={lc_link.url}\n")
    f.write(f"STRIPE_PUBLISHABLE_KEY={pk}\n")

print("\nDone")