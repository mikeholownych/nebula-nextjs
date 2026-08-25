from uuid import UUID

import pytest

from platform_api.services.object_storage import ObjectStorage, ObjectStorageNotConfigured


def test_object_storage_requires_complete_configuration(monkeypatch):
    for name in ("R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_PUBLIC_URL"):
        monkeypatch.delenv(name, raising=False)
    with pytest.raises(ObjectStorageNotConfigured):
        ObjectStorage()


def test_object_storage_generates_org_scoped_logo_upload(monkeypatch):
    monkeypatch.setenv("R2_ACCOUNT_ID", "account")
    monkeypatch.setenv("R2_ACCESS_KEY_ID", "access")
    monkeypatch.setenv("R2_SECRET_ACCESS_KEY", "secret")
    monkeypatch.setenv("R2_BUCKET", "logos")
    monkeypatch.setenv("R2_PUBLIC_URL", "https://cdn.example.com")
    result = ObjectStorage().create_logo_upload(UUID("07ed2178-a7a8-4dc4-b432-03887ebe51e1"), "image/png")
    assert result["upload_url"].startswith("https://account.r2.cloudflarestorage.com/")
    assert "/organizations/07ed2178-a7a8-4dc4-b432-03887ebe51e1/brand/logo-" in result["public_url"]
    assert result["public_url"].endswith(".png")
    assert result["expires_in"] == 300
    assert result["max_bytes"] == 2 * 1024 * 1024
