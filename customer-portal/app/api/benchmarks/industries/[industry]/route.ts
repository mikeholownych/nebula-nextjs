import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ industry: string }> }
) {
  const { industry } = await params
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30')

  try {
    const result = await auditPool.query(`
      SELECT 
        f.signal_name,
        AVG(f.score) as avg_score,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE f.passed) as passed,
        COUNT(*) FILTER (WHERE NOT f.passed) as failed
      FROM audits a
      JOIN findings f ON a.id = f.audit_id
      WHERE a.completed_at > NOW() - INTERVAL '${days} days'
      AND a.source = $1
      GROUP BY f.signal_name
      ORDER BY avg_score ASC
    `, [industry])

    const signals = result.rows.map((row: any) => ({
      signal: row.signal_name,
      avgScore: parseFloat(row.avg_score?.toFixed(2) || '0'),
      total: parseInt(row.total),
      passed: parseInt(row.passed),
      failed: parseInt(row.failed),
      passRate: (parseInt(row.passed) / parseInt(row.total)) * 100,
    }))

    return NextResponse.json({
      industry,
      signals,
      days,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
