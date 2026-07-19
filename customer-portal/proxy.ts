import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/**
 * Legacy static HTML is quarantined until Task 14 completes the App Router
 * migration and Task 11 verifies every buyer-facing claim. Extensionless App
 * Router routes remain available.
 *
 * Also handles:
 * - Markdown for Agents (RFC content negotiation): Accept: text/markdown → llms.txt
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Block legacy .html routes
  if (pathname.toLowerCase().endsWith('.html')) {
    return new NextResponse('Not Found', {
      status: 404,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    })
  }

  // Markdown for Agents — content negotiation
  // Skip assets, .well-known, and API routes
  const isAsset = /\.(ico|png|svg|jpg|jpeg|webp|css|js|json|txt|md|woff2?)$/.test(pathname)
  const isWellKnown = pathname.startsWith('/.well-known')
  const isApi = pathname.startsWith('/api')

  if (!isAsset && !isWellKnown && !isApi) {
    const accept = request.headers.get('accept') ?? ''
    const prefersMarkdown = preferMarkdown(accept)

    if (prefersMarkdown) {
      const mdUrl = request.nextUrl.clone()
      mdUrl.pathname = '/llms.txt'
      const res = NextResponse.rewrite(mdUrl)
      res.headers.set('Content-Type', 'text/markdown; charset=utf-8')
      res.headers.set('X-Markdown-Source', 'llms.txt')
      res.headers.set('Vary', 'Accept')
      return res
    }

    // Add Vary: Accept so caches don't serve HTML to markdown agents
    const res = NextResponse.next()
    res.headers.set('Vary', 'Accept')
    return res
  }

  return NextResponse.next()
}

/**
 * Returns true when Accept prefers text/markdown over text/html.
 * Handles both bare `Accept: text/markdown` and q-factor weighted values.
 */
function preferMarkdown(accept: string): boolean {
  if (!accept.includes('text/markdown')) return false
  // Accept: text/markdown with no text/html → agent-only request
  if (!accept.includes('text/html')) return true
  // Compare q-factors
  const mdQ = qFactor(accept, 'text/markdown')
  const htmlQ = qFactor(accept, 'text/html')
  return mdQ > htmlQ
}

function qFactor(accept: string, type: string): number {
  const match = accept.match(new RegExp(type.replace('/', '\\/') + '(?:;q=([0-9.]+))?'))
  if (!match) return 0
  return match[1] ? parseFloat(match[1]) : 1.0
}

export const config = {
  matcher: [
    // Match all routes except _next internals and static assets
    '/((?!_next/static|_next/image|favicon).*)',
  ],
}
