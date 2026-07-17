"""Test binding collection."""
import ast
from scripts.validate_service_routes import _RouteContractVisitor


def test_collect_bindings():
    """Test that bindings are collected properly."""
    code = """
PATTERN = r'^/api/[a-z]+$'
import re
regex = re.compile(PATTERN)
other = re.compile(r'^/other/\\d+$')
"""
    tree = ast.parse(code)
    visitor = _RouteContractVisitor(tree)
    
    # Check constants
    print(f"Constants: {visitor.constants}")
    print(f"Regexes: {visitor.regexes}")
    
    # PATTERN should be in constants
    assert "PATTERN" in visitor.constants
    assert visitor.constants["PATTERN"] == (r'^/api/[a-z]+$',)
    
    # regex should be in regexes with resolved pattern
    assert "regex" in visitor.regexes
    assert visitor.regexes["regex"] == r'^/api/[a-z]+$'
    
    # other should be in regexes
    assert "other" in visitor.regexes
    assert visitor.regexes["other"] == r'^/other/\d+$'