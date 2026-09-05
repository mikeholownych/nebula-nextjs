import json
from pathlib import Path

from scripts.content_pipeline.collect_sources import collect_sources, classify_opportunity, score_opportunity
from scripts.content_pipeline.generate_brief import generate_brief
from scripts.content_pipeline.refresh_review import review_refresh


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value))


def test_competitor_serp_is_separate_from_first_party_sources(tmp_path):
    from scripts.content_pipeline.collect_sources import validate_source_bundle
    result = validate_source_bundle({
        "site_audit": [{"id": "audit", "source_type": "site_audit", "path": "/home/mike/nebula/agency-audit-2026-08-03/gsc-com.json", "retrieved_at": "2026-09-05T00:00:00+00:00", "url": "https://nebula.test/audit", "provenance": "first_party", "evidence": {"findings": [{"id": "f", "url": "https://nebula.test/x"}]}}],
        "competitor_serp": [{"id": "serp", "source_type": "competitor_serp", "path": "/home/mike/nebula/agency-audit-2026-08-03/gsc-com.json", "retrieved_at": "2026-09-05T00:00:00+00:00", "url": "https://other.test/serp", "provenance": "competitor", "evidence": {"retrieved_at": "2026-09-05T00:00:00+00:00", "rankings": [{"query": "audit", "domain": "other.com", "position": 1}]}}],
    })
    assert result["sources"]["site_audit"][0]["provenance"] == "first_party"
    assert result["sources"]["competitor_serp"][0]["provenance"] == "competitor"


def test_missing_sources_outside_repository_are_rejected(tmp_path):
    import pytest
    with pytest.raises(ValueError, match="inside repository"):
        collect_sources(tmp_path, days=7, today="2026-09-04")


def test_acquisition_and_feature_opportunities_are_classified(tmp_path):
    write_json(tmp_path / "keywords.json", {"primary_keywords": {"high_intent": ["landing page audit"]}})
    acquisition = classify_opportunity({"keyword": "landing page audit", "commercial_role": "audit"})
    feature = classify_opportunity({"keyword": "what we learned", "commercial_role": "trust"})

    assert acquisition["lane"] == "acquisition"
    assert feature["lane"] == "feature"
    import pytest
    with pytest.raises(ValueError): score_opportunity(acquisition)


def test_generate_brief_and_refresh_are_report_only(tmp_path):
    source = {"id": "s", "path": "/home/mike/nebula/agency-audit-2026-08-03/gsc-com.json", "retrieved_at": "2026-09-05T00:00:00+00:00", "url": "https://example.test/source", "provenance": "primary_external", "source_type": "gsc", "evidence": {"property": "sc-domain:nebulacomponents.com", "date_range": {"start": "2026-08-01", "end": "2026-08-02"}, "rows": [{"query": "landing page audit", "page": "https://example.test/x", "impressions": 3, "clicks": 1, "position": 8}]}}
    score = score_opportunity({"keyword": "landing page audit", "source_records": [source]})
    opportunity = {"id": "opp_1", "keyword": "landing page audit", "lane": "acquisition", "score": score, "first_party_sources": [], "primary_external_sources": ["https://example.test/source"], "competitor_sources": [], "source_records": [source], "timing_eligible": True, "sources": ["https://example.test/source"]}
    brief = generate_brief(opportunity)
    assert {"lane", "post_type", "question_h1", "answer_target", "sections", "sources", "internal_links", "cta", "timing_gate"} <= brief.keys()

    article = tmp_path / "article.md"
    article.write_text("original")
    review = review_refresh({"age_days": 40, "clicks": 2, "impressions": 100, "purchases": 0}, article_paths=[article])
    assert review["decision"] in {"NO_CHANGE", "OBSERVE", "REVIEW", "CONSOLIDATE", "RETIRE"}
    assert article.read_text() == "original"


