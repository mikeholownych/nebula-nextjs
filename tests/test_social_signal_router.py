import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import social_signal_router as router


def test_tier_one_routes_linkedin_and_email_with_prospeo_first():
    rows = [{
        "name": "Ava Founder",
        "company": "Acme",
        "headline": "Founder running paid ads",
        "email": "ava@acme.com",
        "profile_url": "https://linkedin.com/in/ava",
        "source_type": "competitor_engagement",
        "engagement_type": "commenter",
        "comment": "Spent on Google Ads and no conversions from the landing page",
    }]

    routed = router.route_signals(rows)

    assert len(routed) == 1
    assert routed[0].tier == 1
    assert routed[0].route == "linkedin_and_email"
    assert routed[0].enrichment_path[0] == "prospeo"
    assert len(routed[0].outreach.split()) <= 80
    assert router.AUDIT_URL in routed[0].outreach
    assert "$147" not in routed[0].outreach


def test_tier_two_and_three_are_email_only():
    rows = [
        {
            "name": "Ben",
            "email": "ben@example.com",
            "source_type": "owned_post",
            "engagement_type": "liker",
            "headline": "Growth marketer",
            "comment": "landing page",
        },
        {
            "name": "Cam",
            "email": "cam@example.com",
            "source_type": "liked",
            "engagement_type": "liker",
            "comment": "nice post",
        },
    ]

    routed = router.route_signals(rows)
    by_name = {r.name: r for r in routed}

    assert by_name["Ben"].tier == 2
    assert by_name["Ben"].route == "email_only"
    assert by_name["Cam"].tier == 3
    assert by_name["Cam"].route == "email_only"


def test_negative_and_low_intent_skipped():
    rows = [{
        "name": "Intern",
        "headline": "Student intern open to work",
        "comment": "cool",
        "engagement_type": "like",
    }]

    assert router.route_signals(rows) == []


def test_vendor_promo_posts_are_blocked_even_with_pain_language():
    rows = [{
        "name": "PPC Agency",
        "headline": "Founder at PPC Audit Agency",
        "source_type": "owned_post",
        "engagement_type": "linkedin_post_author",
        "comment": "We help brands fix zero conversions. DM me AUDIT for a free PPC audit this week.",
    }]

    assert router.route_signals(rows) == []


def test_self_engagers_are_blocked():
    rows = [{
        "name": "Mike Holownych",
        "headline": "Founder",
        "profile_url": "https://linkedin.com/in/mike",
        "source_type": "owned_post",
        "comment": "landing page zero conversions",
    }]

    assert router.route_signals(rows) == []


def test_cli_writes_playbook_outputs(tmp_path, monkeypatch, capsys):
    base = tmp_path / "nebula"
    gs = base / "growth_system"
    gs.mkdir(parents=True)
    source = gs / "source.jsonl"
    source.write_text(json.dumps({
        "name": "Dana CEO",
        "headline": "CEO with Meta ads",
        "email": "dana@example.com",
        "profile_url": "https://linkedin.com/in/dana",
        "source_type": "creator_post",
        "comment": "No leads from paid ads. Landing page not converting.",
    }) + "\n")

    monkeypatch.setattr(router, "BASE", base)
    monkeypatch.setattr(router, "GS", gs)
    monkeypatch.setattr(router, "SIGNAL_QUEUE", gs / "evergreen_social_signal_queue.jsonl")
    monkeypatch.setattr(router, "OUTREACH_QUEUE", gs / "evergreen_outreach_queue.jsonl")
    monkeypatch.setattr(router, "CONFIG_PATH", gs / "social_signal_playbook.json")
    monkeypatch.setattr(sys, "argv", ["social_signal_router.py", "--source", str(source)])

    router.main()
    summary = json.loads(capsys.readouterr().out)

    assert summary["routed"] == 1
    assert (gs / "evergreen_social_signal_queue.jsonl").exists()
    assert (gs / "evergreen_outreach_queue.jsonl").exists()
    config = json.loads((gs / "social_signal_playbook.json").read_text())
    assert config["enrichment_waterfall"][0] == "prospeo"
