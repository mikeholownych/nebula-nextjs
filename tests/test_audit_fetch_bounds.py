from types import SimpleNamespace

import deliver_audit


class FakeResponse:
    def __init__(self, payload: bytes, *, content_length: int | None = None):
        self.payload = payload
        self.status_code = 200
        self.is_redirect = False
        self.is_permanent_redirect = False
        self.headers = {}
        if content_length is not None:
            self.headers["Content-Length"] = str(content_length)
        self.encoding = "utf-8"
        self.closed = False

    def raise_for_status(self):
        return None

    def iter_content(self, chunk_size: int):
        for offset in range(0, len(self.payload), chunk_size):
            yield self.payload[offset:offset + chunk_size]

    def close(self):
        self.closed = True


class FakeSession:
    def __init__(self, response: FakeResponse):
        self.response = response
        self.headers = {}

    def get(self, *args, **kwargs):
        assert kwargs["stream"] is True
        return self.response


def test_fetch_page_rejects_declared_oversize(monkeypatch):
    monkeypatch.setattr(deliver_audit, "validate_public_http_url", lambda url: url)
    response = FakeResponse(b"small", content_length=deliver_audit.MAX_AUDIT_HTML_BYTES + 1)
    assert deliver_audit.fetch_page("https://example.com", FakeSession(response)) is None
    assert response.closed is True


def test_fetch_page_rejects_streamed_oversize(monkeypatch):
    monkeypatch.setattr(deliver_audit, "validate_public_http_url", lambda url: url)
    response = FakeResponse(b"x" * (deliver_audit.MAX_AUDIT_HTML_BYTES + 1))
    assert deliver_audit.fetch_page("https://example.com", FakeSession(response)) is None
    assert response.closed is True


def test_scrape_page_bounds_attacker_controlled_fields(monkeypatch):
    huge = "x" * 20_000
    html = f"<title>{huge}</title><h1>{huge}</h1>" + "".join(
        f"<a href='/x'>{huge}</a>" for _ in range(150)
    )
    monkeypatch.setattr(deliver_audit, "get_session", lambda: SimpleNamespace())
    monkeypatch.setattr(deliver_audit, "fetch_page", lambda url, session: html)

    page = deliver_audit.scrape_page("https://example.com")
    assert len(page["title"]) == 500
    assert len(page["h1"]) == 500
    assert len(page["text"]) <= deliver_audit.MAX_EXTRACTED_TEXT
    assert len(page["ctas"]) == deliver_audit.MAX_CTA_COUNT
    assert all(len(value) <= deliver_audit.MAX_CTA_TEXT for value in page["ctas"])
