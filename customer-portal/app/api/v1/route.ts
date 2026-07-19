import { NextRequest, NextResponse } from 'next/server'
import { withX402 } from '@x402/next'
import { x402Server, WALLET_ADDRESS, NETWORK } from '@/lib/x402'
import { auditQueryDiscovery } from '@/lib/x402-discovery'

/**
 * Discoverable x402 GET endpoint for autonomous agents and generic scanners.
 *
 * Usage after payment:
 *   GET /api/v1?url=https://example.com
 *
 * This reaches the same real FastAPI audit engine as POST /api/audit/run.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nebulacomponents.shop'

const handler = async (request: NextRequest) => {
  const targetUrl = request.nextUrl.searchParams.get('url')?.trim()

  if (!targetUrl) {
    return NextResponse.json(
      {
        error: 'Missing required query parameter: url',
        example: `${SITE_URL}/api/v1?url=https%3A%2F%2Fexample.com`,
      },
      { status: 400 },
    )
  }

  try {
    const parsed = new URL(targetUrl)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Only HTTP(S) URLs are supported')
    }

    const response = await fetch('http://127.0.0.1:8001/audit/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: parsed.toString() }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Audit processing failed', status: response.status },
        { status: response.status },
      )
    }

    return NextResponse.json(await response.json())
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Invalid audit URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 },
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
    description: 'Landing page conversion audit — submit a URL and receive scored conversion findings.',
    mimeType: 'application/json',
    extensions: auditQueryDiscovery,
  },
  x402Server,
)

export async function GET(request: NextRequest) {
  // Next.js sees localhost behind the Cloudflare tunnel. x402 uses request.url
  // as the paid resource identifier, so replace it with the canonical origin.
  const publicUrl = new URL(
    request.nextUrl.pathname + request.nextUrl.search,
    SITE_URL,
  )
  Object.defineProperty(request, 'url', {
    value: publicUrl.toString(),
    writable: false,
  })

  return x402Handler(request)
}
