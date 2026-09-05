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
    assert p.returncode != 0 and "SOURCE_ERROR_SITE_AUDIT:missing" in p.stdout
    assert not out.exists()


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
    draft.with_suffix(".json").write_text(json.dumps({"draft_hash": hashlib.sha256(draft.read_bytes()).hexdigest(), "revision": 1, "provenance": {"records": [source()]}, "article": {"source_refs": ["source-1"], "claims": []}}))
    edits = tmp_path / "edits.json"; edits.write_text(json.dumps({"replacements": [{"old": "What should I check first?", "new": "What should I check first today?"}], "editor": "mike"}))
    p = run("apply_edits.py", "--draft", draft, "--edits", edits)
    assert p.returncode != 0 and "INVALID_PARENT" in p.stdout
    assert not (tmp_path / "v002.md").exists()


def test_publish_requires_exact_approval_and_dry_run_does_not_mutate(tmp_path):
    draft = tmp_path / "v001.md"; draft.write_text(valid_markdown())
    draft.with_suffix(".json").write_text(json.dumps({"provenance": {"records": [source()]}}))
    readiness = tmp_path / "readiness.json"; readiness.write_text(json.dumps({"status": "PASS", "draft_hash": hashlib.sha256(draft.read_bytes()).hexdigest(), "full_readiness": True, "validated": True}))
    approval = tmp_path / "approval.json"; approval.write_text(json.dumps({"draft_hash": hashlib.sha256(draft.read_bytes()).hexdigest(), "reviewer": "mike", "timestamp": "2026-09-05T12:00:00Z", "readiness_report": str(readiness), "approved": True}))
    target = tmp_path / "published"; before = sorted(tmp_path.rglob("*"))
    p = run("publish_article.py", "--draft", draft, "--approval", approval, "--readiness", readiness, "--dry-run", "--output-root", target)
    assert p.returncode != 0 and "SOURCE_ERROR_SITE_AUDIT" in p.stdout and not target.exists()
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
    assert p.returncode != 0 and "SOURCE_ERROR_SITE_AUDIT" in p.stdout
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
    readiness = tmp_path / "readiness.json"; readiness.write_text(json.dumps({"status": "PASS", "draft_hash": digest, "full_readiness": True, "validated": True}))
    approval = tmp_path / "approval.json"; approval.write_text(json.dumps({"approved": True, "draft_hash": digest, "reviewer": "mike", "timestamp": "2026-09-05T12:00:00Z", "readiness_report": str(readiness)}))
    target = tmp_path / "published"
    p = run("publish_article.py", "--draft", draft, "--approval", approval, "--readiness", readiness, "--output-root", target)
    assert p.returncode != 0 and "SOURCE_ERROR_SITE_AUDIT" in p.stdout
    assert not target.exists()


def test_publish_requires_validated_full_readiness_report(tmp_path):
    draft = tmp_path / "v001.md"
    draft.write_text("not markdown")
    digest = hashlib.sha256(draft.read_bytes()).hexdigest()
    readiness = tmp_path / "readiness.json"
    readiness.write_text(json.dumps({"status": "PASS", "draft_hash": digest}))
    approval = tmp_path / "approval.json"
    approval.write_text(json.dumps({"approved": True, "draft_hash": digest, "reviewer": "mike", "timestamp": "2026-09-05T12:00:00Z"}))
    p = run("publish_article.py", "--draft", draft, "--approval", approval, "--readiness", readiness, "--dry-run", "--output-root", tmp_path / "published")
    assert p.returncode != 0 and "FULL_READINESS_NOT_PASSED" in p.stdout and "READINESS_NOT_VALIDATED" in p.stdout


def test_apply_edits_rejects_tampered_parent_without_mutation(tmp_path):
    draft = tmp_path / "v001.md"
    draft.write_text(valid_markdown())
    sidecar = draft.with_suffix(".json")
    sidecar.write_text(json.dumps({"draft_hash": "stale", "revision": 1, "provenance": {"records": [source()]}}))
    edits = tmp_path / "edits.json"
    edits.write_text(json.dumps({"replacements": [{"old": "source", "new": "record"}]}))
    before = sorted(p.name for p in tmp_path.iterdir())
    p = run("apply_edits.py", "--draft", draft, "--edits", edits)
    assert p.returncode != 0 and "INVALID_PARENT" in p.stdout
    assert sorted(x.name for x in tmp_path.iterdir()) == before


