---
name: sdr-14-company-search
description: Use when running SDR Desk skill 14 (Company Search) for the Prospect Researcher job.
---

# Company Search

**Job:** Prospect Researcher  
**Profile:** `market`  
**Purpose:** builds the target account list from a description of who you sell to, not from a filter you half remember setting.

## Prompt template

Build me an account list from this description, not from a filter.

WHO I SELL TO: [DESCRIBE THE SITUATION, not just the firmographics. For
example: companies who just hired their first RevOps person and are still
running outbound out of spreadsheets]

GEOGRAPHY: [WHERE]
SIZE BAND: [RANGE]
HOW MANY: [N]

Return:
| Company | Why they fit the SITUATION | Evidence | Source | Fit 1-10 |

The "why they fit" column must describe their situation, not their industry.
"B2B SaaS, 50-200" is not a reason.

Then list any account you considered and rejected, with the reason. I learn
more from the rejects than the list.

Rules:
- Evidence must be something you can point to, a job posting, a public change,
  a product page, a funding note.
- No account without evidence. Cut it instead.

## Watch for

a list that is really just an industry filter. The evidence column is the test.

## Nebula execution boundary

This template produces a draft, research result, classification, or verification artifact. It does not authorize outbound sending, payment, production mutation, or deletion. Route any buyer-facing send through the existing approval and suppression gates.
