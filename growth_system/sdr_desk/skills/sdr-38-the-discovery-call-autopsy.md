---
name: sdr-38-the-discovery-call-autopsy
description: Use when running SDR Desk skill 38 (The Discovery Call Autopsy) for the Meeting Qualifier job.
---

# The Discovery Call Autopsy

**Job:** Meeting Qualifier  
**Profile:** `support`  
**Purpose:** takes the transcript and returns what they actually said they wanted, what they avoided, and what to do next.

## Prompt template

Autopsy this call.

TRANSCRIPT: [PASTE]

Return:

WHAT THEY SAID THEY WANT
In their words, quoted.

WHAT THEY ACTUALLY WANT
Read between the lines. What did they keep coming back to unprompted. People
repeat what they care about.

WHAT THEY AVOIDED
Questions they deflected, changed the subject on, or answered with a
generality. This is usually where the real blocker is.

WHO ELSE IS IN THIS
Every other person or team they mentioned, and what their role in the decision
appears to be.

THE MONEY
Anything said about budget, timing, or process. Quote it exactly. If they said
nothing about money, say NOTHING SAID, and make that the next question.

MY MISTAKES
Where I talked too much, missed a signal, or asked a closed question that
should have been open. Be blunt about this.

THE NEXT STEP
One specific action, with the date, and the message to send.

Rules:
- Quote, do not paraphrase, in the first three sections.
- Be honest in MY MISTAKES. A polite autopsy is useless.

## Watch for

a flattering autopsy. The mistakes section is the reason to run it.

## Nebula execution boundary

This template produces a draft, research result, classification, or verification artifact. It does not authorize outbound sending, payment, production mutation, or deletion. Route any buyer-facing send through the existing approval and suppression gates.
