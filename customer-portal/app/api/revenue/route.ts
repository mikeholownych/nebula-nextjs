import { NextResponse } from 'next/server'
import { getPipelineValue, getRevenueBySource, getLeadToCustomerFunnel, getMonthlyRevenueTrend } from '@/app/lib/revenue-forecasting'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30')
  const months = parseInt(searchParams.get('months') || '6')

  try {
    const [pipeline, revenueBySource, funnel, trend] = await Promise.all([
      getPipelineValue(days),
      getRevenueBySource(days),
      getLeadToCustomerFunnel(days),
      getMonthlyRevenueTrend(months),
    ])

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      days,
      months,
      pipeline,
      revenueBySource,
      funnel,
      trend,
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
