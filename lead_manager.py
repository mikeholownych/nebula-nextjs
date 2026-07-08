#!/usr/bin/env python3
"""
Lead Manager — centralized lead database with stage-based segmentation.

Stages (ordered by funnel progression):
  lead_free_kit    → downloaded free Fix Kit (email capture)
  lead_audit       → ran an audit with email
  lead_warm        → engaged but not yet paid
  customer_97      → bought $147 Conversion Fix Pack
  customer_997     → bought $997 Growth Launch
  subscriber_197   → active $197/mo Trigger Pipeline subscriber
  customer_sdr     → enterprise SDR client

Moves are ONE-WAY UP. A lead never regresses to an earlier stage.
A customer_97 who later buys Growth Launch upgrades to customer_997.
"""

import json, os, datetime

# ─── CAN-SPAM Compliance ────────────────────────────────────────────
# Business physical address — update this to your actual business address
BUSINESS_NAME = "Nebula Components"
BUSINESS_ADDRESS = "Nebula Components, 66 Sonneck Square, Scarborough, ON M1E 1A9"
UNSUBSCRIBE_BASE = "https://nebulacomponents.shop/unsubscribe.html"

def compliance_footer(email):
    """Return the CAN-SPAM compliant footer block for any email."""
    unsub_url = f"{UNSUBSCRIBE_BASE}?email={email}"
    return (
        f"\n\n---\n"
        f"You received this email because you requested the Free Landing Page Fix Kit "
        f"from Nebula Components or ran a landing page audit.\n\n"
        f"If you no longer wish to receive emails from us, you can unsubscribe at any time:\n"
        f"{unsub_url}\n\n"
        f"{BUSINESS_NAME}\n"
        f"{BUSINESS_ADDRESS}\n"
    )

def compliance_footer_html(email):
    """Return the HTML CAN-SPAM footer for email use."""
    unsub_url = f"{UNSUBSCRIBE_BASE}?email={email}"
    return (
        f'<hr style="border:none;border-top:1px solid #333;margin:24px 0 12px">\n'
        f'<p style="font-size:12px;color:#94a3b8;line-height:1.6;">\n'
        f'You received this email because you requested the Free Landing Page Fix Kit '
        f'from Nebula Components or ran a landing page audit.<br><br>\n'
        f'<a href="{unsub_url}" style="color:#6366f1;">Unsubscribe from future emails</a><br><br>\n'
        f'{BUSINESS_NAME}<br>\n'
        f'{BUSINESS_ADDRESS}\n'
        f'</p>'
    )

LEADS_DB = "/home/mike/nebula/ledgers/leads.json"
LEADS_JOURNAL = "/home/mike/nebula/ledgers/leads-journal.jsonl"

STAGE_ORDER = {
    "lead_free_kit": 1,
    "lead_audit": 2,
    "lead_warm": 3,
    "beta_tester": 4,
    "customer_97": 5,
    "customer_997": 6,
    "subscriber_197": 7,
    "customer_sdr": 8,
}

STAGE_LABELS = {
    "lead_free_kit": "Free Kit Downloaded",
    "lead_audit": "Audit Run",
    "lead_warm": "Warm Lead",
    "beta_tester": "Beta Tester — case study pending",
    "customer_97": "$147 Customer",
    "customer_997": "$997 Customer",
    "subscriber_197": "$197/mo Subscriber",
    "customer_sdr": "SDR Client",
}

SEGMENTS = {
    "all": "Everyone",
    "active": "All active leads (any stage)",
    "lead_free_kit": "Free Kit — need audit trigger",
    "lead_audit": "Ran Audit — ready for upsell",
    "lead_warm": "Warm — high intent",
    "beta_tester": "Beta Testers — case study pending",
    "customer_97": "$147 Customers — upsell to $997",
    "customer_997": "$997 Customers — upsell to pipeline",
    "subscriber_197": "$197/mo Subscribers",
    "non_customer": "Leads who haven't paid yet (free_kit + audit + warm + beta_tester)",
}


def _load():
    """Load the full leads DB from disk."""
    if not os.path.exists(LEADS_DB):
        return {}
    try:
        with open(LEADS_DB) as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}


def _save(db):
    """Write the full leads DB to disk atomically."""
    tmp = LEADS_DB + ".tmp"
    with open(tmp, "w") as f:
        json.dump(db, f, indent=2, sort_keys=True)
    os.replace(tmp, LEADS_DB)


def _journal(entry):
    """Append a journal entry for audit trail."""
    os.makedirs(os.path.dirname(LEADS_JOURNAL), exist_ok=True)
    with open(LEADS_JOURNAL, "a") as f:
        f.write(json.dumps(entry) + "\n")


def _stage_rank(stage):
    """Return numeric rank for a stage. Unknown stages rank at 0."""
    return STAGE_ORDER.get(stage, 0)


def get_lead(email):
    """Look up a single lead by email. Returns None if not found."""
    email = email.strip().lower()
    db = _load()
    return db.get(email)


