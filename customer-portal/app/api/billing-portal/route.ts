import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/app/lib/workspace-auth'

const API = 'https://api.stripe.com/v1'

// POST /api/billing-portal
// Workspace-gated Stripe Customer Portal session. Resolves the Stripe
// customer by the signed-in workspace email, then returns { url }.
export async function POST(req: NextRequest) {
  let email: string
  const auth = await requireWorkspaceUser(req)
  if ('response' in auth) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }
  email = auth.user.email.trim().toLowerCase()

  // Resolve the Stripe customer by email (search returns newest first).
  const q = encodeURIComponent(`email:"${email}"`)
  let customerId: string | null = null
  try {
    const res = await fetch(`${API}/customers?query=${q}&limit=3`, {
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY || ''}` },
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json()
    const hit = (data.data || []).find((c: { email?: string }) =>
      (c.email || '').toLowerCase() === email)
    customerId = hit?.id ?? null
  } catch {
    customerId = null
  }
  if (!customerId) {
    return NextResponse.json(
      { error: 'No billing account yet - subscribe first' }, { status: 404 })
  }

  const form = new URLSearchParams()
  form.set('customer', customerId)
  form.set('return_url', 'https://nebulacomponents.com/workspace')
  try {
    const res = await fetch(`${API}/billing_portal/sessions`, {
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
      // Most common cause: portal not configured for this mode in this account.
      console.error('[billing-portal] stripe error', res.status, data?.error?.code)
      return NextResponse.json({ error: 'Portal unavailable' }, { status: 502 })
    }
    return NextResponse.json({ url: data.url })
  } catch {
    return NextResponse.json({ error: 'Portal unavailable' }, { status: 502 })
  }
}
