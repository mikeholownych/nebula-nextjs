import { NextResponse } from 'next/server'
import { getAuditInsights } from '@/app/lib/ai-insights'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ auditId: string }> }
) {
  const { auditId } = await params

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(auditId)) {
    return NextResponse.json(
      { error: 'Invalid audit ID format. Expected UUID.' },
      { status: 400 }
    )
  }

  try {
    const insights = await getAuditInsights(auditId)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ...insights,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: msg },
      { status: 404 }
    )
  }
}