def upsert_lead(email, stage=None, source=None, name=None, url=None,
                offer=None, product_stage=None, total_spent_cents=None,
                content_post_url=None, content_angle=None):
    """
    Create or update a lead record.

    - If the lead is new, creates it at the given stage.
    - If the lead exists and the new stage is higher-ranked, upgrades.
    - Never downgrades stage.
    - Appends to the journal on every change.
    - content_post_url: LinkedIn post URL that generated this lead.
    - content_angle: classification of the content that drove them ('teach', 'flex', 'case_study', 'hook', 'story').
    """
    email = email.strip().lower()
    if not email or "@" not in email:
        return None

    db = _load()
    now = datetime.datetime.utcnow().isoformat() + "Z"
    existing = db.get(email)

    if existing:
        # Upgrade stage if higher
        old_stage = existing.get("current_stage", "lead_free_kit")
        new_stage = stage
        if new_stage and _stage_rank(new_stage) > _stage_rank(old_stage):
            existing["current_stage"] = new_stage
        elif not new_stage:
            new_stage = old_stage
        else:
            new_stage = old_stage  # keep current, no downgrade

        # Add to stage history
        if new_stage and new_stage not in existing.get("stages", []):
            existing.setdefault("stages", []).append(new_stage)

        # Update fields
        if source and source not in existing.get("sources", []):
            existing.setdefault("sources", []).append(source)
        if name:
            existing["name"] = name
        if url:
            existing["url"] = url
        if offer:
            existing.setdefault("offers", []).append(offer)
        if product_stage:
            existing["product_stage"] = product_stage
        if total_spent_cents is not None:
            existing["total_spent_cents"] = existing.get("total_spent_cents", 0) + total_spent_cents

        # Content-to-lead tracking
        if content_post_url:
            content_posts = existing.setdefault("content_posts", [])
            # Track each post-lead attribution once
            post_entry = {"url": content_post_url, "angle": content_angle or "", "first_seen": now}
            # Check if this post already attributed
            existing_urls = [p.get("url") for p in content_posts]
            if content_post_url not in existing_urls:
                content_posts.append(post_entry)

        existing["last_seen"] = now
        db[email] = existing
    else:
        # New lead
        entry = {
            "email": email,
            "name": name or "",
            "current_stage": stage or "lead_free_kit",
            "stages": [stage or "lead_free_kit"],
            "first_seen": now,
            "last_seen": now,
            "sources": [source] if source else [],
            "url": url or "",
            "offer": offer or "",
            "product_stage": product_stage or "",
            "total_spent_cents": total_spent_cents or 0,
            "opted_out": False,
            "opted_out_at": None,
            "tags": [],
            "notes": "",
            "content_posts": [{"url": content_post_url, "angle": content_angle or "", "first_seen": now}] if content_post_url else [],
        }
        db[email] = entry

    _save(db)

    journal_entry = {
        "timestamp": now,
        "email": email,
        "action": "upsert",
        "stage": db[email]["current_stage"],
        "stages": db[email]["stages"],
        "source": source,
        "name": name,
    }
    _journal(journal_entry)

    return db[email]


def list_by_stage(stage=None):
    """
    List leads filtered by current stage.

    Special segments:
      "all"     → every lead
      "active"  → all stages except visitor (none left), so all leads
      "non_customer" → free_kit + audit + warm (stages before 97)
    """
    db = _load()
    leads = list(db.values())

    if stage == "all":
        return leads
    if stage == "active":
        return [l for l in leads if l.get("current_stage") in STAGE_ORDER]
    if stage == "non_customer":
        return [l for l in leads if _stage_rank(l.get("current_stage", "")) < _stage_rank("customer_97")]
    if stage and stage in STAGE_ORDER:
        return [l for l in leads if l.get("current_stage") == stage]

    return leads


def get_stats():
    """Return segmentation stats: count per stage + totals + opted-out count."""
    db = _load()
    leads = list(db.values())

    stage_counts = {s: 0 for s in STAGE_ORDER}
    opted_out_count = 0
    for l in leads:
        if l.get("opted_out"):
            opted_out_count += 1
        s = l.get("current_stage", "")
        if s in stage_counts:
            stage_counts[s] += 1

    return {
        "total_leads": len(leads),
        "opted_out_count": opted_out_count,
        "active_leads": len(leads) - opted_out_count,
        "by_stage": stage_counts,
        "by_stage_labels": {s: STAGE_LABELS.get(s, s) for s in STAGE_ORDER},
        "non_customer_count": sum(
            count for s, count in stage_counts.items()
            if _stage_rank(s) < _stage_rank("customer_97")
        ),
        "customer_count": sum(
            count for s, count in stage_counts.items()
            if _stage_rank(s) >= _stage_rank("customer_97")
        ),
    }


