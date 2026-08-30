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

    const signals = result.rows.map((row: { signal_name: string; avg_score: string | number; total: string; passed: string; failed: string }) => ({
      signal: row.signal_name,
      avgScore: parseFloat(parseFloat(String(row.avg_score || '0')).toFixed(2)),
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
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
