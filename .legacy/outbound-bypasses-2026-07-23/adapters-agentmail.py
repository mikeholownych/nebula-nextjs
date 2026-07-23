"""Adapter for AgentMail API calls.
Provides functions to create inbox and handle generic API requests.
Encapsulates raw HTTP handling, keeping core code clean.
"""
import json, urllib.request, sys

BASE = "https://api.agentmail.to"

def _load_api_key():
    try:
        with open("/tmp/am_key.txt", "r") as f:
            return f.read().strip()
    except Exception:
        print("ERROR: Create /tmp/am_key.txt with the API key first")
        sys.exit(1)

API_KEY = _load_api_key()
HEADERS = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

def api(method, path, data=None):
    url = f"{BASE}{path}"
    payload = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=payload, headers=HEADERS, method=method)
    try:
        resp = urllib.request.urlopen(req, timeout=30)
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  HTTP {e.code}: {body[:300]}")
        return {"error": body[:300]}
    except Exception as e:
        print(f"  Error: {e}")
        return {"error": str(e)}

def create_inbox(username="hello", display_name="Nebula Components"):
    r = api("POST", "/inboxes", {"username": username, "display_name": display_name})
    inbox_id = r.get("inbox_id") or r.get("id")
    if not inbox_id:
        # fallback: list inboxes and pick first ID
        r2 = api("GET", "/inboxes")
        for item in r2.get("inboxes") or r2.get("result") or []:
            iid = item.get("inbox_id") or item.get("id")
            if iid:
                inbox_id = iid
                break
    return inbox_id, r
