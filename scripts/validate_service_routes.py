#!/usr/bin/env python3
"""Validate Nebula's service-route ownership manifest.

The checked-in .yaml document uses JSON syntax, which is a YAML 1.2 subset. This
keeps validation dependency-free in the production Python environment.
"""

from __future__ import annotations

import argparse
import ast
from dataclasses import dataclass
import json
from pathlib import Path
import re
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MANIFEST = ROOT / "config" / "service-route-manifest.yaml"
ALLOWED_OWNERS = {"agentic_server", "webhook_server", "platform_api", "next"}


class ManifestValidationError(ValueError):
    """Raised when a service-route manifest violates the routing contract."""


@dataclass(frozen=True)
class RouteContract:
    selector: str
    value: str
    line: int
    context: str


@dataclass(frozen=True)
class RouteDiagnostic:
    identifier: str
    message: str
    line: int
    context: str


@dataclass(frozen=True)
class RouteExtraction:
    contracts: tuple[RouteContract, ...]
    diagnostics: tuple[RouteDiagnostic, ...]


class _RouteContractVisitor(ast.NodeVisitor):
    """Extract statically knowable path tests without importing the source."""

    def __init__(self, tree: ast.AST) -> None:
        self.constants: dict[str, tuple[str, ...]] = {}
        self.regexes: dict[str, str] = {}
        self.parents: dict[ast.AST, ast.AST] = {}
        for parent in ast.walk(tree):
            for child in ast.iter_child_nodes(parent):
                self.parents[child] = parent
        self.context: list[str] = []
        self.contracts: list[RouteContract] = []
        self.diagnostics: list[RouteDiagnostic] = []
        self._collect_bindings(tree)

    def _collect_bindings(self, tree: ast.AST) -> None:
        for node in ast.walk(tree):
            if not isinstance(node, (ast.Assign, ast.AnnAssign)):
                continue
            value = node.value
            targets = node.targets if isinstance(node, ast.Assign) else [node.target]
            for target in targets:
                if not isinstance(target, ast.Name) or value is None:
                    continue
                strings = self._literal_strings(value)
                if strings is not None:
                    self.constants[target.id] = strings
                pattern = self._compiled_pattern(value)
                if pattern is not None:
                    self.regexes[target.id] = pattern

    @staticmethod
    def _literal_strings(node: ast.AST) -> tuple[str, ...] | None:
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            return (node.value,)
        if isinstance(node, (ast.Tuple, ast.List, ast.Set)):
            values: list[str] = []
            for element in node.elts:
                if not isinstance(element, ast.Constant) or not isinstance(element.value, str):
                    return None
                values.append(element.value)
            return tuple(values)
        if isinstance(node, ast.Dict):
            values = []
            for key in node.keys:
                if not isinstance(key, ast.Constant) or not isinstance(key.value, str):
                    return None
                values.append(key.value)
            return tuple(values)
        return None

    @staticmethod
    def _compiled_pattern(node: ast.AST) -> str | None:
        if not isinstance(node, ast.Call) or not node.args:
            return None
        function = node.func
        if not (
            isinstance(function, ast.Attribute)
            and function.attr == "compile"
            and isinstance(function.value, ast.Name)
            and function.value.id == "re"
        ):
            return None
        pattern = node.args[0]
        return pattern.value if isinstance(pattern, ast.Constant) and isinstance(pattern.value, str) else None

    @staticmethod
    def _is_path(node: ast.AST) -> bool:
        return isinstance(node, ast.Name) and node.id == "path" or (
            isinstance(node, ast.Attribute)
            and node.attr == "path"
            and isinstance(node.value, (ast.Name, ast.Attribute))
        )

    def _values(self, node: ast.AST) -> tuple[str, ...] | None:
        literal = self._literal_strings(node)
        if literal is not None:
            return literal
        if isinstance(node, ast.Name):
            return self.constants.get(node.id)
        return None

    def _current_context(self) -> str:
        return ".".join(self.context) if self.context else "<module>"

    def _record(self, selector: str, value: str, node: ast.AST) -> None:
        if selector == "path_regex" or value.startswith("/"):
            self.contracts.append(
                RouteContract(selector, value, getattr(node, "lineno", 0), self._current_context())
            )

    def _diagnose(self, operation: str, node: ast.AST) -> None:
        line = getattr(node, "lineno", 0)
        context = self._current_context()
        identifier = f"dynamic:{line}:{context}:{operation}"
        self.diagnostics.append(
            RouteDiagnostic(identifier, f"dynamic {operation} selector is not statically knowable", line, context)
        )

    def visit_ClassDef(self, node: ast.ClassDef) -> None:
        self.context.append(node.name)
        self.generic_visit(node)
        self.context.pop()

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        self.context.append(node.name)
        self.generic_visit(node)
        self.context.pop()

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> None:
        self.context.append(node.name)
        self.generic_visit(node)
        self.context.pop()

    def visit_Compare(self, node: ast.Compare) -> None:
        if len(node.ops) == 1 and len(node.comparators) == 1:
            operation = node.ops[0]
            right = node.comparators[0]
            candidate: ast.AST | None = None
            if self._is_path(node.left) and isinstance(operation, (ast.Eq, ast.In)):
                candidate = right
            elif self._is_path(right) and isinstance(operation, ast.Eq):
                candidate = node.left
            if candidate is not None:
                values = self._values(candidate)
                if values is None:
                    self._diagnose("comparison", node)
                else:
                    for value in values:
                        self._record("path", value, node)
        self.generic_visit(node)

    def _is_negated(self, node: ast.AST) -> bool:
        parent = self.parents.get(node)
        return isinstance(parent, ast.UnaryOp) and isinstance(parent.op, ast.Not)

    def visit_Call(self, node: ast.Call) -> None:
        if self._is_negated(node):
            self.generic_visit(node)
            return
        function = node.func
        if (
            isinstance(function, ast.Attribute)
            and function.attr == "startswith"
            and self._is_path(function.value)
            and node.args
        ):
            values = self._values(node.args[0])
            if values is None:
                self._diagnose("startswith", node)
            else:
                for value in values:
                    self._record("path_prefix", value, node)
        else:
            pattern: str | None = None
            path_argument: ast.AST | None = None
            if (
                isinstance(function, ast.Attribute)
                and function.attr in {"match", "search", "fullmatch"}
                and node.args
                and self._is_path(node.args[0])
            ):
                path_argument = node.args[0]
                if isinstance(function.value, ast.Name):
                    pattern = self.regexes.get(function.value.id)
                else:
                    pattern = self._compiled_pattern(function.value)
            elif (
                isinstance(function, ast.Attribute)
                and function.attr in {"match", "search", "fullmatch"}
                and isinstance(function.value, ast.Name)
                and function.value.id == "re"
                and len(node.args) >= 2
                and self._is_path(node.args[1])
            ):
                path_argument = node.args[1]
                values = self._values(node.args[0])
                pattern = values[0] if values and len(values) == 1 else None
            if path_argument is not None:
                if pattern is None:
                    self._diagnose("regex", node)
                else:
                    self._record("path_regex", pattern, node)
        self.generic_visit(node)


