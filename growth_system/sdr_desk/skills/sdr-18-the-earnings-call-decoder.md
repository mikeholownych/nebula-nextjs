---
name: sdr-18-the-earnings-call-decoder
description: Use when running SDR Desk skill 18 (The Earnings Call Decoder) for the Prospect Researcher job.
---

# The Earnings Call Decoder

**Job:** Prospect Researcher  
**Profile:** `market`  
**Purpose:** for public targets, pulls the priorities leadership repeated on the last call, because repetition is where the budget goes.

## Prompt template

Read the last earnings call for [PUBLIC COMPANY] and tell me where the money
is going.

Return:

WHAT LEADERSHIP REPEATED
The themes they said more than once, ranked by how often. Quote them. Repetition
on an earnings call is not an accident, it is the message discipline of the
whole year.

WHAT THE ANALYSTS PUSHED ON
The questions that came up more than once, and how comfortable the answers
were. Discomfort marks a real problem.

THE NUMBERS THEY LED WITH AND THE ONES THEY BURIED
Both are informative.

WHAT THIS MEANS FOR ME
I sell [WHAT]. Which of these themes does my thing touch, and which executive
owns that theme.

THE OPENING LINE
One line that references a priority they stated themselves, in their language.

Rules:
- Quote directly. Paraphrase hides the language I want to mirror.
- If I cannot find a transcript, say so instead of reconstructing one.

## Watch for

a reconstructed transcript. If there is no source, there is no skill.

## Nebula execution boundary

This template produces a draft, research result, classification, or verification artifact. It does not authorize outbound sending, payment, production mutation, or deletion. Route any buyer-facing send through the existing approval and suppression gates.
