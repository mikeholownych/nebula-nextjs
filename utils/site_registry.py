"""Site registry — multi-tenancy isolation for Nebula's agentic SEO system."""
import json
import sys
from pathlib import Path

SITES_ROOT = Path("/home/mike/nebula/memory/sites")
REQUIRED_FILES = ["brand-voice.md", "keywords.json", "target-pages.json"]


def list_sites() -> list:
    return sorted(p.name for p in SITES_ROOT.iterdir() if p.is_dir())


def load_site_config(site: str) -> dict:
    cfg = SITES_ROOT / site / "site-config.json"
    if not cfg.is_file():
        raise FileNotFoundError(f"No site-config.json for '{site}'")
    return json.loads(cfg.read_text())


def validate_site(site: str) -> bool:
    base = SITES_ROOT / site
    return all((base / f).is_file() for f in REQUIRED_FILES)


def get_competitors(site: str) -> list:
    return load_site_config(site).get("competitors", [])


def get_keywords(site: str, intent: str = None) -> list:
    kw_file = SITES_ROOT / site / "keywords.json"
    if not kw_file.is_file():
        return []
    data = json.loads(kw_file.read_text())
    primary = data.get("primary_keywords", {})
    if intent:
        return primary.get(intent, [])
    out = []
    for lst in primary.values():
        out.extend(lst)
    for lst in data.get("secondary_keywords", {}).values():
        out.extend(lst)
    return out


def get_ai_queries(site: str) -> list:
    kw_file = SITES_ROOT / site / "keywords.json"
    data = json.loads(kw_file.read_text())
    return data.get("ai_visibility_queries", [])


if __name__ == "__main__":
    for s in list_sites():
        valid = validate_site(s)
        try:
            cfg = load_site_config(s)
            brand = cfg.get("brand_name", "?")
        except FileNotFoundError:
            brand = "(no config)"
        print(f"  {'✓' if valid else '!'} {s:30s}  {brand}")
