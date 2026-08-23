/**
 * Membership subscription contract tests:
 * - plan definitions are consistent with the approved pricing
 * - /api/subscribe requires a workspace session, validates plan/interval,
 *   never accepts 'free', and rejects annual on monthly-only plans
 * - Stripe price resolution round-trips for webhook processing
 */
import {
  SUBSCRIPTION_PLANS,
  PAID_PLAN_KEYS,
  planFromStripePrice,
  auditQuotaFor,
} from '@/app/lib/subscription-plans'
import { NextResponse } from 'next/server'

jest.mock('@/app/lib/workspace-auth', () => ({
  requireWorkspaceUser: jest.fn(),
}))

// eslint-disable-next-line @typescript-eslint/no-require-imports
const requireWorkspaceUser = jest.requireMock('@/app/lib/workspace-auth').requireWorkspaceUser as jest.Mock

function signedIn(email = 'founder@nebulacomponents.com') {
  requireWorkspaceUser.mockResolvedValue({ user: { id: 'u_1', email } })
  return email
}

function signedOut() {
  requireWorkspaceUser.mockResolvedValue({
    response: NextResponse.json(
      { error: 'Authentication required', code: 'AUTH_REQUIRED' },
      { status: 401 },
    ),
  })
}

describe('subscription plan contract', () => {
  it('matches the approved pricing ($29/$79/$497; agency is flat monthly with no annual tier)', () => {
    expect(SUBSCRIPTION_PLANS.pro.monthlyUsd).toBe(29)
    expect(SUBSCRIPTION_PLANS.pro.annualUsd).toBe(290)
    expect(SUBSCRIPTION_PLANS.growth.monthlyUsd).toBe(79)
    expect(SUBSCRIPTION_PLANS.growth.annualUsd).toBe(790)
    expect(SUBSCRIPTION_PLANS.agency.monthlyUsd).toBe(497)
    expect(SUBSCRIPTION_PLANS.agency.annualUsd).toBeNull()
  })

  it('keeps the free tier at 1 audit per month', () => {
    expect(SUBSCRIPTION_PLANS.free.auditQuotaPerMonth).toBe(1)
    expect(auditQuotaFor('free')).toBe(1)
    expect(auditQuotaFor(null)).toBe(1)
    expect(auditQuotaFor('nonsense')).toBe(1)
  })

  it('has Stripe price IDs configured for every paid plan and interval', () => {
    for (const key of PAID_PLAN_KEYS) {
      const plan = SUBSCRIPTION_PLANS[key]
      expect(plan.stripe.product).toMatch(/^prod_/)
      expect(plan.stripe.monthlyPrice).toMatch(/^price_/)
      if (plan.annualUsd === null) {
        expect(plan.stripe.annualPrice).toBeNull()
      } else {
        expect(plan.stripe.annualPrice).toMatch(/^price_/)
      }
    }
  })

  it('round-trips every Stripe price ID back to its plan and interval', () => {
    for (const key of PAID_PLAN_KEYS) {
      const plan = SUBSCRIPTION_PLANS[key]
      expect(planFromStripePrice(plan.stripe.monthlyPrice!)).toEqual({
        plan: key,
        interval: 'monthly',
      })
      if (plan.stripe.annualPrice) {
        expect(planFromStripePrice(plan.stripe.annualPrice)).toEqual({
          plan: key,
          interval: 'annual',
        })
      }
    }
    // Agency is monthly-only after reconciliation (scripts/stripe_reconcile_agency.py
    // deactivated the legacy $199/$1990 agency prices): retired price IDs must
    // no longer resolve to any plan or interval.
    expect(planFromStripePrice('price_1U0l9CEINR1kU9chITjlRF0H')).toBeNull()
    expect(planFromStripePrice('price_1U0l9CEINR1kU9chAZGBoJHS')).toBeNull()
    expect(planFromStripePrice('price_unknown')).toBeNull()
  })

  it('free plan has no Stripe binding', () => {
    expect(SUBSCRIPTION_PLANS.free.stripe.product).toBeNull()
    expect(SUBSCRIPTION_PLANS.free.stripe.monthlyPrice).toBeNull()
  })
})

