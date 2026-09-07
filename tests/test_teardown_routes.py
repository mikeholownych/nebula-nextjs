#!/usr/bin/env python3
import unittest
from unittest.mock import AsyncMock, patch

from fastapi import HTTPException


class TeardownRouteTests(unittest.TestCase):
    def _routes(self):
        from platform_api.routes import teardown_routes
        return teardown_routes

    def test_list_returns_rows(self):
        r = self._routes()
        fake = AsyncMock()
        fake.list_teardowns.return_value = [{
            "slug": "basecamp", "name": "Basecamp",
            "url": "https://basecamp.com", "domain": "basecamp.com",
            "score": 82, "grade": "B", "audited_at": "2026-08-22",
            "summary": "s", "screenshot_path": "/tmp/x.png", "claimed": True}]
        with patch.object(r, "get_teardown_db", return_value=fake):
            out = asyncio_run(r.list_teardowns())
        self.assertEqual(out["teardowns"][0]["slug"], "basecamp")

    def test_get_unknown_slug_404(self):
        r = self._routes()
        fake = AsyncMock()
        fake.get_teardown.return_value = None
        with patch.object(r, "get_teardown_db", return_value=fake):
            with self.assertRaises(HTTPException) as cm:
                asyncio_run(r.get_teardown("nope"))
        self.assertEqual(cm.exception.status_code, 404)

    def test_claim_status_shape(self):
        r = self._routes()
        fake = AsyncMock()
        fake.get_teardown.return_value = {}
        with patch.object(r, "get_teardown_db", return_value=fake):
            out = asyncio_run(r.claim_status("basecamp"))
        self.assertEqual(out, {"claimed": False})


def asyncio_run(coro):
    import asyncio
    return asyncio.run(coro)


if __name__ == "__main__":
    unittest.main()
