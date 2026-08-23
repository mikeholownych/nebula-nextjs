import { NextRequest, NextResponse } from 'next/server'
import { SUBSCRIPTION_PLANS, type PlanKey } from '@/app/lib/subscription-plans'
import { requireWorkspaceUser } from '@/app/lib/workspace-auth'

const API = 'https://api.stripe.com/v1'

// POST /api/subscribe  { plan: 'pro' | 'growth' | 'agency', interval: 'monthly' | 'annual' }
// Workspace-gated Stripe Checkout Session (subscription mode). Returns { url }.
// Memberships are workspace-level, not audit-level; the audit-bound one-time
// purchase stays at /api/checkout.
export async function POST(req: NextRequest) {
  let email: string
  const auth = await requireWorkspaceUser(req)
  if ('response' in auth) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }
  email = auth.user.email.trim().toLowerCase()

  const body = await req.json().catch(() => ({}))
  const plan = String(body.plan || '')
  const interval = body.interval === 'annual' ? 'annual' : 'monthly'
  const cfg = SUBSCRIPTION_PLANS[plan as PlanKey]
  if (!cfg || !cfg.stripe.monthlyPrice) {
    return NextResponse.json({ error: 'Unknown plan' }, { status: 400 })
  }
  if (interval === 'annual' && !cfg.stripe.annualPrice) {
    return NextResponse.json(
      { error: `${cfg.name} is monthly-only` }, { status: 400 })
  }
  const priceId = interval === 'annual' ? cfg.stripe.annualPrice : cfg.stripe.monthlyPrice

  const form = new URLSearchParams()
  form.set('mode', 'subscription')
  form.set('line_items[0][price]', priceId as string)
  form.set('line_items[0][quantity]', '1')
  form.set('success_url', `https://nebulacomponents.com/workspace?upgraded=${plan}`)
  form.set('cancel_url', 'https://nebulacomponents.com/pricing?from=cancel')
  form.set('subscription_data[metadata][workspace_email]', email)
  form.set('customer_email', email)
  form.set('allow_promotion_codes', 'true')

  try {
    const res = await fetch(`${API}/checkout/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY || ''}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json()
    if (!res.ok || !data.url) {
      console.error('[subscribe] stripe error', res.status, data?.error?.code)
      return NextResponse.json({ error: 'Checkout unavailable' }, { status: 502 })
    }
    return NextResponse.json({ url: data.url })
  } catch {
    return NextResponse.json({ error: 'Checkout unavailable' }, { status: 502 })
  }
}
