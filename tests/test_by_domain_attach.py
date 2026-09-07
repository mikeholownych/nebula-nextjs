#!/usr/bin/env python3
import unittest
from unittest.mock import AsyncMock, patch


class ByDomainTests(unittest.TestCase):
    def _routes(self):
        from platform_api.routes import audit_api as r
        return r

    def test_claimant_allowed(self):
        r = self._routes()
        db = AsyncMock()
        db.get_active_claim_by_domain.return_value = {
            "slug": "loom", "claimed_by_email": "rep@loom.com"}
        audit_db = AsyncMock()
        audit_db.list_audits_by_domain.return_value = [{"id": "a1"}]
        with patch("platform_api.routes.audit_api.get_teardown_db",
                   return_value=db), \
             patch("platform_api.routes.audit_api.get_audit_db",
                   return_value=audit_db):
            out = asyncio_run(r.audits_by_domain(
                domain="loom.com", email="rep@loom.com"))
        self.assertEqual(out["audits"], [{"id": "a1"}])

    def test_non_claimant_forbidden(self):
        from fastapi import HTTPException
        r = self._routes()
        db = AsyncMock()
        db.get_active_claim_by_domain.return_value = {
            "slug": "loom", "claimed_by_email": "rep@loom.com"}
        with patch("platform_api.routes.audit_api.get_teardown_db",
                   return_value=db):
            with self.assertRaises(HTTPException) as cm:
                asyncio_run(r.audits_by_domain(domain="loom.com",
                                               email="stranger@elsewhere.com"))
        self.assertEqual(cm.exception.status_code, 403)


def asyncio_run(coro):
    import asyncio
    return asyncio.run(coro)


if __name__ == "__main__":
    unittest.main()
