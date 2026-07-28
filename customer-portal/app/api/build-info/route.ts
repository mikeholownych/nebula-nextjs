import { NextResponse } from 'next/server'
import buildInfo from '@/app/lib/build-info.json'

export const dynamic = 'force-static'

export async function GET() {
  return NextResponse.json(buildInfo, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'X-Nebula-Revision': buildInfo.revision,
    },
  })
}
