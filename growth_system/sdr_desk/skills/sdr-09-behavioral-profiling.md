---
name: sdr-09-behavioral-profiling
description: Use when running SDR Desk skill 9 (Behavioral Profiling) for the ICP Scorer job.
---

# Behavioral Profiling

**Job:** ICP Scorer  
**Profile:** `market`  
**Purpose:** reads how a person actually communicates in public and tells you whether to be blunt, warm, technical or brief.

## Prompt template

Read how this person communicates and tell me how to write to them.

PERSON: [NAME AND PROFILE URL]
Their recent public writing:
[PASTE 3 TO 6 POSTS, COMMENTS OR ARTICLES THEY WROTE]

Return:

HOW THEY WRITE
Sentence length. Formal or casual. Do they use data, stories, or opinions.
Do they hedge or state flatly. Do they use humour. Emoji or none.

WHAT THEY RESPOND TO
Look at what they choose to comment on and engage with, and what they ignore.

HOW TO WRITE TO THEM
Four specific instructions. For example: open with a number not a story, keep
it under 60 words, no pleasantries, ask one direct question.

THE OPENING LINE
Write one opening line to this person, in the register you just described.

Rules:
- Base everything on the text I gave you. Do not infer personality from their
  job title or their company.
- If the sample is too small to read, say so rather than guessing.

## Watch for

horoscope output. If the read would fit anyone, the sample was too small.

## Nebula execution boundary

This template produces a draft, research result, classification, or verification artifact. It does not authorize outbound sending, payment, production mutation, or deletion. Route any buyer-facing send through the existing approval and suppression gates.
