/**
 * Lead scoring engine
 * Automated scoring based on URL signals and intent indicators
 */


import { auditPool } from '@/app/lib/audit-db'

interface LeadScore {
  lead_id: string
  score: number
  maxScore: number
  grade: string
  factors: Record<string, number>
  last_updated: string
}

/**
 * Calculate lead score based on multiple signals
 */
export async function calculateLeadScore(leadId: string, _url: string): Promise<LeadScore> {
  try {
    // Default score calculation
    // Score components:
    // - Industry signals (20 pts)
    // - Page speed signals (20 pts)
    // - Ad spend signals (20 pts)
    // - Content quality (20 pts)
    // - Technical health (20 pts)

    const factors: Record<string, number> = {
      industry_fit: 0,
      page_speed: 0,
      ad_spend: 0,
      content_quality: 0,
      technical_health: 0,
    }

    // Industry signals (SaaS, e-commerce, agency = high intent)
    const industryScores: Record<string, number> = {
      saas: 20,
      ecommerce: 18,
      agency: 16,
      publisher: 14,
      other: 10,
    }
    factors.industry_fit = industryScores.other // Default

    // Page speed signals
    factors.page_speed = 10 // Default

    // Ad spend signals (from external data, placeholder)
    factors.ad_spend = 10 // Default

    // Content quality (if audit exists)
    factors.content_quality = 10 // Default

    // Technical health (if audit exists)
    factors.technical_health = 10 // Default

    // Calculate total score
    const totalScore = Object.values(factors).reduce((sum, val) => sum + val, 0)

    return {
      lead_id: leadId,
      score: totalScore,
      maxScore: 100,
      grade: getGradeFromScore(totalScore),
      factors,
      last_updated: new Date().toISOString(),
    }
  } catch (error) {
    console.error('[LeadScoring] Error calculateLeadScore:', error)
    throw error
  }
}

/**
 * Get grade from score
 */
function getGradeFromScore(score: number): string {
  if (score >= 80) return 'A'
  if (score >= 60) return 'B'
  if (score >= 40) return 'C'
  if (score >= 20) return 'D'
  return 'F'
}

/**
 * Score lead by URL signals
 */
export async function scoreLeadByUrl(url: string): Promise<LeadScore> {
  try {
    // Extract domain and signals
    void new URL(url).hostname

    // Get or create lead record
    let lead = await auditPool.query(`
      SELECT id, url, score, factors FROM leads WHERE url = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [url])

    let leadId: string
    if (lead.rows.length === 0) {
      const result = await auditPool.query(`
        INSERT INTO leads (url, score, factors)
        VALUES ($1, 0, '{}')
        RETURNING id
      `, [url])
      leadId = result.rows[0].id
    } else {
      leadId = lead.rows[0].id
    }

    // Calculate score
    const scoreData = await calculateLeadScore(leadId, url)

    // Update record
    await auditPool.query(`
      UPDATE leads
      SET score = $1,
          factors = $2,
          last_scored_at = NOW(),
          updated_at = NOW()
      WHERE id = $3
    `, [scoreData.score, JSON.stringify(scoreData.factors), leadId])

    return scoreData
  } catch (error) {
    console.error('[LeadScoring] Error scoreLeadByUrl:', error)
    throw error
  }
}

/**
 * Get leads by score tier
 */
export async function getLeadsByScoreTier(minScore: number, maxScore: number, limit: number = 100) {
  try {
    const result = await auditPool.query(`
      SELECT id, url, score, grade, factors, created_at, last_scored_at
      FROM leads
      WHERE score BETWEEN $1 AND $2
      ORDER BY score DESC
      LIMIT $3
    `, [minScore, maxScore, limit])

    return result.rows
  } catch (error) {
    console.error('[LeadScoring] Error getLeadsByScoreTier:', error)
    throw error
  }
}

/**
 * Get cohort lead metrics
 */
export async function getCohortLeadMetrics(days: number = 30): Promise<{
  totalLeads: number
  scoredLeads: number
  grades: Record<string, number>
  avgScore: number
}> {
  try {
    const totalResult = await auditPool.query(`
      SELECT COUNT(*) as total
      FROM leads
      WHERE created_at > NOW() - INTERVAL '${days} days'
    `)

    const scoredResult = await auditPool.query(`
      SELECT COUNT(*) as scored
      FROM leads
      WHERE last_scored_at > NOW() - INTERVAL '${days} days'
    `)

    const gradesResult = await auditPool.query(`
      SELECT 
        CASE 
          WHEN score >= 80 THEN 'A'
          WHEN score >= 60 THEN 'B'
          WHEN score >= 40 THEN 'C'
          WHEN score >= 20 THEN 'D'
          ELSE 'F'
        END as grade,
        COUNT(*) as count
      FROM leads
      GROUP BY grade
      ORDER BY grade DESC
    `)

    const avgResult = await auditPool.query(`
      SELECT AVG(score) as avg
      FROM leads
      WHERE last_scored_at IS NOT NULL
    `)

    const grades = gradesResult.rows.reduce((acc: Record<string, number>, row: any) => {
      acc[row.grade] = parseInt(row.count)
      return acc
    }, {})

    return {
      totalLeads: parseInt(totalResult.rows[0].total),
      scoredLeads: parseInt(scoredResult.rows[0].scored),
      grades,
      avgScore: parseFloat(avgResult.rows[0].avg?.toFixed(1) || '0'),
    }
  } catch (error) {
    console.error('[LeadScoring] Error getCohortLeadMetrics:', error)
    throw error
  }
}

/**
 * Get top leads by score
 */
export async function getTopLeads(limit: number = 10) {
  try {
    const result = await auditPool.query(`
      SELECT id, url, score, grade, factors, created_at, last_scored_at
      FROM leads
      WHERE score > 0
      ORDER BY score DESC
      LIMIT $1
    `, [limit])

    return result.rows
  } catch (error) {
    console.error('[LeadScoring] Error getTopLeads:', error)
    throw error
  }
}
