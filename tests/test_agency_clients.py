"""Tests for agency client management routes."""
import pytest
from platform_api.routes.agency_clients import derive_slug, derive_client_email
from uuid import UUID


def test_derive_slug_basic():
    assert derive_slug("Acme Corp") == "acme-corp"


def test_derive_slug_special_chars():
    assert derive_slug("My Client #1!") == "my-client-1"


def test_derive_slug_max_length():
    long_name = "a" * 50
    assert len(derive_slug(long_name)) <= 40


def test_derive_slug_strips_leading_trailing_hyphens():
    assert derive_slug("  --Test--  ") == "test"


def test_derive_client_email():
    org_id = UUID("07ed2178-a7a8-4dc4-b432-03887ebe51e1")
    result = derive_client_email("acme-corp", org_id)
    assert result == "acme-corp+07ed2178@clients.nebulacomponents.com"


def test_derive_client_email_uses_first_8_chars_of_org_id():
    org_id = UUID("abcdef12-0000-0000-0000-000000000000")
    result = derive_client_email("test", org_id)
    assert result == "test+abcdef12@clients.nebulacomponents.com"
    # strip hyphens from org_id string representation
    # str(org_id) = 'abcdef12-0000-...' so [:8] = 'abcdef12'
    assert "@" in result
    assert "clients.nebulacomponents.com" in result


def test_derive_slug_no_trailing_hyphen_after_truncation():
    result = derive_slug("a" * 39 + "!z")
    assert not result.endswith("-")
    assert len(result) <= 40


def test_client_email_is_parseable_as_email():
    """client_email must pass basic email format checks."""
    org_id = UUID("07ed2178-a7a8-4dc4-b432-03887ebe51e1")
    email = derive_client_email("test-client", org_id)
    assert "@" in email
    local, domain = email.split("@", 1)
    assert "+" in local
    assert domain == "clients.nebulacomponents.com"


def test_client_email_slug_plus_prefix():
    org_id = UUID("07ed2178-a7a8-4dc4-b432-03887ebe51e1")
    email = derive_client_email("acme", org_id)
    # str(org_id) = '07ed2178-a7a8-...' -> replace hyphens -> '07ed2178a7a8...' -> [:8] = '07ed2178'
    assert email == "acme+07ed2178@clients.nebulacomponents.com"
