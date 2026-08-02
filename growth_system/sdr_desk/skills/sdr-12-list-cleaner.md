---
name: sdr-12-list-cleaner
description: Use when running SDR Desk skill 12 (List Cleaner) for the ICP Scorer job.
---

# List Cleaner

**Job:** ICP Scorer  
**Profile:** `market`  
**Purpose:** strips the dead rows, the wrong titles, the people who left, and the duplicates hiding behind a different spelling.

## Prompt template

Clean this list before I waste a sequence on it.

THE LIST:
[PASTE]

I only want: [TARGET TITLES], at companies that are [TARGET CRITERIA].

Do all of this and show your work:

1. DUPLICATES. Same person or company appearing twice, including different
   spellings, legal versus trading names, and personal versus work emails.
2. WRONG TITLE. Not in my target set. Group them and tell me if any group is
   big enough to be worth its own sequence.
3. LIKELY GONE. Anyone whose listed role looks out of date. Flag, do not delete,
   and say what made you suspicious.
4. WRONG COMPANY. Outside my criteria, with the reason.
5. BROKEN DATA. Malformed emails, missing fields, obvious junk.

Return the cleaned list, then a summary table of what you removed and why,
then a count: started with X, kept Y, removed Z.

Rules:
- Never silently delete. Every removal appears in the summary.
- When unsure, keep it and flag it. I would rather review 10 than lose 1.

## Watch for

silent deletion. Always read the summary count.

## Nebula execution boundary

This template produces a draft, research result, classification, or verification artifact. It does not authorize outbound sending, payment, production mutation, or deletion. Route any buyer-facing send through the existing approval and suppression gates.
