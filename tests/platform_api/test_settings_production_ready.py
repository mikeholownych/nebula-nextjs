from platform_api.config import Settings


def test_production_ready_requires_stripe_webhook_secret(monkeypatch):
    monkeypatch.delenv("STRIPE_WEBHOOK_SECRET", raising=False)
    settings = Settings(
        ENVIRONMENT="production",
        ALLOWED_ORIGINS=["https://nebulacomponents.com"],
        STRIPE_WEBHOOK_SECRET=None,
    )
    assert "STRIPE_WEBHOOK_SECRET" in settings.missing_required_settings()
    assert settings.ready() is False


def test_production_ready_when_stripe_webhook_secret_present(monkeypatch):
    settings = Settings(
        ENVIRONMENT="production",
        ALLOWED_ORIGINS=["https://nebulacomponents.com"],
        STRIPE_WEBHOOK_SECRET="whsec_test",
    )
    assert "STRIPE_WEBHOOK_SECRET" not in settings.missing_required_settings()


def test_production_ready_requires_secret_key_and_database_urls(monkeypatch):
    for key in ("SECRET_KEY", "DATABASE_URL", "AUDIT_DATABASE_URL", "STRIPE_WEBHOOK_SECRET"):
        monkeypatch.delenv(key, raising=False)
    settings = Settings(
        ENVIRONMENT="production",
        ALLOWED_ORIGINS=["https://nebulacomponents.com"],
        SECRET_KEY=None,
        DATABASE_URL=None,
        AUDIT_DATABASE_URL=None,
        STRIPE_WEBHOOK_SECRET="whsec_test",
    )
    missing = settings.missing_required_settings()
    assert "SECRET_KEY" in missing
    assert "DATABASE_URL" in missing
    assert "AUDIT_DATABASE_URL" in missing
    assert settings.ready() is False
    assert "postgresql://" not in str(missing)


def test_production_ready_when_secret_and_database_urls_present(monkeypatch):
    settings = Settings(
        ENVIRONMENT="production",
        ALLOWED_ORIGINS=["https://nebulacomponents.com"],
        SECRET_KEY="test-secret",
        DATABASE_URL="postgresql://postgres@/nebula_platform",
        AUDIT_DATABASE_URL="postgresql://postgres@/nebula_audit",
        STRIPE_WEBHOOK_SECRET="whsec_test",
    )
    missing = settings.missing_required_settings()
    assert "SECRET_KEY" not in missing
    assert "DATABASE_URL" not in missing
    assert "AUDIT_DATABASE_URL" not in missing
    assert settings.ready() is True
