#!/usr/bin/env python3
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import deliver_audit


class AuditAttributionLoggingTests(unittest.TestCase):
    def test_log_delivery_persists_source_attribution_fields(self):
        with tempfile.TemporaryDirectory() as td:
            ledger = Path(td) / "customer-ledger.jsonl"
            audit_leads = Path(td) / "audit_leads.jsonl"
            audit = {"overall": 6.6, "overall_grade": "C"}
            send_result = {"message_id": "msg_123", "thread_id": "thr_123"}
            attribution = {
                "source_type": "reddit_explicit_pain",
                "trigger_type": "ad_bleed_zero_conversion",
                "vertical": "saas",
                "offer_variant": "audit_first_97_checkout",
            }

            with patch.object(deliver_audit, "LEDGER_FILE", str(ledger)), patch.object(deliver_audit, "AUDIT_LEADS_FILE", str(audit_leads)):
                deliver_audit.log_delivery("https://example.com", "lead@example.com", "thr_123", audit, send_result, attribution=attribution)

            entry = json.loads(ledger.read_text().splitlines()[0])
            lead = json.loads(audit_leads.read_text().splitlines()[0])
            self.assertEqual(entry["attribution"], attribution)
            self.assertEqual(lead["source_type"], "reddit_explicit_pain")
            self.assertEqual(lead["trigger_type"], "ad_bleed_zero_conversion")
            self.assertEqual(lead["vertical"], "saas")
            self.assertEqual(lead["offer_variant"], "audit_first_97_checkout")


if __name__ == "__main__":
    unittest.main()
