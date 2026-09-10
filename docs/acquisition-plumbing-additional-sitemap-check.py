"""Read-only additional canonical candidates from filesystem inventory."""
import importlib.util
import json
from pathlib import Path

root = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('baseline', root / 'acquisition-plumbing-live-baseline.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
paths = ['/mobile-viewport-conversion-rates', '/free-landing-page-audit-tools-startups', '/landing-page-performance-analysis', '/status', '/cro-agency-alternative', '/landing-page-code-fixes', '/landing-page-mistakes', '/no-retainer-cro-tools', '/audit/compare']
rows = [module.fetch(path) for path in paths]
(root / 'acquisition-plumbing-additional-sitemap-baseline.json').write_text(json.dumps(rows, indent=2) + '\n')
print(json.dumps(rows, indent=2))
