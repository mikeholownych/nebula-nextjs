from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from openserp_rank_tracker import domain_matches, keywords_from  # noqa: E402


def test_domain_matches_exact_and_subdomain_only():
    assert domain_matches("www.nebulacomponents.com", "nebulacomponents.com")
    assert domain_matches("blog.nebulacomponents.com", "nebulacomponents.com")
    assert not domain_matches("notnebulacomponents.com", "nebulacomponents.com")


def test_keywords_from_deduplicates_and_normalizes(tmp_path):
    path = tmp_path / "keywords.json"
    path.write_text(json.dumps({"primary_keywords": {"a": [" Landing Page Audit ", "x"]}, "secondary_keywords": {"b": ["x", "Y"]}}))
    assert keywords_from(path) == ["landing page audit", "x", "y"]
