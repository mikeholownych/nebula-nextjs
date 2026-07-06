#!/usr/bin/env python3
"""Create Stripe products for $997 Growth Launch and $197 Trigger Pipeline"""
import json, sys, stripe

# Read Stripe key from .hermes/.env
sk = None
with open('/home/mike/.hermes/.env', 'rb') as f:
    raw = f.read()
for line in raw.split(b'\n'):
    if b'STRIPE_SECRET_KEY' in line:
        sk = line.split(b'=', 1)[1].strip().decode()
    if b'STRIPE_PUBLISHABLE_KEY' in line:
        pk = line.split(b'=', 1)[1].strip().decode()

if not sk:
    print("ERROR: STRIPE_SECRET_KEY not found in /home/mike/.hermes/.env", file=sys.stderr)
    sys.exit(1)

stripe.api_key = sk

print("=== Creating $997 Growth Launch Product ===")

product = stripe.Product.create(
    name="Growth Launch \u2014 First Customer Guarantee",
    description="Done-for-you customer acquisition system. Landing page audit + rewrite, 200 triggered prospects, value-first outreach, 14-day campaign management. Guarantee: you close at least 1 customer in 60 days or we work for free until you do.",
    metadata={"source": "nebula-997-launch", "offer": "growth-launch"}
)
print(f"Product: {product.id}")

price = stripe.Price.create(
    product=product.id,
    unit_amount=99700,
    currency="usd",
    metadata={"offer": "growth-launch"}
)
print(f"Price: {price.id}")

link = stripe.PaymentLink.create(
    line_items=[{"price": price.id, "quantity": 1}],
    after_completion={"type": "redirect", "redirect": {"url": "https://nebulacomponents.shop/growth-launch-confirmation.html"}},
    metadata={"offer": "growth-launch"}
)
print(f"Payment link URL: {link.url}")
print(f"Payment link ID: {link.id}")

# Also create a $197/mo Trigger Pipeline product
print("\n=== Creating $197/mo Trigger Pipeline ===")

tp_product = stripe.Product.create(
    name="Trigger Pipeline \u2014 Monthly Lead Feed",
    description="50+ fresh triggered prospects weekly delivered to your inbox. Automated value-first outreach. Reply triage. Cancel anytime.",
    metadata={"source": "nebula-997-launch", "offer": "trigger-pipeline"}
)
print(f"Product: {tp_product.id}")

tp_price = stripe.Price.create(
    product=tp_product.id,
    unit_amount=19700,
    currency="usd",
    recurring={"interval": "month"},
    metadata={"offer": "trigger-pipeline"}
)
print(f"Price: {tp_price.id}")

# Save links
links = {
    "growth_launch_997": {
        "product_id": product.id,
        "price_id": price.id,
        "payment_link": link.url,
        "amount_dollars": 997,
        "description": "Growth Launch \u2014 First Customer Guarantee"
    },
    "trigger_pipeline_197": {
        "product_id": tp_product.id,
        "price_id": tp_price.id,
        "amount_dollars": 197,
        "description": "Trigger Pipeline \u2014 Monthly Lead Feed"
    }
}

with open('/home/mike/nebula/stripe_997_links.json', 'w') as f:
    json.dump(links, f, indent=2)

print(f"\nSaved to stripe_997_links.json")
print(json.dumps(links, indent=2))
