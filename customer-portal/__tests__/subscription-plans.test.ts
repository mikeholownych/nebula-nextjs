/**
 * Membership subscription contract tests:
 * - plan definitions are consistent with the approved pricing
 * - /api/subscribe validates plan/interval and never accepts 'free'
 * - Stripe price resolution round-trips for webhook processing
 */
import {
  SUBSCRIPTION_PLANS,
  PAID_PLAN_KEYS,
  planFromStripePrice,
  auditQuotaFor,
} from '@/app/lib/subscription-plans'

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
  })
  afterEach(() => {
    process.env.STRIPE_SECRET_KEY = originalEnv
    global.fetch = originalFetch
    jest.restoreAllMocks()
  })

  function makeRequest(body: unknown) {
    return new Request('https://nebulacomponents.com/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('rejects the free plan', async () => {
    const { POST } = await import('@/app/api/subscribe/route')
    const res = await POST(makeRequest({ plan: 'free' }) as never)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.code).toBe('UNSUPPORTED_PLAN')
  })

  it('rejects unknown plans and intervals', async () => {
    const { POST } = await import('@/app/api/subscribe/route')
    const bad = await POST(makeRequest({ plan: 'enterprise' }) as never)
    expect(bad.status).toBe(400)
    const badInterval = await POST(
      makeRequest({ plan: 'pro', interval: 'weekly' }) as never,
    )
    expect(badInterval.status).toBe(400)
    const data = await badInterval.json()
    expect(data.code).toBe('UNSUPPORTED_INTERVAL')
  })

  it('creates a subscription-mode checkout session for a valid plan', async () => {
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
    expect(body).toContain('metadata%5Bnebula_plan%5D=pro')
  })

  it('surfaces Stripe failures as 502 without leaking details', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: 'internal stripe detail' } }),
    }) as never
    const { POST } = await import('@/app/api/subscribe/route')
    const res = await POST(makeRequest({ plan: 'growth' }) as never)
    expect(res.status).toBe(502)
    const data = await res.json()
    expect(JSON.stringify(data)).not.toContain('internal stripe detail')
  })
})
