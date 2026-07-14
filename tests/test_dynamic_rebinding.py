"""Test dynamic rebinding detection."""
import ast
from scripts.validate_service_routes import _RouteContractVisitor


def test_dynamic_rebinding():
    """Test that dynamic rebinding is detected."""
    code = """
PATTERN = r'^/api/v1/[a-z]+$'
import re
regex = re.compile(PATTERN)
if regex.match(path):
    pass

# Later redefinition - dynamic rebinding
PATTERN = r'^/api/v2/[a-z]+$'
regex2 = re.compile(PATTERN)
if regex2.match(path):
    pass
"""
    tree = ast.parse(code)
    visitor = _RouteContractVisitor(tree)
    visitor.visit(tree)
    
    contracts = visitor.contracts
    patterns = [c.value for c in contracts if c.selector == "path_regex"]
    
    print(f"Contracts: {contracts}")
    print(f"Patterns: {patterns}")
    
    # With current implementation, we might lose the first pattern
    # Or get incorrect duplicates
    
    # Actually, we should detect this as problematic - dynamic rebinding