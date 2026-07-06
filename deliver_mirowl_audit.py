#!/usr/bin/env python3
"""
Custom audit delivery for mirowl.com — acknowledges self-sufficient dev.
Pitch: call or $97 fix priority list (not $97 implementation).
"""
import sys, json, datetime
sys.path.insert(0, "/home/mike/nebula")

from deliver_audit import scrape_page, score_audit
from agentmail_client import AgentMailClient
from pathlib import Path

LEAD_EMAIL  = "support@mirowl.com"
LEAD_URL    = "https://mirowl.com"
THREAD_ID   = "fec78ae5-2213-4dc2-a725-7dfcbe06b605"
LEDGER_FILE = "/home/mike/nebula/ledgers/customer-ledger.jsonl"
HOT_LEAD_FILE = "/home/mike/nebula/HOT_LEAD.json"

def main():
    print(f"[1/4] Scraping {LEAD_URL}...")
    page = scrape_page(LEAD_URL)
    if page.get("error"):
        print(f"Scrape error: {page['error']} — continuing with partial data")

    print("[2/4] Scoring audit...")
    audit = score_audit(page)
    dims  = audit["dimensions"]
    overall = audit["overall"]
    grade   = audit["overall_grade"]

    print(f"  Overall: {overall}/10 ({grade})")
    for k, v in dims.items():
        print(f"  {k}: {v['score']}/10 ({v['grade']}) — {v['issue'][:60]}")

    # Compose subject
    subject = f"mirowl.com audit — {grade} overall ({overall}/10), here's the breakdown"

    # Sort by score ascending (worst first)
    sorted_dims = sorted(dims.items(), key=lambda x: x[1]["score"])
    dim_names = {
        "headline": "Headline Clarity",
        "cta": "Call-to-Action",
        "social_proof": "Social Proof",
        "speed": "Load Speed",
        "mobile": "Mobile Readiness",
    }

    top1 = sorted_dims[0]
    top2 = sorted_dims[1] if len(sorted_dims) > 1 else None

    # Build detailed findings
    findings_txt = ""
    findings_html = ""
    for key, data in dims.items():
        name = dim_names.get(key, key.title())
        findings_txt += f"\n{name}: {data['score']}/10 ({data['grade']})\n"
        findings_txt += f"  Issue: {data['issue']}\n"
        findings_txt += f"  Fix:   {data['fix']}\n"

        color = {"A+":"#00cc44","A":"#00cc44","B":"#88cc00","C":"#ffaa00","D":"#ff6600","F":"#ff2200"}.get(data["grade"],"#888")
        findings_html += f"""
<tr>
  <td style="padding:8px 12px;border-bottom:1px solid #222;font-weight:600;color:#e0e0e0">{name}</td>
  <td style="padding:8px 12px;border-bottom:1px solid #222;text-align:center;color:{color};font-weight:bold;white-space:nowrap">{data['score']}/10 ({data['grade']})</td>
  <td style="padding:8px 12px;border-bottom:1px solid #222;color:#aaa;font-size:13px">{data['issue']}</td>
</tr>"""

    top1_name = dim_names.get(top1[0], top1[0])
    top1_data = top1[1]
    top2_block_txt = ""
    top2_block_html = ""
    if top2:
        top2_name = dim_names.get(top2[0], top2[0])
        top2_data = top2[1]
        top2_block_txt = f"\n\nSecond priority — {top2_name} ({top2_data['score']}/10):\n{top2_data['fix']}"
        top2_block_html = f"""
<p style="margin:16px 0 4px 0;color:#ccc"><strong>Second priority — {top2_name} ({top2_data['score']}/10):</strong></p>
<p style="margin:0;color:#aaa;font-size:14px">{top2_data['fix']}</p>"""

    # ── Plain text ──────────────────────────────────────────────────────────────
    text = f"""You mentioned you handle dev yourself — perfect. This audit shows you exactly what's leaking conversions and in what order to fix it. No implementation needed from me.

Here's your audit for {LEAD_URL}:

Overall: {overall}/10 ({grade})

──────────────────────────────────────────────────
SCORES BY DIMENSION
──────────────────────────────────────────────────
{findings_txt}

──────────────────────────────────────────────────
#1 FIX — Highest impact, fix this first
──────────────────────────────────────────────────

{top1_name}: {top1_data['score']}/10

Problem: {top1_data['issue']}

Fix: {top1_data['fix']}
{top2_block_txt}

──────────────────────────────────────────────────

Two options if you want to go deeper:

1. Free 20-min call — I'll walk through the findings and answer any questions.
   Just reply and we'll find a time.

2. Written fix priority list ($97) — I'll rank every issue by impact vs effort,
   write the exact copy rewrites, and give you a sequenced implementation order.
   No discovery call needed. You implement, I advise. Reply "fix list" to get started.

Either way, the audit is yours. No strings.

— Mike
Nebula Components
nebulacomponents.shop
"""

    # ── HTML ────────────────────────────────────────────────────────────────────
    overall_color = {"A+":"#00ff88","A":"#00ff88","B":"#88ff00","C":"#ffaa00","D":"#ff6600","F":"#ff2200"}.get(grade,"#aaa")

    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0a0a0a;color:#e0e0e0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0">
