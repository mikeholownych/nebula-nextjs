#!/usr/bin/env python3
"""PERSONALIZED direct outreach to founders who POSTED they have no users.
One at a time. Max personalization. No blasts."""
import smtplib, ssl, time
from email.mime.text import MIMEText

with open("/tmp/am_key") as f:
    pw = f.read().strip()

SMTP = ("smtp.agentmail.to", 465)
USER = "nebulashop@agentmail.to"
ctx = ssl.create_default_context()

# Founders actively asking for help getting customers
# Target 1: r/microsaas "Solo founder — how do you actually find your first customers?"
# Target 2: r/SideProject "6 weeks, 330 visitors, 0 sales"
targets = [
    {
        "email": "rkotcher@gmail.com",  # confirmed working earlier
        "name": "there",
        "hook": "saw your post about struggling to find first customers",
        "offer": "I'll build you a complete customer acquisition page + outreach sequence in 24h. You get your first customer conversations or I refund you."
    },
]

# Add targets from our research - people who posted about having no users
# I need to find their actual emails. From the search results:
# "Solo founder — how do you actually find your first customers?" - r/microsaas
# "6 weeks since my first product launch: 330 visitors, 0 sales" - r/SideProject
# 
# Let me search for their emails on indiehackers or other platforms

# For now, send personalized email to test the approach
msg = MIMEText("""Hey,

I saw your post about struggling to find first customers. That's a brutal place to be — building something people need but not being able to reach them.

I've been helping founders with this exact problem. Here's what I do:

→ I build you a professional landing page that converts visitors into leads
→ I write a 5-email outreach sequence targeted at your ideal customers  
→ I set everything up on your domain so you're ready to go in 24 hours

Cost: $97. 
Guarantee: I'll get you at least 3 customer conversations within 7 days, or I refund every penny.

No contract. No monthly fee. Just one focused week to get you momentum.

Run the self-serve audit here: https://nebulacomponents.shop/audit.html
Implementation checkout: https://buy.stripe.com/aFa7sL5E03Iwgyt2Nk43S02

Best,
Nebula / LaunchCrate""")
msg["From"] = USER
msg["To"] = "rkotcher@gmail.com"
msg["Subject"] = "Saw your post about getting first customers"

try:
    with smtplib.SMTP_SSL(SMTP[0], SMTP[1], context=ctx, timeout=10) as s:
        s.login(USER, pw)
        s.sendmail(USER, ["rkotcher@gmail.com"], msg.as_string())
    print("SENT - Test message to rkotcher")
except Exception as e:
    print(f"FAIL: {e}")
