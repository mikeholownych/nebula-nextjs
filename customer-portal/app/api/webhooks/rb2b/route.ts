import { NextRequest, NextResponse } from 'next/server'

const hasValidTemporarySignature = (request: NextRequest) => {
  const secret = process.env.RB2B_WEBHOOK_SECRET
  return Boolean(secret) && request.headers.get('x-rb2b-signature') === secret
}

/**
 * RB2B ingestion remains disabled until Task 9 provides full signature
 * verification and idempotent storage. The temporary shared-secret gate keeps
 * unsigned traffic out while failing safely without outreach side effects.
 */
export async function POST(request: NextRequest) {
  if (!hasValidTemporarySignature(request)) {
    return NextResponse.json({ code: 'INVALID_RB2B_SIGNATURE' }, { status: 401 })
  }

  return NextResponse.json({ code: 'RB2B_REBUILD_IN_PROGRESS' }, { status: 503 })
}

export async function GET() {
  return NextResponse.json({
    status: 'maintenance',
    endpoint: 'rb2b_webhook',
  })
}
