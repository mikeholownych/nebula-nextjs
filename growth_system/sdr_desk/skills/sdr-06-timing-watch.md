---
name: sdr-06-timing-watch
description: Use when running SDR Desk skill 6 (Timing Watch) for the Signal Hunter job.
---

# Timing Watch

**Job:** Signal Hunter  
**Profile:** `market`  
**Purpose:** tracks the events that reliably free up budget, like a funding round, a new head of the function you sell to, or an office opening, and tells you the day to move.

## Prompt template

Watch this account list for buying triggers.

ACCOUNTS:
[PASTE ACCOUNT LIST]

TRIGGERS I CARE ABOUT, in priority order:
1. New leader hired in [THE ROLE I SELL TO]
2. Funding round or acquisition
3. Headcount growth in [THE TEAM I SELL TO]
4. New office, new market, new segment
5. Public complaint about [THE PROBLEM I SOLVE]
6. Their competitor doing something they will have to answer

For every trigger you find, return:
| Account | Trigger | Date | Source | Who to contact | Days since |

Then sort into three buckets:
MOVE TODAY, trigger is under 14 days old
MOVE THIS MONTH, trigger is 15 to 45 days old
TOO LATE, over 45 days, note it and move on

Rules:
- A trigger with no date is not a trigger. Drop it.
- Under 14 days is where the reply rate lives. Say that in the output so I act.

## Watch for

stale triggers dressed up as fresh ones. The date column is the whole point.

## Nebula execution boundary

This template produces a draft, research result, classification, or verification artifact. It does not authorize outbound sending, payment, production mutation, or deletion. Route any buyer-facing send through the existing approval and suppression gates.
