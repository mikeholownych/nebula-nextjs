import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import learning_centre_engine as engine


def test_config_preserves_efficus_patterns_without_fake_metrics():
    cfg = engine.config()

    assert cfg["source_pattern"] == "EfficusAI Learning Centre"
    assert cfg["policy"]["free_for_life_entry"] is True
    assert cfg["policy"]["no_fake_metrics"] is True
    assert cfg["primary_cta"]["href"] == "/audit"
    assert len(cfg["resources"]) >= 5
    assert "Audit Systems" in cfg["categories"]


def test_resource_slugs_and_paths_are_clean():
    slugs = [r.slug for r in engine.RESOURCES]

    assert len(slugs) == len(set(slugs))
    assert all(engine.slugify(r.title) for r in engine.RESOURCES)
    assert all(r.path.startswith("/") for r in engine.RESOURCES)


def test_run_writes_static_learning_centre(tmp_path, monkeypatch):
    gs = tmp_path / "growth_system"
    public = tmp_path / "public" / "learning-centre"
    monkeypatch.setattr(engine, "GS", gs)
    monkeypatch.setattr(engine, "PUBLIC_DIR", public)
    monkeypatch.setattr(engine, "CONFIG_PATH", gs / "learning_centre_config.json")
    monkeypatch.setattr(engine, "INDEX_JSON", public / "index.json")
    monkeypatch.setattr(engine, "INDEX_HTML", public / "index.html")

    result = engine.run()

    assert result["resources"] == len(engine.RESOURCES)
    assert (public / "index.html").exists()
    assert (public / "index.json").exists()
    html = (public / "index.html").read_text()
    data = json.loads((public / "index.json").read_text())
    assert "Nebula Learning Centre" in html
    assert "Free for life" in html
    assert data["resources"][0]["title"] == "Paid-Traffic Leak Map"