def extract_route_contracts(source: Path | str) -> RouteExtraction:
    source_path = Path(source)
    try:
        tree = ast.parse(source_path.read_text(encoding="utf-8"), filename=str(source_path))
    except (OSError, SyntaxError) as exc:
        raise ManifestValidationError(f"cannot parse route source {source_path}: {exc}") from exc
    visitor = _RouteContractVisitor(tree)
    visitor.visit(tree)
    return RouteExtraction(tuple(visitor.contracts), tuple(visitor.diagnostics))


def _regex_literal_prefix(pattern: str) -> str | None:
    """Return only the statically guaranteed leading literal path of a regex.

    The extractor is intentionally conservative: it stops at the first regex
    operator or non-literal escape. Ambiguous expressions therefore remain
    uncovered and fail closed rather than being assigned to a broad route.
    """
    if not pattern.startswith("^/"):
        return None
    literal: list[str] = []
    index = 1  # Skip the start anchor, but retain the leading slash.
    metacharacters = frozenset(".^$*+?{}[]()|")
    while index < len(pattern):
        character = pattern[index]
        if character == "\\":
            index += 1
            if index >= len(pattern):
                break
            escaped = pattern[index]
            if escaped.isalnum():
                break
            literal.append(escaped)
        elif character in metacharacters:
            break
        else:
            literal.append(character)
        index += 1
    value = "".join(literal)
    return value if value.startswith("/") else None


def _route_covers_contract(route: dict[str, Any], contract: RouteContract) -> bool:
    if "path" in route:
        if contract.selector == "path":
            return route["path"] == contract.value
        if contract.selector == "path_regex":
            return False
    if "path_prefix" in route:
        prefix = route["path_prefix"]
        if contract.selector in {"path", "path_prefix"}:
            return contract.value.startswith(prefix)
        if contract.selector == "path_regex":
            literal_prefix = _regex_literal_prefix(contract.value)
            return literal_prefix is not None and literal_prefix.startswith(prefix)
    if "path_regex" in route:
        try:
            expression = re.compile(route["path_regex"])
        except (re.error, TypeError):
            return False
        if contract.selector == "path":
            return expression.fullmatch(contract.value) is not None or expression.match(contract.value) is not None
        if contract.selector == "path_regex":
            return route["path_regex"] == contract.value
    return False


