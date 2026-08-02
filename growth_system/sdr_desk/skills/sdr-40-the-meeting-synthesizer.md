---
name: sdr-40-the-meeting-synthesizer
description: Use when running SDR Desk skill 40 (The Meeting Synthesizer) for the Meeting Qualifier job.
---

# The Meeting Synthesizer

**Job:** Meeting Qualifier  
**Profile:** `support`  
**Purpose:** turns any call into notes, next steps, and an update anyone else can read, before you have left the room.

## Prompt template

Turn this call into something useful in under a minute of my reading time.

TRANSCRIPT OR MY ROUGH NOTES: [PASTE]

Return exactly this:

THE ONE LINE
What happened, in one sentence, for someone who was not there.

DECISIONS MADE
Only actual decisions. If nothing was decided, write NOTHING DECIDED, which is
itself important information.

ACTIONS
| Who | What | By when |
Only if a person and a date were actually named. Do not invent owners or dates.

OPEN QUESTIONS
What is still unresolved, and who needs to answer it.

THE FOLLOW UP EMAIL
Ready to send, under 120 words, confirming decisions and actions.

Rules:
- Never invent an owner or a deadline. UNASSIGNED and NO DATE are correct
  answers and they prompt me to fix it.
- The one line goes first because it is the only part most people will read.

## Watch for

invented deadlines. An UNASSIGNED action is honest and actionable, a fake one is neither.

## Nebula execution boundary

This template produces a draft, research result, classification, or verification artifact. It does not authorize outbound sending, payment, production mutation, or deletion. Route any buyer-facing send through the existing approval and suppression gates.
