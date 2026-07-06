#!/usr/bin/env python3
"""Quick fix: create a Stripe-hosted checkout with custom amount support.
Since Payment Links don't support custom amounts, we'll create a simple
redirect page that lets users choose their amount and generates a
Stripe Checkout Session."""
import json, urllib.request, stripe, os

# Read keys
with open('/home/mike/.hermes/.env', 'rb') as f:
    raw = f.read()
for line in raw.split(b'\n'):
    if b'STRIPE_SECRET_KEY' in line:
        sk = line.split(b'=', 1)[1].strip().decode()
    if b'STRIPE_PUBLISHABLE_KEY' in line:
        pk = line.split(b'=', 1)[1].strip().decode()

stripe.api_key = sk

# For name-your-price, we need a Checkout Session with custom amount.
# But since we can't run a server endpoint, let's use a different approach:
# Create a few payment links at different price points and let users choose.

# Actually the simplest: Create the product with custom amount support
# by using a Payment Link with the price_data approach.
# 
# Stripe Payment Links DO support custom_amount now via the API!
# Let me check...

try:
    # Create a payment link with custom amount enabled
    link = stripe.PaymentLink.create(
        line_items=[{
            "price": "price_1TlNGjEINR1kU9chLkBlxqEO",  # $7 price
            "quantity": 1,
            "custom_amount": {
                "enabled": True,
                "minimum": 100,  # $1 minimum
                "maximum": 10000  # $100 maximum
            }
        }],
        after_completion={
            "type": "redirect",
            "redirect": {"url": "https://nebulacomponents.shop/?success=true"}
        },
        metadata={"product": "nebula-components"}
    )
    print(f"Custom amount payment link: {link.url}")
    
    # Update the stored link
    with open('/home/mike/nebula/.stripe_links', 'w') as f:
        f.write(f"NEBULA_LINK={link.url}\n")
        f.write(f"LAUNCHCRATE_LINK=https://buy.stripe.com/7sYeVdeaw0wk1DzfA643S01\n")
        f.write(f"STRIPE_PUBLISHABLE_KEY={pk}\n")
    
    print(f"\nUPDATE the site with this link:")
    print(link.url)
    
except Exception as e:
    print(f"Error: {e}")
    # Fall back - just use the existing $7 link but update the copy
    print("\nFallback: Using existing $7 link")
    print("https://buy.stripe.com/4gMdR9aYkenafup3Ro43S00")
