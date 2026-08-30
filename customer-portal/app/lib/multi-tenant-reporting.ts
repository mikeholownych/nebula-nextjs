/**
 * Multi-tenant audit reporting service
 * Aggregates audit data for agencies/enterprises managing multiple properties
 */


import { auditPool } from '@/app/lib/audit-db'

/**
 * Get audit summary for a tenant (agency/enterprise)
 */
export async function getTenantAuditSummary(
  tenantId: string,
  days: number = 30
): Promise<{
  tenantId: string
  totalAudits: number
  avgScore: number
  scoreDistribution: Record<string, number>
  topAudits: Array<{
    url: string
    score: number
    completedAt: string
    signalsPassed: number
    signalsTotal: number
  }>
}> {
  try {
    // Determine lookup field: use partner_id if tenantId looks like a partner domain
    const isEmailDomain = tenantId.includes('@') || tenantId.includes('.')
    const lookupField = isEmailDomain ? 'email' : 'partner_id'
    const lookupValue = isEmailDomain ? `%${tenantId}` : tenantId

    // Get total audits
    const totalResult = await auditPool.query(`
      SELECT COUNT(*) as count
      FROM audits
      WHERE ${lookupField} LIKE $1
      AND completed_at > NOW() - INTERVAL '${days} days'
    `, [lookupValue])

    const totalAudits = parseInt(totalResult.rows[0].count)

    // Get average score
    const scoreResult = await auditPool.query(`
      SELECT AVG(score) as avg
      FROM audits
      WHERE ${lookupField} LIKE $1
      AND completed_at > NOW() - INTERVAL '${days} days'
    `, [lookupValue])

    const avgScore = parseFloat(scoreResult.rows[0].avg?.toFixed(1) || '0')

    // Get score distribution
    const distResult = await auditPool.query(`
      SELECT 
        CASE 
          WHEN score >= 80 THEN 'A'
          WHEN score >= 60 THEN 'B'
          WHEN score >= 40 THEN 'C'
          WHEN score >= 20 THEN 'D'
          ELSE 'F'
        END as grade,
        COUNT(*) as count
      FROM audits
      WHERE ${lookupField} LIKE $1
      AND completed_at > NOW() - INTERVAL '${days} days'
      GROUP BY 
        CASE 
          WHEN score >= 80 THEN 'A'
          WHEN score >= 60 THEN 'B'
          WHEN score >= 40 THEN 'C'
          WHEN score >= 20 THEN 'D'
          ELSE 'F'
        END
    `, [lookupValue])

    const scoreDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 }
    distResult.rows.forEach((row: any) => {
      scoreDistribution[row.grade] = parseInt(row.count)
    })

    // Get top audits
    const topResult = await auditPool.query(`
      SELECT 
        url,
        score,
        completed_at,
        0 as signals_passed,
        9 as signals_total
      FROM audits
      WHERE ${lookupField} LIKE $1
      AND completed_at > NOW() - INTERVAL '${days} days'
      ORDER BY score DESC
      LIMIT 10
    `, [lookupValue])

    const topAudits = topResult.rows.map((row: any) => ({
      url: row.url,
      score: parseFloat(row.score?.toFixed(1) || '0'),
      completedAt: row.completed_at,
      signalsPassed: parseInt(row.signals_passed),
      signalsTotal: 9,
    }))

    return {
      tenantId,
      totalAudits,
      avgScore,
      scoreDistribution,
      topAudits,
    }
  } catch (error: any) {
    console.error('[MultiTenant] Error getTenantAuditSummary:', error)
    throw error
  }
}

/**
 * Get tenant comparison across multiple properties
 */
