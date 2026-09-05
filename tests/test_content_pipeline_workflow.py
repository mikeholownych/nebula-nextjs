import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parents[1]
SCRIPTS = ROOT / "scripts" / "content_pipeline"


def source():
    return {"id": "source-1", "url": "https://example.com/source", "kind": "primary", "provenance": "first_party", "verified": True}


def brief(slug="workflow-article"):
    return {"id": "opp-1", "slug": slug, "lane": "acquisition", "post_type": "diagnostic-guide", "question_h1": "Why is this article useful?", "answer_target": "A direct answer backed by the source.", "sections": ["What should I check first?"], "sources": {"records": [source()], "first_party_sources": [source()["url"]], "primary_external_sources": [], "competitor_sources": []}, "internal_links": ["/audit", "/learning-centre"], "cta": {"href": "/audit", "text": "Run the Nebula landing page audit"}, "timing_gate": {"status": "ELIGIBLE"}}


def run(script, *args):
    return subprocess.run([sys.executable, str(SCRIPTS / script), *map(str, args)], cwd=ROOT, text=True, capture_output=True)


def test_create_draft_records_provenance_and_versions(tmp_path):
    b = tmp_path / "brief.json"; b.write_text(json.dumps(brief()))
    out = tmp_path / "drafts"
    p = run("create_draft.py", "--brief", b, "--output-root", out)
    assert p.returncode == 0, p.stderr
    draft = Path(p.stdout.strip())
    assert draft.exists() and draft.name == "v001.md"
    text = draft.read_text()
    assert "source-1" in text and "provenance" in text and "status: drafted" in text
    assert json.loads(draft.with_suffix(".json").read_text())["revision"] == 1


def test_review_returns_named_findings_without_editing(tmp_path):
    draft = tmp_path / "bad.md"
    draft.write_text("---\nslug: bad\nstatus: drafted\ncontent_lane: acquisition\npost_type: diagnostic-guide\nauthor_id: mike\ncategory: Test\npurpose: test\ncommercial_role: audit-entry\nevidence_level: first_party\nsource_refs: []\npublished_at: null\nupdated_at: null\nreviewed_by: null\n---\n# Bad heading\n\nNo answer.")
    before = draft.read_bytes()
    p = run("review_draft.py", "--draft", draft)
    assert p.returncode != 0 and "H1_QUESTION" in p.stdout and "ANSWER_BLOCK" in p.stdout
    assert draft.read_bytes() == before


def valid_markdown():
    return """---
slug: workflow-article
status: drafted
content_lane: acquisition
post_type: diagnostic-guide
author_id: mike-holownych
category: Diagnostics
purpose: organic-discovery
commercial_role: audit-entry
evidence_level: first_party
source_refs:
  - source-1
published_at: null
updated_at: null
reviewed_by: null
canonical_url: https://nebulacomponents.com/blog/workflow-article
---
# Why is this article useful?

This answer explains the topic directly using the available evidence and gives a bounded next step without promising an outcome. It is deliberately concise and avoids unsupported claims or invented customer evidence.

## What should I check first?

Check the page evidence, compare the promise with the rendered page, and document the date, method, sample, and limitation before drawing a conclusion.

## What does the source show?

The source is a primary record for this article and the finding is limited to the stated evidence boundary.

## FAQ: What should I do next?

Run the audit and review the result. This is a recommendation, not a guarantee.

[Run the Nebula landing page audit](/audit)
"""


def test_apply_edits_preserves_immutable_revision_and_records_edit(tmp_path):
    draft = tmp_path / "v001.md"; draft.write_text(valid_markdown())
    edits = tmp_path / "edits.json"; edits.write_text(json.dumps({"replacements": [{"old": "What should I check first?", "new": "What should I check first today?"}], "editor": "mike"}))
    p = run("apply_edits.py", "--draft", draft, "--edits", edits)
    assert p.returncode == 0, p.stderr
    new = Path(p.stdout.strip())
    assert new != draft and new.name == "v002.md" and draft.read_text() != new.read_text()
    record = json.loads(new.with_suffix(".json").read_text())
    assert record["parent_hash"] == hashlib.sha256(draft.read_bytes()).hexdigest()
    assert record["edits"][0]["editor"] == "mike"


def test_publish_requires_exact_approval_and_dry_run_does_not_mutate(tmp_path):
    draft = tmp_path / "v001.md"; draft.write_text(valid_markdown())
    draft.with_suffix(".json").write_text(json.dumps({"provenance": {"records": [source()]}}))
    readiness = tmp_path / "readiness.json"; readiness.write_text(json.dumps({"status": "PASS", "draft_hash": hashlib.sha256(draft.read_bytes()).hexdigest()}))
    approval = tmp_path / "approval.json"; approval.write_text(json.dumps({"draft_hash": hashlib.sha256(draft.read_bytes()).hexdigest(), "reviewer": "mike", "timestamp": "2026-09-05T12:00:00Z", "readiness_report": str(readiness), "approved": True}))
    target = tmp_path / "published"; before = sorted(tmp_path.rglob("*"))
    p = run("publish_article.py", "--draft", draft, "--approval", approval, "--readiness", readiness, "--dry-run", "--output-root", target)
    assert p.returncode == 0 and "DRY_RUN" in p.stdout and not target.exists()
    assert sorted(tmp_path.rglob("*")) == before


