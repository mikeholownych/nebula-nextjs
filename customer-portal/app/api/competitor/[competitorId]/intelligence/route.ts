import { NextResponse } from 'next/server'
import { getCompetitorIntelligence } from '@/app/lib/competitor-intelligence'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ competitorId: string }> }
) {
  const { competitorId } = await params

  try {
    const intelligence = await getCompetitorIntelligence(competitorId)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ...intelligence,
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
