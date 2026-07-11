# Onboarding System

## Core Purpose
Create moment where prospects stop and think "This is already working"

## Implementation Rules
1. **Show partial results BEFORE asking for email** (VIN model)
2. **Deliver a REAL, specific 3-point audit** (not generic advice)
3. **At bottom of audit email**: "If you want me to implement these fixes, it's $97 done-for-you in 24h — reply yes"

## VIN Model Rule
Always show partial results BEFORE asking for email. Proof of value before ask. Never gate the entire result — zero-proof gating gets zero email submissions.

## Implementation Pattern
```python
# In do_POST:
if path == "/api/audit":
    try:
        return self._handle_audit()
    except Exception as e:
        import traceback; traceback.print_exc()
        try: self._send_json(500, {"error": str(e)})
        except Exception: pass
        return
```

## Critical Pitfall
`deliver_audit.py` calls `sys.exit(1)` at module level if `requests`/`bs4` not found. The system Python (used by systemd) doesn't have venv packages. This kills the server process silently on first POST.