import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/**
 * Legacy static HTML is quarantined until Task 14 completes the App Router
 * migration and Task 11 verifies every buyer-facing claim. Extensionless App
 * Router routes remain available.
 */
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.toLowerCase().endsWith('.html')) {
    return new NextResponse('Not Found', {
      status: 404,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    })
  }

  return NextResponse.next()
}
