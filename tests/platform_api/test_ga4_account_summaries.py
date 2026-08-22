"""Parser must match the documented Admin API accountSummaries shape."""

import pytest

from platform_api.ga4.oauth import list_account_summaries


DOC_SHAPE = {
    "accountSummaries": [
        {
            "name": "accounts/111",
            "displayName": "Acme Inc",
            "propertySummaries": [
                {"property": "properties/123", "displayName": "Acme Production"},
                {"property": "properties/456", "displayName": "Acme Staging"},
            ],
        }
    ]
}


@pytest.mark.asyncio
async def test_parses_documented_shape(monkeypatch):
    class R:
        status_code = 200
        def raise_for_status(self): pass
        def json(self): return DOC_SHAPE
    class C:
        def __init__(self,*a,**k): pass
        async def __aenter__(self): return self
        async def __aexit__(self,*a): pass
        async def get(self,*a,**k): return R()
    monkeypatch.setattr("httpx.AsyncClient", C)

    props = await list_account_summaries("token")
    assert [p["property_id"] for p in props] == ["properties/123", "properties/456"]
    assert props[0]["display_name"] == "Acme Production"