<div style="max-width:620px;margin:0 auto;padding:32px 24px">

  <div style="background:#111;border-left:3px solid #00ff88;padding:14px 18px;margin-bottom:28px;border-radius:0 6px 6px 0">
    <p style="margin:0;color:#ccc;font-size:14px">You mentioned you handle dev yourself — <strong style="color:#fff">perfect</strong>. This audit shows you exactly what's leaking conversions and in what order to fix it. No implementation needed from me.</p>
  </div>

  <div style="margin-bottom:20px">
    <span style="background:#00ff88;color:#000;font-size:11px;font-weight:bold;padding:4px 10px;border-radius:3px;text-transform:uppercase;letter-spacing:1px">Free Landing Page Audit</span>
  </div>

  <h1 style="font-size:22px;font-weight:700;margin:0 0 6px 0;color:#fff">
    Overall: <span style="color:{overall_color}">{overall}/10 ({grade})</span>
  </h1>
  <p style="color:#555;font-size:13px;margin:0 0 28px 0">{LEAD_URL}</p>

  <table style="width:100%;border-collapse:collapse;background:#111;border-radius:8px;overflow:hidden;margin-bottom:28px">
    <thead>
      <tr style="background:#1a1a1a">
        <th style="padding:10px 12px;text-align:left;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px">Dimension</th>
        <th style="padding:10px 12px;text-align:center;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px">Score</th>
        <th style="padding:10px 12px;text-align:left;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px">Issue</th>
      </tr>
    </thead>
    <tbody>{findings_html}</tbody>
  </table>

  <div style="background:#0d1f0d;border:1px solid #00ff88;border-radius:6px;padding:20px;margin-bottom:24px">
    <div style="color:#00ff88;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">#1 Fix — Fix this first</div>
    <div style="color:#fff;font-size:16px;font-weight:bold;margin-bottom:8px">{top1_name}: {top1_data['score']}/10</div>
    <p style="margin:0 0 10px 0;color:#ccc;font-size:14px"><strong>Problem:</strong> {top1_data['issue']}</p>
    <p style="margin:0;color:#ccc;font-size:14px"><strong>Fix:</strong> {top1_data['fix']}</p>
  </div>

  {top2_block_html}

  <div style="background:#111;border:1px solid #333;border-radius:6px;padding:20px;margin-top:28px">
    <p style="margin:0 0 12px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px">Want to go deeper?</p>
    <p style="margin:0 0 10px 0;color:#e0e0e0;font-size:14px"><strong>Option 1 — Free 20-min call:</strong> I'll walk through the findings live. Just reply and we'll find a time.</p>
    <p style="margin:0;color:#e0e0e0;font-size:14px"><strong>Option 2 — Written fix priority list ($97):</strong> Every issue ranked by impact vs effort, exact copy rewrites, sequenced implementation order. Reply <strong style="color:#00ff88">"fix list"</strong> to get started. You implement, I advise.</p>
  </div>

  <p style="margin:28px 0 0 0;color:#555;font-size:13px">Either way — the audit is yours. No strings.</p>
  <p style="margin:12px 0 0 0;color:#888;font-size:13px">— Mike<br>Nebula Components<br><a href="https://nebulacomponents.shop" style="color:#555">nebulacomponents.shop</a></p>
</div>
</body>
</html>"""

    print("[3/4] Sending via AgentMail (reply to thread)...")
    client = AgentMailClient()

    # Get the latest message in the thread to reply to
    msgs = client.list_messages(thread_id=THREAD_ID, limit=10)
    if not msgs:
        print("[FATAL] No messages found in thread — cannot reply")
        sys.exit(2)

    # Most recent message is first (or last — sort by timestamp)
    latest = sorted(msgs, key=lambda m: m.get("timestamp",""), reverse=True)[0]
    msg_id = latest["message_id"]
    print(f"  Replying to message: {msg_id[:50]}...")

    resp = client.reply(
        message_id=msg_id,
        text=text,
        html=html,
    )
    print(f"  AgentMail reply response: {resp}")

    # Log to ledger
    print("[4/4] Logging to ledger...")
    entry = {
        "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
        "event": "audit_delivered",
        "lead_email": LEAD_EMAIL,
        "url": LEAD_URL,
        "thread_id": THREAD_ID,
        "overall_score": overall,
        "grade": grade,
        "top_issue": top1[0],
        "pitch": "call_or_fix_list_97",
    }
    with open(LEDGER_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")

    # Update HOT_LEAD to delivered
    hot = {
        "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
        "sender": "Mirowl Support <projects.safi1287@gmail.com>",
        "subject": subject,
        "thread_id": THREAD_ID,
        "stage": "audit_delivered",
        "action": "await_reply",
        "status": "delivered",
        "next_followup": (datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=48)).isoformat(),
        "pitch": "call_or_fix_list_97",
    }
    Path(HOT_LEAD_FILE).write_text(json.dumps(hot, indent=2))
    print("  HOT_LEAD.json updated → status: delivered")
    print(f"\n✅ Audit delivered to {LEAD_EMAIL} (thread {THREAD_ID[:8]}...)")
    print(f"   Pitch: 20-min call (free) OR fix priority list ($97)")
    print(f"   Next followup scheduled: {hot['next_followup']}")

if __name__ == "__main__":
    main()
