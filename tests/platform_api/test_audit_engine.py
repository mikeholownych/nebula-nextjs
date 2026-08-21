import ast
import inspect
import os
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from platform_api.services import audit_engine


def test_inprocess_import_surface_uses_deliver_audit():
    source = inspect.getsource(audit_engine.score_inprocess)
    assert "deliver_audit" in source
    assert "subprocess.run" not in source


def test_cli_engine_keeps_subprocess_off_async_def():
    source = inspect.getsource(audit_engine)
    tree = ast.parse(source)
    for node in ast.walk(tree):
        if isinstance(node, ast.AsyncFunctionDef):
            body = ast.get_source_segment(source, node) or ""
            assert "subprocess.run" not in body


def test_score_job_cli_flag_uses_cli(monkeypatch):
    monkeypatch.setenv("AUDIT_ENGINE", "cli")
    called = {}

    def fake_cli(job):
        called["cli"] = job
        return {"score": 1, "grade": "F", "findings": []}

    monkeypatch.setattr(audit_engine, "score_via_cli", fake_cli)
    monkeypatch.setattr(
        audit_engine,
        "score_inprocess",
        lambda job: (_ for _ in ()).throw(AssertionError("inprocess should not run")),
    )

    result = audit_engine.score_job({"url": "https://example.com", "email": "a@b.com"})
    assert result["score"] == 1
    assert "cli" in called


def test_score_job_inprocess_falls_back_on_import_error(monkeypatch):
    monkeypatch.setenv("AUDIT_ENGINE", "inprocess")
    monkeypatch.setattr(
        audit_engine,
        "score_inprocess",
        lambda job: (_ for _ in ()).throw(ImportError("too heavy")),
    )
    monkeypatch.setattr(
        audit_engine,
        "score_via_cli",
        lambda job: {"score": 2, "grade": "D", "findings": [], "engine": "cli"},
    )

    result = audit_engine.score_job({"url": "https://example.com", "email": "a@b.com"})
    assert result["engine"] == "cli"


def test_score_via_cli_passes_url_as_literal_argv(monkeypatch):
    captured = {}

    def fake_run(argv, **kwargs):
        captured["argv"] = argv
        captured["kwargs"] = kwargs
        return SimpleNamespace(returncode=0, stdout='{"score": 5, "grade": "C", "findings": []}\n', stderr="")

    monkeypatch.setattr(audit_engine.subprocess, "run", fake_run)
    hostile = 'https://example.com/"; touch /tmp/nebula-pwned; #'
    result = audit_engine.score_via_cli({"url": hostile, "email": "a@b.com"})
    assert captured["argv"][2] == hostile
    assert captured["kwargs"].get("shell") is not True
    assert result["score"] == 5
