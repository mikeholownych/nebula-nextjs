import copy
from pathlib import Path

import pytest

from scripts.validate_service_routes import (
    ManifestValidationError,
    extract_route_contracts,
    load_manifest,
    validate_manifest,
    validate_route_coverage,
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


def test_ast_extractor_finds_static_route_contracts_without_importing_source(tmp_path):
    source = tmp_path / "routes.py"
    source.write_text(
        '''
import re
ROUTE = re.compile(r"^/reports/[0-9]+$")

def handle(parsed, prefix):
    path = parsed.path
    aliases = {"/old": "/new", "/legacy": "/"}
    if path == "/exact":
        pass
    if path in ("/one", "/two"):
        pass
    if path in aliases:
        pass
    if path.startswith(("/api/private/", "/agent/")):
        pass
    if ROUTE.match(path):
        pass
    if re.fullmatch(r"^/inline/[a-z]+$", parsed.path):
        pass
    if re.match(r"/loose/[0-9]+", path):
        pass
    if path.startswith(prefix):
        pass
''',
        encoding="utf-8",
    )

    result = extract_route_contracts(source)

    assert [(record.selector, record.value) for record in result.contracts] == [
        ("path", "/exact"),
        ("path", "/one"),
        ("path", "/two"),
        ("path", "/old"),
        ("path", "/legacy"),
        ("path_prefix", "/api/private/"),
        ("path_prefix", "/agent/"),
        ("path_regex", r"^/reports/[0-9]+$"),
        ("path_regex", r"^/inline/[a-z]+$"),
        ("path_regex", r"/loose/[0-9]+"),
    ]
    assert all(record.line > 0 and record.context == "handle" for record in result.contracts)
    assert len(result.diagnostics) == 1
    assert "dynamic startswith selector" in result.diagnostics[0].message
    assert result.diagnostics[0].context == "handle"


def test_route_coverage_rejects_uncovered_protected_contract_and_public_default(tmp_path):
    source = tmp_path / "routes.py"
    source.write_text('def handle(path):\n    return path == "/api/private"\n', encoding="utf-8")
    document = manifest()
    document["routes"] = [
        route_by_name(document, "stripe_webhook"),
        next(route for route in document["routes"] if route.get("default")),
    ]

    with pytest.raises(ManifestValidationError, match="uncovered route contract.*api/private"):
        validate_route_coverage(document, extract_route_contracts(source))


def test_named_protected_prefix_covers_extracted_contract(tmp_path):
    source = tmp_path / "routes.py"
    source.write_text('def handle(path):\n    return path == "/api/private"\n', encoding="utf-8")
    document = manifest()

    validate_route_coverage(document, extract_route_contracts(source))


def test_named_protected_prefix_covers_extracted_regex_contract(tmp_path):
    source = tmp_path / "routes.py"
    source.write_text(
        'import re\ndef handle(path):\n    return re.fullmatch(r"^/api/items/[0-9]+$", path)\n',
        encoding="utf-8",
    )

    validate_route_coverage(manifest(), extract_route_contracts(source))


def test_dynamic_selector_requires_documented_exclusion(tmp_path):
    source = tmp_path / "routes.py"
    source.write_text(
        'def handle(path, configured_prefix):\n    return path.startswith(configured_prefix)\n',
        encoding="utf-8",
    )
    result = extract_route_contracts(source)
    document = manifest()

    with pytest.raises(ManifestValidationError, match="undocumented dynamic route selector"):
        validate_route_coverage(document, result)

    document["route_contract_exclusions"] = [
        {"diagnostic": result.diagnostics[0].identifier, "reason": "runtime plugin namespace"}
    ]
    validate_route_coverage(document, result)


def test_validator_rejects_broad_prefix_before_specific_exact():
    document = manifest()
    broad = route_by_name(document, "current_public_api")
    document["routes"].remove(broad)
    stats_index = document["routes"].index(route_by_name(document, "stats"))
    document["routes"].insert(stats_index, broad)

    assert_invalid(document, "broader rule current_public_api.*before specific rule stats")


def test_validator_rejects_broad_prefix_before_narrower_prefix():
    document = manifest()
    broad = route_by_name(document, "current_public_api")
    document["routes"].remove(broad)
    document["routes"].insert(1, broad)

    assert_invalid(document, "broader rule current_public_api.*before specific rule platform_api")


def test_validator_rejects_duplicate_prefixes():
    document = manifest()
    duplicate = copy.deepcopy(route_by_name(document, "crm"))
    duplicate["name"] = "duplicate_crm"
    document["routes"].append(duplicate)

    assert_invalid(document, "duplicate path_prefix")


@pytest.mark.parametrize(
    ("expression", "regex_mode", "message"),
    [
        ("[/", None, "invalid path_regex"),
        ("/reports/[0-9]+$", None, r"must start with \^/"),
        (r"^/reports/[0-9]+", None, "must be end-anchored or declare regex_mode prefix"),
        (r"^/.*", "prefix", "unbounded catch-all"),
        (r"^/(a+)+$", None, "catastrophic nested quantifier"),
    ],
)
def test_validator_rejects_invalid_path_regex(expression, regex_mode, message):
    document = manifest()
    route = {
        "name": "reports_regex",
        "path_regex": expression,
        "current_owner": "agentic_server",
        "target_owner": "agentic_server",
    }
    if regex_mode is not None:
        route["regex_mode"] = regex_mode
    document["routes"].insert(-1, route)

    assert_invalid(document, message)


def test_validator_accepts_explicit_prefix_regex_mode():
    document = manifest()
    document["routes"].insert(
        -1,
        {
            "name": "reports_regex",
            "path_regex": r"^/reports/[0-9]+",
            "regex_mode": "prefix",
            "current_owner": "agentic_server",
            "target_owner": "agentic_server",
        },
    )

    validate_manifest(document)


def test_validator_rejects_equivalent_regex_selectors():
    document = manifest()
    regex_route = {
        "name": "reports_regex",
        "path_regex": r"^/reports/[0-9]+$",
        "current_owner": "agentic_server",
        "target_owner": "agentic_server",
    }
    document["routes"].insert(-1, regex_route)
    duplicate = copy.deepcopy(regex_route)
    duplicate["name"] = "duplicate_reports_regex"
    document["routes"].insert(-1, duplicate)

    assert_invalid(document, "duplicate path_regex")


def test_validator_rejects_regex_before_overlapping_specific_exact():
    document = manifest()
    document["routes"].insert(
        0,
        {
            "name": "api_regex",
            "path_regex": r"^/api/(?:stats|other)$",
            "regex_mode": "prefix",
            "current_owner": "agentic_server",
            "target_owner": "platform_api",
            "transition_gate": "api_migration_gate",
        },
    )

    assert_invalid(document, "regex rule api_regex overlaps later rule stats")


def test_validator_rejects_owner_change_without_transition_gate():
    document = manifest()
    route_by_name(document, "platform_api").pop("transition_gate")

    assert_invalid(document, "owner change requires a non-empty transition gate")


@pytest.mark.parametrize("field", ["current_owner", "target_owner"])
def test_validator_rejects_owner_not_declared_in_services(field):
    document = manifest()
    route = route_by_name(document, "crm")
    route[field] = "webhook_server"
    route["transition_gate"] = "crm_owner_migration"
    document["services"].pop("webhook_server")

    assert_invalid(document, f"{field}.*not declared in services")


def test_validator_rejects_target_not_live_without_gate_even_without_owner_change():
    document = manifest()
    route = route_by_name(document, "crm")
    route["current_owner"] = "platform_api"
    route["target_owner"] = "platform_api"

    assert_invalid(document, "target owner platform_api is target_not_live and requires a gate")


@pytest.mark.parametrize("gate", ["complete", "deployed", True, False])
def test_validator_rejects_non_verifiable_transition_gate(gate):
    document = manifest()
    route_by_name(document, "platform_api")["transition_gate"] = gate

    assert_invalid(document, "named verifiable transition gate")


def test_validator_rejects_protected_python_route_targeting_next():
    document = manifest()
    route = route_by_name(document, "crm")
    route["target_owner"] = "next"
    route["transition_gate"] = "crm_frontend_cutover"

    assert_invalid(document, "protected Python route crm cannot target next")
