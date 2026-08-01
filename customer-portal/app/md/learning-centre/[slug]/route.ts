import { NextResponse } from 'next/server'
import learningCentreMd from '../../../../data/learning-centre-md.json'

/**
 * Markdown mirror route for Learning Centre articles.
 * Public URL: /learning-centre/<slug>.md (see next.config.ts rewrites)
 * Content is generated at build time from the same page.tsx + meta.json the
 * HTML pages render from (scripts/generate-learning-centre-md.mjs), so the
 * mirror cannot drift from the rendered article.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const content = (learningCentreMd as Record<string, string>)[slug]
  if (!content) {
    return new NextResponse('Not found', { status: 404 })
  }
  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
