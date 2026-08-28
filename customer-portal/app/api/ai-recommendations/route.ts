import { NextResponse } from 'next/server'
import {
  generateAuditRecommendations,
  getFixPackOffer,
} from '@/app/lib/ai-recommendations'

export async function POST(request: Request) {
  const body = await request.json()
  const { action, auditId, customerId, signalKey } = body

  try {
    let result

    if (action === 'generate') {
      if (!auditId) {
        return NextResponse.json(
          { error: 'auditId required for generate action' },
          { status: 400 }
        )
      }
      result = await generateAuditRecommendations(auditId, signalKey)
    } else if (action === 'fix-pack') {
      if (!customerId) {
        return NextResponse.json(
          { error: 'customerId required for fix-pack action' },
          { status: 400 }
        )
      }
      result = await getFixPackOffer(customerId)
    } else {
      return NextResponse.json(
        { error: 'Action must be "generate" or "fix-pack"' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ...result,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
