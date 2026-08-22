#!/usr/bin/env python3
import unittest
from unittest.mock import AsyncMock

from fastapi import HTTPException


class RateLimitTests(unittest.TestCase):
    def test_blocks_after_limit(self):
        from platform_api.services.rate_limit import enforce_rate_limit
        redis = AsyncMock()
        redis.incr.return_value = 1
        asyncio_run(enforce_rate_limit(redis, "k", 3, 3600))
        redis.incr.return_value = 4
        with self.assertRaises(HTTPException) as cm:
            asyncio_run(enforce_rate_limit(redis, "k2", 3, 3600))
        self.assertEqual(cm.exception.status_code, 429)


def asyncio_run(coro):
    import asyncio
    return asyncio.new_event_loop().run_until_complete(coro)


if __name__ == "__main__":
    unittest.main()
