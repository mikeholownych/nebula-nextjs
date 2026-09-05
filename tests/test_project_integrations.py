import asyncio
from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

from platform_api.routes import ga4_routes


class FakeQuery:
    def __init__(self, row=None):
        self.row = row

    def filter_by(self, **kwargs):
        return self

    def filter(self, *args, **kwargs):
        return self

    def first(self):
        return self.row


class FakeDb:
    def __init__(self, row=None):
        self.row = row

    def query(self, model):
        return FakeQuery(self.row if model is not ga4_routes.ProjectIntegration else None)


def test_project_ga4_properties_does_not_select_legacy_property_without_mapping(monkeypatch):
    user_id = uuid4()
    legacy = SimpleNamespace(refresh_token="encrypted", property_id="legacy-123")
    monkeypatch.setattr(ga4_routes, "_current_connection", lambda db, uid: legacy)
    monkeypatch.setattr(ga4_routes, "_valid_access_token", lambda conn, db: _token())
    monkeypatch.setattr(
        ga4_routes,
        "_summaries_or_clean_error",
        lambda token: _summaries(),
    )

    result = asyncio.run(
        ga4_routes.ga4_properties(
            project_domain="client.example",
            auth={"user_id": user_id},
            redis=None,
            db=FakeDb(row=None),
        )
    )

    assert result["properties"] == [
        {"property_id": "legacy-123", "display_name": "Legacy", "selected": False},
        {"property_id": "project-456", "display_name": "Project", "selected": False},
    ]


def test_project_ga4_status_does_not_fall_back_to_legacy_property():
    user_id = uuid4()
    legacy = SimpleNamespace(
        refresh_token="encrypted",
        property_id="legacy-123",
        property_display_name="Legacy",
        connected_at=datetime.now(timezone.utc),
    )

    result = asyncio.run(
        ga4_routes.ga4_status(
            project_domain="client.example",
            auth={"user_id": user_id},
            db=FakeDb(row=legacy),
        )
    )

    assert result["connected"] is True
    assert result["property_id"] is None
    assert result["project_domain"] == "client.example"


def _token():
    async def value():
        return "redacted-test-token"

    return value()


def _summaries():
    async def value():
        return [
            {"property_id": "legacy-123", "display_name": "Legacy"},
            {"property_id": "project-456", "display_name": "Project"},
        ]

    return value()
