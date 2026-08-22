#!/usr/bin/env python3
"""Task 8: GSC property-match claim verification path (session-authenticated)."""
import asyncio
import unittest
from unittest.mock import AsyncMock, MagicMock, patch


class ClaimGscPathTests(unittest.TestCase):
    def _routes(self):
        from platform_api.routes import teardown_claim_routes as r
        return r

    def test_match_claims(self):
        r = self._routes()
        db = AsyncMock()
        db.get_teardown.return_value = {"domain": "nebulacomponents.com"}
        db.create_claim.return_value = {
            "claimed_by_email": "f@nebulacomponents.com"}
        user = MagicMock(email="f@nebulacomponents.com")
        dbsession = MagicMock()
        with patch.object(r, "get_teardown_db", return_value=db), \
             patch.object(r, "_gsc_site_for_user_model",
                          new=MagicMock(
                              return_value=MagicMock(
                                  gsc_site_url="sc-domain:nebulacomponents.com"))):
            out = asyncio_run(r.claim_gsc_check(
                "some-slug", current_user={"user": user}, db=dbsession))
        self.assertEqual(out["claimed"], True)
        self.assertEqual(out["email"], "f@nebulacomponents.com")
        db.create_claim.assert_awaited_with(
            "some-slug", "f@nebulacomponents.com", "gsc")

    def test_no_connection_is_400(self):
        from fastapi import HTTPException
        r = self._routes()
        db = AsyncMock()
        db.get_teardown.return_value = {"domain": "nebulacomponents.com"}
        dbsession = MagicMock()
        with patch.object(r, "get_teardown_db", return_value=db), \
             patch.object(r, "_gsc_site_for_user_model",
                          new=MagicMock(return_value=None)):
            with self.assertRaises(HTTPException) as cm:
                asyncio_run(r.claim_gsc_check(
                    "some-slug",
                    current_user={"user":
                                  MagicMock(email="x@y.com")}, db=dbsession))
        self.assertEqual(cm.exception.status_code, 400)
        db.create_claim.assert_not_awaited()

    def test_mismatched_property_is_400(self):
        from fastapi import HTTPException
        r = self._routes()
        db = AsyncMock()
        db.get_teardown.return_value = {"domain": "nebulacomponents.com"}
        dbsession = MagicMock()
        with patch.object(r, "get_teardown_db", return_value=db), \
             patch.object(r, "_gsc_site_for_user_model",
                          new=MagicMock(
                              return_value=MagicMock(
                                  gsc_site_url="sc-domain:example.com"))):
            with self.assertRaises(HTTPException) as cm:
                asyncio_run(r.claim_gsc_check(
                    "some-slug",
                    current_user={"user":
                                  MagicMock(email="x@example.com")},
                    db=dbsession))
        self.assertEqual(cm.exception.status_code, 400)
        db.create_claim.assert_not_awaited()

    def test_unknown_slug_is_404(self):
        from fastapi import HTTPException
        r = self._routes()
        db = AsyncMock()
        db.get_teardown.return_value = None
        with patch.object(r, "get_teardown_db", return_value=db):
            with self.assertRaises(HTTPException) as cm:
                asyncio_run(r.claim_gsc_check(
                    "nope",
                    current_user={"user":
                                  MagicMock(email="x@y.com")},
                    db=MagicMock()))
        self.assertEqual(cm.exception.status_code, 404)

    def test_conflict_is_409(self):
        from fastapi import HTTPException
        from platform_api.services.teardown_db import ClaimConflict
        r = self._routes()
        db = AsyncMock()
        db.get_teardown.return_value = {"domain": "nebulacomponents.com"}
        db.create_claim.side_effect = ClaimConflict("other@nebulacomponents.com")
        with patch.object(r, "get_teardown_db", return_value=db), \
             patch.object(r, "_gsc_site_for_user_model",
                          new=MagicMock(
                              return_value=MagicMock(
                                  gsc_site_url="https://nebulacomponents.com/"))):
            with self.assertRaises(HTTPException) as cm:
                asyncio_run(r.claim_gsc_check(
                    "some-slug",
                    current_user={"user":
                                  MagicMock(email="f@nebulacomponents.com")},
                    db=MagicMock()))
        self.assertEqual(cm.exception.status_code, 409)

    def test_session_router_has_no_internal_guard(self):
        r = self._routes()
        deps = [d for d in r.router_session.dependencies]
        self.assertEqual(deps, [])


def asyncio_run(coro):
    return asyncio.new_event_loop().run_until_complete(coro)


if __name__ == "__main__":
    unittest.main()
