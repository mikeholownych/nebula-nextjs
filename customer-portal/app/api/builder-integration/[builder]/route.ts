import { NextResponse } from 'next/server'
import { generateBuilderFix } from '@/app/lib/builder-integration'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ builder: string }> }
) {
  const { builder } = await params
  const body = await request.json()
  const { signal, fix } = body

  try {
    const result = await generateBuilderFix(builder, signal, fix)

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
