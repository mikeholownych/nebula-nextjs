import json
import tempfile
import unittest
from pathlib import Path

import sys
sys.path.insert(0, '/home/mike/nebula')

from ad_bleed_signal_ranker import rank_signal, build_public_reply, run_ranker


class AdBleedSignalRankerTests(unittest.TestCase):
    def test_rank_signal_prioritizes_paid_clicks_no_sales_with_url(self):
        record = {
            'source_url': 'https://reddit.com/r/ecommerce/example',
            'author': 'founder42',
            'title': 'Meta ads getting clicks but no sales',
            'body_excerpt': 'I spent $800 on Meta ads, got 1047 clicks, 0 sales. Site is https://example.com',
            'candidate_sites': ['https://example.com'],
            'contact_path': 'reddit_dm:u/founder42',
        }
        ranked = rank_signal(record)
        self.assertTrue(ranked['is_ad_bleed'])
        self.assertGreaterEqual(ranked['score'], 9)
        self.assertEqual(ranked['priority'], 'post_now')
        self.assertEqual(ranked['company_url'], 'https://example.com')
        self.assertIn('1047 clicks', ranked['pain_signal'])
        self.assertIn('no sales', ranked['pain_signal'].lower())

    def test_public_reply_is_short_specific_and_routes_to_leaderboard(self):
        ranked = {
            'pain_signal': '1047 clicks and 0 sales from Meta ads',
            'likely_leak': 'trust proof gap above the fold',
            'company_url': 'https://example.com',
        }
        reply = build_public_reply(ranked)
        self.assertLessEqual(len(reply.split()), 55)
        self.assertIn('1047 clicks', reply)
        self.assertIn('trust proof gap', reply)
        self.assertIn('ad-burn-leaderboard.html', reply)
        self.assertNotIn('calendar', reply.lower())

    def test_run_ranker_writes_deduped_queue(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            input_path = base / 'reddit_enriched_prospects.jsonl'
            out_path = base / 'ad_burn_public_reply_queue.jsonl'
            seen_path = base / 'ad_burn_public_reply_seen.json'
            rows = [
                {
                    'source_url': 'https://reddit.com/a',
                    'author': 'a',
                    'title': 'Facebook ads 236 clicks no sales',
                    'body_excerpt': '236 website clicks, 2 added to cart, no sales. https://store.com',
                    'candidate_sites': ['https://store.com'],
                },
                {
                    'source_url': 'https://reddit.com/b',
                    'author': 'b',
                    'title': 'What landing page builder should I use?',
                    'body_excerpt': 'Generic tool question, no conversion pain.',
                    'candidate_sites': [],
                },
            ]
            input_path.write_text(''.join(json.dumps(r) + '\n' for r in rows))
            summary = run_ranker(base=base, inputs=[input_path], output_path=out_path, seen_path=seen_path)
            self.assertEqual(summary['written'], 1)
            queued = [json.loads(l) for l in out_path.read_text().splitlines() if l.strip()]
            self.assertEqual(len(queued), 1)
            self.assertEqual(queued[0]['source_url'], 'https://reddit.com/a')
            self.assertIn('public_reply', queued[0])

            second = run_ranker(base=base, inputs=[input_path], output_path=out_path, seen_path=seen_path)
            self.assertEqual(second['written'], 0)


if __name__ == '__main__':
    unittest.main()
