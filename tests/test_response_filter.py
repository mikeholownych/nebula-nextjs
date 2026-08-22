#!/usr/bin/env python3
"""Task 10: deterministic response auto-filter + owner PATCH / founder takedown."""
import asyncio
import unittest
from unittest.mock import AsyncMock, MagicMock, patch


class ResponseFilterTests(unittest.TestCase):
    def test_clean_passes(self):
        from platform_api.services.response_filter import evaluate_response
        r = evaluate_response("We fixed the headline last week. Thanks for the audit!")
        self.assertTrue(r.allowed)
        self.assertEqual(r.reasons, [])

    def test_too_long(self):
        from platform_api.services.response_filter import evaluate_response
        r = evaluate_response("x" * 1001)
        self.assertFalse(r.allowed)
        self.assertIn("too_long", r.reasons)

    def test_too_many_links(self):
        from platform_api.services.response_filter import evaluate_response
        r = evaluate_response("a http://a.com b http://b.com c https://c.com d https://d.com")
        self.assertIn("too_many_links", r.reasons)

    def test_legal_threat_flagged(self):
        from platform_api.services.response_filter import evaluate_response
        r = evaluate_response("Remove this or we will sue immediately")
        self.assertFalse(r.allowed)
        self.assertIn("flagged:legal_threat", r.reasons)

    def test_contact_farming_flagged(self):
        from platform_api.services.response_filter import evaluate_response
        r = evaluate_response("Contact me at my telegram for guest post offers")
        self.assertFalse(r.allowed)
        self.assertIn("flagged:contact_farming", r.reasons)

    def test_exactly_at_limits_passes(self):
        from platform_api.services.response_filter import evaluate_response
        r = evaluate_response("x" * 1000)
        self.assertTrue(r.allowed)
        # NOTE: the brief's _LINK_RE counts a full "https://a.com" as two
        # hits (scheme + bare domain), so the <=3 boundary uses bare domains.
        r2 = evaluate_response("mirrors at a.com b.io c.dev if you hit issues")
        self.assertTrue(r2.allowed)


