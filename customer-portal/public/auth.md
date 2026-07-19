# auth.md — Nebula Components Agent Registration

> Machine-readable authentication and registration instructions for AI agents.
> Spec: https://workos.com/auth-md

## Identity

- **Site:** https://nebulacomponents.shop
- **Contact:** nebulashop@agentmail.to

## Authentication

Nebula Components does not currently require authentication for read access
to public endpoints (audit tool, landing pages, agent discovery files).

For write-access API credentials, POST to the registration endpoint below.

## Agent Registration

```json
{
  "agent_auth": {
    "skill": "https://nebulacomponents.shop/auth.md",
    "register_uri": "https://nebulacomponents.shop/api/agent/register",
    "supported_identity_types": ["anonymous"],
    "identity_types_supported": ["anonymous"],
    "anonymous": {
      "credential_types_supported": ["none"],
      "claim_uri": "https://nebulacomponents.shop/auth.md",
      "revocation_uri": null
    },
    "credential_types": ["none"],
    "scopes_supported": ["read"],
    "claim_uri": "https://nebulacomponents.shop/auth.md",
    "revocation_uri": null,
    "note": "Public endpoints require no credentials. POST to register_uri to declare agent intent or request write-access credentials."
  }
}
```

### Registration Flow

1. **Read** this document to understand the authentication contract.
2. **POST** to `https://nebulacomponents.shop/api/agent/register` with `{ "agent_id": "<your-agent-id>", "purpose": "<your-use-case>" }`.
3. **Receive** confirmation that no credentials are required for public endpoints.
4. **Use** public endpoints directly (no Bearer token needed).
5. **Request** write-access credentials by contacting `nebulashop@agentmail.to` if needed.

## OAuth/OIDC Discovery

- **OpenID Configuration:** https://nebulacomponents.shop/.well-known/openid-configuration
- **Protected Resource Metadata:** https://nebulacomponents.shop/.well-known/oauth-protected-resource
- **Authorization Server Metadata:** https://nebulacomponents.shop/.well-known/oauth-authorization-server

## Supported Agent Protocols

- **MCP:** `/.well-known/mcp/server-card.json`
- **A2A:** `/.well-known/agent-card.json`
- **Agent Skills:** `/.well-known/agent-skills/index.json`
- **API Catalog:** `/.well-known/api-catalog`
- **WebMCP:** `navigator.modelContext` — 3 tools exposed on page load
