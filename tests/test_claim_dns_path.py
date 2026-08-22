#!/usr/bin/env python3
"""Task 7: DNS TXT claim verification path (dns-start / dns-check)."""
import asyncio
import hashlib
import unittest
from unittest.mock import AsyncMock, MagicMock, patch


def sha_key(slug: str, value: str) -> str:
    return f"tdns:{slug}:{hashlib.sha256(value.encode()).hexdigest()[:16]}"


class ClaimDnsPathTests(unittest.TestCase):
    def _routes(self):
        from platform_api.routes import teardown_claim_routes as r
        return r

    def test_start_returns_record_instructions(self):
        r = self._routes()
        redis = AsyncMock()
        db = AsyncMock()
        db.get_teardown.return_value = {"domain": "basecamp.com"}
        with patch.object(r, "get_teardown_db", return_value=db):
            out = asyncio_run(r.claim_dns_start("basecamp", redis=redis))
        self.assertEqual(out["record_name"], "_nebula-verify.basecamp.com")
        self.assertIn("nebula=", out["value"])
        self.assertEqual(out["ttl_hours"], 48)
        redis.set.assert_awaited_once()
        args, kwargs = redis.set.await_args
        self.assertEqual(args[0], sha_key("basecamp", out["value"]))
        self.assertEqual(kwargs.get("ttl"), 48 * 3600)
        self.assertEqual(args[1], {"slug": "basecamp"})
        db.create_claim.assert_not_awaited()

    def test_start_performs_no_claim_creation(self):
        r = self._routes()
        redis = AsyncMock()
        db = AsyncMock()
        db.get_teardown.return_value = {"domain": "basecamp.com"}
        with patch.object(r, "get_teardown_db", return_value=db):
            asyncio_run(r.claim_dns_start("basecamp", redis=redis))
        db.create_claim.assert_not_awaited()

    def test_start_returns_404_for_unknown_slug(self):
        from fastapi import HTTPException
        r = self._routes()
        db = AsyncMock()
        db.get_teardown.return_value = None
        with patch.object(r, "get_teardown_db", return_value=db):
            with self.assertRaises(HTTPException) as cm:
                asyncio_run(r.claim_dns_start("nope", redis=AsyncMock()))
        self.assertEqual(cm.exception.status_code, 404)

    def test_check_success_claims_and_consumes(self):
        r = self._routes()
        redis = AsyncMock()
        value = "nebula=deadbeef"
        redis.get.return_value = {"slug": "basecamp"}
        db = AsyncMock()
        db.get_teardown.return_value = {"domain": "basecamp.com"}
        db.create_claim.return_value = {
            "claimed_by_email": "dns-owner@basecamp.com"}
        rdata = MagicMock()
        # Real dnspython TXT rdata exposes .strings byte chunks; split across
        # two chunks to prove the join logic.
        rdata.strings = [value[:7].encode(), value[7:].encode()]
        resolver = MagicMock()
        resolver.resolve = AsyncMock(return_value=[rdata])
        with patch.object(r, "get_teardown_db", return_value=db), \
             patch.object(r.dns_async, "Resolver", return_value=resolver), \
             patch.object(r, "DNS_CHECK_EMAIL", "dns-owner@basecamp.com"):
            out = asyncio_run(r.claim_dns_check(
                "basecamp", MagicMock(value=value), redis=redis))
        self.assertTrue(out["verified"])
        self.assertEqual(out["email"], "dns-owner@basecamp.com")
        db.create_claim.assert_awaited_with(
            "basecamp", "dns-owner@basecamp.com", "dns_txt")
        redis.delete.assert_awaited_once_with(sha_key("basecamp", value))

    def test_check_wrong_txt_is_false_without_consuming(self):
        r = self._routes()
        redis = AsyncMock()
        redis.get.return_value = {"slug": "basecamp"}
        db = AsyncMock()
        db.get_teardown.return_value = {"domain": "basecamp.com"}
        rdata = MagicMock()
        rdata.strings = [b"nebula=wrong"]
        resolver = MagicMock()
        resolver.resolve = AsyncMock(return_value=[rdata])
        with patch.object(r, "get_teardown_db", return_value=db), \
             patch.object(r.dns_async, "Resolver", return_value=resolver):
            out = asyncio_run(r.claim_dns_check(
                "basecamp", MagicMock(value="nebula=nope"), redis=redis))
        self.assertFalse(out["verified"])
        db.create_claim.assert_not_awaited()
        redis.delete.assert_not_awaited()

    def test_check_dns_failure_is_false_without_consuming(self):
        r = self._routes()
        redis = AsyncMock()
        redis.get.return_value = {"slug": "basecamp"}
        db = AsyncMock()
        db.get_teardown.return_value = {"domain": "basecamp.com"}
        resolver = MagicMock()
        resolver.resolve = AsyncMock(side_effect=RuntimeError("NXDOMAIN"))
        with patch.object(r, "get_teardown_db", return_value=db), \
             patch.object(r.dns_async, "Resolver", return_value=resolver):
            out = asyncio_run(r.claim_dns_check(
                "basecamp", MagicMock(value="nebula=nope"), redis=redis))
        self.assertFalse(out["verified"])
        db.create_claim.assert_not_awaited()
        redis.delete.assert_not_awaited()

    def test_check_without_pending_challenge_is_400(self):
        from fastapi import HTTPException
        r = self._routes()
        redis = AsyncMock()
        redis.get.return_value = None
        db = AsyncMock()
        db.get_teardown.return_value = {"domain": "basecamp.com"}
        with patch.object(r, "get_teardown_db", return_value=db):
            with self.assertRaises(HTTPException) as cm:
                asyncio_run(r.claim_dns_check(
                    "basecamp", MagicMock(value="nebula=nope"), redis=redis))
        self.assertEqual(cm.exception.status_code, 400)

    def test_check_returns_404_for_unknown_slug(self):
        from fastapi import HTTPException
        r = self._routes()
        db = AsyncMock()
        db.get_teardown.return_value = None
        with patch.object(r, "get_teardown_db", return_value=db):
            with self.assertRaises(HTTPException) as cm:
                asyncio_run(r.claim_dns_check(
                    "nope", MagicMock(value="nebula=x"), redis=AsyncMock()))
        self.assertEqual(cm.exception.status_code, 404)

    def test_check_conflict_returns_409_and_keeps_pending(self):
        from fastapi import HTTPException
        from platform_api.services.teardown_db import ClaimConflict
        r = self._routes()
        redis = AsyncMock()
        value = "nebula=deadbeef"
        redis.get.return_value = {"slug": "basecamp"}
        db = AsyncMock()
        db.get_teardown.return_value = {"domain": "basecamp.com"}
        db.create_claim.side_effect = ClaimConflict("other@basecamp.com")
        rdata = MagicMock()
        rdata.strings = [value.encode()]
        resolver = MagicMock()
        resolver.resolve = AsyncMock(return_value=[rdata])
        with patch.object(r, "get_teardown_db", return_value=db), \
             patch.object(r.dns_async, "Resolver", return_value=resolver):
            with self.assertRaises(HTTPException) as cm:
                asyncio_run(r.claim_dns_check(
                    "basecamp", MagicMock(value=value), redis=redis))
        self.assertEqual(cm.exception.status_code, 409)
        redis.delete.assert_not_awaited()


def asyncio_run(coro):
    return asyncio.new_event_loop().run_until_complete(coro)


if __name__ == "__main__":
    unittest.main()
