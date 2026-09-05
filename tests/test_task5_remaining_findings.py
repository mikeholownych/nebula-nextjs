import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parents[1]
SCRIPTS = ROOT / "scripts" / "content_pipeline"

from scripts.content_pipeline._readiness_contract import validate as validate_readiness, workflow_report

def run(script, *args):
    return subprocess.run([sys.executable, str(SCRIPTS / script), *map(str, args)], cwd=ROOT, text=True, capture_output=True)

def markdown(tmp_path):
    draft = tmp_path / "v001.md"
    draft.write_text("---\ncanonical_url: https://nebulacomponents.com/blog/x\nauthor_id: mike\ncontent_lane: trust\npost_type: guide\nupdated_at: '2026-09-05T12:00:00Z'\nsource_refs: []\n---\n# Why is this useful?\n\nThis is a direct answer with enough words to satisfy the bounded answer requirement and it avoids unsupported claims.\n\n## What should I check?\n\nReview the evidence and record its limitation before acting.\n\n## What does it show?\n\nThe declared evidence supports only the bounded observation.\n\n### FAQ: What next?\n\nReview before acting.\n\n[Source](https://example.com/source)\n")
    draft.with_suffix('.json').write_text(json.dumps({'draft_hash': hashlib.sha256(draft.read_bytes()).hexdigest(), 'revision': 1, 'provenance': {'records': []}, 'article': {'source_refs': [], 'claims': []}}))
    return draft

def test_unknown_typed_source_is_explicitly_rejected(tmp_path):
    draft = markdown(tmp_path)
    sidecar = json.loads(draft.with_suffix('.json').read_text())
    sidecar['provenance']['records'] = [{'id':'x','source_type':'future_source','url':'https://example.com/x'}]
    draft.with_suffix('.json').write_text(json.dumps(sidecar))
    result = run('review_draft.py', '--draft', draft)
    assert result.returncode != 0
    assert 'SOURCE_ERROR_UNKNOWN_SOURCE_TYPE' in result.stdout

def test_readiness_requires_workflow_bound_strict_report_and_timestamp(tmp_path):
    draft = markdown(tmp_path)
    digest = hashlib.sha256(draft.read_bytes()).hexdigest()
    readiness = tmp_path / 'readiness.json'
    readiness.write_text(json.dumps({'status':'PASS','validated':True,'full_readiness':True,'draft_hash':digest}))
    approval = tmp_path / 'approval.json'
    approval.write_text(json.dumps({'approved':True,'draft_hash':digest,'reviewer':'mike','timestamp':'not-a-timestamp','readiness_report':str(readiness)}))
    result = run('publish_article.py','--draft',draft,'--approval',approval,'--readiness',readiness,'--dry-run','--output-root',tmp_path/'published')
    assert result.returncode != 0
    assert 'INVALID_READINESS_REPORT_SCHEMA' in result.stdout or 'READINESS_NOT_WORKFLOW_BOUND' in result.stdout
    assert 'INVALID_TIMESTAMP' in result.stdout


def test_signed_readiness_with_empty_validator_output_is_rejected(tmp_path):
    digest = "a" * 64
    report = workflow_report({
        "generated_at": "2026-09-05T12:00:00Z",
        "draft": "v001.md",
        "draft_hash": digest,
        "status": "PASS",
        "validated": True,
        "full_readiness": True,
        "requirements": ["H1_QUESTION"],
        "findings": [],
        "readiness": {},
    })
    assert "MISSING_VALIDATOR_OUTPUTS" in validate_readiness(report, digest)


def test_review_rejects_every_non_object_provenance_record(tmp_path):
    from scripts.content_pipeline.review_draft import review
    for malformed in ("text", None, [], {"source_type": "future_source"}):
        draft = markdown(tmp_path)
        sidecar = json.loads(draft.with_suffix(".json").read_text())
        sidecar["provenance"]["records"] = [malformed]
        draft.with_suffix(".json").write_text(json.dumps(sidecar))
        result = review(draft)
        assert result["status"] == "BLOCKED"
        codes = {item["code"] for item in result["findings"]}
        expected = "SOURCE_ERROR_UNKNOWN_SOURCE_TYPE" if isinstance(malformed, dict) else "MALFORMED_SOURCE_RECORD"
        assert expected in codes


def test_create_rejects_every_non_object_source_record(tmp_path):
    for malformed in ("text", None, [], {"source_type": "future_source"}):
        item = {
            "id": "opp-1", "slug": "malformed-record", "lane": "acquisition",
            "post_type": "guide", "question_h1": "Why is this useful?",
            "sources": {"records": [malformed]}, "timing_gate": {"status": "ELIGIBLE"},
        }
        path = tmp_path / f"{str(malformed).replace(' ', '_')}.json"
        path.write_text(json.dumps(item))
        result = subprocess.run([sys.executable, str(SCRIPTS / "create_draft.py"), "--brief", str(path), "--output-root", str(tmp_path / "drafts")], cwd=ROOT, text=True, capture_output=True)
        assert result.returncode != 0
        assert "MALFORMED_SOURCE_RECORD" in result.stdout or "SOURCE_ERROR_UNKNOWN_SOURCE_TYPE" in result.stdout


def test_review_rejects_sidecar_canonical_mismatch(tmp_path):
    from scripts.content_pipeline.review_draft import review
    draft = tmp_path / "v001.md"
    draft = markdown(tmp_path)
    sidecar = json.loads(draft.with_suffix(".json").read_text())
    sidecar["article"]["canonical_url"] = "https://evil.example/wrong"
    draft.with_suffix(".json").write_text(json.dumps(sidecar))
    result = review(draft)
    assert result["status"] == "BLOCKED"
    assert "CANONICAL_MISMATCH" in {item["code"] for item in result["findings"]}
