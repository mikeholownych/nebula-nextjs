import { NextResponse } from 'next/server'
import { queueLeadForOutreach } from '../../../lib/email-service'

const isAuthorized = (request: Request) => {
  const secret = process.env.INTERNAL_API_SECRET
  return Boolean(secret) && request.headers.get('authorization') === `Bearer ${secret}`
}

/** GET is intentionally non-mutating: queue processing is POST-only. */
export async function GET() {
  return NextResponse.json(
    { code: 'METHOD_NOT_ALLOWED' },
    { status: 405, headers: { Allow: 'POST' } },
  )
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { visitor_id, email, name, company, score } = body

    if (!visitor_id || !email) {
      return NextResponse.json(
        { error: 'visitor_id and email are required' },
        { status: 400 },
      )
    }

    const leadId = await queueLeadForOutreach(
      visitor_id,
      email,
      name,
      company,
      score || 50,
    )

    return NextResponse.json({
      success: true,
      lead_id: leadId,
      message: '5-email sequence queued',
    })
  } catch (error) {
    console.error('[Email Processor] Queue error:', error)
    return NextResponse.json({ error: 'Queue failed' }, { status: 500 })
  }
}
