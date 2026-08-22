import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/app/lib/db'
import { randomBytes } from 'crypto'
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
      ...result.rows.map((row: any) => ({
        email: row.member_email,
        role: row.role,
        invitationStatus: row.invitation_status,
        invitedAt: row.invited_at?.toISOString() ?? null,
        joinedAt: row.joined_at?.toISOString() ?? null,
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
    const body = await request.json()
    const ownerEmail = auth.user.email
    const inviteEmail = (body.inviteEmail || '').trim().toLowerCase()
    const role = body.role || 'viewer'

    if (!ownerEmail || !inviteEmail) {
      return NextResponse.json({ error: 'ownerEmail and inviteEmail required' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    if (inviteEmail === ownerEmail) {
      return NextResponse.json({ error: 'Cannot invite yourself' }, { status: 400 })
    }

    if (!['editor', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Role must be editor or viewer' }, { status: 400 })
    }

    // Check for existing invitation
    const existing = await pool.query(
      `SELECT id, invitation_status FROM workspace_members
       WHERE workspace_email = $1 AND member_email = $2`,
      [ownerEmail, inviteEmail]
    )

    if (existing.rows.length > 0) {
      const status = existing.rows[0].invitation_status
      if (status === 'accepted') {
        return NextResponse.json({ error: 'This person is already a team member' }, { status: 409 })
      }
      if (status === 'pending') {
        return NextResponse.json({ error: 'Invitation already pending' }, { status: 409 })
      }
    }

    const inviteToken = randomBytes(32).toString('hex')

    await pool.query(
      `INSERT INTO workspace_members (workspace_email, member_email, role, invitation_status, invite_token)
       VALUES ($1, $2, $3, 'pending', $4)
       ON CONFLICT (workspace_email, member_email)
       DO UPDATE SET role = $3, invitation_status = 'pending', invite_token = $4, invited_at = now()`,
      [ownerEmail, inviteEmail, role, inviteToken]
    )

    // Send invite email via SendGrid if available
    const sendgridKey = process.env.SENDGRID_API_KEY
    if (sendgridKey && !sendgridKey.includes('placeholder')) {
      const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://nebulacomponents.com'
      const inviteUrl = `${baseUrl}/workspace?invite=${inviteToken}`

      try {
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sendgridKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: inviteEmail }] }],
            from: { email: 'noreply@nebulacomponents.com', name: 'Nebula Components' },
            subject: `You've been invited to a Nebula workspace`,
            content: [
              {
                type: 'text/plain',
                value: `${ownerEmail} invited you to their Nebula workspace as a ${role}.\n\nAccept the invitation: ${inviteUrl}\n\nThis link expires in 7 days.`,
              },
            ],
          }),
        })
      } catch {
        // Email is best-effort - the invite row is created regardless
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Invitation sent to ${inviteEmail}`,
      inviteToken,
    })
  } catch (err) {
    console.error('[Team] POST failed:', err)
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 })
  }
}
