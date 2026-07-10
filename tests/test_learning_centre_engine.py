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
    assert cfg["policy"]["problem_pages_route_to_audit"] is True
    assert cfg["primary_cta"]["href"] == "/audit"
    assert len(cfg["resources"]) >= 5
    assert len(cfg["problem_pages"]) == 10
    assert "Audit Systems" in cfg["categories"]
    assert "Google Ads Leaks" in cfg["categories"]


def test_resource_and_problem_slugs_are_clean():
    resource_slugs = [r.slug for r in engine.RESOURCES]
    problem_slugs = [p.slug for p in engine.PROBLEM_PAGES]

    assert len(resource_slugs) == len(set(resource_slugs))
    assert len(problem_slugs) == len(set(problem_slugs))
    assert len(problem_slugs) == 10
    assert all(engine.slugify(r.title) for r in engine.RESOURCES)
    assert all(p.path == f"/learning-centre/{p.slug}" for p in engine.PROBLEM_PAGES)


def test_problem_page_contains_diagnosis_checklist_example_and_audit_cta():
    problem = engine.PROBLEM_PAGES[0]
    html = engine.problem_page(problem)

    assert problem.keyword in html
    assert "Quick diagnosis" in html
    assert "Checklist" in html
    assert "Example" in html
    assert "href=\"/audit\"" in html
    assert "Related leak checks" in html


def test_run_writes_static_learning_centre_and_problem_pages(tmp_path, monkeypatch):
    gs = tmp_path / "growth_system"
    public = tmp_path / "public" / "learning-centre"
    monkeypatch.setattr(engine, "GS", gs)
    monkeypatch.setattr(engine, "PUBLIC_DIR", public)
    monkeypatch.setattr(engine, "CONFIG_PATH", gs / "learning_centre_config.json")
    monkeypatch.setattr(engine, "INDEX_JSON", public / "index.json")
    monkeypatch.setattr(engine, "INDEX_HTML", public / "index.html")

    result = engine.run()

    assert result["resources"] == len(engine.RESOURCES)
    assert result["problem_pages"] == 10
    assert (public / "index.html").exists()
    assert (public / "index.json").exists()
    assert (public / "google-ads-clicks-no-sales.html").exists()
    html = (public / "index.html").read_text()
    data = json.loads((public / "index.json").read_text())
    assert "Nebula Learning Centre" in html
    assert "Problem pages" in html
    assert "Free for life" in html
    assert data["resources"][0]["title"] == "Paid-Traffic Leak Map"
    assert data["problem_pages"][0]["slug"] == "google-ads-clicks-no-sales"
