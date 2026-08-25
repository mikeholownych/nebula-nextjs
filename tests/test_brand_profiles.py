"""Brand profile validation and route contract tests."""

import pytest
from pydantic import ValidationError

from platform_api.routes.brand_profiles import BrandCreate, BrandUpdate


def test_brand_create_defaults_to_nebula_accent():
    profile = BrandCreate(display_name="Acme Growth")
    assert profile.primary_color == "#c7ff2f"
    assert profile.support_email is None


def test_brand_create_normalizes_hex_color():
    assert BrandCreate(display_name="Acme", primary_color="#ABCDEF").primary_color == "#abcdef"


def test_brand_rejects_invalid_color():
    with pytest.raises(ValidationError):
        BrandCreate(display_name="Acme", primary_color="blue")


def test_brand_rejects_relative_logo_url():
    with pytest.raises(ValidationError):
        BrandUpdate(logo_url="/logo.svg")


def test_brand_accepts_absolute_logo_url():
    assert BrandUpdate(logo_url="https://cdn.example/logo.svg").logo_url == "https://cdn.example/logo.svg"
