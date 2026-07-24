#!/usr/bin/env python3
"""Legacy inbox function shim.

Kept for historical references; avoids invalid one-line Python and performs no
network work unless callers inject concrete functions.
"""
from __future__ import annotations

import time
from collections.abc import Callable, Iterable


def main(
    check_inbox: Callable[[], Iterable[str]] | None = None,
    send_response: Callable[[str], None] | None = None,
    log_response: Callable[[str], None] | None = None,
    sleep_seconds: int = 300,
) -> int:
    check_inbox = check_inbox or (lambda: [])
    send_response = send_response or (lambda template: None)
    log_response = log_response or (lambda template: None)
    messages = list(check_inbox())
    if "7 template" in messages:
        send_response("template")
        log_response("template")
    elif "97 audit" in messages:
        send_response("audit")
        log_response("audit")
    if sleep_seconds:
        time.sleep(min(sleep_seconds, 1))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
