import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/workspace/assistant
 * Body: { email: string, question: string, auditIds: string[] }
 *
 * Fetches up to 5 audits, builds context, calls AWS Bedrock via the
 * platform API /workspace/assistant endpoint (Python/anthropic SDK).
 */

interface Finding {
  key: string
  label: string
  impact: number
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
    const res = await fetch(`http://127.0.0.1:8001/audit/${id}`, {
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

function buildFallbackAnswer(
  email: string,
  question: string,
  audits: (AuditDetail | null)[]
): string {
  const valid = audits.filter((a): a is AuditDetail => a !== null)
  if (valid.length === 0) {
    return `No audit data is available yet for ${email}. Run a free audit at nebulacomponents.shop/audit to get data-grounded answers.`
  }

  const lines: string[] = [
    `Here is a summary of your audit data for ${email} (AI analysis temporarily unavailable):\n`,
  ]

  for (const audit of valid) {
    lines.push(`**${audit.url}** — Score: ${audit.score}/10, Grade: ${audit.grade}`)
    const top = audit.findings.slice(0, 3)
    for (const f of top) {
      lines.push(`  • ${f.label}: ${f.issue || 'No detail available'}`)
    }
  }

  lines.push(`\nFor "${question}": Review the findings above. Focus on the highest-impact issues listed first.`)
  return lines.join('\n')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, question, auditIds } = body as {
      email: string
      question: string
      auditIds: string[]
    }

    if (!email || !question) {
      return NextResponse.json({ error: 'email and question are required' }, { status: 400 })
    }

    // Fetch up to 5 most recent audits
    const ids = (auditIds || []).slice(0, 5)
    const auditDetails = await Promise.all(ids.map((id) => fetchAuditDetail(id)))
    const validAudits = auditDetails.filter((a): a is AuditDetail => a !== null)

    // Build audit context string
    const auditContext = validAudits
      .map((audit) => {
        const top3 = audit.findings.slice(0, 3)
        const findingLines = top3.map(
          (f) => `    - ${f.label}: ${f.issue || 'No detail'}`
        )
        return [
          `URL: ${audit.url}`,
          `Score: ${audit.score}/10, Grade: ${audit.grade}`,
          `Top findings:`,
          ...findingLines,
        ].join('\n')
      })
      .join('\n\n')

    // Try Bedrock via platform API
    try {
      const platformRes = await fetch('http://127.0.0.1:8001/workspace/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          question,
          audit_context: auditContext,
          has_audits: validAudits.length > 0,
        }),
        signal: AbortSignal.timeout(30000),
      })

      if (platformRes.ok) {
        const data = await platformRes.json()
        return NextResponse.json({ answer: data.answer })
      }
    } catch {
      // Fall through to fallback
    }

    // Fallback: useful text summary when Bedrock unavailable
    const fallback = buildFallbackAnswer(email, question, auditDetails)
    return NextResponse.json({ answer: fallback })
  } catch (error) {
    console.error('Assistant route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