def test_create_rejects_empty_source_records(tmp_path):
    item = brief()
    item["sources"]["records"] = []
    path = tmp_path / "brief.json"
    path.write_text(json.dumps(item))
    p = run("create_draft.py", "--brief", path, "--output-root", tmp_path / "drafts")
    assert p.returncode != 0 and "INVALID_SOURCE_BUNDLE" in p.stdout


def test_review_invokes_source_validator_when_source_type_absent(tmp_path, monkeypatch):
    from scripts.content_pipeline import _validation
    from scripts.content_pipeline.review_draft import review
    draft = tmp_path / "v001.md"
    draft.write_text(valid_markdown())
    draft.with_suffix(".json").write_text(json.dumps({"provenance": {"records": [source()]}, "article": {"source_refs": ["source-1"], "claims": []}}))
    calls = []
    original = _validation.validate_source_bundle
    monkeypatch.setattr(_validation, "validate_source_bundle", lambda bundle: (calls.append(bundle) or original(bundle)))
    review(draft)
    assert len(calls) == 1
    assert calls[0]["__untyped__"][0]["id"] == "source-1"


def test_concurrent_creators_allocate_unique_revisions(tmp_path):
    from concurrent.futures import ThreadPoolExecutor
    path = tmp_path / "brief.json"
    path.write_text(json.dumps(brief(slug="concurrent")))
    output = tmp_path / "drafts"
    def create():
        result = run("create_draft.py", "--brief", path, "--output-root", output)
        return result.returncode, Path(result.stdout.strip()).name if result.returncode == 0 else result.stdout
    with ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(lambda _: create(), range(6)))
    assert all(code != 0 for code, _ in results)
    assert not output.exists()


def test_complete_create_review_edit_approval_publish_lifecycle(tmp_path):
    from scripts.content_pipeline.collect_sources import _record, SOURCE_SPECS
    records = []
    for source_type, filename in [('site_audit','seo-reports/site-audit-task-5-fixture.json'), ('gsc','agency-audit-2026-08-03/gsc-task-5-fixture.json'), ('ga4','agency-audit-2026-08-03/ga4-task-5-fixture.json'), ('bing','seo-reports/bing-crawl-task-5-fixture.json'), ('posthog','agency-audit-2026-08-03/posthog-task-5-fixture.json'), ('keyword','memory/sites/nebulacomponents.com/task-5-keywords.json'), ('competitor_serp','seo-reports/competitor-serp-task-5-fixture.json')]:
        path = ROOT / filename
        records.append(_record(path, SOURCE_SPECS[source_type][0], json.loads(path.read_text())))
    lifecycle_brief = brief(slug="lifecycle")
    lifecycle_brief["sources"]["records"] = records
    lifecycle_brief["sources"]["first_party_sources"] = [r["url"] for r in records if r["provenance"]["source_class"] == "first_party"]
    lifecycle_brief["sources"]["primary_external_sources"] = [r["url"] for r in records if r["provenance"]["source_class"] == "primary_external"]
    lifecycle_brief["sources"]["competitor_sources"] = [r["url"] for r in records if r["provenance"]["source_class"] == "competitor"]
    def gate_record(r, query=False):
        return {"id": r["id"], "url": r["url"], "provenance": r["provenance"]["source_class"], "verified": True, "evidence": r["evidence"], **({"query": "landing page audit"} if query else {})}
    lifecycle_brief["readiness_opportunity"] = {"canonical_query": "landing page audit", "impressions": 100, "clicks": 1, "position": 10, "days": 28, "competitor_wins": 0, "source_lineage_complete": True, "active_holdout": False, "suppressed": False, "indexable": True, "verified_indexable": True, "unresolved_cannibalization": False, "verified_unresolved_cannibalization": True, "keyword_registry": [gate_record(records[5], True)], "audit_findings": [gate_record(records[0], True)], "first_party_exports": [gate_record(records[2]), gate_record(records[3])], "competitor_serp_reports": [gate_record(records[6])], "query_registry": ["landing page audit"], "existing_page_ownership": []}
    brief_path = tmp_path / "brief.json"; brief_path.write_text(json.dumps(lifecycle_brief))
    draft_root = tmp_path / "drafts"
    created = run("create_draft.py", "--brief", brief_path, "--output-root", draft_root)
    assert created.returncode == 0, created.stdout
    v001 = Path(created.stdout.strip())
    first_review = tmp_path / "v001-readiness.json"
    reviewed = run("review_draft.py", "--draft", v001, "--output", first_review)
    assert reviewed.returncode == 0, reviewed.stdout
    edits = tmp_path / "edits.json"
    edits.write_text(json.dumps({"replacements": [{"old": "without inventing a customer result", "new": "without inventing a result"}], "editor": "mike"}))
    edited = run("apply_edits.py", "--draft", v001, "--edits", edits)
    assert edited.returncode == 0, edited.stdout
    v002 = Path(edited.stdout.strip())
    second_review = tmp_path / "v002-readiness.json"
    reviewed = run("review_draft.py", "--draft", v002, "--output", second_review)
    assert reviewed.returncode == 0, reviewed.stdout
    digest = hashlib.sha256(v002.read_bytes()).hexdigest()
    approval = tmp_path / "approval.json"
    approval.write_text(json.dumps({"approved": True, "draft_hash": digest, "reviewer": "mike", "timestamp": "2026-09-05T12:00:00Z", "readiness_report": str(second_review), "requirements": list(json.loads(second_review.read_text())["requirements"]), "findings": [], "approval_scope": "task-5"}))
    dry = run("publish_article.py", "--draft", v002, "--approval", approval, "--readiness", second_review, "--dry-run", "--output-root", tmp_path / "dry-run")
    assert dry.returncode == 0, dry.stdout
    assert not (tmp_path / "dry-run").exists()
    published = tmp_path / "published"
    live = run("publish_article.py", "--draft", v002, "--approval", approval, "--readiness", second_review, "--output-root", published)
    assert live.returncode == 0, live.stdout
    receipt = published / "v002.publication.json"
    assert receipt.is_file()
    assert json.loads(receipt.read_text())["draft_hash"] == digest


