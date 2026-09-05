import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parents[1]
SCRIPTS = ROOT / "scripts" / "content_pipeline"
sys.path.insert(0, str(SCRIPTS))

from validate_claims import validate_article_claims
from score_opportunities import score_opportunity
import publish_readiness
from publish_readiness import build_readiness_report, atomic_write_report


def article(*, claims=None, source_refs=None, intent_overlap=False):
    return {
        "title": "Evidence-led landing page review",
        "canonical_url": "https://nebulacomponents.com/blog/evidence-led-review",
        "body": "A concise article with sourced findings.",
        "claims": claims or [],
        "source_refs": source_refs or [],
        "intent_overlap": intent_overlap,
    }


def test_fabricated_testimonial_is_blocked():
    result = validate_article_claims(
        article(claims=[{"type": "testimonial", "text": "A customer said this doubled sales."}]),
        [],
    )
    assert result["status"] == "BLOCKED"
    assert "FABRICATED_TESTIMONIAL" in result["blocked_reasons"]


def test_unsupported_numeric_claim_is_blocked():
    result = validate_article_claims(
        article(claims=[{"type": "numeric", "text": "Conversion improved by 37%.", "value": 37}]),
        [],
    )
    assert result["status"] == "BLOCKED"
    assert "UNSUPPORTED_NUMERIC_CLAIM" in result["blocked_reasons"]


def test_primary_source_provenance_is_accepted():
    source = {"id": "gsc-1", "url": "https://search.google.com/search-console", "kind": "primary", "provenance": "first_party", "verified": True}
    result = validate_article_claims(
        article(
            claims=[{"type": "numeric", "text": "100 impressions.", "value": 100, "source_ref": "gsc-1"}],
            source_refs=[source],
        ),
        [source],
    )
    assert result["status"] == "PASS"
    assert result["claim_results"][0]["status"] == "SUPPORTED"


def test_low_impressions_are_observe():
    assert score_opportunity(complete_evidence(impressions=99, competitor_wins=0))["recommendation"] == "OBSERVE"


def test_single_competitor_win_is_observe():
    assert score_opportunity(complete_evidence(impressions=500, competitor_wins=1, days=28))["recommendation"] == "OBSERVE"


def test_repeated_competitor_evidence_allows_alignment_review():
    result = score_opportunity(complete_evidence(impressions=500, competitor_wins=2, days=28, position=15))
    assert result["recommendation"] == "REVIEW_CONTENT_ALIGNMENT"


def test_28_day_prerequisite_blocks_early_readiness():
    result = build_readiness_report(
        article(source_refs=[{"id": "s", "url": "https://example.com", "kind": "primary", "provenance": "first_party", "verified": True}]),
        [{"id": "s", "url": "https://example.com", "kind": "primary", "provenance": "first_party", "verified": True}],
        opportunity=complete_evidence(impressions=500, competitor_wins=0, days=14),
    )
    assert result["status"] == "BLOCKED"
    assert "28_DAY_PREREQUISITE" in result["blocked_reasons"]


def test_report_write_is_atomic(tmp_path):
    target = tmp_path / "report.json"
    atomic_write_report(target, {"status": "PASS"})
    assert json.loads(target.read_text()) == {"status": "PASS"}
    assert not list(tmp_path.glob("*.tmp"))


def test_cli_returns_nonzero_for_invalid_fixture(tmp_path):
    article_path = tmp_path / "article.json"
    claims_path = tmp_path / "claims.json"
    article_path.write_text(json.dumps(article(claims=[{"type": "testimonial", "text": "Made up."}])))
    claims_path.write_text("[]")
    proc = subprocess.run(
        [sys.executable, str(SCRIPTS / "validate_claims.py"), "--article", str(article_path), "--claims", str(claims_path)],
        capture_output=True, text=True,
    )
    assert proc.returncode != 0
    assert "BLOCKED" in proc.stdout


def test_intent_overlap_blocks_readiness():
    result = validate_article_claims(article(intent_overlap=False) | {
        "canonical_query": "same query",
        "query_registry": [{"query": "same query"}],
        "existing_page_ownership": [{"query": "same query"}],
    }, [])
    assert result["status"] == "BLOCKED"
    assert "REVIEW_CANNIBALIZATION" in result["blocked_reasons"]


def test_competitor_cannot_support_numeric_or_general_claims():
    source = {"id": "c", "kind": "competitor", "provenance": "competitor", "verified": True, "owner": "competitor"}
    result = validate_article_claims(article(claims=[
        {"type": "numeric", "text": "37%.", "source_ref": "c"},
        {"type": "general", "text": "Fast.", "source_ref": "c"},
    ], source_refs=[source]), [source])
    assert result["status"] == "BLOCKED"
    assert "UNSUPPORTED_NUMERIC_CLAIM" in result["blocked_reasons"]
    assert "UNVERIFIED_GENERAL_CLAIM" in result["blocked_reasons"]


