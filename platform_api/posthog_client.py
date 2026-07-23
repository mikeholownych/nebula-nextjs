"""PostHog SDK client singleton for server-side analytics."""

import atexit
import warnings
from typing import Optional

from posthog import Posthog

_client: Optional[Posthog] = None


def init_posthog(api_key: str, host: str, debug: bool = False) -> Posthog:
    """Create the PostHog client, register shutdown, and return it."""
    global _client
    _client = Posthog(
        project_api_key=api_key,
        host=host,
        debug=debug,
        enable_exception_autocapture=True,
    )
    atexit.register(_client.shutdown)
    return _client


def get_posthog() -> Optional[Posthog]:
    """Return the active PostHog client, or None if not configured."""
    return _client


def shutdown_posthog() -> None:
    """Flush and shut down the PostHog client."""
    if _client is not None:
        _client.shutdown()


def warn_missing_token(var: str = "POSTHOG_PROJECT_TOKEN") -> None:
    """Emit a loud warning in dev when the PostHog token is not configured."""
    warnings.warn(
        f"{var} variable required by PostHog is missing or un-configured, "
        "this causes events to be silently missed. "
        f"This error stops appearing once {var} is configured",
        stacklevel=2,
    )
