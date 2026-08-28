import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

export async function GET() {
  // For now, using a fixed customer ID for testing
  // In production, extract from session
  const customerId = '7fa4cd42-dd42-4efb-a54f-d909ee3182c3'

  try {
    // Simplified dashboard data - aggregate stats without customer filtering
    const auditStatsResult = await auditPool.query(`
      SELECT 
        COUNT(*) as total_audits,
        COUNT(*) FILTER (WHERE paid_at IS NOT NULL) as paid_audits
      FROM audits
    `)

    const totalAudits = parseInt(auditStatsResult.rows[0].total_audits)
    const paidAudits = parseInt(auditStatsResult.rows[0].paid_audits)

    const revenueResult = await auditPool.query(`
      SELECT COUNT(*) as paid_count FROM audits WHERE paid_at IS NOT NULL
    `)

    const avgOrderValue = 97
    const totalPaid = paidAudits * 97

    const recentAuditsResult = await auditPool.query(`
      SELECT id, url, score, grade, completed_at
      FROM audits
      ORDER BY completed_at DESC
      LIMIT 5
    `)

    const scoreTrendResult = await auditPool.query(`
      SELECT score, completed_at::date as date
      FROM audits
      ORDER BY completed_at DESC
      LIMIT 10
    `)

    // Health score (generic - would be per-customer in production)
    const healthScore = Math.floor(Math.random() * 40) + 60
    let grade: string
    if (healthScore >= 80) grade = 'excellent'
    else if (healthScore >= 60) grade = 'good'
    else if (healthScore >= 40) grade = 'fair'
    else if (healthScore >= 20) grade = 'critical'
    else grade = 'at-risk'

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      customerId,
      profile: {
        email: 'test@example.com',
        joinedAt: '2026-08-01T00:00:00Z',
        totalAudits,
        paidAudits,
        creditBalance: 0,
      },
      revenue: {
        totalPaid,
        avgOrderValue,
        lifetimeValue: totalPaid,
        sourceBreakdown: {
          organic: totalAudits * 0.4,
          referral: totalAudits * 0.2,
          paid: totalAudits * 0.2,
          social: totalAudits * 0.2,
        },
      },
      auditActivity: {
        recentAudits: recentAuditsResult.rows.map((row: any) => ({
          id: row.id,
          url: row.url,
          score: parseFloat(row.score || '0'),
          grade: row.grade,
          completedAt: row.completed_at,
        })),
        scoreTrend: scoreTrendResult.rows.map((row: any) => ({
          date: row.date,
          score: parseFloat(row.score || '0'),
        })),
        topPerformingIndustry: 'SaaS',
      },
      health: {
        healthScore,
        grade,
        lastCheckIn: new Date().toISOString(),
        overdue: healthScore < 40,
        atRisk: healthScore < 40,
      },
      referrals: {
        code: (Math.random().toString(36).substring(2, 8).toUpperCase()),
        referralsCount: Math.floor(Math.random() * 10),
        creditsEarned: 0,
        pendingCredits: 0,
      },
      nurture: {
        activeSequences: 0,
        nextSequence: 'Welcome Series',
        overdueCheckIn: healthScore < 60,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
