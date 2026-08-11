"""Global agent command guard - Hermes adapter.

Blocks catastrophic shell commands before the terminal tool runs them,
using the shared denylist at ~/.agents/hooks/dangerous-patterns.txt
(enforced by ~/.agents/hooks/deny-dangerous.sh - same guard used by
Claude Code, Codex, Cursor, OpenCode, etc.).

Contract: pre_tool_call hook returns {"action": "block", "message": ...}
to veto a tool call outright. This is a seatbelt against accidents, NOT
a sandbox against a malicious agent (obfuscation can slip past regex).

Hermes hooks are FAIL-OPEN on exceptions: this plugin must never raise,
or it would brick the terminal tool. All errors are caught and ignored.
"""

import json
import logging
import subprocess
from pathlib import Path

logger = logging.getLogger("command-guard")

GUARD_SCRIPT = Path.home() / ".agents" / "hooks" / "deny-dangerous.sh"


def _check_command(command: str):
    """Run the shared guard. Returns the block message, or None to allow."""
    if not GUARD_SCRIPT.exists():
        return None
    payload = json.dumps({"tool_input": {"command": command}})
    try:
        res = subprocess.run(
            [str(GUARD_SCRIPT)],
            input=payload,
            capture_output=True,
            text=True,
            timeout=10,
        )
    except Exception as exc:  # fail open
        logger.warning("command-guard failed open: %s", exc)
        return None
    if res.returncode == 2:
        return res.stderr.strip() or "Blocked by the global dangerous-command guard."
    return None


def _on_pre_tool_call(tool_name, args, task_id="", **kwargs):
    """pre_tool_call hook: veto catastrophic terminal commands."""
    if tool_name != "terminal":
        return None
    if not isinstance(args, dict):
        return None
    command = args.get("command")
    if not isinstance(command, str) or not command.strip():
        return None
    block_msg = _check_command(command)
    if block_msg:
        return {"action": "block", "message": block_msg}
    return None


def register(ctx):
    ctx.register_hook("pre_tool_call", _on_pre_tool_call)
