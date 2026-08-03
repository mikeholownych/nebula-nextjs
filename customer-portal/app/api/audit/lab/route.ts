import { NextRequest, NextResponse } from 'next/server'
import { assertPublicHttpUrl } from '@/app/lib/ssrf-guard'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'for', 'with', 'your', 'you', 'to', 'of',
  'in', 'on', 'at', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'it',
  'this', 'that', 'these', 'those', 'we', 'our', 'us', 'can', 'will', 'get',
  'how', 'why', 'what', 'when', 'who', 'does', 'do', 'not', 'no', 'more', 'most',
  'all', 'any', 'than', 'then', 'as', 'so', 'if', 'up', 'out', 'off', 'over',
  'into', 'just', 'very', 'really', 'free', 'now', 'today', 'try', 'start',
])

function tokenize(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/^['-]+|['-]+$/g, ''))
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
}

function unique(tokens: string[]): string[] {
  return [...new Set(tokens)]
}

const PASS_STANDARDS: Record<string, string> = {
  headline: 'H1 is 12–90 characters and names the buyer outcome, not a generic claim.',
  cta: 'One primary action button with action + outcome copy, visible above the fold.',
  above_fold: 'Offer and promise visible in the first viewport without scrolling.',
  social_proof: 'At least one proof marker near the first CTA: quote, metric, review count, or named logo.',
  mobile: 'Primary action visible and usable on a 375px viewport.',
  load_speed: 'LCP under 2.5s, CLS under 0.1, INP under 200ms on mobile.',
  ad_signals: 'At least one recognised ad-tracking artifact in the page source.',
  seo_foundations: 'Title tag, meta description, and a single descriptive H1 all present.',
  ai_readiness: 'Structured signals (JSON-LD, OG tags, clean hierarchy) that make the page citable by AI systems.',
}

function scoreToStatus(score: number | null): 'pass' | 'warning' | 'fail' | 'unknown' {
  if (score === null) return 'unknown'
  if (score >= 7) return 'pass'
  if (score >= 4) return 'warning'
  return 'fail'
}

type LabFinding = {
  key?: string
  issue?: string
  fix?: string
  evidence?: {
    measured?: unknown
    required?: unknown
    delta?: unknown
    selector?: unknown
  }
  note?: string
}

type LabResponse = {
  findings?: unknown
  dimensions?: Record<string, { score?: unknown }>
  page_h1?: unknown
  page_title?: unknown
  score?: unknown
  grade?: unknown
}

function extractFinding(f: LabFinding | null) {
  if (!f) return null
  return {
    issue: f.issue ?? '',
    fix: f.fix ?? '',
    measured: f.evidence?.measured ?? null,
    required: f.evidence?.required ?? null,
    delta: f.evidence?.delta ?? null,
    selector: f.evidence?.selector ?? null,
  }
}

/**
 * POST /api/audit/lab
 *
 * Full 9-signal component lab — runs the same audit engine as the free audit,
 * returns all signal dimensions with status, evidence, and pass standards.
 * Ad copy is optional and only affects the Message Match component.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, adCopy } = body as { url?: string; adCopy?: string }

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    let processedUrl = url.trim()
    if (!processedUrl.match(/^https?:\/\//i)) {
      processedUrl = 'https://' + processedUrl
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(processedUrl)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    try {
      await assertPublicHttpUrl(parsedUrl)
    } catch {
      return NextResponse.json({ error: 'URL must be a public HTTP(S) page' }, { status: 400 })
    }

    const upstream = await fetch(`${API_BASE}/audit/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: processedUrl }),
      signal: AbortSignal.timeout(120_000),
    })

    if (!upstream.ok) {
      return NextResponse.json({ error: 'Audit engine unavailable' }, { status: upstream.status })
    }

    const data = await upstream.json() as LabResponse
    const findings = Array.isArray(data.findings)
      ? data.findings.filter((f): f is LabFinding => Boolean(f && typeof f === 'object'))
      : []
    const dims = data.dimensions && typeof data.dimensions === 'object' ? data.dimensions : {}

    const findingByKey = (key: string) => findings.find((f) => f.key === key) ?? null
    const dimScore = (key: string): number | null => {
      const d = dims[key]
      return d && typeof d.score === 'number' ? d.score : null
    }

    // Build a component result for each signal
    function makeComponent(key: string) {
      const score = dimScore(key)
      const status = scoreToStatus(score)
      const finding = findingByKey(key)
      return {
        status,
        score,
        passStandard: PASS_STANDARDS[key] ?? '',
        finding: extractFinding(finding),
        note: finding?.note ?? null,
      }
    }

    // ── Message Match (ad copy overlap + headline engine) ─────────────────
    const headlineScore = dimScore('headline')
    const pageH1 = typeof data.page_h1 === 'string' ? data.page_h1.trim() : ''
    const pageTitle = typeof data.page_title === 'string' ? data.page_title.trim() : ''
    const pageText = `${pageH1} ${pageTitle}`.trim()

    let messageMatch: Record<string, unknown> = {
      status: scoreToStatus(headlineScore),
      passStandard: 'The page headline states the promise the visitor expects from the ad, within the first viewport.',
    }

    if (adCopy && typeof adCopy === 'string' && adCopy.trim()) {
      const adTerms = unique(tokenize(adCopy))
      const pageTerms = unique(tokenize(pageText))
      const shared = adTerms.filter((t) => pageTerms.includes(t))

      let status: string
      if (shared.length >= 2 && headlineScore !== null && headlineScore >= 7) status = 'pass'
      else if (shared.length >= 1 || (headlineScore !== null && headlineScore >= 7)) status = 'warning'
      else status = 'fail'

      messageMatch = {
        status,
        passStandard: 'The page headline repeats at least one meaningful promise term from the ad.',
        adTerms,
        pageTerms,
        sharedTerms: shared,
        pageH1,
        adCopyExcerpt: adCopy.trim().slice(0, 280),
      }
    } else if (!pageH1 && !pageTitle) {
      messageMatch = {
        status: 'unknown',
        passStandard: messageMatch.passStandard,
        note: 'No H1 or title text was extracted from the page source.',
      }
    }

    return NextResponse.json({
      url: processedUrl,
      score: data.score ?? null,
      grade: data.grade ?? null,
      components: {
        messageMatch,
        headline: makeComponent('headline'),
        cta: makeComponent('cta'),
        aboveFold: makeComponent('above_fold'),
        socialProof: makeComponent('social_proof'),
        mobile: makeComponent('mobile'),
        loadSpeed: makeComponent('load_speed'),
        adSignals: makeComponent('ad_signals'),
        seoFoundations: makeComponent('seo_foundations'),
        aiReadiness: makeComponent('ai_readiness'),
      },
    })
  } catch (err) {
    console.error('[component lab]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Component check failed' },
      { status: 500 }
    )
  }
}