def _valid_bundle():
    base = {"id": "x", "url": "https://example.test/x", "provenance": "first_party", "retrieved_at": "2026-09-05T00:00:00+00:00"}
    evidence = {
        "site_audit": {"site": "https://nebulacomponents.com", "generated_at": "2026-09-05T00:00:00+00:00", "artifact_id": "audit-20260905", "total_pages": 1, "broken": [], "redirect_chains": [], "orphan_pages": [], "summary": {"broken_count": 0, "redirect_chain_count": 0, "orphan_count": 0}},
        "gsc": {"property": "sc-domain:nebulacomponents.com", "date_range": {"start": "2026-08-01", "end": "2026-08-02"}, "rows": [{"query": "landing page audit", "page": "https://example.test/x", "impressions": 3, "clicks": 1, "position": 8}]},
        "ga4": {"property": "544419051", "report": "organic_traffic", "date_range": {"start": "2026-01-01", "end": "2026-01-02"}, "totals": {"sessions": 3, "users": 2, "pageviews": 4, "avg_daily_sessions": 3}, "daily_data": [{"date": "20260101", "sessions": 3, "users": 2, "pageviews": 4, "bounce_rate": 0, "avg_session_duration": 1, "engagement_rate": 100}]},
        "bing": {"site_url": "https://nebulacomponents.com", "data": {"d": [{"CrawlErrors": 1, "CrawledPages": 3, "Code2xx": 2, "Code4xx": 0, "Code5xx": 1}]}},
        "posthog": {"query": {"kind": "FunnelsQuery", "dateRange": {"date_from": "-30d"}, "series": [{"event": "audit_submitted", "kind": "EventsNode"}]}, "results": [{"action_id": "audit_submitted", "name": "audit_submitted", "type": "events", "count": 3}]},
        "keyword": {"site": "nebulacomponents.com", "artifact_id": "keywords-nebulacomponents", "primary_keywords": {"high_intent": ["landing page audit"], "problem_aware": ["landing page audit"], "solution_aware": ["landing page audit"]}, "secondary_keywords": {"related": ["landing page optimization"]}, "negative_keywords": ["template"], "ai_visibility_queries": ["best landing page audit"]},
    }
    provenance = {"gsc": "primary_external", **{name: "first_party" for name in evidence if name != "gsc"}}
    paths = {"site_audit": "/home/mike/nebula/agency-audit-2026-08-03/gsc-com.json", "gsc": "/home/mike/nebula/agency-audit-2026-08-03/gsc-com.json", "ga4": "/home/mike/nebula/agency-audit-2026-08-03/ga4-organic.json", "bing": "/home/mike/nebula/agency-audit-2026-08-03/ga4-organic.json", "posthog": "/home/mike/nebula/agency-audit-2026-08-03/posthog-funnel.json", "keyword": "/home/mike/nebula/memory/sites/nebulacomponents.com/keywords.json", "competitor_serp": "/home/mike/nebula/agency-audit-2026-08-03/gsc-com.json"}
    return {name: [dict(base, id=name, source_type=name, path=paths[name], provenance=provenance[name], evidence=evidence[name])] for name in evidence}


def test_schema_invalid_and_fabricated_bundles_fail_closed():
    from scripts.content_pipeline.collect_sources import validate_source_bundle
    assert validate_source_bundle({"gsc": [{}]})["valid"] is False
    assert validate_source_bundle(_valid_bundle())["valid"] is False  # competitor source is required


def test_opportunities_use_evidence_and_keep_competitors_separate():
    from scripts.content_pipeline.collect_sources import build_opportunities, validate_source_bundle
    bundle = _valid_bundle()
    bundle["competitor_serp"] = [{"id": "serp", "url": "https://competitor.test/serp", "provenance": "competitor", "source_type": "competitor_serp", "path": "/home/mike/nebula/agency-audit-2026-08-03/gsc-com.json", "retrieved_at": "2026-09-05T00:00:00+00:00", "evidence": {"retrieved_at": "2026-09-05T00:00:00+00:00", "rankings": [{"query": "landing page audit", "domain": "competitor.test", "position": 2}]}}]
    checked = validate_source_bundle(bundle)
    assert checked["valid"] is True
    opportunities = build_opportunities(checked["sources"])
    assert opportunities and "landing page audit" in opportunities[0]["keyword"]
    assert not set(opportunities[0]["first_party_sources"]) & set(opportunities[0]["competitor_sources"])


def test_paths_and_fabricated_briefs_are_rejected(tmp_path):
    from scripts.content_pipeline.generate_brief import validate_opportunity, safe_output_path
    assert validate_opportunity({"id": "x", "sources": []})["valid"] is False
    assert safe_output_path(tmp_path, "../article.md") is None
    assert safe_output_path(tmp_path, "article.md") is None


