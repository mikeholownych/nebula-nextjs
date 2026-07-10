import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import publish_lead_magnets as pub


def test_md_to_html_handles_heading_links_and_table():
    html = pub.md_to_html("# Title\n\n## Sub\n\n| A | B |\n|---|---|\n| **x** | https://example.com |")

    assert "<h1>Title</h1>" in html
    assert "<h2>Sub</h2>" in html
    assert "<table>" in html
    assert "<strong>x</strong>" in html
    assert "href='https://example.com'" in html


def test_publish_main_writes_public_pages(tmp_path, monkeypatch, capsys):
    magnet_dir = tmp_path / "lead_magnets"
    public_dir = tmp_path / "public" / "lead-magnets"
    gs = tmp_path / "growth_system"
    magnet_dir.mkdir()
    gs.mkdir()
    src = magnet_dir / "sample.md"
    src.write_text("# Sample\n\nRun the audit: https://nebulacomponents.shop/audit.html")
    config = gs / "hormozi_lead_magnet_vault.json"
    config.write_text(json.dumps({"magnets": [{"title": "Sample", "file": str(src)}]}))

    monkeypatch.setattr(pub, "MAGNET_DIR", magnet_dir)
    monkeypatch.setattr(pub, "PUBLIC_DIR", public_dir)
    monkeypatch.setattr(pub, "CONFIG", config)

    pub.main()
    summary = json.loads(capsys.readouterr().out)

    assert summary["published"] == 1
    assert (public_dir / "sample.html").exists()
    assert (public_dir / "index.json").exists()
