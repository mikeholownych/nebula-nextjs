#!/usr/bin/env python3
"""Register Stripe webhook endpoint"""
import json, stripe, urllib.request

# Read Stripe key
with open('/home/mike/.hermes/.env', 'rb') as f:
    raw = f.read()
for line in raw.split(b'\n'):
    if b'STRIPE_SECRET_KEY' in line:
        sk = line.split(b'=', 1)[1].strip().decode()
        break

stripe.api_key = sk

# Create webhook endpoint
try:
    webhook = stripe.WebhookEndpoint.create(
        url="https://nebulacomponents.shop/stripe-webhook",
        enabled_events=[
            "checkout.session.completed",
            "payment_intent.succeeded",
            "charge.succeeded"
        ],
        description="Auto-deliver Nebula Components and LaunchCrate on purchase"
    )
    print(f"Webhook created!")
    print(f"ID: {webhook.id}")
    print(f"Secret: {webhook.secret}")
    print(f"URL: {webhook.url}")
    
    # Save secret for verification
    with open('/home/mike/nebula/.stripe_webhook_secret', 'w') as f:
        f.write(webhook.secret)
    
except Exception as e:
    print(f"Error: {e}")
    # Maybe it already exists, list existing webhooks
    print("\nExisting webhooks:")
    for wh in stripe.WebhookEndpoint.list():
        print(f"  {wh.id}: {wh.url} - {'active' if wh.status == 'enabled' else wh.status}")
        if wh.url and "nebulacomponents.shop" in wh.url:
            print(f"    Secret: {wh.secret}")
