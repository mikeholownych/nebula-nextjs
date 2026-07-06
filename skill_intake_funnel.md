# Nebula Skill Intake Funnel

Purpose: prevent Business OS agents from blindly installing or trusting external agent skills.

## Gate

No external skill may be installed, copied into Hermes, or attached to a revenue cron until it has a `skill-intake-ledger.jsonl` entry with `status=approved`.

## Command

```bash
python3 /home/mike/nebula/skill_intake.py \
  --name hqhq1025/skill-optimizer \
  --url https://github.com/hqhq1025/skill-optimizer \
  --agent ceo \
  --objective 'Diagnose and optimize Business OS agent skills using evidence from real sessions' \
  --ledger /home/mike/nebula/ledgers/skill-intake-ledger.jsonl
```

Exit codes:
- `0` = approved
- `1` = rejected or needs review
- `2` = bad CLI input

## Funnel steps

1. Source candidate from `awesome-agent-skills`, existing local skills, or agent failure evidence.
2. Run `skill_intake.py` against a local checkout or GitHub repo URL.
3. Review output:
   - `approved` → may install/attach after CEO decision.
   - `needs_review` → do not install; inspect fit or scope manually.
   - `rejected` → do not install.
4. Ledger result is appended to `/home/mike/nebula/ledgers/skill-intake-ledger.jsonl`.
5. If installed, record a separate skill-gap-ledger entry linking the candidate to a concrete business bottleneck.

## Automated checks

The intake gate currently verifies:
- README.md or SKILL.md exists
- prompt-injection terms are absent
- secret exfiltration patterns are absent
- destructive shell patterns are absent
- credential collection patterns are absent
- candidate text matches the target agent's required terms

## Target agents

Valid `--agent` values:
- `ceo`
- `growth`
- `market`
- `support`
- `ops-finance`

## Rule

Awesome lists are discovery only. This funnel is the trust gate.
