/**
 * API Monetization & Developer Platform service
 * Rate-limited API access for external developers
 */


import { auditPool } from '@/app/lib/audit-db'

export const API_KEY_PREFIX = 'nc_api_'

/**
 * Validate API key
 */
export async function validateApiKey(apiKey: string): Promise<{
  valid: boolean
  keyId?: string
  userId?: string
  usageLimit: number
  currentUsage: number
}> {
  try {
    const result = await auditPool.query(`
      SELECT 
        id,
        user_id,
        usage_limit,
        usage_count
      FROM api_keys
      WHERE key_hash = $1
      AND revoked_at IS NULL
    `, [apiKey])

    if (result.rows.length === 0) {
      return { valid: false, usageLimit: 0, currentUsage: 0 }
    }

    const key = result.rows[0]
    const currentUsage = parseInt(key.usage_count || '0')
    const usageLimit = parseInt(key.usage_limit || '1000')

    return {
      valid: true,
      keyId: key.id,
      userId: key.user_id,
      usageLimit,
      currentUsage,
    }
  } catch (error: unknown) {
    console.error('[Monetization] Error validateApiKey:', error)
    return { valid: false, usageLimit: 0, currentUsage: 0 }
  }
}

/**
 * Increment usage count for API key
 */
export async function incrementApiKeyUsage(keyId: string): Promise<void> {
  try {
    await auditPool.query(`
      UPDATE api_keys
      SET usage_count = COALESCE(usage_count, 0) + 1
      WHERE id = $1
    `, [keyId])
  } catch (error: unknown) {
    console.error('[Monetization] Error incrementApiKeyUsage:', error)
    throw error
  }
}

/**
 * Get audit data by share token (public endpoint)
 */
export async function getAuditByShareToken(
  shareToken: string
): Promise<{
  auditId: string
  url: string
  score: number
  grade: string
  completedAt: string
  signalCount: number
  signals: Array<{
    key: string
    label: string
    passed: boolean
    score: number
    issue: string
    fix: string
  }>
}> {
  try {
    const auditResult = await auditPool.query(`
      SELECT 
        id,
        url,
        score,
        grade,
        completed_at
      FROM audits
      WHERE share_token = $1
    `, [shareToken])

    if (auditResult.rows.length === 0) {
      throw new Error('Audit not found')
    }

    const audit = auditResult.rows[0]

    const signalsResult = await auditPool.query(`
      SELECT 
        signal_key,
        label,
        passed,
        score,
        issue,
        fix
      FROM findings
      WHERE audit_id = $1
    `, [audit.id])

    return {
      auditId: audit.id,
      url: audit.url,
      score: parseFloat(audit.score?.toFixed(1) || '0'),
      grade: audit.grade,
      completedAt: audit.completed_at,
      signalCount: signalsResult.rows.length,
      signals: signalsResult.rows.map((row: { signal_key: string; label: string; passed: boolean; score: string | number; issue: string; fix: string }) => ({
        key: row.signal_key,
        label: row.label,
        passed: row.passed,
        score: typeof row.score === 'number' ? row.score.toFixed(2) : parseFloat(row.score),
        issue: row.issue,
        fix: row.fix,
      })),
    }
  } catch (error: unknown) {
    console.error('[Monetization] Error getAuditByShareToken:', error)
    throw error
  }
}

/**
 * Create new API key for a user
 */
export async function createApiKey(
  userId: string,
  name: string,
  usageLimit: number = 1000
): Promise<{
  keyId: string
  apiKey: string
  createdAt: string
}> {
  try {
    const key = `${API_KEY_PREFIX}${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`
    
    await auditPool.query(`
      INSERT INTO api_keys (user_id, key_hash, name, usage_limit)
      VALUES ($1, $2, $3, $4)
      RETURNING id, created_at
    `, [userId, key, name, usageLimit])

    return {
      keyId: key,
      apiKey: key,
      createdAt: new Date().toISOString(),
    }
  } catch (error: unknown) {
    console.error('[Monetization] Error createApiKey:', error)
    throw error
  }
}
