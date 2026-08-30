import { NextResponse } from 'next/server'
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
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
