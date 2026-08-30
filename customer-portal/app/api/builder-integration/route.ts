import { NextResponse } from 'next/server'
import { getSupportedBuilders } from '@/app/lib/builder-integration'

export async function GET() {
  try {
    const result = await getSupportedBuilders()

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ...result,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    )
  }
}
