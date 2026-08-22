import { NextResponse } from 'next/server'

const PLATFORM_API = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

function internalHeaders(): Record<string, string> {
  const secret = (process.env.INTERNAL_API_SECRET || '').trim()
  return secret ? { Authorization: `Bearer ${secret}` } : {}
}

export async function GET() {
  try {
    const upstream = await fetch(`${PLATFORM_API}/teardowns/`, {
      headers: { ...internalHeaders() },
      next: { revalidate: 300 },
    })
    const data = await upstream.json().catch(() => ({}))
    return NextResponse.json(data, { status: upstream.status })
  } catch {
    return NextResponse.json({ error: 'Teardowns unavailable' }, { status: 502 })
  }
}
