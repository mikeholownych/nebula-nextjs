#!/usr/bin/env python3
"""Skill intake funnel for Nebula Business OS agents.

This is a safety gate for external agent skills discovered from catalogs such as
VoltAgent/awesome-agent-skills. It does not install skills. It evaluates a local
checkout/path, writes an auditable JSONL decision, and tells the CEO agent whether
the candidate is safe enough to install/attach, needs review, or must be rejected.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

DEFAULT_LEDGER = Path("/home/mike/nebula/ledgers/skill-intake-ledger.jsonl")
DEFAULT_WORKDIR = Path("/tmp/nebula-skill-intake")

REJECT_RISKS = {
    "missing_documentation",
    "prompt_injection_terms",
    "secret_exfiltration_pattern",
    "destructive_command_pattern",
    "credential_collection_pattern",
}

PROMPT_INJECTION_RE = re.compile(
    r"\b(ignore|override|bypass|forget)\b.{0,80}\b(previous|prior|system|developer|instructions|rules)\b",
    re.IGNORECASE | re.DOTALL,
)
SECRET_EXFIL_RE = re.compile(
    r"\b(curl|wget|nc|netcat|Invoke-WebRequest)\b.{0,160}\b(API[_-]?KEY|TOKEN|SECRET|PASSWORD|SSH|\.env|id_rsa|credentials)\b",
    re.IGNORECASE | re.DOTALL,
)
DESTRUCTIVE_RE = re.compile(
    r"(rm\s+-rf\s+/(?:\s|$)|chmod\s+-R\s+777\s+/(?:\s|$)|mkfs\.|dd\s+if=|:(){:|fork bomb)",
    re.IGNORECASE,
)
CREDENTIAL_COLLECTION_RE = re.compile(
    r"(send|post|upload|exfiltrate).{0,120}(token|api key|password|secret|credential|\.env)",
    re.IGNORECASE | re.DOTALL,
)


@dataclass(frozen=True)
class Candidate:
    name: str
    url: str
    agent: str
    source: str = "external"
    objective: str = ""


@dataclass
class IntakeResult:
    ts: str
    candidate: Candidate
    repo_path: str
    status: str
    ready_to_install: bool
    risks: list[str] = field(default_factory=list)
    evidence: list[str] = field(default_factory=list)
    recommended_action: str = ""
    agent_fit_terms: list[str] = field(default_factory=list)
    matched_agent_terms: list[str] = field(default_factory=list)

    def to_json(self) -> str:
        payload = asdict(self)
        return json.dumps(payload, sort_keys=True)


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def map_agent_to_required_terms() -> dict[str, set[str]]:
    return {
        "ceo": {
            "agent",
            "skill",
            "memory",
            "evaluation",
            "orchestration",
            "business",
            "decision",
            "ledger",
            "revenue",
        },
        "growth": {
            "outreach",
            "lead",
            "email",
            "marketing",
            "reply",
            "scrape",
            "prospect",
            "conversion",
            "sales",
        },
        "market": {
            "research",
            "competitor",
            "market",
            "keyword",
            "serp",
            "trend",
            "customer",
            "icp",
            "opportunity",
        },
        "support": {
            "email",
            "inbox",
            "support",
            "reply",
            "ticket",
            "webhook",
            "audit",
            "customer",
            "classification",
        },
        "ops-finance": {
            "stripe",
            "revenue",
            "ledger",
            "finance",
            "cost",
            "invoice",
            "payment",
            "webhook",
            "reconciliation",
        },
    }


def _read_text_files(repo_path: Path) -> dict[str, str]:
    texts: dict[str, str] = {}
    for path in repo_path.rglob("*"):
        if not path.is_file():
            continue
        if any(part in {".git", "node_modules", "venv", "__pycache__"} for part in path.parts):
            continue
        if path.suffix.lower() not in {".md", ".txt", ".yaml", ".yml", ".json", ".toml", ".sh", ".py", ".js", ".ts"}:
            continue
        try:
            texts[str(path.relative_to(repo_path))] = path.read_text(encoding="utf-8", errors="replace")[:200_000]
        except OSError:
            continue
    return texts


def _has_documentation(texts: dict[str, str]) -> bool:
    lower_names = {name.lower() for name in texts}
    return any(name.endswith("skill.md") for name in lower_names) or "readme.md" in lower_names


def _scan_risks(texts: dict[str, str]) -> tuple[list[str], list[str]]:
    combined = "\n".join(f"--- {name} ---\n{text}" for name, text in texts.items())
    risks: list[str] = []
    evidence: list[str] = []
    checks = [
        ("prompt_injection_terms", PROMPT_INJECTION_RE),
        ("secret_exfiltration_pattern", SECRET_EXFIL_RE),
        ("destructive_command_pattern", DESTRUCTIVE_RE),
        ("credential_collection_pattern", CREDENTIAL_COLLECTION_RE),
    ]
    for risk, pattern in checks:
        match = pattern.search(combined)
        if match:
            risks.append(risk)
            evidence.append(f"{risk}: {match.group(0)[:220].replace(chr(10), ' ')}")
    return risks, evidence


def _agent_fit(candidate: Candidate, texts: dict[str, str]) -> tuple[list[str], list[str]]:
    terms = sorted(map_agent_to_required_terms().get(candidate.agent, set()))
    haystack = " ".join([candidate.name, candidate.url, candidate.objective, *texts.values()]).lower()
    matched = [term for term in terms if term.lower() in haystack]
    return terms, matched


def evaluate_candidate(candidate: Candidate, repo_path: Path | str) -> IntakeResult:
    repo = Path(repo_path)
    texts = _read_text_files(repo)
    risks: list[str] = []
    evidence: list[str] = []

    if not _has_documentation(texts):
        risks.append("missing_documentation")
        evidence.append("No README.md or SKILL.md found in candidate path")

    scan_risks, scan_evidence = _scan_risks(texts)
    risks.extend(scan_risks)
    evidence.extend(scan_evidence)

    agent_terms, matched_terms = _agent_fit(candidate, texts)
    if not matched_terms:
        risks.append("weak_agent_fit")
        evidence.append(f"No required {candidate.agent} fit terms found")

    unique_risks = list(dict.fromkeys(risks))
    if any(risk in REJECT_RISKS for risk in unique_risks):
        status = "rejected"
        ready = False
        action = "do_not_install"
    elif unique_risks:
        status = "needs_review"
        ready = False
        action = "manual_review"
    else:
        status = "approved"
        ready = True
        action = "install_or_attach"

    return IntakeResult(
        ts=utc_now(),
        candidate=candidate,
        repo_path=str(repo),
        status=status,
        ready_to_install=ready,
        risks=unique_risks,
        evidence=evidence,
        recommended_action=action,
        agent_fit_terms=agent_terms,
        matched_agent_terms=matched_terms,
    )


def append_ledger_entry(ledger_path: Path | str, result: IntakeResult) -> None:
    ledger = Path(ledger_path)
    ledger.parent.mkdir(parents=True, exist_ok=True)
    with ledger.open("a", encoding="utf-8") as fh:
        fh.write(result.to_json() + "\n")


def clone_candidate(url: str, dest_root: Path = DEFAULT_WORKDIR) -> Path:
    dest_root.mkdir(parents=True, exist_ok=True)
    safe_name = re.sub(r"[^a-zA-Z0-9_.-]+", "_", url.rstrip("/").split("/")[-1] or "candidate")[:80]
    dest = dest_root / safe_name
    if dest.exists():
        subprocess.run(["rm", "-rf", str(dest)], check=True)
    subprocess.run(["git", "clone", "--depth", "1", url, str(dest)], check=True)
    return dest


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Evaluate an external Agent Skill candidate before installation.")
    parser.add_argument("--name", required=True, help="Candidate name, e.g. hqhq1025/skill-optimizer")
    parser.add_argument("--url", required=True, help="Candidate GitHub/skill URL")
    parser.add_argument("--agent", required=True, choices=sorted(map_agent_to_required_terms()), help="Target Business OS agent")
    parser.add_argument("--objective", default="", help="Business objective this skill should improve")
    parser.add_argument("--source", default="awesome-agent-skills", help="Discovery source")
    parser.add_argument("--path", help="Existing local checkout/path. If omitted and URL is a GitHub repo, clone it.")
    parser.add_argument("--ledger", default=str(DEFAULT_LEDGER), help="JSONL ledger path")
    parser.add_argument("--no-ledger", action="store_true", help="Print result without appending ledger")
    return parser


def main(argv: Iterable[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)
    candidate = Candidate(
        name=args.name,
        url=args.url,
        agent=args.agent,
        source=args.source,
        objective=args.objective,
    )
    if args.path:
        repo_path = Path(args.path)
    elif "github.com" in args.url and "/blob/" not in args.url:
        repo_path = clone_candidate(args.url)
    else:
        print("--path is required for non-repository skill URLs", file=sys.stderr)
        return 2

    result = evaluate_candidate(candidate, repo_path)
    if not args.no_ledger:
        append_ledger_entry(args.ledger, result)
    print(result.to_json())
    return 0 if result.status == "approved" else 1


if __name__ == "__main__":
    raise SystemExit(main())
