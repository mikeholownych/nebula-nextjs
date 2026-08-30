import { NextResponse } from 'next/server'
import { getSignalAnalysis } from '@/app/lib/ai-insights'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ auditId: string; signalKey: string }> }
) {
  const { auditId, signalKey } = await params

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(auditId)) {
    return NextResponse.json(
      { error: 'Invalid audit ID format. Expected UUID.' },
      { status: 400 }
    )
  }

  try {
    const analysis = await getSignalAnalysis(auditId, signalKey)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ...analysis,
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 404 }
    )
  }
}
