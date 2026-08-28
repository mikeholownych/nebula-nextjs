import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'
import { getAuditTriggersForAudit } from '@/app/lib/growth-triggers'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ auditId: string }> }
) {
  const { auditId } = await params

  try {
    const result = await getAuditTriggersForAudit(auditId)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      auditId,
      ...result,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
