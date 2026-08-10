#!/usr/bin/env python3
"""
Retainer Upsell Sender — Nebula Components
Sends the $1,497/mo AI Ops Retainer offer to qualified audit recipients.

Run via cron every 6h. Each eligible lead gets ONE upsell, then marked done.

Eligibility (sourced from HOT_LEAD.json — canonical lead store):
  - stage is audit_delivered or pitch_sent
  - pitch_sent_at is at least 14 days ago
  - paid_at IS NULL
  - bounced_at IS NULL
  - upsell_sent_at IS NULL

NOTE: lead_state.db is a lagging replica and is NOT used for eligibility
queries. HOT_LEAD.json is the authoritative source of record.
"""

import json
import logging
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

HOT_LEAD_PATH  = Path("/home/mike/nebula/HOT_LEAD.json")
LOG_FILE       = Path("/home/mike/nebula/logs/retainer_upsell.log")
INBOX          = "nebulashop@agentmail.to"
STRIPE_RETAINER_URL = "https://buy.stripe.com/00w5kD1nK0wkaa573A43S0c"
MIN_POST_PITCH_DAYS = 14
MAX_PER_RUN         = 5   # pace sends — retainer is a premium ask

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[logging.FileHandler(LOG_FILE), logging.StreamHandler()]
)
log = logging.getLogger(__name__)


SUBJECT = "Re: {domain} audit — one more thing"

BODY = """\
Hey,

You ran an audit on {domain} a while back.

Most founders I talk to hit a wall after the first fix: they change what the \
audit flagged, see a lift, then conversion starts drifting again as new \
traffic brings new friction. Same hole, different shape.

That's why the AI Ops Retainer exists. $1,497/month — I run your page \
through the full audit every month, deliver an updated fix pack, and flag \
any new drop-off before it costs you real money. No contract. Cancel any time.

The founders using it are paying less per month than they were losing per \
week on a page that wasn't converting.

If that sounds relevant: {retainer_url}

If you're sorted — no worries, just ignore this.

— Mike
Nebula Components
"""


def _load_leads() -> list[dict]:
    """Load HOT_LEAD.json. Returns list of lead dicts."""
    raw = HOT_LEAD_PATH.read_text()
    data = json.loads(raw)
    return data if isinstance(data, list) else data.get("leads", [])


def _save_leads(leads: list[dict]) -> None:
    """Atomically write HOT_LEAD.json."""
    tmp = HOT_LEAD_PATH.with_suffix(".tmp")
    tmp.write_text(json.dumps(leads, indent=2))
    tmp.replace(HOT_LEAD_PATH)


def _parse_dt(s: str | None) -> datetime | None:
    if not s:
        return None
    try:
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None


def get_eligible(leads: list[dict]) -> list[dict]:
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=MIN_POST_PITCH_DAYS)
    out = []
    for l in leads:
        if l.get("stage") not in ("audit_delivered", "pitch_sent"):
            continue
        if l.get("paid_at") or l.get("bounced_at") or l.get("upsell_sent_at"):
            continue
        pt = _parse_dt(l.get("pitch_sent_at") or l.get("pitch_sent"))
        if pt is None or pt > cutoff:
            continue
        # skip internal / test addresses
        email = (l.get("email") or "").lower()
        if not email or "@" not in email:
            continue
        if any(x in email for x in ("mike.holownych", "systemd-verify", "verify-crm-test", "@invalid")):
            continue
        out.append(l)
    return out


def _ensure_lead_registered(lead: dict) -> None:
    """Sync HOT_LEAD.json record into lead_state.db so the outbound gate finds it."""
    try:
        sys.path.insert(0, str(Path(__file__).parent))
        from lead_store import LeadStore
        store = LeadStore()
        store.upsert_lead(
            email=lead["email"],
            url=lead.get("url", ""),
            stage=lead.get("stage", "pitch_sent"),
            source=lead.get("source", "hot_lead_json"),
            trigger_context=lead.get("trigger_context", "retainer_upsell_sync"),
        )
    except Exception as e:
        log.warning(f"Lead registration sync failed for {lead.get('email')}: {e}")


def send_upsell(to: str, domain: str) -> bool:
    subject = SUBJECT.format(domain=domain)
    body    = BODY.format(domain=domain, retainer_url=STRIPE_RETAINER_URL)
    try:
        sys.path.insert(0, str(Path(__file__).parent))
        from agentmail_client import AgentMailClient
        from lead_store import LeadStore
        # Bounce check before send
        store = LeadStore()
        if store.is_bounced(to):
            log.info(f"Skipping bounced lead: {to}")
            return False
        result = AgentMailClient(inbox=INBOX).send(
            to=[to],
            subject=subject,
            text=body,
            client_id=f"retainer:{to.lower()}:initial",
        )
        if not result.get("_error"):
            log.info(f"Retainer upsell sent → {to} ({domain})")
            return True
        else:
            log.warning(f"Send blocked {to}: {result.get('_reason') or result.get('_error')}")
            return False
    except Exception as e:
        log.error(f"Send failed {to}: {e}")
        return False


def main(dry_run: bool = False):
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)

    leads = _load_leads()
    eligible = get_eligible(leads)
    log.info(f"Eligible for retainer upsell: {len(eligible)} (cap: {MAX_PER_RUN}/run)")

    if dry_run:
        print(json.dumps({
            "dry_run": True,
            "eligible": len(eligible),
            "sample": [{"email": l["email"], "url": l.get("url"), "pitched_at": l.get("pitch_sent_at")} for l in eligible[:5]]
        }, indent=2))
        return

    sent = 0
    now_iso = datetime.now(timezone.utc).isoformat()

    # Build lookup for fast update
    lead_index = {l.get("email", "").lower(): i for i, l in enumerate(leads)}

    for lead in eligible[:MAX_PER_RUN]:
        email  = lead["email"]
        domain = (lead.get("url") or "").replace("https://", "").replace("http://", "").split("/")[0] or "your page"

        # Ensure lead exists in lead_state.db so the outbound gate clears
        _ensure_lead_registered(lead)

        ok = send_upsell(email, domain)
        if ok:
            idx = lead_index.get(email.lower())
            if idx is not None:
                leads[idx]["upsell_sent_at"] = now_iso
                leads[idx]["updated_at"]     = now_iso
            sent += 1

    if sent:
        _save_leads(leads)
        log.info(f"HOT_LEAD.json updated — {sent} upsell_sent_at timestamps written")

    result = {"sent": sent, "eligible": len(eligible), "run_at": now_iso}
    log.info(f"Retainer upsell run complete — {sent}/{min(len(eligible), MAX_PER_RUN)} sent")
    print(json.dumps(result))


if __name__ == "__main__":
    dry = "--dry-run" in sys.argv
    main(dry_run=dry)
