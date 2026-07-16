import React from 'react'
import { existsSync, readFileSync, readdirSync } from 'fs'
import * as path from 'path'
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
import { POST as auditEmailPost } from '@/app/api/audit/email/route'
import { POST as checkoutPost } from '@/app/api/checkout/route'
import { GET as emailGet, POST as emailPost } from '@/app/api/email/process/route'
import { POST as rb2bPost } from '@/app/api/webhooks/rb2b/route'
import AuditPage from '@/app/audit/page'
import CheckoutPage from '@/app/checkout/page'
import ThankYouPage from '@/app/thank-you/page'
import CheckoutImpulsePage from '@/app/checkout-impulse/page'
import CheckoutV2Page from '@/app/checkout-v2/page'
import Create97CheckoutPage from '@/app/create-97-checkout/page'
import LaunchPage97Page from '@/app/launch-page-97/page'
import PartAfterPage from '@/app/part-after/page'
import PartBeforePage from '@/app/part-before/page'
import AdBurnLeaderboardPage from '@/app/ad-burn-leaderboard/page'
import AuditResultsPage from '@/app/audit/results/page'
import AuditSamplePage from '@/app/audit/sample/page'
import { proxy } from '@/proxy'

const processEmailQueue = jest.mocked(emailService.processEmailQueue)
const queueLeadForOutreach = jest.mocked(emailService.queueLeadForOutreach)

const jsonRequest = (url: string, body: unknown, headers?: HeadersInit) =>
  new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })

function listPublicHtml(relativeDir = 'public'): string[] {
  const absoluteDir = path.join(process.cwd(), relativeDir)
  return readdirSync(absoluteDir, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(relativeDir, entry.name)
    if (entry.isDirectory()) return listPublicHtml(relative)
    return entry.isFile() && entry.name.toLowerCase().endsWith('.html') ? [relative] : []
  })
}

function listAppPages(relativeDir = 'app'): string[] {
  const absoluteDir = path.join(process.cwd(), relativeDir)
  return readdirSync(absoluteDir, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(relativeDir, entry.name)
    if (entry.isDirectory()) return listAppPages(relative)
    return entry.isFile() && entry.name === 'page.tsx' ? [relative] : []
  })
}

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

  it('disables public audit email capture while the audit is unavailable', async () => {
    const response = await auditEmailPost()

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ code: 'AUDIT_EMAIL_CAPTURE_REBUILD_IN_PROGRESS' })
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

  it('fails checkout closed without a validated HTTPS production base URL', async () => {
    process.env.STRIPE_SECRET_KEY = '«redacted:sk_test_…»'
    process.env.STRIPE_FIX_PACK_PRICE_ID = 'price_fix_pack'
    delete process.env.NEXT_PUBLIC_URL

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
    expect(processEmailQueue).not.toHaveBeenCalled()
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
    const { container } = render(React.createElement(CheckoutPage))

    expect(screen.getByRole('link', { name: /continue to secure stripe checkout/i })).toHaveAttribute(
      'href',
      'https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b',
    )
    expect(screen.queryByText(/^card details$/i)).not.toBeInTheDocument()
    expect(container.querySelector('a button')).toBeNull()
  })

  it('shows an honest audit maintenance page without an audit submission form', () => {
    const { container } = render(React.createElement(AuditPage))

    expect(screen.getByRole('heading', { name: /audit is being rebuilt/i })).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(container.querySelector('a button')).toBeNull()
  })

  it('does not claim a direct thank-you visit is paid', () => {
    const { container } = render(React.createElement(ThankYouPage))

    expect(screen.queryByText(/purchase complete/i)).not.toBeInTheDocument()
    expect(screen.getByText(/payment status/i)).toBeInTheDocument()
    expect(container.querySelector('a button')).toBeNull()
  })

  it('archives every static checkout alias outside public', () => {
    const aliases = [
      'checkout-impulse.html',
      'checkout_v2.html',
      'create_97_checkout.html',
      'audit-lander.html',
      'index-old.html',
      'part_before.html',
      'part_after.html',
      'thank-you.html',
    ]
    for (const alias of aliases) {
      expect(existsSync(path.join(process.cwd(), 'public', alias))).toBe(false)
      expect(existsSync(path.join(process.cwd(), '.legacy', 'public', alias))).toBe(true)
    }
  })

  it('blocks every legacy public HTML file at the HTTP boundary', () => {
    const htmlFiles = listPublicHtml()
    expect(htmlFiles.length).toBeGreaterThan(0)

    for (const relative of htmlFiles) {
      const urlPath = `/${relative.replace(/^public[\\/]/, '').split(path.sep).join('/')}`
      const response = proxy(new NextRequest(`https://nebula.example${urlPath}`))
      expect(response.status).toBe(404)
      expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow')
    }
  })

  it('keeps global error surfaces free of email capture and audit submission', () => {
    for (const relative of ['app/error.tsx', 'app/not-found.tsx']) {
      const source = readFileSync(path.join(process.cwd(), relative), 'utf8').toLowerCase()
      expect(source).not.toContain('<form')
      expect(source).not.toContain('type="email"')
      expect(source).not.toContain('/api/lead')
      expect(source).not.toContain('email_capture')
    }
  })

  it('removes active audit endpoints, quarantined links, and timed audit promises from every App Router page', () => {
    for (const relative of listAppPages()) {
      const source = readFileSync(path.join(process.cwd(), relative), 'utf8').toLowerCase()
      const compact = source.replace(/\s+/g, ' ')
      expect(source).not.toMatch(/\/api\/audit(?:[?'"`]|$)/)
      expect(source).not.toContain('/api/leaderboard-submit')
      expect(source).not.toContain('/audit.html')
      expect(source).not.toContain('/checkout.html')
      expect(compact).not.toMatch(/audit.{0,140}\b(?:10|30|60)[- ]?seconds?\b/)
      expect(compact).not.toMatch(/\b(?:10|30|60)[- ]?seconds?\b.{0,140}audit/)
    }
  })

  it('removes live instant-audit forms and 60-second promises from public entry pages', () => {
    for (const relative of [
      'app/page.tsx',
      'app/pricing/page.tsx',
      'app/audit-lander/page.tsx',
      'app/index-old/page.tsx',
      'components/Footer.tsx',
      'components/ui/PageShell.tsx',
    ]) {
      const source = readFileSync(path.join(process.cwd(), relative), 'utf8').toLowerCase()
      expect(source).not.toContain("fetch('/api/audit'")
      expect(source).not.toContain('results in 60s')
      expect(source).not.toContain('private link in 60 seconds')
      expect(source).not.toContain('free audit in 60 seconds')
    }
  })

  it.each([
    ['checkout-impulse', CheckoutImpulsePage],
    ['checkout-v2', CheckoutV2Page],
    ['create-97-checkout', Create97CheckoutPage],
    ['launch-page-97', LaunchPage97Page],
    ['part-after', PartAfterPage],
    ['part-before', PartBeforePage],
    ['ad-burn-leaderboard', AdBurnLeaderboardPage],
    ['audit/results', AuditResultsPage],
    ['audit/sample', AuditSamplePage],
  ])('returns not found for the unsupported %s route', (_route, Page) => {
    expect(() => Page()).toThrow('NEXT_NOT_FOUND')
  })
})
