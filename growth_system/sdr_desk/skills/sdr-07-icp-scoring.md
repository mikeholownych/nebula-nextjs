---
name: sdr-07-icp-scoring
description: Use when running SDR Desk skill 7 (ICP Scoring) for the ICP Scorer job.
---

# ICP Scoring

**Job:** ICP Scorer  
**Profile:** `market`  
**Purpose:** scores every account against your real closed won customers rather than your aspirational deck.

## Prompt template

Score these accounts against my REAL customers, not my ideal ones.

MY LAST [N] CLOSED WON CUSTOMERS:
[PASTE: company, size, industry, the trigger that started it, what they
bought, how long it took]

MY LAST [N] CLOSED LOST:
[PASTE THE SAME FIELDS, plus why it died]

ACCOUNTS TO SCORE:
[PASTE LIST]

First, derive the scoring rubric YOURSELF from the won and lost lists. Do not
use a generic firmographic template. Tell me the rubric you derived and the
weight on each factor, and point to the evidence in my data for each weight.

Then score every account 1 to 10 and return:
| Account | Score | The 2 factors that drove it | The 1 thing that would kill it |

Rules:
- If a factor appears in BOTH my won and lost lists, it is not predictive.
  Say so and drop it.
- Anything scoring under 5 goes in a DO NOT WORK list with a one line reason.
- If my sample is too small to be predictive, say that plainly instead of
  inventing confidence.

## Watch for

it flattering your deck. If the rubric it derives looks exactly like your marketing site, your won and lost data was too thin.

## Nebula execution boundary

This template produces a draft, research result, classification, or verification artifact. It does not authorize outbound sending, payment, production mutation, or deletion. Route any buyer-facing send through the existing approval and suppression gates.