def export_csv(stage=None):
    """Return a CSV string of leads filtered by stage."""
    leads = list_by_stage(stage)
    if not leads:
        return "email,name,current_stage,first_seen,last_seen,sources,url,offer\n"

    import io, csv
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["email", "name", "current_stage", "first_seen", "last_seen",
                      "sources", "url", "offer", "product_stage", "total_spent_cents"])
    for l in leads:
        writer.writerow([
            l.get("email", ""),
            l.get("name", ""),
            l.get("current_stage", ""),
            l.get("first_seen", ""),
            l.get("last_seen", ""),
            "; ".join(l.get("sources", [])),
            l.get("url", ""),
            l.get("offer", ""),
            l.get("product_stage", ""),
            l.get("total_spent_cents", 0),
        ])
    return buf.getvalue()


def list_recircle_candidates(min_age_days=30, max_count=50):
    """Return non-customer, non-opted-out leads not contacted in min_age_days.
    
    These are candidates for the recircle sequence — re-engage the same ICP
    with fresh audit findings or new content every 30-60 days.
    """
    db = _load()
    now = datetime.datetime.utcnow().isoformat() + "Z"
    candidates = []
    for email, lead in db.items():
        if lead.get("opted_out"):
            continue
        stage = lead.get("current_stage", "")
        # Only re-engage non-customer stages
        if stage.startswith("customer") or stage.startswith("subscriber"):
            continue
        last_seen = lead.get("last_seen", now)
        try:
            last_dt = datetime.datetime.fromisoformat(last_seen.replace("Z", "+00:00"))
            age_days = (datetime.datetime.now(datetime.timezone.utc) - last_dt).days
        except Exception:
            age_days = 0
        if age_days >= min_age_days:
            candidates.append({
                "email": email,
                "name": lead.get("name", ""),
                "stage": stage,
                "source": (lead.get("sources") or [""])[0],
                "last_seen": last_seen,
                "age_days": age_days,
                "tags": lead.get("tags", []),
            })
    candidates.sort(key=lambda c: c["age_days"], reverse=True)
    return candidates[:max_count]


def content_performance():
    """Analyze which content posts and angles produce leads at which stages.
    
    Returns dict with:
      - by_angle: {angle: {total_leads, stages_breakdown, max_stage_reached}}
      - by_post: [{url, angle, leads_count, stages, max_stage, first_lead, last_lead}]
      - top_angles: list sorted by lead quality (not volume)
    """
    db = _load()
    
    # Collect all content leads
    post_stats = {}  # url -> stats
    angle_stats = {}  # angle -> stats
    
    for email, lead in db.items():
        content_posts = lead.get("content_posts", [])
        stage = lead.get("current_stage", "")
        stage_rank = _stage_rank(stage)
        total_spent = lead.get("total_spent_cents", 0)
        
        for cp in content_posts:
            url = cp.get("url", "")
            angle = cp.get("angle", "unknown") or "unknown"
            
            # Per-post stats
            if url not in post_stats:
                post_stats[url] = {
                    "url": url,
                    "angle": angle,
                    "total_leads": 0,
                    "stages": {},
                    "max_stage": "",
                    "max_stage_rank": 0,
                    "total_revenue_cents": 0,
                    "leads_sample": [],
                    "first_lead": cp.get("first_seen", ""),
                    "last_lead": cp.get("first_seen", ""),
                }
            ps = post_stats[url]
            ps["total_leads"] += 1
            ps["stages"][stage] = ps["stages"].get(stage, 0) + 1
            ps["total_revenue_cents"] += total_spent
            if stage_rank > ps["max_stage_rank"]:
                ps["max_stage_rank"] = stage_rank
                ps["max_stage"] = stage
            if len(ps["leads_sample"]) < 3:
                ps["leads_sample"].append({"email": email, "name": lead.get("name", ""), "stage": stage})
            fs = cp.get("first_seen", "")
            if not ps["first_lead"] or fs < ps["first_lead"]:
                ps["first_lead"] = fs
            if not ps["last_lead"] or fs > ps["last_lead"]:
                ps["last_lead"] = fs
            
            # Per-angle stats
            if angle not in angle_stats:
                angle_stats[angle] = {
                    "angle": angle,
                    "total_leads": 0,
                    "unique_posts": set(),
                    "stages": {},
                    "max_stage": "",
                    "max_stage_rank": 0,
                    "total_revenue_cents": 0,
                    "buyer_conversion_rate": 0.0,
                }
            as_ = angle_stats[angle]
            as_["total_leads"] += 1
            as_["unique_posts"].add(url)
            as_["stages"][stage] = as_["stages"].get(stage, 0) + 1
            as_["total_revenue_cents"] += total_spent
            if stage_rank > as_["max_stage_rank"]:
                as_["max_stage_rank"] = stage_rank
                as_["max_stage"] = stage
    
    # Calculate buyer conversion rate per angle
    for angle, stats in angle_stats.items():
        total = stats["total_leads"]
        buyers = sum(count for stage, count in stats["stages"].items() if _stage_rank(stage) >= _stage_rank("customer_97"))
        stats["buyer_conversion_rate"] = round(buyers / total, 3) if total > 0 else 0
        stats["unique_posts"] = len(stats["unique_posts"])
    
    # Sort angles by buyer conversion rate (highest first)
    top_angles = sorted(angle_stats.values(), key=lambda x: x["buyer_conversion_rate"], reverse=True)
    
    # Sort posts by stage rank (highest first)
    sorted_posts = sorted(post_stats.values(), key=lambda x: x["max_stage_rank"], reverse=True)
    
    return {
        "by_angle": angle_stats,
        "by_post": sorted_posts,
        "top_angles": top_angles,
    }


