#!/usr/bin/env python3
"""Nebula Learning Centre generator.

Extracted from EfficusAI Learning Centre:
- Free-for-life resource hub
- Proof-led headline
- Featured resources
- Category browsing
- Founder follow/booking CTA

Nebula expansion: SEO problem pages for founders with paid traffic leaks.
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


@dataclass(frozen=True)
class ProblemPage:
    slug: str
    keyword: str
    title: str
    category: str
    diagnosis: str
    checklist: tuple[str, ...]
    example: str
    cta: str = "Run the free audit"

    @property
    def path(self) -> str:
        return f"/learning-center/{self.slug}"


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
        path="/learning-center/linkedin-skill-engine",
    ),
    Resource(
        slug="founder-second-brain",
        title="Founder Second-Brain Campaign Factory",
        category="Content Systems",
        promise="Turn founder expertise into posts, emails, lead magnets, and scripts with approval gates.",
        cta="Use the operating pattern",
        path="/learning-center/founder-second-brain",
    ),
]

PROBLEM_PAGES = [
    ProblemPage(
        slug="google-ads-clicks-no-sales",
        keyword="google ads clicks no sales",
        title="Google Ads Clicks But No Sales: Check The Page Before Budget",
        category="Google Ads Leaks",
        diagnosis="If Google Ads is producing clicks but no sales, the campaign may be doing its job: creating arrival. The leak usually happens when the first screen does not match the search intent, prove credibility, or make one next step obvious.",
        checklist=("Does the hero repeat the exact search/ad promise?", "Is proof visible before the primary CTA?", "Is there one next step, not three?", "Does mobile load and scroll cleanly?", "Are objections answered before price or checkout?"),
        example="A visitor searches for a fast fix, clicks the ad, then lands on a generic homepage. The click was valid. The page broke the chain.",
    ),
    ProblemPage(
        slug="facebook-ads-no-leads",
        keyword="facebook ads no leads",
        title="Facebook Ads Getting Clicks But No Leads",
        category="Meta Ads Leaks",
        diagnosis="Facebook traffic is colder and more interruption-driven. The page must reconnect the hook immediately. If the landing page starts with company context instead of the ad promise, visitors bounce before the offer makes sense.",
        checklist=("Does the first headline echo the ad hook?", "Is the offer clear without reading the full page?", "Is the form asking too much too early?", "Does the page show visual proof quickly?", "Can a mobile visitor complete the action in under 30 seconds?"),
        example="A Reel promises a specific outcome. The landing page opens with 'Welcome to our company.' That mismatch kills the lead.",
    ),
    ProblemPage(
        slug="landing-page-not-converting",
        keyword="landing page not converting",
        title="Landing Page Not Converting? Diagnose These 5 Leaks First",
        category="Landing Page Leaks",
        diagnosis="A non-converting landing page is usually not one problem. It is a sequence break: unclear promise, weak proof, CTA friction, mobile drag, or unanswered objections.",
        checklist=("Can a stranger explain the offer in 5 seconds?", "Is the page built for one audience?", "Does the CTA match buyer readiness?", "Is the strongest proof above the fold?", "Are objections handled before the final ask?"),
        example="Changing button color will not fix a page where nobody knows what is being sold or why it matters now.",
    ),
    ProblemPage(
        slug="high-cpc-low-conversion",
        keyword="high cpc low conversion",
        title="High CPC, Low Conversion: Stop Optimizing The Wrong Layer",
        category="Paid Traffic Economics",
        diagnosis="High CPC hurts. Low conversion makes it fatal. Before changing bidding, inspect whether the page turns expensive intent into action.",
        checklist=("Does every paid keyword have a matching landing page angle?", "Is the CTA proportionate to intent?", "Does the page explain why now?", "Is there enough proof to justify the click cost?", "Do analytics show form starts or only pageviews?"),
        example="A $12 click can work if the page converts. A $2 click fails if the page never earns trust.",
    ),
    ProblemPage(
        slug="traffic-but-no-form-fills",
        keyword="traffic but no form fills",
        title="Traffic But No Form Fills: The Form Is Usually Not The First Leak",
        category="Form Leaks",
        diagnosis="When traffic arrives but forms stay empty, the form is often the final symptom. The page may not have created enough intent, trust, or clarity before asking for information.",
        checklist=("Is the form asking only for essential fields?", "Is there proof beside or before the form?", "Does the visitor know what happens after submission?", "Is the CTA written as a benefit, not an action?", "Does mobile keyboard/form UX work cleanly?"),
        example="'Submit' is not a reason to act. 'Get the leak map' is closer to what the buyer wants.",
    ),
    ProblemPage(
        slug="cta-not-working",
        keyword="cta not working",
        title="CTA Not Working? Fix Commitment, Clarity, And Timing",
        category="Conversion Copy",
        diagnosis="A CTA fails when it asks for more commitment than the page has earned. The fix is rarely louder buttons. It is better timing, clearer payoff, and less perceived risk.",
        checklist=("Does the CTA describe the outcome?", "Is it visible after proof?", "Is there only one primary CTA?", "Does the CTA reduce risk?", "Is the same CTA language repeated consistently?"),
        example="'Book a call' asks for time and social risk. 'Get the leak map' gives value first.",
    ),
    ProblemPage(
        slug="message-match-checklist",
        keyword="message match checklist",
        title="Message Match Checklist For Paid Traffic Landing Pages",
        category="Message Match",
        diagnosis="Message match is the chain between what made someone click and what they see next. Break that chain and even qualified traffic feels misled.",
        checklist=("Ad hook appears in hero headline", "Audience named in first screen", "Offer matches the ad promise", "Proof supports the exact claim", "CTA continues the same promise"),
        example="If the ad says 'fix wasted Google Ads spend,' the page should not open with 'full-service digital solutions.'",
    ),
    ProblemPage(
        slug="proof-before-cta",
        keyword="proof before cta",
        title="Proof Before CTA: The Simple Fix Most Landing Pages Miss",
        category="Trust Leaks",
        diagnosis="Most pages ask before they prove. If the visitor has not seen evidence, the CTA feels like risk. Put proof before the ask.",
        checklist=("Is the proof specific, not generic?", "Is there one relevant example above the first major CTA?", "Does proof match the buyer's problem?", "Are claims backed by visible artifacts?", "Can the proof be understood in 10 seconds?"),
        example="A screenshot, before/after, or exact leak map beats a vague testimonial about being 'great to work with.'",
    ),
    ProblemPage(
        slug="mobile-landing-page-leaks",
        keyword="mobile landing page leaks",
        title="Mobile Landing Page Leaks That Kill Paid Traffic",
        category="Mobile Leaks",
        diagnosis="Paid social traffic is often mobile-first. A desktop-perfect page can still leak if the mobile hero, proof, CTA, or form is buried or slow.",
        checklist=("Is the headline visible without pinching or scrolling?", "Does the first CTA appear after enough context?", "Are images compressed?", "Is the form keyboard-friendly?", "Can the page be understood on a small screen?"),
        example="If proof appears only after six mobile scrolls, most paid visitors never see it.",
    ),
    ProblemPage(
        slug="before-you-raise-ad-budget",
        keyword="before you raise ad budget",
        title="Before You Raise Ad Budget, Run This Leak Check",
        category="Budget Leaks",
        diagnosis="Raising budget before fixing conversion leaks scales waste. The smarter move is to prove the page can convert before increasing spend.",
        checklist=("Do current clicks reach the promised page section?", "Does the page convert any warm traffic?", "Are top objections answered?", "Is the offer specific enough?", "Is the fix cheaper than another week of wasted spend?"),
        example="If $500 produced visits and zero intent signals, another $500 usually buys a clearer diagnosis of the same leak.",
    ),
]


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def config() -> dict[str, Any]:
    categories = sorted({r.category for r in RESOURCES} | {p.category for p in PROBLEM_PAGES})
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
        "problem_pages": [asdict(p) | {"path": p.path} for p in PROBLEM_PAGES],
        "primary_cta": {"label": "Run the free audit", "href": "/audit"},
        "secondary_cta": {"label": "Buy the $147 Fix Pack", "href": "https://buy.stripe.com/aFa7sL5E03Iwgyt2Nk43S02"},
        "policy": {
            "free_for_life_entry": True,
            "resources_point_to_audit_or_draft_assets": True,
            "no_fake_metrics": True,
            "competitor_claims_not_reused_as_nebula_proof": True,
            "problem_pages_route_to_audit": True,
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


def problem_card(problem: ProblemPage) -> str:
    return f"""
    <article class="card" data-category="{html.escape(problem.category)}">
      <div class="eyebrow">{html.escape(problem.category)}</div>
      <h3>{html.escape(problem.title)}</h3>
      <p>{html.escape(problem.diagnosis[:170])}...</p>
      <a class="resource-link" href="{html.escape(problem.path)}">Open diagnosis →</a>
    </article>
    """.strip()


def resource_detail_page(resource: Resource) -> str:
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{html.escape(resource.title)} | Nebula Learning Centre</title>
  <meta name="description" content="{html.escape(resource.promise)}">
  <style>{css()}</style>
</head>
<body>
  <main class="wrap detail">
    <a href="/learning-center/">← Learning Centre</a>
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


def problem_page(problem: ProblemPage) -> str:
    checklist = "\n".join(f"<li>{html.escape(item)}</li>" for item in problem.checklist)
    related = related_links(problem.slug)
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{html.escape(problem.title)} | Nebula Learning Centre</title>
  <meta name="description" content="{html.escape(problem.diagnosis[:155])}">
  <style>{css()}</style>
</head>
<body>
  <main class="wrap detail">
    <a href="/learning-center/">← Learning Centre</a>
    <p class="eyebrow">{html.escape(problem.category)} · {html.escape(problem.keyword)}</p>
    <h1>{html.escape(problem.title)}</h1>
    <p class="lede">{html.escape(problem.diagnosis)}</p>
    <section class="panel">
      <h2>Quick diagnosis</h2>
      <p>{html.escape(problem.diagnosis)}</p>
    </section>
    <section class="panel">
      <h2>Checklist</h2>
      <ul>{checklist}</ul>
    </section>
    <section class="panel">
      <h2>Example</h2>
      <p>{html.escape(problem.example)}</p>
    </section>
    <section class="panel cta-panel">
      <h2>Find the leak on your page</h2>
      <p>Run the free Nebula audit first. Buy the $147 Fix Pack only when the leak is obvious.</p>
      <div class="actions">
        <a class="button" href="/audit">{html.escape(problem.cta)}</a>
        <a class="button secondary" href="/learning-center/paid-traffic-leak-map">Open leak map</a>
      </div>
    </section>
    <section class="panel">
      <h2>Related leak checks</h2>
      <div class="related">{related}</div>
    </section>
  </main>
</body>
</html>
"""


