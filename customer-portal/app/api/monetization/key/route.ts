import { NextResponse } from 'next/server'
import { validateApiKey, incrementApiKeyUsage } from '@/app/lib/monetization'

export async function GET(request: Request) {
  const apiKey = request.headers.get('x-api-key')

  if (!apiKey) {
    return NextResponse.json(
      { error: 'x-api-key header is required' },
      { status: 401 }
    )
  }

  const validation = await validateApiKey(apiKey)

  if (!validation.valid) {
    return NextResponse.json(
      { error: 'Invalid API key' },
      { status: 401 }
    )
  }

  await incrementApiKeyUsage(validation.keyId!)

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    valid: true,
    usage: {
      current: validation.currentUsage,
      limit: validation.usageLimit,
      remaining: validation.usageLimit - validation.currentUsage,
    },
  })
}
