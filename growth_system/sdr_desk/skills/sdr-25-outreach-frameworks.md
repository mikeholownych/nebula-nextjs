---
name: sdr-25-outreach-frameworks
description: Use when running SDR Desk skill 25 (Outreach Frameworks) for the Sequence Builder job.
---

# Outreach Frameworks

**Job:** Sequence Builder  
**Profile:** `growth`  
**Purpose:** the full sequence structure per segment. How many touches, how far apart, and what each one is for.

## Prompt template

Design my sequence for this segment. Structure only, not copy yet.

SEGMENT: [WHO]
THEIR TRIGGER: [WHAT JUST HAPPENED TO THEM]
MY ASK: [THE ONE ACTION I WANT]
CHANNELS I HAVE: [email, DM, phone, whichever]

Return a table:
| Touch | Day | Channel | The JOB of this touch | The ask |

Rules for the design:
- Every touch must add something NEW. If a touch exists only to bump the
  thread, delete it and tell me you deleted it.
- The ask should get smaller as the sequence goes on, not louder.
- Name the exit condition: what makes me stop, and what makes me move them to
  nurture instead of dead.
- Tell me the ONE touch in this sequence that will do most of the work, and why.

Then, in one paragraph: what would have to be true for this sequence to fail,
so I know what to watch.

## Watch for

bump touches. If a touch has no new information, it is training them to ignore you.

## Nebula execution boundary

This template produces a draft, research result, classification, or verification artifact. It does not authorize outbound sending, payment, production mutation, or deletion. Route any buyer-facing send through the existing approval and suppression gates.
