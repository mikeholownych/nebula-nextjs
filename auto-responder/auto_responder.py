#!/usr/bin/env python3
"""Legacy auto-responder loop shim.

The production responder lives elsewhere. This file is kept syntactically valid
so repository-wide import/syntax checks stay useful.
"""
from __future__ import annotations

from collections.abc import Callable, Iterable
import time
from typing import Any


def run_once(
    check_inbox: Callable[[], Iterable[str] | str | bool] | None = None,
    send_response: Callable[[str], None] | None = None,
    log_response: Callable[[str], None] | None = None,
) -> bool:
    check_inbox = check_inbox or (lambda: False)
    send_response = send_response or (lambda template: None)
    log_response = log_response or (lambda template: None)
    inbox_updated: Any = check_inbox()
    if not inbox_updated:
        return False
    if isinstance(inbox_updated, str):
        text = inbox_updated
    elif isinstance(inbox_updated, Iterable):
        text = " ".join(str(item) for item in inbox_updated)
    else:
        text = str(inbox_updated)
    for template in ("$7 template", "$97 audit"):
        if template in text:
            send_response(template)
            log_response(template)
            return True
    return False


def main(interval_seconds: int = 300) -> int:
    while True:
        run_once()
        time.sleep(interval_seconds)


if __name__ == "__main__":
    raise SystemExit(main())
