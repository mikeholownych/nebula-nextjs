#!/usr/bin/env python3
import json
import tempfile
import unittest
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from attribution_report import build_report


class AttributionReportTests(unittest.TestCase):
    def test_build_report_groups_sends_audits_and_payments_by_source(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            (root / "outreach_evidence.jsonl").write_text("\n".join([
                json.dumps({"source_type": "reddit_explicit_pain", "trigger_type": "ad_bleed", "status": "sent"}),
                json.dumps({"source_type": "local_business", "trigger_type": "weak_local_page", "status": "sent"}),
            ]) + "\n")
            (root / "audit_leads.jsonl").write_text("\n".join([
                json.dumps({"email": "a@example.com", "source_type": "reddit_explicit_pain", "trigger_type": "ad_bleed"}),
                json.dumps({"email": "b@example.com", "source_type": "reddit_explicit_pain", "trigger_type": "ad_bleed"}),
                json.dumps({"email": "bounce@example.com", "source_type": "reddit_explicit_pain", "trigger_type": "ad_bleed", "status": "bounced"}),
            ]) + "\n")
            (root / "payments.log").write_text("\n".join([
                json.dumps({"email": "a@example.com", "amount_cents": 9700, "payment_id": "cs_live_123"}),
                json.dumps({"email": "test@example.com", "amount_cents": 9700, "payment_id": "cs_test_123"}),
            ]) + "\n")

            report = build_report(root)

            reddit = report["by_source"]["reddit_explicit_pain"]
            self.assertEqual(reddit["outreach_sent"], 1)
            self.assertEqual(reddit["audits_delivered"], 2)
            self.assertEqual(reddit["payments"], 1)
            self.assertEqual(reddit["revenue_cents"], 9700)
            self.assertEqual(report["totals"]["real_revenue_cents"], 9700)


if __name__ == "__main__":
    unittest.main()
