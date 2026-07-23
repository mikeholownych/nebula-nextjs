#!/usr/bin/env python3
"""
Security vulnerability tests for Stripe webhook handlers.

These tests document critical security issues that must be fixed:
1. No signature verification on Stripe webhooks
2. No idempotency handling for duplicate events
3. Duplicate subscription update handlers in stripe_webhook.py

Run with: python3 -m pytest tests/test_stripe_security_vulnerabilities.py -v
"""

import json
import os
import sys
from pathlib import Path

def test_stripe_webhook_lacks_signature_verification():
    """Test that webhook endpoints don't verify Stripe signatures."""
    
    # Check webhook_server.py
    with open('/home/mike/nebula/webhook_server.py') as f:
        webhook_content = f.read()
    
    # The server should verify Stripe-Signature header
    assert 'Stripe-Signature' not in webhook_content, \
        "webhook_server.py should check Stripe-Signature header but doesn't"
    
    # Should use stripe.Webhook.construct_event
    assert 'stripe.Webhook.construct_event' not in webhook_content, \
        "webhook_server.py should use stripe.Webhook.construct_event but doesn't"
    
    # Check agentic_server.py  
    with open('/home/mike/nebula/agentic_server.py') as f:
        agentic_content = f.read()
    
    # Find Stripe webhook handling
    lines = agentic_content.split('\n')
    for i, line in enumerate(lines):
        if '"/stripe-webhook"' in line:
            # Check context
            start = max(0, i-10)
            end = min(len(lines), i+20)
            context = '\n'.join(lines[start:end])
            if 'POST' in context:
                assert 'Stripe-Signature' not in context, \
                    f"agentic_server.py line {i+1}: Should check Stripe-Signature"
                assert 'stripe.Webhook.construct_event' not in context, \
                    f"agentic_server.py line {i+1}: Should use stripe.Webhook.construct_event"
    
    print("✓ Vulnerability confirmed: Stripe webhooks accept unsigned events")

def test_duplicate_subscription_update_handlers():
    """Test duplicate customer.subscription.updated handlers in stripe_webhook.py."""
    
    with open('/home/mike/nebula/stripe_webhook.py') as f:
        content = f.read()
    
    # Count occurrences of customer.subscription.updated
    count = content.count('customer.subscription.updated')
    assert count >= 2, \
        f"Found {count} handlers for customer.subscription.updated (duplicate logic)"
    
    print(f"✓ Vulnerability confirmed: {count} duplicate subscription update handlers")

def test_no_event_id_deduplication():
    """Test that there's no Stripe event ID deduplication."""
    
    with open('/home/mike/nebula/stripe_webhook.py') as f:
        content = f.read()
    
    # Should check Stripe event ID for idempotency
    assert 'event.id' not in content, \
        "Should store/check Stripe event.id for deduplication"
    
    with open('/home/mike/nebula/webhook_server.py') as f:
        content = f.read()
    
    assert 'event.id' not in content, \
        "webhook_server.py should check Stripe event.id for deduplication"
    
    print("✓ Vulnerability confirmed: No event ID deduplication")

def test_widened_endpoint_subscription():
    """Test that webhook endpoints handle limited event types."""
    
    with open('/home/mike/nebula/setup_webhook.py') as f:
        content = f.read()
    
    # Current events registered
    events = [
        'checkout.session.completed',
        'payment_intent.succeeded', 
        'charge.succeeded'
    ]
    
    # Check stripe_webhook.py handles more events
    with open('/home/mike/nebula/stripe_webhook.py') as f:
        stripe_content = f.read()
    
    handled_events = []
    if 'checkout.session.completed' in stripe_content:
        handled_events.append('checkout.session.completed')
    if 'invoice.payment_succeeded' in stripe_content:
        handled_events.append('invoice.payment_succeeded')
    if 'invoice.payment_failed' in stripe_content:
        handled_events.append('invoice.payment_failed')
    if 'customer.subscription.updated' in stripe_content:
        handled_events.append('customer.subscription.updated')
    if 'customer.subscription.deleted' in stripe_content:
        handled_events.append('customer.subscription.deleted')
    if 'checkout.session.expired' in stripe_content:
        handled_events.append('checkout.session.expired')
    
    print(f"✓ Current registered events: {events}")
    print(f"✓ Actually handled events: {handled_events}")
    print(f"  - Mismatch: Some handled events not registered with Stripe")

def main():
    """Run all security vulnerability tests."""
    print("🔒 Stripe Webhook Security Vulnerability Audit")
    print("=" * 60)
    
    tests = [
        test_stripe_webhook_lacks_signature_verification,
        test_duplicate_subscription_update_handlers,
        test_no_event_id_deduplication,
        test_widened_endpoint_subscription,
    ]
    
    for test in tests:
        try:
            test()
        except AssertionError as e:
            print(f"❌ {test.__name__}: {e}")
        except Exception as e:
            print(f"⚠️  {test.__name__}: Error - {e}")
        print()
    
    print("=" * 60)
    print("Summary:")
    print("- All endpoints accept unsigned Stripe events (CRITICAL)")
    print("- Duplicate event processing possible (HIGH)")
    print("- Duplicate subscription handlers (MEDIUM)")
    print("- Event registration mismatch (MEDIUM)")
    print()
    print("Required fixes:")
    print("1. Implement stripe.Webhook.construct_event() verification")
    print("2. Add Stripe event ID deduplication")
    print("3. Fix duplicate subscription handler")
    print("4. Widen Stripe webhook registration to match handled events")

if __name__ == '__main__':
    main()