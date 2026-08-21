import { NextRequest, NextResponse } from 'next/server'
import { getPostHogClient, captureServerException } from '@/app/lib/posthog-server'
import { getActiveFixPack } from '@/app/lib/public-facts'
import { readAuditUnlock } from '@/app/lib/audit-unlock-token'
import { REPAIR_SPRINT_OFFER } from '@/app/lib/self-implementation-kit-offer'
import { analyticsPersonId, hasServerAnalyticsConsent, readAttributionHeader } from '@/app/lib/analytics-consent'
import { recordFunnelEvent } from '@/app/lib/funnel-ledger'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isStripeCheckoutUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return (
      url.protocol === 'https:' &&
      url.hostname === 'checkout.stripe.com' &&
      url.port === '' &&
      url.username === '' &&
      url.password === ''
    )
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) {
    await recordFunnelEvent({
      eventName: 'checkout_creation_failed',
      sourceSystem: 'server_api',
      failureReason: 'checkout_provider_error',
      properties: { reason_code: 'checkout_provider_error', detail: 'STRIPE_SECRET_KEY missing' },
    })
    return NextResponse.json({ code: 'CHECKOUT_NOT_CONFIGURED' }, { status: 503 })
  }

  const fixPack = getActiveFixPack()
  if (!fixPack) {
    await recordFunnelEvent({
      eventName: 'checkout_creation_failed',
      sourceSystem: 'server_api',
      failureReason: 'checkout_provider_error',
      properties: { reason_code: 'checkout_provider_error', detail: 'Offer unavailable' },
    })
    return NextResponse.json({ code: 'CHECKOUT_OFFER_UNAVAILABLE' }, { status: 503 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ code: 'INVALID_CHECKOUT_REQUEST' }, { status: 400 })
  }
  if (!isRecord(body)) {
    return NextResponse.json({ code: 'INVALID_CHECKOUT_REQUEST' }, { status: 400 })
  }

  const keys = Object.keys(body)
  if (
    keys.length !== 2 ||
    !keys.includes('offerKey') ||
    !keys.includes('auditId') ||
    body.offerKey !== fixPack.checkout.offerKey ||
    typeof body.auditId !== 'string' ||
    !UUID_RE.test(body.auditId)
  ) {
    return NextResponse.json({ code: 'UNSUPPORTED_CHECKOUT_OFFER' }, { status: 400 })
  }
  const auditId = body.auditId
  const auditIdentity = readAuditUnlock(
    auditId,
    request.cookies.get(`audit_unlock_${auditId}`)?.value,
  )
  if (!auditIdentity) {
    await recordFunnelEvent({
      eventName: 'checkout_creation_failed',
      sourceSystem: 'server_api',
      auditId,
      failureReason: 'audit_not_unlocked',
      properties: { reason_code: 'audit_not_unlocked', audit_id: auditId },
    })
    return NextResponse.json({ code: 'CHECKOUT_AUDIT_NOT_UNLOCKED' }, { status: 403 })
  }

  const platformApiUrl = (process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001')
    .replace(/\/$/, '')
  let auditedPageUrl = ''
  try {
    const auditResponse = await fetch(`${platformApiUrl}/audit/${auditId}`, {
      signal: AbortSignal.timeout(10_000),
    })
    if (!auditResponse.ok) {
      return NextResponse.json({ code: 'CHECKOUT_AUDIT_NOT_FOUND' }, { status: 404 })
    }
    const audit: unknown = await auditResponse.json()
    if (
      !isRecord(audit) ||
      audit.audit_id !== auditId ||
      audit.status !== 'completed' ||
      typeof audit.url !== 'string'
    ) {
      await recordFunnelEvent({
        eventName: 'checkout_creation_failed',
        sourceSystem: 'server_api',
        auditId,
        failureReason: 'audit_not_eligible',
        properties: { reason_code: 'audit_not_eligible', audit_id: auditId },
      })
      return NextResponse.json({ code: 'CHECKOUT_AUDIT_NOT_ELIGIBLE' }, { status: 409 })
    }
    auditedPageUrl = audit.url
    const auditedUrl = new URL(audit.url)
    if (!['http:', 'https:'].includes(auditedUrl.protocol)) {
      return NextResponse.json({ code: 'CHECKOUT_AUDIT_NOT_ELIGIBLE' }, { status: 409 })
    }
  } catch {
    return NextResponse.json({ code: 'CHECKOUT_AUDIT_LOOKUP_FAILED' }, { status: 503 })
  }

  let baseUrl: URL
  try {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_URL ||
      ''
    baseUrl = new URL(siteUrl)
    if (
      baseUrl.protocol !== 'https:' ||
      baseUrl.username !== '' ||
      baseUrl.password !== ''
    ) {
      throw new Error('HTTPS URL without credentials required')
    }
  } catch {
    return NextResponse.json(
      { code: 'CHECKOUT_RETURN_URL_NOT_CONFIGURED' },
      { status: 503 },
    )
  }

  const analyticsConsent = hasServerAnalyticsConsent(request)
  const personId = analyticsConsent ? analyticsPersonId(auditIdentity.email) : null
  const attribution = readAttributionHeader(request)
  const journeyId = request.headers.get('x-nebula-journey-id') || attribution.journey_id || null

  const stripeParams = new URLSearchParams({
    'line_items[0][price_data][currency]': fixPack.currency.toLowerCase(),
    'line_items[0][price_data][unit_amount]': String(fixPack.priceCents),
    'line_items[0][price_data][product_data][name]': REPAIR_SPRINT_OFFER.name,
    'line_items[0][price_data][product_data][description]':
      'One targeted fix for your highest-priority failed condition - exact copy, code, or configuration change for your specific page. Includes a 30-day re-audit to verify the fix held.',
    'line_items[0][quantity]': '1',
    'payment_method_types[0]': 'card',
    'payment_method_types[1]': 'link',
    'payment_method_options[card][request_three_d_secure]': 'automatic',
    mode: 'payment',
    'payment_intent_data[setup_future_usage]': 'off_session',
    'payment_intent_data[statement_descriptor_suffix]': 'NEBULA KIT',
    submit_type: 'pay',
    success_url: new URL('/thank-you?session_id={CHECKOUT_SESSION_ID}', baseUrl).toString(),
    cancel_url: new URL(`${fixPack.checkout.pagePath}?audit_id=${encodeURIComponent(auditId)}&from=stripe_cancel`, baseUrl).toString(),
    customer_email: auditIdentity.email,
    'metadata[audit_id]': auditId,
    'metadata[url]': auditedPageUrl.slice(0, 500),
    'metadata[offer_key]': fixPack.checkout.offerKey,
    'metadata[analytics_consent]': analyticsConsent ? 'all' : 'necessary',
    'metadata[audit_unlocked_email]': auditIdentity.email,
    'after_expiration[recovery][enabled]': 'true',
  })
  if (journeyId) stripeParams.set('metadata[journey_id]', journeyId)
  if (personId) stripeParams.set('metadata[analytics_person_id]', personId)
  for (const [key, value] of Object.entries(attribution)) {
    stripeParams.set(`metadata[${key}]`, value.slice(0, 500))
  }

  let session: unknown
  try {
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: stripeParams,
      // RES-1: bounded caller budget on the money path - a hung provider
      // connection must fail fast into CHECKOUT_PROVIDER_ERROR, not pin the
      // request (and trigger Stripe-side retry pressure).
      signal: AbortSignal.timeout(15_000),
    })

    if (!response.ok) {
      console.error('[Checkout API] Stripe session creation failed')
      await recordFunnelEvent({
        eventName: 'checkout_creation_failed',
        sourceSystem: 'server_api',
        auditId,
        failureReason: 'checkout_provider_error',
        properties: { reason_code: 'checkout_provider_error', status_code: response.status },
      })
      return NextResponse.json({ code: 'CHECKOUT_PROVIDER_ERROR' }, { status: 502 })
    }

    session = await response.json()
  } catch (error) {
    console.error('[Checkout API] Stripe provider request failed:', error)
    if (hasServerAnalyticsConsent(request)) {
      captureServerException(error, { route: 'POST /api/checkout' })
    }
    await recordFunnelEvent({
      eventName: 'checkout_creation_failed',
      sourceSystem: 'server_api',
      auditId,
      failureReason: 'checkout_provider_error',
      properties: { reason_code: 'checkout_provider_error' },
    })
    return NextResponse.json({ code: 'CHECKOUT_PROVIDER_ERROR' }, { status: 502 })
  }

  if (!isRecord(session) || !isStripeCheckoutUrl(session.url)) {
    return NextResponse.json({ code: 'CHECKOUT_PROVIDER_ERROR' }, { status: 502 })
  }

  const sessionId = typeof session.id === 'string' ? session.id : null

  // Record canonical checkout_started into internal event ledger
  if (sessionId) {
    await recordFunnelEvent({
      eventName: 'checkout_started',
      stage: 'checkout',
      sourceSystem: 'server_api',
      journeyId,
      auditId,
      checkoutSessionId: sessionId,
      utmSource: attribution.utm_source || null,
      utmMedium: attribution.utm_medium || null,
      utmCampaign: attribution.utm_campaign || null,
      properties: {
        journey_id: journeyId,
        audit_id: auditId,
        checkout_session_id: sessionId,
        offer_key: fixPack.checkout.offerKey,
        price_cents: fixPack.priceCents,
        currency: fixPack.currency,
        provider: 'stripe',
        ...attribution,
      },
    })
  }

  if (sessionId && analyticsConsent && personId) {
    try {
      const ph = getPostHogClient()
      ph.capture({
        distinctId: personId,
        event: 'checkout_session_created',
        properties: {
          offer_key: fixPack.checkout.offerKey,
          audit_id: auditId,
          stripe_session_id: sessionId,
          ...attribution,
        },
      })
      void ph.flush().catch(() => undefined)
    } catch {
      // Checkout must not depend on analytics client construction or delivery.
    }
  }

  return NextResponse.json({ url: session.url })
}