def test_article_source_refs_must_exist_in_source_index():
    result = validate_article_claims(article(source_refs=[{"id": "missing"}]), [])
    assert "UNKNOWN_SOURCE_REF" in result["blocked_reasons"]


def test_low_exposure_requires_zero_clicks():
    result = score_opportunity(complete_evidence(impressions=500, competitor_wins=0, days=28, position=25, clicks=0))
    assert "LOW_EXPOSURE" in result["reasons"]
    assert score_opportunity(complete_evidence(impressions=500, competitor_wins=0, days=28, position=25, clicks=1))["reasons"] != ["LOW_EXPOSURE"]


def test_scorer_validates_required_evidence_sources():
    result = score_opportunity({"impressions": 500, "days": 28, "keyword_registry": [], "audit_findings": [], "first_party_exports": [], "competitor_serp_reports": []})
    assert result["recommendation"] == "BLOCKED"
    assert "SOURCE_ERROR_KEYWORD_REGISTRY" in result["reasons"]


def test_readiness_requires_all_28_day_prerequisites():
    result = build_readiness_report(article(), [], complete_evidence(source_lineage_complete=False, active_holdout=True, suppressed=True, canonical_query="same query", existing_page_ownership=[{"query": "same query"}], keyword_registry=[{"id": "kw-1", "query": "same query", "url": "https://example.com/keywords/kw-1", "provenance": "first_party", "verified": True, "evidence": {"volume": 500}}]))
    assert result["status"] == "BLOCKED"
    assert {"INCOMPLETE_SOURCE_LINEAGE", "ACTIVE_HOLDOUT", "SUPPRESSED", "REVIEW_CANNIBALIZATION"} <= set(result["blocked_reasons"])


def test_report_pair_publication_fails_closed(tmp_path):
    report = {"status": "PASS", "blocked_reasons": [], "claim_results": [], "source_refs": [], "claim_reasons": [], "provenance": {}, "timing_gate": "PASS"}
    publish_readiness.publish_reports(tmp_path / "report.json", report)
    assert (tmp_path / "report.json").exists() and (tmp_path / "report.md").exists()


def complete_evidence(**overrides):
    evidence = {
        "impressions": 500,
        "competitor_wins": 2,
        "days": 28,
        "position": 15,
        "clicks": 1,
        "keyword_registry": [{"id": "kw-1", "query": "landing page audit", "url": "https://example.com/keywords/kw-1", "provenance": "first_party", "verified": True, "evidence": {"volume": 500}}],
        "audit_findings": [{"id": "finding-1", "query": "landing page audit", "url": "https://example.com/audit/finding-1", "provenance": "first_party", "verified": True, "evidence": {"issue": "thin content"}}],
        "first_party_exports": [{"id": "gsc-1", "url": "https://search.google.com/search-console", "provenance": "first_party", "verified": True, "evidence": {"impressions": 500}}],
        "competitor_serp_reports": [{"id": "serp-1", "url": "https://example.com/serp/serp-1", "provenance": "competitor", "verified": True, "evidence": {"position": 15}}],
        "canonical_query": "landing page audit",
        "existing_page_ownership": [],
        "source_lineage_complete": True,
        "active_holdout": False,
        "suppressed": False,
    }
    evidence.update(overrides)
    return evidence


def test_scorer_fails_closed_when_sources_are_absent():
    result = score_opportunity({"impressions": 500, "days": 28})
    assert result["recommendation"] == "BLOCKED"
    assert len(result["source_errors"]) == 4


def test_unsourced_general_claim_is_blocked():
    result = validate_article_claims(article(claims=[{"type": "general", "text": "Fast."}]), [])
    assert result["status"] == "BLOCKED"
    assert "UNSOURCED" in result["blocked_reasons"]


def test_provenance_requires_explicit_class_and_competitor_is_never_supporting():
    ambiguous = {"id": "x", "kind": "primary", "verified": True}
    result = validate_article_claims(article(claims=[{"type": "numeric", "text": "37%.", "source_ref": "x"}], source_refs=[ambiguous]), [ambiguous])
    assert result["status"] == "BLOCKED"
    assert "INVALID_SOURCE_PROVENANCE" in result["blocked_reasons"]


