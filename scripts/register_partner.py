#!/usr/bin/env python3
"""Register a widget partner (Play 4: agencies as distribution layer).

Inserts a row into nebula_audit.partners with the CORS allowlist used by
the embeddable widget route. Run manually when an agency signs up; the
Stripe-webhook auto-registration path is future work (spec: 2026-08-04).

Usage:
  venv/bin/python3 scripts/register_partner.py \
      --id agency_demo \
      --name "Demo Agency" \
      --domain agency.example.com [--domain www.agency.example.com] \
      [--email agency@example.com] [--plan agency]

Domains are normalized: scheme + path stripped, lowercase.
"""
from __future__ import annotations

import argparse
import asyncio
import os
import re
import sys
from urllib.parse import urlparse

DEFAULT_DB = "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433"
PARTNER_ID_RE = re.compile(r"^[a-zA-Z0-9_-]{3,64}$")


def normalize_domain(raw: str) -> str:
    """Strip scheme/path/port, lowercase; keep hostname only."""
    raw = raw.strip().lower()
    if "://" in raw:
        raw = urlparse(raw).netloc
    # strip port if present
    if ":" in raw and not raw.endswith(":"):
        raw = raw.split(":", 1)[0]
    return raw.rstrip("/")


async def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--id", required=True, help="partner_id, e.g. agency_demo")
    p.add_argument("--name", required=True)
    p.add_argument("--domain", action="append", required=True, help="CORS allowlist domain (repeatable)")
    p.add_argument("--email", default=None)
    p.add_argument("--plan", default="agency", choices=["agency", "agency_pro", "test"])
    args = p.parse_args()

    if not PARTNER_ID_RE.match(args.id):
        print(f"ERROR: partner id must match {PARTNER_ID_RE.pattern}", file=sys.stderr)
        return 1

    domains = sorted({normalize_domain(d) for d in args.domain})
    if not domains:
        print("ERROR: at least one domain required", file=sys.stderr)
        return 1

    db_url = os.getenv("AUDIT_DATABASE_URL", DEFAULT_DB)
    import asyncpg

    conn = await asyncpg.connect(db_url, timeout=10)
    try:
        # Duplicate guard
        existing = await conn.fetchval("SELECT id FROM partners WHERE id = $1", args.id)
        if existing:
            print(f"ERROR: partner '{args.id}' already exists (id is primary key).", file=sys.stderr)
            return 1
        await conn.execute(
            """
            INSERT INTO partners (id, name, email, plan, status, domains)
            VALUES ($1, $2, $3, $4, 'active', $5::jsonb)
            """,
            args.id, args.name, args.email, args.plan,
            __import__("json").dumps(domains),
        )
    finally:
        await conn.close()

    print(f"Registered partner: {args.id} ({args.name})")
    print("  plan:", args.plan)
    print("  domains:", ", ".join(domains))
    print()
    print("Embed code for the agency:")
    print(f'  <div id="nebula-audit-widget" data-partner="{args.id}" data-theme="dark"></div>')
    print('  <script src="https://nebulacomponents.com/widget/audit.js" async></script>')
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
