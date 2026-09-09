"""Tests for the impressions floor adjuster."""
from pathlib import Path
import json
import sys

sys.path.insert(0, str(Path(__file__).parents[1]))
from scripts.content_pipeline.adjust_impressions_floor import compute_floor, TIERS, FLOOR_ESTABLISHED


def test_tiers_are_monotonically_increasing():
    thresholds = [t for t, _ in TIERS]
    assert thresholds == sorted(thresholds)
    floors = [f for _, f in TIERS]
    assert floors == sorted(floors)


def test_new_site_floor():
    floor, reason = compute_floor(0)
    assert floor == 5
    assert "< 500" in reason

    floor, reason = compute_floor(60)
    assert floor == 5

    floor, reason = compute_floor(499)
    assert floor == 5


def test_early_growth_floor():
    floor, reason = compute_floor(500)
    assert floor == 20
    floor, _ = compute_floor(1999)
    assert floor == 20


def test_growing_floor():
    floor, _ = compute_floor(2000)
    assert floor == 50
    floor, _ = compute_floor(9999)
    assert floor == 50


def test_established_floor():
    floor, _ = compute_floor(10_000)
    assert floor == FLOOR_ESTABLISHED
    floor, _ = compute_floor(1_000_000)
    assert floor == FLOOR_ESTABLISHED


def test_script_produces_valid_ledger(tmp_path, monkeypatch):
    import scripts.content_pipeline.adjust_impressions_floor as adj

    monkeypatch.setattr(adj, "ROOT", tmp_path)
    monkeypatch.setattr(adj, "FLOOR_LEDGER", tmp_path / "content-ledger" / "impressions-floor.json")
    monkeypatch.setattr(adj, "GSC_PATTERNS", [])  # no real files; total_impressions = 0

    adj.main()

    ledger = json.loads((tmp_path / "content-ledger" / "impressions-floor.json").read_text())
    assert ledger["schema"] == "nebula.content-pipeline.impressions-floor.v1"
    assert ledger["floor"] == 5
    assert ledger["total_impressions"] == 0
    assert ledger["changed"] is True


def test_script_is_silent_when_floor_unchanged(tmp_path, monkeypatch, capsys):
    import scripts.content_pipeline.adjust_impressions_floor as adj

    ledger_path = tmp_path / "content-ledger" / "impressions-floor.json"
    monkeypatch.setattr(adj, "ROOT", tmp_path)
    monkeypatch.setattr(adj, "FLOOR_LEDGER", ledger_path)
    monkeypatch.setattr(adj, "GSC_PATTERNS", [])

    adj.main()  # first run: floor=5, changed=True, produces output
    capsys.readouterr()  # discard first-run output

    adj.main()  # second run: floor=5, changed=False, should be silent
    captured = capsys.readouterr()
    assert captured.out == ""  # silent on no change
