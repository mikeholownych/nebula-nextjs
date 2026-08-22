#!/usr/bin/env python3
import unittest
from unittest.mock import AsyncMock, MagicMock, patch


class ClaimEmailPathTests(unittest.TestCase):
    def _routes(self):
        from platform_api.routes import teardown_claim_routes as r
        return r

    def test_request_rejects_freemail(self):
        from fastapi import HTTPException
        r = self._routes()
        with self.assertRaises(HTTPException) as cm:
            asyncio_run(r.claim_email_request(
                "basecamp", MagicMock(email="x@gmail.com"),
                MagicMock(headers={}), redis=AsyncMock()))
        self.assertEqual(cm.exception.status_code, 400)

    def test_request_rejects_domain_mismatch(self):
        from fastapi import HTTPException
        r = self._routes()
        db = AsyncMock()
        db.get_teardown.return_value = {"domain": "loom.com"}
        with patch.object(r, "get_teardown_db", return_value=db):
            with self.assertRaises(HTTPException) as cm:
                asyncio_run(r.claim_email_request(
                    "some-slug", MagicMock(email="rep@basecamp.com"),
                    MagicMock(headers={}), redis=AsyncMock()))
        self.assertEqual(cm.exception.status_code, 400)

    def test_verify_consumes_token_and_claims(self):
        from fastapi import HTTPException
        r = self._routes()
        redis = AsyncMock()
        redis.get.side_effect = [
            {"email": "rep@basecamp.com", "created_at": "2026-08-22T00:00:00+00:00"},
            None,
        ]
        db = AsyncMock()
        db.create_claim.return_value = {
            "status": "active", "claimed_by_email": "rep@basecamp.com"}
        with patch.object(r, "get_teardown_db", return_value=db):
            out = asyncio_run(r.claim_email_verify("basecamp", "tok", redis=redis))
            self.assertEqual(out["claimed"], True)
            self.assertEqual(out["email"], "rep@basecamp.com")
            db.create_claim.assert_awaited_with("basecamp", "rep@basecamp.com", "email_domain")
            redis.delete.assert_awaited_once_with(r.token_key("basecamp", "tok"))
            with self.assertRaises(HTTPException) as cm:
                asyncio_run(r.claim_email_verify("basecamp", "tok", redis=redis))
            self.assertEqual(cm.exception.status_code, 400)
            db.create_claim.assert_awaited_once()


def asyncio_run(coro):
    import asyncio
    return asyncio.new_event_loop().run_until_complete(coro)


if __name__ == "__main__":
    unittest.main()
