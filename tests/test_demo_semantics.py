from pathlib import Path

DEMO = (Path(__file__).resolve().parents[1] / "demo.html").read_text(encoding="utf-8")


def test_demo_contains_no_fake_navigation_targets():
    assert 'href="#"' not in DEMO


def test_demo_actions_use_semantic_buttons():
    assert DEMO.count('type="button"') >= 7
