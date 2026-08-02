---
name: sdr-34-objection-tag
description: Use when running SDR Desk skill 34 (Objection Tag) for the Reply Classifier job.
---

# Objection Tag

**Job:** Reply Classifier  
**Profile:** `support`  
**Purpose:** records which objections keep appearing and how often, so you fix the message instead of re-answering forever.

## Prompt template

Find the pattern in my objections.

OBJECTIONS FROM THE LAST [PERIOD]:
[PASTE THEM RAW]

Return:

THE RANKING
| Objection theme | How often | Example quote | Which stage it appears |

THE REAL ONE
Objections cluster. Tell me the ONE underlying belief driving the top three
themes, because that is what I actually have to fix.

WHERE IT STARTS
Which part of my messaging is creating this objection. If I am getting price
objections at the first reply, my opener is doing something wrong, name it.

THE FIX
Not a better rebuttal. A change to what I say EARLIER so the objection stops
arriving. Give me the specific line to change and what to change it to.

Rules:
- The fix must be upstream. A better answer to a recurring objection is a
  bandage.
- If one objection is over 40 percent of the total, say so loudly. That is not
  an objection, that is a positioning problem.

## Watch for

better rebuttals. If you are answering the same objection weekly, the message is wrong, not the answer.

## Nebula execution boundary

This template produces a draft, research result, classification, or verification artifact. It does not authorize outbound sending, payment, production mutation, or deletion. Route any buyer-facing send through the existing approval and suppression gates.
