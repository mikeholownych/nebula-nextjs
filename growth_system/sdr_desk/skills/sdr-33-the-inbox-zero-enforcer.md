---
name: sdr-33-the-inbox-zero-enforcer
description: Use when running SDR Desk skill 33 (The Inbox Zero Enforcer) for the Reply Classifier job.
---

# The Inbox Zero Enforcer

**Job:** Reply Classifier  
**Profile:** `support`  
**Purpose:** runs the inbox down to nothing on a schedule, drafting what it can and escalating what it should not touch.

## Prompt template

Run my inbox to zero. Draft what you can, escalate what you should not touch.

THE INBOX:
[PASTE EVERYTHING UNHANDLED, with dates]

Process every single item into one of four piles:

DRAFTED
You wrote the reply. Show it. Only for straightforward, low risk replies.

ESCALATED
Needs me. Say in one line what decision only I can make.

SCHEDULED
No action now, action on a date. Give the date and the trigger.

CLOSED
No action ever. One line why.

Then:
THE COUNT. Started with X, drafted Y, escalated Z, scheduled A, closed B.
THE OLDEST. What has been sitting longest, and how long. Shame me if needed.
THE ONE TO DO FIRST. Single item, with the reason.

Rules:
- NEVER draft for: anything angry, anything about price, anything from an
  existing customer with a problem, anything ambiguous.
- Every item lands in exactly one pile. Nothing stays unsorted.

## Watch for

it drafting for the angry pile. That rule is there because a machine apology reads as an insult.

## Nebula execution boundary

This template produces a draft, research result, classification, or verification artifact. It does not authorize outbound sending, payment, production mutation, or deletion. Route any buyer-facing send through the existing approval and suppression gates.
