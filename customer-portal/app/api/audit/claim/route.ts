import { NextRequest, NextResponse } from 'next/server'

const PLATFORM_API = 'http://127.0.0.1:8001'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    
function internalHeaders(): Record<string, string> {
  const secret = (process.env.INTERNAL_API_SECRET || '').trim()
  return secret ? { Authorization: `Bearer ${secret}` } : {}
}

const upstream = await fetch(`${PLATFORM_API}/audit/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...internalHeaders() },
      body: JSON.stringify(body),
    })

    const data = await upstream.json().catch(() => ({}))
    return NextResponse.json(data, { status: upstream.status })
  } catch {
    return NextResponse.json({ error: 'Claim unavailable' }, { status: 502 })
  }
}
