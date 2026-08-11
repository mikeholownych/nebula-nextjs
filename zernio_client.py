#!/usr/bin/env python3
"""
Zernio REST API Client - v0
Single source of truth for Zernio social-scheduling calls (outreach use).

API base: https://zernio.com/api/v1
Auth:     Bearer token from ZERNIO_API_KEY (env or .env)
Docs:     https://zernio.com/llms.txt  (machine-readable surface)

Safety:
  - create_post() defaults to isDraft=True. Publishing requires an explicit
    publish_now=True / scheduled_for argument at the call site.
  - The API key is NEVER hardcoded; read from env only.

Usage:
    from zernio_client import ZernioClient
    z = ZernioClient()
    profiles = z.list_profiles()
    accounts = z.list_accounts()
    post = z.create_post(content="...", platform="twitter", account_id="acc_...",
                         draft=True)
"""

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Optional

BASE = "https://zernio.com/api/v1"
ENV_KEY = "ZERNIO_API_KEY"


class ZernioError(Exception):
    """Raised on non-2xx Zernio API responses."""


class ZernioClient:
    def __init__(self, api_key: Optional[str] = None) -> None:
        self.api_key = api_key or os.environ.get(ENV_KEY)
        if not self.api_key:
            raise ZernioError(f"{ENV_KEY} not set - add it to .env (see zernio.com/auth.md)")

    # ── Low-level ────────────────────────────────────────────────────────

    def _request(self, method: str, path: str, body: Optional[dict] = None) -> dict:
        url = BASE + path
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(
            url,
            data=data,
            method=method,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                raw = resp.read().decode()
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as e:
            detail = e.read().decode()[:300]
            raise ZernioError(f"{method} {path} -> HTTP {e.code}: {detail}") from e

    # ── Profiles ────────────────────────────────────────────────────────

    def list_profiles(self) -> list:
        return self._request("GET", "/profiles").get("profiles", [])

    def create_profile(self, name: str, description: str = "", color: str = "#00c2a0") -> dict:
        return self._request("POST", "/profiles", {"name": name, "description": description, "color": color})

    # ── Accounts (read-only) ────────────────────────────────────────────

    def list_accounts(self, profile_id: Optional[str] = None) -> list:
        q = f"?profileId={urllib.parse.quote(profile_id)}" if profile_id else ""
        return self._request("GET", f"/accounts{q}").get("accounts", [])

    # ── Reddit (authenticated via connected account; read-only) ──────────

    def list_reddit_subreddits(self, account_id: str) -> list:
        return self._request("GET", f"/accounts/{account_id}/reddit-subreddits").get("subreddits", [])

    def search_reddit(
        self,
        account_id: str,
        q: str,
        subreddit: Optional[str] = None,
        *,
        sort: str = "new",
        limit: int = 25,
        restrict_sr: bool = False,
        after: Optional[str] = None,
    ) -> dict:
        """
        Search Reddit posts via the connected account (authenticated OAuth -
        the compliant path; Reddit blocks anonymous datacenter scraping).
        Rate limits: Reddit API is ~60 req/min; Zernio free tier is 60 req/min.
        Keep call sites to <=1 req / 2s and limit to <=25 results.
        """
        params = {"accountId": account_id, "q": q, "sort": sort, "limit": str(limit)}
        if subreddit:
            params["subreddit"] = subreddit
        if restrict_sr:
            params["restrict_sr"] = "1"
        if after:
            params["after"] = after
        qs = urllib.parse.urlencode(params)
        return self._request("GET", f"/reddit/search?{qs}")

    def get_reddit_feed(
        self,
        account_id: str,
        subreddit: Optional[str] = None,
        *,
        sort: str = "hot",
        limit: int = 25,
        t: Optional[str] = None,
        after: Optional[str] = None,
    ) -> dict:
        """Fetch a subreddit feed via the connected account (read-only)."""
        params = {"accountId": account_id, "sort": sort, "limit": str(limit)}
        if subreddit:
            params["subreddit"] = subreddit
        if t:
            params["t"] = t
        if after:
            params["after"] = after
        qs = urllib.parse.urlencode(params)
        return self._request("GET", f"/reddit/feed?{qs}")

    # ── Posts ───────────────────────────────────────────────────────────

    def create_post(
        self,
        content: str,
        platform: str,
        account_id: str,
        *,
        draft: bool = True,
        scheduled_for: Optional[str] = None,
        publish_now: bool = False,
        title: str = "",
        hashtags: Optional[list] = None,
        tags: Optional[list] = None,
        profile_id: Optional[str] = None,
        timezone: str = "UTC",
        subreddit: Optional[str] = None,
    ) -> dict:
        """
        Create a post. SAFE BY DEFAULT: draft=True stores a draft and publishes
        nothing. To actually publish, pass draft=False AND either scheduled_for
        (future ISO timestamp) or publish_now=True - never both silently.
        """
        if publish_now and scheduled_for:
            raise ZernioError("publish_now and scheduled_for are mutually exclusive")
        platform_entry: dict[str, Any] = {"platform": platform, "accountId": account_id}
        if subreddit:
            platform_entry["platformSpecificData"] = {"subreddit": subreddit}
        body: dict[str, Any] = {
            "content": content,
            "isDraft": bool(draft),
            "publishNow": bool(publish_now),
            "timezone": timezone,
            "platforms": [platform_entry],
        }
        if scheduled_for:
            body["scheduledFor"] = scheduled_for
        if title:
            body["title"] = title
        if hashtags:
            body["hashtags"] = hashtags
        if tags:
            body["tags"] = tags
        if profile_id:
            body["profileId"] = profile_id
        return self._request("POST", "/posts", body)

    def list_posts(self, status: Optional[str] = None, limit: int = 10) -> list:
        params = {"limit": str(limit)}
        if status:
            params["status"] = status
        q = urllib.parse.urlencode(params)
        return self._request("GET", f"/posts?{q}").get("posts", [])

    def get_post(self, post_id: str) -> dict:
        return self._request("GET", f"/posts/{post_id}")

    def update_post(self, post_id: str, **fields) -> dict:
        return self._request("PUT", f"/posts/{post_id}", fields)

    def delete_post(self, post_id: str) -> dict:
        return self._request("DELETE", f"/posts/{post_id}")


if __name__ == "__main__":
    import sys

    z = ZernioClient()
    print("=== profiles ===")
    for p in z.list_profiles():
        print(" -", p.get("_id"), p.get("name"), "| default:", p.get("isDefault"))
    print("=== accounts ===")
    for a in z.list_accounts():
        print(" -", a.get("platform"), a.get("username"), a.get("_id"))
    if not z.list_accounts():
        print(" (none connected - connect accounts on the Zernio dashboard first)")
    sys.exit(0)
