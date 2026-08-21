from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from platform_api.services.audit_db import AuditDB


@pytest.mark.asyncio
async def test_get_or_create_customer_uses_on_conflict_returning():
    db = AuditDB()
    db.pool = MagicMock()
    conn = AsyncMock()
    customer_id = uuid4()
    conn.fetchrow.return_value = {"id": customer_id}
    db.pool.acquire.return_value.__aenter__.return_value = conn

    result = await db.get_or_create_customer("ada@example.com", "Ada")

    assert result == customer_id
    sql = conn.fetchrow.call_args.args[0].upper()
    assert "INSERT INTO CUSTOMERS" in sql
    assert "ON CONFLICT" in sql
    assert "EMAIL" in sql
    assert "RETURNING" in sql
    assert conn.fetchrow.await_count == 1
