import { NextRequest, NextResponse } from 'next/server'
import {
  queryCanonicalFunnel,
  queryFurthestMeaningfulState,
  queryDataQualitySLOs,
  queryIntegrityViolations,
} from '@/app/lib/funnel-ledger'

/**
 * GET /api/analytics/funnel-report
 * Returns full diagnostics: Canonical Funnels A-D, Furthest State Reached, Data-Quality SLOs, and Integrity Checks.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate') || undefined
  const endDate = searchParams.get('endDate') || undefined
  const deviceClass = searchParams.get('deviceClass') || undefined
  const utmSource = searchParams.get('utmSource') || undefined
  const includeSynthetic = searchParams.get('includeSynthetic') === 'true'

  try {
    // Funnel A: Audit Activation
    const funnelA = await queryCanonicalFunnel(
      [
        'landing_page_view',
        'audit_cta_exposed',
        'audit_cta_clicked',
        'audit_url_submitted',
        'audit_accepted',
        'audit_started',
        'audit_completed',
        'audit_result_viewed',
      ],
      { startDate, endDate, deviceClass, utmSource, includeSynthetic }
    )

    // Funnel B: Result Engagement
    const funnelB = await queryCanonicalFunnel(
      [
        'audit_result_viewed',
        'finding_expanded',
        'repair_sprint_exposed',
        'repair_sprint_clicked',
      ],
      { startDate, endDate, deviceClass, utmSource, includeSynthetic }
    )

    // Funnel C: Monetization
    const funnelC = await queryCanonicalFunnel(
      [
        'repair_sprint_exposed',
        'repair_sprint_clicked',
        'checkout_started',
        'purchase_completed',
      ],
      { startDate, endDate, deviceClass, utmSource, includeSynthetic }
    )

    // Funnel D: Full Commercial Journey
    const funnelD = await queryCanonicalFunnel(
      [
        'landing_page_view',
        'audit_url_submitted',
        'audit_completed',
        'audit_result_viewed',
        'repair_sprint_clicked',
        'checkout_started',
        'purchase_completed',
      ],
      { startDate, endDate, deviceClass, utmSource, includeSynthetic }
    )

    // Furthest State Reached & User Abandonment vs System Failure
    const furthestMeaningfulState = await queryFurthestMeaningfulState({ startDate, endDate, includeSynthetic })

    // Data-Quality SLOs
    const dataQuality = await queryDataQualitySLOs({ includeSynthetic })

    // Integrity Violations
    const integrityViolations = await queryIntegrityViolations()

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      filters: { startDate, endDate, deviceClass, utmSource, includeSynthetic },
      funnels: {
        funnelA_auditActivation: funnelA,
        funnelB_resultEngagement: funnelB,
        funnelC_monetization: funnelC,
        funnelD_fullCommercial: funnelD,
      },
      furthestMeaningfulState,
      dataQuality,
      integrityViolations: {
        count: integrityViolations.length,
        violations: integrityViolations,
      },
    })
  } catch (error) {
    console.error('[Funnel Report Error]:', error)
    return NextResponse.json(
      { error: 'Failed to generate funnel report' },
      { status: 500 }
    )
  }
}
