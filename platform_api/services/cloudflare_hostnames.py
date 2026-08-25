"""Small Cloudflare Custom Hostnames adapter used by tenant provisioning."""

import os
from typing import Any

import httpx


class CloudflareNotConfigured(RuntimeError):
    pass


class CloudflareHostnamesAdapter:
    def __init__(self) -> None:
        self.zone_id = os.getenv("CLOUDFLARE_ZONE_ID")
        self.api_token = os.getenv("CLOUDFLARE_API_TOKEN")
        if not self.zone_id or not self.api_token:
            raise CloudflareNotConfigured("Cloudflare Custom Hostnames is not configured")
        self.base = f"https://api.cloudflare.com/client/v4/zones/{self.zone_id}/custom_hostnames"

    async def _request(self, method: str, url: str, **kwargs: Any) -> dict:
        headers = {"Authorization": f"Bearer {self.api_token}", "Content-Type": "application/json"}
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.request(method, url, headers=headers, **kwargs)
        data = response.json()
        if response.status_code >= 400 or not data.get("success"):
            raise RuntimeError("Cloudflare Custom Hostnames request failed")
        return data

    async def create_hostname(self, hostname: str) -> dict:
        return await self._request("POST", self.base, json={"hostname": hostname})

    async def get_hostname_status(self, hostname: str) -> dict:
        data = await self._request("GET", self.base, params={"hostname": hostname})
        results = data.get("result") or []
        return results[0] if results else {}

    async def delete_hostname(self, hostname_id: str) -> None:
        await self._request("DELETE", f"{self.base}/{hostname_id}")
