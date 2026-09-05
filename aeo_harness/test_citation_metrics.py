import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "aeo_harness" / "citation_metrics.py"


class CitationMetricsContractTests(unittest.TestCase):
    def test_reports_query_level_results_for_a_versioned_run(self):
        row = {
            "run_id": "run-2026-09-03-a",
            "prompt_set": "topic-guides-v1",
            "query_id": "Q-101",
            "engine": "perplexity",
            "model": "sonar",
            "query": "What is a landing page conversion leak?",
            "timestamp": "2026-09-03T18:00:00Z",
            "answer": "A landing page conversion leak is a page condition that can interrupt a paid-traffic journey.",
            "citations": [{"url": "https://nebulacomponents.com/learning-centre/topic-guides/landing-page-conversion-leaks", "position": 1}],
            "raw_response_sha256": "a" * 64,
        }
        with tempfile.TemporaryDirectory() as tmp:
            captures = Path(tmp) / "captures.jsonl"
            output = Path(tmp) / "metrics.json"
            captures.write_text(json.dumps(row) + "\n")
            result = subprocess.run(
                [sys.executable, str(SCRIPT), "--captures", str(captures), "--output", str(output)],
                cwd=ROOT,
                text=True,
                capture_output=True,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            report = json.loads(output.read_text())
            self.assertEqual(report["run_id"], "run-2026-09-03-a")
            self.assertEqual(report["prompt_set"], "topic-guides-v1")
            self.assertEqual(report["queries"]["Q-101"]["responses"], 1)
            self.assertEqual(report["queries"]["Q-101"]["canonical_citations"], 1)

    def test_rejects_capture_without_query_identity(self):
        row = {
            "run_id": "run-2026-09-03-a",
            "prompt_set": "topic-guides-v1",
            "engine": "perplexity",
            "model": "sonar",
            "query": "What is a landing page conversion leak?",
            "timestamp": "2026-09-03T18:00:00Z",
            "answer": "Answer",
            "citations": [],
            "raw_response_sha256": "b" * 64,
        }
        with tempfile.TemporaryDirectory() as tmp:
            captures = Path(tmp) / "captures.jsonl"
            captures.write_text(json.dumps(row) + "\n")
            result = subprocess.run(
                [sys.executable, str(SCRIPT), "--captures", str(captures)],
                cwd=ROOT,
                text=True,
                capture_output=True,
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("query_id", result.stderr + result.stdout)


if __name__ == "__main__":
    unittest.main()
