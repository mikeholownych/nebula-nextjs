#!/usr/bin/env python3
"""
Competitor Backlink Gap Monitor for Nebula Components
Finds high-quality domains that link to competitors but not to nebulacomponents.com
"""

import json
import os
import sys
import base64
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────
NEBULA_DOMAIN = "nebulacomponents.com"
COMPETITORS = ["cxl.com", "unbounce.com", "hotjar.com", "crazyegg.com"]
RANK_THRESHOLD = 150          # only domains with rank > 150 (quality filter)
TOP_N = 5                     # max new gaps to surface per run
OPPORTUNITY_SCORE = 8

LEDGER_PATH = Path("/home/mike/nebula/seo/ledger/backlink_gaps_seen.json")
OPPS_PATH   = Path("/home/mike/nebula/seo/link_opportunities.jsonl")
ENV_PATH    = Path("/home/mike/.hermes/.env")

# ── Credentials ───────────────────────────────────────────────────────────────
def load_credentials():
    """Load DataForSEO creds from ~/.hermes/.env or environment."""
    creds = {}
    for env_file in [ENV_PATH, Path("/home/mike/nebula/.env")]:
        if env_file.exists():
            with open(env_file) as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    key, _, val = line.partition("=")
                    creds[key.strip()] = val.strip()
    # prefer env vars if set
    for k in ("DATAFORSEO_LOGIN", "DATAFORSEO_USERNAME", "DATAFORSEO_PASSWORD", "DATAFORSEO_KEY"):
        if k in os.environ:
            creds[k] = os.environ[k]

    login = creds.get("DATAFORSEO_LOGIN") or creds.get("DATAFORSEO_USERNAME")
    password = creds.get("DATAFORSEO_PASSWORD") or creds.get("DATAFORSEO_KEY")

    if not login or not password:
        raise RuntimeError("DataForSEO credentials not found. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD.")

    token = base64.b64encode(f"{login}:{password}".encode()).decode()
    return f"Basic {token}"


# ── DataForSEO API call ───────────────────────────────────────────────────────
def get_referring_domains(domain: str, auth_header: str) -> dict[str, int]:
    """
    Returns {referring_domain: rank} for domains linking to `domain`.
    Fetches up to 1000 results (paging if needed, but one call covers most cases).
    """
    url = "https://api.dataforseo.com/v3/backlinks/referring_domains/live"
    payload = json.dumps([{
        "target": domain,
        "limit": 1000,
        "offset": 0,
        "filters": [["rank", ">", RANK_THRESHOLD]],
        "order_by": ["rank,desc"],
        "include_subdomains": False,
    }]).encode()

    req = urllib.request.Request(
        url,
        data=payload,
        method="POST",
        headers={
            "Authorization": auth_header,
            "Content-Type": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"DataForSEO HTTP {e.code} for {domain}: {e.read().decode()[:300]}")

    domains: dict[str, int] = {}
    for task in data.get("tasks", []):
        for result in task.get("result", []) or []:
            for item in result.get("items", []) or []:
                rd = item.get("domain", "")
                rank = item.get("rank", 0)
                if rd and rank > RANK_THRESHOLD:
                    domains[rd] = rank
    return domains


# ── Ledger helpers ────────────────────────────────────────────────────────────
def load_seen_ledger() -> set[str]:
    LEDGER_PATH.parent.mkdir(parents=True, exist_ok=True)
    if LEDGER_PATH.exists():
        try:
            data = json.loads(LEDGER_PATH.read_text())
            return set(data.get("seen", []))
        except (json.JSONDecodeError, KeyError):
            return set()
    return set()


def save_seen_ledger(seen: set[str]) -> None:
    LEDGER_PATH.parent.mkdir(parents=True, exist_ok=True)
    LEDGER_PATH.write_text(json.dumps({"seen": sorted(seen)}, indent=2))


# ── Opportunity appender ──────────────────────────────────────────────────────
def append_opportunity(domain: str, rank: int, competitors_linking: list[str]) -> None:
    OPPS_PATH.parent.mkdir(parents=True, exist_ok=True)
    record = {
        "type": "competitor_gap",
        "domain": domain,
        "rank": rank,
        "competitors_linking": competitors_linking,
        "score": OPPORTUNITY_SCORE,
        "discovered_at": datetime.now(timezone.utc).isoformat(),
    }
    with open(OPPS_PATH, "a") as f:
        f.write(json.dumps(record) + "\n")


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    auth = load_credentials()

    # Fetch Nebula's referring domains first
    nebula_domains = get_referring_domains(NEBULA_DOMAIN, auth)

    # Fetch each competitor's referring domains
    competitor_map: dict[str, dict[str, int]] = {}
    for comp in COMPETITORS:
        competitor_map[comp] = get_referring_domains(comp, auth)

    # Find gap domains: linked to ≥1 competitor, NOT linked to Nebula
    gap_candidates: dict[str, dict] = {}   # domain -> {rank, competitors}
    for comp, domains in competitor_map.items():
        for domain, rank in domains.items():
            if domain in nebula_domains:
                continue
            if domain not in gap_candidates:
                gap_candidates[domain] = {"rank": rank, "competitors": []}
            else:
                # keep the highest rank seen across competitors
                gap_candidates[domain]["rank"] = max(gap_candidates[domain]["rank"], rank)
            gap_candidates[domain]["competitors"].append(comp)

    # Load and deduplicate against seen ledger
    seen = load_seen_ledger()
    new_gaps = {d: v for d, v in gap_candidates.items() if d not in seen}

    if not new_gaps:
        # Silent exit — no new gaps
        return

    # Sort by rank descending, take top N
    top_gaps = sorted(new_gaps.items(), key=lambda x: x[1]["rank"], reverse=True)[:TOP_N]

    # Record and output
    for domain, info in top_gaps:
        rank = info["rank"]
        comps = info["competitors"]
        append_opportunity(domain, rank, comps)
        seen.add(domain)
        comp_list = ", ".join(comps)
        print(f"[backlink-gap] {domain}  rank={rank}  links-to={comp_list}")

    save_seen_ledger(seen)


if __name__ == "__main__":
    main()
