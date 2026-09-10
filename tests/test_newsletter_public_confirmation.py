"""Double-opt-in routing regression. No real database or delivery client."""
import asyncio
import sys
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock
from urllib.parse import parse_qs, urlsplit

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from platform_api.routes import newsletter


def test_confirmation_email_uses_public_same_origin_proxy(monkeypatch):
    token = "isolated+token/with?reserved=&characters"
    monkeypatch.setattr(newsletter, "newsletter_subscribe", AsyncMock(return_value={
        "id": "isolated-subscriber", "confirmation_token": token,
    }))
    marked = AsyncMock()
    monkeypatch.setattr(newsletter, "newsletter_mark_confirmation_sent", marked)
    send = Mock(return_value={"id": "isolated-send"})
    monkeypatch.setitem(sys.modules, "agentmail_client", SimpleNamespace(
        AgentMailClient=Mock(return_value=SimpleNamespace(send_transactional=send)),
    ))
    result = asyncio.run(newsletter.subscribe(newsletter.NewsletterSignupRequest(email="optin@example.org")))
    assert result["success"] is True
    message = send.call_args.kwargs
    url = next(line for line in message["text"].splitlines() if "/api/newsletter/confirm?" in line)
    parsed = urlsplit(url)
    assert (parsed.scheme, parsed.netloc, parsed.path) == (
        "https", "nebulacomponents.com", "/api/newsletter/confirm",
    )
    assert parse_qs(parsed.query) == {"token": [token]}
    assert f'href="{url}"' in message["html"]
    marked.assert_awaited_once_with("optin@example.org")


@pytest.mark.parametrize("token,valid,status", [("isolated-valid", True, 307), ("isolated-expired", False, 400), ("", False, 400)])
def test_confirmation_route_preserves_token_semantics(monkeypatch, token, valid, status):
    confirm = AsyncMock(return_value=valid)
    monkeypatch.setattr(newsletter, "newsletter_confirm", confirm)
    app = FastAPI()
    app.include_router(newsletter.router, prefix="/api")
    with TestClient(app) as client:
        response = client.get("/api/newsletter/confirm", params={"token": token}, follow_redirects=False)
    assert response.status_code == status
    if valid:
        assert response.headers["location"] == "https://nebulacomponents.com/newsletter/confirmed"
    else:
        assert response.json()["detail"] == "Invalid or expired confirmation link"
    if token:
        confirm.assert_awaited_once_with(token)
    else:
        confirm.assert_not_awaited()
