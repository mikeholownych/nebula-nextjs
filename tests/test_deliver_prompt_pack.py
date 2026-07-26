import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import deliver_prompt_pack as dpp  # noqa: E402


class DeliverPromptPackTests(unittest.TestCase):
    def test_find_audited_url_returns_exact_audit_match(self):
        rows = [
            {"event_type": "audit_delivered", "audit_id": "audit-old", "email": "buyer@example.com", "url": "https://old.example"},
            {"event_type": "audit_delivered", "audit_id": "audit-selected", "email": "buyer@example.com", "url": "https://selected.example"},
        ]
        self.assertEqual(
            dpp.find_audited_url("audit-selected", "buyer@example.com", rows),
            "https://selected.example",
        )

    def test_find_audited_url_does_not_fall_back_to_latest_email_match(self):
        rows = [{"event_type": "audit_delivered", "email": "someone@example.com", "url": "https://x.example"}]
        self.assertIsNone(dpp.find_audited_url("audit-selected", "someone@example.com", rows))

    def test_fetch_audited_url_uses_exact_id_without_requiring_a_stored_email(self):
        response = unittest.mock.Mock(
            status_code=200,
        )
        response.json.return_value = {
            "audit_id": "audit-selected",
            "email": None,
            "status": "completed",
            "url": "https://selected.example",
        }
        with patch("requests.get", return_value=response):
            self.assertEqual(
                dpp.fetch_audited_url("audit-selected", "buyer@example.com"),
                "https://selected.example",
            )

    def test_already_delivered_keys_on_stripe_session_not_email(self):
        rows = [{
            "event_type": "prompt_pack_delivered",
            "email": "Buyer@Example.com",
            "stripe_session_id": "cs_first",
        }]
        self.assertTrue(dpp.already_delivered("cs_first", rows))
        self.assertFalse(dpp.already_delivered("cs_second", rows))
        self.assertEqual(dpp.delivery_client_id("cs_first"), "fix-pack:cs_first")
        self.assertEqual(dpp.delivery_client_id("cs_first"), dpp.delivery_client_id("cs_first"))
        self.assertNotEqual(dpp.delivery_client_id("cs_first"), dpp.delivery_client_id("cs_second"))

    def test_main_refuses_to_send_when_bounce_check_errors(self):
        with patch("lead_store.LeadStore") as MockStore:
            MockStore.return_value.is_bounced.side_effect = RuntimeError("db locked")
            with patch.object(sys, "argv", ["deliver_prompt_pack.py", "--email", "buyer@example.com", "--stripe-session-id", "cs_test", "--audit-id", "audit-selected"]), \
                 patch.object(dpp, "telegram_notify") as mock_notify, \
                 patch.object(dpp, "load_ledger_rows") as mock_rows:
                rc = dpp.main()
        self.assertEqual(rc, 1)
        mock_rows.assert_called_once()
        mock_notify.assert_called_once()
        self.assertIn("bounce check failed", mock_notify.call_args[0][0])

    def test_main_refuses_to_send_when_bounced(self):
        with patch("lead_store.LeadStore") as MockStore:
            MockStore.return_value.is_bounced.return_value = True
            with patch.object(sys, "argv", ["deliver_prompt_pack.py", "--email", "buyer@example.com", "--stripe-session-id", "cs_test", "--audit-id", "audit-selected"]), \
                 patch.object(dpp, "telegram_notify") as mock_notify:
                rc = dpp.main()
        self.assertEqual(rc, 1)
        self.assertIn("bounce list", mock_notify.call_args[0][0])

    def test_main_is_idempotent_on_repeat_delivery(self):
        rows = [{
            "event_type": "prompt_pack_delivered",
            "email": "different@example.com",
            "stripe_session_id": "cs_test",
        }]
        with patch("lead_store.LeadStore") as MockStore:
            MockStore.return_value.is_bounced.return_value = False
            with patch.object(sys, "argv", ["deliver_prompt_pack.py", "--email", "buyer@example.com", "--stripe-session-id", "cs_test", "--audit-id", "audit-selected"]), \
                 patch.object(dpp, "load_ledger_rows", return_value=rows), \
                 patch.object(dpp, "fetch_audited_url") as mock_find_url:
                rc = dpp.main()
        self.assertEqual(rc, 0)
        MockStore.assert_not_called()
        mock_find_url.assert_not_called()  # short-circuited before needing the URL

    def test_main_escalates_when_no_prior_audit_found(self):
        with patch("lead_store.LeadStore") as MockStore:
            MockStore.return_value.is_bounced.return_value = False
            with patch.object(sys, "argv", ["deliver_prompt_pack.py", "--email", "buyer@example.com", "--stripe-session-id", "cs_test", "--audit-id", "audit-selected"]), \
                 patch.object(dpp, "load_ledger_rows", return_value=[]), \
                 patch.object(dpp, "fetch_audited_url", return_value=None), \
                 patch.object(dpp, "telegram_notify") as mock_notify:
                rc = dpp.main()
        self.assertEqual(rc, 1)
        self.assertIn("exact audit audit-selected", mock_notify.call_args[0][0])

    def test_full_delivery_path_logs_ledger_and_updates_hot_lead(self):
        rows = [{"event_type": "audit_delivered", "email": "buyer@example.com", "url": "https://lead.example", "timestamp": "2026-07-01T00:00:00Z"}]
        fake_pack = {
            "count": 2,
            "teaser": {"key": "headline", "label": "Headline", "prompt_md": "teaser prompt"},
            "full_pack": [{"key": "cta", "label": "CTA", "prompt_md": "second prompt"}],
        }
        with tempfile.TemporaryDirectory() as td:
            ledger_path = Path(td) / "customer-ledger.jsonl"
            hot_lead_path = Path(td) / "HOT_LEAD.json"
            hot_lead_path.write_text(json.dumps([{"email": "buyer@example.com", "url": "https://lead.example", "stage": "pitch_sent"}]))

            with patch("lead_store.LeadStore") as MockStore:
                MockStore.return_value.is_bounced.return_value = False
                with patch.object(sys, "argv", ["deliver_prompt_pack.py", "--email", "buyer@example.com", "--stripe-session-id", "cs_test", "--audit-id", "audit-selected"]), \
                     patch.object(dpp, "LEDGER_FILE", ledger_path), \
                     patch.object(dpp, "HOT_LEAD_PATH", hot_lead_path), \
                     patch.object(dpp, "load_ledger_rows", return_value=rows), \
                     patch.object(dpp, "fetch_audited_url", return_value="https://lead.example"), \
                     patch.object(dpp, "scrape_page", return_value={"url": "https://lead.example"}), \
                     patch.object(dpp, "score_audit", return_value={"overall": 7.0, "overall_grade": "B", "dimensions": {}}), \
                     patch.object(dpp, "build_prompt_pack", return_value=fake_pack), \
                     patch.object(dpp, "send_via_agentmail", return_value={"ok": True, "message_id": "msg_123"}) as mock_send, \
                     patch.object(dpp, "telegram_notify") as mock_notify:
                    rc = dpp.main()

            self.assertEqual(rc, 0)
            ledger_row = json.loads(ledger_path.read_text().splitlines()[-1])
            self.assertEqual(ledger_row["event_type"], "prompt_pack_delivered")
            self.assertEqual(ledger_row["stripe_session_id"], "cs_test")
            self.assertEqual(ledger_row["prompt_count"], 2)
            self.assertEqual(ledger_row["message_id"], "msg_123")
            mock_send.assert_called_once_with(
                to="buyer@example.com",
                subject=unittest.mock.ANY,
                body=unittest.mock.ANY,
                client_id="fix-pack:cs_test",
            )

            hot_leads = json.loads(hot_lead_path.read_text())
            self.assertEqual(hot_leads[0]["stage"], "prompt_pack_delivered")
            self.assertEqual(hot_leads[0]["status"], "fulfilled")
            mock_notify.assert_called_once()
            self.assertIn("Prompt pack delivered", mock_notify.call_args[0][0])


if __name__ == "__main__":
    unittest.main()
