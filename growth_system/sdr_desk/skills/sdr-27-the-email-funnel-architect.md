---
name: sdr-27-the-email-funnel-architect
description: Use when running SDR Desk skill 27 (The Email Funnel Architect) for the Sequence Builder job.
---

# The Email Funnel Architect

**Job:** Sequence Builder  
**Profile:** `growth`  
**Purpose:** maps what happens after a reply. Which sequence they exit, what they get next, and who owns them now.

## Prompt template

Map what happens AFTER a reply. This is the part I keep improvising.

MY SEQUENCES: [LIST THEM]
REPLY TYPES I ACTUALLY GET: [interested, later, referred, objection, angry,
wrong person, unsubscribe, add any of your own]

For each reply type return:
| Reply type | Exit which sequence | What they get next | When | Who owns it |

Then:

THE HANDOFFS
Where a human must take over, and what that human needs to know in one line.

THE LEAKS
Where a person could end up in NO sequence at all. This is where pipeline dies
quietly, so be thorough and paranoid here.

THE DOUBLE SEND RISK
Where someone could receive two things at once and how to prevent it.

Rules:
- Every reply type must lead somewhere. "Nothing" is a leak, not a destination.
- If two sequences could both claim someone, say which one wins.

## Watch for

the leaks section. That is the whole reason to run this skill.

## Nebula execution boundary

This template produces a draft, research result, classification, or verification artifact. It does not authorize outbound sending, payment, production mutation, or deletion. Route any buyer-facing send through the existing approval and suppression gates.
