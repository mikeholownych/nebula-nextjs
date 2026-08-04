import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/app/lib/workspace-auth'
import { pool } from '@/app/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response
  const { id } = await params

  const mp = await pool.query(
    `SELECT mp.*, s.stripe_subscription_id
     FROM monitored_pages mp
     JOIN subscriptions s ON s.id = mp.subscription_id
     WHERE mp.id = $1 AND LOWER(mp.email) = $2`,
    [parseInt(id, 10), auth.user.email],
  )
  if (!mp.rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const events = await pool.query(
    `SELECT id, audit_id, score, grade, score_delta, alert_sent, checked_at
     FROM monitoring_events WHERE monitored_page_id = $1
     ORDER BY checked_at DESC LIMIT 20`,
    [parseInt(id, 10)],
  )
  return NextResponse.json({ monitor: mp.rows[0], events: events.rows })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response
  const { id } = await params

  let body: { label?: string; interval_hours?: number; alert_threshold?: number; active?: boolean }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const updates: string[] = ['updated_at = NOW()']
  const values: (string | number | boolean)[] = []

  if (typeof body.label === 'string') { values.push(body.label); updates.push(`label = $${values.length}`) }
  if (typeof body.interval_hours === 'number') { values.push(Math.max(24, Math.min(168, body.interval_hours))); updates.push(`check_interval_hours = $${values.length}`) }
  if (typeof body.alert_threshold === 'number') { values.push(Math.max(1, Math.min(50, body.alert_threshold))); updates.push(`alert_threshold = $${values.length}`) }
  if (typeof body.active === 'boolean') { values.push(body.active); updates.push(`active = $${values.length}`) }

  if (updates.length === 1) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  values.push(parseInt(id, 10)); values.push(auth.user.email)
  const result = await pool.query(
    `UPDATE monitored_pages SET ${updates.join(', ')}
     WHERE id = $${values.length - 1} AND LOWER(email) = $${values.length}
     RETURNING id, url, label, active, check_interval_hours, alert_threshold`,
    values,
  )
  if (!result.rowCount) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ monitor: result.rows[0] })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response
  const { id } = await params

  const result = await pool.query(
    `UPDATE monitored_pages SET active = FALSE, updated_at = NOW()
     WHERE id = $1 AND LOWER(email) = $2 RETURNING id`,
    [parseInt(id, 10), auth.user.email],
  )
  if (!result.rowCount) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ deleted: true })
}
