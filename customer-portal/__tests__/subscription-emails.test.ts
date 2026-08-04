/** @jest-environment node */

/**
 * Tests for subscription onboarding email sequence.
 *
 * Covers:
 *   - Welcome email sends correct subject and body for pro plan
 *   - Welcome email is NOT sent for subscription updates
 *   - Welcome email is NOT sent for subscription cancellations
 */

import { NextRequest } from 'next/server'

// ── fetch mock ────────────────────────────────────────────────────────────────
const fetchMock = jest.fn()
global.fetch = fetchMock

// ── DB pool mock (required by route.ts) ──────────────────────────────────────
const poolQueryMock = jest.fn()
jest.mock('@/app/lib/db', () => ({
  pool: { query: (...args: unknown[]) => poolQueryMock(...args) },
}))

// ── child_process mock (hermes send, deliver_prompt_pack) ──────────────────
const execFileMock = jest.fn()
jest.mock('child_process', () => ({
  execFile: (...args: unknown[]) => execFileMock(...args),
}))

// ── PostHog mock ──────────────────────────────────────────────────────────────
jest.mock('@/app/lib/posthog-server', () => ({
  getPostHogClient: () => ({ capture: jest.fn(), flush: jest.fn().mockResolvedValue(undefined) }),
  captureServerException: jest.fn(),
}))

// ── Stripe mock factory ───────────────────────────────────────────────────────
// Pro monthly price from subscription-plans.ts
const PRO_MONTHLY_PRICE_ID = 'price_1U0l9AEINR1kU9chtiA64BKd'

function makeStripeSubEvent(
  eventType:
    | 'customer.subscription.created'
    | 'customer.subscription.updated'
    | 'customer.subscription.deleted',
  opts: { email?: string; livemode?: boolean } = {},
) {
  const { email = 'sub@example.com', livemode = true } = opts
  const sub = {
    id: 'sub_test001',
    customer: 'cus_test001',
    status: eventType === 'customer.subscription.deleted' ? 'canceled' : 'active',
    cancel_at_period_end: false,
    items: {
      data: [
        {
          price: { id: PRO_MONTHLY_PRICE_ID, unit_amount: 2900 },
          current_period_start: 1700000000,
          current_period_end: 1702678400,
        },
      ],
    },
  }

  const constructEvent = jest.fn().mockReturnValue({
    id: 'evt_test',
    type: eventType,
    livemode,
    data: { object: sub },
  })

  const retrieveMock = jest.fn().mockResolvedValue({
    id: 'cus_test001',
    email,
    deleted: false,
  })

  jest.doMock('stripe', () =>
    jest.fn().mockImplementation(() => ({
      webhooks: { constructEvent },
      customers: { retrieve: retrieveMock },
    })),
  )
}

async function postWebhook() {
  const { POST } = await import('@/app/api/webhooks/stripe/route')
  const req = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
    method: 'POST',
    headers: { 'stripe-signature': 'test-sig' },
    body: '{}',
  })
  return POST(req)
}

// ── shared setup ─────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.resetModules()
  fetchMock.mockReset()
  poolQueryMock.mockReset().mockResolvedValue({ rowCount: 1, rows: [] })
  execFileMock.mockReset().mockImplementation((...args: unknown[]) => {
    // fire-and-forget execFile callbacks (hermes send)
    const cb = args[args.length - 1]
    if (typeof cb === 'function') cb(null, { stdout: '', stderr: '' })
  })
  process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder'
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_placeholder'
  process.env.PLATFORM_API_URL = 'http://127.0.0.1:8001'
})

