import unittest
from pathlib import Path

BASE = Path('/home/mike/nebula')


class AdBurnLeaderboardTests(unittest.TestCase):
    def test_leaderboard_page_exists_with_public_proof_and_submission_form(self):
        page = BASE / 'ad-burn-leaderboard.html'
        self.assertTrue(page.exists())
        html = page.read_text()
        self.assertIn('Ad Burn Leak Board', html)
        self.assertIn('Founder URL', html)
        self.assertIn('/api/leaderboard-submit', html)
        self.assertIn('https://nebulacomponents.shop/audit.html', html)
        self.assertIn('https://buy.stripe.com/aFa7sL5E03Iwgyt2Nk43S02', html)

    def test_agentic_server_has_leaderboard_submit_endpoint(self):
        source = (BASE / 'agentic_server.py').read_text()
        self.assertIn('if path == "/api/leaderboard-submit"', source)
        self.assertIn('def _handle_leaderboard_submit(self):', source)
        self.assertIn('leaderboard_submissions.jsonl', source)

    def test_leaderboard_page_exists_with_content(self):
        """Leaderboard page still exists independently (homepage context moved to audit)."""
        page = BASE / 'ad-burn-leaderboard.html'
        self.assertTrue(page.exists())
        html = page.read_text()
        self.assertIn('Ad Burn Leak Board', html)


if __name__ == '__main__':
    unittest.main()
