'use client'

import { useEffect, useState } from 'react'

interface TeamMember {
  email: string
  role: string
  joinedAt: string
}

interface TeamData {
  email: string
  members: TeamMember[]
  inviteStatus: string
}

interface TeamViewProps {
  email: string
}

export default function TeamView({ email }: TeamViewProps) {
  const [teamData, setTeamData] = useState<TeamData | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteMsg, setInviteMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!email) return
    setLoading(true)
    fetch(`/api/team?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((d) => setTeamData(d))
      .catch(() => setTeamData(null))
      .finally(() => setLoading(false))
  }, [email])

  const sendInvite = () => {
    setInviteMsg('Team invites coming soon — magic link auth required')
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Current team members */}
      <section>
        <h2 className="text-xl font-bold mb-4">Team Members</h2>
        {loading ? (
          <p className="text-fg-muted text-sm">Loading…</p>
        ) : (
          <div className="bg-bg-elevated border border-border rounded-lg divide-y divide-border">
            {(teamData?.members ?? [{ email, role: 'owner', joinedAt: new Date().toISOString() }]).map(
              (m) => (
                <div key={m.email} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-sm font-medium text-fg">{m.email}</p>
                    <p className="text-xs text-fg-dim mt-0.5">
                      Joined {new Date(m.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-accent-dim text-accent border border-accent/20">
                    {m.role}
                  </span>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* Invite section */}
      <section>
        <h2 className="text-xl font-bold mb-1">Invite Team Member</h2>
        <p className="text-sm text-fg-muted mb-4">
          Add collaborators to your workspace — they&apos;ll get read-only or editor access.
        </p>
        <div className="bg-bg-elevated border border-border rounded-lg p-5 space-y-3">
          <div className="flex gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => {
                setInviteEmail(e.target.value)
                setInviteMsg(null)
              }}
              placeholder="colleague@company.com"
              className="flex-1 rounded-lg border border-border bg-bg-panel px-4 py-2.5 text-sm text-fg placeholder-fg-dim focus:border-accent focus:outline-none"
            />
            <button
              onClick={sendInvite}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-bg hover:bg-accent-light transition-colors whitespace-nowrap"
            >
              Send invite
            </button>
          </div>
          {inviteMsg && (
            <p className="text-sm text-signal-fail flex items-center gap-2">
              <span>⏳</span> {inviteMsg}
            </p>
          )}
        </div>
      </section>

      {/* Client Portal section */}
      <section>
        <h2 className="text-xl font-bold mb-1">Client Portal</h2>
        <p className="text-sm text-fg-muted mb-4">
          Share read-only audit reports with clients or stakeholders.
        </p>
        <div className="bg-bg-elevated border border-border rounded-lg p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔗</span>
            <div>
              <p className="text-sm font-medium text-fg mb-1">Shareable report links</p>
              <p className="text-sm text-fg-muted">
                Shareable read-only report links are available from the{' '}
                <span className="text-accent font-medium">Reports</span> tab. Each link
                gives your client a branded view of audit findings without workspace access.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section>
        <h2 className="text-xl font-bold mb-4">Roles</h2>
        <div className="grid gap-3">
          {[
            {
              role: 'Owner',
              icon: '👑',
              desc: 'Full access — manage workspace, billing, team members, and all audits.',
            },
            {
              role: 'Editor',
              icon: '✏️',
              desc: 'Can run audits and manage recommendations, but cannot change billing or team settings.',
            },
            {
              role: 'Viewer',
              icon: '👁️',
              desc: 'Read-only access to reports and audit results. Ideal for clients or stakeholders.',
            },
          ].map(({ role, icon, desc }) => (
            <div
              key={role}
              className="bg-bg-elevated border border-border rounded-lg px-5 py-4 flex items-start gap-3"
            >
              <span className="text-xl">{icon}</span>
              <div>
                <p className="text-sm font-semibold text-fg">{role}</p>
                <p className="text-sm text-fg-muted mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
