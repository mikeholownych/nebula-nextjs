#!/usr/bin/env python3
"""Nebula Learning Centre generator.

Extracted from EfficusAI Learning Centre:
- Free-for-life resource hub
- Proof-led headline
- Featured resources
- Category browsing
- Founder follow/booking CTA

Nebula adaptation: resource library for founders with paid traffic leaks.
"""
from __future__ import annotations

import argparse
import html
import json
import re
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

BASE = Path(__file__).resolve().parent
GS = BASE / "growth_system"
PUBLIC_DIR = BASE / "public" / "learning-centre"
CONFIG_PATH = GS / "learning_centre_config.json"
INDEX_JSON = PUBLIC_DIR / "index.json"
INDEX_HTML = PUBLIC_DIR / "index.html"


@dataclass(frozen=True)
class Resource:
    slug: str
    title: str
    category: str
    promise: str
    cta: str
    path: str
    featured: bool = False


RESOURCES = [
    Resource(
        slug="paid-traffic-leak-map",
        title="Paid-Traffic Leak Map",
        category="Audit Systems",
        promise="Find the first five leaks before spending another dollar on ads.",
        cta="Run the free audit",
        path="/lead-magnets/paid-traffic-leak-checklist.html",
        featured=True,
    ),
    Resource(
        slug="cta-rewrite-swipe-kit",
        title="CTA Rewrite Swipe Kit",
        category="Conversion Copy",
        promise="Rewrite the action step so visitors know exactly what to do next.",
        cta="Open the swipe kit",
        path="/lead-magnets/cta-rewrite-swipe-kit.html",
        featured=True,
    ),
    Resource(
        slug="free-leak-map-preview",
        title="Free Leak Map Preview",
        category="Audit Systems",
        promise="See what a Nebula diagnosis looks like before buying a Fix Pack.",
        cta="View preview",
        path="/lead-magnets/free-leak-map-preview.html",
        featured=True,
    ),
    Resource(
        slug="linkedin-skill-engine",
        title="LinkedIn Skill Engine",
        category="Distribution",
        promise="Draft-first LinkedIn content, warming, and outreach workflow with a 20/day cap.",
        cta="Use the operating pattern",
        path="/learning-centre/linkedin-skill-engine.html",
    ),
    Resource(
        slug="founder-second-brain",
        title="Founder Second-Brain Campaign Factory",
        category="Content Systems",
        promise="Turn founder expertise into posts, emails, lead magnets, and scripts with approval gates.",
        cta="Use the operating pattern",
        path="/learning-centre/founder-second-brain.html",
    ),
]


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def config() -> dict[str, Any]:
    categories = sorted({r.category for r in RESOURCES})
    return {
        "source_pattern": "EfficusAI Learning Centre",
        "nebula_adaptation": "Free-for-life resource hub for founders bleeding paid traffic after the click",
        "headline": "Founder resources for fixing paid-traffic leaks before buying more clicks.",
        "proof_bar": [
            "Free for life",
            "Built from Nebula operating systems",
            "Draft-first, audit-first, no generic agency fluff",
        ],
        "categories": categories,
        "resources": [asdict(r) for r in RESOURCES],
        "primary_cta": {"label": "Run the free audit", "href": "/audit"},
        "secondary_cta": {"label": "Buy the $147 Fix Pack", "href": "https://buy.stripe.com/aFa7sL5E03Iwgyt2Nk43S02"},
        "policy": {
            "free_for_life_entry": True,
            "resources_point_to_audit_or_draft_assets": True,
            "no_fake_metrics": True,
            "competitor_claims_not_reused_as_nebula_proof": True,
        },
    }


def card(resource: Resource) -> str:
    badge = "<span class='badge'>Featured</span>" if resource.featured else ""
    return f"""
    <article class="card" data-category="{html.escape(resource.category)}">
      <div class="eyebrow">{html.escape(resource.category)} {badge}</div>
      <h3>{html.escape(resource.title)}</h3>
      <p>{html.escape(resource.promise)}</p>
      <a class="resource-link" href="{html.escape(resource.path)}">{html.escape(resource.cta)} →</a>
    </article>
    """.strip()


def detail_page(resource: Resource) -> str:
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{html.escape(resource.title)} | Nebula Learning Centre</title>
  <style>{css()}</style>
</head>
<body>
  <main class="wrap detail">
    <a href="/learning-centre/">← Learning Centre</a>
    <p class="eyebrow">{html.escape(resource.category)}</p>
    <h1>{html.escape(resource.title)}</h1>
    <p class="lede">{html.escape(resource.promise)}</p>
    <section class="panel">
      <h2>How to use this</h2>
      <ol>
        <li>Open the resource.</li>
        <li>Apply it to one page or one offer.</li>
        <li>Run the free audit before changing ad spend.</li>
      </ol>
      <a class="button" href="{html.escape(resource.path)}">{html.escape(resource.cta)}</a>
    </section>
  </main>