def test_scoring_requires_explicit_timing_and_calculates_factors():
    from scripts.content_pipeline.collect_sources import score_opportunity
    item = {"lane": "acquisition", "commercial_role": "audit", "trigger": True,
            "evidence_strength": 14, "timing_eligible": False}
    import pytest
    with pytest.raises(ValueError): score_opportunity(item)
    with pytest.raises(ValueError): score_opportunity({})


def test_arbitrary_nonempty_envelopes_are_rejected_for_every_source():
    from scripts.content_pipeline.collect_sources import validate_source_bundle
    bundle = {name: [{"id": name, "url": "https://example.test/", "provenance": "first_party",
                      "evidence": {"anything": "not a source artifact"}}]
              for name in ("site_audit", "gsc", "ga4", "bing", "posthog", "keyword")}
    bundle["competitor_serp"] = [dict(bundle["site_audit"][0], provenance="competitor")]
    checked = validate_source_bundle(bundle)
    assert checked["valid"] is False
    assert all(any(name.upper() in error for error in checked["errors"])
               for name in bundle)


def test_primary_external_is_accepted_but_not_first_party():
    from scripts.content_pipeline.collect_sources import validate_source_bundle, build_opportunities
    bundle = _valid_bundle()
    bundle["gsc"][0]["provenance"] = "primary_external"
    bundle["gsc"][0]["url"] = "https://search.example.test/report"
    bundle["competitor_serp"] = [{"id": "serp", "url": "https://competitor.test/serp", "source_type": "competitor_serp", "path": "/home/mike/nebula/agency-audit-2026-08-03/gsc-com.json", "retrieved_at": "2026-09-05T00:00:00+00:00", "provenance": "competitor", "evidence": {"retrieved_at": "2026-09-05T00:00:00+00:00", "rankings": [{"query": "other", "domain": "competitor.test", "position": 2}]}}]
    checked = validate_source_bundle(bundle)
    assert checked["valid"] is True
    opportunities = build_opportunities(checked["sources"])
    assert opportunities
    assert opportunities[0]["primary_external_sources"]
    assert not set(opportunities[0]["primary_external_sources"]) & set(opportunities[0]["first_party_sources"])


def test_timing_is_fail_closed_and_calculated_from_relevant_evidence():
    from scripts.content_pipeline.collect_sources import build_opportunities, validate_source_bundle
    bundle = _valid_bundle()
    bundle["gsc"][0]["evidence"]["rows"][0].update({"impressions": 10, "clicks": 1, "position": 8})
    bundle["competitor_serp"] = [{"id": "serp", "url": "https://competitor.test/serp",
        "provenance": "competitor", "evidence": {"rankings": [{"query": "landing page audit",
        "domain": "competitor.test", "position": 2}]}}]
    checked = validate_source_bundle(bundle)
    opportunities = build_opportunities(checked["sources"])
    assert opportunities and opportunities[0]["timing_eligible"] is True
    assert opportunities[0]["score"]["factors"]["evidence_strength"] > 0
    assert opportunities[0]["score"]["factors"]["timing_eligibility"] > 0


def test_each_source_rejects_isolated_fabricated_payloads():
    from scripts.content_pipeline.collect_sources import validate_source_bundle
    payloads = {
        "site_audit": {"findings": [{}]}, "gsc": {"rows": [{"query": "fake", "page": "https://x.test"}]},
        "ga4": {"report": "fake", "totals": {"made_up": 1}},
        "bing": {"data": {"d": [{"CrawlErrors": "not-a-number"}]}},
        "posthog": {"query": {"arbitrary": True}, "results": [{"name": "fake", "count": 1}]},
        "keyword": {"site": "fake.test", "primary_keywords": {"x": ["fake"]}},
        "competitor_serp": {"rankings": [{}]},
    }
    for name, evidence in payloads.items():
        record = {"id": name, "url": "https://source.test/report", "provenance": "competitor" if name == "competitor_serp" else "first_party", "evidence": evidence}
        result = validate_source_bundle({name: [record]})
        assert result["valid"] is False
        assert any(name.upper() in error for error in result["errors"])


def test_primary_external_adapter_classifies_real_source():
    from scripts.content_pipeline.collect_sources import PrimaryExternalAdapter, SOURCE_SPECS
    adapter = PrimaryExternalAdapter("gsc")
    assert adapter.source_class == "primary_external"
    assert adapter.matches("gsc-2026-09-05.json")
    assert SOURCE_SPECS["gsc"][0] == "primary_external"


