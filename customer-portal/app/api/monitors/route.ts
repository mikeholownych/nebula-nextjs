// CRUD routes for subscriber page monitoring
// GET  /api/monitors          → list monitored pages for authenticated user
// POST /api/monitors          → add a page to monitor
// GET  /api/monitors/[id]     → get monitor + recent events
// PUT  /api/monitors/[id]     → update label / interval / threshold
// DELETE /api/monitors/[id]   → remove monitor

import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/app/lib/workspace-auth'
import { pool } from '@/app/lib/db'
import { assertPublicHttpUrl } from '@/app/lib/ssrf-guard'

const PLAN_URL_LIMITS: Record<string, number> = {
  pro: 3,
  growth: 10,
  agency: 999,
}

export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response

  try {
    const rows = await pool.query(
      `SELECT
         mp.id, mp.url, mp.label, mp.plan, mp.check_interval_hours,
         mp.last_checked_at, mp.last_score, mp.last_grade,
         mp.baseline_score, mp.baseline_grade, mp.alert_threshold, mp.active, mp.created_at,
         mp.last_audit_id,
         (SELECT score_delta FROM monitoring_events WHERE monitored_page_id = mp.id ORDER BY checked_at DESC LIMIT 1) AS last_delta
       FROM monitored_pages mp
       WHERE LOWER(mp.email) = $1 AND mp.active = TRUE
       ORDER BY mp.created_at DESC`,
      [auth.user.email],
    )
    return NextResponse.json({ monitors: rows.rows })
  } catch (err) {
    console.error('[monitors GET]', err)
    return NextResponse.json({ error: 'Failed to fetch monitors' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response

  let body: { url?: string; label?: string; interval_hours?: number; alert_threshold?: number }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const rawUrl = typeof body.url === 'string' ? body.url.trim() : null
  if (!rawUrl) return NextResponse.json({ error: 'url is required' }, { status: 400 })

  let parsed: URL
  try {
    parsed = new URL(rawUrl.match(/^https?:\/\//i) ? rawUrl : `https://${rawUrl}`)
    await assertPublicHttpUrl(parsed)
  } catch {
    return NextResponse.json({ error: 'URL must be a public HTTP/HTTPS address' }, { status: 400 })
  }
  const url = parsed.href

  // Resolve subscription directly by authenticated email. The current schema has no
  // organization_id on subscriptions; resource ownership is email-scoped here.
  const sub = await pool.query(
    `SELECT s.id, s.plan FROM subscriptions s
     WHERE LOWER(s.email) = $1 AND s.status = 'active' AND s.livemode = TRUE
     ORDER BY s.created_at DESC LIMIT 1`,
    [auth.user.email],
  )
  if (!sub.rows.length) {
    return NextResponse.json(
      { error: 'Page monitoring requires an active Pro, Growth, or Agency subscription.', code: 'NO_SUBSCRIPTION', upgradeUrl: '/pricing' },
      { status: 403 },
    )
  }
  const { id: subId, plan } = sub.rows[0]
  const limit = PLAN_URL_LIMITS[plan] ?? 0
  if (!limit) {
    return NextResponse.json({ error: 'Your plan does not include page monitoring.' }, { status: 403 })
  }

  const intervalHours = Math.max(24, Math.min(168, Number(body.interval_hours ?? 168)))
  const alertThreshold = Math.max(1, Math.min(50, Number(body.alert_threshold ?? 5)))

  try {
    // Serialize quota check + insert per subscription. A SELECT count followed by
    // a separate INSERT allows concurrent requests to exceed the plan limit.
    const result = await pool.query(
      `WITH lock AS (
         SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0))
       ), current_count AS (
         SELECT COUNT(*)::int AS cnt
         FROM monitored_pages
         WHERE subscription_id = $2 AND active = TRUE
       )
       INSERT INTO monitored_pages
         (subscription_id, email, url, label, plan, check_interval_hours, alert_threshold)
       SELECT $2, $3, $4, $5, $6, $7, $8
       FROM lock, current_count
       WHERE current_count.cnt < $9
       ON CONFLICT (subscription_id, url) DO UPDATE
         SET active = TRUE, label = EXCLUDED.label, updated_at = NOW()
       RETURNING id, url, label, plan, check_interval_hours, alert_threshold, active, created_at`,
      [String(subId), subId, auth.user.email, url, body.label ?? null, plan, intervalHours, alertThreshold, limit],
    )
    if (!result.rows.length) {
      return NextResponse.json(
        { error: `Your ${plan} plan supports up to ${limit} monitored pages. Upgrade to add more.`, code: 'MONITOR_LIMIT', upgradeUrl: '/pricing' },
        { status: 429 },
      )
    }
    return NextResponse.json({ monitor: result.rows[0] }, { status: 201 })
  } catch (err) {
    console.error('[monitors POST]', err)
    return NextResponse.json({ error: 'Failed to create monitor' }, { status: 500 })
  }
}
