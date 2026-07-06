import unittest
import json
from datetime import datetime
from scripts.trigger_lead_engine import TriggerLeadEngine

class TestTriggerLeadEngine(unittest.TestCase):
    def setUp(self):
        self.engine = TriggerLeadEngine()
    
    def test_search_triggers(self):
        """Test that search_triggers returns expected structure"""
        leads = self.engine.search_triggers("reddit_explicit_pain")
        self.assertIsInstance(leads, list)
        
        if leads and len(leads) > 0:
            lead = leads[0]
            self.assertIn("source_type", lead)
            self.assertIn("trigger_type", lead)
            self.assertIn("vertical", lead)
            self.assertIn("title", lead)
            self.assertIn("url", lead)
            self.assertIn("author", lead)
            self.assertIn("score", lead)
            self.assertIn("num_comments", lead)
            self.assertIn("created_utc", lead)
            self.assertIn("content", lead)
            self.assertIn("keyword", lead)
            self.assertIn("score_value", lead)
            self.assertIn("timestamp", lead)
    
    def test_filter_leads(self):
        """Test that filter_leads removes low-quality leads"""
        # Create test leads
        test_leads = [
            {
                "content": "I'm an ads expert looking for new clients.",
                "title": "AMA: Ads Expert"
            },
            {
                "content": "Looking for feedback on my landing page.",
                "title": "Review my landing page"
            },
            {
                "content": "Free tool to analyze your landing page.",
                "title": "Free analyzer"
            }
        ]
        
        filtered_leads = self.engine.filter_leads(test_leads)
        
        # Should only keep the second lead (feedback seeker)
        self.assertEqual(len(filtered_leads), 1)
        if len(filtered_leads) > 0:
            self.assertIn("Looking for feedback on my landing page.", filtered_leads[0]["content"])
    
    def test_score_leads(self):
        """Test that score_leads assigns appropriate scores"""
        test_leads = [
            {
                "trigger_type": "ad_bleed",
                "score": 60,
                "num_comments": 15,
                "created_utc": datetime.now().timestamp() - 3600
            }
        ]
        
        scored_leads = self.engine.score_leads(test_leads)
        
        # Score should be: 10 (ad_bleed) + 2 (score > 50) + 2 (comments > 10) + 3 (recent)
        self.assertEqual(scored_leads[0]["final_score"], 17)
    
    def test_segment_leads(self):
        """Test that segment_leads correctly segments leads"""
        test_leads = [
            {
                "trigger_type": "ad_bleed",
                "title": "Ad bleed lead"
            },
            {
                "trigger_type": "landing_page_feedback",
                "title": "Feedback seeker lead"
            },
            {
                "trigger_type": "hiring_scaling",
                "title": "Hiring scaling lead"
            },
            {
                "trigger_type": "general_conversion_pain",
                "title": "General pain lead"
            }
        ]
        
        segments = self.engine.segment_leads(test_leads)
        
        self.assertEqual(len(segments["founder_ad_bleed"]), 1)
        self.assertEqual(len(segments["feedback_seeker"]), 1)
        self.assertEqual(len(segments["hiring_scaling"]), 1)
        self.assertEqual(len(segments["general_conversion_pain"]), 1)
    
    def test_generate_outreach(self):
        """Test that generate_outreach creates appropriate messages"""
        test_lead = {
            "trigger_type": "ad_bleed",
            "author": "founder123",
            "vertical": "saas",
            "content": "I'm spending $5000/month on ads but getting zero conversions."
        }
        
        outreach = self.engine.generate_outreach(test_lead)
        
        # Check that outreach contains expected elements
        self.assertIn("Saw your ads aren't converting", outreach)
        self.assertIn("founder123", outreach)
        self.assertIn("https://nebula.com/audit", outreach)
        self.assertIn("No calls, no calendars", outreach)
    
    def test_run(self):
        """Test that run method executes all steps correctly"""
        result = self.engine.run("reddit_explicit_pain")
        
        self.assertIn("total_leads", result)
        self.assertIn("filtered_leads", result)
        self.assertIn("scored_leads", result)
        self.assertIn("segments", result)
        self.assertIn("outreach_messages", result)
        
        # Check that outreach_messages is a list of dicts
        self.assertIsInstance(result["outreach_messages"], list)
        if result.get("outreach_messages") and len(result["outreach_messages"]) > 0:
            self.assertIsInstance(result["outreach_messages"][0], dict)
            self.assertIn("lead", result["outreach_messages"][0])
            self.assertIn("outreach", result["outreach_messages"][0])
            self.assertIn("segment", result["outreach_messages"][0])

if __name__ == "__main__":
    unittest.main()