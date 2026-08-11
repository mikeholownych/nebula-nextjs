import { NextRequest, NextResponse } from 'next/server'
import {
  SUBSCRIPTION_PLANS,
  type BillingInterval,
  type PlanKey,
} from '@/app/lib/subscription-plans'

// POST /api/subscribe  { plan: 'pro' | 'growth' | 'agency', interval: 'monthly' | 'annual' }
// Creates a Stripe Checkout Session in subscription mode and returns its URL.
// No audit binding - memberships are workspace-level, not audit-level. The
// One-Leak Kit remains the audit-bound one-time purchase at /api/checkout.
export async function POST(request: NextRequest) {
  let body: { plan?: string; interval?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const plan = body.plan as PlanKey | undefined
  const interval = (body.interval ?? 'monthly') as BillingInterval

  if (!plan || !(plan in SUBSCRIPTION_PLANS) || plan === 'free') {
    return NextResponse.json(
      { error: 'Unsupported plan', code: 'UNSUPPORTED_PLAN' },
      { status: 400 },
    )
  }
  if (interval !== 'monthly' && interval !== 'annual') {
    return NextResponse.json(
      { error: 'Unsupported billing interval', code: 'UNSUPPORTED_INTERVAL' },
      { status: 400 },
    )
  }

  const planDef = SUBSCRIPTION_PLANS[plan]
  const priceId = interval === 'annual' ? planDef.stripe.annualPrice : planDef.stripe.monthlyPrice
  if (!priceId) {
    return NextResponse.json(
      { error: 'Plan price not configured', code: 'PRICE_NOT_CONFIGURED' },
      { status: 500 },
    )
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return NextResponse.json(
      { error: 'Payments are not configured' },
      { status: 500 },
    )
  }

  const params = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    success_url: 'https://nebulacomponents.com/thank-you?flow=subscription&plan=' + plan,
    cancel_url: 'https://nebulacomponents.com/pricing',
    'metadata[nebula_plan]': plan,
    'metadata[billing_interval]': interval,
    allow_promotion_codes: 'true',
    // Stripe sends a recovery email if the session expires with a captured email
    'after_expiration[recovery][enabled]': 'true',
    'after_expiration[recovery][allow_promotion_codes]': 'true',
  })

  let session: { url?: string; id?: string; error?: { message?: string } }
  try {
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })
    session = await response.json()
    if (!response.ok) {
      console.error('[Subscribe API] Stripe error:', session.error?.message)
      return NextResponse.json(
        { error: 'Failed to create subscription checkout' },
        { status: 502 },
      )
    }
  } catch (err) {
    console.error('[Subscribe API] Stripe request failed:', err)
    return NextResponse.json(
      { error: 'Failed to create subscription checkout' },
      { status: 502 },
    )
  }

  if (!session.url) {
    return NextResponse.json(
      { error: 'Stripe did not return a checkout URL' },
      { status: 502 },
    )
  }

  return NextResponse.json({ url: session.url, id: session.id })
}
