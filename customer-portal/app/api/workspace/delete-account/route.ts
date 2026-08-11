import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/app/lib/db'
import { requireWorkspaceUser } from '@/app/lib/workspace-auth'

/**
 * POST /api/workspace/delete-account
 * Body: { email: string }
 *
 * Soft-deletes the account (tombstone pattern):
 * 1. Records deletion request with 7-day purge window
 * 2. Returns confirmation - actual purge happens via weekly batch
 */

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response
  try {
    const email = auth.user.email

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    // Check if already requested
    const existing = await pool.query(
      `SELECT status, purge_after FROM account_deletions WHERE email = $1`,
      [email]
    )

    if (existing.rows.length > 0 && existing.rows[0].status === 'pending') {
      return NextResponse.json({
        message: 'Deletion already requested',
        purge_after: existing.rows[0].purge_after,
      })
    }

    // Record deletion request
    await pool.query(
      `INSERT INTO account_deletions (email, requested_at, purge_after, status)
       VALUES ($1, now(), now() + interval '7 days', 'pending')
       ON CONFLICT (email) DO UPDATE SET
         requested_at = now(),
         purge_after = now() + interval '7 days',
         status = 'pending'`,
      [email]
    )

    return NextResponse.json({
      message: 'Account deletion requested. Your data will be permanently removed in 7 days. You can cancel by logging back in within that window.',
      purge_after: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
  } catch (err) {
    console.error('[DeleteAccount] failed:', err)
    return NextResponse.json({ error: 'Deletion request failed' }, { status: 500 })
  }
}

/**
 * DELETE /api/workspace/delete-account?email=...
 * Cancel a pending deletion request (within 7-day window)
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response
  const email = auth.user.email

  try {
    const result = await pool.query(
      `UPDATE account_deletions SET status = 'cancelled'
       WHERE email = $1 AND status = 'pending'
       RETURNING email`,
      [email]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'No pending deletion found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Deletion cancelled. Your account is active.' })
  } catch (err) {
    console.error('[DeleteAccount] cancel failed:', err)
    return NextResponse.json({ error: 'Cancel failed' }, { status: 500 })
  }
}
