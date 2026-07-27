from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from platform_api.services.audit_db import AuditDB


MIGRATION = Path(__file__).resolve().parents[2] / "platform_api" / "migrations" / "20260726_audit_cohort_aggregates.sql"


@pytest.mark.asyncio
async def test_cohort_record_is_aggregate_only_and_contains_no_page_identifier():
    db = AuditDB()
    conn = AsyncMock()
    findings = [{"key": "cta"}, {"key": "seo_foundations"}]

    await db.record_cohort_aggregate(conn, 7.5, "B", findings)

    call = conn.execute.call_args
    statement = call.args[0].lower()
    assert "insert into audit_cohort" in statement
    assert "on conflict" in statement
    assert "url" not in statement
    assert "domain" not in statement
    assert call.args[1:] == (
        75,
        "B",
        2,
        1,
        0,
        1,
        1,
        1,
        1,
        0,
        1,
        1,
    )


@pytest.mark.asyncio
async def test_cohort_write_failure_never_reverses_completed_audit():
    db = AuditDB()
    db.pool = MagicMock()
    conn = AsyncMock()
    conn.execute.return_value = "UPDATE 1"
    db.pool.acquire.return_value.__aenter__.return_value = conn
    db.connect = AsyncMock()

    with (
        patch.object(AuditDB, "check_and_award_badge", new=AsyncMock(return_value=None)),
        patch.object(AuditDB, "record_cohort_aggregate", new=AsyncMock(side_effect=Exception("boom"))),
    ):
        result = await db.update_audit(uuid4(), 7.5, "B", [], status="completed")

    assert result is True


def test_cohort_migration_is_a_full_aggregate_only_cutover():
    source = MIGRATION.read_text().lower()

    assert "create table audit_cohort_aggregate_new" in source
    assert "insert into audit_cohort_aggregate_new" in source
    assert "drop table audit_cohort" in source
    assert "alter table audit_cohort_aggregate_new rename to audit_cohort" in source
    assert "url" not in source
    assert "domain" not in source
    assert "sample_count" in source
    assert "unique" in source
