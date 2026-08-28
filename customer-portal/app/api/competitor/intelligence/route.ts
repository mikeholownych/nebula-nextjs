import { NextResponse } from 'next/server'
import { getCompetitorDashboardOverview } from '@/app/lib/competitor-intelligence'

export async function GET() {
  try {
    const overview = await getCompetitorDashboardOverview()

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ...overview,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