def test_claim_refs_must_be_declared_and_sources_are_typed():
    source = {"id": "s", "provenance": "first_party", "verified": True}
    result = validate_article_claims(article(claims=[{"type": "general", "text": "Known.", "source_ref": "s"}]), [source])
    assert "CLAIM_SOURCE_NOT_DECLARED" in result["blocked_reasons"]
    assert "INVALID_SOURCE_TYPE" in result["blocked_reasons"]


def test_28_day_gate_requires_impressions_or_verified_indexability_defect():
    low = build_readiness_report(article(), [], complete_evidence(impressions=99))
    assert low["status"] == "BLOCKED"
    defect = build_readiness_report(article(), [], complete_evidence(impressions=0, indexable=False, indexability_defect_verified=True))
    assert "INSUFFICIENT_IMPRESSIONS" not in defect["blocked_reasons"]


def test_report_pair_rolls_back_after_mid_publish_failure(tmp_path, monkeypatch):
    target = tmp_path / "report.json"
    old = {"status": "OLD"}
    publish_readiness.publish_reports(target, old)
    original_json = target.read_bytes()
    original_md = (tmp_path / "report.md").read_bytes()
    real_replace = publish_readiness.os.replace
    calls = 0
    def fail_second(source, destination):
        nonlocal calls
        calls += 1
        if calls == 2:
            raise OSError("injected mid-publish failure")
        return real_replace(source, destination)
    monkeypatch.setattr(publish_readiness.os, "replace", fail_second)
    try:
        publish_readiness.publish_reports(target, {"status": "NEW"})
    except OSError:
        pass
    assert target.read_bytes() == original_json
    assert (tmp_path / "report.md").read_bytes() == original_md


def test_intent_overlap_uses_registry_and_page_ownership():
    result = score_opportunity(complete_evidence(
        canonical_query="same query",
        keyword_registry=[{"id": "kw-1", "query": "same query", "url": "https://example.com/keywords/kw-1", "provenance": "first_party", "verified": True, "evidence": {"volume": 500}}],
        existing_page_ownership=[{"query": "same query", "canonical_url": "https://example.com/old"}],
        intent_overlap=False,
    ))
    assert "REVIEW_CANNIBALIZATION" in result["reasons"]


def test_each_required_source_rejects_malformed_records():
    for field in ("keyword_registry", "audit_findings", "first_party_exports", "competitor_serp_reports"):
        evidence = complete_evidence(**{field: [{"id": "only-id"}]})
        result = score_opportunity(evidence)
        assert result["recommendation"] == "BLOCKED", field
        assert f"SOURCE_ERROR_{field.upper()}" in result["source_errors"], field


def test_required_source_ids_urls_provenance_and_evidence_are_validated():
    cases = [
        ("keyword_registry", {"id": "kw", "query": "q", "url": "not-url", "provenance": "first_party", "verified": True, "evidence": {"volume": 1}}),
        ("audit_findings", {"id": "a", "query": "q", "url": "https://x.test/a", "provenance": "unknown", "verified": True, "evidence": {"issue": "x"}}),
        ("first_party_exports", {"id": "f", "url": "https://x.test/f", "provenance": "first_party", "verified": True, "evidence": {}}),
        ("competitor_serp_reports", {"id": "c", "url": "https://x.test/c", "provenance": "competitor", "verified": True, "evidence": "missing-structure"}),
    ]
    for field, record in cases:
        result = score_opportunity(complete_evidence(**{field: [record]}))
        assert result["recommendation"] == "BLOCKED", field
        assert any(reason.startswith(f"SOURCE_ERROR_{field.upper()}") for reason in result["source_errors"])


def test_28_day_gate_requires_explicit_verified_indexable_and_cannibalization():
    base = complete_evidence()
    for field in ("indexable", "unresolved_cannibalization"):
        missing = build_readiness_report(article(), [], base)
        assert missing["status"] == "BLOCKED"
        assert f"MISSING_VERIFIED_{field.upper()}" in missing["blocked_reasons"]
    unverified = build_readiness_report(article(), [], complete_evidence(indexable=True, unresolved_cannibalization=False, verified_indexable=False, verified_unresolved_cannibalization=False))
    assert "UNVERIFIED_INDEXABLE" in unverified["blocked_reasons"]
    assert "UNVERIFIED_UNRESOLVED_CANNIBALIZATION" in unverified["blocked_reasons"]


def test_markdown_exposes_every_json_report_field_and_detail():
    report = build_readiness_report(article(), [], complete_evidence(indexable=True, unresolved_cannibalization=False, verified_indexable=True, verified_unresolved_cannibalization=True))
    markdown = publish_readiness._markdown(report)
    for key in ("recommendation", "opportunity", "claim_reasons", "provenance", "claim_results", "source_refs", "timing_gate", "canonical_url", "blocked_reasons"):
        assert key in markdown
