"""Tests for PATCH /audit/{id}/page-intent URL-propagation endpoint."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4


AUDIT_ID = str(uuid4())
SIBLING_ID = str(uuid4())
OWNER_EMAIL = "owner@example.com"
URL = "https://example.com/pricing"


def _make_audit(audit_id, url=URL, email=OWNER_EMAIL, status="completed"):
    return {"id": audit_id, "url": url, "email": email, "status": status}


@pytest.fixture
def client():
    return None


@pytest.fixture
def mock_principal():
    return None


@pytest.mark.asyncio
async def test_override_updates_all_same_url_audits(client, mock_principal):
    """Overriding intent on one audit propagates to all audits with same URL + owner."""
    from platform_api.routes.audit_api import override_page_intent, PageIntentOverride
    from platform_api.auth.principal import Principal

    principal = Principal(
        principal_type="user",
        principal_id=OWNER_EMAIL,
        email=OWNER_EMAIL,
        workspace_email=OWNER_EMAIL,
        scopes=frozenset(["workspace:write"]),
    )

    mock_conn = AsyncMock()
    # get_audit returns the requested audit
    mock_conn.fetchrow = AsyncMock(return_value=_make_audit(AUDIT_ID))
    # UPDATE affects 2 rows (this audit + one sibling)
    mock_conn.execute = AsyncMock(return_value="UPDATE 2")
    # fetch returns 2 sibling audit IDs
    mock_conn.fetch = AsyncMock(return_value=[
        {"id": AUDIT_ID},
        {"id": SIBLING_ID},
    ])

    mock_pool = MagicMock()
    mock_pool.acquire = MagicMock(return_value=AsyncMock(
        __aenter__=AsyncMock(return_value=mock_conn),
        __aexit__=AsyncMock(return_value=None),
    ))

    with patch("platform_api.routes.audit_api.audit_db") as mock_db, \
         patch("platform_api.routes.audit_api.sync_findings_for_audit") as mock_sync:
        mock_db.get_audit = AsyncMock(return_value=_make_audit(AUDIT_ID))
        mock_db.connect = AsyncMock(return_value=None)
        mock_db.pool = mock_pool
        mock_sync.return_value = {"created": 0, "resolved": 1}

        body = PageIntentOverride(page_intent="seo_content")
        result = await override_page_intent(AUDIT_ID, body, principal)

    assert result["page_intent"] == "seo_content"
    assert result["intent_confidence"] == 1.0
    assert result["overridden"] is True
    assert result["affected_audits"] == 2


@pytest.mark.asyncio
async def test_override_rejects_invalid_intent(client, mock_principal):
    """Invalid intent value returns 400."""
    from platform_api.routes.audit_api import override_page_intent, PageIntentOverride
    from platform_api.auth.principal import Principal
    from fastapi import HTTPException

    principal = Principal(
        principal_type="user",
        principal_id=OWNER_EMAIL,
        email=OWNER_EMAIL,
        workspace_email=OWNER_EMAIL,
        scopes=frozenset(["workspace:write"]),
    )

    body = PageIntentOverride(page_intent="not_a_real_intent")
    with patch("platform_api.routes.audit_api.audit_db") as mock_db:
        mock_db.get_audit = AsyncMock(return_value=_make_audit(AUDIT_ID))
        with pytest.raises(HTTPException) as exc_info:
            await override_page_intent(AUDIT_ID, body, principal)
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_override_rejects_wrong_owner():
    """A different user cannot override someone else's audit."""
    from platform_api.routes.audit_api import override_page_intent, PageIntentOverride
    from platform_api.auth.principal import Principal
    from fastapi import HTTPException

    principal = Principal(
        principal_type="user",
        principal_id="other@example.com",
        email="other@example.com",
        workspace_email="other@example.com",
        scopes=frozenset(["workspace:write"]),
    )

    body = PageIntentOverride(page_intent="seo_content")
    with patch("platform_api.routes.audit_api.audit_db") as mock_db:
        mock_db.get_audit = AsyncMock(return_value=_make_audit(AUDIT_ID))
        with pytest.raises(HTTPException) as exc_info:
            await override_page_intent(AUDIT_ID, body, principal)
    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_override_404_on_missing_audit():
    """Missing audit returns 404."""
    from platform_api.routes.audit_api import override_page_intent, PageIntentOverride
    from platform_api.auth.principal import Principal
    from fastapi import HTTPException

    principal = Principal(
        principal_type="user",
        principal_id=OWNER_EMAIL,
        email=OWNER_EMAIL,
        workspace_email=OWNER_EMAIL,
        scopes=frozenset(["workspace:write"]),
    )

    body = PageIntentOverride(page_intent="seo_content")
    with patch("platform_api.routes.audit_api.audit_db") as mock_db:
        mock_db.get_audit = AsyncMock(return_value=None)
        with pytest.raises(HTTPException) as exc_info:
            await override_page_intent(AUDIT_ID, body, principal)
    assert exc_info.value.status_code == 404
