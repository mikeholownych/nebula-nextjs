import React from 'react'
import { render, screen } from '@testing-library/react'
import { NextRequest } from 'next/server'

jest.mock('@/app/lib/email-service', () => ({
  processEmailQueue: jest.fn(),
  getQueueStats: jest.fn(),
  queueLeadForOutreach: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

import * as emailService from '@/app/lib/email-service'
import { POST as auditPost } from '@/app/api/audit/route'
import { POST as checkoutPost } from '@/app/api/checkout/route'
import { GET as emailGet, POST as emailPost } from '@/app/api/email/process/route'
import { POST as rb2bPost } from '@/app/api/webhooks/rb2b/route'
import AuditPage from '@/app/audit/page'
import CheckoutPage from '@/app/checkout/page'
import ThankYouPage from '@/app/thank-you/page'
import CheckoutImpulsePage from '@/app/checkout-impulse/page'
import CheckoutV2Page from '@/app/checkout-v2/page'
import Create97CheckoutPage from '@/app/create-97-checkout/page'
import LaunchPage97 from '@/app/launch-page-97/page'

const processEmailQueue = jest.mocked(emailService.processEmailQueue)
const queueLeadForOutreach = jest.mocked(emailService.queueLeadForOutreach)

const jsonRequest = (url: string, body: unknown, headers?: HeadersInit) =>
  new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })

const rb2bPayload = {
  event: 'visitor_identified',
  visitor: {
    id: 'visitor-1',
    email: 'person@example.com',
    first_visit: '2026-07-16T00:00:00.000Z',
    last_visit: '2026-07-16T00:00:00.000Z',
    visit_count: 5,
    page_views: ['/audit', '/pricing', '/google-ads-clicks-no-sales'],
  },
  session: {
    id: 'session-1',
    started_at: '2026-07-16T00:00:00.000Z',
    pages: ['/audit'],
    duration_seconds: 120,
  },
}

describe('production safety containment', () => {
  const originalEnv = process.env
  const originalFetch = global.fetch

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
    global.fetch = jest.fn()
  })

  afterAll(() => {
    process.env = originalEnv
    global.fetch = originalFetch
  })

  it('returns an honest unavailable response instead of fabricated audit scores', async () => {
    const randomSpy = jest.spyOn(Math, 'random')

    const response = await auditPost()

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ code: 'AUDIT_REBUILD_IN_PROGRESS' })
    expect(randomSpy).not.toHaveBeenCalled()
    randomSpy.mockRestore()
  })

  it('rejects arbitrary client-supplied checkout prices without contacting Stripe', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_configured'

    const response = await checkoutPost(jsonRequest('http://localhost/api/checkout', {
      email: 'buyer@example.com',
      items: [{ type: 'fix-pack', price: 1 }],
    }))

    expect(response.status).toBe(400)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('fails checkout closed when Stripe is not configured', async () => {
    delete process.env.STRIPE_SECRET_KEY

    const response = await checkoutPost(jsonRequest('http://localhost/api/checkout', {
      email: 'buyer@example.com',
      offerKey: 'fix-pack',
    }))

    expect(response.status).toBe(503)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('does not process email from GET requests', async () => {
    const response = await emailGet()

    expect(response.status).toBe(405)
    expect(response.headers.get('allow')).toBe('POST')

    expect(queueLeadForOutreach).not.toHaveBeenCalled()
  })

  it('rejects unauthenticated email queue requests', async () => {
    process.env.INTERNAL_API_SECRET = 'internal-secret'

    const response = await emailPost(jsonRequest('http://localhost/api/email/process', {
      visitor_id: 'visitor-1',
      email: 'person@example.com',
    }))

    expect(response.status).toBe(401)
    expect(queueLeadForOutreach).not.toHaveBeenCalled()
  })

  it('rejects unsigned RB2B requests without triggering outreach', async () => {
    process.env.RB2B_WEBHOOK_SECRET = 'webhook-secret'

    const response = await rb2bPost(jsonRequest('http://localhost/api/webhooks/rb2b', rb2bPayload))

    expect(response.status).toBe(401)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('uses only the verified canonical Stripe Payment Link on the checkout page', () => {
    render(React.createElement(CheckoutPage))

    expect(screen.getByRole('link', { name: /continue to secure stripe checkout/i })).toHaveAttribute(
      'href',
      'https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b',
    )
    expect(screen.queryByText(/^card details$/i)).not.toBeInTheDocument()
  })

  it('shows an honest audit maintenance page without an audit submission form', () => {
    render(React.createElement(AuditPage))

    expect(screen.getByRole('heading', { name: /audit is being rebuilt/i })).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /landing page url/i })).not.toBeInTheDocument()
  })

  it('does not claim a direct thank-you visit is paid', () => {
    render(React.createElement(ThankYouPage))

    expect(screen.queryByText(/purchase complete/i)).not.toBeInTheDocument()
    expect(screen.getByText(/payment status/i)).toBeInTheDocument()
  })

  it.each([
    ['checkout-impulse', CheckoutImpulsePage],
    ['checkout-v2', CheckoutV2Page],
    ['create-97-checkout', Create97CheckoutPage],
    ['launch-page-97', LaunchPage97],
  ])('returns not found for the unsupported %s route', (_route, Page) => {
    expect(() => Page()).toThrow('NEXT_NOT_FOUND')
  })
})
