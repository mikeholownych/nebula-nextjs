"""Tenant domain input and Cloudflare configuration contracts."""

import pytest
from fastapi import HTTPException

from platform_api.routes.domain_routes import normalize_host
from platform_api.services.cloudflare_hostnames import CloudflareHostnamesAdapter, CloudflareNotConfigured


def test_normalize_host_lowercases_and_strips_trailing_dot():
    assert normalize_host("Audits.Example.COM.") == "audits.example.com"


@pytest.mark.parametrize("value", ["https://example.com", "example.com/path", "localhost", "-bad.example.com"])
def test_normalize_host_rejects_invalid_values(value):
    with pytest.raises(HTTPException) as error:
        normalize_host(value)
    assert error.value.status_code == 400


def test_cloudflare_adapter_fails_closed_without_credentials(monkeypatch):
    monkeypatch.delenv("CLOUDFLARE_ZONE_ID", raising=False)
    monkeypatch.delenv("CLOUDFLARE_API_TOKEN", raising=False)
    with pytest.raises(CloudflareNotConfigured):
        CloudflareHostnamesAdapter()
