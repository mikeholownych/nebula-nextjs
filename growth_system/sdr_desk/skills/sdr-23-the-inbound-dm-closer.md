---
name: sdr-23-the-inbound-dm-closer
description: Use when running SDR Desk skill 23 (The Inbound DM Closer) for the Voice Writer job.
---

# The Inbound DM Closer

**Job:** Voice Writer  
**Profile:** `growth`  
**Purpose:** handles the person who just engaged with you. Warm, quick, and asking for the right next step.

## Prompt template

Someone just engaged with me. Write the reply.

MY VOICE PROFILE: [PASTE]
WHAT THEY DID: [commented, liked, replied, downloaded, name it]
WHAT THEY SAID, if anything: [PASTE]
WHO THEY ARE: [ROLE AND COMPANY]
WHAT I WANT: [THE NEXT STEP]

Return three replies:
1. THE DELIVER. If they asked for something, give it immediately and add one
   line of value they did not ask for.
2. THE OPEN. Give the thing, then ask ONE question that starts a conversation.
   The question must be answerable in under ten words.
3. THE DIRECT. Give the thing and ask for the call, for the case where they are
   clearly a fit and clearly warm.

Then tell me which to send based on what they did, and why.

Rules:
- Deliver first, always. Never make them ask twice.
- Under 60 words each.
- Never open with "thanks for engaging". They can tell.

## Watch for

making them ask twice. Deliver in the first message or you lose them.

## Nebula execution boundary

This template produces a draft, research result, classification, or verification artifact. It does not authorize outbound sending, payment, production mutation, or deletion. Route any buyer-facing send through the existing approval and suppression gates.
