"""SEC-P1-2 / CODE-4 regressions: server-side session enforcement.

Invariant: a JWT is only valid while its per-session record exists in Redis.
- logout / logout-all / record deletion deny immediately
- a new login must NOT extend unrelated historical sessions
- a Redis flush cannot resurrect sessions (verify requires membership)
"""

import json
import time
from types import SimpleNamespace

import pytest

from platform_api.auth import jwt as jwt_mod


class _FakeRedis:
    """Minimal async fake matching RedisClient surface used by jwt.py."""

    def __init__(self):
        self.store = {}
        self.expire_at = {}

    async def set(self, key, value, ttl=None):
        self.store[key] = value if isinstance(value, str) else json.dumps(value)
        if ttl:
            self.expire_at[key] = time.monotonic() + ttl
        return True

    async def get(self, key):
        if key in self.expire_at and time.monotonic() > self.expire_at[key]:
            self.store.pop(key, None)
            self.expire_at.pop(key, None)
        v = self.store.get(key)
        if v is None:
            return None
        try:
            return json.loads(v)
        except Exception:
            return v

    async def exists(self, key):
        if key in self.expire_at and time.monotonic() > self.expire_at[key]:
            self.store.pop(key, None)
            self.expire_at.pop(key, None)
        return 1 if key in self.store else 0

    async def delete(self, *keys):
        n = 0
        for k in keys:
            if k in self.store:
                self.store.pop(k, None)
                self.expire_at.pop(k, None)
                n += 1
        return n

    async def scan(self, cursor=0, match="*", count=100):
        import fnmatch
        keys = [k for k in self.store if fnmatch.fnmatch(k, match)]
        return 0, keys


@pytest.mark.asyncio
async def test_verify_denies_after_session_record_removed():
    r = _FakeRedis()
    token = await jwt_mod.create_session(r, "user-1", "org-1")
    claims = await jwt_mod.verify_session(r, token)
    assert claims["user_id"] == "user-1"

    sid = claims["jti"]
    await jwt_mod.revoke_session(r, "user-1", sid)
    with pytest.raises(jwt_mod.JWTError):
        await jwt_mod.verify_session(r, token)


@pytest.mark.asyncio
async def test_redis_flush_cannot_resurrect_token():
    r = _FakeRedis()
    token = await jwt_mod.create_session(r, "user-2", "org-2")

    r.store.clear()  # simulate flush / eviction
    with pytest.raises(jwt_mod.JWTError):
        await jwt_mod.verify_session(r, token)


@pytest.mark.asyncio
async def test_new_login_does_not_extend_existing_sessions():
    r = _FakeRedis()
    t1 = await jwt_mod.create_session(r, "user-3", "org-3")
    c1 = await jwt_mod.verify_session(r, t1)

    first_expiry = r.expire_at[jwt_mod._session_key("user-3", c1["jti"])]

    time.sleep(0.01)
    await jwt_mod.create_session(r, "user-3", "org-3")  # second login

    assert r.expire_at[jwt_mod._session_key("user-3", c1["jti"])] == first_expiry


@pytest.mark.asyncio
async def test_revoke_all_sessions_denies_every_token():
    r = _FakeRedis()
    tokens = [await jwt_mod.create_session(r, "user-4", "org-4") for _ in range(3)]
    for t in tokens:
        await jwt_mod.verify_session(r, t)

    n = await jwt_mod.revoke_all_sessions(r, "user-4")
    assert n == 3
    for t in tokens:
        with pytest.raises(jwt_mod.JWTError):
            await jwt_mod.verify_session(r, t)
