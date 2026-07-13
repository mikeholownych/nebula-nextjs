import json
from pathlib import Path

import pytest

from source_outcomes import SourceOutcome, classify_http_status, latest_source_health, record_outcome
import signal_scrapers


def test_classify_http_status_distinguishes_no_results_from_failures():
    assert classify_http_status(200, 0) == "no-results"
    assert classify_http_status(200, 3) == "ok"
    assert classify_http_status(401, 0) == "auth-failed"
    assert classify_http_status(403, 0) == "auth-failed"
    assert classify_http_status(429, 0) == "rate-limited"
    assert classify_http_status(503, 0) == "unreachable"


def test_record_outcome_persists_structured_source_evidence(tmp_path: Path):
    path = tmp_path / "source-outcomes.jsonl"
    outcome = SourceOutcome(source="apify:reddit", state="rate-limited", detail="HTTP 429")

    record_outcome(path, outcome)

    row = json.loads(path.read_text().strip())
    assert row["source"] == "apify:reddit"
    assert row["state"] == "rate-limited"
    assert row["items_returned"] == 0
    assert row["attempted"] is True
    assert row["fix_hint"] == "check-source-health"
    assert row["at"].endswith("Z")


def test_latest_source_health_does_not_treat_failure_as_quiet_market(tmp_path: Path):
    path = tmp_path / "source-outcomes.jsonl"
    record_outcome(path, SourceOutcome(source="reddit", state="no-results"))
    record_outcome(path, SourceOutcome(source="reddit", state="rate-limited", detail="HTTP 429"))
    record_outcome(path, SourceOutcome(source="hackernews", state="ok", items_returned=4))

    health = latest_source_health(path)

    assert health["reddit"]["state"] == "rate-limited"
    assert health["reddit"]["market_quiet"] is False
    assert health["hackernews"]["state"] == "ok"
    assert health["hackernews"]["items_returned"] == 4


def test_apify_actor_records_rate_limit_instead_of_laundering_as_empty(tmp_path: Path, monkeypatch):
    class Response:
        status_code = 429
        text = "monthly usage limit reached"

        @staticmethod
        def json():
            return []

    outcomes = tmp_path / "source-outcomes.jsonl"
    monkeypatch.setattr(signal_scrapers, "SOURCE_OUTCOMES_FILE", outcomes, raising=False)
    monkeypatch.setattr(signal_scrapers.requests, "post", lambda *args, **kwargs: Response())

    assert signal_scrapers._run_actor("vendor/reddit", {"query": "ads no sales"}) == []

    row = json.loads(outcomes.read_text().strip())
    assert row["source"] == "apify:vendor/reddit"
    assert row["state"] == "rate-limited"
    assert row["market_quiet"] is False
