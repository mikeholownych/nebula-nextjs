import { NextResponse } from 'next/server'
import { getABTestResults } from '@/app/lib/ab-tests'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params

  try {
    const results = await getABTestResults(testId)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      metrics: {
        visitors: results.original.Visitors + results.variant.Visitors,
        conversions: results.original.Conversions + results.variant.Conversions,
        cr: ((results.original.Conversions + results.variant.Conversions) / (results.original.Visitors + results.variant.Visitors)) * 100,
        statisticalSignificance: results.statisticalSignificance,
        estimatedTime: results.estimatedLaunchTime,
      },
      variantPerformance: {
        original: results.original,
        variant: results.variant,
        improvement: results.winner === 'variant' ? 'up' : 'down',
      },
      winningVariant: results.winner,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
