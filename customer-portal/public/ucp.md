# Nebula Components UCP Commerce Service

Nebula Components publishes a Universal Commerce Protocol business profile at `/.well-known/ucp`.

## Service

- **Namespace:** `com.nebulacomponents.commerce`
- **Transport:** REST
- **Endpoint:** `https://nebulacomponents.com/api`
- **OpenAPI schema:** `https://nebulacomponents.com/openapi.json`

## Checkout capability

`com.nebulacomponents.commerce.checkout` creates an audit-bound Stripe-hosted checkout session for the fixed-price Nebula One-Leak Self-Implementation Kit.

### Request

`POST https://nebulacomponents.com/api/checkout`

```json
{
  "offerKey": "fix-pack",
  "auditId": "123e4567-e89b-12d3-a456-426614174000"
}
```

The request also requires the verified audit-unlock cookie issued for that audit. The server owns the delivery email, product, and price mapping. Client-supplied emails, prices, amounts, or line items are rejected.

### Response

A successful request returns an HTTPS Stripe Checkout URL:

```json
{
  "url": "https://checkout.stripe.com/..."
}
```

The buyer completes payment on Stripe. Card data is never received or stored by Nebula Components.

## Capability schema

`https://nebulacomponents.com/.well-known/ucp-checkout.schema.json`
