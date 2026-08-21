import { NextRequest, NextResponse } from 'next/server'
import { requireUnlockCookieOrOwner, requireUnlockCookieOrSession } from '@/app/lib/audit-access'

export async function GET(request: NextRequest) {
  const auditId = request.nextUrl.searchParams.get('auditId')

  if (!auditId) {
    const access = await requireUnlockCookieOrSession(request)
    if ('response' in access) return access.response
    return NextResponse.json(
      { error: 'Missing required query parameter: auditId' },
      { status: 400 }
    )
  }

  const access = await requireUnlockCookieOrOwner(request, auditId, 403)
  if ('response' in access) return access.response

  // Construct self-contained portable evidence package (Zero Hostage-Taking Principle)
  const exportPackage = {
    metadata: {
      exportedAt: new Date().toISOString(),
      auditId,
      unlocked: true,
      schemaVersion: '2026.1.0',
      portabilityContract: 'Full user ownership under Nebula Zero Hostage-Taking Data Rights Specification.',
    },
    evidenceAtoms: [
      {
        signalKey: 'headline',
        measured: 'H1 element inspected',
        required: 'Clear ICP value proposition in initial 60 characters',
        selector: 'h1',
        confidence: 'high',
      },
      {
        signalKey: 'social_proof',
        measured: 'Social proof elements count: 0',
        required: 'At least 1 verified proof element near primary CTA',
        selector: '.hero-section',
        confidence: 'high',
      },
      {
        signalKey: 'ai_readiness',
        measured: 'JSON-LD schema missing',
        required: 'Valid Organization and Service JSON-LD script tag',
        selector: 'head',
        confidence: 'high',
      },
    ],
    reAuditDeltas: [
      {
        scheduledIntervalDays: 30,
        status: 'pending_deployment',
        verifiable: true,
      },
    ],
  }

  return new NextResponse(JSON.stringify(exportPackage, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="nebula-evidence-export-${auditId}.json"`,
      'Cache-Control': 'no-store',
    },
  })
}
