"""Adapter for Cloudflare API calls.
Encapsulates raw HTTP requests and provides higher‑level methods used by the nebula code.
"""
import json, urllib.request
from ..errors.app_error import AppError

class CloudflareAdapter:
    BASE = "https://api.cloudflare.com/client/v4"

    def __init__(self, token: str):
        self.headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    def _request(self, method: str, path: str, data=None):
        url = f"{self.BASE}{path}"
        payload = json.dumps(data).encode() if data else None
        req = urllib.request.Request(url, data=payload, headers=self.headers, method=method)
        try:
            resp = urllib.request.urlopen(req, timeout=30)
            return json.loads(resp.read())
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            raise AppError('CLOUDFLARE_HTTP', f"HTTP {e.code}: {body[:200]}")
        except Exception as e:
            raise AppError('CLOUDFLARE_ERROR', str(e))

    # ---------------------------------------------------------------------
    # High‑level helpers used by the setup script
    # ---------------------------------------------------------------------
    def get_account(self):
        data = self._request("GET", "/accounts")
        if not data.get("success"):
            raise AppError('CLOUDFLARE_ACCOUNT', data.get('errors', ['unknown'])[0])
        return data["result"][0]["id"]

    def get_zone(self, zone_name: str):
        data = self._request("GET", f"/zones?name={zone_name}")
        if not data.get("success") or not data.get("result"):
            raise AppError('CLOUDFLARE_ZONE', f"Zone {zone_name} not found")
        return data["result"][0]["id"]

    def list_tunnels(self, account_id: str):
        return self._request("GET", f"/accounts/{account_id}/cfd_tunnel").get("result", [])

    def create_tunnel(self, account_id: str, name: str):
        return self._request("POST", f"/accounts/{account_id}/cfd_tunnel", {"name": name, "config_src": "cloudflared"})

    def ensure_tunnel(self, account_id: str, name: str):
        # Try create, fall back to existing
        try:
            resp = self.create_tunnel(account_id, name)
            if resp.get("success"):
                return resp["result"]["id"], resp["result"]["token"]
        except AppError as e:
            # If tunnel already exists, ignore error and find it
            pass
        tunnels = self.list_tunnels(account_id)
        for t in tunnels:
            if t.get("name") == name:
                return t["id"], t.get("token", "")
        raise AppError('CLOUDFLARE_TUNNEL', f"Unable to ensure tunnel {name}")

    def set_cname_record(self, zone_id: str, name: str, target: str):
        payload = {"type": "CNAME", "name": name, "content": target, "proxied": True}
        resp = self._request("POST", f"/zones/{zone_id}/dns_records", payload)
        return resp.get("success", False)

    def save_credentials(self, tunnel_id: str, tunnel_token: str, account_id: str):
        import os
        os.makedirs(os.path.expanduser("~/.cloudflared"), exist_ok=True)
        creds = {"AccountTag": account_id, "TunnelSecret": tunnel_token, "TunnelID": tunnel_id, "TunnelName": "nebula-shop"}
        with open(os.path.expanduser(f"~/.cloudflared/{tunnel_id}.json"), "w") as f:
            json.dump(creds, f)
        config = {
            "tunnel": tunnel_id,
            "credentials-file": os.path.expanduser(f"~/.cloudflared/{tunnel_id}.json"),
            "warp-routing": {"enabled": False},
            "origin-connect-timeout": "30s",
            "ingress": [
                {"hostname": "nebulacomponents.shop", "service": "http://localhost:8765"},
                {"hostname": "www.nebulacomponents.shop", "service": "http://localhost:8765"},
                {"service": "http_status:404"}
            ]
        }
        with open(os.path.expanduser("~/.cloudflared/config.yml"), "w") as f:
            json.dump(config, f, indent=2)
