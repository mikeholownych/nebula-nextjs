import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/app/lib/db'
import { requireWorkspaceUser } from '@/app/lib/workspace-auth'

/**
 * GET /api/workspace/team?email=...
 * Returns team members (owner + invited members)
 *
 * POST /api/workspace/team
 * Body: { ownerEmail, inviteEmail, role }
 * Creates an invitation and returns the invite token
 */

export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response
  const email = auth.user.email

  try {
    const result = await pool.query(
      `SELECT member_email, role, invitation_status, invited_at, joined_at
       FROM workspace_members
       WHERE workspace_email = $1
       ORDER BY invited_at ASC`,
      [email]
    )

    const members = [
      {
        email,
        role: 'owner',
        invitationStatus: 'accepted',
        joinedAt: null,
      },
        ...result.rows.map((row: { member_email: string; role: string; invitation_status: string; invited_at: string | Date | null; joined_at: string | Date | null }) => ({
          email: row.member_email,
          role: row.role,
          invitationStatus: row.invitation_status,
          invitedAt: row.invited_at ? (row.invited_at instanceof Date ? row.invited_at.toISOString() : row.invited_at) : null,
          joinedAt: row.joined_at ? (row.joined_at instanceof Date ? row.joined_at.toISOString() : row.joined_at) : null,
        })),
    ]

    return NextResponse.json({ email, members })
  } catch (err) {
    console.error('[Team] GET failed:', err)
    return NextResponse.json({ error: 'Failed to load team' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response
  try {
    // SHARE FREEZE (2026-08-23, Mike decision): new workspace shares are
    // disabled until the new app.nebulacomponents.com workspace app ships.
    // Existing members keep access; pending invites can still be accepted.
    // Remove this guard at workspace cutover.
    return NextResponse.json(
      {
        error:
          'New team invites are temporarily paused while we upgrade the workspace. Existing members keep full access.',
      },
      { status: 503 }
    )
  } catch (err) {
    console.error('[Team] POST failed:', err)
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
  }
}
