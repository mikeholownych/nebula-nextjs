---
name: sdr-31-reply-classify
description: Use when running SDR Desk skill 31 (Reply Classify) for the Reply Classifier job.
---

# Reply Classify

**Job:** Reply Classifier  
**Profile:** `support`  
**Purpose:** sorts every reply into interested, later, referred and dead, and tells you the next action for each.

## Prompt template

Sort these replies and tell me what to do with each.

REPLIES:
[PASTE THEM RAW, with sender and date]

Classify every one as exactly one of:
INTERESTED, wants to talk now
LATER, real interest, wrong timing, MUST capture the date they named
REFERRED, pointed me to someone else, MUST capture that name
OBJECTION, interested but blocked on something specific
DEAD, genuine no
ANGRY, needs a human immediately, do not draft anything

Return:
| Who | Class | The evidence phrase | Next action | When | Draft ready? |

The evidence phrase is the actual words that made you classify it that way.
Quote them.

Then:
THE DATES. Every date anybody named, as a list, so nothing gets lost.
THE NAMES. Every person referred to me, with who referred them.
THE HUMAN PILE. Anything ANGRY or ambiguous. Never draft for these.

Rules:
- "Sounds interesting, send me info" is LATER, not INTERESTED. Do not flatter
  my pipeline.
- If a reply is ambiguous, put it in the human pile. Guessing costs more than
  asking.

## Watch for

optimistic classification. "Send me info" is not a buying signal.

## Nebula execution boundary

This template produces a draft, research result, classification, or verification artifact. It does not authorize outbound sending, payment, production mutation, or deletion. Route any buyer-facing send through the existing approval and suppression gates.
