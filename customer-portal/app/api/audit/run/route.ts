import { NextRequest, NextResponse } from 'next/server'
import { withX402 } from '@x402/next'
import { x402Server, WALLET_ADDRESS, NETWORK } from '@/lib/x402'
import { auditBodyDiscovery } from '@/lib/x402-discovery'

/**
 * Proxy to FastAPI platform API for audit processing
 * Routes POST requests to localhost:8001/audit/run
 *
 * x402 payment: $0.10 USDC per audit run
 * Agents without payment header receive HTTP 402 with payment requirements.
 * Human users coming through the UI are unaffected — the UI calls /api/audit/start,
 * not /api/audit/run directly.
 *
 * URL fix: withX402 reads req.url (which is localhost:3000 behind CF tunnel).
 * We rewrite the request URL to the public origin before passing to the middleware
 * so the 402 payment-required payload contains the correct resource URL.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nebulacomponents.shop'

const handler = async (request: NextRequest) => {
  try {
    const body = await request.json()

    // Forward to local FastAPI
    const response = await fetch('http://127.0.0.1:8001/audit/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Audit processing failed', status: response.status },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Audit API proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

const x402Handler = withX402(
  handler,
  {
    accepts: [
      {
        scheme: 'exact',
        price: '$0.10',
        network: NETWORK,
        payTo: WALLET_ADDRESS,
      },
    ],
    description: 'Landing page conversion audit — scores headline, trust signals, CTA, mobile, form friction, load time, and message-match.',
    mimeType: 'application/json',
    extensions: auditBodyDiscovery,
  },
  x402Server,
)

export async function POST(request: NextRequest) {
  // withX402 reads req.url / req.nextUrl — which is localhost:3000 behind the CF tunnel.
  // Monkey-patch nextUrl on a clone so the 402 payload emits the public resource URL.
  const publicUrl = new URL(
    request.nextUrl.pathname + request.nextUrl.search,
    SITE_URL,
  )
  // NextRequest.nextUrl is a NextURL which extends URL — override href in place
  Object.defineProperty(request, 'url', { value: publicUrl.toString(), writable: false })
  try {
    Object.assign(request.nextUrl, { href: publicUrl.toString() })
  } catch {
    // nextUrl may be frozen; fall through — url override alone is sufficient
  }
  return x402Handler(request)
}

export async function GET() {
  // Health check — proxy to FastAPI health endpoint (no payment required)
  try {
    const response = await fetch('http://127.0.0.1:8001/audit/health')
    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { status: 'error', message: 'Audit API not available' },
      { status: 503 }
    )
  }
}
