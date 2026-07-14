"""Test for Gap 1 with simpler example."""
import ast
from scripts.validate_service_routes import _RouteContractVisitor


def test_named_constant_with_usage():
    """Test that re.compile(PATTERN) then regex.match(path) works."""
    code = """
PATTERN = r'^/api/[a-z]+$'
import re
regex = re.compile(PATTERN)

# Actual usage that should trigger extraction
if regex.match(path):
    pass
"""
    tree = ast.parse(code)
    visitor = _RouteContractVisitor(tree)
    visitor.visit(tree)
    
    contracts = visitor.contracts
    print(f"Contracts: {contracts}")
    
    # Should extract the regex contract from the match call
    assert any(c.selector == "path_regex" and c.value == r'^/api/[a-z]+$' for c in contracts), \
        f"Expected regex contract, got {contracts}"


def test_direct_compile():
    """Test re.compile with direct string."""
    code = """
import re
regex = re.compile(r'^/api/[a-z]+$')
if regex.match(path):
    pass
"""
    tree = ast.parse(code)
    visitor = _RouteContractVisitor(tree)
    visitor.visit(tree)
    
    contracts = visitor.contracts
    print(f"Direct compile contracts: {contracts}")
    
    assert any(c.selector == "path_regex" and c.value == r'^/api/[a-z]+$' for c in contracts), \
        f"Expected regex contract for direct compile, got {contracts}"