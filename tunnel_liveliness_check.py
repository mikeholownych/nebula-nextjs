#!/usr/bin/env python3
"""
Tunnel Liveliness Check
Checks that Cloudflare tunnel (nebulacomponents.shop) is responsive
and in sync with local endpoints (localhost:8765, localhost:8766).
Logs to tunnel_liveliness.log and tunnel_metrics.json.
"""
import os
import json
import datetime
import urllib.request
import urllib.error

BASE_DIR = "/home/mike/nebula"
LOG_FILE = os.path.join(BASE_DIR, "tunnel_liveliness.log")
METRICS_FILE = os.path.join(BASE_DIR, "tunnel_metrics.json")

LOCAL_ENDPOINTS = [
    ("main",  "http://localhost:8765"),
    ("blog",  "http://localhost:8766"),
]
TUNNEL_ENDPOINTS = [
    ("main",  "https://nebulacomponents.shop"),
    ("www",   "https://www.nebulacomponents.shop"),
    ("blog",  "https://blog.nebulacomponents.shop"),
]


def http_check(url, timeout=10):
    """Return (status_code, ok) — ok means 2xx or 3xx (no redirect following)."""
    try:
        import requests as _req
        r = _req.get(url, timeout=timeout, allow_redirects=False,
                     headers={"User-Agent": "TunnelLivelinessCheck/1.0"})
        return r.status_code, (r.status_code < 500)
    except Exception:
        pass
    # fallback: urllib without redirect
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "TunnelLivelinessCheck/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, True
    except urllib.error.HTTPError as e:
        return e.code, (e.code < 500)
    except Exception:
        return 0, False


def load_metrics():
    if os.path.exists(METRICS_FILE):
        try:
            with open(METRICS_FILE) as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "checks_total": 0,
        "tunnel_up": 0,
        "tunnel_down": 0,
        "local_up": 0,
        "local_down": 0,
        "sync": 0,
        "out_of_sync": 0,
        "uptime_pct": 0.0,
        "last_check": None,
        "last_status": None,
        "alerts": [],
    }


def save_metrics(m):
    with open(METRICS_FILE, "w") as f:
        json.dump(m, f, indent=2)


def run_check():
    now = datetime.datetime.utcnow().isoformat() + "Z"
    metrics = load_metrics()

    # --- Local checks ---
    local_results = {}
    for name, url in LOCAL_ENDPOINTS:
        code, ok = http_check(url)
        local_results[name] = {"url": url, "code": code, "ok": ok}

    local_ok = any(r["ok"] for r in local_results.values())

    # --- Tunnel checks ---
    tunnel_results = {}
    for name, url in TUNNEL_ENDPOINTS:
        code, ok = http_check(url)
        tunnel_results[name] = {"url": url, "code": code, "ok": ok}

    tunnel_ok = any(r["ok"] for r in tunnel_results.values())

    # --- Update metrics ---
    metrics["checks_total"] += 1
    metrics["last_check"] = now

    if local_ok:
        metrics["local_up"] += 1
    else:
        metrics["local_down"] += 1

    if tunnel_ok:
        metrics["tunnel_up"] += 1
    else:
        metrics["tunnel_down"] += 1

    if tunnel_ok and local_ok:
        metrics["sync"] += 1
        status = "OK"
    elif not tunnel_ok and local_ok:
        metrics["out_of_sync"] += 1
        status = "CRITICAL"
        alert_msg = f"[{now}] CRITICAL: Tunnel DOWN while local endpoint is UP"
        metrics["alerts"].append(alert_msg)
        # Keep last 50 alerts
        metrics["alerts"] = metrics["alerts"][-50:]
    elif not tunnel_ok and not local_ok:
        metrics["out_of_sync"] += 1
        status = "BOTH_DOWN"
    else:
        metrics["sync"] += 1
        status = "TUNNEL_ONLY"

    total = metrics["checks_total"]
    up = metrics["tunnel_up"]
    metrics["uptime_pct"] = round((up / total * 100), 2) if total > 0 else 0.0
    metrics["last_status"] = status

    save_metrics(metrics)

    # --- Log entry ---
    log_entry = {
        "ts": now,
        "status": status,
        "tunnel_ok": tunnel_ok,
        "local_ok": local_ok,
        "tunnel_results": tunnel_results,
        "local_results": local_results,
        "uptime_pct": metrics["uptime_pct"],
        "checks_total": metrics["checks_total"],
    }

    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(log_entry) + "\n")

    # --- Console output ---
    tunnel_icon = "✅" if tunnel_ok else "❌"
    local_icon  = "✅" if local_ok  else "❌"
    print(f"[{now}] {status} | Tunnel {tunnel_icon} | Local {local_icon} | Uptime: {metrics['uptime_pct']:.1f}% ({up}/{total})")

    for name, r in tunnel_results.items():
        print(f"  tunnel.{name}: {r['url']} → {r['code']} {'✅' if r['ok'] else '❌'}")
    for name, r in local_results.items():
        print(f"  local.{name}: {r['url']} → {r['code']} {'✅' if r['ok'] else '❌'}")

    if status == "CRITICAL":
        print(f"\n🚨 ALERT: Tunnel is DOWN while local endpoint is UP!")
        print(f"   Tunnel ID: 8cfcc2e1-cf49-4d57-b412-c1ec0474ffd2")

    return status, tunnel_ok, local_ok, metrics


if __name__ == "__main__":
    run_check()