def beta_signup(email, url=None, name=None, company=None, role=None, source=None):
    """Register a beta tester application. Returns dict with status + message."""
    email = email.strip().lower()
    if not email or "@" not in email:
        return {"status": "error", "message": "Valid email required."}

    db = _load()
    now = datetime.datetime.utcnow().isoformat() + "Z"

    # Check if already a beta tester or customer
    lead = db.get(email)
    if lead:
        stage = lead.get("current_stage", "")
        if stage in ("beta_tester", "customer_97", "customer_997", "subscriber_197", "customer_sdr"):
            return {"status": "existing", "message": "You're already in the program or a customer. We'll be in touch."}

    # Upsert as beta_tester
    upsert_lead(
        email=email,
        stage="beta_tester",
        source=source or "beta_signup",
        name=name or "",
        url=url or "",
        offer="beta_tester_fix_pack",
    )

    # Re-load DB after upsert (db was loaded before upsert)
    db = _load()
    lead = db.get(email)
    if lead:
        lead["beta_tester"] = {
            "applied_at": now,
            "url": url or "",
            "company": company or "",
            "role": role or "",
            "case_study_completed": False,
            "fix_delivered": False,
        }
        lead["tags"] = list(set(lead.get("tags", []) + ["beta_tester"]))
        _save(db)

    return {"status": "submitted", "message": "Application submitted! We'll review and get back to you within 24 hours."}


def log_checkout_visit(email):
    """Log that a lead visited the checkout page. Used for abandoned cart sequence."""
    email = email.strip().lower()
    if not email or "@" not in email:
        return False
    
    db = _load()
    now = datetime.datetime.utcnow().isoformat() + "Z"
    lead = db.get(email)
    if not lead:
        return False
    
    visits = lead.setdefault("checkout_visits", [])
    visits.append(now)
    lead["last_seen"] = now
    
    # Auto-enroll in abandoned checkout sequence if not already
    seqs = lead.setdefault("email_sequences", {})
    if "abandoned_checkout" not in seqs:
        seqs["abandoned_checkout"] = {
            "enrolled_at": now,
            "sent_steps": [],
            "completed": False,
        }
    
    _save(db)
    return True


def get_email_sequences(email):
    """Get email sequence tracking state for a lead."""
    db = _load()
    lead = db.get(email.strip().lower())
    if not lead:
        return {}
    return lead.get("email_sequences", {})


def set_sequence_step_sent(email, sequence_id, step_id):
    """Mark a sequence step as sent. Returns True if changed."""
    email = email.strip().lower()
    if not email or "@" not in email:
        return False
    db = _load()
    lead = db.get(email)
    if not lead:
        return False
    sequences = lead.setdefault("email_sequences", {})
    seq = sequences.setdefault(sequence_id, {"sent_steps": [], "completed": False})
    if "enrolled_at" not in seq:
        seq["enrolled_at"] = datetime.datetime.utcnow().isoformat() + "Z"
    if step_id not in seq["sent_steps"]:
        seq["sent_steps"].append(step_id)
    _save(db)
    return True


def complete_sequence(email, sequence_id, completes_at=None):
    """Mark a sequence as completed and promote lead stage if appropriate.
    
    Args:
        email: Lead email
        sequence_id: Sequence name identifier
        completes_at: Stage to promote to after completion (optional, handled by caller)
    """
    email = email.strip().lower()
    if not email or "@" not in email:
        return False
    db = _load()
    lead = db.get(email)
    if not lead:
        return False
    sequences = lead.setdefault("email_sequences", {})
    if sequence_id not in sequences:
        return False
    seq = sequences[sequence_id]
    seq["completed"] = True
    seq["completed_at"] = datetime.datetime.utcnow().isoformat() + "Z"
    # Promote stage if requested
    if completes_at:
        current = lead.get("current_stage", "")
        new_rank = _stage_rank(completes_at)
        old_rank = _stage_rank(current)
        if new_rank > old_rank:
            lead["current_stage"] = completes_at
            stages = lead.setdefault("stages", [])
            if completes_at not in stages:
                stages.append(completes_at)
    _save(db)
    return True


def opt_out(email):
    """Mark a lead as opted out. Returns True if changed, False if already out or not found."""
    email = email.strip().lower()
    if not email or "@" not in email:
        return False
    db = _load()
    now = datetime.datetime.utcnow().isoformat() + "Z"
    lead = db.get(email)
    if not lead:
        return False
    if lead.get("opted_out"):
        return False
    lead["opted_out"] = True
    lead["opted_out_at"] = now
    db[email] = lead
    _save(db)
    _journal({"timestamp": now, "email": email, "action": "opt_out"})
    return True


