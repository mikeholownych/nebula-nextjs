import { NextResponse } from 'next/server'
import { getCompetitorComparison } from '@/app/lib/competitor-intelligence'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ competitorId: string }> }
) {
  const { competitorId } = await params
  const body = await request.json()
  const { compareWith } = body

  try {
    const ids = [competitorId, ...(compareWith || [])]
    const comparison = await getCompetitorComparison(ids)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      comparison,
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