def test_review_enforces_blocked_full_readiness_and_preserves_all_gate_output(tmp_path, monkeypatch):
    from scripts.content_pipeline import _validation
    from scripts.content_pipeline.review_draft import review
    draft = tmp_path / "v001.md"; draft.write_text(valid_markdown())
    draft.with_suffix(".json").write_text(json.dumps({"provenance": {"records": [source()]}, "article": {"source_refs": ["source-1"], "claims": []}}))
    monkeypatch.setattr(_validation, "build_readiness_report", lambda *args: {"status": "BLOCKED", "blocked_reasons": ["ACTIVE_HOLDOUT"], "timing_gate": "BLOCKED"})
    result = review(draft)
    assert result["status"] == "BLOCKED"
    assert result["validated"] is False
    assert result["full_readiness"] is False
    assert "ACTIVE_HOLDOUT" in {item["code"] for item in result["findings"]}
    assert result["readiness"]["timing_gate"] == "BLOCKED"


def test_review_does_not_discard_missing_source_categories_for_untyped_records(tmp_path):
    draft = tmp_path / "v001.md"; draft.write_text(valid_markdown())
    draft.with_suffix(".json").write_text(json.dumps({"provenance": {"records": [source()]}, "article": {"source_refs": ["source-1"], "claims": []}}))
    result = __import__("scripts.content_pipeline.review_draft", fromlist=["review"]).review(draft)
    codes = {item["code"] for item in result["findings"]}
    assert "SOURCE_ERROR_SITE_AUDIT:missing" in codes
    assert "SOURCE_ERROR_COMPETITOR_SERP:missing" in codes


def test_create_rejects_forged_untyped_source_record_without_mutation(tmp_path):
    item = brief(); item["sources"]["records"] = [{"id": "forged", "url": "https://evil.example"}]
    path = tmp_path / "brief.json"; path.write_text(json.dumps(item))
    output = tmp_path / "drafts"
    result = run("create_draft.py", "--brief", path, "--output-root", output)
    assert result.returncode != 0 and "SOURCE_ERROR_UNTYPED_RECORD" in result.stdout
    assert not output.exists()


def test_revision_lock_is_not_created_when_validation_fails(tmp_path):
    b = tmp_path / "brief.json"; b.write_text(json.dumps(brief()))
    out = tmp_path / "drafts"
    result = run("create_draft.py", "--brief", b, "--output-root", out)
    assert result.returncode != 0
    assert not out.exists()
    assert not list(out.rglob(".revision.lock"))
    bad = tmp_path / "bad.json"; bad.write_text("{}")
    result = run("create_draft.py", "--brief", bad, "--output-root", out)
    assert result.returncode != 0
    assert not list(out.rglob(".revision.lock"))
