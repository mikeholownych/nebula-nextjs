#!/usr/bin/env python3
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from deliver_audit import compose_audit_email


class AuditConversionCtaTests(unittest.TestCase):
    def sample_email(self):
        page = {
            "url": "https://example.com/landing",
            "headline": "Welcome",
        }
        audit = {
            "overall": 6.6,
            "overall_grade": "C",
            "dimensions": {
                "headline": {"score": 5, "grade": "C", "issue": "Headline is unclear.", "fix": "Rewrite the H1 around one measurable outcome."},
                "cta": {"score": 5, "grade": "C", "issue": "CTA is generic.", "fix": "Use one outcome-specific CTA above the fold."},
                "social_proof": {"score": 2, "grade": "F", "issue": "No proof detected.", "fix": "Add one named testimonial with a concrete result."},
                "speed": {"score": 9, "grade": "A", "issue": "Fast load.", "fix": "Keep it fast."},
                "mobile": {"score": 6, "grade": "C", "issue": "Needs mobile check.", "fix": "Verify at 375px width."},
            },
        }
        return compose_audit_email(page, audit, "lead@example.com")

    def test_trigger_context_is_preserved_as_email_opener(self):
        page = {"url": "https://example.com/landing"}
        audit = {
            "overall": 6.6,
            "overall_grade": "C",
            "dimensions": {
                "headline": {"score": 5, "issue": "Headline is unclear.", "fix": "Rewrite the H1."},
                "cta": {"score": 5, "issue": "CTA is generic.", "fix": "Make CTA specific."},
                "social_proof": {"score": 2, "issue": "No proof detected.", "fix": "Add proof."},
                "speed": {"score": 9, "issue": "Fast load.", "fix": "Keep it fast."},
                "mobile": {"score": 6, "issue": "Needs mobile check.", "fix": "Verify mobile."},
            },
        }
        email = compose_audit_email(
            page,
            audit,
            "lead@example.com",
            trigger_context="Google ads, 191 clicks, no conversions",
        )

        first_line = email["text"].splitlines()[0]
        self.assertEqual(first_line, "Saw the public conversion trigger: Google ads, 191 clicks, no conversions.")
        self.assertIn("6.6/10", email["text"])

    def test_audit_email_has_one_click_97_implementation_with_24h_turnaround(self):
        email = self.sample_email()
        text = email["text"].lower()
        html = email["html"].lower()

        self.assertIn("$147", text)
        self.assertIn("https://buy.stripe.com/afa7sl5e03iwgyt2nk43s02", text)
        self.assertIn("24h", text)
        self.assertIn("one-click checkout", text)
        self.assertNotIn("delivered in 48h", text)
        self.assertIn("24h", html)

    def test_audit_email_sells_specific_scope_not_generic_fixes(self):
        email = self.sample_email()
        text = email["text"].lower()

        self.assertIn("$147", text)
        self.assertIn("24h", text)
        self.assertIn("no call", text)
        self.assertIn("full refund", text)


if __name__ == "__main__":
    unittest.main()
