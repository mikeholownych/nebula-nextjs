import { NextResponse } from 'next/server'
import { getSupportedBuilders, generateBuilderFix } from '@/app/lib/builder-integration'

export async function GET() {
  try {
    const result = await getSupportedBuilders()

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ...result,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