class ResponseRoutesTests(unittest.TestCase):
    OWNER = "qa-owner@invalid.nebulacomponents.com"
    FOUNDER = "mike.holownych@gmail.com"

    def _routes(self):
        from platform_api.routes import teardown_claim_routes as r
        return r

    def _record(self, email=OWNER):
        return {"slug": "qa-filter-demo", "domain": "qa-filter-demo.invalid",
                "claim": {"claimed_by_email": email, "status": "active"}}

    def _db(self, record):
        db = AsyncMock()
        db.get_teardown.return_value = record
        db.update_response.return_value = {}
        db.set_response_status.return_value = {}
        return db

    def test_clean_response_stores_visible(self):
        r = self._routes()
        db = self._db(self._record())
        body = r.ResponsePatch(response_text="We shipped the fixes last week.")
        with patch.object(r, "get_teardown_db", return_value=db), \
             patch.object(r, "_notify_founder") as notify:
            out = asyncio_run(r.update_response(
                "qa-filter-demo", body,
                current_user={"user": MagicMock(email=self.OWNER)}))
        self.assertEqual(out["response_status"], "visible")
        self.assertEqual(out["reasons"], [])
        db.update_response.assert_awaited_with(
            "qa-filter-demo", self.OWNER,
            response_text="We shipped the fixes last week.")
        db.set_response_status.assert_awaited_with("qa-filter-demo", "visible")
        notify.assert_not_called()

    def test_long_response_auto_hidden_and_notifies_founder(self):
        r = self._routes()
        db = self._db(self._record())
        body = r.ResponsePatch(response_text="x" * 1200)
        with patch.object(r, "get_teardown_db", return_value=db), \
             patch.object(r, "_notify_founder") as notify:
            out = asyncio_run(r.update_response(
                "qa-filter-demo", body,
                current_user={"user": MagicMock(email=self.OWNER)}))
        self.assertEqual(out["response_status"], "auto_hidden")
        self.assertIn("too_long", out["reasons"])
        db.set_response_status.assert_awaited_with("qa-filter-demo", "auto_hidden")
        notify.assert_called_once()
        self.assertIn("qa-filter-demo", notify.call_args.args[0])

    def test_private_context_saved_without_status_change(self):
        r = self._routes()
        db = self._db(self._record())
        body = r.ResponsePatch(private_context="Roadmap context for Nebula only.")
        with patch.object(r, "get_teardown_db", return_value=db), \
             patch.object(r, "_notify_founder") as notify:
            out = asyncio_run(r.update_response(
                "qa-filter-demo", body,
                current_user={"user": MagicMock(email=self.OWNER)}))
        self.assertEqual(out.get("private_context"), "saved")
        self.assertNotIn("response_status", out)
        db.update_response.assert_awaited_once()
        db.set_response_status.assert_not_awaited()
        notify.assert_not_called()

    def test_non_owner_gets_404_and_no_writes(self):
        from fastapi import HTTPException
        r = self._routes()
        db = self._db(self._record(email="someone-else@invalid.nebulacomponents.com"))
        body = r.ResponsePatch(response_text="hello")
        with patch.object(r, "get_teardown_db", return_value=db):
            with self.assertRaises(HTTPException) as cm:
                asyncio_run(r.update_response(
                    "qa-filter-demo", body,
                    current_user={"user": MagicMock(email=self.OWNER)}))
        self.assertEqual(cm.exception.status_code, 404)
        db.update_response.assert_not_awaited()
        db.set_response_status.assert_not_awaited()

    def test_no_claim_gets_404(self):
        from fastapi import HTTPException
        r = self._routes()
        db = self._db({"slug": "qa-filter-demo",
                       "domain": "qa-filter-demo.invalid", "claim": None})
        body = r.ResponsePatch(response_text="hello")
        with patch.object(r, "get_teardown_db", return_value=db):
            with self.assertRaises(HTTPException) as cm:
                asyncio_run(r.update_response(
                    "qa-filter-demo", body,
                    current_user={"user": MagicMock(email=self.OWNER)}))
        self.assertEqual(cm.exception.status_code, 404)

    def test_takedown_by_founder_sets_removed(self):
        r = self._routes()
        db = self._db(self._record())
        db.set_response_status.return_value = {"response_status": "removed"}
        with patch.object(r, "get_teardown_db", return_value=db):
            out = asyncio_run(r.takedown(
                "qa-filter-demo",
                current_user={"user": MagicMock(email=self.FOUNDER)}))
        self.assertEqual(out["response_status"], "removed")
        db.set_response_status.assert_awaited_with("qa-filter-demo", "removed")

    def test_takedown_nonfounder_403(self):
        from fastapi import HTTPException
        r = self._routes()
        db = self._db(self._record())
        with patch.object(r, "get_teardown_db", return_value=db):
            with self.assertRaises(HTTPException) as cm:
                asyncio_run(r.takedown(
                    "qa-filter-demo",
                    current_user={"user": MagicMock(email=self.OWNER)}))
        self.assertEqual(cm.exception.status_code, 403)
        db.set_response_status.assert_not_awaited()

    def test_takedown_nothing_to_remove_is_404(self):
        from fastapi import HTTPException
        r = self._routes()
        db = self._db(self._record())
        db.set_response_status.return_value = None
        with patch.object(r, "get_teardown_db", return_value=db):
            with self.assertRaises(HTTPException) as cm:
                asyncio_run(r.takedown(
                    "nope-slug",
                    current_user={"user": MagicMock(email=self.FOUNDER)}))
        self.assertEqual(cm.exception.status_code, 404)


def asyncio_run(coro):
    return asyncio.new_event_loop().run_until_complete(coro)


if __name__ == "__main__":
    unittest.main()
