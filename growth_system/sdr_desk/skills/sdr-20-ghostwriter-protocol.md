---
name: sdr-20-ghostwriter-protocol
description: Use when running SDR Desk skill 20 (Ghostwriter Protocol) for the Voice Writer job.
---

# Ghostwriter Protocol

**Job:** Voice Writer  
**Profile:** `growth`  
**Purpose:** turns a rough thought into a finished message in your voice, keeping your argument rather than replacing it.

## Prompt template

Turn my rough thought into a finished message. Keep MY argument.

MY VOICE PROFILE: [PASTE THE OUTPUT OF SKILL 19]

MY ROUGH THOUGHT:
[BRAIN DUMP IT. Do not tidy it first, that is the point.]

WHO IT IS FOR: [PERSON AND CONTEXT]
WHAT I WANT TO HAPPEN: [THE ONE ACTION]

Return three versions:
SHORT, under 50 words
MEDIUM, 50 to 120 words
LONG, only if length genuinely earns its place, otherwise write "not needed"
and say why.

Then a line: which one you would send and why.

Rules:
- Keep my argument even if you disagree with it. Improve the expression, never
  the position.
- If my rough thought contains a genuinely great line, keep it word for word
  and tell me you kept it.
- No corporate softening. No "I hope this finds you well". No "just circling
  back". No "reaching out".

## Watch for

it replacing your point with a smoother, blander one. The keep-my-argument rule is not optional.

## Nebula execution boundary

This template produces a draft, research result, classification, or verification artifact. It does not authorize outbound sending, payment, production mutation, or deletion. Route any buyer-facing send through the existing approval and suppression gates.
