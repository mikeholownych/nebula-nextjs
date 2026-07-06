"""
Send email to Pushy app founder (iuri.jorbenadze@gmail.com)
Trigger: Posted on r/SaaS asking to roast his landing page
Product: pushupsalarm.com — push-ups alarm app getting traffic but needs conversions
"""
import sys
sys.path.insert(0, '/home/mike/nebula')

from agentmail_client import AgentMailClient
import json
from datetime import datetime

am = AgentMailClient()

to_email = "iuri.jorbenadze@gmail.com"
subject = "Saw your Pushy landing page post on r/SaaS — found something"
body = """Hi Iuri,

Saw your post on r/SaaS asking for a landing page roast for pushupsalarm.com. You mentioned 8k+ views and mentioned struggling to convert visitors.

I took a quick look at the page — the biology section ("Backed by Biology") is genuinely compelling, but the CTA above the fold is doing most of the work solo, and there's a conversion gap between people understanding what Pushy does and them deciding to download it.

One thing that usually moves the needle for apps like this: the social proof angle. The FAQ has solid copy but it's buried. The "trusted by X people" / real testimonial near the top matters more than people think on app landing pages.

Happy to do a quick audit of your full conversion flow (above the fold, trust signals, CTA sequencing) and send you what I'd change. Free — takes me 20 mins, might save you weeks of guessing.

Want me to send it?

— Mike
Nebula Components
"""

try:
    result = am.send(
        to=[to_email],
        subject=subject,
        text=body
    )
    thread_id = result.get('threadId') or result.get('thread_id') or result.get('id', 'unknown')
    print(f"SENT: {to_email} | thread_id={thread_id}")
    
    # Label it
    try:
        am.label_thread(thread_id, add=["targeted-outreach"])
        print(f"LABELED: {thread_id}")
    except Exception as e:
        print(f"Label failed (non-fatal): {e}")
    
    # Log it
    log_entry = f"{datetime.utcnow().isoformat()}Z | {to_email} | {subject} | {thread_id} | sent,targeted-outreach\n"
    with open('/home/mike/nebula/outreach_log.txt', 'a') as f:
        f.write(log_entry)
    print(f"LOGGED: {log_entry.strip()}")
    
    # Update contacted.json
    with open('/home/mike/nebula/contacted.json', 'r') as f:
        contacted = json.load(f)
    if isinstance(contacted, list):
        if to_email not in contacted:
            contacted.append(to_email)
    elif isinstance(contacted, dict):
        contacted[to_email] = {"date": datetime.utcnow().isoformat(), "product": "pushupsalarm.com", "trigger": "r/SaaS landing page roast post 1ns1okc"}
    with open('/home/mike/nebula/contacted.json', 'w') as f:
        json.dump(contacted, f, indent=2)
    print(f"CONTACTED: updated contacted.json with {to_email}")

except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
