#!/usr/bin/env python3
"""
Upwork Auto-Bidder — Nebula Components
Scrape → qualify → generate proposal → queue for review or auto-submit

Flow:
  1. Run multiple Apify searches (CRO, landing page, conversion keywords)
  2. Qualify against ICP: job must mention conversion/CRO/landing page
  3. Score by budget, client spend, proposal count, recency
  4. Generate personalized proposal via Claude API (or template fallback)
  5. Append to proposals_queue.json
  6. Send daily digest to AgentMail

Cron: every 2h  → scrape + qualify
      9 AM daily → send digest of top 5 proposals queued overnight
"""

import json
import os
import re
import sys
import time
import hashlib
import logging
import requests
from datetime import datetime, timezone
from pathlib import Path

# ─── CONFIG ───────────────────────────────────────────────────────────────────
APIFY_TOKEN_FILE = Path.home() / ".hermes/secrets/apify.key"
AGENTMAIL_API_KEY_FILE = Path.home() / ".hermes/secrets/agentmail_org.key"
QUEUE_FILE   = Path("/home/mike/nebula/upwork_proposals_queue.json")
SEEN_FILE    = Path("/home/mike/nebula/upwork_seen_jobs.json")
PENDING_FILE = Path("/home/mike/nebula/upwork_pending_runs.json")
LOG_FILE     = Path("/home/mike/nebula/logs/upwork_bidder.log")
ACTOR_ID     = "neatrat~upwork-job-scraper"
FROM_EMAIL   = "ops@launchcrate.io"
DIGEST_TO    = "mike.holownych@aisyndicate.io"

MAX_ITEMS_PER_SEARCH = 15
POLL_INTERVAL = 5
POLL_MAX = 25   # seconds — quick sweep; stale runs collected next tick

# ICP qualification — title must contain at least one (desc match no longer sufficient)
TITLE_MUST_MATCH = [
    "landing page", "conversion rate", "cro", "conversion optimiz",
    "squeeze page", "sales page", "funnel optim", "a/b test",
    "ab test", "split test", "ppc landing", "page not converting",
]
DESC_BOOST_KEYWORDS = [
    "not converting", "low conversion", "bounce rate", "roas",
    "ads not working", "traffic but no sales", "optimize",
    "improve conversion", "google ads", "facebook ads", "meta ads",
    "landing page audit", "cro audit", "heatmap", "hotjar",
]
# Negative title keywords — auto-reject even if title matches
TITLE_REJECT = [
    "lead gen", "lead generation", "scraper", "scraping", "data collect",
    "data entry", "database", "web research", "researcher", "amazon",
    "linkedin", "instagram", "social media", "healthcare", "mortgage",
    "real estate", "e-commerce product", "shopify product",
]
MIN_SCORE = 80  # raised from implicit 50 — only strong fits

# Search queries — tighter, conversion-specific
SEARCH_QUERIES = [
    "landing page not converting fix",
    "improve landing page conversion rate ads",
    "CRO audit landing page optimization",
    "sales page conversion copywriter",
    "landing page split test A/B optimization",
]

# Proposal template — personalized per job
PROPOSAL_TEMPLATE = """\
Hi {client_name},

I reviewed your job post — {title_summary}.

I run Nebula Components. We do one thing: find the 1–3 things killing a landing page's conversion rate and fix them.

What I'd deliver for this project:
- 5-dimension audit scored 1–10 (Headline, CTA, Social Proof, Mobile, Speed)
- Written root-cause analysis — not a report dump, a clear "here's the leak"
- Implementation-ready fixes: rewritten copy, CTA placement, trust section
- Delivered within 24h of kickoff

{budget_response}

I don't do calls before I've seen the page. Send me the URL and I'll come back with a specific observation before we even discuss next steps.

— Mike
Nebula Components | nebulacomponents.shop
"""

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
log = logging.getLogger(__name__)


# ─── HELPERS ──────────────────────────────────────────────────────────────────
def load_token(path: Path) -> str:
    return path.read_text().strip()


