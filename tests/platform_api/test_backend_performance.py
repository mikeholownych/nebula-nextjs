import inspect

from platform_api.services.audit_db import AuditDB
from platform_api.services import screenshot_service


def test_get_benchmarks_query_is_bounded():
    source = inspect.getsource(AuditDB.get_benchmarks)
    assert "LIMIT" in source
    assert "INTERVAL" in source or "90 days" in source


def test_screenshot_capture_is_serialized():
    source = inspect.getsource(screenshot_service)
    assert "Semaphore" in source
    assert "SCREENSHOT_CONCURRENCY" in source
    assert screenshot_service.SCREENSHOT_CONCURRENCY == 1


def test_deliver_audit_does_not_call_pagespeed_on_score_path():
    from pathlib import Path
    from platform_api.services import signal_verifier

    repo = Path(__file__).resolve().parents[2]
    source = (repo / "deliver_audit.py").read_text()
    start = source.index("def score_audit(")
    end = source.index("\ndef ", start + 1)
    score_src = source[start:end]
    assert "runPagespeed" not in score_src
    assert "pagespeedonline" not in score_src
    speed_src = inspect.getsource(signal_verifier.verify_load_speed)
    assert "client.head" not in speed_src
    assert "runPagespeed" not in speed_src
