import json
import os
import re
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
MANIFEST_PATH = BASE / "config" / "public-route-manifest.json"


def test_manifest_exists():
    """Manifest file exists."""
    assert MANIFEST_PATH.exists()


def test_manifest_is_valid_json():
    """Manifest contains valid JSON."""
    content = MANIFEST_PATH.read_text()
    data = json.loads(content)
    assert isinstance(data, list)


def test_manifest_has_routes():
    """Manifest contains at least some routes."""
    content = MANIFEST_PATH.read_text()
    data = json.loads(content)
    assert len(data) > 0


def test_each_route_has_required_fields():
    """Each route record has the exact required field set."""
    content = MANIFEST_PATH.read_text()
    data = json.loads(content)
    
    required_fields = {
        "path", "status", "redirect_target", "canonical", "title",
        "description", "robots", "h1_texts", "jsonld_types", "og_metadata",
        "twitter_metadata", "internal_links", "referenced_assets", 
        "ga4_event_names", "stripe_payment_links", "source_file"
    }
    
    for route in data:
        assert isinstance(route, dict)
        assert set(route.keys()) == required_fields


def test_paths_are_absolute_and_unique():
    """All paths are absolute, non-empty, and unique."""
    content = MANIFEST_PATH.read_text()
    data = json.loads(content)
    
    paths = [route["path"] for route in data]
    
    assert all(paths), "All paths must be non-empty"
    assert all(p.startswith("/") for p in paths), "All paths must be absolute"
    assert len(paths) == len(set(paths)), "All paths must be unique"


def test_manifest_is_stably_sorted():
    """Manifest routes are sorted by path for deterministic output."""
    content = MANIFEST_PATH.read_text()
    data = json.loads(content)
    
    paths = [route["path"] for route in data]
    assert paths == sorted(paths), "Routes must be sorted by path"


def test_root_and_index_present():
    """Root route and /index.html are included."""
    content = MANIFEST_PATH.read_text()
    data = json.loads(content)
    
    paths = {route["path"] for route in data}
    assert "/" in paths
    assert "/index.html" in paths


def test_audit_routes_present():
    """Both /audit and /audit.html are present."""
    content = MANIFEST_PATH.read_text()
    data = json.loads(content)
    
    paths = {route["path"] for route in data}
    assert "/audit" in paths
    assert "/audit.html" in paths


def test_no_sensitive_fields():
    """No email, token, or authorization fields in manifest."""
    content = MANIFEST_PATH.read_text()
    data = json.loads(content)
    
    sensitive_keywords = {"email", "token", "auth", "password", "secret", "key", "bearer"}
    
    for route in data:
        # Check route fields
        for key, value in route.items():
            if isinstance(value, str):
                # Check for standalone sensitive terms (not partial matches)
                lowercase = value.lower()
                for kw in sensitive_keywords:
                    # Look for word boundaries to avoid false positives like "gates"
                    pattern = r'\b' + re.escape(kw) + r'\b'
                    if re.search(pattern, lowercase):
                        assert False, f"Sensitive keyword '{kw}' found in {key}: {value}"
            elif isinstance(value, list):
                for item in value:
                    if isinstance(item, str):
                        lowercase = item.lower()
                        for kw in sensitive_keywords:
                            pattern = r'\b' + re.escape(kw) + r'\b'
                            if re.search(pattern, lowercase):
                                assert False, f"Sensitive keyword '{kw}' found in list item: {item}"
            elif isinstance(value, dict):
                for dict_key, dict_value in value.items():
                    if isinstance(dict_value, str):
                        lowercase = dict_value.lower()
                        for kw in sensitive_keywords:
                            pattern = r'\b' + re.escape(kw) + r'\b'
                            if re.search(pattern, lowercase):
                                assert False, f"Sensitive keyword '{kw}' found in dict value: {dict_value}"
