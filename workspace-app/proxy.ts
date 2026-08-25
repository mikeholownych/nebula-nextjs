import { NextRequest, NextResponse } from 'next/server'

/**
 * Auth gate for the workspace surface.
 *
 * Cookie-presence check only (validity is enforced server-side by every API
 * via requireUser). Purpose: a signed-out visitor gets the login screen
 * instead of a rendered app shell with error boxes.
 */

const PUBLIC_PREFIXES = ['/login', '/api']
const OWN_HOSTS = new Set(['app.nebulacomponents.com', 'localhost', '127.0.0.1'])
const PLATFORM_API = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

async function tenantHeaders(request: NextRequest): Promise<Headers | null> {
  const host = (request.headers.get('host') ?? request.nextUrl.hostname)
    .replace(/:\d+$/, '')
    .replace(/\.$/, '')
    .toLowerCase()
  const managed = host.endsWith('.app.nebulacomponents.com')
  if (OWN_HOSTS.has(host) || managed) {
    if (!managed) return null
  }

  try {
    const response = await fetch(
      `${PLATFORM_API}/api/tenant-brand?domain=${encodeURIComponent(host)}`,
      { cache: 'no-store', signal: AbortSignal.timeout(1500) }
    )
    if (!response.ok) return managed ? null : new Headers([['x-tenant-unknown', '1']])
    const brand = await response.json()
    const headers = new Headers()
    headers.set('x-tenant-org-id', String(brand.org_id ?? ''))
    headers.set('x-tenant-org-slug', String(brand.org_slug ?? ''))
    headers.set('x-tenant-brand', JSON.stringify(brand))
    return headers
  } catch {
    return managed ? null : new Headers([['x-tenant-unknown', '1']])
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  const tenant = await tenantHeaders(request)
  if (tenant?.get('x-tenant-unknown') === '1') {
    return NextResponse.json({ error: 'Unknown host' }, { status: 404 })
  }

  if (
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next({ request: { headers: tenant ?? request.headers } })
  }

  const token = request.cookies.get('access_token')?.value
  if (!token) {
    const login = new URL('/login', request.url)
    login.searchParams.set('returnTo', `${pathname}${search}`)
    const response = NextResponse.redirect(login)
    if (tenant) {
      for (const [key, value] of tenant.entries()) response.headers.set(key, value)
    }
    return response
  }

  return NextResponse.next({ request: { headers: tenant ?? request.headers } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
