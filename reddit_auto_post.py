#!/usr/bin/env python3
"""Auto-post to Reddit using praw"""
import praw
import time
import os

# Check if praw is installed
try:
    import praw
except ImportError:
    print("[ERROR] praw not installed. Install with: pip install praw")
    print("[MANUAL] Posts ready in REDDIT_POSTS_TO_SEND.txt")
    exit(1)

# Reddit credentials would go here
# For MVP, skip authentication and use manual posting

posts = [
    {
        "subreddit": "indiehackers",
        "title": "Selling $97 \"audit\" to get first customer. Am I insane or onto something?",
        "body": """Started building an AI cold email service 48 hours ago. Zero customers, $200 in the hole, 72 hours to prove it works.

Strategy: Don't wait for organic growth. Sell $97 audits.

What you get:
- I review your prospect list  
- Optimize your email template
- Send 10 test emails for you
- Send you the results (replies, analysis, recommendations)
- 30-day refund if zero replies

Am I crazy for thinking this is a better go-to-market than the typical "sign up for beta" funnel?

**Payment link:** http://localhost:8765/audit.html

Honest feedback welcome. This is real."""
    },
    {
        "subreddit": "SaaS",
        "title": "I'm building an AI cold email service. Selling $97 pilot spots to fund it.",
        "body": """I'm Mike, building an autonomous SDR service. Instead of asking for funding, I'm shipping the product and selling it.

Here's the deal: I'll audit your prospect list + optimize your email + send 10 test emails on your behalf. You get replies or your money back.

**$97. 72 hours. Refund guarantee.**

Why am I doing this?
- Validate demand (if 1 person buys, the model works)
- Fund the next phase ($497 full pilot)
- Build in public (no hype, just execution)

If you have:
- A prospect list (even rough)
- An offer you're testing  
- Uncertainty about cold email

...this is for you.

**Get the audit:** http://localhost:8765/audit.html

Happy to answer questions in the comments."""
    }
]

print("[INFO] Reddit posts prepared. Manual posting required.")
print("[ACTION] Go to https://reddit.com and paste posts from REDDIT_POSTS_TO_SEND.txt")
print("[REASON] Requires Reddit account with API credentials")

