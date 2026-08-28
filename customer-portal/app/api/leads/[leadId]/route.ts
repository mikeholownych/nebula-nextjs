import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const { leadId } = await params

  try {
    const result = await auditPool.query(`
      SELECT id, url, score, grade, factors, created_at, last_scored_at
      FROM leads
      WHERE id = $1 OR url = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [leadId])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      lead: result.rows[0],
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