</body>
</html>
"""


def css() -> str:
    return """
:root { color-scheme: dark; --bg:#080a0f; --panel:#111723; --text:#f5f7fb; --muted:#9aa7bd; --line:#253044; --hot:#79f2c0; --gold:#ffd166; }
* { box-sizing: border-box; }
body { margin:0; background: radial-gradient(circle at top left,#152033,#080a0f 42%); color:var(--text); font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; }
a { color: var(--hot); text-decoration: none; }
.wrap { width:min(1120px,92vw); margin:0 auto; padding:56px 0; }
.hero { display:grid; gap:22px; padding:42px; border:1px solid var(--line); border-radius:28px; background:linear-gradient(135deg,rgba(17,23,35,.92),rgba(8,10,15,.78)); box-shadow:0 24px 80px rgba(0,0,0,.35); }
.eyebrow { color:var(--gold); text-transform:uppercase; letter-spacing:.12em; font-size:12px; font-weight:800; }
h1 { font-size:clamp(38px,7vw,76px); line-height:.94; margin:0; letter-spacing:-.06em; }
h2 { font-size:32px; margin:48px 0 18px; letter-spacing:-.03em; }
h3 { font-size:22px; margin:10px 0; }
.lede { color:var(--muted); font-size:20px; max-width:760px; line-height:1.45; }
.proof { display:flex; flex-wrap:wrap; gap:10px; padding:0; margin:8px 0 0; list-style:none; }
.proof li,.badge { border:1px solid var(--line); border-radius:999px; padding:8px 12px; color:var(--muted); background:#0c111a; }
.actions { display:flex; flex-wrap:wrap; gap:14px; }
.button { display:inline-flex; align-items:center; justify-content:center; border-radius:999px; padding:13px 18px; background:var(--hot); color:#02100a; font-weight:900; }
.button.secondary { background:transparent; color:var(--text); border:1px solid var(--line); }
.grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(245px,1fr)); gap:16px; }
.card,.panel { background:rgba(17,23,35,.88); border:1px solid var(--line); border-radius:22px; padding:22px; }
.card p,.panel li { color:var(--muted); line-height:1.5; }
.resource-link { font-weight:900; }
.detail { max-width:860px; }
""".strip()


def index_html(cfg: dict[str, Any]) -> str:
    featured = [r for r in RESOURCES if r.featured]
    all_cards = "\n".join(card(r) for r in RESOURCES)
    featured_cards = "\n".join(card(r) for r in featured)
    proof = "\n".join(f"<li>{html.escape(item)}</li>" for item in cfg["proof_bar"])
    categories = " · ".join(html.escape(c) for c in cfg["categories"])
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Nebula Learning Centre</title>
  <meta name="description" content="Free Nebula resources for founders fixing paid-traffic leaks after the click.">
  <style>{css()}</style>
</head>
<body>
  <main class="wrap">
    <section class="hero">
      <p class="eyebrow">Nebula Learning Centre</p>
      <h1>{html.escape(cfg['headline'])}</h1>
      <p class="lede">Free operating resources for founders getting clicks but no sales. Start with the leak map. Buy implementation only when the leak is obvious.</p>
      <ul class="proof">{proof}</ul>
      <div class="actions">
        <a class="button" href="{cfg['primary_cta']['href']}">{cfg['primary_cta']['label']}</a>
        <a class="button secondary" href="{cfg['secondary_cta']['href']}">{cfg['secondary_cta']['label']}</a>
      </div>
    </section>

    <h2>Featured resources</h2>
    <section class="grid">{featured_cards}</section>

    <h2>Choose a category</h2>
    <p class="lede">{categories}</p>
    <section class="grid">{all_cards}</section>
  </main>
</body>
</html>
"""


def run(dry_run: bool = False) -> dict[str, Any]:
    cfg = config()
    if not dry_run:
        PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
        GS.mkdir(parents=True, exist_ok=True)
        CONFIG_PATH.write_text(json.dumps(cfg, indent=2) + "\n")
        INDEX_JSON.write_text(json.dumps({"generated_at": utc_now(), **cfg}, indent=2) + "\n")
        INDEX_HTML.write_text(index_html(cfg))
        for resource in RESOURCES:
            if resource.path.startswith("/learning-centre/") and resource.path.endswith(".html"):
                (PUBLIC_DIR / f"{resource.slug}.html").write_text(detail_page(resource))
    return {
        "resources": len(RESOURCES),
        "featured": len([r for r in RESOURCES if r.featured]),
        "categories": len(cfg["categories"]),
        "html": str(INDEX_HTML),
        "json": str(INDEX_JSON),
        "dry_run": dry_run,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    print(json.dumps(run(dry_run=args.dry_run), indent=2))


if __name__ == "__main__":
    main()
