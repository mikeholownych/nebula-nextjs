---
name: sdr-11-the-pipeline-prioritizer
description: Use when running SDR Desk skill 11 (The Pipeline Prioritizer) for the ICP Scorer job.
---

# The Pipeline Prioritizer

**Job:** ICP Scorer  
**Profile:** `market`  
**Purpose:** takes the whole list and sorts it into work today, work this month, and leave alone.

## Prompt template

Sort my whole list into what I work today, this month, and not at all.

THE LIST:
[PASTE ACCOUNTS WITH: score, last touch date, trigger if any, stage,
last reply if any]

MY CAPACITY: I can run [N] real conversations a day.

Return exactly three groups, and respect my capacity in group one.

TODAY, exactly [N] accounts
For each: why today specifically, the trigger, and the first line I send.

THIS MONTH
Grouped by what has to be true before they move up. Name the missing thing.

LEAVE ALONE
With a one line reason each, and a date to revisit or the word NEVER.

Then one closing paragraph: what my list is missing. If everything is low
score, my problem is sourcing, not prioritising, and you should say that.

Rules:
- Do not exceed my capacity in TODAY. A list of 40 is the same as no list.
- Recency of trigger beats score. A 6 that just raised beats a 9 that is cold.

## Watch for

an oversized "today" pile. If it hands you thirty accounts, it ignored the capacity line.

## Nebula execution boundary

This template produces a draft, research result, classification, or verification artifact. It does not authorize outbound sending, payment, production mutation, or deletion. Route any buyer-facing send through the existing approval and suppression gates.
