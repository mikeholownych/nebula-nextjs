import copy
from pathlib import Path

import pytest

from scripts.validate_service_routes import (
    ManifestValidationError,
    load_manifest,
    validate_manifest,
)


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "config" / "service-route-manifest.yaml"


def manifest():
    return load_manifest(MANIFEST_PATH)


def route_by_name(document, name):
    return next(route for route in document["routes"] if route["name"] == name)


def assert_invalid(document, message):
    with pytest.raises(ManifestValidationError, match=message):
        validate_manifest(document)


def test_checked_in_manifest_satisfies_route_ownership_contract():
    document = manifest()

    validate_manifest(document)

    assert route_by_name(document, "stripe_webhook") == {
        "name": "stripe_webhook",
        "path": "/stripe-webhook",
        "current_owner": "agentic_server",
        "target_owner": "platform_api",
        "transition_gate": "verified_idempotent_stripe_processor",
    }
    assert route_by_name(document, "platform_api")["target_owner"] == "platform_api"
    assert route_by_name(document, "crm")["current_owner"] == "agentic_server"
    assert route_by_name(document, "stats")["current_upstream"] == "webhook_server"

    protected_names = {
        "agent_discovery",
        "auth_document",
        "llm_document",
        "openapi_document",
        "agent_protocol",
        "tracking",
        "current_public_api",
    }
    for name in protected_names:
        route = route_by_name(document, name)
        assert route["current_owner"] == "agentic_server"
        assert route["target_owner"] == "agentic_server"

    public_routes = [
        route
        for route in document["routes"]
        if route.get("route_class") == "public_page_family"
    ]
    assert public_routes
    assert all(route["current_owner"] == "agentic_server" for route in public_routes)
    assert all(route["target_owner"] == "next" for route in public_routes)
    assert all(route.get("transition_gate") for route in public_routes)


def test_validator_rejects_duplicate_exact_paths():
    document = manifest()
    duplicate = copy.deepcopy(route_by_name(document, "stripe_webhook"))
    duplicate["name"] = "duplicate_stripe"
    document["routes"].append(duplicate)

    assert_invalid(document, "duplicate exact path")


def test_validator_rejects_multiple_defaults():
    document = manifest()
    document["routes"].append(
        {
            "name": "second_default",
            "default": True,
            "route_class": "public_page_family",
            "current_owner": "agentic_server",
            "target_owner": "next",
            "transition_gate": "final_public_cutover",
        }
    )

    assert_invalid(document, "exactly one default")


def test_validator_rejects_missing_terminal_unknown_host_404():
    document = manifest()
    document["unknown_host"]["status"] = 502

    assert_invalid(document, "terminal 404")


def test_validator_rejects_non_platform_stripe_target():
    document = manifest()
    route_by_name(document, "stripe_webhook")["target_owner"] = "agentic_server"

    assert_invalid(document, "Stripe target owner must be platform_api")


def test_validator_rejects_unverified_stripe_transition():
    document = manifest()
    route_by_name(document, "stripe_webhook")["transition_gate"] = "deployed"

    assert_invalid(document, "verified_idempotent_stripe_processor")


def test_validator_rejects_next_public_default_without_final_cutover_gate():
    document = manifest()
    default = next(route for route in document["routes"] if route.get("default"))
    default["transition_gate"] = "homepage_parity_canary"

    assert_invalid(document, "final_public_cutover")
