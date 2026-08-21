from starlette.requests import Request

from platform_api.middleware.rate_limit import RateLimitMiddleware


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


def test_audit_run_identifier_uses_forwarded_ip_and_email_not_loopback():
    ident = _middleware()._get_identifier(_request(headers={
        "X-Forwarded-For": "203.0.113.10",
        "X-Audit-Email": "founder@example.com",
    }, client_host="127.0.0.1"))
    assert "127.0.0.1" not in ident
    assert "203.0.113.10" in ident
    assert "founder@example.com" in ident


def test_loopback_portal_traffic_is_not_collapsed_to_one_key():
    mw = _middleware()
    first = mw._get_identifier(_request(headers={"X-Audit-Email": "a@example.com"}))
    second = mw._get_identifier(_request(headers={"X-Audit-Email": "b@example.com"}))
    assert first != second
    assert "a@example.com" in first
    assert "b@example.com" in second
