import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

export const dynamic = 'force-dynamic'

interface BuildInfo {
  revision: string
  builtAt: string
  environment: string
}

function getBuildInfo(): BuildInfo {
  try {
    const filePath = join(process.cwd(), 'app/lib/build-info.json')
    if (existsSync(filePath)) {
      return JSON.parse(readFileSync(filePath, 'utf8'))
    }
  } catch {
    // fallback
  }
  return {
    revision: 'development',
    builtAt: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  }
}

export async function GET() {
  const info = getBuildInfo()
  return NextResponse.json(info, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'X-Nebula-Revision': info.revision,
    },
  })
}
