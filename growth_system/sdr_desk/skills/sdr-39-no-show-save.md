---
name: sdr-39-no-show-save
description: Use when running SDR Desk skill 39 (No Show Save) for the Meeting Qualifier job.
---

# No Show Save

**Job:** Meeting Qualifier  
**Profile:** `support`  
**Purpose:** catches the ghost within an hour and rebooks them without sounding annoyed.

## Prompt template

They did not show. Write the save.

WHO: [NAME, ROLE, COMPANY]
THE MEETING: [WHAT IT WAS FOR, WHEN]
HISTORY: [HOW WE GOT HERE, ANY PREVIOUS NO SHOWS]
MY VOICE PROFILE: [PASTE]

Write three messages:

THE HOUR ONE
Sent within 60 minutes. Assumes something came up, because it usually did.
Under 30 words. Zero guilt. One click to rebook.

THE DAY TWO
If the first one got nothing. Slightly different angle, still no guilt, and
give them an easy out so the thread can close cleanly.

THE CLOSE
Sent a week later. Assumes the timing was wrong, leaves the door open, asks
nothing.

Then: HOW MANY TIMES. Given their history, tell me when to stop. If this is
their second no show, say it plainly and tell me what that means.

Rules:
- Never mention that they missed it. They know.
- No guilt in any version. Guilt does not book meetings, it ends threads.

## Watch for

passive aggression. "I noticed you weren't able to make it" is guilt wearing a suit.

## Nebula execution boundary

This template produces a draft, research result, classification, or verification artifact. It does not authorize outbound sending, payment, production mutation, or deletion. Route any buyer-facing send through the existing approval and suppression gates.
