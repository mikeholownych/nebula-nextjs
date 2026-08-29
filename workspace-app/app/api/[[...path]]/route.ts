/**
 * Catch-all BFF proxy: forwards /api/<not-native>/* to the legacy portal app,
 * preserving method, query string, cookies, and request body. Real routes in
 * this app (auth, findings, overview) are matched BEFORE this handler, so
 * they never hit the proxy.
 *
 * Excluded prefixes are enforced here (defense in depth) even though route
 * precedence already keeps them local.
 */

import { NextRequest } from 'next/server'

const PORTAL_BFF_URL = process.env.PORTAL_BFF_URL ?? 'http://127.0.0.1:3000'

const NATIVE_PREFIXES = ['auth', 'findings', 'overview']

type Ctx = { params: Promise<{ path?: string[] }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  return proxy(request, await ctx.params)
}
export async function POST(request: NextRequest, ctx: Ctx) {
  return proxy(request, await ctx.params)
}
export async function PATCH(request: NextRequest, ctx: Ctx) {
  return proxy(request, await ctx.params)
}
export async function PUT(request: NextRequest, ctx: Ctx) {
  return proxy(request, await ctx.params)
}
export async function DELETE(request: NextRequest, ctx: Ctx) {
  return proxy(request, await ctx.params)
}

async function proxy(request: NextRequest, params: { path?: string[] }): Promise<Response> {
  const segments = params.path ?? []
  const first = segments[0] ?? ''

  // Defense in depth: native surfaces must never be forwarded.
  if (NATIVE_PREFIXES.includes(first)) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const incoming = new URL(request.url)
  const target = `${PORTAL_BFF_URL}/api/${segments.join('/')}${incoming.search}`

  const headers = new Headers()
  for (const key of ['content-type', 'cookie', 'accept', 'user-agent']) {
    const value = request.headers.get(key)
    if (value) headers.set(key, value)
  }
  headers.set('x-forwarded-host', incoming.host)
  const secret = (process.env.INTERNAL_API_SECRET || '').trim()
  if (secret) headers.set('authorization', `Bearer ${secret}`)

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
      signal: AbortSignal.timeout(30_000),
    })

    const responseHeaders = new Headers()
    for (const key of ['content-type', 'set-cookie']) {
      const value = upstream.headers.get(key)
      if (value) responseHeaders.set(key, value)
    }

    return new Response(await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: responseHeaders,
    })
  } catch (err) {
    console.error('[bff-proxy]', request.method, `/api/${segments.join('/')}`, err)
    return Response.json({ error: 'Workspace service unavailable' }, { status: 503 })
  }
}