def test_source_specific_canonical_fields_reject_source_shaped_fakes():
    from scripts.content_pipeline.collect_sources import validate_source_bundle
    payloads = {
        "ga4": {"property": "544419051", "report": "organic_traffic", "totals": {"made_up_metric": 1}},
        "bing": {"data": {"d": [{"CrawlErrors": 1, "CrawledPages": 3, "Code2xx": 2, "Code4xx": 0, "Code5xx": 1}]}},
        "posthog": {"query": {"kind": "FunnelsQuery"}, "results": [{"name": "fake", "count": 1}]},
        "keyword": {"site": "nebulacomponents.com", "primary_keywords": {"high_intent": ["fake"], "problem_aware": ["fake"], "solution_aware": ["fake"]}},
        "competitor_serp": {"rankings": [{"query": "fake", "position": 1}]},
    }
    for name, evidence in payloads.items():
        record = {"id": name, "url": "https://source.test/report", "provenance": "competitor" if name == "competitor_serp" else "first_party", "evidence": evidence}
        result = validate_source_bundle({name: [record]})
        assert result["valid"] is False, name


def test_gsc_never_accepts_first_party_provenance():
    from scripts.content_pipeline.collect_sources import validate_source_bundle
    bundle = _valid_bundle()
    bundle["gsc"][0]["provenance"] = "first_party"
    assert validate_source_bundle(bundle)["valid"] is False


def test_brief_reuses_source_validators_and_rejects_fabricated_evidence():
    from scripts.content_pipeline.generate_brief import validate_opportunity
    opportunity = {"id": "x", "keyword": "fabricated", "lane": "acquisition", "timing_eligible": True,
        "first_party_sources": ["https://source.test/report"], "primary_external_sources": [], "competitor_sources": [],
        "source_records": [{"id": "s", "url": "https://source.test/report", "provenance": "first_party", "evidence": {"query": "fabricated"}}],
        "score": {"factors": {"trigger_fit": 1, "evidence_strength": 1, "intent_ownership": 1, "commercial_role": 1, "timing_eligibility": 20}, "total": 24}}
    assert validate_opportunity(opportunity)["valid"] is False


def test_brief_validates_each_record_against_declared_source_type():
    from scripts.content_pipeline.generate_brief import validate_opportunity
    opportunity = {"id": "x", "keyword": "fabricated", "lane": "acquisition", "timing_eligible": True,
        "first_party_sources": ["https://source.test/report"], "primary_external_sources": [], "competitor_sources": [],
        "source_records": [{"id": "s", "url": "https://source.test/report", "provenance": "first_party",
            "source_type": "ga4", "evidence": {"query": "fabricated"}}],
        "score": {"factors": {"trigger_fit": 1, "evidence_strength": 1, "intent_ownership": 1, "commercial_role": 1, "timing_eligibility": 20}, "total": 24}}
    assert validate_opportunity(opportunity)["valid"] is False


def test_score_cannot_be_caller_overridden_and_has_bounded_derived_factors():
    from scripts.content_pipeline.collect_sources import score_opportunity
    item = {"lane": "acquisition", "commercial_role": "audit", "trigger": True, "timing_eligible": True,
            "evidence_strength": 0, "trigger_fit": 0, "intent_ownership": 0, "commercial_role_score": 0}
    import pytest
    with pytest.raises(ValueError): score_opportunity(item)


def test_direct_arbitrary_score_calls_fail_closed_and_ids_are_explained():
    import pytest
    from scripts.content_pipeline.collect_sources import score_opportunity
    with pytest.raises(ValueError):
        score_opportunity({"lane": "acquisition", "timing_eligible": True, "_supporting_count": 99})
    record = {"id": "gsc-1", "path": "/home/mike/nebula/agency-audit-2026-08-03/gsc-com.json", "retrieved_at": "2026-09-05T00:00:00+00:00", "url": "https://source.test/report", "provenance": "primary_external",
        "source_type": "gsc", "evidence": {"property": "sc-domain:nebulacomponents.com", "date_range": {"start": "2026-08-01", "end": "2026-08-02"}, "rows": [{"query": "landing page audit", "page": "https://example.test/x", "impressions": 3, "clicks": 1, "position": 8}]}}
    scored = score_opportunity({"keyword": "landing page audit", "source_records": [record], "timing_eligible": False, "_supporting_count": 0})
    assert scored["evidence_ids"] == ["gsc-1"]
    assert all("gsc-1" in text for text in scored["explanation"].values())


