import { NextRequest, NextResponse } from 'next/server'
import { authHeaders } from '@/app/lib/workspace-auth'

const PLATFORM_API = process.env.PLATFORM_API_URL || 'http://localhost:8001'

/**
 * GET /api/report/pdf?audit_id=<id>[&share=<token>]
 *
 * Binary-streaming proxy to the platform API's PDF report endpoint.
 * Forwards auth cookies / share token untouched and pipes the PDF body
 * straight back - never parse this response as JSON.
 */
export async function GET(req: NextRequest) {
  const query = req.nextUrl.search // includes leading '?' or is ''
  try {
    const res = await fetch(`${PLATFORM_API}/api/report/pdf${query}`, {
      headers: authHeaders(req),
      cache: 'no-store',
    })

    if (!res.ok) {
      // Error responses from the backend are JSON - pass them through
      const body = await res.text()
      return new NextResponse(body, {
        status: res.status,
        headers: { 'content-type': res.headers.get('content-type') || 'application/json' },
      })
    }

    return new NextResponse(res.body, {
      status: res.status,
      headers: {
        'content-type': res.headers.get('content-type') || 'application/pdf',
        'content-disposition': res.headers.get('content-disposition') || 'attachment',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Report service unavailable' }, { status: 503 })
  }
}
