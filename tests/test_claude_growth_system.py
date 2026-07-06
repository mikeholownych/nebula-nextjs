#!/usr/bin/env python3
import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from claude_growth_system import (
    build_content_calendar,
    draft_dm,
    ingest_engagers,
    is_self_engager,
    is_qualified_signal,
    load_strategy,
    normalize_apify_engager,
    queue_followups,
    run_weekly_system,
)


class ClaudeGrowthSystemTests(unittest.TestCase):
    def test_load_strategy_creates_icp_positioning_and_banned_words(self):
        with tempfile.TemporaryDirectory() as td:
            strategy = load_strategy(Path(td))
            self.assertIn("founders actively bleeding money on ads", strategy["icp"].lower())
            self.assertIn("autonomous", strategy["positioning"].lower())
            self.assertIn("book a call", strategy["banned_words"])
            self.assertTrue((Path(td) / "growth_system" / "ICP.md").exists())
            self.assertTrue((Path(td) / "growth_system" / "Positioning.md").exists())
            self.assertTrue((Path(td) / "growth_system" / "Banned_Words.txt").exists())

    def test_calendar_maps_30_days_before_writing_posts(self):
        calendar = build_content_calendar()
        self.assertEqual(len(calendar), 30)
        jobs = {item["job"] for item in calendar}
        self.assertEqual(jobs, {"Educational", "Testimonial", "Personal story"})
        self.assertTrue(all("hook" in item and "cta" in item for item in calendar))

    def test_normalizes_apify_linkedin_engager_actor_output(self):
        raw = {
            "type": "likers",
            "url_profile": "https://www.linkedin.com/in/example",
            "name": "Florence Divet ☀️",
            "subtitle": "I help CEOs lead with clarity. Leadership coach.",
            "post_Link": "https://www.linkedin.com/feed/update/urn:li:activity:7478763831968768000/",
        }
        normalized = normalize_apify_engager(raw)
        self.assertEqual(normalized["name"], "Florence Divet ☀️")
        self.assertEqual(normalized["role"], "I help CEOs lead with clarity. Leadership coach.")
        self.assertEqual(normalized["company"], "")
        self.assertIn("liked Mike's LinkedIn post", normalized["comment"])
        self.assertEqual(normalized["post_url"], raw["post_Link"])
        self.assertEqual(normalized["profile_url"], raw["url_profile"])

    def test_normalizes_apify_linkedin_post_search_output(self):
        raw = {
            "post_url": "https://www.linkedin.com/posts/example",
            "text": "Traffic spiked but your form did not start. Zero conversions after ads.",
            "author": {
                "name": "Nilesh Cooray",
                "headline": "Managing Director at Digifix",
                "profile_url": "https://www.linkedin.com/in/ncooray",
            },
            "stats": {"comments": 3, "total_reactions": 12},
        }
        normalized = normalize_apify_engager(raw)
        self.assertEqual(normalized["name"], "Nilesh Cooray")
        self.assertEqual(normalized["role"], "Managing Director at Digifix")
        self.assertEqual(normalized["profile_url"], "https://www.linkedin.com/in/ncooray")
        self.assertIn("Zero conversions", normalized["comment"])
        self.assertEqual(normalized["post_url"], raw["post_url"])
        self.assertEqual(normalized["engagement_type"], "linkedin_post_author")

    def test_qualified_signal_filters_generic_linkedin_posts(self):
        qualified = normalize_apify_engager({
            "post_url": "https://www.linkedin.com/posts/example",
            "text": "Traffic spiked but the form did not start. Zero conversions after paid ads.",
            "author": {"name": "Nilesh", "headline": "Founder", "profile_url": "https://linkedin.com/in/nilesh"},
        })
        generic = normalize_apify_engager({
            "post_url": "https://www.linkedin.com/posts/generic",
            "text": "Happy Fourth of July. Fireworks are not hand-held devices.",
            "author": {"name": "Cornerstone", "headline": "Construction", "profile_url": "https://linkedin.com/company/cornerstone"},
        })
        weak_leads = normalize_apify_engager({
            "post_url": "https://www.linkedin.com/posts/weak",
            "text": "Why real estate videos fail to generate leads in 2026.",
            "author": {"name": "Video Coach", "headline": "Creator", "profile_url": "https://linkedin.com/in/video"},
        })
        self.assertTrue(is_qualified_signal(qualified))
        self.assertFalse(is_qualified_signal(generic))
        self.assertFalse(is_qualified_signal(weak_leads))

    def test_ingest_engagers_dedupes_and_loads_pipeline(self):
        with tempfile.TemporaryDirectory() as td:
            base = Path(td)
            source = base / "engagers.json"
            source.write_text(json.dumps([
                {"name": "Ava", "company": "Acme", "role": "Founder", "comment": "Spending on ads, no leads"},
                {"name": "Ava", "company": "Acme", "role": "Founder", "comment": "duplicate"},
                {"name": "Ben", "company": "Beta", "role": "CEO", "comment": "Landing page not converting"},
                {"name": "Mike Holownych", "company": "Nebula", "role": "Founder", "comment": "self like"},
                {"name": "StartUp Spotlight Canada", "company": "", "role": "2 followers", "comment": "owned page"},
                {"name": "AI Syndicate", "company": "", "role": "owned page", "comment": "owned page"},
            ]))
            rows = ingest_engagers(base, source)
            self.assertEqual(len(rows), 2)
            pipeline_lines = (base / "growth_system" / "linkedin_engager_pipeline.jsonl").read_text().splitlines()
            self.assertEqual(len(pipeline_lines), 2)
            self.assertEqual(json.loads(pipeline_lines[0])["stage"], "engaged")
            second_run = ingest_engagers(base, source)
            self.assertEqual(second_run, [])
            self.assertEqual(len((base / "growth_system" / "linkedin_engager_pipeline.jsonl").read_text().splitlines()), 2)

    def test_dm_is_personal_under_150_words_and_avoids_banned_words(self):
        strategy = load_strategy(Path(tempfile.mkdtemp()))
        prospect = {"name": "Ava", "company": "Acme", "role": "Founder", "comment": "We spent $2k on ads and got no demos"}
        dm = draft_dm(prospect, strategy)
        self.assertLessEqual(len(dm.split()), 150)
        self.assertIn("Ava", dm)
        self.assertIn("$2k on ads", dm)
        for banned in strategy["banned_words"]:
            self.assertNotIn(banned.lower(), dm.lower())
        self.assertIn("no call", dm.lower())
        self.assertIn("free teardown", dm.lower())
        self.assertNotIn("..", dm)
        self.assertNotIn("your page is paying", dm.lower())
        no_company_dm = draft_dm({"name": "NoCo", "comment": "Liked the post."}, strategy)
        self.assertNotIn("you're is", no_company_dm.lower())
        self.assertIn("if you're paying", no_company_dm.lower())
        long_dm = draft_dm({"name": "Long", "comment": "Traffic spiked but form did not start. " * 30}, strategy)
        self.assertLessEqual(len(long_dm.split()), 85)
        self.assertNotIn("Traffic spiked but form did not start. Traffic spiked", long_dm)

    def test_followups_fire_for_silent_prospects_after_5_days(self):
        with tempfile.TemporaryDirectory() as td:
            base = Path(td)
            gs = base / "growth_system"
            gs.mkdir()
            old = (datetime.now(timezone.utc) - timedelta(days=6)).isoformat()
            fresh = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
            (gs / "linkedin_engager_pipeline.jsonl").write_text("\n".join([
                json.dumps({"name": "Old", "company": "A", "role": "Founder", "comment": "ads failing", "stage": "dm_sent", "last_touch_at": old}),
                json.dumps({"name": "Fresh", "company": "B", "role": "CEO", "comment": "ads failing", "stage": "dm_sent", "last_touch_at": fresh}),
            ]) + "\n")
            followups = queue_followups(base)
            self.assertEqual(len(followups), 1)
            self.assertEqual(followups[0]["name"], "Old")
            self.assertIn("silent_5_days", followups[0]["reason"])

    def test_weekly_system_writes_summary_dm_queue_and_calendar(self):
        with tempfile.TemporaryDirectory() as td:
            base = Path(td)
            source = base / "engagers.json"
            source.write_text(json.dumps([
                {"name": "Ava", "company": "Acme", "role": "Founder", "comment": "Spent on ads and got zero conversions"},
            ]))
            summary = run_weekly_system(base, source)
            self.assertEqual(summary["engagers_ingested"], 1)
            self.assertEqual(summary["dms_written"], 1)
            self.assertIn("apify_token_configured", summary)
            self.assertTrue((base / "growth_system" / "weekly_summary.json").exists())
            self.assertTrue((base / "growth_system" / "dm_queue.jsonl").exists())
            self.assertTrue((base / "growth_system" / "content_calendar_30d.json").exists())


if __name__ == "__main__":
    unittest.main()
