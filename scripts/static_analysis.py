"""Static analysis script for Nebula codebase.
- Detects nested `if` statements (depth >= 2).
- Detects generic `raise Exception` usages (should be replaced with AppError).
Generates a simple report printed to stdout.
"""
import ast, os, sys

REPORT = []

def analyze_file(path):
    try:
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            source = f.read()
    except Exception as e:
        REPORT.append(f"[ReadError] {path}: {e}")
        return
    try:
        tree = ast.parse(source, filename=path)
    except SyntaxError as e:
        REPORT.append(f"[SyntaxError] {path}: {e}")
        return
    class Analyzer(ast.NodeVisitor):
        def __init__(self):
            self.if_depth = 0
        def visit_If(self, node):
            self.if_depth += 1
            if self.if_depth >= 2:
                REPORT.append(f"[NestedIf] {path}:{node.lineno} depth={self.if_depth}")
            self.generic_visit(node)
            self.if_depth -= 1
        def visit_Raise(self, node):
            # Detect raise Exception (generic)
            if isinstance(node.exc, ast.Call) and getattr(node.exc.func, 'id', None) == 'Exception':
                REPORT.append(f"[GenericRaise] {path}:{node.lineno}")
            self.generic_visit(node)
    Analyzer().visit(tree)

def main():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    for dirpath, dirnames, filenames in os.walk(root):
        # Skip virtual environment directories
        dirnames[:] = [d for d in dirnames if d not in ('venv', 'env', '__pycache__')]
        for fn in filenames:
            if fn.endswith('.py'):
                analyze_file(os.path.join(dirpath, fn))
    if not REPORT:
        print('No issues found.')
    else:
        for line in REPORT:
            print(line)

if __name__ == '__main__':
    main()
