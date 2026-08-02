---
name: sdr-30-sequence-audit
description: Use when running SDR Desk skill 30 (Sequence Audit) for the Sequence Builder job.
---

# Sequence Audit

**Job:** Sequence Builder  
**Profile:** `growth`  
**Purpose:** runs over your live sequences on a schedule and flags the ones that have stopped working.

## Prompt template

Audit my live sequences and tell me what to kill.

THE DATA:
[PASTE PER SEQUENCE: name, sent, opens if you have them, replies, positive
replies, meetings, date launched, last edited]

Return:

THE SCOREBOARD
| Sequence | Positive reply rate | Meetings per 100 sent | Trend | Verdict |

Verdict is one of: KEEP, FIX, KILL.

WHAT TO KILL AND WHY
Be decisive. A sequence at half the rate of my best one is costing me the
difference every day it runs.

WHAT TO FIX AND HOW
For each FIX, name the single change with the best chance of moving it, and
say which touch to change.

WHAT MY BEST ONE IS DOING
The thing my winner does that the others do not. This is the pattern to copy.

Rules:
- Judge on positive replies and meetings. Open rate is not an outcome.
- If a sequence has under 100 sends, say SAMPLE TOO SMALL rather than passing
  judgement on noise.

## Watch for

verdicts on tiny samples. Under a hundred sends, it is reading noise.

## Nebula execution boundary

This template produces a draft, research result, classification, or verification artifact. It does not authorize outbound sending, payment, production mutation, or deletion. Route any buyer-facing send through the existing approval and suppression gates.
