import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/app/lib/db'
import { requireWorkspaceUser } from '@/app/lib/workspace-auth'

/**
 * GET /api/workspace/preferences?email=...
 * PATCH /api/workspace/preferences  { email, preferences, timezone }
 *
 * preferences JSONB may contain:
 *   regressionAlerts, weeklyDigest (notification booleans)
 *   avg_cpc, monthly_ad_spend (revenue estimation numbers)
 */

export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response
  const email = auth.user.email

  try {
    const result = await pool.query(
      'SELECT preferences, timezone FROM workspace_preferences WHERE email = $1',
      [email]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({
        preferences: { regressionAlerts: true, weeklyDigest: false },
        timezone: 'UTC',
      })
    }
    return NextResponse.json(result.rows[0])
  } catch (err) {
    console.error('[Preferences] GET failed:', err)
    return NextResponse.json({ error: 'Failed to load preferences' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response
  try {
    const body = await request.json()
    const { preferences, timezone } = body as {
      preferences?: Record<string, unknown>
      timezone?: string
    }

    // Merge incoming preferences with existing to preserve fields not in this patch
    let mergedPrefs: Record<string, unknown> = { regressionAlerts: true, weeklyDigest: false }
    try {
      const existing = await pool.query(
        'SELECT preferences FROM workspace_preferences WHERE email = $1',
        [auth.user.email]
      )
      if (existing.rows.length > 0 && existing.rows[0].preferences) {
        mergedPrefs = { ...mergedPrefs, ...existing.rows[0].preferences }
      }
    } catch {
      // Use defaults if lookup fails
    }

    if (preferences) {
      mergedPrefs = { ...mergedPrefs, ...preferences }
    }

    const tz = timezone ?? 'UTC'

    await pool.query(
      `INSERT INTO workspace_preferences (email, preferences, timezone, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (email) DO UPDATE SET
         preferences = $2,
         timezone = $3,
         updated_at = now()`,
      [auth.user.email, JSON.stringify(mergedPrefs), tz]
    )

    return NextResponse.json({ ok: true, preferences: mergedPrefs, timezone: tz })
  } catch (err) {
    console.error('[Preferences] PATCH failed:', err)
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
  }
}
