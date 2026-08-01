import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/app/lib/db'

/**
 * GET /api/workspace/preferences?email=...
 * PATCH /api/workspace/preferences  { email, preferences, timezone }
 */

export async function GET(request: NextRequest) {
  const email = (request.nextUrl.searchParams.get('email') || '').trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 })
  }

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
  try {
    const body = await request.json()
    const { email, preferences, timezone } = body as {
      email: string
      preferences?: Record<string, unknown>
      timezone?: string
    }

    if (!email) {
      return NextResponse.json({ error: 'email required' }, { status: 400 })
    }

    const prefs = preferences ?? { regressionAlerts: true, weeklyDigest: false }
    const tz = timezone ?? 'UTC'

    await pool.query(
      `INSERT INTO workspace_preferences (email, preferences, timezone, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (email) DO UPDATE SET
         preferences = $2,
         timezone = $3,
         updated_at = now()`,
      [email.trim().toLowerCase(), JSON.stringify(prefs), tz]
    )

    return NextResponse.json({ ok: true, preferences: prefs, timezone: tz })
  } catch (err) {
    console.error('[Preferences] PATCH failed:', err)
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
  }
}
