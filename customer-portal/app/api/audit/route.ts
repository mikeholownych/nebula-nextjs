import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

interface AuditResult {
  auditId: string
  url: string
  timestamp: string
  overallScore: number
  grade: string
  dimensions: {
    headline: { score: number; max: number; status: string; issue: string; fix: string }
    cta: { score: number; max: number; status: string; issue: string; fix: string }
    trust: { score: number; max: number; status: string; issue: string; fix: string }
    speed: { score: number; max: number; status: string; issue: string; fix: string }
    mobile: { score: number; max: number; status: string; issue: string; fix: string }
  }
  topLeaks: Array<{ rank: number; name: string; impact: string; monthlyCost: string }>
  monthlyWaste: string
  fixPackPrice: number
}

async function performAudit(url: string): Promise<AuditResult> {
  // Simulate audit analysis (in production, this would scrape and analyze the page)
  const auditId = randomUUID()
  const timestamp = new Date().toISOString()

  // Generate realistic scores based on common landing page issues
  const headlineScore = Math.floor(Math.random() * 4) + 3 // 3-6 range commonly
  const ctaScore = Math.floor(Math.random() * 4) + 2 // 2-5 range
  const trustScore = Math.floor(Math.random() * 5) + 3 // 3-7 range
  const speedScore = Math.floor(Math.random() * 3) + 5 // 5-7 range
  const mobileScore = Math.floor(Math.random() * 4) + 4 // 4-7 range

  const overallScore = Math.round(((headlineScore + ctaScore + trustScore + speedScore + mobileScore) / 5) * 10) / 10

  const getGrade = (score: number): string => {
    if (score >= 8) return 'A'
    if (score >= 6.5) return 'B'
    if (score >= 5) return 'C'
    if (score >= 3.5) return 'D'
    return 'F'
  }

  const getStatus = (score: number): string => {
    if (score >= 7) return 'good'
    if (score >= 5) return 'needs-work'
    return 'critical'
  }

  const result: AuditResult = {
    auditId,
    url,
    timestamp,
    overallScore,
    grade: getGrade(overallScore),
    dimensions: {
      headline: {
        score: headlineScore,
        max: 10,
        status: getStatus(headlineScore),
        issue: headlineScore < 7 ? 'Headline lacks clarity or emotional hook' : 'Clear and compelling',
        fix: headlineScore < 7 ? 'Rewrite with pain-first messaging targeting your ICP' : 'Keep current approach',
      },
      cta: {
        score: ctaScore,
        max: 10,
        status: getStatus(ctaScore),
        issue: ctaScore < 7 ? 'CTA button lacks contrast or urgency' : 'CTA visibility is strong',
        fix: ctaScore < 7 ? 'Add high-contrast color and action-oriented copy' : 'Maintain current design',
      },
      trust: {
        score: trustScore,
        max: 10,
        status: getStatus(trustScore),
        issue: trustScore < 7 ? 'Limited social proof above the fold' : 'Trust signals visible',
        fix: trustScore < 7 ? 'Add testimonials, logos, or metrics near top' : 'Keep proving credibility',
      },
      speed: {
        score: speedScore,
        max: 10,
        status: getStatus(speedScore),
        issue: speedScore < 7 ? 'Page load time exceeds 3 seconds' : 'Fast load time',
        fix: speedScore < 7 ? 'Optimize images, reduce scripts, add lazy loading' : 'Performance is solid',
      },
      mobile: {
        score: mobileScore,
        max: 10,
        status: getStatus(mobileScore),
        issue: mobileScore < 7 ? 'Mobile layout has friction points' : 'Mobile experience smooth',
        fix: mobileScore < 7 ? 'Increase button sizes, reduce form fields, improve spacing' : 'Mobile UX is optimized',
      },
    },
    topLeaks: [
      { rank: 1, name: 'Headline vague', impact: 'Visitors don\'t understand the offer in 3 seconds', monthlyCost: '$400-$800' },
      { rank: 2, name: 'CTA invisible', impact: 'Visitors miss the call to action entirely', monthlyCost: '$300-$600' },
      { rank: 3, name: 'Trust below fold', impact: 'Visitors scroll without seeing proof', monthlyCost: '$150-$300' },
    ],
    monthlyWaste: '$850-$1,700',
    fixPackPrice: 97,
  }

  // Store in database (here we're using a simple in-memory cache for demo)
  auditCache.set(auditId, result)

  return result
}

// Simple in-memory cache for audits (use Redis in production)
const auditCache = new Map<string, AuditResult>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Normalize URL
    let normalizedUrl = url.trim()
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = `https://${normalizedUrl}`
    }

    // Validate URL
    try {
      new URL(normalizedUrl)
    } catch {
      return NextResponse.json({ error: 'Please enter a valid URL' }, { status: 400 })
    }

    console.log('[Audit API] Processing audit for:', normalizedUrl)

    // Perform the audit
    const result = await performAudit(normalizedUrl)

    return NextResponse.json({
      success: true,
      auditId: result.auditId,
      redirectUrl: `/audit/results?id=${result.auditId}`,
    })
  } catch (error) {
    console.error('[Audit API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const auditId = searchParams.get('id')

  if (!auditId) {
    return NextResponse.json({ error: 'Audit ID required' }, { status: 400 })
  }

  const result = auditCache.get(auditId)

  if (!result) {
    return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
  }

  return NextResponse.json(result)
}
