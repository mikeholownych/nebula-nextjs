# Nebula Components UCP Commerce Service

Nebula Components publishes a Universal Commerce Protocol business profile at `/.well-known/ucp`.

## Service

- **Namespace:** `shop.nebulacomponents.commerce`
- **Transport:** REST
- **Endpoint:** `https://nebulacomponents.shop/api`
- **OpenAPI schema:** `https://nebulacomponents.shop/openapi.json`

## Checkout capability

`shop.nebulacomponents.commerce.checkout` creates a Stripe-hosted checkout session for the fixed-price Nebula Conversion Fix Pack.

### Request

`POST https://nebulacomponents.shop/api/checkout`

```json
{
  "offerKey": "fix-pack",
  "email": "buyer@example.com"
}
```

The server owns the product and price mapping. Client-supplied prices, amounts, or line items are rejected.

### Response

A successful request returns an HTTPS Stripe Checkout URL:

```json
{
  "url": "https://checkout.stripe.com/..."
}
```

The buyer completes payment on Stripe. Card data is never received or stored by Nebula Components.

## Capability schema

`https://nebulacomponents.shop/.well-known/ucp-checkout.schema.json`
