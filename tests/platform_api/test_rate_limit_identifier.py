from starlette.requests import Request

from platform_api.middleware.rate_limit import RateLimitMiddleware, _resolve_identity, RouteClass


def _request(path="/audit/run", headers=None, client_host="127.0.0.1"):
    encoded = []
    for key, value in (headers or {}).items():
        encoded.append((key.lower().encode(), value.encode()))
    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": "POST",
        "scheme": "http",
        "path": path,
        "raw_path": path.encode(),
        "query_string": b"",
        "headers": encoded,
        "client": (client_host, 12345),
        "server": ("127.0.0.1", 8001),
    }
    return Request(scope)


def _middleware():
    return RateLimitMiddleware(app=lambda _scope, _receive, _send: None, redis=None)


def test_identifier_never_includes_client_supplied_email():
    """SEC-P1-1 regression: rotating x-audit-email must not mint fresh budget.

    The identity for a given trusted IP is invariant regardless of what
    caller-controlled email headers are supplied.
    """
    mw = _middleware()
    base = _resolve_identity(_request(headers={"X-Forwarded-For": "203.0.113.10"}), RouteClass.EXPENSIVE_WORK, "identity")
    variants = [
        _resolve_identity(_request(headers={
            "X-Forwarded-For": "203.0.113.10",
            "X-Audit-Email": f"attacker{i}@example.com",
        }), RouteClass.EXPENSIVE_WORK, "identity")
        for i in (1, 2, 3)
    ]
    assert all(v == base for v in variants)
    assert "attacker" not in base


def test_identifier_uses_api_key_credential_when_present():
    """Authenticated API-key callers get per-key budget, not shared IP budget."""
    mw = _middleware()
    a = _resolve_identity(_request(headers={"X-Api-Key": "nbk_aaaa"}), RouteClass.EXPENSIVE_WORK, "identity")
    b = _resolve_identity(_request(headers={"X-Api-Key": "nbk_bbbb"}), RouteClass.EXPENSIVE_WORK, "identity")
    anon = _resolve_identity(_request(), RouteClass.EXPENSIVE_WORK, "identity")
    assert a != b
    assert a != anon
    assert "nbk_" not in a  # raw credential never appears unhashed


def test_loopback_direct_peer_still_resolves_distinct_forwarded_ips():
    """Trusted-proxy parsing: distinct forwarded IPs must not collapse."""
    mw = _middleware()
    first = _resolve_identity(_request(headers={"X-Forwarded-For": "203.0.113.10"}, client_host="127.0.0.1"), RouteClass.EXPENSIVE_WORK, "identity")
    second = _resolve_identity(_request(headers={"X-Forwarded-For": "203.0.113.11"}, client_host="127.0.0.1"), RouteClass.EXPENSIVE_WORK, "identity")
    assert first != second
