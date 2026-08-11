import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/exit-intent
 * Captures an email from the exit-intent popup.
 * Forwards to the platform API to register the lead.
 */
export async function POST(request: NextRequest) {
  let body: { email?: string; page?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = (body.email ?? '').trim().toLowerCase()
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  const page = body.page ?? '/'

  try {
    const apiBase = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'
    const res = await fetch(`${apiBase}/leads/exit-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, page, source: 'exit_intent_popup' }),
      signal: AbortSignal.timeout(6_000),
    })

    // Non-2xx is non-fatal from the user's perspective - we captured the
    // intent; platform API failure shouldn't block the success state.
    if (!res.ok) {
      console.error('[exit-intent] platform API error', res.status, await res.text().catch(() => ''))
    }
  } catch (err) {
    // Log but don't surface to user
    console.error('[exit-intent] platform API unreachable', err)
  }

  // Always return success to the browser - the lead capture is the goal;
  // a backend hiccup shouldn't tell a real user it failed.
  return NextResponse.json({ status: 'captured' })
}
