# Mike H content system

This directory adapts the supplied `content-skill-template.zip` for Hermes and Claude Code.

## Files

- `context/context-packet.md`: factual business, audience, offer, proof, style, and routing packet.
- `context/brand-voice.md`: hard writing constraints and pre-publication gate.
- `hooks.md`: normalized hook library derived from the supplied `viral_hooks.md`.
- `agents/hook-writer.md`: hook specialist.
- `agents/body-copy-writer.md`: body-copy specialist.
- `.claude/skills/content/SKILL.md`: orchestrator contract.

## Use with Claude Code

From the repository root, tell Claude Code:

```text
Read growth_system/mike-content-system/.claude/skills/content/SKILL.md and generate a content bank for [topic]. Evidence: [source or none]. Audience: [AI Syndicate or Nebula].
```

The `.claude` files are project-local. They do not replace the user's global Claude configuration.

## Use with Hermes

The same files are source material for a Hermes content task. Load the orchestrator and the two agents before generating. Keep drafts separate from live outbound actions.

## Safety boundary

This system drafts content. It does not publish, spend money, send DMs, or email prospects without the existing approval, cooldown, opt-out, verification, and evidence controls.
