---
name: sdr-13-people-search
description: Use when running SDR Desk skill 13 (People Search) for the Prospect Researcher job.
---

# People Search

**Job:** Prospect Researcher  
**Profile:** `market`  
**Purpose:** finds the actual humans in a target account by role and seniority, and tells you which one to open with.

## Prompt template

Find the people I should be talking to inside these accounts.

ACCOUNTS: [PASTE]
I sell [WHAT] which solves [PROBLEM] for [FUNCTION].

For each account return:
| Name | Title | Why them | Champion, Economic buyer, or Blocker | Confidence |

Then for each account, one line: who I open with and why that person before
the others.

Rules:
- The economic buyer is rarely the right first message. Say who to open with,
  not who signs.
- Mark confidence HIGH only when the title is public and current. Otherwise
  MEDIUM or LOW, and say what you would need to confirm it.
- If you cannot find a real person, write NONE FOUND. Do not invent a name or
  guess an email pattern.

## Watch for

invented names and guessed email formats. NONE FOUND is a valid, useful answer.

## Nebula execution boundary

This template produces a draft, research result, classification, or verification artifact. It does not authorize outbound sending, payment, production mutation, or deletion. Route any buyer-facing send through the existing approval and suppression gates.
