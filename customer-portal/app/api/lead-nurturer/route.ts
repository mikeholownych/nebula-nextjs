import { NextResponse } from 'next/server'
import { createNurtureSequence, triggerNurtureSequence, getLeadNurtureStatus } from '@/app/lib/lead-nurturer'

export async function POST(request: Request) {
  const body = await request.json()
  const { action, customerId, sequenceId, sequenceData } = body

  try {
    let result

    if (action === 'create') {
      if (!sequenceData) {
        return NextResponse.json(
          { error: 'sequenceData required for create action' },
          { status: 400 }
        )
      }
      result = await createNurtureSequence(sequenceData)
    } else if (action === 'trigger') {
      if (!customerId || !sequenceId) {
        return NextResponse.json(
          { error: 'customerId and sequenceId required for trigger action' },
          { status: 400 }
        )
      }
      result = await triggerNurtureSequence(customerId, sequenceId)
    } else {
      return NextResponse.json(
        { error: 'Action must be "create" or "trigger"' },
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

export async function GET(request: Request) {
  const url = new URL(request.url)
  const customerId = url.searchParams.get('customer_id')

  try {
    if (!customerId) {
      return NextResponse.json(
        { error: 'customer_id required' },
        { status: 400 }
      )
    }

    const status = await getLeadNurtureStatus(customerId)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ...status,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
