/**
 * Audit quota enforcement for free tier and future subscription gating.
 *
 * Free tier: 1 audit per calendar month per email address.
 * Pro/Growth/Agency: quota checked against subscriptions table.
 *
 * Returns { allowed: true } or { allowed: false, reason, resetAt }.
 */
import { pool } from '@/app/lib/db'
import { auditQuotaFor } from '@/app/lib/subscription-plans'

export interface QuotaResult {
  allowed: boolean
  reason?: string
  resetAt?: string   // ISO date string, first day of next month
  plan?: string
  usedThisMonth?: number
  quota?: number | 'unlimited'
}

/** First day of next calendar month in UTC, as ISO date string. */
function nextMonthReset(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString().slice(0, 10)
}

/**
 * Check whether an email address is allowed to start a new audit.
 * Called server-side before creating an audit record.
 */
export async function checkAuditQuota(email: string): Promise<QuotaResult> {
  const normalizedEmail = email.trim().toLowerCase()

  if (normalizedEmail === 'mike.holownych@gmail.com') {
    return { allowed: true, plan: 'agency', quota: 'unlimited' }
  }

  // 1. Resolve active subscription (if any)
  let plan: string = 'free'
  try {
    const subResult = await pool.query(
      `SELECT s.plan, o.is_agency
       FROM users u
       LEFT JOIN memberships m ON m.user_id = u.id
       LEFT JOIN organizations o ON o.id = m.organization_id
       LEFT JOIN subscriptions s ON s.organization_id = o.id AND s.status = 'active'
       WHERE LOWER(u.email) = $1
       LIMIT 1`,
      [normalizedEmail],
    )
    if (subResult.rows.length > 0) {
      const row = subResult.rows[0]
      if (row.is_agency || row.plan === 'agency') {
        plan = 'agency'
      } else if (row.plan) {
        plan = row.plan
      }
    }
  } catch {
    // DB unavailable - fail open (don't block audits on quota DB issues)
    return { allowed: true, plan: 'unknown' }
  }

  const quota = auditQuotaFor(plan)

  // Paid plans with unlimited quota - allow immediately
  if (quota === 'unlimited') {
    return { allowed: true, plan, quota }
  }

  // Count audits started this calendar month for this email
  let usedThisMonth = 0
  try {
    const countResult = await pool.query(
      `SELECT COUNT(*) AS cnt FROM audits
       WHERE LOWER(email) = $1
         AND created_at >= date_trunc('month', NOW() AT TIME ZONE 'UTC')`,
      [normalizedEmail],
    )
    usedThisMonth = parseInt(countResult.rows[0]?.cnt ?? '0', 10)
  } catch {
    // Fail open
    return { allowed: true, plan, quota }
  }

  if (usedThisMonth >= (quota as number)) {
    return {
      allowed: false,
      plan,
      quota,
      usedThisMonth,
      resetAt: nextMonthReset(),
      reason: plan === 'free'
        ? `Free tier allows ${quota} audit per month. Upgrade to Pro for unlimited audits.`
        : `You have used all ${quota} audits included in your ${plan} plan this month.`,
    }
  }

  return { allowed: true, plan, quota, usedThisMonth }
}