def test_publish_blocks_missing_or_mismatched_approval(tmp_path):
    draft = tmp_path / "v001.md"; draft.write_text(valid_markdown())
    p = run("publish_article.py", "--draft", draft, "--approval", tmp_path / "missing.json", "--dry-run")
    assert p.returncode != 0 and "MISSING_APPROVAL" in p.stdout
    approval = tmp_path / "approval.json"; approval.write_text(json.dumps({"approved": True, "reviewer": "mike", "timestamp": "2026-09-05T12:00:00Z", "draft_hash": "wrong"}))
    p = run("publish_article.py", "--draft", draft, "--approval", approval, "--dry-run")
    assert p.returncode != 0 and "APPROVAL_HASH_MISMATCH" in p.stdout


def test_version_allocation_skips_gaps_without_overwrite(tmp_path):
    out = tmp_path / "drafts" / "safe"
    out.mkdir(parents=True)
    (out / "v001.md").write_text("old")
    (out / "v003.md").write_text("reserved")
    brief_path = tmp_path / "brief.json"; brief_path.write_text(json.dumps(brief(slug="safe")))
    p = run("create_draft.py", "--brief", brief_path, "--output-root", tmp_path / "drafts")
    assert p.returncode == 0 and Path(p.stdout.strip()).name == "v004.md"
    assert (out / "v003.md").read_text() == "reserved"


def test_slug_traversal_is_rejected(tmp_path):
    brief_path = tmp_path / "brief.json"; brief_path.write_text(json.dumps(brief(slug="../escape")))
    p = run("create_draft.py", "--brief", brief_path, "--output-root", tmp_path / "drafts")
    assert p.returncode != 0 and "INVALID_SLUG" in p.stdout
    assert not (tmp_path / "escape").exists()


def test_review_blocks_invalid_provenance_through_claim_validator(tmp_path):
    draft = tmp_path / "v001.md"; draft.write_text(valid_markdown())
    sidecar = draft.with_suffix(".json")
    sidecar.write_text(json.dumps({"provenance": {"records": [{"id": "source-1", "kind": "primary", "provenance": "forged", "verified": True}]}, "article": {"source_refs": ["source-1"], "claims": []}}))
    p = run("review_draft.py", "--draft", draft)
    assert p.returncode != 0 and "INVALID_SOURCE_PROVENANCE" in p.stdout


def test_publish_rejects_malformed_draft_and_unbound_readiness(tmp_path):
    draft = tmp_path / "v001.md"; draft.write_text("not markdown")
    digest = hashlib.sha256(draft.read_bytes()).hexdigest()
    readiness = tmp_path / "readiness.json"; readiness.write_text(json.dumps({"status": "PASS"}))
    approval = tmp_path / "approval.json"; approval.write_text(json.dumps({"approved": True, "draft_hash": digest, "reviewer": "mike", "timestamp": "2026-09-05T12:00:00Z"}))
    p = run("publish_article.py", "--draft", draft, "--approval", approval, "--readiness", readiness, "--dry-run")
    assert p.returncode != 0 and "MALFORMED_DRAFT" in p.stdout
    readiness.write_text(json.dumps({"status": "PASS", "draft_hash": "stale"}))
    p = run("publish_article.py", "--draft", draft, "--approval", approval, "--readiness", readiness, "--dry-run")
    assert p.returncode != 0 and "READINESS_HASH_MISMATCH" in p.stdout


def test_publish_writes_receipt_only_to_explicit_local_root(tmp_path):
    draft = tmp_path / "v001.md"; draft.write_text(valid_markdown())
    draft.with_suffix(".json").write_text(json.dumps({"provenance": {"records": [source()]}}))
    digest = hashlib.sha256(draft.read_bytes()).hexdigest()
    readiness = tmp_path / "readiness.json"; readiness.write_text(json.dumps({"status": "PASS", "draft_hash": digest, "full_readiness": True}))
    approval = tmp_path / "approval.json"; approval.write_text(json.dumps({"approved": True, "draft_hash": digest, "reviewer": "mike", "timestamp": "2026-09-05T12:00:00Z", "readiness_report": str(readiness)}))
    target = tmp_path / "published"
    p = run("publish_article.py", "--draft", draft, "--approval", approval, "--readiness", readiness, "--output-root", target)
    assert p.returncode == 0 and json.loads((target / "v001.publication.json").read_text())["status"] == "PUBLISHED"
    assert (target / "v001.md").read_text() == draft.read_text()


def test_complete_create_review_edit_approval_publish_lifecycle(tmp_path):
    brief_path = tmp_path / "brief.json"; brief_path.write_text(json.dumps(brief(slug="lifecycle")))
    draft_root = tmp_path / "drafts"
    created = run("create_draft.py", "--brief", brief_path, "--output-root", draft_root)
    assert created.returncode == 0
    first = Path(created.stdout.strip())
    reviewed = run("review_draft.py", "--draft", first)
    assert reviewed.returncode == 0 and json.loads(reviewed.stdout)["status"] == "PASS"
    edits_path = tmp_path / "edits.json"; edits_path.write_text(json.dumps({"editor": "mike", "replacements": [{"old": "What should I check first?", "new": "What should I check first today?"}]}))
    edited = run("apply_edits.py", "--draft", first, "--edits", edits_path)
    assert edited.returncode == 0
    second = Path(edited.stdout.strip())
    review_path = tmp_path / "readiness.json"
    review_path.write_text(json.dumps({"status": "PASS", "draft_hash": hashlib.sha256(second.read_bytes()).hexdigest(), "full_readiness": True}))
    approval_path = tmp_path / "approval.json"
    approval_path.write_text(json.dumps({"approved": True, "draft_hash": hashlib.sha256(second.read_bytes()).hexdigest(), "reviewer": "mike", "timestamp": "2026-09-05T12:00:00Z", "readiness_report": str(review_path)}))
    published = run("publish_article.py", "--draft", second, "--approval", approval_path, "--readiness", review_path, "--output-root", tmp_path / "published")
    assert published.returncode == 0 and "PUBLISHED" in published.stdout
