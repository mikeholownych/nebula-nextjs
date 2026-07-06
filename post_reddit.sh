#!/bin/bash
# Reddit post automation - using praw (Python Reddit API Wrapper) or curl

# For MVP, create instruction file to post manually or via API
cat > REDDIT_POSTS_TO_SEND.txt << 'POSTS'
=====================================
POST 1: r/indiehackers
=====================================
Title: Selling $97 "audit" to get first customer. Am I insane or onto something?

Body:
Started building an AI cold email service 48 hours ago. Zero customers, $200 in the hole, 72 hours to prove it works.

Strategy: Don't wait for organic growth. Sell $97 audits.

What you get:
- I review your prospect list  
- Optimize your email template
- Send 10 test emails for you
- Send you the results (replies, analysis, recommendations)
- 30-day refund if zero replies

Am I crazy for thinking this is a better go-to-market than the typical "sign up for beta" funnel?

**Payment link:** http://localhost:8765/audit.html

Honest feedback welcome. This is real.

=====================================
POST 2: r/SaaS
=====================================
Title: I'm building an AI cold email service. Selling $97 pilot spots to fund it.

Body:
I'm Mike, building an autonomous SDR service. Instead of asking for funding, I'm shipping the product and selling it.

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

Happy to answer questions in the comments.

=====================================
POST 3: r/Entrepreneur
=====================================
Title: Built an AI cold email service in 2 days. Now selling $97 pilots to fund it.

Body:
Not asking for upvotes, just feedback. Here's what I did:

Day 1-2: Built the product (automated email sending + reply handling)
Day 3: Realized I have $0 and $200 in the hole
Decision: Stop waiting. Start selling.

Now offering $97 "outreach audits" to anyone who wants to test cold email but doesn't know if their list/message works.

Deliverables:
✓ List quality audit
✓ Email template optimization
✓ 10 live test emails  
✓ Results report
✓ Refund if no replies

Target customer: Founders with 0-10 customers who need pipeline but don't have budget for $5k/mo services yet.

Is this sustainable? No. Is it a way to get real revenue and feedback in 72 hours? Yes.

**Try the audit:** http://localhost:8765/audit.html

What am I missing?

POSTS

echo "[OK] Reddit posts ready to send"
echo "[NEXT] Post these manually to Reddit or use Python PRAW library"
cat REDDIT_POSTS_TO_SEND.txt
