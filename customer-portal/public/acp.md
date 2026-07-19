# Nebula Components ACP Discovery

Nebula Components publishes Agentic Commerce Protocol discovery metadata at `/.well-known/acp.json` for its REST-based Conversion Fix Pack checkout.

## Discovery

- **Protocol version:** `2026-01-30`
- **API base URL:** `https://nebulacomponents.shop/api`
- **Transport:** `rest`
- **Service:** `checkout`
- **Currency:** USD
- **Locale:** en-US

## Current checkout API

`POST https://nebulacomponents.shop/api/checkout`

```json
{
  "offerKey": "fix-pack",
  "email": "buyer@example.com"
}
```

A successful request creates a server-priced Stripe Checkout session and returns its HTTPS URL. Client-supplied prices, amounts, and line items are rejected.

```json
{
  "url": "https://checkout.stripe.com/..."
}
```

Payment is completed on Stripe's hosted checkout. Nebula Components never receives or stores card details.

## Related machine-readable resources

- OpenAPI: `https://nebulacomponents.shop/openapi.json`
- UCP profile: `https://nebulacomponents.shop/.well-known/ucp`
- Checkout request schema: `https://nebulacomponents.shop/.well-known/ucp-checkout.schema.json`