// ── tests ─────────────────────────────────────────────────────────────────────
describe('Subscription onboarding email sequence', () => {
  describe('sendSubscriptionWelcome — direct unit tests', () => {
    it('sends correct subject for pro plan', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true } as Response)

      const { sendSubscriptionWelcome } = await import('@/app/lib/subscription-emails')
      const result = await sendSubscriptionWelcome('user@example.com', 'pro')

      expect(result).toBe(true)
      expect(fetchMock).toHaveBeenCalledTimes(1)

      const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
      expect(url).toBe('http://127.0.0.1:8001/email/send')

      const body = JSON.parse(options.body as string)
      expect(body.to).toBe('user@example.com')
      expect(body.subject).toBe('Your Nebula Pro plan is active')
    })

    it('includes plan-specific features in the body for pro plan', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true } as Response)

      const { sendSubscriptionWelcome } = await import('@/app/lib/subscription-emails')
      await sendSubscriptionWelcome('user@example.com', 'pro')

      const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(options.body as string)

      // Should mention the pro plan features (case-insensitive match)
      expect(body.text.toLowerCase()).toContain('unlimited audits')
      // Should direct to workspace setup
      expect(body.text).toContain('nebulacomponents.com/workspace')
      // HTML version should have the same plan name
      expect(body.html).toContain('Pro')
    })

    it('sends correct subject for growth plan', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true } as Response)

      const { sendSubscriptionWelcome } = await import('@/app/lib/subscription-emails')
      await sendSubscriptionWelcome('growth@example.com', 'growth')

      const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(options.body as string)
      expect(body.subject).toBe('Your Nebula Growth plan is active')
    })

    it('sends correct subject for agency plan', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true } as Response)

      const { sendSubscriptionWelcome } = await import('@/app/lib/subscription-emails')
      await sendSubscriptionWelcome('agency@example.com', 'agency')

      const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(options.body as string)
      expect(body.subject).toBe('Your Nebula Agency plan is active')
    })

    it('returns false and does not throw when the platform API is unreachable', async () => {
      fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'))

      const { sendSubscriptionWelcome } = await import('@/app/lib/subscription-emails')
      const result = await sendSubscriptionWelcome('user@example.com', 'pro')

      expect(result).toBe(false)
    })
  })

  describe('Webhook integration — welcome email gating', () => {
    it('sends welcome email when customer.subscription.created fires (live mode)', async () => {
      fetchMock.mockResolvedValue({ ok: true } as Response)
      makeStripeSubEvent('customer.subscription.created')

      const response = await postWebhook()

      expect(response.status).toBe(200)

      // fetchMock should have been called with /email/send
      const emailCalls = fetchMock.mock.calls.filter(([url]) =>
        String(url).includes('/email/send'),
      )
      expect(emailCalls.length).toBeGreaterThanOrEqual(1)

      const [, options] = emailCalls[0] as [string, RequestInit]
      const body = JSON.parse(options.body as string)
      expect(body.subject).toContain('Your Nebula')
      expect(body.subject).toContain('plan is active')
      expect(body.to).toBe('sub@example.com')
    })

    it('does NOT send welcome email for customer.subscription.updated', async () => {
      fetchMock.mockResolvedValue({ ok: true } as Response)
      makeStripeSubEvent('customer.subscription.updated')

      const response = await postWebhook()

      expect(response.status).toBe(200)

      const emailCalls = fetchMock.mock.calls.filter(([url]) =>
        String(url).includes('/email/send'),
      )
      expect(emailCalls).toHaveLength(0)
    })

    it('does NOT send welcome email for customer.subscription.deleted', async () => {
      fetchMock.mockResolvedValue({ ok: true } as Response)
      makeStripeSubEvent('customer.subscription.deleted')

      const response = await postWebhook()

      expect(response.status).toBe(200)

      const emailCalls = fetchMock.mock.calls.filter(([url]) =>
        String(url).includes('/email/send'),
      )
      expect(emailCalls).toHaveLength(0)
    })

    it('does NOT send welcome email in test mode (livemode=false)', async () => {
      fetchMock.mockResolvedValue({ ok: true } as Response)
      makeStripeSubEvent('customer.subscription.created', { livemode: false })

      const response = await postWebhook()

      expect(response.status).toBe(200)

      const emailCalls = fetchMock.mock.calls.filter(([url]) =>
        String(url).includes('/email/send'),
      )
      expect(emailCalls).toHaveLength(0)
    })
  })

  describe('scheduleFirstValueEmail', () => {
    it('exports scheduleFirstValueEmail without throwing', async () => {
      const { scheduleFirstValueEmail } = await import('@/app/lib/subscription-emails')
      expect(() => scheduleFirstValueEmail('user@example.com', 'pro')).not.toThrow()
    })

    it('is a no-op (cron handles delivery) — does not call fetch', async () => {
      const { scheduleFirstValueEmail } = await import('@/app/lib/subscription-emails')
      scheduleFirstValueEmail('user@example.com', 'pro')
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })
})
