#!/usr/bin/env python3
"""Tracked SQL migration runner for Nebula (DATA-2 / FM-11).

One authority for future schema change across both databases:
    - `platform_api/migrations/*.sql` (canonical queue)
Each file declares its target database via a header comment:

    -- target: audit      (default when omitted)
    -- target: platform
    -- target: both

Applied files are recorded in `<db>.public.schema_migrations(name, applied_at,
checksum)`. Re-runs are no-ops; checksum drift fails loudly (edited history is
a defect, not a convenience).

Commands
--------
  apply [--database audit|platform]        apply pending migrations
  status                                   show per-database ledger state
  baseline [--database ...]                record ALL existing files as applied
                                           (one-time adoption of a DB whose
                                           schema predates this runner)

Fresh host: `apply` creates schema_migrations then runs every file in order.
CI dry-run: `apply --dry-run` prints the plan and validates parsing only.
"""

from __future__ import annotations

import argparse
import hashlib
import sys
from pathlib import Path

import asyncpg

MIGRATIONS_DIR = Path(__file__).resolve().parents[1] / "migrations"

DSNS = {
    "audit": None,     # resolved lazily via config (env contract)
    "platform": None,
}

# Historical pre-runner migrations adopted via `baseline`.
BASELINE_NOTE = "baselined (pre-runner schema adopted)"


def _dsn(target: str) -> str:
    if target == "audit":
        from platform_api.config import audit_db_dsn
        return audit_db_dsn()
    from platform_api.config import platform_db_dsn
    return platform_db_dsn()


def parse_target(text: str) -> str:
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("--") and "target:" in stripped:
            value = stripped.split("target:", 1)[1].strip().split()[0].lower()
            if value in ("audit", "platform", "both"):
                return value
            raise ValueError(f"invalid --target directive: {value!r}")
    return "audit"  # historical default


def discover() -> list[tuple[str, str, str]]:
    """Return sorted [(name, target, checksum)] for *.sql in the queue."""
    out = []
    for path in sorted(MIGRATIONS_DIR.glob("*.sql")):
        text = path.read_text()
        digest = hashlib.sha256(text.encode()).hexdigest()
        out.append((path.name, parse_target(text), digest))
    return out


async def _ensure_ledger(conn: asyncpg.Connection) -> None:
    await conn.execute(
        """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            name       TEXT PRIMARY KEY,
            checksum   TEXT NOT NULL,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            note       TEXT
        )
        """
    )


async def _applied(conn: asyncpg.Connection) -> dict[str, str]:
    rows = await conn.fetch("SELECT name, checksum FROM schema_migrations")
    return {r["name"]: r["checksum"] for r in rows}


async def cmd_status(_: argparse.Namespace) -> int:
    migrations = discover()
    for target in ("audit", "platform"):
        relevant = [m for m in migrations if m[1] in (target, "both")]
        conn = await asyncpg.connect(_dsn(target))
        try:
            await _ensure_ledger(conn)
            applied = await _applied(conn)
        finally:
            await conn.close()
        pending = [m for m in relevant if m[0] not in applied]
        drifted = [m for m in relevant
                   if m[0] in applied and applied[m[0]] != m[2]]
        print(f"[{target}] total={len(relevant)} applied={len(relevant)-len(pending)} "
              f"pending={len(pending)} checksum_drift={len(drifted)}")
        for name, _, _ in pending:
            print(f"  PENDING {name}")
        for name, _, _ in drifted:
            print(f"  DRIFTED {name}")
    return 0


async def cmd_baseline(args: argparse.Namespace) -> int:
    migrations = discover()
    targets = [args.database] if args.database else ["audit", "platform"]
    for target in targets:
        relevant = [m for m in migrations if m[1] in (target, "both")]
        conn = await asyncpg.connect(_dsn(target))
        try:
            await _ensure_ledger(conn)
            applied = await _applied(conn)
            for name, _, digest in relevant:
                if name not in applied:
                    await conn.execute(
                        "INSERT INTO schema_migrations(name, checksum, note) "
                        "VALUES ($1,$2,$3) ON CONFLICT (name) DO NOTHING",
                        name, digest, BASELINE_NOTE,
                    )
            print(f"[{target}] baselined {len(relevant)} migration(s)")
        finally:
            await conn.close()
    return 0


async def cmd_apply(args: argparse.Namespace) -> int:
    migrations = discover()
    targets = [args.database] if args.database else ["audit", "platform"]
    plan_error = 0
    for target in targets:
        conn = await asyncpg.connect(_dsn(target))
        try:
            await _ensure_ledger(conn)
            applied = await _applied(conn)
            for name, file_target, digest in migrations:
                if file_target not in (target, "both"):
                    continue
                if name in applied:
                    if applied[name] != digest:
                        print(f"[{target}] ERROR checksum drift: {name} "
                              f"(history was edited)", file=sys.stderr)
                        plan_error = 1
                    continue
                if args.dry_run:
                    print(f"[{target}] would apply {name}")
                    continue
                sql = (MIGRATIONS_DIR / name).read_text()
                # The runner owns transaction boundaries; legacy files that
                # carried their own BEGIN/COMMIT are normalized here.
                lines = [l for l in sql.splitlines()
                         if l.strip().upper() not in ("BEGIN;", "COMMIT;", "BEGIN", "COMMIT")]
                sql = "\n".join(lines)
                async with conn.transaction():
                    await conn.execute(sql)
                    await conn.execute(
                        "INSERT INTO schema_migrations(name, checksum) VALUES ($1,$2)",
                        name, digest,
                    )
                print(f"[{target}] applied {name}")
        finally:
            await conn.close()
    return plan_error


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_apply = sub.add_parser("apply")
    p_apply.add_argument("--database", choices=["audit", "platform"])
    p_apply.add_argument("--dry-run", action="store_true")

    p_base = sub.add_parser("baseline")
    p_base.add_argument("--database", choices=["audit", "platform"])

    sub.add_parser("status")

    args = parser.parse_args(argv)
    handlers = {"apply": cmd_apply, "baseline": cmd_baseline, "status": cmd_status}
    import asyncio
    return asyncio.run(handlers[args.cmd](args))


if __name__ == "__main__":
    sys.exit(main())
