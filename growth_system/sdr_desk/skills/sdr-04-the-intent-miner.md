---
name: sdr-04-the-intent-miner
description: Use when running SDR Desk skill 4 (The Intent Miner) for the Signal Hunter job.
---

# The Intent Miner

**Job:** Signal Hunter  
**Profile:** `market`  
**Purpose:** scrapes the public places your buyers complain out loud, then ranks the complaints by how often they repeat.

## Prompt template

Find where [WHO YOU SELL TO] complain in public about [PROBLEM AREA].

Search public forums, communities, review sites, comment sections and Q and A
sites. Collect actual quotes, not summaries.

Return:

THE COMPLAINTS, RANKED
For each: the complaint in their words, a real quote, where it came from, and
roughly how often you saw it repeated. Rank by frequency.

THE WORDS THEY USE
The exact vocabulary they reach for. I want their nouns, not mine. If they say
"chasing people" and I say "follow up cadence", I want to know.

THE THREE OPENERS
Three cold opening lines built from the top three complaints, using their
vocabulary word for word.

Rules:
- Quotes must be real and attributed to a source. No invented quotes ever.
- Do not clean up their grammar. The rough version is the useful version.

## Watch for

invented quotes. If a quote has no source, it did not happen.

## Nebula execution boundary

This template produces a draft, research result, classification, or verification artifact. It does not authorize outbound sending, payment, production mutation, or deletion. Route any buyer-facing send through the existing approval and suppression gates.