def load_seen() -> set:
    if SEEN_FILE.exists():
        return set(json.loads(SEEN_FILE.read_text()))
    return set()


def save_seen(seen: set):
    SEEN_FILE.write_text(json.dumps(list(seen), indent=2))


def load_queue() -> list:
    if QUEUE_FILE.exists():
        return json.loads(QUEUE_FILE.read_text())
    return []


def save_queue(q: list):
    QUEUE_FILE.write_text(json.dumps(q, indent=2))


def job_id(job: dict) -> str:
    return job.get("id") or hashlib.md5(job.get("url","").encode()).hexdigest()


# ─── SCRAPE ───────────────────────────────────────────────────────────────────
def fire_apify_run(token: str, query: str) -> tuple[str, str]:
    """Fire an Apify run and return (run_id, dataset_id). Non-blocking."""
    resp = requests.post(
        f"https://api.apify.com/v2/acts/{ACTOR_ID}/runs",
        params={"token": token, "memory": 256},
        json={"searchQuery": query, "maxItems": MAX_ITEMS_PER_SEARCH},
        timeout=30
    )
    resp.raise_for_status()
    d = resp.json()["data"]
    return d["id"], d["defaultDatasetId"]


def load_pending() -> list:
    if PENDING_FILE.exists():
        return json.loads(PENDING_FILE.read_text())
    return []


def save_pending(runs: list):
    PENDING_FILE.write_text(json.dumps(runs, indent=2))


def collect_completed_runs(token: str) -> list:
    """
    Check pending runs from previous ticks. Collect any that are SUCCEEDED.
    Returns combined job items. Removes completed/failed runs from pending list.
    """
    pending = load_pending()
    if not pending:
        return []

    results = []
    still_pending = []
    deadline = time.time() + POLL_MAX

    while pending and time.time() < deadline:
        time.sleep(POLL_INTERVAL)
        remaining = []
        for run in pending:
            run_id, dataset_id, query = run["run_id"], run["dataset_id"], run["query"]
            try:
                sr = requests.get(
                    f"https://api.apify.com/v2/actor-runs/{run_id}",
                    params={"token": token}, timeout=10
                )
                status = sr.json()["data"]["status"]
            except Exception:
                remaining.append(run)
                continue

            if status == "SUCCEEDED":
                ir = requests.get(
                    f"https://api.apify.com/v2/datasets/{dataset_id}/items",
                    params={"token": token, "limit": MAX_ITEMS_PER_SEARCH},
                    timeout=20
                )
                items = ir.json() if ir.ok else []
                log.info(f"  Collected [{query[:40]}] → {len(items)} jobs")
                results.extend(items)
            elif status in ("FAILED", "ABORTED", "TIMED-OUT"):
                log.warning(f"  Run {run_id} [{query[:40]}] → {status}, dropping")
            elif status in ("RUNNING", "READY"):
                remaining.append(run)  # still in flight

        pending = remaining
        if not pending:
            break

    # Anything still running after deadline stays for next tick
    if pending:
        log.info(f"  {len(pending)} runs still in flight — persisting for next tick")
    save_pending(pending)
    return results


def run_apify_searches(token: str, queries: list[str]) -> None:
    """Fire all searches in parallel — results collected next tick."""
    log.info(f"Firing {len(queries)} Apify runs (results collected next tick)...")
    pending = load_pending()
    existing_queries = {r["query"] for r in pending}
    for q in queries:
        if q in existing_queries:
            log.info(f"  Already pending: {q[:50]}")
            continue
        try:
            run_id, dataset_id = fire_apify_run(token, q)
            pending.append({"run_id": run_id, "dataset_id": dataset_id, "query": q})
            log.info(f"  Fired: {q[:50]} → run {run_id}")
        except Exception as e:
            log.error(f"  Failed to fire [{q}]: {e}")
    save_pending(pending)


