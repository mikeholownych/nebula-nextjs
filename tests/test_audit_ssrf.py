import socket

import pytest

from deliver_audit import validate_public_http_url


def test_audit_url_rejects_loopback_literal():
    with pytest.raises(ValueError, match="public"):
        validate_public_http_url("http://127.0.0.1:9000/api/stats")


def test_audit_url_rejects_cloud_metadata_ip():
    with pytest.raises(ValueError, match="public"):
        validate_public_http_url("http://169.254.169.254/latest/meta-data/")


def test_audit_url_rejects_localhost_hostname():
    with pytest.raises(ValueError, match="public"):
        validate_public_http_url("http://localhost:8765/")


def test_audit_url_rejects_dns_that_resolves_private(monkeypatch):
    monkeypatch.setattr(socket, "getaddrinfo", lambda *args, **kwargs: [
        (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("10.0.0.7", 443))
    ])
    with pytest.raises(ValueError, match="public"):
        validate_public_http_url("https://example.test/")


def test_audit_url_accepts_public_https(monkeypatch):
    monkeypatch.setattr(socket, "getaddrinfo", lambda *args, **kwargs: [
        (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", 443))
    ])
    assert validate_public_http_url("https://example.com/path") == "https://example.com/path"
