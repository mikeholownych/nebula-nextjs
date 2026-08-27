import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

type Stage = 'payment_received' | 'onboarding_complete' | 'sprint_delivered' | 're_audit_scheduled' | 'churned'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { customerId, stage, metadata } = data

    if (!customerId || !stage) {
      return NextResponse.json(
        { error: 'customerId and stage are required' },
        { status: 400 }
      )
    }

    const validStages: Stage[] = ['payment_received', 'onboarding_complete', 'sprint_delivered', 're_audit_scheduled', 'churned']
    if (!validStages.includes(stage as Stage)) {
      return NextResponse.json(
        { error: `Invalid stage. Must be one of: ${validStages.join(', ')}` },
        { status: 400 }
      )
    }

    try {
      await auditPool.query(`
        UPDATE customer_onboarding
        SET stage = $1,
            metadata = COALESCE(metadata, '{}') || jsonb_build_object('stage_update', $2),
            updated_at = NOW()
        WHERE customer_id = $3
        RETURNING *
      `, [stage, JSON.stringify({ updated_by: 'api', at: new Date().toISOString() }), customerId])

      return NextResponse.json({ success: true })
    } catch (error: any) {
      if (error.code === '23505' || error.code === '23503') {
        return NextResponse.json({ success: false, message: 'Customer not found or already completed' })
      }
      throw error
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
