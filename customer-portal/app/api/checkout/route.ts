import { NextRequest, NextResponse } from 'next/server'
import { getPostHogClient, captureServerException } from '@/app/lib/posthog-server'
import { getActiveFixPack } from '@/app/lib/public-facts'
import { readAuditUnlock } from '@/app/lib/audit-unlock-token'
import { REPAIR_SPRINT_OFFER } from '@/app/lib/self-implementation-kit-offer'

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
    return NextResponse.json({ code: 'CHECKOUT_NOT_CONFIGURED' }, { status: 503 })
  }

  const fixPack = getActiveFixPack()
  if (!fixPack) {
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
    return NextResponse.json({ code: 'CHECKOUT_AUDIT_NOT_UNLOCKED' }, { status: 403 })
  }

  const platformApiUrl = (process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001')
    .replace(/\/$/, '')
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
      return NextResponse.json({ code: 'CHECKOUT_AUDIT_NOT_ELIGIBLE' }, { status: 409 })
    }
    const auditedUrl = new URL(audit.url)
    if (!['http:', 'https:'].includes(auditedUrl.protocol)) {
      return NextResponse.json({ code: 'CHECKOUT_AUDIT_NOT_ELIGIBLE' }, { status: 409 })
    }
  } catch {
    return NextResponse.json({ code: 'CHECKOUT_AUDIT_LOOKUP_FAILED' }, { status: 503 })
  }

  let baseUrl: URL
  try {
    baseUrl = new URL(process.env.NEXT_PUBLIC_URL || '')
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

  let session: unknown
  try {
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'line_items[0][price_data][currency]': fixPack.currency.toLowerCase(),
        'line_items[0][price_data][unit_amount]': String(fixPack.priceCents),
        'line_items[0][price_data][product_data][name]': REPAIR_SPRINT_OFFER.name,
        'line_items[0][quantity]': '1',
        'payment_method_types[0]': 'card',
        mode: 'payment',
        success_url: new URL(
          '/thank-you?session_id={CHECKOUT_SESSION_ID}',
          baseUrl,
        ).toString(),
        cancel_url: new URL(
          `${fixPack.checkout.pagePath}?audit_id=${encodeURIComponent(auditId)}`,
          baseUrl,
        ).toString(),
        customer_email: auditIdentity.email,
        'metadata[audit_id]': auditId,
        'metadata[offer_key]': fixPack.checkout.offerKey,
      }),
    })

    if (!response.ok) {
      console.error('[Checkout API] Stripe session creation failed')
      return NextResponse.json({ code: 'CHECKOUT_PROVIDER_ERROR' }, { status: 502 })
    }

    session = await response.json()
  } catch (error) {
    console.error('[Checkout API] Stripe provider request failed:', error)
    captureServerException(error, { route: 'POST /api/checkout' })
    return NextResponse.json({ code: 'CHECKOUT_PROVIDER_ERROR' }, { status: 502 })
  }

  if (!isRecord(session) || !isStripeCheckoutUrl(session.url)) {
    return NextResponse.json({ code: 'CHECKOUT_PROVIDER_ERROR' }, { status: 502 })
  }

  if (typeof session.id === 'string') {
    try {
      const ph = getPostHogClient()
      ph.capture({
        distinctId: session.id,
        event: 'checkout_session_created',
        properties: {
          offer_key: fixPack.checkout.offerKey,
          audit_id: auditId,
          stripe_session_id: session.id,
        },
      })
      void ph.flush().catch(() => undefined)
    } catch {
      // Checkout must not depend on analytics client construction or delivery.
    }
  }

  return NextResponse.json({ url: session.url })
}