def is_opted_out(email):
    """Check if a lead has opted out of email communications."""
    email = email.strip().lower()
    lead = get_lead(email)
    if not lead:
        return False
    return lead.get("opted_out", False)


def migrate_from_jsonl():
    """One-time migration: read existing intake-journal.jsonl and audit_leads.jsonl
    into the new leads DB. Safe to re-run (dedup by email)."""
    db = _load()
    now = datetime.datetime.utcnow().isoformat() + "Z"
    changed = False

    # Migrate from intake-journal.jsonl
    journal_path = "/home/mike/nebula/ledgers/intake-journal.jsonl"
    if os.path.exists(journal_path):
        with open(journal_path) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                except json.JSONDecodeError:
                    continue
                email = entry.get("email", "").strip().lower()
                if not email:
                    continue

                etype = entry.get("type", "")
                if etype == "free_kit_download":
                    stage = "lead_free_kit"
                elif etype == "growth_launch_intake":
                    stage = "customer_997"  # they paid
                else:
                    stage = "lead_warm"

                existing = db.get(email)
                if existing:
                    old_stage = existing.get("current_stage", "lead_free_kit")
                    if _stage_rank(stage) > _stage_rank(old_stage):
                        existing["current_stage"] = stage
                    if stage not in existing.get("stages", []):
                        existing.setdefault("stages", []).append(stage)
                    existing["last_seen"] = now
                    if "url" in entry and entry["url"]:
                        existing["url"] = existing.get("url") or entry["url"]
                    db[email] = existing
                else:
                    db[email] = {
                        "email": email,
                        "name": entry.get("name", ""),
                        "current_stage": stage,
                        "stages": [stage],
                        "first_seen": entry.get("timestamp", now),
                        "last_seen": now,
                        "sources": [entry.get("source", "migration")],
                        "url": entry.get("url", ""),
                        "offer": entry.get("offer", ""),
                        "product_stage": entry.get("product_stage", ""),
                        "total_spent_cents": 0,
                        "opted_out": False,
                        "opted_out_at": None,
                        "tags": [],
                        "notes": "",
                    }
                changed = True

    _save(db)

    if changed:
        _journal({"timestamp": now, "action": "migration",
                  "message": "Migrated from intake-journal.jsonl"})
    return changed



def generate_angles(count=5, offer=None, audience=None):
    """Angle Generator — adapted from Claude Marketing Department.
    
    Generates distinct content angles for Nebula's offers based on real
    lead data, buying triggers, and current content performance.
    
    Returns a list of angle dicts with: title, message, target_segment, 
    hook_line, test_priority, pattern.
    """
    db = _load()
    perf = content_performance()
    
    # Build audience description from real leads
    stages = {}
    total_leads = 0
    for email, lead in db.items():
        stage = lead.get("current_stage", "")
        stages[stage] = stages.get(stage, 0) + 1
        total_leads += 1
    top_stage = max(stages, key=stages.get) if stages else "none"
    
    # Determine what's working from content performance
    best_angle = "teach"
    if perf["top_angles"]:
        best_angle = perf["top_angles"][0]["angle"]
    
    # Angle patterns from the playbook
    angle_patterns = [
        {
            "title": "The Leak Hunter",
            "pattern": "audit_reveal",
            "hook": "Most founders spend $X on ads and ignore what happens after the click.",
            "message": "Your landing page is the bottleneck, not your traffic.",
            "target_segment": "ad_spenders",
            "test_priority": 1,
        },
        {
            "title": "The 60-Second Fix",
            "pattern": "teach_process",
            "hook": "There's one change that fixes most landing pages and it takes 60 seconds.",
            "message": "Your headline should describe the problem, not the product.",
            "target_segment": "diy_founders",
            "test_priority": 2,
        },
        {
            "title": "The Money Leak",
            "pattern": "pain_amplify",
            "hook": "You're literally burning money if your landing page doesn't do this one thing.",
            "message": "Every leak costs you conversions = costs you money.",
            "target_segment": "budget_conscious",
            "test_priority": 3,
        },
        {
            "title": "The Honest Agency",
            "pattern": "trust_build",
            "hook": "Agencies charge $5k for what I'm about to show you in 30 seconds.",
            "message": "The audit is free because the fix is obvious once you see it.",
            "target_segment": "agency_skeptics",
            "test_priority": 4,
        },
        {
            "title": "The Checklist",
            "pattern": "framework",
            "hook": "5 questions your landing page must answer before you spend another dollar on ads.",
            "message": "If your page doesn't answer all 5, you're leaking buyers.",
            "target_segment": "systematic_founders",
            "test_priority": 5,
        },
        {
            "title": "The Before/After",
            "pattern": "case_study",
            "hook": "We changed one sentence on a landing page and conversion went from 0.8% to 2.4%.",
            "message": "The headline alone accounts for 40% of conversion variance.",
            "target_segment": "results_driven",
            "test_priority": 6,
        },
        {
            "title": "The Objection Killer",
            "pattern": "objection",
            "hook": "\"I don't have time to fix my landing page\" — here's why that's costing you more.",
            "message": "The $147 Fix Pack takes 24h. Losing 60% of your traffic takes forever.",
            "target_segment": "busy_founders",
            "test_priority": 7,
        },
        {
            "title": "The Mechanism",
            "pattern": "how_it_works",
            "hook": "Here's exactly how a landing page audit works (and why most audits are useless).",
            "message": "Real audit = scoring 5 dimensions, not a subjective opinion.",
            "target_segment": "technical_founders",
            "test_priority": 8,
        },
    ]
    
    # Bias toward best-performing pattern
    if best_angle == "teach":
        taught = [a for a in angle_patterns if a["pattern"] in ("teach_process", "framework", "how_it_works")]
        others = [a for a in angle_patterns if a not in taught]
        priority = taught[:2] + others[:count-2]
    elif best_angle == "hook":
        hooked = [a for a in angle_patterns if a["pattern"] in ("pain_amplify", "audit_reveal")]
        others = [a for a in angle_patterns if a not in hooked]
        priority = hooked[:2] + others[:count-2]
    else:
        priority = angle_patterns[:count]
    
    # Add real data enrichment
    for angle in priority:
        angle["total_leads"] = total_leads
        angle["top_stage"] = top_stage
        angle["best_angle"] = best_angle
    
    return priority[:count]


