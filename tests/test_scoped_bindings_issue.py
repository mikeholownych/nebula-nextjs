"""Test scoped bindings issue."""
import ast
from scripts.validate_service_routes import _RouteContractVisitor


def test_scoped_binding_overwrite():
    """Test that scoped bindings overwrite each other."""
    code = """
def func1():
    PATTERN = r'^/api/v1/[a-z]+$'
    import re
    regex = re.compile(PATTERN)
    if regex.match(path):
        pass

def func2():
    PATTERN = r'^/api/v2/[a-z]+$'  # Same name, different scope - overwrites
    import re
    regex = re.compile(PATTERN)
    if regex.match(path):
        pass
"""
    tree = ast.parse(code)
    visitor = _RouteContractVisitor(tree)
    visitor.visit(tree)
    
    contracts = visitor.contracts
    patterns = [c.value for c in contracts if c.selector == "path_regex"]
    
    print(f"Found patterns: {patterns}")
    print(f"Constants dict: {visitor.constants}")
    
    # Problem: only one PATTERN value is stored in constants
    # So we might only get one contract instead of two
    # Actually both might work if they're extracted before being overwritten?
    # Need to check the order of collection vs usage...