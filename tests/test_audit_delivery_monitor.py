#!/usr/bin/env python3
import json
import sys
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import audit_delivery_monitor as monitor


NOW = datetime(2026, 7, 19, 9, 0, tzinfo=timezone.utc)


def write_fixture(base: Path, hot_leads: list, ledger_rows: list) -> None:
    (base / "ledgers").mkdir(parents=True)
    (base / "HOT_LEAD.json").write_text(json.dumps(hot_leads), encoding="utf-8")
    (base / "ledgers" / "customer-ledger.jsonl").write_text(
        "".join(json.dumps(row) + "\n" for row in ledger_rows), encoding="utf-8"
    )
    (base / "deliver_audit.py").write_text("# fixture\n", encoding="utf-8")


class AuditDeliveryMonitorTests(unittest.TestCase):
    def test_uses_current_audit_delivered_stage_and_ledger_event(self):
        with tempfile.TemporaryDirectory() as td:
            base = Path(td)
            write_fixture(
                base,
                [{
                    "email": "lead@example.com",
                    "stage": "audit_delivered",
                    "status": "pending",
                    "action": "send_97_pitch",
                    "pitch_due_at": "2026-07-21T09:00:00Z",
                }],
                [{
                    "timestamp": "2026-07-19T08:00:00Z",
                    "event_type": "audit_delivered",
                    "email": "lead@example.com",
                    "send_status": "sent",
                    "message_id": "msg_1",
                }],
            )
            result = monitor.collect_pipeline_state(base, NOW)
            self.assertEqual(result["stage_counts"]["audit_delivered"], 1)
            self.assertEqual(result["delivery_events_total"], 1)
            self.assertEqual(result["delivery_events_24h"], 1)
            self.assertEqual(result["pending_audit_requests"], 0)
            self.assertEqual(result["overdue_pitches"], 0)

    def test_terminal_deliver_action_is_not_pending_but_unrouted_warm_reply_is(self):
        with tempfile.TemporaryDirectory() as td:
            base = Path(td)
            write_fixture(
                base,
                [
                    {
                        "email": "closed@example.com",
                        "stage": "closed",
                        "status": "stop_reply",
                        "action": "deliver_audit",
                        "updated_at": "2026-07-10T09:00:00Z",
                    },
                    {
                        "email": "warm@example.com",
                        "stage": "warm_replied",
                        "status": "",
                        "action": "",
                        "updated_at": "2026-07-19T08:00:00Z",
                    },
                ],
                [],
            )
            result = monitor.collect_pipeline_state(base, NOW)
            self.assertEqual(result["pending_audit_requests"], 0)
            self.assertEqual(result["unrouted_warm_replies"], 1)

    def test_overdue_pitch_uses_pitch_due_at_not_obsolete_168_hour_threshold(self):
        with tempfile.TemporaryDirectory() as td:
            base = Path(td)
            write_fixture(
                base,
                [{
                    "email": "lead@example.com",
                    "stage": "audit_delivered",
                    "status": "pending",
                    "action": "send_97_pitch",
                    "pitch_due_at": "2026-07-19T08:59:00Z",
                }],
                [],
            )
            result = monitor.collect_pipeline_state(base, NOW)
            self.assertEqual(result["overdue_pitches"], 1)

    def test_malformed_hot_lead_fails_closed(self):
        with tempfile.TemporaryDirectory() as td:
            base = Path(td)
            (base / "ledgers").mkdir()
            (base / "HOT_LEAD.json").write_text('{"not": "a list"}', encoding="utf-8")
            (base / "ledgers" / "customer-ledger.jsonl").write_text("", encoding="utf-8")
            (base / "deliver_audit.py").write_text("# fixture\n", encoding="utf-8")
            with self.assertRaises(monitor.MonitorDataError):
                monitor.collect_pipeline_state(base, NOW)


if __name__ == "__main__":
    unittest.main()