def generate_icp():
    """ICP Builder — adapted from Claude Marketing Department.
    
    Analyzes current lead database to produce a structured ICP definition
    with traits, triggers, channels, and exclusion criteria.
    
    Returns dict with icp_statement, core_traits, triggers, channels, exclusions.
    """
    db = _load()
    
    # Analyze which leads reach the highest stages
    buyers = []
    warm = []
    cold = []
    for email, lead in db.items():
        stage = lead.get("current_stage", "")
        source = lead.get("sources", [])
        name = lead.get("name", "")
        url = lead.get("url", "")
        tags = lead.get("tags", [])
        rank = _stage_rank(stage)
        
        entry = {"email": email, "stage": stage, "sources": source, "tags": tags}
        
        if rank >= _stage_rank("customer_97"):
            buyers.append(entry)
        elif rank >= _stage_rank("lead_warm"):
            warm.append(entry)
        else:
            cold.append(entry)
    
    # Source analysis
    source_counts = {}
    for entry in buyers + warm:
        for s in entry["sources"]:
            source_counts[s] = source_counts.get(s, 0) + 1
    top_sources = sorted(source_counts, key=source_counts.get, reverse=True)[:3]
    
    # ICP statement
    icp_statement = (
        "Founders running paid ads (Google, Facebook, LinkedIn) with "
        "conversion rates under 2%, actively bleeding money on traffic "
        "that doesn't convert, who own their landing page and can make "
        "changes without agency approval."
    )
    
    return {
        "icp_statement": icp_statement,
        "core_traits": {
            "role": "Founder, CEO, or marketing decision-maker",
            "pain": "Running ads with zero or low conversions",
            "budget": "Spending $500+/mo on ads with visible mismatch",
            "autonomy": "Owns their landing page or can authorize changes",
            "urgency": "Has noticed the problem (buying trigger active)",
        },
        "buying_triggers": [
            "Ad spend with zero conversions",
            "\"Wasting money on ads\" posts on Reddit/LinkedIn",
            "Recently launched ads with no ROI",
            "Complaining about landing page performance",
            "Tried agencies without results",
        ],
        "channels": {
            "highest_value": top_sources if top_sources else ["reddit", "linkedin"],
            "recommended": ["Reddit (r/entrepreneur, r/startups, r/SaaS, r/PPC)", "LinkedIn (founder posts, ad pain)", "Inbound (audit tool)"],
        },
        "who_to_ignore": [
            "Enterprise marketing teams",
            "Agencies (they build pages for others)",
            "Pre-revenue startups with no ad spend",
            "Anyone happy with their conversion rate",
        ],
        "data_snapshot": {
            "total_leads_in_db": len(db),
            "buyers": len(buyers),
            "warm_leads": len(warm),
            "cold_leads": len(cold),
            "top_acquisition_sources": top_sources,
        },
    }


COMPETITORS_DB = "/home/mike/nebula/ledgers/competitors.json"


def _load_competitors():
    """Load competitor messaging database."""
    if not os.path.exists(COMPETITORS_DB):
        return {}
    try:
        with open(COMPETITORS_DB) as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}


def _save_competitors(data):
    """Save competitor messaging database."""
    os.makedirs(os.path.dirname(COMPETITORS_DB), exist_ok=True)
    with open(COMPETITORS_DB, "w") as f:
        json.dump(data, f, indent=2)


