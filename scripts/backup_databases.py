#!/usr/bin/env python3
"""Daily backup of the databases and JSON/JSONL state that hold all lead,
audit, and purchase history for the business. None of this is backed up
anywhere else — if this machine's disk fails, this is the only copy.

Backs up: lead_state.db, nebula.db, outbound_delivery.db (SQLite, via the
online backup API so a concurrent writer can't produce a torn snapshot),
the nebula_platform AND nebula_audit Postgres databases (pg_dump each —
nebula_audit holds every real customer, audit, and badge record; it was
missing from this script entirely until 2026-07-25, meaning it had zero
backup coverage), and HOT_LEAD.json plus ledgers/ (the append-only
business ledgers).

Writes timestamped snapshots under backups/, prunes anything older than
RETENTION_DAYS. Local-disk only — this protects against corruption,
accidental deletion, and bad writes, NOT against the machine or disk
itself failing. Copying backups/ to another host or object storage is a
separate step this script does not do.
"""
import fcntl
import gzip
import json
import os
import shutil
import sqlite3
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

BASE = Path("/home/mike/nebula")
BACKUP_ROOT = BASE / "backups"
LOCK_FILE = BASE / "backup_databases.lock"
RETENTION_DAYS = 14

SQLITE_DBS = ["lead_state.db", "nebula.db", "outbound_delivery.db"]
JSON_STATE = ["HOT_LEAD.json"]
LEDGERS_DIR = "ledgers"

PG_ENV = {
    "PGHOST": os.environ.get("PGHOST", "/var/run/postgresql"),
    "PGPORT": os.environ.get("PGPORT", "5433"),
    "PGUSER": os.environ.get("PGUSER", "postgres"),
}
POSTGRES_DBS = ["nebula_platform", "nebula_audit"]


def log(msg):
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    print(f"[{ts}] {msg}", flush=True)


def backup_sqlite(name: str, dest_dir: Path) -> bool:
    src_path = BASE / name
    if not src_path.exists():
        log(f"SKIP {name}: source does not exist")
        return True
    dest_path = dest_dir / name
    try:
        src = sqlite3.connect(str(src_path))
        dest = sqlite3.connect(str(dest_path))
        with dest:
            src.backup(dest)
        src.close()
        dest.close()
        log(f"OK sqlite {name} -> {dest_path} ({dest_path.stat().st_size} bytes)")
        return True
    except Exception as e:
        log(f"FAIL sqlite {name}: {e}")
        return False


def backup_postgres(db_name: str, dest_dir: Path) -> bool:
    dest_path = dest_dir / f"{db_name}.sql.gz"
    env = {**os.environ, **PG_ENV}
    try:
        result = subprocess.run(
            ["pg_dump", "--no-owner", "--no-privileges", db_name],
            env=env,
            capture_output=True,
            timeout=300,
        )
        if result.returncode != 0:
            log(f"FAIL postgres {db_name} pg_dump: {result.stderr.decode(errors='replace')[:500]}")
            return False
        with gzip.open(dest_path, "wb") as f:
            f.write(result.stdout)
        log(f"OK postgres {db_name} -> {dest_path} ({dest_path.stat().st_size} bytes)")
        return True
    except FileNotFoundError:
        log("FAIL postgres: pg_dump not found on PATH")
        return False
    except Exception as e:
        log(f"FAIL postgres {db_name}: {e}")
        return False


def backup_json_state(dest_dir: Path) -> bool:
    ok = True
    for name in JSON_STATE:
        src_path = BASE / name
        if not src_path.exists():
            log(f"SKIP {name}: source does not exist")
            continue
        try:
            shutil.copy2(src_path, dest_dir / name)
            log(f"OK json {name} -> {dest_dir / name}")
        except Exception as e:
            log(f"FAIL json {name}: {e}")
            ok = False

    ledgers_src = BASE / LEDGERS_DIR
    if ledgers_src.is_dir():
        try:
            # Raw *.log files are unbounded cron stdout, not curated ledgers —
            # excluded so this doesn't copy tens of MB of log growth daily.
            shutil.copytree(
                ledgers_src, dest_dir / LEDGERS_DIR,
                ignore=shutil.ignore_patterns("*.log"),
            )
            log(f"OK ledgers/ (excl. *.log) -> {dest_dir / LEDGERS_DIR}")
        except Exception as e:
            log(f"FAIL ledgers/: {e}")
            ok = False
    return ok


def prune_old_backups():
    if not BACKUP_ROOT.is_dir():
        return
    cutoff = time.time() - RETENTION_DAYS * 86400
    for child in BACKUP_ROOT.iterdir():
        if child.is_dir() and child.stat().st_mtime < cutoff:
            shutil.rmtree(child, ignore_errors=True)
            log(f"pruned old backup: {child.name}")


def main() -> int:
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")
    dest_dir = BACKUP_ROOT / stamp
    dest_dir.mkdir(parents=True, exist_ok=True)

    results = []
    for name in SQLITE_DBS:
        results.append(backup_sqlite(name, dest_dir))
    for db_name in POSTGRES_DBS:
        results.append(backup_postgres(db_name, dest_dir))
    results.append(backup_json_state(dest_dir))

    manifest = {
        "timestamp": stamp,
        "all_ok": all(results),
        "sqlite_dbs": SQLITE_DBS,
        "postgres_dbs": POSTGRES_DBS,
    }
    (dest_dir / "manifest.json").write_text(json.dumps(manifest, indent=2))

    prune_old_backups()

    if not all(results):
        log("BACKUP RUN COMPLETED WITH FAILURES — see FAIL lines above")
        return 1
    log(f"backup run complete: {dest_dir}")
    return 0


if __name__ == "__main__":
    BACKUP_ROOT.mkdir(parents=True, exist_ok=True)
    lock_fd = open(LOCK_FILE, "w")
    try:
        fcntl.flock(lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        log("another backup run is already in progress — exiting")
        sys.exit(0)
    try:
        sys.exit(main())
    finally:
        fcntl.flock(lock_fd, fcntl.LOCK_UN)
        lock_fd.close()
