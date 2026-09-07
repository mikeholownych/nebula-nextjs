"""Render evidence-backed finding annotations as standalone SVG artifacts."""

from __future__ import annotations

import base64
import html
import mimetypes
from datetime import datetime, timezone
from pathlib import Path

MAX_EVIDENCE_AGE_DAYS = 30
VALID_DETERMINATIONS = {"PASS", "FAIL"}


def _parse_timestamp(value: str) -> datetime:
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (TypeError, ValueError) as exc:
        raise ValueError("evidence timestamp must be ISO-8601") from exc
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _escape(value: object) -> str:
    return html.escape(str(value or ""), quote=True)


def _validate(finding: dict, capture: Path, now: str | None) -> None:
    if not capture.is_file() or capture.stat().st_size == 0:
        raise ValueError("verified capture artifact is required")
    if finding.get("determination") not in VALID_DETERMINATIONS:
        raise ValueError("only PASS or FAIL findings can be annotated")
    selector = str(finding.get("selector") or "").strip()
    if not selector or selector == "N/A":
        raise ValueError("a measured selector is required")
    timestamp = _parse_timestamp(str(finding.get("timestamp") or ""))
    current = _parse_timestamp(now) if now else datetime.now(timezone.utc)
    age_days = (current - timestamp).total_seconds() / 86400
    if age_days < 0 or age_days > MAX_EVIDENCE_AGE_DAYS:
        raise ValueError("evidence capture is stale")
    for key in ("audit_id", "condition_id", "measured", "required", "delta", "threshold"):
        if not str(finding.get(key) or "").strip():
            raise ValueError(f"missing evidence field: {key}")


def render_annotation(finding: dict, capture: Path, output: Path, *, now: str | None = None) -> Path:
    """Create a standalone annotation only from measured, fresh evidence.

    The capture is displayed as supplied. PASS/FAIL is copied from the finding;
    this renderer never derives a determination from visual appearance.
    """
    capture = Path(capture)
    output = Path(output)
    _validate(finding, capture, now)

    media_type = mimetypes.guess_type(capture.name)[0] or "application/octet-stream"
    encoded = base64.b64encode(capture.read_bytes()).decode("ascii")
    lines = [
        ("Audit", finding["audit_id"]),
        ("Condition", finding["condition_id"]),
        ("Determination", finding["determination"]),
        ("Selector", finding["selector"]),
        ("Measured", finding["measured"]),
        ("Required", finding["required"]),
        ("Delta", finding["delta"]),
        ("Threshold", finding["threshold"]),
        ("Captured", finding["timestamp"]),
    ]
    rows = []
    for index, (label, value) in enumerate(lines):
        y = 92 + index * 54
        rows.append(
            f'<text x="840" y="{y}" font-size="18" font-weight="700" fill="#c7ff2f">{_escape(label)}</text>'
            f'<text x="840" y="{y + 24}" font-size="16" fill="#ffffff">{_escape(value)}</text>'
        )

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1400" height="800" viewBox="0 0 1400 800" role="img" aria-labelledby="title desc">
  <title id="title">Nebula evidence annotation: {_escape(finding["condition_id"])}</title>
  <desc id="desc">Public audit evidence, not a customer case study. Determination is copied from measured audit data.</desc>
  <rect width="1400" height="800" fill="#050505"/>
  <rect x="0" y="0" width="800" height="800" fill="#151515"/>
  <image x="0" y="0" width="800" height="800" preserveAspectRatio="xMidYMid meet" href="data:{media_type};base64,{encoded}" xlink:href="data:{media_type};base64,{encoded}"/>
  <rect x="800" y="0" width="600" height="800" fill="#0d1110"/>
  <text x="840" y="44" font-size="20" font-weight="700" fill="#ffffff">PUBLIC AUDIT / NOT A CUSTOMER</text>
  <rect x="840" y="58" width="480" height="2" fill="#c7ff2f"/>
  {''.join(rows)}
</svg>
'''
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(svg, encoding="utf-8")
    return output