# ─── QUALIFY ──────────────────────────────────────────────────────────────────
def qualify(job: dict) -> tuple[bool, int]:
    """Returns (passes, score 0-100)."""
    title = (job.get("title") or "").lower()
    desc  = (job.get("description") or "").lower()
    tags  = " ".join(job.get("tags") or []).lower()
    text  = f"{title} {desc} {tags}"

    # Hard reject: negative title keywords
    if any(kw in title for kw in TITLE_REJECT):
        return False, 0

    # Hard gate: TITLE must match (desc match alone no longer passes)
    title_match = any(kw in title for kw in TITLE_MUST_MATCH)
    if not title_match:
        return False, 0

    score = 50  # base pass score

    # Budget quality
    budget_raw = str(job.get("budget") or "")
    if "$" in budget_raw:
        # Fixed price
        nums = re.findall(r"\d+", budget_raw.replace(",",""))
        if nums:
            b = max(int(n) for n in nums)
            if b >= 200: score += 20
            elif b >= 100: score += 12
            elif b >= 50: score += 5
    else:
        # Hourly
        nums = re.findall(r"\d+", budget_raw)
        if nums:
            rate = int(nums[0])
            if rate >= 50: score += 15
            elif rate >= 30: score += 8

    # Client quality signals
    spent = str(job.get("clientTotalSpent") or "")
    if "k" in spent.lower() or any(int(x) >= 1000 for x in re.findall(r"\d+", spent.replace(",","")) if x):
        score += 10
    if job.get("paymentVerified"): score += 8
    rating = job.get("clientRating")
    if rating and float(rating) >= 4.5: score += 8

    # Competition (proposals already)
    proposals = str(job.get("proposals") or "")
    if "less than 5" in proposals or "0-5" in proposals: score += 10
    elif "5-10" in proposals or "5 to 10" in proposals: score += 5

    # Description boosts
    boost = sum(1 for kw in DESC_BOOST_KEYWORDS if kw in text)
    score += min(boost * 3, 15)

    # Title match = stronger signal
    if title_match: score += 10

    return True, min(score, 100)


# ─── PROPOSAL GENERATION ──────────────────────────────────────────────────────
def generate_proposal(job: dict, score: int) -> str:
    title = job.get("title", "")
    desc  = (job.get("description") or "")[:400]
    budget_raw = str(job.get("budget") or "")
    client_name = job.get("clientName") or "there"

    # Budget response line
    if "$" in budget_raw:
        nums = re.findall(r"\d+", budget_raw.replace(",",""))
        if nums:
            b = max(int(n) for n in nums)
            if b < 97:
                budget_response = f"My fixed rate for this scope is $97 — covers the full audit + implementation-ready fix pack."
            else:
                budget_response = f"Happy to work within your budget. My standard rate for a full audit + fix pack is $97–$197 depending on page complexity."
        else:
            budget_response = "My rate for a full audit + implementation fix pack starts at $97."
    else:
        budget_response = "I work fixed-price on this type of project — $97 for a full audit + implementation fix pack, delivered in 24h."

    # Summarize title
    title_summary = title.lower().replace("landing page", "the landing page").strip()
    if len(title_summary) > 80:
        title_summary = title_summary[:77] + "..."

    return PROPOSAL_TEMPLATE.format(
        client_name=client_name,
        title_summary=title_summary,
        budget_response=budget_response
    ).strip()


# ─── DIGEST EMAIL ─────────────────────────────────────────────────────────────
def send_digest(api_key: str, proposals: list):
    """Send top proposals as a review digest via Resend (inbox-deliverable)."""
    if not proposals:
        return

    top = sorted(proposals, key=lambda x: x["score"], reverse=True)[:5]

    lines = [f"## Upwork Proposals Queue — {datetime.now().strftime('%Y-%m-%d')}\n"]
    lines.append(f"**{len(proposals)} new proposals queued. Top {len(top)} shown.**\n")
    for i, p in enumerate(top, 1):
        lines.append(f"### {i}. {p['title']}")
        lines.append(f"Score: {p['score']} | Budget: {p.get('budget','?')} | Posted: {p.get('relativeDate','?')}")
        lines.append(f"URL: {p['url']}")
        lines.append(f"\n**Proposal:**\n```\n{p['proposal']}\n```\n")

    body = "\n".join(lines)

    try:
        import sys
        sys.path.insert(0, str(Path(__file__).parent))
        from resend_client import send as resend_send
        result = resend_send(
            to=[DIGEST_TO],
            subject=f"[Upwork] {len(proposals)} proposals ready — {datetime.now().strftime('%b %d')}",
            text=body,
        )
        if "message_id" in result:
            log.info(f"Digest sent via Resend: {len(proposals)} proposals")
        else:
            log.warning(f"Digest send failed: {result}")
    except Exception as e:
        log.error(f"Digest error: {e}")


