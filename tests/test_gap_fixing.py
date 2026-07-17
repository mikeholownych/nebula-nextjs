"""Tests for OPS-01 gap fixes."""
import ast
import copy
from pathlib import Path
import re
import pytest

from scripts.validate_service_routes import (
    ManifestValidationError,
    _RouteContractVisitor,
    extract_route_contracts,
    validate_manifest,
    _regex_literal_prefix,
    _route_selector,
    _regex_overlaps_route,
    _routing_signature,
)


# Gap 1: re.compile(PATTERN) with named constant - AST sees name but constant resolution missing
def test_gap1_named_constant_regex():
    """Test that re.compile(PATTERN) where PATTERN is a string constant is resolved."""
    code = """
PATTERN = r'^/api/[a-z]+$'
import re
regex = re.compile(PATTERN)
"""
    tree = ast.parse(code)
    visitor = _RouteContractVisitor(tree)
    visitor.visit(tree)
    
    # Should extract the regex contract
    contracts = visitor.contracts
    
    # Check that PATTERN constant was resolved
    assert any(c.selector == "path_regex" and c.value == r'^/api/[a-z]+$' for c in contracts), \
        f"Expected regex contract for PATTERN, got {contracts}"


# Gap 2: Scope+order-aware AST bindings, dynamic rebinding diagnostic
def test_gap2_scoped_bindings():
    """Test that bindings respect lexical scope and detect dynamic rebinding."""
    code = """
def func1():
    PATTERN = r'^/api/v1/[a-z]+$'
    import re
    regex = re.compile(PATTERN)

def func2():
    PATTERN = r'^/api/v2/[a-z]+$'  # Same name, different scope
    import re
    regex = re.compile(PATTERN)

class MyClass:
    PATTERN = r'^/static/.*$'  # Class-level constant
    def method(self):
        import re
        regex = re.compile(self.PATTERN)
"""
    tree = ast.parse(code)
    visitor = _RouteContractVisitor(tree)
    visitor.visit(tree)
    
    # Should extract multiple regex contracts
    contracts = visitor.contracts
    patterns = sorted([c.value for c in contracts if c.selector == "path_regex"])
    
    # Since scoped bindings aren't properly handled yet, this will fail
    # Once fixed, should get all three patterns
    expected_patterns = [
        r'^/api/v1/[a-z]+$',
        r'^/api/v2/[a-z]+$',
        r'^/static/.*$'
    ]
    assert sorted(patterns) == sorted(expected_patterns), \
        f"Expected pattern contracts from all scopes, got {patterns}"


# Gap 4: Equal-valued prefix before exact route with different owner/gate
def test_gap4_equal_prefix_exact_precedence():
    """Equal-valued prefix should be rejected before exact route."""
    manifest = {
        "routes": [
            {
                "name": "prefix_route",
                "path_prefix": "/api",
                "current_owner": "agentic_server",
            },
            {
                "name": "exact_route", 
                "path": "/api",
                "target_owner": "platform_api",
                "transition_gate": "verified_migration",
            },
        ],
    }
    
    # This should raise an error: prefix matches exact value
    with pytest.raises(ManifestValidationError):
        validate_manifest(manifest)


# Gap 5: Genuinely non-identical equivalent regex detection
def test_gap5_equivalent_regex_detection():
    """Non-identical but equivalent regex patterns should be detected as duplicates."""
    manifest = {
        "routes": [
            {
                "name": "regex1",
                "path_regex": "^/users/[0-9]+$",
                "current_owner": "agentic_server",
            },
            {
                "name": "regex2", 
                "path_regex": "^/users/\\d+$",  # Equivalent to [0-9]+
                "target_owner": "platform_api",
                "transition_gate": "verified_migration",
            },
        ],
    }
    
    # These regex patterns are equivalent but syntactically different
    # Should be detected as overlapping/conflicting
    with pytest.raises(ManifestValidationError):
        validate_manifest(manifest)


# Gap 6: Alternate root catch-all detection
def test_gap6_alternate_root_catch_all():
    """Test detection of alternate root catch-all patterns."""
    test_patterns = [
        r'^/.*$',  # Already caught
        r'^/.+$',  # Already caught  
        r'^/(?:.*)$',  # Group variant
        r'^/[\\s\\S]*$',  # Unicode catch-all
        r'^/[\\w\\W]*$',  # Another catch-all
        r'^/[\\d\\D]*$',  # Yet another catch-all
        r'^/[^]*$',  # Empty-negation catch-all
    ]
    
    for pattern in test_patterns:
        # All these should be rejected as unbounded catch-all
        with pytest.raises(ManifestValidationError):
            validate_manifest({
                "routes": [{
                    "name": "test",
                    "path_regex": pattern,
                    "current_owner": "agentic_server",
                }]
            })


# Gap 7: Non-bypassable protected route classification
def test_gap7_protected_route_classification():
    """Protected routes without explicit route_class should still be protected."""
    manifest = {
        "routes": [
            {
                "name": "stripe_hook",
                "path": "/stripe-webhook",
                "target_owner": "next",  # Should be rejected!
            },
        ],
    }
    
    # Since stripe-webhook is in protected_samples, it shouldn't target next
    # Even without explicit route_class field
    with pytest.raises(ManifestValidationError):
        validate_manifest(manifest)
    
    # Double-check with other protected samples
    manifest2 = {
        "routes": [
            {
                "name": "api_route",
                "path": "/api/stats",
                "target_owner": "next",
            },
        ],
    }
    
    with pytest.raises(ManifestValidationError):
        validate_manifest(manifest2)


# Helper test for regex equivalence detection
def test_regex_equivalence():
    """Test regex equivalence detection."""
    patterns = [
        (r'^/users/[0-9]+$', r'^/users/\d+$', True),  # Equivalent
        (r'^/api/v[12]$', r'^/api/v[21]$', True),  # Same character class
        (r'^/a\.b$', r'^/a\.b$', True),  # Identical escaped
        (r'^/a*b$', r'^/a*b$', True),  # Identical simple
        (r'^/a+b$', r'^/a+$', False),  # Different
        (r'^/[a-z]$', r'^/[A-Z]$', False),  # Different ranges
        (r'^/\\.*$', r'^/.*$', False),  # Different (escaped vs literal dot)
    ]
    
    for pattern1, pattern2, should_be_equivalent in patterns:
        # This tests equivalence logic that should be in _regex_overlaps_route
        # For now just check compilation
        re.compile(pattern1)
        re.compile(pattern2)
        
        # TODO: Implement equivalence check
        print(f"Pattern equivalence: {pattern1!r} vs {pattern2!r} should_be={should_be_equivalent}")