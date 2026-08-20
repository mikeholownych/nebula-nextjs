import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path("/home/mike/nebula")
SCRIPT = ROOT / "scripts" / "try_log.py"


def run(tmp: Path, *args: str) -> subprocess.CompletedProcess:
    env = os.environ.copy()
    env["TRY_LOG_PATH"] = str(tmp / "try_log.jsonl")
    return subprocess.run(
        [sys.executable, str(SCRIPT), *args],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
        env=env,
    )


def test_start_and_close_roundtrip(tmp_path):
    start = run(
        tmp_path,
        "start",
        "--id", "t1",
        "--type", "channel",
        "--hypothesis", "posts get clicks",
        "--change", "owned feed",
    )
    assert start.returncode == 0, start.stderr
    row = json.loads(start.stdout)
    assert row["status"] == "running"
    close = run(
        tmp_path,
        "close",
        "--id", "t1",
        "--status", "no_purchases",
        "--keep", "kill",
        "--well", "cheap",
        "--wrong", "0 clicks",
        "--receipt", '{"ctr": 0}',
    )
    assert close.returncode == 0, close.stderr
    closed = json.loads(close.stdout)
    assert closed["status"] == "no_purchases"
    assert closed["keep"] == "kill"
    assert closed["receipts"]["ctr"] == 0
    listed = run(tmp_path, "list")
    assert "t1" in listed.stdout


def test_seeded_log_lists():
    env = os.environ.copy()
    env.pop("TRY_LOG_PATH", None)
    out = subprocess.run(
        [sys.executable, str(SCRIPT), "list"],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
        env=env,
    )
    assert out.returncode == 0
    assert "owned-feed-posts-20260819" in out.stdout
    assert "instantly-aug16-list" in out.stdout