# ─── MAIN ─────────────────────────────────────────────────────────────────────
def main():
    send_only = "--digest" in sys.argv

    apify_token = load_token(APIFY_TOKEN_FILE)
    try:
        agentmail_key = load_token(AGENTMAIL_API_KEY_FILE)
    except Exception:
        agentmail_key = None

    seen = load_seen()
    queue = load_queue()

    if send_only:
        # Just send digest of queued items not yet sent
        unsent = [p for p in queue if not p.get("digest_sent")]
        send_digest(agentmail_key, unsent)
        for p in queue:
            if not p.get("digest_sent"):
                p["digest_sent"] = True
        save_queue(queue)
        log.info("Digest-only run complete.")
        return

    new_proposals: list = []
    all_jobs: list = []

    # Step 1: Collect results from runs fired last tick
    all_jobs = collect_completed_runs(apify_token)
    log.info(f"Collected from pending runs: {len(all_jobs)} jobs")

    # Step 2: Fire new searches for next tick
    run_apify_searches(apify_token, SEARCH_QUERIES)

    log.info(f"Total raw jobs: {len(all_jobs)}")

    # Dedupe + qualify
    qualified = 0
    skipped_seen = 0
    skipped_icp = 0

    for job in all_jobs:
        jid = job_id(job)

        if jid in seen:
            skipped_seen += 1
            continue

        passes, score = qualify(job)
        seen.add(jid)

        if not passes or score < MIN_SCORE:
            skipped_icp += 1
            continue

        qualified += 1
        proposal_text = generate_proposal(job, score)

        entry = {
            "job_id":      jid,
            "title":       job.get("title"),
            "url":         job.get("url"),
            "budget":      job.get("budget"),
            "jobType":     job.get("jobType"),
            "score":       score,
            "relativeDate": job.get("relativeDate"),
            "absoluteDate": job.get("absoluteDate"),
            "clientTotalSpent": job.get("clientTotalSpent"),
            "paymentVerified":  job.get("paymentVerified"),
            "clientRating":     job.get("clientRating"),
            "proposals":   job.get("proposals"),
            "tags":        job.get("tags"),
            "proposal":    proposal_text,
            "queued_at":   datetime.now(timezone.utc).isoformat(),
            "digest_sent": False,
            "submitted":   False,
        }
        queue.append(entry)
        new_proposals.append(entry)

    log.info(f"Results — qualified: {qualified}, skipped (seen): {skipped_seen}, skipped (off-ICP): {skipped_icp}")
    log.info(f"New proposals queued: {len(new_proposals)}")

    save_seen(seen)
    save_queue(queue)

    # Always send digest if new proposals found
    if new_proposals and agentmail_key:
        send_digest(agentmail_key, new_proposals)  # type: ignore[arg-type]
        for p in queue:
            if not p.get("digest_sent") and p["job_id"] in {n["job_id"] for n in new_proposals}:
                p["digest_sent"] = True
        save_queue(queue)

    # Summary report
    print(json.dumps({
        "run_at": datetime.now(timezone.utc).isoformat(),
        "jobs_scraped": len(all_jobs),
        "qualified": qualified,
        "new_proposals": len(new_proposals),
        "queue_total": len(queue),
        "top_scores": sorted([p["score"] for p in new_proposals], reverse=True)[:5]
    }, indent=2))


if __name__ == "__main__":
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    main()
