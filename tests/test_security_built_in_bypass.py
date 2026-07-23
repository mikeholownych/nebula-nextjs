"""Security regression test for protected contract bypass."""
import pytest
from scripts.validate_service_routes import (
    RouteExtraction,
    RouteContract,
    _contract_is_protected_python,
    validate_manifest,
    load_manifest,
    extract_route_contracts,
    validate_route_coverage,
    ManifestValidationError,
)


def test_no_protected_python_contract_may_be_covered_by_next_target():
    """Check that a protected contract (matching /stripe-webhook, /api/, etc.)
    cannot be satisfied by a route whose target_owner is next.
    """
    # Build a manifest that would pass except for the protected/next conflict.

    # We'll simulate a contract that matches /stripe-webhook (protected)
    # and add a route that covers it, targeting next.
    fake_contract = RouteContract("path", "/stripe-webhook", 123, "fake_handle")

    # Ensure the contract is recognized as protected
    assert _contract_is_protected_python(fake_contract)

    # Build a covering route targeting next
    bad_route = {
        "name": "public_next_default",
        "path": "/stripe-webhook",
        "current_owner": "agentic_server",
        "target_owner": "next",
        "transition_gate": "final_public_cutover",
    }

    # Expect failure when we call validate_route_coverage
    with pytest.raises(
        ManifestValidationError,
        match=r"protected Python route contract.*covered.*targeting next",
    ):
        validate_route_coverage(
            {"routes": [bad_route]},
            RouteExtraction((fake_contract,), ()),
        )

if __name__ == "__main__":
    pytest.main([__file__, "-v"])