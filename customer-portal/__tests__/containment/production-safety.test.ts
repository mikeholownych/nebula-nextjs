import React from 'react'
import { existsSync, readFileSync, readdirSync } from 'fs'
import * as path from 'path'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { NextRequest } from 'next/server'
import posthog from 'posthog-js'

jest.mock('posthog-js', () => ({
  __esModule: true,
  default: { capture: jest.fn() },
}))

jest.mock('@/app/lib/email-service', () => ({
  getQueueStats: jest.fn(),
  queueLeadForOutreach: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

import * as emailService from '@/app/lib/email-service'
import { POST as auditStartPost } from '@/app/api/audit/start/route'
import { POST as auditEmailPost } from '@/app/api/audit/email/route'
import { POST as checkoutPost } from '@/app/api/checkout/route'
import { GET as emailGet, POST as emailPost } from '@/app/api/email/process/route'
import { POST as rb2bPost } from '@/app/api/webhooks/rb2b/route'
import { getPublishedCaseStudies, publicFacts } from '@/app/lib/public-facts'
import { signAuditUnlock } from '@/app/lib/audit-unlock-token'
import AuditPage from '@/app/audit/page'
import CheckoutCTAButton from '@/app/checkout/CheckoutCTAButton'
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

const queueLeadForOutreach = jest.mocked(emailService.queueLeadForOutreach)

const jsonRequest = (url: string, body: unknown, headers?: HeadersInit) =>
  new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })

const checkoutAuditId = '123e4567-e89b-12d3-a456-426614174000'
const completedAudit = {
  audit_id: checkoutAuditId,
  email: 'buyer@example.com',
  status: 'completed',
  url: 'https://example.com/landing',
}

const checkoutRequest = () => {
  const token = signAuditUnlock(checkoutAuditId, 'buyer@example.com')
  return jsonRequest(
    'http://localhost/api/checkout',
    { auditId: checkoutAuditId, offerKey: 'fix-pack' },
    { cookie: `audit_unlock_${checkoutAuditId}=${token}` },
  )
}

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

const unsupportedPublicAppRoutes = [
  'accessible-nebula',

  'ai-ops-retainer',
  'audit-dashboard',
  'audits',
  'beta-tester',
  'component-showcase',
  'dashboard',
  'demo',
  'generator',
  'growth-launch',
  'growth-launch-confirmation',
  'lead-dashboard',
  'marketing-ops',
  'organization',
  'subscription',
] as const

const notFoundStubPattern = /export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?notFound\(\)[\s\S]*?\}/

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
    process.env.AUDIT_UNLOCK_SECRET = 'containment-test-secret'
    global.fetch = jest.fn()
  })

  afterAll(() => {
    process.env = originalEnv
    global.fetch = originalFetch
  })

  it('rejects audit start requests without a URL rather than fabricating a score', async () => {
    const randomSpy = jest.spyOn(Math, 'random')

    const response = await auditStartPost(jsonRequest('http://localhost/api/audit/start', {}))

    expect(response.status).toBe(400)
    expect(randomSpy).not.toHaveBeenCalled()
    expect(global.fetch).not.toHaveBeenCalled()
    randomSpy.mockRestore()
  })

  it('forwards audit email requests to the scoring backend rather than fabricating a send', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          audit_id: checkoutAuditId,
          url: 'https://example.com',
          email: 'person@example.com',
          score: 71,
          grade: 'B',
          findings: [{ key: 'cta' }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'sent' }),
      })

    process.env.AUDIT_UNLOCK_SECRET = 'test-unlock-secret'
    const token = signAuditUnlock(checkoutAuditId, 'person@example.com')
    const response = await auditEmailPost(jsonRequest('http://localhost/api/audit/email', {
      auditId: checkoutAuditId,
      url: 'https://forged.example',
      email: 'victim@example.com',
      score: 42,
      grade: 'C',
      findings: [],
    }, { cookie: `audit_unlock_${checkoutAuditId}=${token}` }))

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      'http://127.0.0.1:8001/audit/email',
      expect.objectContaining({ method: 'POST' }),
    )
    const sent = JSON.parse((global.fetch as jest.Mock).mock.calls[1][1].body as string)
    expect(sent.email).toBe('person@example.com')
    expect(sent.score).toBe(71)
    expect(sent.findings).toEqual([{ key: 'cta' }])
    await expect(response.json()).resolves.toEqual({ status: 'sent' })
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

  it('does not depend on an opaque configured Stripe Price ID', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_configured'
    delete process.env.STRIPE_FIX_PACK_PRICE_ID
    process.env.NEXT_PUBLIC_URL = 'https://nebulacomponents.com'
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(Response.json(completedAudit))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
        id: 'cs_test_registry_price',
        url: 'https://checkout.stripe.com/c/pay/cs_test_registry_price',
      }),
    })

    const response = await checkoutPost(checkoutRequest())

    expect(response.status).toBe(200)
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('fails checkout closed without a validated HTTPS production base URL', async () => {
    process.env.STRIPE_SECRET_KEY = '«redacted:sk_test_…»'
    delete process.env.NEXT_PUBLIC_URL
    delete process.env.NEXT_PUBLIC_SITE_URL

    const response = await checkoutPost(checkoutRequest())

    expect(response.status).toBe(503)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('creates a server-side Stripe Checkout Session with canonical offer metadata', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_configured'
    process.env.NEXT_PUBLIC_URL = 'https://nebulacomponents.com'
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(Response.json(completedAudit))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
        id: 'cs_test_created',
        url: 'https://checkout.stripe.com/c/pay/cs_test_created',
      }),
    })

    const response = await checkoutPost(checkoutRequest())

    expect(response.status).toBe(200)
    const init = (global.fetch as jest.Mock).mock.calls[1][1] as RequestInit
    const body = new URLSearchParams(String(init.body))
    expect(body.get('line_items[0][price]')).toBeNull()
    expect(body.get('line_items[0][price_data][currency]')).toBe('usd')
    expect(body.get('line_items[0][price_data][unit_amount]')).toBe('9700')
    expect(body.get('line_items[0][price_data][product_data][name]')).toBe(
      'One-Leak Repair Sprint',
    )
    expect(body.get('payment_method_types[0]')).toBe('card')
    expect(body.get('metadata[offer_key]')).toBe('fix-pack')
    expect(body.get('metadata[audit_id]')).toBe(checkoutAuditId)
    expect(body.get('customer_email')).toBe('buyer@example.com')
    await expect(response.json()).resolves.toEqual({
      url: 'https://checkout.stripe.com/c/pay/cs_test_created',
    })
  })

  it.each([
    ['network rejection', () => Promise.reject(new Error('network down'))],
    ['invalid JSON', () => Promise.resolve({
      ok: true,
      json: async () => { throw new SyntaxError('invalid JSON') },
    })],
  ])('maps Stripe provider %s to 502', async (_label, providerResult) => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_configured'
    process.env.NEXT_PUBLIC_URL = 'https://nebulacomponents.com'
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(Response.json(completedAudit))
      .mockImplementationOnce(providerResult)

    const response = await checkoutPost(checkoutRequest())

    expect(response.status).toBe(502)
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

  it('starts server-created Stripe Checkout only with a selected audit identity', () => {
    const { container } = render(React.createElement(CheckoutCTAButton, {
      auditId: checkoutAuditId,
      endpoint: '/api/checkout',
      offerKey: 'fix-pack',
    }))

    expect(screen.getByRole('button', { name: /continue to secure stripe checkout/i })).toBeInTheDocument()
    expect(container.innerHTML).not.toContain('buy.stripe.com')
    expect(screen.queryByText(/^card details$/i)).not.toBeInTheDocument()
    expect(container.querySelector('a button')).toBeNull()
  })

  it('still starts API checkout when client analytics throws synchronously', async () => {
    jest.mocked(posthog.capture).mockImplementationOnce(() => {
      throw new Error('analytics unavailable')
    })
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ code: 'CHECKOUT_PROVIDER_ERROR' }),
    })
    render(React.createElement(CheckoutCTAButton, {
      auditId: checkoutAuditId,
      endpoint: '/api/checkout',
      offerKey: 'fix-pack',
    }))

    fireEvent.click(screen.getByRole('button', {
      name: /continue to secure stripe checkout/i,
    }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/checkout',
        expect.objectContaining({ method: 'POST' }),
      )
    })
  })

  it('shows a real audit submission form now that scoring is live', () => {
    const source = readFileSync(path.join(process.cwd(), 'app/audit/page.tsx'), 'utf8')
    expect(source).toContain("Check your page before you change the ad.")
    expect(source).toContain('<AuditForm />')
    expect(source).not.toContain('7.7/10')
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

    const { findLegacyHtmlRedirect } = require('@/app/lib/legacy-routes') as {
      findLegacyHtmlRedirect: (p: string) => string | null
    }
    for (const relative of htmlFiles) {
      const urlPath = `/${relative.replace(/^public[\\/]/, '').split(path.sep).join('/')}`
      const response = proxy(new NextRequest(`https://nebula.example${urlPath}`))
      const legacyDestination = findLegacyHtmlRedirect(urlPath)
      if (legacyDestination) {
        // D9: equity-bearing indexed .html URLs 301 to their live equivalent -
        // the stale file is still never served, which is this suite's contract.
        expect(response.status).toBe(301)
        expect(new URL(response.headers.get('location')!).pathname).toBe(legacyDestination)
      } else {
        expect(response.status).toBe(404)
        expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow')
      }
    }
  })

  it('redirects every non-canonical Nebula host directly to the .com apex', () => {
    for (const host of [
      'nebulacomponents.shop',
      'www.nebulacomponents.shop',
      'www.nebulacomponents.com',
    ]) {
      const response = proxy(
        new NextRequest(`https://${host}/audit?source=canonical-test`, {
          headers: { host },
        }),
      )
      expect(response.status).toBe(301)
      expect(response.headers.get('location')).toBe(
        'https://nebulacomponents.com/audit?source=canonical-test',
      )
    }
  })

  it('redirects canonical HTTP requests to HTTPS without changing path or query', () => {
    const response = proxy(
      new NextRequest('http://localhost/audit?source=http-upgrade', {
        headers: {
          host: 'nebulacomponents.com',
          'x-forwarded-proto': 'http',
        },
      }),
    )

    expect(response.status).toBe(301)
    expect(response.headers.get('location')).toBe(
      'https://nebulacomponents.com/audit?source=http-upgrade',
    )
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

  it('removes active audit endpoints and quarantined links from every App Router page', () => {
    for (const relative of listAppPages()) {
      const source = readFileSync(path.join(process.cwd(), relative), 'utf8').toLowerCase()
      expect(source).not.toMatch(/\/api\/audit(?:[?'"`]|$)/)
      expect(source).not.toContain('/api/leaderboard-submit')
      expect(source).not.toContain('/audit.html')
      expect(source).not.toContain('/checkout.html')
    }
  })

  it('keeps audit timing claims within the real backend timeout (120s)', () => {
    for (const relative of listAppPages()) {
      const source = readFileSync(path.join(process.cwd(), relative), 'utf8').toLowerCase()
      const compact = source.replace(/\s+/g, ' ')
      // Only reject explicit fixed-turnaround promises attached to the audit itself.
      expect(compact).not.toMatch(/audit.{0,100}(?:in|within|under)\s+(?:1|2|3|4|5|6|7|8|9|10)[- ]?seconds?\b/)
      expect(compact).not.toMatch(/(?:in|within|under)\s+(?:1|2|3|4|5|6|7|8|9|10)[- ]?seconds?\b.{0,100}audit/)
    }
  })

  it('removes live instant-audit forms and 60-second promises from public entry pages', () => {
    for (const relative of [
      'app/page.tsx',
      'app/pricing/page.tsx',
      'app/audit/page.tsx',
      'app/learning-centre/page.tsx',
      'app/audit-lander/page.tsx',
      'app/index-old/page.tsx',
      'components/Footer.tsx',
      'components/ui/PageShell.tsx',
    ]) {
      const rawSource = readFileSync(path.join(process.cwd(), relative), 'utf8').toLowerCase()
      // "Generic report generated in seconds" on the homepage describes a
      // *competitor's* shallow audit, contrasted against Nebula's - not a
      // claim about Nebula's own turnaround. Strip it before checking.
      const source = rawSource.replace('generic report generated in seconds', '')
      expect(source).not.toContain("fetch('/api/audit'")
      // Broad pattern, not exact phrases - the real bug (2026-07-24) was that
      // exact-phrase checks ('free audit in 60 seconds' etc.) missed sibling
      // wordings like "shows you in 60 seconds" and "takes 60 seconds" that
      // made the same false promise against the real 120s backend timeout
      // (app/api/audit/start/route.ts). Also blocks bare "instant"/"in
      // seconds" claims for the same reason: don't claim faster than the
      // system can actually deliver.
      expect(source).not.toMatch(/\b60[\s-]?seconds?\b/)
      expect(source).not.toMatch(/\bin seconds\b/)
      expect(source).not.toMatch(/\binstant\b/)
    }
  })

  it('quarantines every unsupported prototype, unverified purchase, and unauthenticated dashboard route', () => {
    for (const route of unsupportedPublicAppRoutes) {
      const source = readFileSync(path.join(process.cwd(), 'app', route, 'page.tsx'), 'utf8')
      expect(source).toMatch(notFoundStubPattern)
      expect(source).toMatch(/robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/)
      expect(source).not.toContain('<form')
      expect(source).not.toContain('buy.stripe.com')
      expect(source).not.toMatch(/fetch\s*\(/)
    }
  })

  it('does not link public pages or shared navigation to quarantined App Router routes', () => {
    const blockedPathPattern = new RegExp(`(?:href|to)=["']/(?:${unsupportedPublicAppRoutes.join('|')})(?:[/?#"'])`)
    for (const relative of [...listAppPages(), 'components/Footer.tsx']) {
      const source = readFileSync(path.join(process.cwd(), relative), 'utf8')
      expect(source).not.toMatch(blockedPathPattern)
    }
  })

  it('keeps case studies limited to documented, verified outcomes', () => {
    const caseStudySource = readFileSync(path.join(process.cwd(), 'app/case-studies/[slug]/page.tsx'), 'utf8')
    const indexSource = readFileSync(path.join(process.cwd(), 'app/case-studies/page.tsx'), 'utf8')
    const sitemapSource = readFileSync(path.join(process.cwd(), 'app/sitemap.ts'), 'utf8')
    const publicFactsSource = readFileSync(path.join(process.cwd(), 'app/lib/public-facts.ts'), 'utf8')

    // Unknown slugs still 404 - only evidence-gated registry entries resolve.
    expect(caseStudySource).toMatch(/notFound\(\)/)
    expect(caseStudySource).not.toContain('score:')
    expect(caseStudySource).not.toContain("'@type': 'CaseStudy'")

    // As of 2026-07-24 there are zero real, evidenced case studies (the
    // previous 4 entries were invented - this business has no completed
    // paid engagements on record). Detail routes and sitemap entries must
    // derive from the same fail-closed public-facts accessor.
    expect(publicFacts.caseStudies.status).toBe('none_published')
    expect(getPublishedCaseStudies()).toEqual([])
    expect(publicFactsSource).toContain('public-proof.generated.json')
    expect(publicFactsSource).not.toMatch(/caseStudies:\s*\{[\s\S]*?entries:\s*\[\]/)
    expect(caseStudySource).toContain('getPublishedCaseStudies()')
    expect(sitemapSource).toContain('getPublishedCaseStudies()')

    // The index page must not claim real/verified results while
    // CASE_STUDIES is empty - this is exactly the gap that let 4
    // fabricated case studies read as genuine before.
    const indexLower = indexSource.toLowerCase()
    expect(indexLower).not.toMatch(/real results from/)
    expect(indexLower).not.toMatch(/founders who (stopped|ran the audit)/)
  })

  it('keeps company and founder pages free of unsupported proof and paused offers', () => {
    const files = ['app/about/page.tsx', 'app/about/team/page.tsx', 'app/company/about/page.tsx', 'app/company/team/page.tsx']
    const source = files.map((relative) => readFileSync(path.join(process.cwd(), relative), 'utf8')).join('\n').toLowerCase()

    for (const unsupported of ['$2.3m', '200+ landing pages', '50+ landing pages', '94% of pages', 'conversions in 24 hours', 'ai ops retainer']) {
      expect(source).not.toContain(unsupported)
    }
  })

  it('keeps global metadata and schema free of disabled audit offers and unsupported proof', () => {
    const layoutSource = readFileSync(path.join(process.cwd(), 'app/layout.tsx'), 'utf8')
    const schemaSource = readFileSync(path.join(process.cwd(), 'app/lib/schema.ts'), 'utf8')
    const combined = `${layoutSource}\n${schemaSource}`.toLowerCase()

    expect(layoutSource).not.toContain('auditServiceSchema')
    expect(layoutSource).not.toContain('faqSchema')
    expect(layoutSource).not.toContain('speakableSchema')
    expect(combined).not.toContain('60 seconds')
    expect(combined).not.toContain('instant results')
    expect(combined).not.toContain('aggregaterating')
    expect(combined).not.toContain('reviewcount')
    expect(combined).not.toContain("price: '97'")
    // 'free landing page audit' is valid in layout metadata; block only in schema offers
    expect(schemaSource.toLowerCase()).not.toContain('free landing page audit')
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
