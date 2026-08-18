import { NextRequest, NextResponse } from 'next/server'

/**
 * Client-side visitor profile endpoint.
 * Receives page visit telemetry from layout.tsx and stores in PostgreSQL.
 * 
 * This is NOT the RB2B third-party webhook, that's at /api/webhooks/rb2b.
 * This is first-party tracking: pages_visited, total_dwell_s, utm_source.
 * 
 * Privacy: Data retained 90 days, subject to /data-rights form.
 * See docs/governance/DATA_REGISTER.md for full register.
 */

export async function POST(request: NextRequest) {
  // Get visitor email from cookie (set by audit unlock)
  const emailCookie = request.cookies.get('audit_unlock_email')?.value
  
  let payload: Record<string, unknown>
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ code: 'INVALID_JSON' }, { status: 400 })
  }

  const pagesVisited = payload.pages_visited as string[] | undefined
  const totalDwellS = payload.total_dwell_s as number | undefined
  const utmSource = payload.utm_source as string | undefined
  const lastVisit = payload.last_visit as string | undefined

  if (!pagesVisited || pagesVisited.length === 0) {
    return NextResponse.json({ code: 'NO_PAGE_DATA' }, { status: 200 })
  }

  // Store in PostgreSQL via platform API
  try {
    const apiBase = process.env.PLATFORM_API_URL || 'http://localhost:8001'
    const res = await fetch(`${apiBase}/visitor-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailCookie || null,
        pages_visited: pagesVisited,
        total_dwell_s: totalDwellS || 0,
        utm_source: utmSource || 'organic',
        last_visit: lastVisit || new Date().toISOString(),
        user_agent: request.headers.get('user-agent') || '',
        ip_hint: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
      }),
    })
    
    if (!res.ok) {
      console.error('[rb2b-event] Platform API error:', res.status)
      // Fail silent, don't block visitor
    }
  } catch (err) {
    console.error('[rb2b-event] Platform API unreachable:', err)
    // Fail silent, visitor tracking is non-critical
  }

  return NextResponse.json({ code: 'PROFILE_RECEIVED' }, { status: 200 })
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: 'visitor_profile',
    privacy: '/data-rights',
  })
}