def _contract_is_protected_python(contract: RouteContract) -> bool:
    """Return True if a contract's selector/value matches the protected Python route pattern."""
    protected_samples = (
        "/stripe-webhook",
        "/api/",
        "/api/stats",
        "/.well-known/example",
        "/agent/example",
        "/track/example",
        "/rb2b-webhook",
    )
    if contract.selector == "path":
        value = contract.value
        return any(
            value == sample
            or value.startswith(sample)
            or sample.startswith(value) and value not in {"/", ""}
            for sample in protected_samples
        )
    if contract.selector == "path_regex":
        try:
            compiled = re.compile(contract.value)
        except re.error:
            return False
        return any(compiled.match(sample) is not None for sample in protected_samples)
    return False


def validate_route_coverage(document: dict[str, Any], extraction: RouteExtraction) -> None:
    exclusions = document.get("route_contract_exclusions", [])
    documented = {
        item.get("diagnostic")
        for item in exclusions
        if isinstance(item, dict) and isinstance(item.get("reason"), str) and item["reason"].strip()
    }
    for diagnostic in extraction.diagnostics:
        if diagnostic.identifier not in documented:
            raise ManifestValidationError(
                f"undocumented dynamic route selector: {diagnostic.identifier}: {diagnostic.message}"
            )

    routes = document.get("routes", [])
    for contract in extraction.contracts:
        covering = next((route for route in routes if _route_covers_contract(route, contract)), None)
        if covering is None or covering.get("default") is True:
            raise ManifestValidationError(
                f"uncovered route contract {contract.selector}={contract.value!r} "
                f"at {contract.context}:{contract.line}"
            )
        # Protection: a protected Python contract cannot be covered by a route targeting "next"
        if _contract_is_protected_python(contract) and covering.get("target_owner") == "next":
            raise ManifestValidationError(
                f"protected Python route contract {contract.selector}={contract.value!r} "
                f"covered by a route targeting next: {covering.get('name')}"
            )


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
    selectors = [key for key in ("path", "path_prefix", "path_regex", "default") if key in route]
    if len(selectors) != 1:
        raise ManifestValidationError(
            f"route {route.get('name', '<unnamed>')} must have exactly one selector"
        )
    return selectors[0]


def _routing_signature(route: dict[str, Any]) -> tuple[Any, ...]:
    return (
        route.get("current_owner"),
        route.get("current_upstream"),
        route.get("target_owner"),
        route.get("transition_gate"),
    )


def _regex_overlaps_route(expression: re.Pattern[str], route: dict[str, Any]) -> bool:
    if "path" in route:
        return expression.match(route["path"]) is not None
    if "path_prefix" in route:
        prefix = route["path_prefix"]
        samples = (prefix, prefix.rstrip("/"), prefix.rstrip("/") + "/sample")
        return any(expression.match(sample) is not None for sample in samples)
    return False


def _validate_rule_order(routes: list[dict[str, Any]]) -> None:
    prefixes: dict[str, str] = {}
    regexes: dict[str, str] = {}
    for route in routes:
        name = route["name"]
        if "path_prefix" in route:
            prefix = route["path_prefix"]
            if prefix in prefixes:
                raise ManifestValidationError(
                    f"duplicate path_prefix {prefix!r}: {prefixes[prefix]} and {name}"
                )
            prefixes[prefix] = name
        if "path_regex" in route:
            expression = route["path_regex"]
            if expression in regexes:
                raise ManifestValidationError(
                    f"duplicate path_regex {expression!r}: {regexes[expression]} and {name}"
                )
            regexes[expression] = name

    for earlier_index, earlier in enumerate(routes):
        if "default" in earlier and earlier_index != len(routes) - 1:
            raise ManifestValidationError(f"default rule {earlier['name']} must be last")
        for later in routes[earlier_index + 1 :]:
            if _routing_signature(earlier) == _routing_signature(later):
                continue
            if "path_prefix" in earlier:
                prefix = earlier["path_prefix"]
                specific = later.get("path") or later.get("path_prefix")
                if isinstance(specific, str) and specific.startswith(prefix) and specific != prefix:
                    raise ManifestValidationError(
                        f"broader rule {earlier['name']} appears before specific rule {later['name']}"
                    )
                if "path_regex" in later:
                    later_expression = re.compile(later["path_regex"])
                    literal_prefix = _regex_literal_prefix(later["path_regex"])
                    if (
                        literal_prefix is not None
                        and literal_prefix.startswith(prefix)
                        or _regex_overlaps_route(later_expression, earlier)
                    ):
                        raise ManifestValidationError(
                            f"broader rule {earlier['name']} appears before specific rule {later['name']}"
                        )
            if "path_regex" in earlier:
                expression = re.compile(earlier["path_regex"])
                if _regex_overlaps_route(expression, later):
                    raise ManifestValidationError(
                        f"regex rule {earlier['name']} overlaps later rule {later['name']}"
                    )


