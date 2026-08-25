#!/usr/bin/env python3
"""Workspace-app verification suite.

Runs against the LIVE local services (:3005 app, :8001 platform API, both DBs).
Mints real Redis-backed sessions through the platform jwt machinery, exercises
the auth/isolation/lifecycle contracts, reverts mutations it makes, revokes its
sessions, and reports PASS/FAIL per check. Exit 0 only when all checks pass.

Usage: /home/mike/nebula/venv/bin/python3 tests/verify_workspace.py
"""

import asyncio
import json
import sys
import urllib.error
import urllib.request

sys.path.insert(0, "/home/mike/nebula")

BASE = "http://localhost:3005"
MIKE_ID = "002cc901-4181-49db-bf18-9b49c6740b17"
USER2_ID = "e914bc03-82b6-456e-82b5-1820da5ef68d"
SCRATCH_FINDING = "NBL-10530"  # status must be 'new' before and after the run

results: list[tuple[bool, str, str]] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    results.append((ok, name, detail))
    mark = "PASS" if ok else "FAIL"
    print(f"[{mark}] {name}" + (f" | {detail}" if detail else ""))


def req(method: str, path: str, token: str | None = None, body: dict | None = None):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method)
    if token:
        r.add_header("Cookie", f"access_token={token}")
    if body is not None:
        r.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(r, timeout=15) as resp:
            return resp.status, json.loads(resp.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode() or "{}")
        except Exception:
            return e.code, {}


async def mint(user_id: str):
    from platform_api.redis_client import RedisClient
    from platform_api.auth.jwt import create_session

    r: RedisClient = RedisClient()
    await r.connect()
    token = await create_session(
        r, user_id, "00000000-0000-0000-0000-000000000000",
        {"test": "verify-workspace-suite"},
    )
    return token, r


async def main() -> int:
    from platform_api.auth.jwt import revoke_all_sessions

    # --- setup: fresh sessions ---
    mike_tok, redis = await mint(MIKE_ID)
    user2_tok, _ = await mint(USER2_ID)

    # --- 1. anonymous access control ---
    s, b = req("GET", "/api/findings")
    check("anon findings -> 401", s == 401 and b.get("code") == "AUTH_REQUIRED", f"got {s}")
    s, _ = req("PATCH", f"/api/findings/{SCRATCH_FINDING}", body={"status": "acknowledged"})
    check("anon patch -> 401", s == 401, f"got {s}")
    s, _ = req("GET", "/api/overview")
    check("anon overview -> 401", s == 401, f"got {s}")

    # --- 2. authenticated tenant visibility ---
    s, b = req("GET", "/api/findings?limit=200", mike_tok)
    domains = {f["domain"] for f in b.get("findings", [])}
    check(
        "mike sees his findings",
        s == 200 and len(b.get("findings", [])) > 0,
        f"{b.get('count')} findings, {len(domains)} domains",
    )
    s, b2 = req("GET", "/api/findings?limit=200", user2_tok)
    check("user2 sees zero findings", s == 200 and b2.get("count") == 0, f"got {b2.get('count')}")

    # --- 3. cross-tenant mutation denied ---
    s, b = req("PATCH", f"/api/findings/{SCRATCH_FINDING}", user2_tok, {"status": "acknowledged"})
    check("user2 patch mike's finding -> 403", s == 403 and b.get("code") == "FORBIDDEN", f"got {s}")

    # --- 4. lifecycle state machine on scratch finding ---
    s, b = req("GET", f"/api/findings/{SCRATCH_FINDING}", mike_tok)
    pre = b.get("finding", {}).get("status")
    check(f"scratch finding starts '{pre}'", pre == "new", f"got {pre}")

    s, b = req("PATCH", f"/api/findings/{SCRATCH_FINDING}", mike_tok, {"status": "acknowledged"})
    check("new -> acknowledged", s == 200 and b.get("status") == "acknowledged", f"got {s}")

    s, b = req("PATCH", f"/api/findings/{SCRATCH_FINDING}", mike_tok, {"status": "regressed"})
    check("acknowledged -> regressed rejected 409", s == 409 and b.get("code") == "INVALID_TRANSITION", f"got {s}")

    s, b = req("PATCH", f"/api/findings/{SCRATCH_FINDING}", mike_tok, {"status": "resolved"})
    check("acknowledged -> resolved", s == 200, f"got {s}")

    s, b = req("PATCH", f"/api/findings/{SCRATCH_FINDING}", mike_tok, {"status": "regressed"})
    check("resolved -> regressed allowed (manual regression report)", s == 200 and b.get("status") == "regressed", f"got {s}")

    # invalid jump: regressed cannot go straight back to new (must pass through acknowledgement)
    s, b = req("PATCH", f"/api/findings/{SCRATCH_FINDING}", mike_tok, {"status": "new"})
    check("regressed -> new rejected 409", s == 409, f"got {s}")

    s, b = req("PATCH", f"/api/findings/{SCRATCH_FINDING}", mike_tok, {"status": "acknowledged"})
    check("regressed -> acknowledged", s == 200, f"got {s}")

    s, b = req("PATCH", f"/api/findings/{SCRATCH_FINDING}", mike_tok, {"status": "new"})
    check("revert to new (clean state)", s == 200 and b.get("status") == "new", f"got {s}")

    s, b = req("GET", f"/api/findings/{SCRATCH_FINDING}", mike_tok)
    n_events = len(b.get("history") or [])
    check("event history recorded", n_events >= 5, f"{n_events} events total")

    # --- 5. overview aggregation ---
    s, b = req("GET", "/api/overview", mike_tok)
    check(
        "mike overview has properties+attention",
        s == 200 and b.get("properties", 0) > 0 and isinstance(b.get("requiresAttention"), list),
        f"{b.get('properties')} properties, {len(b.get('requiresAttention') or [])} attention",
    )
    s, b = req("GET", "/api/overview", user2_tok)
    zeros = all(v == 0 for v in (b.get("countsByStatus") or {}).values())
    check(
        "user2 overview all zeros",
        s == 200 and b.get("properties") == 0 and zeros,
        f"properties={b.get('properties')}",
    )

    # --- 6. teardown + revocation proof ---
    await revoke_all_sessions(redis, MIKE_ID)
    await revoke_all_sessions(redis, USER2_ID)
    s, _ = req("GET", "/api/findings", mike_tok)
    check("revoked session dead (401)", s == 401, f"got {s}")

    failed = [r for r in results if not r[0]]
    print(f"\n{len(results) - len(failed)}/{len(results)} checks passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
