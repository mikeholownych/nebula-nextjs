import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import lead_magnet_engine as engine


def test_vault_has_three_hormozi_formats():
    vault = engine.build_vault()
    formats = {m["format"] for m in vault["magnets"]}

    assert formats == {
        "reveals_what_they_are_doing_wrong",
        "taste_of_actual_result",
        "unbundled_piece_of_paid_offer",
    }
    assert vault["routing"]["cold_social_pain"] == "mistake_revealer"


def test_offer_queue_contains_revenue_ctas():
    queue = engine.build_offer_queue()

    assert len(queue) == 3
    assert all("outreach_line" in row for row in queue)
    assert any("Fix Pack" in row["primary_cta"] for row in queue)


def test_run_writes_assets(tmp_path, monkeypatch):
    monkeypatch.setattr(engine, "BASE", tmp_path)
    monkeypatch.setattr(engine, "MAGNET_DIR", tmp_path / "lead_magnets")
    monkeypatch.setattr(engine, "GS", tmp_path / "growth_system")
    monkeypatch.setattr(engine, "CONFIG", tmp_path / "growth_system" / "hormozi_lead_magnet_vault.json")
    monkeypatch.setattr(engine, "QUEUE", tmp_path / "growth_system" / "lead_magnet_offer_queue.jsonl")

    result = engine.run()

    assert result["magnets"] == 3
    assert (tmp_path / "lead_magnets" / "paid_traffic_leak_checklist.md").exists()
    assert (tmp_path / "lead_magnets" / "free_leak_map_preview.md").exists()
    assert (tmp_path / "lead_magnets" / "cta_rewrite_swipe_kit.md").exists()
    vault = json.loads((tmp_path / "growth_system" / "hormozi_lead_magnet_vault.json").read_text())
    assert len(vault["magnets"]) == 3
    assert len((tmp_path / "growth_system" / "lead_magnet_offer_queue.jsonl").read_text().splitlines()) == 3
