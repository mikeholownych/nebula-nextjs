---
name: sdr-10-the-customer-avatar-sculptor
description: Use when running SDR Desk skill 10 (The Customer Avatar Sculptor) for the ICP Scorer job.
---

# The Customer Avatar Sculptor

**Job:** ICP Scorer  
**Profile:** `market`  
**Purpose:** builds the full picture of the person you are writing to, including what they are measured on and what makes them look bad.

## Prompt template

Build the working profile of the person I am selling to.

ROLE: [JOB TITLE]
COMPANY TYPE: [SIZE, INDUSTRY, STAGE]
WHAT I SELL: [ONE LINE]

Return, in prose, no bullet lists:

THEIR WEEK
What they actually do Monday to Friday. Meetings, reports, fires.

WHAT THEY ARE MEASURED ON
The two or three numbers their own boss asks about. Be specific to this role.

WHAT MAKES THEM LOOK BAD
The failure they are quietly managing around. This is the real buying trigger.

WHO ELSE IS IN THE ROOM
Who has to agree. Who can veto. Who never gets asked but should.

WHAT THEY HAVE ALREADY TRIED
The obvious fixes they have attempted before I turned up, and why those
disappointed them.

THE SENTENCE
One sentence that would make this person stop scrolling, written in their
vocabulary.

Rules:
- No demographics. I do not care how old they are.
- If you are generalising from the title alone, say which parts are assumption.

## Watch for

the assumption flag. It should tell you which parts it guessed.

## Nebula execution boundary

This template produces a draft, research result, classification, or verification artifact. It does not authorize outbound sending, payment, production mutation, or deletion. Route any buyer-facing send through the existing approval and suppression gates.
