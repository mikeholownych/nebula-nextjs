import json
from pathlib import Path

from scripts.content_pipeline import plan_content_cycle as planner


def test_plan_classifies_repurpose_and_duplicate_topics():
    existing = [
        {
            "slug": "paid-traffic-not-converting",
            "title": "Why is paid traffic not converting?",
            "status": "published",
            "topic_tokens": sorted(planner.tokens("Why is paid traffic not converting? paid-traffic-not-converting")),
        }
    ]
    topics = planner.classify(existing, [
        {"topic": "paid traffic not converting", "intent": "problem_aware"},
        {"topic": "paid traffic not converting service", "intent": "high_intent"},
        {"topic": "landing page audit", "intent": "high_intent"},
    ])
    assert topics[0]["decision"] == "repurpose"
    assert topics[0]["canonical_article"] == "paid-traffic-not-converting"
    assert topics[1]["decision"] == "repurpose"
    assert topics[1]["canonical_article"] == "paid-traffic-not-converting"
    assert topics[2]["decision"] == "new"


def test_build_plan_inventories_real_blog_and_writes_schema(tmp_path, monkeypatch):
    monkeypatch.setattr(planner, "BLOG_ROOT", tmp_path / "blog")
    monkeypatch.setattr(planner, "KEYWORDS", tmp_path / "keywords.json")
    (tmp_path / "blog").mkdir()
    (tmp_path / "blog" / "article.md").write_text("---\nslug: article\nstatus: published\n---\n# Why is this useful?\n\nText.")
    (tmp_path / "keywords.json").write_text(json.dumps({"primary_keywords": {"high_intent": ["new topic"]}}))
    plan = planner.build_plan()
    assert plan["schema"] == "nebula.blog.content-plan.v2"
    assert plan["inventory"][0]["slug"] == "article"
    assert plan["new_topics"][0]["topic"] == "new topic"