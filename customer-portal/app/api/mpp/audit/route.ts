import { NextRequest } from 'next/server'
import { Mppx, tempo } from 'mppx/nextjs'
import { WALLET_ADDRESS } from '@/lib/x402'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nebulacomponents.com'
const DESCRIPTION = 'One landing-page audit for 0.10 USDC.e on Tempo.'

type RouteHandler = (request: Request) => Response | Promise<Response>

let paidHandler: RouteHandler | null = null

function getPaidHandler(): RouteHandler | null {
  if (paidHandler) return paidHandler

  const secretKey = process.env.MPP_SECRET_KEY
  if (!secretKey) return null

  const mppx = Mppx.create({
    methods: [
      tempo.charge({ recipient: WALLET_ADDRESS }),
    ],
    realm: 'nebulacomponents.com',
    secretKey,
  })

  paidHandler = mppx.charge({ amount: '0.10', description: DESCRIPTION })(runAudit)
  return paidHandler
}

async function runAudit(request: Request): Promise<Response> {
  const targetUrl = new URL(request.url).searchParams.get('url')?.trim()
  if (!targetUrl) {
    return Response.json(
      {
        error: 'Missing required query parameter: url',
        example: `${SITE_URL}/api/mpp/audit?url=https%3A%2F%2Fexample.com`,
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
      signal: AbortSignal.timeout(120_000),
    })

    if (!response.ok) {
      return Response.json(
        { error: 'Audit processing failed', status: response.status },
        { status: response.status },
      )
    }

    return Response.json(await response.json())
  } catch (error) {
    return Response.json(
      {
        error: 'Invalid audit URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 },
    )
  }
}

export async function GET(request: NextRequest) {
  const handler = getPaidHandler()
  if (!handler) {
    return Response.json({ code: 'MPP_NOT_CONFIGURED' }, { status: 503 })
  }

  const publicUrl = new URL(request.nextUrl.pathname + request.nextUrl.search, SITE_URL)
  const publicRequest = new Request(publicUrl, {
    headers: request.headers,
    method: 'GET',
  })
  return handler(publicRequest)
}
