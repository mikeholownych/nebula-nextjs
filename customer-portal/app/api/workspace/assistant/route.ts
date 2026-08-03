import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/app/lib/workspace-auth'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

/**
 * POST /api/workspace/assistant
 * Body: { email: string, question: string, auditIds: string[] }
 *
 * Fetches audit details, builds context, calls the platform API assistant
 * endpoint (which proxies to OpenRouter/Claude). Falls back to a structured
 * extractive summary grouped by signal category when the LLM is unavailable.
 */

interface Finding {
  key: string
  label: string
  impact: number
  effort?: number
  issue?: string
  fix?: string
}

interface AuditDetail {
  audit_id: string
  url: string
  status: string
  score: number
  grade: string
  findings: Finding[]
}

async function fetchAuditDetail(id: string): Promise<AuditDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/audit/${id}`, {
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

const SIGNAL_CATEGORIES: Record<string, string> = {
  headline: 'Headline & Copy',
  cta: 'CTA Strength',
  above_fold: 'Above the Fold',
  social_proof: 'Trust & Social Proof',
  mobile: 'Mobile Experience',
  load_speed: 'Page Speed',
  ad_signals: 'Ad-to-Page Alignment',
  seo_foundations: 'SEO Foundations',
  ai_readiness: 'AI Readiness',
}

function buildFallbackAnswer(
  email: string,
  question: string,
  audits: (AuditDetail | null)[]
): string {
  const valid = audits.filter((a): a is AuditDetail => a !== null)
  if (valid.length === 0) {
    return `No audit data is available yet for ${email}. Run a free audit at nebulacomponents.com/audit to get data-grounded answers.`
  }

  const questionLower = question.toLowerCase()

  // Deterministic answers for common questions
  const allFindings = valid.flatMap((a) =>
    (a.findings || []).map((f) => ({ ...f, url: a.url, score: a.score }))
  )

  if (questionLower.includes('most impact') || questionLower.includes('work on first') || questionLower.includes('work on today')) {
    const sorted = [...allFindings].sort((a, b) => b.impact - a.impact)
    const top = sorted.slice(0, 3)
    if (top.length === 0) return 'All signals are passing — no critical findings to prioritize.'
    const lines = ['**Highest-impact fixes** (sorted by severity):\n']
    for (const f of top) {
      lines.push(`1. **${f.label}** (impact: ${f.impact}/10) — ${f.url}`)
      if (f.issue) lines.push(`   Problem: ${f.issue}`)
      if (f.fix) lines.push(`   Fix: ${f.fix}`)
    }
    lines.push('\nStart with #1 — it has the highest measured impact on your conversion score.')
    return lines.join('\n')
  }

  if (questionLower.includes('score drop') || questionLower.includes('why did')) {
    if (valid.length >= 2) {
      const [latest, prev] = valid
      const delta = latest.score - prev.score
      if (delta < 0) {
        const newIssues = latest.findings.filter(
          (f) => !prev.findings.some((pf) => pf.key === f.key)
        )
        const lines = [`Your score dropped from ${prev.score.toFixed(1)} to ${latest.score.toFixed(1)} (${delta.toFixed(1)} pts).\n`]
        if (newIssues.length > 0) {
          lines.push('**New issues detected:**')
          for (const f of newIssues) {
            lines.push(`• ${f.label}: ${f.issue || 'Signal now failing'}`)
          }
        } else {
          lines.push('No new failing signals — existing issues may have worsened. Compare the full reports for detail.')
        }
        return lines.join('\n')
      }
    }
  }

  if (questionLower.includes('cta')) {
    const ctaFindings = allFindings.filter((f) => f.key === 'cta')
    if (ctaFindings.length === 0) return 'No CTA issues found across your audited pages — this signal is passing.'
    const lines = ['**CTA issues across your pages:**\n']
    for (const f of ctaFindings) {
      lines.push(`• ${f.url}: ${f.issue || 'CTA signal failing'}`)
      if (f.fix) lines.push(`  → ${f.fix}`)
    }
    return lines.join('\n')
  }

  // General fallback: group by signal category
  const grouped = new Map<string, typeof allFindings>()
  for (const f of allFindings) {
    const cat = SIGNAL_CATEGORIES[f.key] || 'Other'
    const arr = grouped.get(cat) || []
    arr.push(f)
    grouped.set(cat, arr)
  }

  const lines: string[] = [`Based on ${valid.length} audit${valid.length > 1 ? 's' : ''} for ${email}:\n`]
  const sortedGroups = [...grouped.entries()].sort((a, b) => {
    const maxA = Math.max(...a[1].map((f) => f.impact))
    const maxB = Math.max(...b[1].map((f) => f.impact))
    return maxB - maxA
  })

  for (const [category, findings] of sortedGroups) {
    const maxImpact = Math.max(...findings.map((f) => f.impact))
    lines.push(`**${category}** (severity: ${maxImpact}/10)`)
    for (const f of findings.slice(0, 2)) {
      lines.push(`  • ${f.issue || f.label}`)
    }
  }

  lines.push(`\nFor "${question}": focus on the highest-severity category above. Each fix moves your conversion score.`)
  return lines.join('\n')
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response
  try {
    const body = await request.json()
    const { question, auditIds } = body as {
      question: string
      auditIds: string[]
    }
    const email = auth.user.email

    if (!question) {
      return NextResponse.json({ error: 'question is required' }, { status: 400 })
    }

    const ids = (auditIds || []).slice(0, 5)
    const auditDetails = await Promise.all(ids.map((id) => fetchAuditDetail(id)))
    const validAudits = auditDetails.filter((a): a is AuditDetail => a !== null)

    const auditContext = validAudits
      .map((audit) => {
        const findingLines = audit.findings.map(
          (f) => `    - [${f.key}] ${f.label} (impact ${f.impact}/10): ${f.issue || 'Failing'} → Fix: ${f.fix || 'See report'}`
        )
        return [
          `URL: ${audit.url}`,
          `Score: ${audit.score}/10, Grade: ${audit.grade}`,
          `Findings:`,
          ...findingLines,
        ].join('\n')
      })
      .join('\n\n')

    // Call platform API assistant endpoint (OpenRouter/Claude)
    try {
      const platformRes = await fetch(`${API_BASE}/audit/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          question,
          audit_context: auditContext,
          has_audits: validAudits.length > 0,
        }),
        signal: AbortSignal.timeout(15000),
      })

      if (platformRes.ok) {
        const data = await platformRes.json()
        if (data.answer) {
          return NextResponse.json({ answer: data.answer })
        }
      }
    } catch {
      // Fall through to structured fallback
    }

    // Structured fallback: signal-grouped extractive summary
    const fallback = buildFallbackAnswer(email, question, auditDetails)
    return NextResponse.json({ answer: fallback })
  } catch (error) {
    console.error('Assistant route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
