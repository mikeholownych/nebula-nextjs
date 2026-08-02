---
name: sdr-16-profile-viewer
description: Use when running SDR Desk skill 16 (Profile Viewer) for the Prospect Researcher job.
---

# Profile Viewer

**Job:** Prospect Researcher  
**Profile:** `market`  
**Purpose:** reads one person's public footprint and returns the three things about them worth mentioning.

## Prompt template

Read this person and give me the three things worth mentioning.

PERSON: [NAME, PROFILE URL]
PASTE ANYTHING PUBLIC: [their posts, their bio, talks, articles, podcast
appearances]

Return:

THE THREE THINGS
Three specific, recent, checkable things about them. Ranked by how likely a
mention is to earn a reply. For each: what it is, when, and why it would land.

WHAT TO AVOID
Anything here that would be creepy, stale or obviously scraped if I mentioned
it. Be strict. A work anniversary is not an insight.

THE LINE
One opening line using the strongest of the three, written like a person and
not like a mail merge.

Rules:
- Nothing older than 6 months in THE THREE THINGS.
- Nothing from their personal life. Ever.
- If all you have is their job title and a work anniversary, say THIN and tell
  me to skip this person or research deeper.

## Watch for

it reaching for personal details. The avoid list exists for a reason.

## Nebula execution boundary

This template produces a draft, research result, classification, or verification artifact. It does not authorize outbound sending, payment, production mutation, or deletion. Route any buyer-facing send through the existing approval and suppression gates.
