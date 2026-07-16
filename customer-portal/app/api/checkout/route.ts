import { NextRequest, NextResponse } from 'next/server'

const OFFERS = {
  'fix-pack': {
    name: 'Nebula Conversion Fix Pack',
    stripePriceId: process.env.STRIPE_FIX_PACK_PRICE_ID,
  },
} as const

type OfferKey = keyof typeof OFFERS

const isOfferKey = (value: unknown): value is OfferKey =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(OFFERS, value)

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ code: 'CHECKOUT_NOT_CONFIGURED' }, { status: 503 })
  }

  try {
    const body: unknown = await request.json()

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ code: 'INVALID_CHECKOUT_REQUEST' }, { status: 400 })
    }

    const payload = body as Record<string, unknown>

    // Prices, amounts, and cart line items must never come from the browser.
    if ('items' in payload || 'price' in payload || 'amount' in payload || !isOfferKey(payload.offerKey)) {
      return NextResponse.json({ code: 'UNSUPPORTED_CHECKOUT_OFFER' }, { status: 400 })
    }

    const offerKey = payload.offerKey
    const email = typeof payload.email === 'string' ? payload.email.trim() : ''
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const offer = OFFERS[offerKey]
    if (!offer.stripePriceId) {
      return NextResponse.json({ code: 'CHECKOUT_NOT_CONFIGURED' }, { status: 503 })
    }

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'line_items[0][price]': offer.stripePriceId,
        'line_items[0][quantity]': '1',
        customer_email: email,
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/checkout`,
        'metadata[offer_key]': offerKey,
      }),
    })

    if (!response.ok) {
      console.error('[Checkout API] Stripe session creation failed')
      return NextResponse.json({ code: 'CHECKOUT_PROVIDER_ERROR' }, { status: 502 })
    }

    const session = await response.json()
    if (typeof session.url !== 'string') {
      return NextResponse.json({ code: 'CHECKOUT_PROVIDER_ERROR' }, { status: 502 })
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[Checkout API] Invalid request:', error)
    return NextResponse.json({ code: 'INVALID_CHECKOUT_REQUEST' }, { status: 400 })
  }
}
