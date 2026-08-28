import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

export async function GET() {
  try {
    const result = await auditPool.query(`
      SELECT id, url, score, grade, factors, created_at, last_scored_at
      FROM leads
      WHERE score > 0
      ORDER BY score DESC
      LIMIT 10
    `)

    return NextResponse.json({
      topLeads: result.rows,
      count: result.rows.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
