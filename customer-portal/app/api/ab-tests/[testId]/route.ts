import { NextResponse } from 'next/server'
import { activateABTest, stopABTest, getABTestResults } from '@/app/lib/ab-tests'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params
  const body = await request.json()
  const { action } = body

  try {
    let result

    if (action === 'activate') {
      result = await activateABTest(testId)
    } else if (action === 'stop') {
      result = await stopABTest(testId)
    } else {
      return NextResponse.json(
        { error: 'Action must be "activate" or "stop"' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ...result,
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params

  try {
    const results = await getABTestResults(testId)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ...results,
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
