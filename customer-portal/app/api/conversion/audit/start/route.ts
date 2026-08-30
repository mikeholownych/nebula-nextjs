import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { auditId, source, referrer, utm } = data

    if (!auditId) {
      return NextResponse.json(
        { error: 'auditId is required' },
        { status: 400 }
      )
    }

    try {
      await auditPool.query(`
        INSERT INTO audit_events (audit_id, event_type, event_data, created_at)
        VALUES ($1, $2, $3, NOW())
      `, [auditId, 'audit_started', JSON.stringify({ source, referrer, utm })])

      return NextResponse.json({ success: true })
    } catch (error: unknown) {
      if (error instanceof Error && (error as { code?: string }).code === '23505') {
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
