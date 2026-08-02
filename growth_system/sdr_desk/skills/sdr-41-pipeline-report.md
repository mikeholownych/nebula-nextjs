---
name: sdr-41-pipeline-report
description: Use when running SDR Desk skill 41 (Pipeline Report) for the Meeting Qualifier job.
---

# Pipeline Report

**Job:** Meeting Qualifier  
**Profile:** `support`  
**Purpose:** the Friday readout. What booked, what died, what is stuck and why, written without you.

## Prompt template

Write my Friday pipeline readout.

THE DATA: [PASTE THIS WEEK: sent, replies, meetings booked, meetings held,
deals moved, deals died, plus last week's same numbers]

Return:

THE NUMBER
The one number that matters most this week, and whether it moved. Nothing else
in this section.

WHAT BOOKED
Which meetings, from which source, and what those sources have in common.

WHAT DIED
What died and why. Group the reasons. If one reason is over a third of the
losses, say so loudly.

WHAT IS STUCK
Deals that have not moved in 14 days, with what each is waiting on and who
owns the unblock.

THE ONE CHANGE
The single change for next week, with the reason. One. Not three.

Rules:
- Compare to last week or the numbers mean nothing.
- If a number got worse, lead with it. A readout that only reports good news
  is a press release.
- Under 400 words total.

## Watch for

three recommendations. One change, executed, beats three considered.

## Nebula execution boundary

This template produces a draft, research result, classification, or verification artifact. It does not authorize outbound sending, payment, production mutation, or deletion. Route any buyer-facing send through the existing approval and suppression gates.
