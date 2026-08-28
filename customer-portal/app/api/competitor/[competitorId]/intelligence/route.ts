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
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
