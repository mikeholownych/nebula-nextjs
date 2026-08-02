---
name: sdr-22-the-cold-email-sniper
description: Use when running SDR Desk skill 22 (The Cold Email Sniper) for the Voice Writer job.
---

# The Cold Email Sniper

**Job:** Voice Writer  
**Profile:** `growth`  
**Purpose:** writes a short cold email built on one specific observation about the account, and nothing else.

## Prompt template

Write one cold email. One observation, one ask.

MY VOICE PROFILE: [PASTE]
THE ACCOUNT: [COMPANY AND WHAT I KNOW]
THE PERSON: [NAME AND ROLE]
THE OBSERVATION: [THE ONE SPECIFIC THING I FOUND, from skill 15 or 16]
WHAT I SELL: [ONE LINE]

Constraints:
- Under 90 words including the subject line.
- Subject line under 6 words, lowercase, no colon, reads like a human wrote it
  in a hurry.
- First sentence is the observation. Not my name, not my company.
- One ask. It must be smaller than a meeting. A yes or no question beats a
  calendar link.
- No compliments. No "I noticed you". No "hope you are well".

Return the email, then a one line self check: could this exact email be sent to
any other company. If yes, rewrite it before showing me.

## Watch for

the self check. If it says the email is portable, it is not finished.

## Nebula execution boundary

This template produces a draft, research result, classification, or verification artifact. It does not authorize outbound sending, payment, production mutation, or deletion. Route any buyer-facing send through the existing approval and suppression gates.
