from __future__ import annotations

import json
import urllib.error
from io import BytesIO

import pytest

from scripts import openserp_rank_tracker as tracker


class FakeResponse:
    def __init__(self, payload: dict):
        self.payload = payload

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def read(self):
        return json.dumps(self.payload).encode("utf-8")


def test_request_search_retries_transient_http_failure(monkeypatch):
    calls = []
    sleeps = []

    def fake_urlopen(request, timeout):
        calls.append((request.full_url, timeout))
        if len(calls) == 1:
            raise urllib.error.HTTPError(request.full_url, 503, "temporary", {}, BytesIO())
        return FakeResponse({"results": [{"rank": 1}]})

    monkeypatch.setattr(tracker.urllib.request, "urlopen", fake_urlopen)
    monkeypatch.setattr(tracker.time, "sleep", sleeps.append)

    result = tracker.request_search(
        "http://127.0.0.1:7000",
        "bing",
        "landing page audit",
        "US",
        "EN",
        10,
        timeout=7,
        retries=2,
    )

    assert result["results"] == [{"rank": 1}]
    assert len(calls) == 2
    assert all(timeout == 7 for _, timeout in calls)
    assert sleeps == [1]


def test_request_search_retries_timeout_then_reports_failure(monkeypatch):
    calls = []
    sleeps = []

    def fake_urlopen(request, timeout):
        calls.append(timeout)
        raise TimeoutError("timed out")

    monkeypatch.setattr(tracker.urllib.request, "urlopen", fake_urlopen)
    monkeypatch.setattr(tracker.time, "sleep", sleeps.append)

    with pytest.raises(TimeoutError, match="timed out"):
        tracker.request_search(
            "http://127.0.0.1:7000",
            "bing",
            "landing page audit",
            "US",
            "EN",
            10,
            timeout=7,
            retries=2,
        )

    assert calls == [7, 7, 7]
    assert sleeps == [1, 2]
