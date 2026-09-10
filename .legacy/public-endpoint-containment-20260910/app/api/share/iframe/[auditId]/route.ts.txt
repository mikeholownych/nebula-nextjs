import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ auditId: string }> }
) {
  const { auditId } = await params

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
        a.created_at
      FROM audits a
      WHERE a.id = $1
    `, [auditId])

    if (auditResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      )
    }

    const audit = auditResult.rows[0]
    const score = parseFloat(audit.score) * 10

    return NextResponse.json({
      auditId: audit.audit_id,
      url: audit.url,
      score: score.toFixed(1),
      grade: audit.grade,
      html: `<iframe src="https://nebulacomponents.com/audit/${audit.audit_id}/results" width="100%" height="800" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
