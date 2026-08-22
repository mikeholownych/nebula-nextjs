import { NextRequest, NextResponse } from 'next/server'

const PLATFORM_API = (process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001').replace(/\/$/, '')

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const target = new URL(`${PLATFORM_API}/api/ga4/callback`)
  // Relay the entire Google query string verbatim (code/state/error).
  url.searchParams.forEach((v, k) => target.searchParams.set(k, v))

  const upstream = await fetch(target, {
    headers: { 'Cookie': request.headers.get('cookie') ?? '' },
    redirect: 'manual',
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  })
  const location =
    upstream.headers.get('location') ?? '/workspace?tab=integrations&ga4=done'
  const res = NextResponse.redirect(location, upstream.status >= 400 ? 302 : upstream.status)
  const setCookie = upstream.headers.get('set-cookie')
  if (setCookie) res.headers.set('set-cookie', setCookie)
  return res
}
