import { NextResponse } from 'next/server'
import { validateApiKey, incrementApiKeyUsage, getAuditByShareToken } from '@/app/lib/monetization'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const shareToken = searchParams.get('token')

  if (!shareToken) {
    return NextResponse.json(
      { error: 'token query parameter is required' },
      { status: 400 }
    )
  }

  try {
    const audit = await getAuditByShareToken(shareToken)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ...audit,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 404 }
    )
  }
}