def update_competitor_messaging(name, data):
    """Add or update a competitor's messaging profile.
    
    data should include:
      - headline: hero value prop
      - problem_claimed: what they say they solve
      - icp_description: who they target
      - pricing: how they charge
      - messaging_angles: list of their core angles
      - what_they_dont_say: list of topics they ignore
      - source: where this info came from (url, date)
    """
    db = _load_competitors()
    db[name.lower()] = {
        **data,
        "last_updated": datetime.datetime.utcnow().isoformat() + "Z",
    }
    _save_competitors(db)
    return {"status": "updated", "competitor": name, "total_competitors": len(db)}


def messaging_gap_finder():
    """Messaging Gap Finder — adapted from Claude Marketing Department.
    
    Analyzes competitor messaging against Nebula's buying triggers and
    value props to find uncontested angles we can own.
    
    Returns:
      - gaps: ranked list of messaging angles competitors aren't using
      - occupied: angles competitors already own (avoid or counter)
      - recommendations: what to say, where, and to whom
    """
    competitors = _load_competitors()
    
    # Nebula's own messaging arsenal
    nebula_angles = {
        "trigger_based": "We find people actively bleeding money on ads, not spray a list",
        "self_serve_audit": "$0 audit in 60 seconds, no sales call, no calendar",
        "product_led": "Self-serve checkout, automated delivery, no human touch",
        "concrete_fix": "Implementable changes, not strategic advice",
        "price_transparency": "$147 for a fix, not a monthly subscription",
        "founder_friendly": "Built for founders by someone who sells to founders",
        "no_domain_farm": "One inbox, AgentMail handles deliverability — no 75-domain fleet needed",
        "trigger_aware": "Outreach only when someone is actively buying",
        "30_day_guarantee": "30-day money back if conversion doesn't improve",
        "no_meetings": "From audit to fix to checkout — zero meetings",
    }
    
    # Known buying triggers we've validated
    buying_triggers = [
        "ad spend with zero conversions",
        "wasting money on ads",
        "landing page not converting",
        "low conversion rate after paid traffic",
        "agencies didn't deliver",
        "burning budget on traffic that doesn't convert",
    ]
    
    # Aggregate all competitor angles
    all_competitor_angles = []
    competitor_names = []
    for name, data in competitors.items():
        competitor_names.append(name)
        for angle in data.get("messaging_angles", []):
            all_competitor_angles.append({
                "competitor": name,
                "angle": angle,
            })
        for gap in data.get("what_they_dont_say", []):
            all_competitor_angles.append({
                "competitor": name,
                "angle": f"[GAP they admit] {gap}",
            })
    
    # Score each Nebula angle: is anyone saying this?
    scored_gaps = []
    for key, angle_text in nebula_angles.items():
        occupied_by = []
        for ca in all_competitor_angles:
            # Simple overlap check — does competitor angle touch this?
            overlap = _angle_overlap(angle_text, ca["angle"])
            if overlap > 0.3:
                occupied_by.append(ca["competitor"])
        
        # Check against buying triggers
        trigger_overlap = 0
        for trigger in buying_triggers:
            if _angle_overlap(angle_text, trigger) > 0.2:
                trigger_overlap += 1
        
        gap_strength = "strong" if len(occupied_by) == 0 else "moderate" if len(occupied_by) == 1 else "occupied"
        
        scored_gaps.append({
            "key": key,
            "nebula_angle": angle_text,
            "gap_strength": gap_strength,
            "competitors_saying_it": occupied_by if occupied_by else ["none"],
            "buying_trigger_relevance": trigger_overlap,
            "recommendation": "Lead with this — uncontested" if gap_strength == "strong" else "Use but differentiate" if gap_strength == "moderate" else "Avoid head-on — counter or reframe",
        })
    
    # Sort: strongest gaps first (no competitor saying it + high trigger relevance)
    scored_gaps.sort(key=lambda x: (
        0 if x["gap_strength"] == "strong" else 1 if x["gap_strength"] == "moderate" else 2,
        -x["buying_trigger_relevance"],
    ))
    
    # What competitors ARE saying (occupied territory)
    occupied_territory = [g for g in scored_gaps if g["gap_strength"] == "occupied"]
    
    # Generate specific recommendations
    strong_gaps = [g for g in scored_gaps if g["gap_strength"] == "strong"]
    recommendations = []
    
    for g in strong_gaps[:3]:
        recommendations.append({
            "angle": g["nebula_angle"],
            "where_to_use": "LinkedIn posts, cold email, landing page headline",
            "why_it_hits": f"Competitors don't say this, and it connects to {g['buying_trigger_relevance']} buying trigger(s)",
        })
    
    # Content performance data (if available)
    try:
        perf = content_performance()
        best_angle_type = perf["top_angles"][0]["angle"] if perf["top_angles"] else "unknown"
    except Exception:
        best_angle_type = "unknown"
    
    return {
        "gap_analysis": {
            "competitors_analyzed": competitor_names,
            "total_nebula_angles": len(nebula_angles),
            "total_competitor_angles": len(all_competitor_angles),
        },
        "ranked_gaps": scored_gaps,
        "best_opportunities": [g for g in scored_gaps if g["gap_strength"] == "strong"][:5],
        "occupied_territory": occupied_territory[:5],
        "recommendations": recommendations,
        "content_alignment": {
            "best_performing_angle_type": best_angle_type,
            "note": "Prioritize gaps that match your best-performing content angle",
        },
        "action": "Update competitor data with: python3 lead_manager.py add-competitor <name>",
    }


