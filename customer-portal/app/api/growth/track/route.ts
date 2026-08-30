import { NextResponse } from 'next/server'
import { logTriggerImpression, logTriggerAction } from '@/app/lib/growth-triggers'

export async function POST(request: Request) {
  const body = await request.json()
  const { auditId, triggerId, action, customerId } = body

  if (!auditId || !triggerId) {
    return NextResponse.json(
      { error: 'auditId and triggerId are required' },
      { status: 400 }
    )
  }

  try {
    if (action === 'view') {
      await logTriggerImpression(auditId, triggerId, customerId)
    } else {
      await logTriggerAction(auditId, triggerId, action, customerId)
    }

    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
