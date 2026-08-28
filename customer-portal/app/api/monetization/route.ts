import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    version: '1.0',
    documentation: 'https://nebulacomponents.com/api-docs',
    endpoints: {
      '/api/monetization/audit/[token]': {
        method: 'GET',
        auth: 'none',
        description: 'Public audit lookup by share token',
      },
      '/api/monetization/key': {
        method: 'GET',
        auth: 'x-api-key header',
        description: 'Validate API key and check usage',
      },
    },
    rate_limits: {
      free: {
        daily: 100,
        per_minute: 10,
      },
      paid: {
        daily: 10000,
        per_minute: 100,
      },
    },
    pricing: {
      free: {
        monthly: 0,
        audit_lookup: 'unlimited',
        rate_limit: '100/day',
      },
      starter: {
        monthly: 49,
        audit_lookup: 'unlimited',
        rate_limit: '1000/day',
        webhook_access: true,
      },
      professional: {
        monthly: 199,
        audit_lookup: 'unlimited',
        rate_limit: '10000/day',
        webhook_access: true,
        priority_support: true,
      },
    },
  })
}
