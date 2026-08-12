import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nebulacomponents.com'

/**
 * Proxy / edge middleware for Nebula Components.
 *
 * Responsibilities:
 * 1. Domain migration: nebulacomponents.shop → nebulacomponents.com (301)
 * 2. Block legacy .html routes
 * 3. Markdown for Agents (RFC content negotiation): Accept: text/markdown → llms.txt
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Workspace route protection (coarse navigation guard) ──────────────────
  // Redirects unauthenticated browsers away from /workspace to /login.
  // This is NOT the security boundary - every API route, server action, and
  // data-access function independently verifies auth via requireWorkspaceUser().
  if (pathname === '/workspace' || pathname.startsWith('/workspace/')) {
    const token = request.cookies.get('access_token')?.value
    if (!token) {
      const loginUrl = new URL('/login', SITE_URL)
      loginUrl.searchParams.set('returnTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // ── Protect workspace API routes from obviously unauthenticated requests ──
  if (pathname.startsWith('/api/workspace/') || pathname === '/api/audits/by-email') {
    const token = request.cookies.get('access_token')?.value
    const authHeader = request.headers.get('authorization')
    if (!token && !authHeader) {
      return new NextResponse(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  const host = request.headers.get('host') ?? ''

  // ── 1. Domain migration: every variant → .com apex ──────────────────────────
  if (
    host === 'nebulacomponents.shop' ||
    host === 'www.nebulacomponents.shop' ||
    host === 'www.nebulacomponents.com'
  ) {
    const url = request.nextUrl.clone()
    url.protocol = 'https:'
    url.hostname = 'nebulacomponents.com'
    url.port = ''
    return NextResponse.redirect(url, 301)
  }

  // Cloudflare forwards the visitor-facing scheme in this header. Keep the
  // canonical host HTTPS-only instead of serving duplicate HTTP documents.
  const forwardedProto = request.headers
    .get('x-forwarded-proto')
    ?.split(',')[0]
    ?.trim()
    .toLowerCase()
  if (host === 'nebulacomponents.com' && forwardedProto === 'http') {
    const url = request.nextUrl.clone()
    url.protocol = 'https:'
    url.hostname = 'nebulacomponents.com'
    url.port = ''
    return NextResponse.redirect(url, 301)
  }

  // ── 2. Legacy HTML/static aliases - definitive 410 ─────────────────────────
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

  // Markdown for Agents - content negotiation
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
      res.headers.set('x-nebula-pathname', pathname)
      res.headers.set('Content-Type', 'text/markdown; charset=utf-8')
      res.headers.set('X-Markdown-Source', 'llms.txt')
      res.headers.set('Vary', 'Accept')
      return res
    }

    // Add Vary: Accept so caches don't serve HTML to markdown agents
    const res = NextResponse.next()
    res.headers.set('x-nebula-pathname', pathname)
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
    '/((?!_next/static|_next/image|favicon|\.well-known).*)',
  ],
}