def _is_protected_python_route(route: dict[str, Any]) -> bool:
    if route.get("route_class") == "protected_python":
        return True
    protected_samples = (
        "/stripe-webhook",
        "/api/",
        "/api/stats",
        "/.well-known/example",
        "/agent/example",
        "/track/example",
        "/rb2b-webhook",
    )
    value = route.get("path") or route.get("path_prefix")
    if isinstance(value, str):
        return any(
            value == sample
            or value.startswith(sample)
            or sample.startswith(value) and value not in {"/", ""}
            for sample in protected_samples
        )
    expression = route.get("path_regex")
    if isinstance(expression, str):
        compiled = re.compile(expression)
        return any(compiled.match(sample) is not None for sample in protected_samples)
    return False


def validate_manifest(document: dict[str, Any]) -> None:
    if document.get("schema_version") != 1:
        raise ManifestValidationError("schema_version must be 1")

    routes = document.get("routes")
    if not isinstance(routes, list) or not routes:
        raise ManifestValidationError("routes must be a non-empty list")

    services = document.get("services")
    if not isinstance(services, dict) or not services:
        raise ManifestValidationError("services must be a non-empty object")

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
        elif selector == "path_regex":
            value = route[selector]
            if not isinstance(value, str):
                raise ManifestValidationError(f"route {name} has an invalid path_regex")
            try:
                re.compile(value)
            except re.error as exc:
                raise ManifestValidationError(f"route {name} has invalid path_regex: {exc}") from exc
            if not value.startswith("^/"):
                raise ManifestValidationError(f"route {name} path_regex must start with ^/")
            if re.match(r"^\^/(?:\.\*|\.\+|\(\?:?\.\*)", value):
                raise ManifestValidationError(f"route {name} path_regex is an unbounded catch-all")
            if re.search(r"\([^)]*[+*][^)]*\)[+*{]", value):
                raise ManifestValidationError(
                    f"route {name} path_regex contains a catastrophic nested quantifier"
                )
            end_anchored = value.endswith("$") or value.endswith(r"\Z")
            if not end_anchored and route.get("regex_mode") != "prefix":
                raise ManifestValidationError(
                    f"route {name} path_regex must be end-anchored or declare regex_mode prefix"
                )
            if route.get("regex_mode") not in (None, "prefix"):
                raise ManifestValidationError(f"route {name} has invalid regex_mode")
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
            owner = route.get(owner_field)
            if owner not in ALLOWED_OWNERS:
                raise ManifestValidationError(
                    f"route {name} has invalid {owner_field}: {owner!r}"
                )
            if owner not in services:
                raise ManifestValidationError(
                    f"route {name} {owner_field} {owner!r} is not declared in services"
                )

        current_owner = route["current_owner"]
        target_owner = route["target_owner"]
        gate = route.get("transition_gate")
        if route.get("path") != "/stripe-webhook" and gate is not None and (
            not isinstance(gate, str)
            or not gate.strip()
            or gate.strip().lower() in {"complete", "completed", "deployed", "true", "false"}
        ):
            raise ManifestValidationError(
                f"route {name} requires a named verifiable transition gate"
            )
        if current_owner != target_owner and not isinstance(gate, str):
            raise ManifestValidationError(
                f"route {name} owner change requires a non-empty transition gate"
            )
        target_service = services[target_owner]
        if (
            isinstance(target_service, dict)
            and target_service.get("state") == "target_not_live"
            and not isinstance(gate, str)
        ):
            raise ManifestValidationError(
                f"route {name} target owner {target_owner} is target_not_live and requires a gate"
            )
        if target_owner == "next" and _is_protected_python_route(route):
            raise ManifestValidationError(f"protected Python route {name} cannot target next")

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

    _validate_rule_order(routes)

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
    parser.add_argument(
        "--source",
        type=Path,
        help="Python route source to inspect with AST and check against the manifest",
    )
    args = parser.parse_args()
    try:
        document = load_manifest(args.manifest)
        validate_manifest(document)
        extraction = extract_route_contracts(args.source) if args.source else None
        if extraction is not None:
            validate_route_coverage(document, extraction)
    except ManifestValidationError as exc:
        parser.exit(1, f"invalid service-route manifest: {exc}\n")
    if extraction is None:
        print(f"valid service-route manifest: {args.manifest}")
    else:
        print(
            f"valid service-route manifest: {args.manifest}; "
            f"extracted={len(extraction.contracts)} uncovered=0 "
            f"excluded={len(extraction.diagnostics)}"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
