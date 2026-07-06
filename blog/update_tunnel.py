#!/usr/bin/env python3
"""Update tunnel config to route blog.nebulacomponents.shop"""
import json, os

tid = "8cfcc2e1-cf49-4d57-b412-c1ec0474ffd2"

config = {
    "tunnel": tid,
    "credentials-file": os.path.expanduser(f"~/.cloudflared/{tid}.json"),
    "ingress": [
        {"hostname": "nebulacomponents.shop", "service": "http://localhost:8765"},
        {"hostname": "www.nebulacomponents.shop", "service": "http://localhost:8765"},
        {"hostname": "blog.nebulacomponents.shop", "service": "http://localhost:8766"},
        {"service": "http_status:404"}
    ]
}

with open(os.path.expanduser("~/.cloudflared/config.yml"), "w") as f:
    json.dump(config, f, indent=2)

print("Config updated with blog.nebulacomponents.shop -> :8766")
