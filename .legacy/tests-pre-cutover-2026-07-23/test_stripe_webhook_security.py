#!/usr/bin/env python3
"""
Test Stripe webhook security vulnerabilities.

These tests document security defects that must be fixed before Wave 0 hardening.
DO NOT run these in production — they write test files to temporary directories.
"""

import json
import os
import tempfile
from pathlib import Path
import unittest
from unittest.mock import patch, MagicMock
import sys
import io

# Add nebula to path
sys.path.insert(0, '/home/mike/nebula')

class TestStripeWebhookSecurity(unittest.TestCase):
    """Test Stripe webhook security vulnerabilities."""
    
    def test_webhook_server_accepts_unsigned_stripe_events(self):
        """Vulnerability: webhook_server.py accepts Stripe events without signature verification."""
        # Import after path setup
        import webhook_server
        
        # Create a fake Stripe event
        event = {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_test_fake123",
                    "payment_intent": "pi_test_fake123",
                    "customer_details": {"email": "attacker@example.com"},
                    "amount_total": 9700,
                    "metadata": {"product": "nebula_97"},
                }
            }
        }
        
        # Test without signature header
        with tempfile.TemporaryDirectory() as td:
            base = Path(td)
            payment_log = base / "payments.log"
            customer_ledger = base / "customer-ledger.jsonl"
            stats = base / "stats.json"
            hot_file = base / "HOT_LEAD.json"
            
            body = json.dumps(event).encode()
            
            # Mock handler
            handler = object.__new__(webhook_server.WebhookHandler)
            handler.headers = {"Content-Length": str(len(body))}
            handler.rfile = io.BytesIO(body)
            handler.wfile = io.BytesIO()
            
            # Mock the response writer
            def mock_send_json(code, data):
                pass
            
            with patch.object(webhook_server, "PAYMENTS_LOG", str(payment_log)), \
                 patch.object(webhook_server, "INBOX_LOG", str(customer_ledger)), \
                 patch.object(webhook_server, "STATS_FILE", str(stats)), \
                 patch.object(webhook_server, "HOT_LEAD_FILE", str(hot_file)), \
                 patch.object(handler, "_send_json", mock_send_json):
                
                # This should succeed WITHOUT any signature verification
                handler._handle_stripe()
                
                # Verify the payment was logged (security vulnerability!)
                self.assertTrue(payment_log.exists())
                with open(payment_log) as f:
                    logs = [json.loads(line) for line in f.read().splitlines() if line.strip()]
                    self.assertEqual(len(logs), 1)
                    self.assertEqual(logs[0]["email"], "attacker@example.com")
                    
                # Hot lead was created (more business logic impact)
                self.assertTrue(hot_file.exists())
                with open(hot_file) as f:
                    hot_leads = json.load(f)
                    if isinstance(hot_leads, dict):
                        hot_leads = [hot_leads]
                    self.assertEqual(len(hot_leads), 1)
                    self.assertEqual(hot_leads[0]["email"], "attacker@example.com")
    
    def test_agentic_server_accepts_unsigned_stripe_events(self):
        """Vulnerability: agentic_server.py Stripe webhook endpoint also lacks signature verification."""
        # Instead of importing, we'll inspect the source code directly
        # because agentic_server.py expects command line arguments
        
        event = {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_test_anotherfake",
                    "customer_details": {"email": "attacker2@example.com"},
                    "amount_total": 9700,
                    "metadata": {"product": "launchcrate_97"},
                }
            }
        }
        
        # Check the source code for vulnerability
        with open('/home/mike/nebula/agentic_server.py') as f:
            content = f.read()
            
        # Look for Stripe webhook handling
        if '"/stripe-webhook"' in content:
            # Find the handling section
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if '"/stripe-webhook"' in line:
                    # Check context around this line
                    start = max(0, i-5)
                    end = min(len(lines), i+15)
                    context = '\n'.join(lines[start:end])
                    if 'POST' in context:
                        # This is the webhook handler
                        self.assertNotIn('Stripe-Signature', context,
                                       "Stripe webhook handler should check Stripe-Signature but doesn't")
                        self.assertNotIn('stripe.Webhook.construct_event', context,
                                       "Stripe webhook handler should use stripe.Webhook.construct_event for verification")
            
            try:
                stripe_webhook.LOG_FILE = str(test_payment_log)
                
                # Mock the handler to intercept the payload
                captured_payload = None
                original_handle = stripe_webhook.handle_stripe_webhook
                
                def capture_payload(payload, signature=None):
                    nonlocal captured_payload
                    captured_payload = payload
                    # Don't actually write anything
                    return {"status": "mocked"}
                
                stripe_webhook.handle_stripe_webhook = capture_payload
                
                # Simulate HTTP request without Stripe-Signature header
                handler = object.__new__(agentic_server.NebulaHTTPRequestHandler)
                handler.command = "POST"
                handler.path = "/stripe-webhook"
                handler.headers = {"Content-Length": str(len(json.dumps(event)))}
                handler.rfile = io.BytesIO(json.dumps(event).encode())
                handler.wfile = io.BytesIO()
                
                # Mock the UTF-8 safe writer
                def mock_safe_write(data):
                    pass
                
                handler._safe_write = mock_safe_write
                
                # This will call handle_stripe_webhook without signature checking
                with patch.object(handler, 'send_response'), \
                     patch.object(handler, 'send_header'), \
                     patch.object(handler, 'end_headers'):
                    
                    # Import the module method that handles the webhook
                    # The actual route handling is in do_POST method
                    from agentic_server import NebulaHTTPRequestHandler
                    
                    # We need to call the actual handler logic
                    # Since we can't easily call do_POST, we'll verify
                    # that the code doesn't check for Stripe-Signature
                    
                    # Check the source code for vulnerability
                    with open('/home/mike/nebula/agentic_server.py') as f:
                        content = f.read()
                        
                    # Looking for where Stripe webhook is handled
                    if '"/stripe-webhook"' in content:
                        # Find the section
                        lines = content.split('\n')
                        for i, line in enumerate(lines):
                            if '"/stripe-webhook"' in line and 'POST' in lines[i-2:i+2]:
                                # Check if Stripe-Signature is referenced
                                context = '\n'.join(lines[max(0, i-10):min(len(lines), i+20)])
                                self.assertNotIn('Stripe-Signature', context, 
                                               "Stripe webhook should check signature but doesn't")
                                self.assertNotIn('stripe.Webhook.construct_event', context,
                                               "Should use stripe.Webhook.construct_event for verification")
                
            finally:
                stripe_webhook.handle_stripe_webhook = original_handle
                stripe_webhook.LOG_FILE = original_log
    
    def test_duplicate_event_handling(self):
        """Vulnerability: No idempotency handling for duplicate Stripe events."""
        import webhook_server
        
        event = {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_test_samesession",
                    "payment_intent": "pi_test_same",
                    "customer_details": {"email": "duplicate@example.com"},
                    "amount_total": 9700,
                    "metadata": {"product": "nebula_97"},
                }
            }
        }
        
        with tempfile.TemporaryDirectory() as td:
            base = Path(td)
            payment_log = base / "payments.log"
            customer_ledger = base / "customer-ledger.jsonl"
            stats = base / "stats.json"
            hot_file = base / "HOT_LEAD.json"
            
            body = json.dumps(event).encode()
            
            # First request
            handler1 = object.__new__(webhook_server.WebhookHandler)
            handler1.headers = {"Content-Length": str(len(body))}
            handler1.rfile = io.BytesIO(body)
            handler1.wfile = io.BytesIO()
            
            # Second identical request
            handler2 = object.__new__(webhook_server.WebhookHandler)
            handler2.headers = {"Content-Length": str(len(body))}
            handler2.rfile = io.BytesIO(body)
            handler2.wfile = io.BytesIO()
            
            def mock_send_json(code, data):
                pass
            
            with patch.object(webhook_server, "PAYMENTS_LOG", str(payment_log)), \
                 patch.object(webhook_server, "INBOX_LOG", str(customer_ledger)), \
                 patch.object(webhook_server, "STATS_FILE", str(stats)), \
                 patch.object(webhook_server, "HOT_LEAD_FILE", str(hot_file)), \
                 "_send_json": lambda code, data: None):
                
                 handler1._handle_stripe()
                 handler2._handle_stripe()  # Same event processed twice!
                
                 # Count log entries
                 with open(payment_log) as f:
                     logs = [json.loads(line) for line in f.read().splitlines() if line.strip()]
                     # Bug: Same event logged twice
                     self.assertEqual(len(logs), 2, 
                                    "Duplicate event processed - no idempotency")
                    
                 # Hot lead also duplicated
                 with open(hot_file) as f:
                     hot_leads = json.load(f)
                     if isinstance(hot_leads, dict):
                         hot_leads = [hot_leads]
                     self.assertEqual(len(hot_leads), 2,
                                    "Hot lead duplicated - no idempotency")


if __name__ == '__main__':
    unittest.main()