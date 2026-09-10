import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30')

  try {
    const totalResult = await auditPool.query(`
      SELECT COUNT(*) as total, AVG(score) as avg
      FROM audits
      WHERE completed_at > NOW() - INTERVAL '${days} days'
    `)

    const industryResult = await auditPool.query(`
      SELECT COUNT(DISTINCT source) as count
      FROM audits
      WHERE completed_at > NOW() - INTERVAL '${days} days'
      AND source IS NOT NULL
    `)

    const percentileResult = await auditPool.query(`
      SELECT
        COUNT(*) FILTER (WHERE score >= 90) as grade_a,
        COUNT(*) FILTER (WHERE score >= 75 AND score < 90) as grade_b,
        COUNT(*) FILTER (WHERE score >= 60 AND score < 75) as grade_c,
        COUNT(*) FILTER (WHERE score >= 45 AND score < 60) as grade_d,
        COUNT(*) FILTER (WHERE score < 45) as grade_f
      FROM audits
      WHERE completed_at > NOW() - INTERVAL '${days} days'
    `)

    const rows = percentileResult.rows[0]

    return NextResponse.json({
      totalAudits: parseInt(totalResult.rows[0].total),
      industries: parseInt(industryResult.rows[0].count),
      avgScore: parseFloat((totalResult.rows[0].avg || '0').toString().replace(/[^0-9.-]+/g, "")),
      percentileBreakdown: {
        A: parseInt(rows.grade_a),
        B: parseInt(rows.grade_b),
        C: parseInt(rows.grade_c),
        D: parseInt(rows.grade_d),
        F: parseInt(rows.grade_f),
      },
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
