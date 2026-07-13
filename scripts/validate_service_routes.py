#!/usr/bin/env python3
"""Validate Nebula's service-route ownership manifest.

The checked-in .yaml document uses JSON syntax, which is a YAML 1.2 subset. This
keeps validation dependency-free in the production Python environment.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MANIFEST = ROOT / "config" / "service-route-manifest.yaml"
ALLOWED_OWNERS = {"agentic_server", "webhook_server", "platform_api", "next"}


class ManifestValidationError(ValueError):
    """Raised when a service-route manifest violates the routing contract."""


def load_manifest(path: Path | str = DEFAULT_MANIFEST) -> dict[str, Any]:
    manifest_path = Path(path)
    try:
        document = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ManifestValidationError(f"cannot parse {manifest_path}: {exc}") from exc
    if not isinstance(document, dict):
        raise ManifestValidationError("manifest root must be an object")
    return document


def _route_selector(route: dict[str, Any]) -> str:
    selectors = [key for key in ("path", "path_prefix", "default") if key in route]
    if len(selectors) != 1:
        raise ManifestValidationError(
            f"route {route.get('name', '<unnamed>')} must have exactly one selector"
        )
    return selectors[0]


def validate_manifest(document: dict[str, Any]) -> None:
    if document.get("schema_version") != 1:
        raise ManifestValidationError("schema_version must be 1")

    routes = document.get("routes")
    if not isinstance(routes, list) or not routes:
        raise ManifestValidationError("routes must be a non-empty list")

    names: set[str] = set()
    exact_paths: set[str] = set()
    defaults = 0
    stripe_route: dict[str, Any] | None = None

    for route in routes:
        if not isinstance(route, dict):
            raise ManifestValidationError("every route must be an object")
        name = route.get("name")
        if not isinstance(name, str) or not name:
            raise ManifestValidationError("every route must have a name")
        if name in names:
            raise ManifestValidationError(f"duplicate route name: {name}")
        names.add(name)

        selector = _route_selector(route)
        if selector == "default":
            if route["default"] is not True:
                raise ManifestValidationError("default selector must be true")
            defaults += 1
        else:
            value = route[selector]
            if not isinstance(value, str) or not value.startswith("/"):
                raise ManifestValidationError(f"route {name} has an invalid {selector}")
            if selector == "path":
                if value in exact_paths:
                    raise ManifestValidationError(f"duplicate exact path: {value}")
                exact_paths.add(value)
                if value == "/stripe-webhook":
                    stripe_route = route

        for owner_field in ("current_owner", "target_owner"):
            if route.get(owner_field) not in ALLOWED_OWNERS:
                raise ManifestValidationError(
                    f"route {name} has invalid {owner_field}: {route.get(owner_field)!r}"
                )

        if route.get("route_class") == "public_page_family":
            gate = route.get("transition_gate")
            if route.get("target_owner") != "next":
                raise ManifestValidationError(f"public page family {name} must target next")
            if not isinstance(gate, str) or not gate:
                raise ManifestValidationError(
                    f"public page family {name} requires a named parity/canary gate"
                )

    if defaults != 1:
        raise ManifestValidationError(f"manifest must contain exactly one default; found {defaults}")

    unknown_host = document.get("unknown_host")
    if not (
        isinstance(unknown_host, dict)
        and unknown_host.get("terminal") is True
        and unknown_host.get("status") == 404
        and unknown_host.get("owner") == "terminal_404"
    ):
        raise ManifestValidationError("unknown host must end in a terminal 404")

    if stripe_route is None:
        raise ManifestValidationError("manifest must contain exact /stripe-webhook ownership")
    if stripe_route.get("target_owner") != "platform_api":
        raise ManifestValidationError("Stripe target owner must be platform_api")
    if stripe_route.get("transition_gate") != "verified_idempotent_stripe_processor":
        raise ManifestValidationError(
            "Stripe transition requires verified_idempotent_stripe_processor"
        )

    default_route = next(route for route in routes if route.get("default") is True)
    if (
        default_route.get("target_owner") == "next"
        and default_route.get("transition_gate") != "final_public_cutover"
    ):
        raise ManifestValidationError(
            "public default cannot switch to next without final_public_cutover"
        )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", nargs="?", type=Path, default=DEFAULT_MANIFEST)
    args = parser.parse_args()
    try:
        document = load_manifest(args.manifest)
        validate_manifest(document)
    except ManifestValidationError as exc:
        parser.exit(1, f"invalid service-route manifest: {exc}\n")
    print(f"valid service-route manifest: {args.manifest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
