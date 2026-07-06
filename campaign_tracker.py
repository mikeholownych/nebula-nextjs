#!/usr/bin/env python3
"""Real-time campaign tracking with accountability"""
import json, os
from datetime import datetime

class CampaignTracker:
    def __init__(self, campaign_name):
        self.campaign_name = campaign_name
        self.log_file = f"tracker_{campaign_name}_{int(datetime.now().timestamp())}.json"
        self.data = {
            "campaign": campaign_name,
            "started": datetime.now().isoformat(),
            "sends": [],
            "replies": [],
            "conversions": []
        }
    
    def log_send(self, email, method="SMTP"):
        """Log an outgoing email"""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "email": email,
            "method": method,
            "status": "sent"
        }
        self.data["sends"].append(entry)
        self._save()
        print(f"✓ SEND: {email}")
    
    def log_reply(self, from_email):
        """Log an incoming reply"""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "from": from_email,
            "status": "reply"
        }
        self.data["replies"].append(entry)
        self._save()
        print(f"💬 REPLY: {from_email}")
    
    def log_conversion(self, email, amount):
        """Log a sale"""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "email": email,
            "amount": amount,
            "status": "conversion"
        }
        self.data["conversions"].append(entry)
        self._save()
        print(f"💰 CONVERSION: {email} - ${amount}")
    
    def _save(self):
        with open(self.log_file, "w") as f:
            json.dump(self.data, f, indent=2)
    
    def summary(self):
        sent = len(self.data["sends"])
        replies = len(self.data["replies"])
        conversions = len(self.data["conversions"])
        reply_rate = (replies / sent * 100) if sent > 0 else 0
        
        return f"""
=== CAMPAIGN SUMMARY ===
Sends: {sent}
Replies: {replies} ({reply_rate:.1f}%)
Conversions: {conversions}
"""

# Initialize tracker
tracker = CampaignTracker("v1_smtp_followup")

# Log the 27 sends we just made
emails = [
    "tianyajinhui@gmail.com", "quietpulse.social@gmail.com", "voder.ai.agent@gmail.com",
    "quratulaincreatives@gmail.com", "releaselogofficial@gmail.com", "rkotcher@gmail.com",
    "gupta.shivani7896@gmail.com", "kevin.chisumdev@gmail.com", "career4lucas@gmail.com",
    "shawnxu0208@gmail.com", "scalewords.agency@gmail.com", "zyvara.group@gmail.com",
    "dinirangapremanayake@gmail.com", "beniciocardozomdp@gmail.com", "algor.tago@gmail.com",
    "jerryatbusiness@gmail.com", "stellytips@gmail.com", "lholmes274@gmail.com",
    "rcschupp@gmail.com", "davidwang913526@gmail.com", "muhammadabusufyangoraya@gmail.com",
    "nedco80@gmail.com", "vsl.and@gmail.com", "bjoroen.eirik@gmail.com",
    "matze.schedel@gmail.com", "ainikaautomation@gmail.com", "shadowroot47@outlook.com"
]

for email in emails:
    tracker.log_send(email, "SMTP")

print(tracker.summary())
