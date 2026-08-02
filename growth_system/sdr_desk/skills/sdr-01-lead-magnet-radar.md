---
name: sdr-01-lead-magnet-radar
description: Use when running SDR Desk skill 1 (Lead Magnet Radar) for the Signal Hunter job.
---

# Lead Magnet Radar

**Job:** Signal Hunter  
**Profile:** `market`  
**Purpose:** watches the free resources your competitors give away and tells you which topics are pulling real comment volume right now. What people beg for in a comment section is what they will answer a DM about.

## Prompt template

You are my lead magnet radar. I sell [WHAT YOU SELL] to [WHO YOU SELL TO].

Here are competitors and adjacent creators my buyers follow:
[LIST 5 TO 10 NAMES OR PROFILE URLS]

For each one, look at their last 30 days of public posts and find every
free resource they offered in exchange for a comment, a DM or an email.

Return a table with one row per resource:
| Creator | What they gave away | The exact CTA keyword | Comments | Date |

Then answer three questions in plain prose, no bullet points:
1. Which THREE topics are pulling the most comments right now, and what do
   those three have in common?
2. What is the promise underneath the winning ones? Name the fear or the
   ambition, not the topic.
3. What is nobody in this list giving away that my buyers clearly need?

Rules:
- Only count resources you can actually see. If you cannot verify a comment
  count, write UNVERIFIED rather than estimating.
- Rank by comments, not by reactions. Comments mean intent.
- Ignore anything older than 30 days.

## Watch for

it will happily invent comment counts if you let it. The UNVERIFIED rule is doing real work, do not delete it.

## Nebula execution boundary

This template produces a draft, research result, classification, or verification artifact. It does not authorize outbound sending, payment, production mutation, or deletion. Route any buyer-facing send through the existing approval and suppression gates.