def test_malformed_scores_and_refresh_metrics_fail_closed():
    from scripts.content_pipeline.generate_brief import validate_opportunity
    from scripts.content_pipeline.refresh_review import review_refresh
    assert validate_opportunity({"score": {"factors": {"trigger_fit": "bad"}}})["valid"] is False
    for value in (float("nan"), -1, True, "bad"):
        try:
            review_refresh({"age_days": 1, "clicks": value, "impressions": 1, "purchases": 0})
        except ValueError:
            pass
        else:
            assert False, value


def test_collector_rejects_outside_and_traversal_roots(tmp_path):
    from scripts.content_pipeline.collect_sources import collect_sources
    import pytest
    with pytest.raises(ValueError): collect_sources(tmp_path)
    with pytest.raises(ValueError): collect_sources(tmp_path / "..")


def test_source_shaped_payloads_without_canonical_artifact_identity_are_rejected():
    from scripts.content_pipeline.collect_sources import validate_source_bundle
    payloads = {
        "site_audit": {"findings": [{"id": "finding-1", "url": "https://nebulacomponents.com/x"}]},
        "gsc": {"property": "sc-domain:nebulacomponents.com", "rows": [{"query": "landing page audit", "page": "https://nebulacomponents.com/x", "impressions": 10, "clicks": 1, "position": 8}]},
        "ga4": {"property": "544419051", "report": "organic_traffic", "date_range": {"start": "2026-08-01", "end": "2026-08-02"}, "totals": {"sessions": 1, "users": 1, "pageviews": 1, "avg_daily_sessions": 1}, "daily_data": [{"date": "20260801", "sessions": 1, "users": 1, "pageviews": 1, "bounce_rate": 0, "avg_session_duration": 1, "engagement_rate": 100}]},
        "bing": {"site_url": "https://nebulacomponents.com", "data": {"d": [{"CrawlErrors": 1, "CrawledPages": 1, "Code2xx": 1, "Code4xx": 0, "Code5xx": 0}]}},
        "posthog": {"query": {"kind": "FunnelsQuery", "series": [{"kind": "EventsNode", "event": "audit_submitted"}]}, "results": [{"action_id": "audit_submitted", "name": "audit_submitted", "type": "events", "count": 1}]},
        "keyword": {"site": "nebulacomponents.com", "primary_keywords": {"high_intent": ["landing page audit"], "problem_aware": ["landing page audit"], "solution_aware": ["landing page audit"]}, "secondary_keywords": {"related": ["landing page optimization"]}, "negative_keywords": ["template"], "ai_visibility_queries": ["best landing page audit tool"]},
        "competitor_serp": {"rankings": [{"query": "landing page audit", "domain": "competitor.example", "position": 1}]},
    }
    bundle = {name: [{"id": f"fake-{name}", "source_type": name, "url": "https://source.example/report", "provenance": "competitor" if name == "competitor_serp" else ("primary_external" if name == "gsc" else "first_party"), "evidence": evidence}] for name, evidence in payloads.items()}
    result = validate_source_bundle(bundle)
    assert result["valid"] is False
    assert all(any(name.upper() in error for error in result["errors"]) for name in payloads)


def test_generate_brief_returns_structured_invalid_for_object_provenance():
    from scripts.content_pipeline.generate_brief import validate_opportunity
    record = {"id": "gsc-1", "source_type": "gsc", "url": "https://search.google.com/search-console", "provenance": {"source_class": "primary_external", "method": "local_file"}, "evidence": {"property": "sc-domain:nebulacomponents.com", "rows": [{"query": "landing page audit", "page": "https://nebulacomponents.com/x", "impressions": 1, "clicks": 1, "position": 8}]}}
    result = validate_opportunity({"id": "opp", "keyword": "landing page audit", "lane": "acquisition", "timing_eligible": True, "first_party_sources": [], "primary_external_sources": [record["url"]], "competitor_sources": [], "source_records": [record], "score": {}})
    assert result["valid"] is False
    assert "invalid_source_records" in result["errors"]
