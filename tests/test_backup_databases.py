"""nebula_audit - the database holding every real customer, audit, and
badge record - was missing from backup_databases.py entirely until this
fix; only nebula_platform was ever backed up. Locks in that both
databases now get backed up independently, and that a failure on one
doesn't silently mask or block the other."""
import gzip
from unittest.mock import MagicMock, patch

import scripts.backup_databases as backup_databases


def test_both_databases_are_configured_for_backup():
    assert backup_databases.POSTGRES_DBS == ["nebula_platform", "nebula_audit"]


def test_backup_postgres_writes_a_per_database_dump_file(tmp_path):
    fake_result = MagicMock(returncode=0, stdout=b"-- fake pg_dump output", stderr=b"")
    with patch("scripts.backup_databases.subprocess.run", return_value=fake_result) as run:
        ok = backup_databases.backup_postgres("nebula_audit", tmp_path)

    assert ok is True
    dest = tmp_path / "nebula_audit.sql.gz"
    assert dest.exists()
    assert gzip.decompress(dest.read_bytes()) == b"-- fake pg_dump output"
    assert run.call_args.args[0] == ["pg_dump", "--no-owner", "--no-privileges", "nebula_audit"]


def test_one_database_failing_does_not_block_the_other(tmp_path):
    def fake_run(cmd, **kwargs):
        db_name = cmd[-1]
        if db_name == "nebula_audit":
            return MagicMock(returncode=1, stdout=b"", stderr=b"connection refused")
        return MagicMock(returncode=0, stdout=b"-- ok", stderr=b"")

    with patch("scripts.backup_databases.subprocess.run", side_effect=fake_run):
        results = [
            backup_databases.backup_postgres(db, tmp_path)
            for db in backup_databases.POSTGRES_DBS
        ]

    assert results == [True, False]
    assert (tmp_path / "nebula_platform.sql.gz").exists()
    assert not (tmp_path / "nebula_audit.sql.gz").exists()


def test_manifest_lists_both_postgres_databases(tmp_path, monkeypatch):
    monkeypatch.setattr(backup_databases, "BASE", tmp_path)
    monkeypatch.setattr(backup_databases, "BACKUP_ROOT", tmp_path / "backups")
    monkeypatch.setattr(backup_databases, "SQLITE_DBS", [])
    monkeypatch.setattr(backup_databases, "JSON_STATE", [])
    (tmp_path / "backups").mkdir()

    fake_result = MagicMock(returncode=0, stdout=b"-- ok", stderr=b"")
    with patch("scripts.backup_databases.subprocess.run", return_value=fake_result):
        exit_code = backup_databases.main()

    assert exit_code == 0
    manifests = list((tmp_path / "backups").glob("*/manifest.json"))
    assert len(manifests) == 1
    import json
    manifest = json.loads(manifests[0].read_text())
    assert manifest["postgres_dbs"] == ["nebula_platform", "nebula_audit"]
    assert manifest["all_ok"] is True
