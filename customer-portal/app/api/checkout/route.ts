import { NextRequest, NextResponse } from 'next/server'
import { getPostHogClient } from '@/app/lib/posthog-server'
import { getActiveFixPack } from '@/app/lib/public-facts'

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
    keys.length !== 1 ||
    keys[0] !== 'offerKey' ||
    body.offerKey !== fixPack.checkout.offerKey
  ) {
    return NextResponse.json({ code: 'UNSUPPORTED_CHECKOUT_OFFER' }, { status: 400 })
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
        'line_items[0][price_data][product_data][name]': 'Nebula Conversion Fix Pack',
        'line_items[0][quantity]': '1',
        'payment_method_types[0]': 'card',
        mode: 'payment',
        success_url: new URL(
          '/thank-you?session_id={CHECKOUT_SESSION_ID}',
          baseUrl,
        ).toString(),
        cancel_url: new URL(fixPack.checkout.pagePath, baseUrl).toString(),
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
