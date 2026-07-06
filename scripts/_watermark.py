#!/usr/bin/env python3
"""Watermark helper for tracking seen items across runs."""

import json
from pathlib import Path
from typing import Any, List, Dict

class Watermark:
    def __init__(self, name: str):
        self.name = name
        self.state_dir = Path.home() / ".hermes" / "watcher-state"
        self.state_dir.mkdir(parents=True, exist_ok=True)
        self.state_path = self.state_dir / f"{name}.json"
        self.seen_ids: set[str] = set()
        self.items: List[Dict[str, Any]] = []

    @classmethod
    def load(cls, name: str) -> "Watermark":
        wm = cls(name)
        if wm.state_path.exists():
            try:
                with open(wm.state_path, "r") as f:
                    data = json.load(f)
                    wm.seen_ids = set(data.get("seen_ids", []))
                    wm.items = data.get("items", [])
            except Exception:
                pass
        return wm

    def save(self) -> None:
        data = {
            "seen_ids": list(self.seen_ids),
            "items": self.items,
        }
        with open(self.state_path, "w") as f:
            json.dump(data, f, indent=2)

    def filter_new(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        new_items = []
        for item in items:
            item_id = str(item.get("id", ""))
            if item_id not in self.seen_ids:
                new_items.append(item)
                self.seen_ids.add(item_id)
                self.items.append(item)
        return new_items

def format_items_as_markdown(items: List[Dict[str, Any]]) -> str:
    md = ""
    for item in items:
        md += f"## {item.get('title', '')}\n"
        md += f"- **URL:** {item.get('url', '')}\n"
        md += f"- **Score:** {item.get('score', 0)}\n\n"
    return md