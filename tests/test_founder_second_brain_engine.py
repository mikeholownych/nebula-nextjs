import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import founder_second_brain_engine as engine


def test_config_preserves_creator_flow_and_guardrails():
    cfg = engine.config()

    assert cfg["flow"] == ["ingest", "extract", "generate", "review", "publish"]
    assert cfg["policy"]["draft_first"] is True
    assert cfg["policy"]["never_auto_publish"] is True
    assert cfg["policy"]["never_auto_send"] is True
    assert cfg["outputs"]["linkedin_posts_per_asset"] == 12


def test_chunk_and_extract_second_brain_patterns():
    text = """
    This is an architecture problem, not a headcount problem.
    The founder becomes the bottleneck when marketing cannot access the founder's real expertise.
    Drafts are generated, then review happens before publish.
    """
    chunks = engine.chunk_text("doc", text)
    frameworks = engine.extract_frameworks(chunks)
    names = {fw.name for fw in frameworks}

    assert "Architecture over headcount" in names
    assert "Founder access layer" in names
    assert "Draft -> review -> publish" in names


def test_run_writes_campaign_assets(tmp_path, monkeypatch):
    gs = tmp_path / "growth_system"
    brain = gs / "founder_second_brain"
    inbox = brain / "inbox"
    inbox.mkdir(parents=True)
    (inbox / "webinar.txt").write_text(
        "Clicks and zero conversions. Founder proof from an audit. Generic content fails. "
        "Review before publish."
    )

    monkeypatch.setattr(engine, "GS", gs)
    monkeypatch.setattr(engine, "BRAIN_DIR", brain)
    monkeypatch.setattr(engine, "INBOX", inbox)
    monkeypatch.setattr(engine, "CONFIG", gs / "founder_second_brain_config.json")
    monkeypatch.setattr(engine, "KNOWLEDGE_BASE", brain / "knowledge_base.jsonl")
    monkeypatch.setattr(engine, "FRAMEWORKS", brain / "frameworks.jsonl")
    monkeypatch.setattr(engine, "STORIES", brain / "stories.jsonl")
    monkeypatch.setattr(engine, "OBJECTIONS", brain / "objections.jsonl")
    monkeypatch.setattr(engine, "POST_DRAFTS", brain / "linkedin_post_drafts.jsonl")
    monkeypatch.setattr(engine, "EMAIL_DRAFTS", brain / "email_sequence_drafts.jsonl")
    monkeypatch.setattr(engine, "LEAD_MAGNET_DRAFTS", brain / "lead_magnet_drafts.jsonl")
    monkeypatch.setattr(engine, "VIDEO_SCRIPT_DRAFTS", brain / "video_script_drafts.jsonl")
    monkeypatch.setattr(engine, "CAMPAIGN_MANIFEST", brain / "campaign_manifest.json")

    result = engine.run()

    assert result["linkedin_posts"] == 12
    assert result["emails"] == 5
    assert result["lead_magnets"] == 1
    assert result["video_scripts"] == 1
    assert (brain / "linkedin_post_drafts.jsonl").exists()
    posts = (brain / "linkedin_post_drafts.jsonl").read_text().splitlines()
    assert len(posts) == 12
    assert json.loads(posts[0])["status"] == "draft_needs_approval"
