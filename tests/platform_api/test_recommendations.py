"""Test recommendation syncing and kanban updates."""
import json
import uuid
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

import pytest

from platform_api.services.audit_db import AuditDB


@pytest.mark.asyncio
async def test_sync_recommendations_batch_upsert():
    """Ensure sync_recommendations performs batch operations and handles various finding formats."""
    db = AuditDB()
    db.pool = MagicMock()
    conn = AsyncMock()

    audit_id = uuid.uuid4()
    conn.fetch.side_effect = [
        # latest_per_url
        [
            {
                "id": audit_id,
                "url": "https://example.com",
                "findings": json.dumps([
                    {"key": "cta_clarity", "label": "CTA Clarity", "impact": 8.0, "effort": 2.0, "quadrant": "quick_win"},
                    {"key": "load_speed", "label": "Load Speed", "impact": "5.5", "effort": "3.0", "quadrant": "quick_win"},
                ]),
                "completed_at": None,
            }
        ],
        # existing recs for email
        [
            {"id": uuid.uuid4(), "url": "https://example.com", "finding_key": "old_key", "status": "to_fix"}
        ],
        # final rows
        [
            {
                "id": uuid.uuid4(),
                "email": "user@example.com",
                "audit_id": audit_id,
                "url": "https://example.com",
                "finding_key": "cta_clarity",
                "label": "CTA Clarity",
                "impact": Decimal("8.0"),
                "effort": Decimal("2.0"),
                "quadrant": "quick_win",
                "status": "to_fix",
                "verified_at": None,
                "created_at": None,
                "updated_at": None,
            }
        ],
    ]
    db.pool.acquire.return_value.__aenter__.return_value = conn
    db.connect = AsyncMock()

    recs = await db.sync_recommendations("user@example.com")

    assert len(recs) == 1
    assert recs[0]["finding_key"] == "cta_clarity"
    assert recs[0]["impact"] == 8.0
    assert recs[0]["effort"] == 2.0
    conn.executemany.assert_called_once()
    conn.execute.assert_called_once()


@pytest.mark.asyncio
async def test_update_recommendation_status_tenant_bound():
    """Ensure update_recommendation_status enforces tenant filtering when email is provided."""
    db = AuditDB()
    db.pool = MagicMock()
    conn = AsyncMock()

    rec_id = str(uuid.uuid4())
    conn.fetchrow.return_value = {
        "id": uuid.UUID(rec_id),
        "email": "user@example.com",
        "audit_id": uuid.uuid4(),
        "url": "https://example.com",
        "finding_key": "cta_clarity",
        "label": "CTA Clarity",
        "impact": Decimal("8.0"),
        "effort": Decimal("2.0"),
        "quadrant": "quick_win",
        "status": "doing",
        "verified_at": None,
        "created_at": None,
        "updated_at": None,
    }
    db.pool.acquire.return_value.__aenter__.return_value = conn
    db.connect = AsyncMock()

    res = await db.update_recommendation_status(rec_id, "doing", email="user@example.com")
    assert res is not None
    assert res["status"] == "doing"
    assert res["impact"] == 8.0
    conn.fetchrow.assert_called_once()
