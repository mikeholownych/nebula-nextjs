import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const auditId = searchParams.get('auditId')

  if (!auditId) {
    return NextResponse.json(
      { error: 'auditId is required' },
      { status: 400 }
    )
  }

  try {
    const auditResult = await auditPool.query(`
      SELECT 
        a.id as audit_id,
        a.url,
        a.score,
        a.grade,
        a.completed_at,
        a.created_at,
        array_agg(DISTINCT f.signal_name) as signals_tested,
        array_agg(DISTINCT CASE WHEN f.passed THEN f.signal_name END) as signals_passed,
        array_agg(DISTINCT CASE WHEN NOT f.passed THEN f.signal_name END) as signals_failed
      FROM audits a
      LEFT JOIN findings f ON a.id = f.audit_id
      WHERE a.id = $1
      GROUP BY a.id
    `, [auditId])

    if (auditResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      )
    }

    const audit = auditResult.rows[0]
    
    const findingsResult = await auditPool.query(`
      SELECT 
        signal_name,
        score,
        passed,
        issue,
        evidence,
        severity
      FROM findings
      WHERE audit_id = $1
      ORDER BY 
        CASE WHEN passed THEN 1 ELSE 0 END,
        score ASC
      LIMIT 10
    `, [auditId])

    return NextResponse.json({
      audit: {
        id: audit.audit_id,
        url: audit.url,
        score: audit.score,
        grade: audit.grade,
        completedAt: audit.completed_at,
        totalSignals: audit.signals_tested?.length || 0,
        passedSignals: audit.signals_passed?.length || 0,
        failedSignals: audit.signals_failed?.length || 0,
      },
      findings: findingsResult.rows.map((row: any) => ({
        signal: row.signal_name,
        score: row.score,
        passed: row.passed,
        issue: row.issue,
        evidence: row.evidence,
        severity: row.severity,
      })),
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
