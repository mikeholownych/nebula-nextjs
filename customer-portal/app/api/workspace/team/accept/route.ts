import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/app/lib/db'

/**
 * POST /api/workspace/team/accept
 * Body: { token: string }
 * Accepts a team invitation
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const token = (body.token || '').trim()

    if (!token) {
      return NextResponse.json({ error: 'Invite token required' }, { status: 400 })
    }

    const result = await pool.query(
      `UPDATE workspace_members
       SET invitation_status = 'accepted', joined_at = now(), invite_token = NULL
       WHERE invite_token = $1 AND invitation_status = 'pending'
       RETURNING workspace_email, member_email, role`,
      [token]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      )
    }

    const { workspace_email, member_email, role } = result.rows[0]

    return NextResponse.json({
      ok: true,
      message: `Joined workspace as ${role}`,
      workspaceEmail: workspace_email,
      memberEmail: member_email,
      role,
    })
  } catch (err) {
    console.error('[Team] Accept failed:', err)
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 })
  }
}