describe('POST /api/subscribe', () => {
  const originalEnv = process.env.STRIPE_SECRET_KEY
  const originalFetch = global.fetch
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy'
    signedIn()
  })
  afterEach(() => {
    process.env.STRIPE_SECRET_KEY = originalEnv
    global.fetch = originalFetch
    jest.restoreAllMocks()
    requireWorkspaceUser.mockReset()
  })

  function makeRequest(body: unknown) {
    return new Request('https://nebulacomponents.com/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('returns 401 JSON when there is no workspace session', async () => {
    signedOut()
    const { POST } = await import('@/app/api/subscribe/route')
    const res = await POST(makeRequest({ plan: 'pro' }) as never)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('Sign in required')
  })

  it('rejects the free plan', async () => {
    const { POST } = await import('@/app/api/subscribe/route')
    const res = await POST(makeRequest({ plan: 'free' }) as never)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Unknown plan')
  })

  it('rejects unknown plans', async () => {
    const { POST } = await import('@/app/api/subscribe/route')
    const bad = await POST(makeRequest({ plan: 'enterprise' }) as never)
    expect(bad.status).toBe(400)
    const data = await bad.json()
    expect(data.error).toBe('Unknown plan')
  })

  it('rejects annual billing on the monthly-only Agency plan', async () => {
    const { POST } = await import('@/app/api/subscribe/route')
    const res = await POST(makeRequest({ plan: 'agency', interval: 'annual' }) as never)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Agency is monthly-only')
  })

  it('coerces unrecognized intervals to monthly', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://checkout.stripe.com/c/pay/cs_test_m', id: 'cs_test_m' }),
    })
    global.fetch = fetchMock as never
    const { POST } = await import('@/app/api/subscribe/route')
    const res = await POST(makeRequest({ plan: 'pro', interval: 'weekly' }) as never)
    expect(res.status).toBe(200)
    const body = String((fetchMock.mock.calls[0][1] as RequestInit).body)
    expect(body).toContain(encodeURIComponent(SUBSCRIPTION_PLANS.pro.stripe.monthlyPrice!))
  })

  it('creates a workspace-bound subscription checkout session for a valid plan', async () => {
    const email = signedIn('dev@nebulacomponents.com')
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://checkout.stripe.com/c/pay/cs_test_123', id: 'cs_test_123' }),
    })
    global.fetch = fetchMock as never

    const { POST } = await import('@/app/api/subscribe/route')
    const res = await POST(makeRequest({ plan: 'pro', interval: 'annual' }) as never)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.url).toContain('checkout.stripe.com')

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.stripe.com/v1/checkout/sessions')
    const body = String((init as RequestInit).body)
    expect(body).toContain('mode=subscription')
    expect(body).toContain(
      encodeURIComponent(SUBSCRIPTION_PLANS.pro.stripe.annualPrice!),
    )
    expect(body).toContain(
      `${encodeURIComponent('subscription_data[metadata][workspace_email]')}=${encodeURIComponent(email)}`,
    )
    expect(body).toContain(`customer_email=${encodeURIComponent(email)}`)
    expect(body).toContain('allow_promotion_codes=true')
    expect(body).toContain(
      `success_url=${encodeURIComponent('https://nebulacomponents.com/workspace?upgraded=pro')}`,
    )
  })

  it('surfaces Stripe failures as 502 without leaking details', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: 'internal stripe detail', code: 'card_invalid' } }),
    }) as never
    const { POST } = await import('@/app/api/subscribe/route')
    const res = await POST(makeRequest({ plan: 'growth' }) as never)
    expect(res.status).toBe(502)
    const data = await res.json()
    expect(JSON.stringify(data)).not.toContain('internal stripe detail')
  })
})

describe('POST /api/billing-portal', () => {
  const originalFetch = global.fetch
  afterEach(() => {
    global.fetch = originalFetch
    requireWorkspaceUser.mockReset()
  })

  function makeRequest() {
    return new Request('https://nebulacomponents.com/api/billing-portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
  }

  it('returns 401 JSON when signed out', async () => {
    signedOut()
    const { POST } = await import('@/app/api/billing-portal/route')
    const res = await POST(makeRequest() as never)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('Sign in required')
  })

  it('returns 404 when no Stripe customer matches the workspace email', async () => {
    signedIn('ghost@nebulacomponents.com')
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    }) as never
    const { POST } = await import('@/app/api/billing-portal/route')
    const res = await POST(makeRequest() as never)
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toContain('No billing account yet')
  })

  it('creates a portal session for the matched customer', async () => {
    const email = signedIn('payer@nebulacomponents.com')
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 'cus_123', email }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://billing.stripe.com/p/session_abc' }),
      })
    global.fetch = fetchMock as never
    const { POST } = await import('@/app/api/billing-portal/route')
    const res = await POST(makeRequest() as never)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.url).toContain('billing.stripe.com')
    const [portalUrl, portalInit] = fetchMock.mock.calls[1]
    expect(portalUrl).toBe('https://api.stripe.com/v1/billing_portal/sessions')
    expect(String((portalInit as RequestInit).body)).toContain('customer=cus_123')
  })
})