def related_links(current_slug: str) -> str:
    links = [p for p in PROBLEM_PAGES if p.slug != current_slug][:4]
    return "\n".join(f"<a href='{html.escape(p.path)}'>{html.escape(p.title)}</a>" for p in links)


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
.card,.panel { background:rgba(17,23,35,.88); border:1px solid var(--line); border-radius:22px; padding:22px; margin:16px 0; }
.card p,.panel li,.panel p { color:var(--muted); line-height:1.55; }
.resource-link { font-weight:900; }
.detail { max-width:860px; }
.related { display:grid; gap:10px; }
.related a { padding:10px 0; border-bottom:1px solid var(--line); }
.cta-panel { border-color:rgba(121,242,192,.45); }
""".strip()


def index_html(cfg: dict[str, Any]) -> str:
    featured = [r for r in RESOURCES if r.featured]
    all_cards = "\n".join(card(r) for r in RESOURCES)
    featured_cards = "\n".join(card(r) for r in featured)
    problem_cards = "\n".join(problem_card(p) for p in PROBLEM_PAGES)
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

    <h2>Problem pages</h2>
    <p class="lede">Search-intent pages for the exact symptoms founders Google before they buy help.</p>
    <section class="grid">{problem_cards}</section>

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
            if resource.path.startswith("/learning-center/") or resource.path.startswith("/learning-centre/"):
                (PUBLIC_DIR / f"{resource.slug}.html").write_text(resource_detail_page(resource))
        for problem in PROBLEM_PAGES:
            (PUBLIC_DIR / f"{problem.slug}.html").write_text(problem_page(problem))
    return {
        "resources": len(RESOURCES),
        "problem_pages": len(PROBLEM_PAGES),
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
