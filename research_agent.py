#!/usr/bin/env python3
"""Evidence-gated research-to-action loop for Nebula Components.

The agent does not scrape or send by itself. Research enters through a structured
JSONL inbox, then this module validates, ranks, deduplicates, and applies only
bounded local actions. External text is data, never instructions.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from ops_company_os import build_company_brain, read_jsonl, write_json, append_jsonl

BASE = Path("/home/mike/nebula")
RESEARCH_DIR = BASE / "ops" / "research"
QUEUE = RESEARCH_DIR / "inbox.jsonl"
DECISIONS = RESEARCH_DIR / "decisions.jsonl"
RECEIPTS = RESEARCH_DIR / "receipts.jsonl"
BUYER_LANGUAGE = RESEARCH_DIR / "buyer_language_candidates.jsonl"
EXPERIMENT_DIR = BASE / "growth_system" / "research_experiments"

REQUIRED = {
    "id", "source_url", "source_type", "title", "observed_problem",
    "evidence_excerpt", "claim", "why_nebula", "smallest_safe_change",
    "expected_metric", "validation_window", "stop_condition",
}
SALES_PROOF_REQUIRED = {"sales_evidence", "sales_source", "sales_attribution"}
PURCHASE_METRIC_TERMS = {"purchase", "purchases", "sale", "sales", "revenue", "paid customer", "payment"}
ALLOWED_ACTIONS = {"record_buyer_language", "create_experiment_brief"}
BLOCKED_ACTION_WORDS = {
    "send", "email", "dm", "publish", "post", "spend", "buy", "price",
    "stripe", "credential", "password", "secret", "delete", "deploy",
    "production", "linkedin automation", "scrape linkedin",
}
SOURCE_QUALITY = {
    "customer_outcome": 40,
    "funnel_data": 38,
    "prospect_evidence": 34,
    "connector_response": 30,
    "domain_research": 22,
    "video": 12,
    "generic_content": 4,
}


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def norm(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip()).lower()


def item_id(item: dict[str, Any]) -> str:
    basis = "|".join(norm(item.get(k)) for k in ("source_url", "claim", "evidence_excerpt"))
    return hashlib.sha256(basis.encode()).hexdigest()[:16]


def required_fields(item: dict[str, Any]) -> list[str]:
    return sorted(REQUIRED - set(item))


def blocked_action_reason(item: dict[str, Any]) -> str | None:
    text = norm(item.get("smallest_safe_change"))
    for word in BLOCKED_ACTION_WORDS:
        pattern = rf"(?<![a-z0-9]){re.escape(word)}(?![a-z0-9])"
        if re.search(pattern, text):
            return f"action contains blocked side effect term: {word}"
    return None


def critic(item: dict[str, Any], brain: dict[str, Any], seen: set[str]) -> dict[str, Any]:
    missing = required_fields(item)
    url = str(item.get("source_url") or "")
    source_type = norm(item.get("source_type"))
    fingerprint = item_id(item)
    problems: list[str] = []
    if missing:
        problems.append("missing required fields: " + ", ".join(missing))
    if not re.match(r"^https?://", url) and not (source_type == "funnel_data" and url.startswith("file://")):
        problems.append("source_url must be an http(s) URL, or file:// for internal funnel_data")
    if source_type not in SOURCE_QUALITY:
        problems.append("source_type is not in the evidence taxonomy")
    if fingerprint in seen:
        problems.append("duplicate evidence fingerprint")
    blocked = blocked_action_reason(item)
    if blocked:
        problems.append(blocked)
    if len(norm(item.get("evidence_excerpt"))) < 30:
        problems.append("evidence_excerpt is too short to audit")
    if len(norm(item.get("claim"))) < 20:
        problems.append("claim is too generic")
    expected_metric = norm(item.get("expected_metric"))
    if not any(term in expected_metric for term in PURCHASE_METRIC_TERMS):
        problems.append("expected_metric must include attributable purchases or revenue")
    bottleneck = norm(brain.get("current_bottleneck"))
    relevance_text = norm(" ".join(str(item.get(k, "")) for k in ("observed_problem", "why_nebula", "expected_metric")))
    relevant = any(token in relevance_text for token in {
        "conversion", "audit", "checkout", "payment", "revenue", "reply",
        "paid traffic", "ad spend", "landing page", "trigger", "buyer",
        "outreach", "funnel", "deliverability", "connector",
    })
    if not relevant:
        problems.append("does not map to the current revenue funnel")
    if bottleneck == "audit_to_payment_conversion" and not any(
        token in relevance_text for token in ("payment", "checkout", "audit", "conversion", "offer")
    ):
        problems.append("does not address the live bottleneck")
    action = norm(item.get("action_type"))
    if action and action not in ALLOWED_ACTIONS:
        problems.append(f"action_type not allowed: {action}")
    if action == "clone_sales_pattern":
        missing_sales = sorted(field for field in SALES_PROOF_REQUIRED if not item.get(field))
        if source_type != "customer_outcome":
            problems.append("clone_sales_pattern requires customer_outcome evidence")
        if missing_sales:
            problems.append("clone_sales_pattern missing attributable sales proof: " + ", ".join(missing_sales))
    score = SOURCE_QUALITY.get(source_type, 0)
    if relevant:
        score += 20
    if not missing and not blocked:
        score += 15
    if norm(item.get("confidence")) in {"high", "verified"}:
        score += 10
    score = max(0, min(100, score))
    return {
        "accepted": not problems,
        "score": score,
        "reasons": problems,
        "fingerprint": fingerprint,
        "bottleneck": bottleneck,
    }


def action_for(item: dict[str, Any], review: dict[str, Any]) -> str:
    if not review["accepted"]:
        return "reject"
    action = norm(item.get("action_type"))
    # Low-confidence sources may still produce a bounded experiment brief.
    # The brief is a test proposal, never evidence that the tactic works.
    if action == "create_experiment_brief" and any(
        term in norm(item.get("expected_metric")) for term in PURCHASE_METRIC_TERMS
    ):
        return action
    if review["score"] < 70:
        return "defer"
    return action or "defer"


def apply_action(item: dict[str, Any], decision: dict[str, Any], base: Path) -> dict[str, Any]:
    action = decision["action"]
    if action == "record_buyer_language":
        row = {
            "recorded_at": decision["decided_at"],
            "research_id": item["id"],
            "phrase": item.get("buyer_language", ""),
            "source_url": item["source_url"],
            "evidence_excerpt": item["evidence_excerpt"],
            "status": "candidate_pending_review",
        }
        append_jsonl(base / "ops" / "research" / "buyer_language_candidates.jsonl", row)
        return {"status": "applied", "artifact": "ops/research/buyer_language_candidates.jsonl"}
    if action == "create_experiment_brief":
        slug = re.sub(r"[^a-z0-9]+", "-", norm(item["id"])).strip("-")[:60]
        path = base / "growth_system" / "research_experiments" / f"{slug}.json"
        payload = {
            "research_id": item["id"],
            "status": "proposed",
            "source_url": item["source_url"],
            "hypothesis": item["claim"],
            "observed_problem": item["observed_problem"],
            "why_nebula": item["why_nebula"],
            "smallest_safe_change": item["smallest_safe_change"],
            "expected_metric": item["expected_metric"],
            "validation_window": item["validation_window"],
            "stop_condition": item["stop_condition"],
            "approval_required_for": ["external_send", "publication", "spend", "production_code"],
        }
        write_json(path, payload)
        return {"status": "applied", "artifact": str(path.relative_to(base))}
    return {"status": "not_applied", "reason": "no approved bounded action"}


def run(base: Path = BASE, apply: bool = False) -> dict[str, Any]:
    brain = build_company_brain(base)
    queue = base / "ops" / "research" / "inbox.jsonl"
    items = read_jsonl(queue)
    prior = read_jsonl(base / "ops" / "research" / "decisions.jsonl")
    seen = {str(row.get("fingerprint")) for row in prior if row.get("fingerprint")}
    decisions: list[dict[str, Any]] = []
    for raw in items:
        item = dict(raw)
        item.setdefault("id", item_id(item))
        review = critic(item, brain, seen)
        action = action_for(item, review)
        decided = {
            "decided_at": now_iso(),
            "research_id": item["id"],
            "source_url": item.get("source_url"),
            "title": item.get("title"),
            "fingerprint": review["fingerprint"],
            "critic": review,
            "decision": action,
            "action": action,
        }
        if apply and action in ALLOWED_ACTIONS:
            decided["execution"] = apply_action(item, decided, base)
        decisions.append(decided)
        seen.add(review["fingerprint"])
        append_jsonl(base / "ops" / "research" / "decisions.jsonl", decided)
    receipt = {
        "run_at": now_iso(),
        "bottleneck": brain.get("current_bottleneck"),
        "source_count": len(items),
        "accepted": sum(1 for d in decisions if d["critic"]["accepted"]),
        "implemented": sum(1 for d in decisions if d.get("execution", {}).get("status") == "applied"),
        "decisions": {a: sum(1 for d in decisions if d["decision"] == a) for a in ("reject", "defer", *ALLOWED_ACTIONS)},
        "side_effects_allowed": sorted(ALLOWED_ACTIONS) if apply else [],
    }
    append_jsonl(base / "ops" / "research" / "receipts.jsonl", receipt)
    return {"brain": brain, "receipt": receipt, "decisions": decisions}


def main() -> int:
    parser = argparse.ArgumentParser(description="Run Nebula evidence-gated research agent")
    parser.add_argument("--base", default=str(BASE))
    parser.add_argument("--apply", action="store_true", help="apply only whitelisted local actions")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    result = run(Path(args.base), apply=args.apply)
    if args.json:
        print(json.dumps(result, indent=2, sort_keys=True))
    else:
        print(json.dumps(result["receipt"], indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
