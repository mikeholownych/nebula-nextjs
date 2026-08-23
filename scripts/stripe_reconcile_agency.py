#!/usr/bin/env python3
"""Create the Agency $497/mo price, deactivate legacy $199/$1990 agency prices.

Idempotent: reuses an active 49700-cent monthly USD price under the existing
Agency product when present. Prints the new price id to stdout (ids are public).
"""
import json
import os
import sys
import urllib.request

API = "https://api.stripe.com/v1"
AGENCY_PRODUCT = "prod_V0miqtrSEnPtiC"
LEGACY_PRICES = [
    "price_1U0l9CEINR1kU9chAZGBoJHS",   # $199/mo
    "price_1U0l9CEINR1kU9chITjlRF0H",   # $1990/yr
]


def _req(method: str, path: str, form: dict | None = None) -> dict:
    key = os.environ["STRIPE_SECRET_KEY"]
    data = "&".join(f"{k}={v}" for k, v in (form or {}).items()).encode()
    req = urllib.request.Request(f"{API}{path}", data=data, method=method)
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)


def main() -> int:
    # Find an existing active $49700 monthly price on the Agency product.
    found = None
    params = "product=" + AGENCY_PRODUCT + "&active=true&limit=100"
    for p in _req("GET", f"/prices?{params}")["data"]:
        if p.get("unit_amount") == 49700 and p.get("recurring", {}).get("interval") == "month":
            found = p
            break
    if not found:
        found = _req("POST", "/prices", {
            "product": AGENCY_PRODUCT,
            "unit_amount": "49700",
            "currency": "usd",
            "recurring[interval]": "month",
            "nickname": "Agency monthly",
        })
    print(found["id"])

    for lp in LEGACY_PRICES:
        try:
            _req("POST", f"/prices/{lp}", {"active": "false"})
        except Exception as exc:  # noqa: BLE001 - report but continue
            print(f"WARN deactivating {lp}: {exc}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