export async function getTenantComparison(
  tenantId: string,
  days: number = 30
): Promise<{
  tenantId: string
  properties: Array<{
    url: string
    auditCount: number
    avgScore: number
    topSignals: Array<{
      signal: string
      passRate: number
    }>
  }>
}> {
  try {
    // Determine lookup field
    const isEmailDomain = tenantId.includes('@') || tenantId.includes('.')
    const lookupField = isEmailDomain ? 'email' : 'partner_id'
    const lookupValue = isEmailDomain ? `%${tenantId}` : tenantId

    const propertiesResult = await auditPool.query(`
      SELECT 
        url,
        COUNT(*) as audit_count,
        AVG(score) as avg_score
      FROM audits
      WHERE ${lookupField} LIKE $1
      AND completed_at > NOW() - INTERVAL '${days} days'
      GROUP BY url
      ORDER BY avg_score DESC
    `, [lookupValue])

    const properties = await Promise.all(
      propertiesResult.rows.map(async (row: any) => {
        const signalsResult = await auditPool.query(`
          SELECT 
            f.signal_name,
            COUNT(*) FILTER (WHERE f.passed) as passed,
            COUNT(*) as total
          FROM findings f
          JOIN audits a ON f.audit_id = a.id
          WHERE a.${lookupField} LIKE $1
          AND a.url = $2
          AND a.completed_at > NOW() - INTERVAL '${days} days'
          GROUP BY f.signal_name
        `, [lookupValue, row.url])

        const topSignals = signalsResult.rows.map((sig: any) => ({
          signal: sig.signal_name,
          passRate: parseFloat(((parseInt(sig.passed) / parseInt(sig.total)) * 100).toFixed(1)),
        })).sort((a: any, b: any) => b.passRate - a.passRate).slice(0, 5)

        return {
          url: row.url,
          auditCount: parseInt(row.audit_count),
          avgScore: parseFloat(row.avg_score?.toFixed(1) || '0'),
          topSignals,
        }
      })
    )

    return {
      tenantId,
      properties,
    }
  } catch (error: any) {
    console.error('[MultiTenant] Error getTenantComparison:', error)
    throw error
  }
}

/**
 * Get tenant's weak spots (most common failed signals)
 */
export async function getTenantWeakSpots(
  tenantId: string,
  days: number = 30
): Promise<{
  tenantId: string
  weakSpots: Array<{
    signal: string
    totalAudits: number
    failedCount: number
    passRate: number
    severity: 'critical' | 'high' | 'medium' | 'low'
  }>
}> {
  try {
    // Determine lookup field
    const isEmailDomain = tenantId.includes('@') || tenantId.includes('.')
    const lookupField = isEmailDomain ? 'email' : 'partner_id'
    const lookupValue = isEmailDomain ? `%${tenantId}` : tenantId

    const result = await auditPool.query(`
      SELECT 
        f.signal_name,
        COUNT(DISTINCT f.audit_id) as total_audits,
        COUNT(*) FILTER (WHERE NOT f.passed) as failed_count,
        COUNT(*) FILTER (WHERE f.passed) as passed_count
      FROM findings f
      JOIN audits a ON f.audit_id = a.id
      WHERE a.${lookupField} LIKE $1
      AND a.completed_at > NOW() - INTERVAL '${days} days'
      GROUP BY f.signal_name
      ORDER BY failed_count DESC
    `, [lookupValue])

    const weakSpots = result.rows.map((row: any) => {
      const total = parseInt(row.total_audits)
      const failed = parseInt(row.failed_count)
      const passRate = total > 0 ? (parseInt(row.passed_count) / total) * 100 : 0

      let severity: 'critical' | 'high' | 'medium' | 'low' = 'low'
      if (passRate < 30) severity = 'critical'
      else if (passRate < 50) severity = 'high'
      else if (passRate < 70) severity = 'medium'

      return {
        signal: row.signal_name,
        totalAudits: total,
        failedCount: failed,
        passRate: parseFloat(passRate.toFixed(1)),
        severity,
      }
    })

    return {
      tenantId,
      weakSpots,
    }
  } catch (error: any) {
    console.error('[MultiTenant] Error getTenantWeakSpots:', error)
    throw error
  }
}
