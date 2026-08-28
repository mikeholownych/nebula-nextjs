import { NextResponse } from 'next/server'
import { GROWTH_SCORE_THRESHOLDS, TRIGGER_DEFINITIONS } from '@/app/lib/growth-triggers'

export async function GET() {
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    thresholds: GROWTH_SCORE_THRESHOLDS,
    triggers: TRIGGER_DEFINITIONS,
  })
}
