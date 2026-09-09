#!/usr/bin/env python3
"""Instantly.ai API v2 client (thin, no deps).

Auth: Bearer token read from INSTANTLY_API_KEY in /home/mike/nebula/.env.
The key is used VERBATIM (it is base64 of uuid:secret; Instantly accepts the
base64 string as-is as the Bearer token).

Endpoints used (all read-only unless noted):
  GET  /api/v2/accounts
  GET  /api/v2/campaigns
  GET  /api/v2/campaigns/{id}
  GET  /api/v2/campaigns/analytics/overview
  POST /api/v2/leads/list
  GET  /api/v2/emails
"""
import json
import os
import urllib.parse
import urllib.request

BASE = "https://api.instantly.ai/api/v2"
ENV_PATH = "/home/mike/nebula/.env"


def _load_key() -> str:
    key = os.environ.get("INSTANTLY_API_KEY")
    if key:
        return key
    if os.path.exists(ENV_PATH):
        with open(ENV_PATH) as f:
            for line in f:
                line = line.strip()
                if line.startswith("INSTANTLY_API_KEY="):
                    return line.split("=", 1)[1].strip()
    raise RuntimeError("INSTANTLY_API_KEY not set in .env or environment")


def _request(method: str, path: str, body: dict | None = None) -> dict:
    key = _load_key()
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        url, data=data, method=method,
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "User-Agent": "NebulaComponents/1.0 (+https://nebulacomponents.com)",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def list_accounts(limit: int = 100) -> list[dict]:
    return _request("GET", f"/accounts?limit={limit}").get("items", [])


def list_campaigns() -> list[dict]:
    # include_ai_sales_agent_campaigns=true: the Nebula campaign is an AI SDR
    # campaign, which the list endpoint hides by default.
    return _request("GET", "/campaigns?include_ai_sales_agent_campaigns=true").get("items", [])


def get_campaign(campaign_id: str) -> dict:
    return _request("GET", f"/campaigns/{campaign_id}")


def analytics_overview() -> dict:
    return _request("GET", "/campaigns/analytics/overview")


def list_leads(limit: int = 100, starting_after: str | None = None) -> dict:
    body: dict = {"limit": limit}
    if starting_after:
        body["starting_after"] = starting_after
    return _request("POST", "/leads/list", body)


def list_emails(limit: int = 100) -> list[dict]:
    return _request("GET", f"/emails?limit={limit}").get("items", [])


if __name__ == "__main__":
    # Smoke test: print a compact summary.
    ov = analytics_overview()
    accts = list_accounts()
    camps = list_campaigns()
    print(json.dumps({
        "accounts": len(accts),
        "campaigns": len(camps),
        "overview": ov,
    }, indent=2))
