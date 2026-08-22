import { NextRequest, NextResponse } from 'next/server'
import { authHeaders } from '@/app/lib/workspace-auth'

const PLATFORM_API = (process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001').replace(/\/$/, '')

async function relay(request: NextRequest, path: string[]) {
  const method = request.method
  const url = `${PLATFORM_API}/api/hooks/${path.join('/')}`
  const headers: Record<string, string> = { ...authHeaders(request) }
  let body: string | undefined
  if (method === 'POST') {
    headers['Content-Type'] = 'application/json'
    body = await request.text()
  }
  const upstream = await fetch(url, {
    method,
    headers,
    body,
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })
  const data = await upstream.json().catch(() => ({}))
  return NextResponse.json(data, { status: upstream.status })
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  return relay(request, path)
}
export async function POST(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  return relay(request, path)
}
export async function DELETE(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  return relay(request, path)
}
