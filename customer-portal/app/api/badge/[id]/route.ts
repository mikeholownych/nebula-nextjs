import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

interface BadgeData {
  badge_id: string
  url: string
  serial_number: number
  before_score: number
  after_score: number
  earned_year: number
}

// Only numbers ever get interpolated into the SVG below — url/domain never
// render as text, so there's nothing here that needs HTML/XML escaping.
function passingBadgeSvg(data: BadgeData): string {
  const before = data.before_score.toFixed(1)
  const after = data.after_score.toFixed(1)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="86" viewBox="0 0 300 86" role="img" aria-label="Nebula verified: score improved from ${before} to ${after} out of 10, badge number ${data.serial_number}, ${data.earned_year}">
<rect width="300" height="86" rx="10" fill="#0a0a0a" stroke="#1f1f1f"/>
<text x="16" y="22" font-family="monospace" font-size="10" letter-spacing="1.5" fill="#9e9e9e">NEBULA VERIFIED</text>
<text x="16" y="52" font-family="monospace" font-size="22" font-weight="700" fill="#ffffff">${before}</text>
<text x="66" y="52" font-family="monospace" font-size="16" fill="#10b981">&#8594;</text>
<text x="90" y="52" font-family="monospace" font-size="22" font-weight="700" fill="#10b981">${after}</text>
<text x="16" y="72" font-family="monospace" font-size="10" fill="#7c7c7c">#${data.serial_number} &#183; ${data.earned_year}</text>
</svg>`
}

function unverifiedBadgeSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="86" viewBox="0 0 300 86" role="img" aria-label="Unverified badge placement">
<rect width="300" height="86" rx="10" fill="#0a0a0a" stroke="#1f1f1f"/>
<text x="16" y="22" font-family="monospace" font-size="10" letter-spacing="1.5" fill="#7c7c7c">NEBULA VERIFIED</text>
<text x="16" y="48" font-family="monospace" font-size="13" fill="#7c7c7c">Unverified placement</text>
<text x="16" y="66" font-family="monospace" font-size="10" fill="#7c7c7c">This badge isn't shown on the audited page.</text>
</svg>`
}

function svgResponse(svg: string, cacheSeconds: number) {
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': `public, max-age=${cacheSeconds}, stale-while-revalidate=86400`,
    },
  })
}

/**
 * GET /api/badge/[id] — embeddable before/after badge. Not a static image:
 * re-fetches the badge's underlying URL host on every render (short cache)
 * and checks it against the incoming Referer, so a page that never earned
 * the badge (or that regressed and lost the underlying data) can't just
 * copy-paste the embed code and claim it. This is Referer-based, so it
 * stops the common accidental case, not a determined screenshot-and-rehost —
 * see scripts/self_scan.py's weekly-cron precedent for the "recompute from
 * live state, don't freeze at grant time" pattern this reuses.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRe.test(id)) {
    return svgResponse(unverifiedBadgeSvg(), 60)
  }

  try {
    const upstream = await fetch(`${API_BASE}/audit/badge/${id}`, { next: { revalidate: 300 } })
    if (!upstream.ok) {
      return svgResponse(unverifiedBadgeSvg(), 60)
    }
    const data: BadgeData = await upstream.json()

    const referer = req.headers.get('referer')
    const refererHost = referer ? new URL(referer).hostname.replace(/^www\./, '') : null
    const badgeHost = new URL(data.url).hostname.replace(/^www\./, '')

    if (!refererHost || refererHost !== badgeHost) {
      return svgResponse(unverifiedBadgeSvg(), 300)
    }

    return svgResponse(passingBadgeSvg(data), 3600)
  } catch {
    return svgResponse(unverifiedBadgeSvg(), 60)
  }
}
