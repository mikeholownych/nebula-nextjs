---
name: sdr-36-the-engagement-sniper
description: Use when running SDR Desk skill 36 (The Engagement Sniper) for the Reply Classifier job.
---

# The Engagement Sniper

**Job:** Reply Classifier  
**Profile:** `support`  
**Purpose:** finds the target accounts posting publicly today and drafts a comment worth reading.

## Prompt template

Find where my targets are talking today, and write something worth saying.

MY TARGET ACCOUNTS AND PEOPLE: [PASTE]
WHAT I KNOW ABOUT: [MY GENUINE AREAS OF EXPERTISE]

Find their public posts from the last 48 hours. For each one worth engaging:

| Who | What they posted | Why it is worth my comment | My comment |

The comment must:
- Be under 30 words
- Add something they did not say
- Contain zero pitch, zero product, zero profile bait
- Be something I could defend if they replied "say more"

Then:
SKIP THESE. Posts I should not comment on, and why. Announcements, condolences,
anything outside what I actually know about.

Rules:
- If I do not genuinely know something useful about the topic, SKIP. A hollow
  comment is worse than silence.
- Never write "great post". Never write "this". Never write "so true".

## Watch for

hollow agreement. If it cannot add anything, skipping is the correct output.

## Nebula execution boundary

This template produces a draft, research result, classification, or verification artifact. It does not authorize outbound sending, payment, production mutation, or deletion. Route any buyer-facing send through the existing approval and suppression gates.
