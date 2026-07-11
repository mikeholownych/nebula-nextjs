import ast
import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def tracked_files(pattern: str) -> list[Path]:
    output = subprocess.check_output(["git", "ls-files", pattern], cwd=ROOT, text=True)
    return [ROOT / line for line in output.splitlines() if line.strip()]


def test_tracked_python_files_are_syntactically_valid():
    bad = []
    for path in tracked_files("*.py"):
        try:
            ast.parse(path.read_text(encoding="utf-8"))
        except Exception as exc:  # pragma: no cover - only prints actionable failures
            bad.append(f"{path.relative_to(ROOT)}: {exc}")
    assert not bad, "\n".join(bad)


def test_tracked_json_files_parse():
    bad = []
    for path in tracked_files("*.json"):
        try:
            json.loads(path.read_text(encoding="utf-8"))
        except Exception as exc:
            bad.append(f"{path.relative_to(ROOT)}: {exc}")
    assert not bad, "\n".join(bad)


def test_no_zero_spend_customer_97_leads():
    leads_path = ROOT / "ledgers" / "leads.json"
    leads = json.loads(leads_path.read_text(encoding="utf-8"))
    offenders = [
        email
        for email, lead in leads.items()
        if lead.get("current_stage") == "customer_97" and int(lead.get("total_spent_cents") or 0) <= 0
    ]
    assert offenders == []
