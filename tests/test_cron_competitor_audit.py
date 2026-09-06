import importlib.util
from pathlib import Path

SCRIPT = Path(__file__).parents[1] / 'scripts/cron_competitor_audit.py'


def load_module():
    spec = importlib.util.spec_from_file_location('cron_competitor_audit_under_test', SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_parser_supports_explicit_dry_run_only():
    module = load_module()
    assert module.parse_args(['--dry-run']).dry_run is True
    assert module.parse_args([]).dry_run is False


def test_dry_run_does_not_allow_audit_submission():
    module = load_module()
    assert module.should_submit_audit(dry_run=False) is True
    assert module.should_submit_audit(dry_run=True) is False
