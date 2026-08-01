"""Platform API middleware package."""

import importlib.util
import os

# Re-export from the flat middleware.py (sibling file at platform_api/middleware.py)
# so existing imports like `from platform_api.middleware import setup_cors` keep working.
_flat_path = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', 'middleware.py'))
_spec = importlib.util.spec_from_file_location('_platform_api_middleware_flat', _flat_path)
_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)  # type: ignore[union-attr]

setup_cors = _mod.setup_cors
setup_middleware = _mod.setup_middleware

from .rate_limit import setup_rate_limiting, RateLimitMiddleware  # noqa: E402

__all__ = ['setup_cors', 'setup_middleware', 'setup_rate_limiting', 'RateLimitMiddleware']
