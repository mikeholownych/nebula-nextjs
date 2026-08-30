/**
 * Performance benchmark dashboard helpers
 * Aggregated, anonymized metrics by industry
 */


import { auditPool } from '@/app/lib/audit-db'

interface IndustryMetric {
  industry: string
  count: number
  avgScore: number
  avgLoadTime: number
  avgFcp: number
  avgLcp: number
  avgCls: number
  topSignals: Record<string, string[]>
  bottomSignals: Record<string, string[]>
}

/**
 * Get industry benchmarks
 */
export async function getIndustryBenchmarks(days: number = 30): Promise<IndustryMetric[]> {
  try {
    const result = await auditPool.query(`
      SELECT 
        COALESCE(a.source, 'unknown') as industry,
        COUNT(*) as count,
        AVG(a.score) as avg_score,
        AVG(a.load_time) as avg_load_time,
        AVG(a.fcp) as avg_fcp,
        AVG(a.lcp) as avg_lcp,
        AVG(a.cls) as avg_cls
      FROM audits a
      WHERE a.completed_at > NOW() - INTERVAL '${days} days'
      GROUP BY a.source
      ORDER BY count DESC
    `)

    return result.rows.map((row: any) => ({
      industry: row.industry,
      count: parseInt(row.count),
      avgScore: parseFloat(row.avg_score?.toFixed(1) || '0'),
      avgLoadTime: parseFloat(row.avg_load_time?.toFixed(1) || '0'),
      avgFcp: parseFloat(row.avg_fcp?.toFixed(1) || '0'),
      avgLcp: parseFloat(row.avg_lcp?.toFixed(1) || '0'),
      avgCls: parseFloat(row.avg_cls?.toFixed(4) || '0'),
      topSignals: {},
      bottomSignals: {},
    }))
  } catch (error) {
    console.error('[Benchmark] Error getIndustryBenchmarks:', error)
    throw error
  }
}

/**
Get top/bottom performing signals by industry
 */
export async function getSignalPerformance(industry: string, days: number = 30): Promise<any> {
  try {
    const result = await auditPool.query(`
      SELECT 
        f.signal_name,
        AVG(f.score) as avg_score,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE f.passed) as passed,
        COUNT(*) FILTER (WHERE NOT f.passed) as failed
      FROM audits a
      JOIN findings f ON a.id = f.audit_id
      WHERE a.completed_at > NOW() - INTERVAL '${days} days'
      AND a.source = $1
      GROUP BY f.signal_name
      ORDER BY avg_score ASC
    `, [industry])

    const signals = result.rows.map((row: any) => ({
      signal: row.signal_name,
      avgScore: parseFloat(row.avg_score?.toFixed(2) || '0'),
      total: parseInt(row.total),
      passed: parseInt(row.passed),
      failed: parseInt(row.failed),
      passRate: (parseInt(row.passed) / parseInt(row.total)) * 100,
    }))

    return {
      industry,
      signals,
    }
  } catch (error) {
    console.error('[Benchmark] Error getSignalPerformance:', error)
    throw error
  }
}

/**
 * Get overall benchmarks summary
 */
export async function getBenchmarksSummary(days: number = 30): Promise<{
  totalAudits: number
  industries: number
  avgScore: number
  trends: any[]
  percentileBreakdown: any
}> {
  try {
    const totalResult = await auditPool.query(`
      SELECT COUNT(*) as total, AVG(score) as avg
      FROM audits
      WHERE completed_at > NOW() - INTERVAL '${days} days'
    `)

    const industryResult = await auditPool.query(`
      SELECT COUNT(DISTINCT source) as count
      FROM audits
      WHERE completed_at > NOW() - INTERVAL '${days} days'
      AND source IS NOT NULL
    `)

    // Percentile breakdown
    const percentileResult = await auditPool.query(`
      SELECT
        COUNT(*) FILTER (WHERE score >= 90) as grade_a,
        COUNT(*) FILTER (WHERE score >= 75 AND score < 90) as grade_b,
        COUNT(*) FILTER (WHERE score >= 60 AND score < 75) as grade_c,
        COUNT(*) FILTER (WHERE score >= 45 AND score < 60) as grade_d,
        COUNT(*) FILTER (WHERE score < 45) as grade_f
      FROM audits
      WHERE completed_at > NOW() - INTERVAL '${days} days'
    `)

    const rows = percentileResult.rows[0]

    return {
      totalAudits: parseInt(totalResult.rows[0].total),
      industries: parseInt(industryResult.rows[0].count),
      avgScore: parseFloat(totalResult.rows[0].avg?.toFixed(1) || '0'),
      trends: [],
      percentileBreakdown: {
        A: parseInt(rows.grade_a),
        B: parseInt(rows.grade_b),
        C: parseInt(rows.grade_c),
        D: parseInt(rows.grade_d),
        F: parseInt(rows.grade_f),
      },
    }
  } catch (error) {
    console.error('[Benchmark] Error getBenchmarksSummary:', error)
    throw error
  }
}

/**
 * Get industry comparison
 */
export async function getIndustryComparison(industries: string[], days: number = 30): Promise<any> {
  try {
    const result = await auditPool.query(`
      SELECT 
        a.source as industry,
        COUNT(*) as count,
        AVG(a.score) as avg_score,
        AVG(a.load_time) as avg_load_time,
        AVG(a.cls) as avg_cls
      FROM audits a
      WHERE a.completed_at > NOW() - INTERVAL '${days} days'
      AND a.source = ANY($1)
      GROUP BY a.source
      ORDER BY avg_score DESC
    `, [industries])

    return result.rows.map((row: any) => ({
      industry: row.industry,
      count: parseInt(row.count),
      avgScore: parseFloat(row.avg_score?.toFixed(1) || '0'),
      avgLoadTime: parseFloat(row.avg_load_time?.toFixed(1) || '0'),
      avgCls: parseFloat(row.avg_cls?.toFixed(4) || '0'),
    }))
  } catch (error) {
    console.error('[Benchmark] Error getIndustryComparison:', error)
    throw error
  }
}
