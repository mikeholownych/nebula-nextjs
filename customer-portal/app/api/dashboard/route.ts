import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'
import { getCurrentUser } from '@/app/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const email = user.email
  const customerId = user.id

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

    // Get customer's health score
    const customerHealthResult = await auditPool.query(`
      SELECT 
        COALESCE(AVG(score), 0) as avg_score,
        MAX(completed_at) as last_audit
      FROM audits 
      WHERE customer_id = $1
    `, [customerId])

    const customerHealthScore = parseFloat(customerHealthResult.rows[0].avg_score || '0')
    const lastAudit = customerHealthResult.rows[0].last_audit as string | null

    // Convert to 0-100 scale (DB stores as 0-10)
    const healthScore = Math.round(customerHealthScore * 10)
    let healthGrade: string
    if (healthScore >= 80) healthGrade = 'excellent'
    else if (healthScore >= 60) healthGrade = 'good'
    else if (healthScore >= 40) healthGrade = 'fair'
    else if (healthScore >= 20) healthGrade = 'critical'
    else healthGrade = 'at-risk'

    // Calculate referral credits for this customer
    const referralCreditsResult = await auditPool.query(`
      SELECT COUNT(*) as credits_count FROM referral_redemptions 
      WHERE referrer_email = $1
    `, [email])

    const referralCredits = parseInt(referralCreditsResult.rows[0].credits_count || '0')

    const customerJoinedResult = await auditPool.query(`
      SELECT created_at FROM customers WHERE id = $1
    `, [customerId])
    const joinedAt = customerJoinedResult.rows[0]?.created_at || '2026-08-01T00:00:00Z'

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      customerId,
      profile: {
        email,
        joinedAt,
        totalAudits,
        paidAudits,
        creditBalance: referralCredits * 50,
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
        grade: healthGrade,
        lastCheckIn: lastAudit || new Date().toISOString(),
        overdue: healthScore < 40,
        atRisk: healthScore < 40,
      },
      referrals: {
        code: 'NEBULA26',  // Placeholder - should be customer-specific
        referralsCount: referralCredits,
        creditsEarned: referralCredits * 50,
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
