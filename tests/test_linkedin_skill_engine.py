import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import linkedin_skill_engine as engine


def test_skill_registry_matches_image_counts():
    cfg = engine.build_config()

    assert cfg["policy"]["draft_first"] is True
    assert cfg["policy"]["daily_outreach_cap"] == 20
    assert len(cfg["skills"]) == 29
    assert cfg["sections"] == {"content": 10, "warming": 8, "outreach": 9, "conductors": 2}


def test_hook_lab_scores_and_humanizes():
    hooks = engine.hook_lab("landing page")

    assert len(hooks) == 10
    assert hooks[0]["score"] >= hooks[-1]["score"]
    assert all("—" not in h["hook"] for h in hooks)


def test_warm_list_and_outreach_are_draft_first(tmp_path, monkeypatch):
    gs = tmp_path / "growth_system"
    gs.mkdir()
    engager = gs / "linkedin_engager_pipeline.jsonl"
    social = gs / "evergreen_outreach_queue.jsonl"
    engager.write_text(json.dumps({
        "name": "Jane Founder",
        "role": "Founder at DTC brand",
        "profile_url": "https://linkedin.com/in/jane",
        "comment": "We have Google Ads clicks but no sales from the landing page",
        "post_url": "https://linkedin.com/posts/1",
    }) + "\n")
    social.write_text("")
    monkeypatch.setattr(engine, "GS", gs)
    monkeypatch.setattr(engine, "ENGAGER_FILE", engager)
    monkeypatch.setattr(engine, "SOCIAL_OUTREACH", social)

    warm = engine.build_warm_list()
    drafts = engine.build_outreach_drafts(warm)

    assert warm[0]["icp_score"] >= 7
    assert warm[0]["next_action"] == "connection_note"
    assert len(drafts[0]["connection_note"]) < 200
    assert len(drafts[0]["first_dm"]) < 150
    assert drafts[0]["status"] == "draft_needs_approval"


def test_negative_service_provider_roles_are_excluded(tmp_path, monkeypatch):
    gs = tmp_path / "growth_system"
    gs.mkdir()
    engager = gs / "linkedin_engager_pipeline.jsonl"
    social = gs / "evergreen_outreach_queue.jsonl"
    engager.write_text(json.dumps({
        "name": "Agency Seller",
        "role": "I fix Meta Ads campaigns for local businesses",
        "profile_url": "https://linkedin.com/in/agency",
        "comment": "Meta ads clicks and zero conversions from landing pages",
    }) + "\n")
    social.write_text("")
    monkeypatch.setattr(engine, "GS", gs)
    monkeypatch.setattr(engine, "ENGAGER_FILE", engager)
    monkeypatch.setattr(engine, "SOCIAL_OUTREACH", social)

    assert engine.build_warm_list() == []


def test_company_profiles_are_excluded(tmp_path, monkeypatch):
    gs = tmp_path / "growth_system"
    gs.mkdir()
    engager = gs / "linkedin_engager_pipeline.jsonl"
    social = gs / "evergreen_outreach_queue.jsonl"
    engager.write_text(json.dumps({
        "name": "Agency Company",
        "role": "1,503 followers",
        "profile_url": "https://linkedin.com/company/agency/posts",
        "comment": "Google Ads clicks and zero conversions from the landing page",
    }) + "\n")
    social.write_text("")
    monkeypatch.setattr(engine, "GS", gs)
    monkeypatch.setattr(engine, "ENGAGER_FILE", engager)
    monkeypatch.setattr(engine, "SOCIAL_OUTREACH", social)

    assert engine.build_warm_list() == []


def test_run_writes_all_engine_files(tmp_path, monkeypatch):
    gs = tmp_path / "growth_system"
    linkedin_dir = gs / "linkedin_engine"
    gs.mkdir(parents=True)
    engager = gs / "linkedin_engager_pipeline.jsonl"
    social = gs / "evergreen_outreach_queue.jsonl"
    engager.write_text(json.dumps({
        "name": "Sam CEO",
        "role": "CEO SaaS",
        "profile_url": "https://linkedin.com/in/sam",
        "comment": "Meta ads clicks and zero conversions",
    }) + "\n")
    social.write_text("")
    monkeypatch.setattr(engine, "GS", gs)
    monkeypatch.setattr(engine, "LINKEDIN_DIR", linkedin_dir)
    monkeypatch.setattr(engine, "ENGAGER_FILE", engager)
    monkeypatch.setattr(engine, "SOCIAL_OUTREACH", social)
    monkeypatch.setattr(engine, "CONFIG_PATH", gs / "linkedin_skill_engine.json")
    monkeypatch.setattr(engine, "CONTENT_DRAFTS", linkedin_dir / "content_drafts.jsonl")
    monkeypatch.setattr(engine, "WARM_LIST", linkedin_dir / "warm_list.jsonl")
    monkeypatch.setattr(engine, "OUTREACH_DRAFTS", linkedin_dir / "outreach_drafts.jsonl")
    monkeypatch.setattr(engine, "WARM_TRACKER", linkedin_dir / "warm_tracker.jsonl")
    monkeypatch.setattr(engine, "POST_AUTOPSY", linkedin_dir / "post_autopsy.jsonl")

    result = engine.run()

    assert result["skills"] == 29
    assert (gs / "linkedin_skill_engine.json").exists()
    assert (linkedin_dir / "content_drafts.jsonl").exists()
    assert (linkedin_dir / "warm_list.jsonl").exists()
    assert (linkedin_dir / "outreach_drafts.jsonl").exists()
