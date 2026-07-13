from html.parser import HTMLParser
from pathlib import Path


class FormParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.label_targets = set()
        self.controls = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "label" and values.get("for"):
            self.label_targets.add(values["for"])
        if tag in {"input", "select", "textarea"} and values.get("type") != "hidden":
            self.controls.append(values)


def test_pricing_generator_controls_have_static_accessible_names():
    source = (Path(__file__).resolve().parents[1] / "pricing-generator.html").read_text(encoding="utf-8")
    parser = FormParser()
    parser.feed(source)
    unnamed = [
        control.get("id") or control.get("name") or "unknown"
        for control in parser.controls
        if not control.get("aria-label")
        and not control.get("aria-labelledby")
        and control.get("id") not in parser.label_targets
    ]
    assert unnamed == []
