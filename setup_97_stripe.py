#!/usr/bin/env python3
"""Create $147 Stripe checkout link"""
import os
import json

# For now, simulate the Stripe link creation
# In production, this would call the Stripe API

STRIPE_PUBLISHABLE_KEY = "pk_live_51TlN5HEINR1kU9chG6RJnJLsmGyHwalL707oip3vt5MKwXVcrFSMmzUWyBjfqz3CIlKRM9eshCSCq2jJQYqaNRdY00vOglUjtK"

# The $147 offer would normally be created via Stripe Dashboard or API
# For now, document what needs to happen:

offer_config = {
    "product": "Managed Outreach Audit",
    "amount_cents": 9700,
    "amount_dollars": 97,
    "currency": "USD",
    "billing_behavior": "payment",
    "redirect_success": "https://launchcrate.io/audit-success.html",
    "redirect_cancel": "https://nebulacomponents.shop",
    "status": "PENDING - create in Stripe Dashboard"
}

print("[STRIPE] $147 Offer Configuration:")
print(json.dumps(offer_config, indent=2))
print("\n[ACTION] Next steps:")
print("1. Go to https://dashboard.stripe.com/")
print("2. Create new product: 'Managed Outreach Audit - $147'")
print("3. Create payment link")
print("4. Copy link and update reddit_posts.md")

with open("stripe_97_config.json", "w") as f:
    json.dump(offer_config, f, indent=2)

