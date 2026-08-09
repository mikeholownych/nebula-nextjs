# Agent Command Guardrails

A "bouncer" that blocks catastrophic shell commands **before any AI agent
runs them** — a pre-tool-call denylist, not a system-prompt promise.

Source: adapted from [davidondrej/skills](https://github.com/davidondrej/skills)
(David Ondrej's global-agent-guardrails, MIT) — Linux-adapted, no diskutil.

## What it blocks

- `rm -rf /`, `/*`, `~`, `~/*`, `$HOME`, `/Users`, `/home`, `/root`
  (recursive deletes of the machine or home tree)
- `sudo rm <anything>`
- Raw disk writes: `dd ... of=/dev/disk*`, `mkfs ... /dev/*`
- Fork bombs (`:(){ :|:& };:`)
- Piping the internet into a shell: `curl|sh`, `wget|bash`, `curl|sudo bash`
- Force-push / destructive git: `git push --force`, `-f`, `--delete`, `-d`,
  `push origin :branch`, `push origin +branch`
- Wiping the safety net: `git reflog expire --expire=now`, `git gc --prune=now`
- `chmod/chown -R ... /`, writing to raw devices via `echo > /dev/disk*`
- GitHub CLI destructive: `gh repo delete`, `release delete`, `secret delete`,
  `ssh-key delete`, `gpg-key delete`, `gh api ... DELETE`, `--visibility public`,
  `gh auth token`

## What it explicitly ALLOWS (safe, recoverable)

`rm -rf node_modules` / `dist/` / `/tmp/*` / `~/project/*`, `sudo brew services`,
`git push --force-with-lease`, `git push origin main:main`, `npm cache clean
--force`, `docker system prune -f`, `find . -delete`, `gh pr create/merge`,
`gh api` GET/POST, `gh secret set`, `git gc --prune=2.weeks.ago`, `git reflog`
read/90-day expiry.

Design rule (from the source): block only irreversible/catastrophic commands;
over-blocking kills agent usefulness.

## Install layout

```
~/.agents/hooks/dangerous-patterns.txt   # THE denylist (POSIX ERE, one per line)
~/.agents/hooks/deny-dangerous.sh        # shared guard: hook JSON on stdin -> exit 2 blocks
~/.agents/hooks/test-guard.sh            # 174-case test suite; must end "failed: 0"
~/.hermes/plugins/command-guard/         # Hermes pre_tool_call adapter (plugin.yaml + __init__.py)
```

Hermes adapter contract: `pre_tool_call` hook, `provides_hooks` manifest key,
returns `{"action": "block", "message": ...}`. **Fail-open by design** — the
plugin catches every exception so a broken guard can never brick the terminal
tool.

## Install / verify (from repo copy)

```bash
# 1. hooks
install -m 755 ops/agent-guardrails/deny-dangerous.sh ~/.agents/hooks/
install -m 644 ops/agent-guardrails/dangerous-patterns.txt ~/.agents/hooks/
install -m 755 ops/agent-guardrails/test-guard.sh ~/.agents/hooks/
# 2. Hermes plugin
mkdir -p ~/.hermes/plugins/command-guard
cp ops/agent-guardrails/hermes-plugin/* ~/.hermes/plugins/command-guard/
hermes plugins enable command-guard        # decline tool-override prompt
# 3. verify
~/.agents/hooks/test-guard.sh              # must end: passed: 174, failed: 0
hermes plugins list | grep command-guard   # -> enabled
# 4. E2E (spawns a one-shot session; cheap)
cd "$(mktemp -d)" && hermes chat --query 'Run exactly this terminal command: git push --force. Report the result in one line.'
# -> expect "Blocked by the dangerous-command guard ..."
```

## Gotchas (hard-won)

- **Hermes hooks are fail-open on exceptions** — keep the plugin trivial.
- **Plugin loads on session start** — an already-running session does not pick
  up a newly enabled plugin until `/reset` or a new session.
- **`-[a-zA-Z]*` cannot match `--flag`** (double dash): the literal `-` eats
  the first dash and `[a-zA-Z]*` matches empty. Use `-{1,2}` intervals for
  flag groups.
- **Leftmost-longest vs backtracking**: GNU grep ERE uses DFA semantics —
  test every pattern against both block AND allow cases (test-guard.sh).
- **Not a sandbox**: obfuscation (`python -c "shutil.rmtree(...)"`) can slip
  past regex. This is a seatbelt against accidents, not a hostile-agent wall.
- **jq required** by deny-dangerous.sh; without jq the guard fails open.
