---
name: mike-content
description: Use when Mike asks for multi-platform content, hooks, body copy, or a content bank grounded in his businesses, voice, and verified evidence.
---

# Mike content orchestrator

This is the Claude Code-compatible version of the supplied content skill, adapted for Mike's two-business routing and evidence rules.

## Inputs

Ask for exactly two inputs if they are missing:

1. Topic or angle
2. Evidence, numbers, or source material, or `none`

If the audience is unclear, infer it only when the topic makes the routing unambiguous. Otherwise ask for the audience because AI Syndicate and Nebula are separate funnels.

## Context load

Read:
- `growth_system/mike-content-system/context/context-packet.md`
- `growth_system/mike-content-system/context/brand-voice.md`
- `growth_system/mike-content-system/hooks.md`
- `growth_system/mike-content-system/agents/hook-writer.md`
- `growth_system/mike-content-system/agents/body-copy-writer.md`

Classify all facts as confirmed, working, or verify. Remove secrets and private identifiers.

## Parallel generation

Generate in parallel:
- 6 short-form video hooks
- 3 platform-ready body drafts
- 8 email subject lines when an email asset is requested

Use the same approved angle and evidence in every branch. Do not let one branch invent proof another branch lacks.

## Output contract

```text
CONTENT BANK: [topic]
AUDIENCE: [AI Syndicate | Nebula]
OFFER ROUTE: [one route or educational only]
EVIDENCE STATUS: [confirmed | verify required]

HOOKS
1. ...

BODY DRAFTS
[Draft 1]
Evidence: ...

EMAIL SUBJECTS
1. ...
```

## Refinement commands

- `riff hooks`: write 3 new hooks using different patterns.
- `riff body`: write 2 new body drafts without changing the evidence.
- `more proof`: stop and request or locate a stronger source. Do not manufacture numbers.
- `shorter`: compress the selected draft without removing the evidence or CTA.
- `rewrite [N]`: rewrite only item N.
- `route AI Syndicate`: reroute and rewrite for the governance buyer.
- `route Nebula`: reroute and rewrite for the paid-traffic conversion buyer.

## Final gate

Before returning content, confirm:

- One audience and one offer route.
- Evidence has source and scope.
- No unsupported result claim.
- No third-party story rewritten as Mike's story.
- No AI filler, em dashes, generic SaaS language, or fake urgency.
- One clear next step.
- Public publishing remains human-approved.
