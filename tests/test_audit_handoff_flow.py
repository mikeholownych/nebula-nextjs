#!/usr/bin/env python3
import json
import sys
import tempfile
import unittest
from io import BytesIO
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import deliver_audit
import followup_sequence
import webhook_server


class AuditHandoffFlowTests(unittest.TestCase):
    def test_deliver_audit_logs_delivery_and_queues_48h_pitch(self):
        with tempfile.TemporaryDirectory() as td:
            base = Path(td)
            contacted = base / "contacted.json"
            hot_lead = base / "HOT_LEAD.json"
            stats = base / "stats.json"
            audit_log = base / "audit-delivery.log"
            ledger = base / "customer-ledger.jsonl"
            audit_leads = base / "audit_leads.jsonl"
            page = {"url": "https://lead.example", "html": "<html><h1>Win more demos</h1></html>", "text": "Win more demos", "h1": "Win more demos", "ctas": ["Get started"]}
            audit = {
                "overall": 8.0,
                "overall_grade": "A",
                "dimensions": {
                    "headline": {"score": 8, "issue": "ok", "fix": "keep"},
                    "cta": {"score": 8, "issue": "ok", "fix": "keep"},
                    "social_proof": {"score": 8, "issue": "ok", "fix": "keep"},
                    "speed": {"score": 8, "issue": "ok", "fix": "keep"},
                    "mobile": {"score": 8, "issue": "ok", "fix": "keep"},
                },
            }
            argv = [
                "deliver_audit.py", "https://lead.example", "lead@example.com",
                "--thread-id", "thr_1", "--message-id", "msg_1",
                "--source-url", "https://reddit.com/r/PPC/example",
                "--lead-id", "growth-handoff-test-001",
                "--trigger-type", "paid_clicks_zero_form_fills",
                "--trigger-context", "Public trigger text preserved exactly.",
                "--contact-route", "email:lead@example.com",
            ]
            with patch.object(sys, "argv", argv), \
                 patch.object(deliver_audit, "CONTACTED_PATH", contacted), \
                 patch.object(deliver_audit, "HOT_LEAD_PATH", hot_lead), \
                 patch.object(deliver_audit, "STATS_PATH", stats), \
                 patch.object(deliver_audit, "AUDIT_LOG_PATH", audit_log), \
                 patch.object(deliver_audit, "LEDGER_FILE", str(ledger)), \
                 patch.object(deliver_audit, "AUDIT_LEADS_FILE", str(audit_leads)), \
                 patch.object(deliver_audit, "fetch_page", return_value="<html></html>"), \
                 patch.object(deliver_audit, "scrape_page", return_value=page), \
                 patch.object(deliver_audit, "score_audit", return_value=audit), \
                 patch.object(deliver_audit, "send_via_agentmail", return_value={"ok": True, "status": "sent", "message_id": "sent_1"}):
                deliver_audit.main()

            ledger_row = json.loads(ledger.read_text().splitlines()[0])
            self.assertEqual(ledger_row["event_type"], "audit_delivered")
            self.assertEqual(ledger_row["thread_id"], "thr_1")
            self.assertEqual(ledger_row["attribution"]["source_url"], "https://reddit.com/r/PPC/example")
            self.assertEqual(ledger_row["attribution"]["lead_id"], "growth-handoff-test-001")
            self.assertEqual(ledger_row["attribution"]["trigger_context"], "Public trigger text preserved exactly.")
            lead = json.loads(hot_lead.read_text())[0]
            self.assertEqual(lead["stage"], "audit_delivered")
            self.assertEqual(lead["action"], "send_97_pitch")
            self.assertEqual(lead["status"], "pending")
            self.assertEqual(lead["source_url"], "https://reddit.com/r/PPC/example")
            self.assertIn("pitch_due_at", lead)

    def test_followup_paid_emails_only_uses_payment_events(self):
        with tempfile.TemporaryDirectory() as td:
            ledger = Path(td) / "customer-ledger.jsonl"
            ledger.write_text("\n".join([
                json.dumps({"event_type": "audit_delivered", "email": "audit-only@example.com"}),
                json.dumps({"event_type": "payment", "email": "buyer@example.com", "amount_cents": 9700}),
            ]) + "\n")
            with patch.object(followup_sequence, "LEDGER", ledger):
                self.assertEqual(followup_sequence.load_paid_emails(), {"buyer@example.com"})

    def test_webhook_warm_reply_extracts_url_and_sets_deliver_action(self):
        with tempfile.TemporaryDirectory() as td:
            hot_file = Path(td) / "HOT_LEAD.json"
            with patch.object(webhook_server, "HOT_LEAD_FILE", str(hot_file)):
                webhook_server._upsert_hot_lead({
                    "sender": "Founder <founder@example.com>",
                    "email": webhook_server._extract_email("Founder <founder@example.com>"),
                    "thread_id": "thr_2",
                    "message_id": "msg_2",
                    "url": webhook_server._extract_url("yes, audit https://example.com please"),
                    "stage": "warm_reply",
                    "status": "warm",
                    "action": "deliver_audit",
                })
            lead = json.loads(hot_file.read_text())[0]
            self.assertEqual(lead["email"], "founder@example.com")
            self.assertEqual(lead["url"], "https://example.com")
            self.assertEqual(lead["action"], "deliver_audit")

    def test_payment_intent_detector_catches_checkout_questions(self):
        self.assertTrue(webhook_server._is_payment_intent("re: audit", "How do I pay? send the link"))
        self.assertFalse(webhook_server._is_payment_intent("yes", "Please audit https://example.com"))

    def test_stripe_checkout_completion_writes_payment_ledger_and_hot_lead(self):
        with tempfile.TemporaryDirectory() as td:
            base = Path(td)
            payment_log = base / "payments.log"
            customer_ledger = base / "customer-ledger.jsonl"
            stats = base / "stats.json"
            hot_file = base / "HOT_LEAD.json"
            event = {
                "type": "checkout.session.completed",
                "data": {"object": {
                    "id": "cs_live_123",
                    "payment_intent": "pi_live_123",
                    "customer_details": {"email": "buyer@example.com"},
                    "amount_total": 9700,
                    "metadata": {"product": "launchcrate_97"},
                }},
            }
            body = json.dumps(event).encode()
            handler = object.__new__(webhook_server.WebhookHandler)
            handler.headers = {"Content-Length": str(len(body))}
            handler.rfile = BytesIO(body)
            with patch.object(webhook_server, "PAYMENTS_LOG", str(payment_log)), \
                 patch.object(webhook_server, "INBOX_LOG", str(customer_ledger)), \
                 patch.object(webhook_server, "STATS_FILE", str(stats)), \
                 patch.object(webhook_server, "HOT_LEAD_FILE", str(hot_file)), \
                 patch.object(handler, "_send_json", return_value=None):
                handler._handle_stripe()

            ledger_row = json.loads(customer_ledger.read_text().splitlines()[0])
            self.assertEqual(ledger_row["event_type"], "payment")
            self.assertEqual(ledger_row["email"], "buyer@example.com")
            self.assertEqual(ledger_row["amount_cents"], 9700)
            self.assertEqual(ledger_row["payment_id"], "pi_live_123")
            hot = json.loads(hot_file.read_text())[0]
            self.assertEqual(hot["stage"], "paid")
            self.assertEqual(hot["action"], "fulfill_implementation")


if __name__ == "__main__":
    unittest.main()
