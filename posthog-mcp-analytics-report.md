# PostHog MCP Analytics — Integration Report

## Summary

The Nebula MCP server (`mcp_server.py`) has been instrumented with PostHog MCP analytics using **Path P1** (Python FastMCP wrapper). Every tool call, agent intent, and error the server handles will now emit `$mcp_*` events to PostHog.

- **SDK path**: `posthog.mcp.instrument()` — wraps the `FastMCP` server object directly
- **posthog version**: 7.29.0 (already installed; satisfies `>=7.21` requirement)
- **Credentials**: `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` were already present in `.env`

---

## Changes Made

### `mcp_server.py`

Single file modified. All changes are additive — no tool handlers were altered.

1. **New imports** added at the top:
   - `atexit`, `os`, `signal` (stdlib)
   - `from dotenv import load_dotenv` — loads `.env` so credentials are available whether the server is run directly or from Claude Desktop

2. **`.env` auto-load** inserted before any app imports:
   ```python
   from dotenv import load_dotenv
   load_dotenv(NEBULA_DIR / ".env")
   ```

3. **PostHog client + instrumentation** block added immediately after `mcp = FastMCP(...)`:
   ```python
   from posthog import Posthog
   from posthog.mcp import instrument

   posthog = Posthog(os.environ.get("POSTHOG_PROJECT_TOKEN", ""), host=os.environ.get("POSTHOG_HOST", "https://us.i.posthog.com"))
   analytics = instrument(mcp, posthog)

   atexit.register(posthog.shutdown)
   signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))
   ```
   - `atexit.register(posthog.shutdown)` — flushes the event queue on normal exit
   - SIGTERM handler converts the signal to `sys.exit(0)` so atexit fires on process termination

---

## Events you'll see in PostHog

Once the server handles its next request, these events will appear:

| Event | When |
|-------|------|
| `$mcp_initialize` | Client connects |
| `$mcp_tool_call` | Any tool is invoked (`run_audit`, `get_audit`, `recent_audits`, `compare_audits`) |
| `$mcp_tools_list` | Client lists available tools |
| `$exception` | A tool throws or returns an error |

All events share a `$session_id` derived from the MCP protocol session, so calls from the same connection are grouped.

---

## No Manual Steps Required

- Credentials are loaded automatically from `.env` (already populated)
- No package installs needed — `posthog>=7.21` was already a dependency
- Works for both transport modes: STDIO (Claude Desktop) and HTTP (`--http` flag)

---

## Useful Links

- Dashboard and event reference: https://posthog.com/docs/mcp-analytics
- PostHog project: https://us.posthog.com/project/525183
