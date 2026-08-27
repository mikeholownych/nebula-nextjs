import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { auditId, eventType } = data

    if (!auditId || !eventType) {
      return NextResponse.json(
        { error: 'auditId and eventType are required' },
        { status: 400 }
      )
    }

    const validEvents = ['email_opened', 'email_clicked', 'email_bounced', 'email_unsubscribed']
    if (!validEvents.includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid eventType. Must be one of: ${validEvents.join(', ')}` },
        { status: 400 }
      )
    }

    try {
      await auditPool.query(`
        INSERT INTO audit_events (audit_id, event_type, event_data, created_at)
        VALUES ($1, $2, '{}', NOW())
      `, [auditId, eventType])

      return NextResponse.json({ success: true })
    } catch (error: any) {
      if (error.code === '23505') {
        return NextResponse.json({ success: true, message: 'Already tracked' })
      }
      throw error
    }
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
