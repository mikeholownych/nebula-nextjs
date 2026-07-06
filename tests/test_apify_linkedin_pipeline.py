import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import apify_linkedin_pipeline as pipeline


def test_build_inputs_writes_required_actor_configs(tmp_path, monkeypatch):
    monkeypatch.setattr(pipeline, "BASE", tmp_path)
    monkeypatch.setattr(pipeline, "GS", tmp_path / "growth_system")
    monkeypatch.setattr(pipeline, "INPUT_DIR", tmp_path / "growth_system" / "apify_inputs")
    monkeypatch.setattr(pipeline, "RAW_DIR", tmp_path / "growth_system" / "apify_raw")
    monkeypatch.setattr(pipeline, "CONFIG_PATH", tmp_path / "growth_system" / "apify_actor_config.json")
    (tmp_path / "growth_system").mkdir()
    (tmp_path / "growth_system" / "linkedin_engager_pipeline.jsonl").write_text(
        json.dumps({"name": "Ava", "profile_url": "https://linkedin.com/in/ava"}) + "\n" +
        json.dumps({"name": "Company", "profile_url": "https://linkedin.com/company/company/posts"}) + "\n" +
        json.dumps({"name": "StartUp Spotlight Canada", "profile_url": "https://linkedin.com/company/startup"}) + "\n"
    )

    paths = pipeline.build_inputs()

    assert set(paths) >= {"post_search", "post_engagers_likers", "profile_enrich", "company_enrich", "profile_search_fallback"}
    post_search = json.loads(paths["post_search"].read_text())
    assert "zero conversions" in post_search["keyword"]
    assert "landing page pain" in post_search["keyword"]
    assert post_search["date_filter"] == "past-week"
    engagers = json.loads(paths["post_engagers_likers"].read_text())
    assert engagers["type"] == "likers"
    assert engagers["resultsLimit"] == 100
    profile_enrich = json.loads(paths["profile_enrich"].read_text())
    assert profile_enrich["queries"] == ["https://linkedin.com/in/ava"]
    assert profile_enrich["profileScraperMode"] == "Profile details no email ($4 per 1k)"
    company_enrich = json.loads(paths["company_enrich"].read_text())
    assert company_enrich["companies"] == ["https://linkedin.com/company/company"]
    config = json.loads(pipeline.CONFIG_PATH.read_text())
    assert config["actors"]["profile_enrich"] == "harvestapi/linkedin-profile-scraper"
    assert "startup spotlight canada" in config["owned_pages_suppressed"]


def test_run_actor_uses_apify_cli_and_writes_dataset(tmp_path, monkeypatch):
    monkeypatch.setattr(pipeline, "BASE", tmp_path)
    monkeypatch.setattr(pipeline, "GS", tmp_path / "growth_system")
    monkeypatch.setattr(pipeline, "INPUT_DIR", tmp_path / "growth_system" / "apify_inputs")
    monkeypatch.setattr(pipeline, "RAW_DIR", tmp_path / "growth_system" / "apify_raw")
    input_file = tmp_path / "input.json"
    input_file.write_text("{}")

    def fake_run(cmd, cwd, text, capture_output, timeout):
        assert cmd[:3] == ["apify", "actors", "call"]
        assert "--json" in cmd
        return subprocess.CompletedProcess(cmd, 0, stdout=json.dumps({"defaultDatasetId": "ds1"}), stderr="")

    monkeypatch.setattr(pipeline.subprocess, "run", fake_run)
    monkeypatch.setattr(pipeline, "fetch_dataset", lambda dataset_id: [{"name": "Ava", "dataset_id": dataset_id}])
    out = pipeline.run_actor("example/actor", input_file, "out.json")
    assert json.loads(out.read_text()) == [{"name": "Ava", "dataset_id": "ds1"}]


def test_canonical_company_url_strips_posts_and_query():
    assert pipeline.canonical_linkedin_company_url("https://linkedin.com/company/acme/posts?x=1") == "https://linkedin.com/company/acme"