def _angle_overlap(text_a, text_b):
    """Multi-strategy overlap score between two strings (0.0 to 1.0).
    
    Checks: exact word overlap, substring containment, and keyword signals.
    """
    a_lower = text_a.lower()
    b_lower = text_b.lower()
    
    # Strategy 1: exact word overlap
    words_a = set(a_lower.split())
    words_b = set(b_lower.split())
    stopwords = {"the", "a", "an", "to", "for", "of", "in", "on", "and", "or", "is", "are",
                 "that", "this", "with", "from", "it", "at", "by", "as", "be", "we", "you",
                 "your", "their", "our", "not", "no", "but", "if", "so", "do", "does", "will",
                 "can", "all", "just", "more", "than", "very", "been", "what", "when", "where",
                 "who", "how", "has", "had", "have", "does", "did", "was", "were"}
    sig_a = words_a - stopwords
    sig_b = words_b - stopwords
    intersection = sig_a & sig_b
    word_score = len(intersection) / max(len(sig_a), len(sig_b)) if sig_a and sig_b else 0.0
    
    # Strategy 2: keyword signal matching (semantic clusters)
    trigger_keywords = {
        "ad": {"ad", "ads", "spend", "traffic", "budget", "burning", "wasting", "cost"},
        "conversion": {"conversion", "convert", "converting", "converts", "leak", "leaks"},
        "money": {"money", "dollar", "cash", "budget", "roi", "spend", "spent"},
        "targeting": {"trigger", "buying", "signal", "active", "pain", "bleeding"},
        "self_serve": {"audit", "free", "checkout", "self-serve", "automated", "seconds"},
        "no_sales": {"sales call", "meeting", "calendar", "demo", "no human", "self-serve"},
        "founder": {"founder", "founders", "startup", "bootstrapped", "diy"},
        "fix": {"fix", "fixes", "implement", "changes", "deliverable", "concrete"},
    }
    
    keyword_score = 0.0
    matches = 0
    for cluster_name, keywords in trigger_keywords.items():
        a_has = any(kw in a_lower for kw in keywords)
        b_has = any(kw in b_lower for kw in keywords)
        if a_has and b_has:
            matches += 1
    
    if matches > 0:
        keyword_score = matches / len(trigger_keywords) * 0.5  # weight: 0-0.5
    
    # Strategy 3: substring containment (e.g. "ads" in "wasting money on ads")
    # Check if any 4+ char word from one exists in the other
    long_a = {w for w in sig_a if len(w) > 3}
    long_b = {w for w in sig_b if len(w) > 3}
    containment_score = 0.0
    if long_a and long_b:
        contained = sum(1 for w in long_a if any(w in bw for bw in long_b)) + \
                    sum(1 for w in long_b if any(w in aw for aw in long_a))
        max_possible = len(long_a) + len(long_b)
        containment_score = (contained / max_possible) * 0.3 if max_possible > 0 else 0.0
    
    # Combined score (0.0 - 1.0)
    return min(1.0, word_score + keyword_score + containment_score)


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "migrate":
        migrate_from_jsonl()
        print("Migration complete.")
        print(json.dumps(get_stats(), indent=2))
    elif len(sys.argv) > 1 and sys.argv[1] == "stats":
        print(json.dumps(get_stats(), indent=2))
    elif len(sys.argv) > 2 and sys.argv[1] == "list":
        print(export_csv(sys.argv[2] if len(sys.argv) > 2 else None))
    elif len(sys.argv) > 1 and sys.argv[1] == "angles":
        count = int(sys.argv[2]) if len(sys.argv) > 2 else 5
        result = generate_angles(count=count)
        print(json.dumps(result, indent=2))
    elif len(sys.argv) > 1 and sys.argv[1] == "icp":
        result = generate_icp()
        print(json.dumps(result, indent=2))
    elif len(sys.argv) > 1 and sys.argv[1] == "gaps":
        result = messaging_gap_finder()
        print(json.dumps(result, indent=2))
    elif len(sys.argv) > 2 and sys.argv[1] == "add-competitor":
        """Add/update competitor messaging. Usage: python3 lead_manager.py add-competitor <name>"""
        name = sys.argv[2]
        print(f"Paste competitor messaging for '{name}' as JSON, then Ctrl+D:")
        raw = sys.stdin.read()
        data = json.loads(raw)
        result = update_competitor_messaging(name, data)
        print(json.dumps(result, indent=2))
    else:
        print("Usage: python3 lead_manager.py [migrate|stats|list <stage>|angles [N]|icp|gaps|add-competitor <name>]")
